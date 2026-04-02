import json
import re
import logging
from typing import Optional
from groq import AsyncGroq
from prompts import build_user_prompt, TEARDOWN_SYSTEM_PROMPT

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

MODEL = "llama-3.3-70b-versatile"
MAX_TOKENS = 4096
TEMPERATURE = 0.4        # Low enough for consistent structured output, high enough for sharp insight
MAX_RETRIES = 2          # Retry once on JSON parse failure before giving up
MIN_DESCRIPTION_WORDS = 10  # Gate on manual descriptions being too vague

# Required top-level keys — if any are missing, the response is considered malformed
REQUIRED_KEYS = {
    "product_name", "one_liner", "target_users", "pain_points_solved",
    "value_proposition", "monetization", "growth_mechanics",
    "competitive_landscape", "what_works", "what_is_missing",
    "red_flags", "pm_verdict"
}


# ---------------------------------------------------------------------------
# JSON extraction + validation
# ---------------------------------------------------------------------------

def extract_json(text: str) -> Optional[dict]:
    """
    Robustly extracts and parses a JSON object from LLM output.

    Handles:
    - Clean JSON responses (ideal)
    - JSON wrapped in ```json ... ``` markdown fences
    - JSON with a preamble/postamble (finds first { ... last })
    - Trailing commas (common LLM mistake) — stripped before parsing
    - Single-quoted strings — converted to double quotes
    """
    if not text or not text.strip():
        return None

    # Strip markdown fences if present
    text = re.sub(r'^```(?:json)?\s*', '', text.strip(), flags=re.IGNORECASE)
    text = re.sub(r'\s*```$', '', text.strip())

    # Find the outermost JSON object
    start = text.find('{')
    end = text.rfind('}')
    if start == -1 or end == -1 or end <= start:
        return None

    json_str = text[start:end + 1]

    # Remove JS-style comments (// ...) — LLMs sometimes add these
    json_str = re.sub(r'//[^\n]*', '', json_str)

    # Remove trailing commas before ] or } — extremely common LLM error
    json_str = re.sub(r',\s*([}\]])', r'\1', json_str)

    # Attempt direct parse
    try:
        return json.loads(json_str)
    except json.JSONDecodeError:
        pass

    # Last resort: replace single quotes with double quotes (crude but sometimes works)
    try:
        fixed = json_str.replace("'", '"')
        return json.loads(fixed)
    except json.JSONDecodeError:
        return None


def validate_teardown(data: dict) -> tuple[bool, list[str]]:
    """
    Validates that the parsed teardown has all required top-level keys
    and that critical nested fields are not empty.

    Returns:
        (is_valid: bool, missing_fields: list[str])
    """
    missing = []

    # Check top-level keys
    for key in REQUIRED_KEYS:
        if key not in data:
            missing.append(key)

    if missing:
        return False, missing

    # Spot-check critical nested fields
    checks = [
        ("target_users", "primary"),
        ("value_proposition", "core_promise"),
        ("pm_verdict", "overall_score"),
        ("pm_verdict", "kill_or_scale"),
        ("monetization", "current_model"),
    ]
    for parent, child in checks:
        if parent in data and isinstance(data[parent], dict):
            if not data[parent].get(child):
                missing.append(f"{parent}.{child}")

    # Check list fields are non-empty
    list_fields = ["pain_points_solved", "what_works", "what_is_missing", "red_flags"]
    for field in list_fields:
        if field in data:
            if not isinstance(data[field], list) or len(data[field]) == 0:
                missing.append(f"{field} (empty list)")

    if missing:
        return False, missing

    return True, []


def sanitize_teardown(data: dict) -> dict:
    """
    Post-processes the parsed teardown to enforce data integrity:
    - Clamps overall_score to [1, 10]
    - Ensures kill_or_scale is a valid enum value
    - Ensures severity fields are valid enum values
    - Strips [Assumed] flags from fields when input was a URL (shouldn't be there)
    - Truncates runaway string fields to prevent frontend overflow
    """
    # Clamp score
    if "pm_verdict" in data:
        verdict = data["pm_verdict"]
        try:
            score = float(verdict.get("overall_score", 5))
            verdict["overall_score"] = max(1.0, min(10.0, round(score, 1)))
        except (ValueError, TypeError):
            verdict["overall_score"] = 5.0

        valid_calls = {"Kill", "Pivot", "Hold", "Scale"}
        if verdict.get("kill_or_scale") not in valid_calls:
            verdict["kill_or_scale"] = "Hold"

    # Clamp severity fields
    valid_severity = {"Critical", "High", "Medium", "Low"}
    for section in ["pain_points_solved", "red_flags"]:
        if section in data and isinstance(data[section], list):
            for item in data[section]:
                if isinstance(item, dict) and "severity" in item:
                    if item["severity"] not in valid_severity:
                        item["severity"] = "Medium"

    # Clamp opportunity_size
    valid_opportunity = {"High", "Medium", "Low"}
    if "what_is_missing" in data and isinstance(data["what_is_missing"], list):
        for item in data["what_is_missing"]:
            if isinstance(item, dict):
                if item.get("opportunity_size") not in valid_opportunity:
                    item["opportunity_size"] = "Medium"
                valid_bop = {"Build", "Partner", "Acquire"}
                if item.get("build_or_partner") not in valid_bop:
                    item["build_or_partner"] = "Build"

    # Truncate runaway string fields (safety net for frontend)
    MAX_FIELD_LEN = 800
    def truncate_strings(obj):
        if isinstance(obj, dict):
            return {k: truncate_strings(v) for k, v in obj.items()}
        elif isinstance(obj, list):
            return [truncate_strings(i) for i in obj]
        elif isinstance(obj, str) and len(obj) > MAX_FIELD_LEN:
            return obj[:MAX_FIELD_LEN] + "…"
        return obj

    data = truncate_strings(data)
    return data


# ---------------------------------------------------------------------------
# Groq API call
# ---------------------------------------------------------------------------

async def call_groq(
    client: AsyncGroq,
    user_prompt: str,
    attempt: int = 1
) -> tuple[Optional[str], Optional[str]]:
    """
    Makes a single call to Groq's chat completion endpoint.

    Returns:
        (raw_text, error) — one will always be None
    """
    try:
        response = await client.chat.completions.create(
            model=MODEL,
            messages=[
                {"role": "system", "content": TEARDOWN_SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt}
            ],
            max_tokens=MAX_TOKENS,
            temperature=TEMPERATURE,
            stream=False,
        )

        raw = response.choices[0].message.content
        if not raw or not raw.strip():
            return None, "groq_empty_response"

        return raw.strip(), None

    except Exception as e:
        error_name = type(e).__name__
        logger.error(f"Groq API call failed (attempt {attempt}): {error_name}: {e}")
        return None, f"groq_{error_name.lower()}"


# ---------------------------------------------------------------------------
# Core analyzer
# ---------------------------------------------------------------------------

async def analyze_product(
    input_type: str,   # "url" | "description"
    content: str,      # scraped text or user description
    groq_api_key: str
) -> dict:
    """
    Core analysis pipeline:
    1. Validate input
    2. Build prompt
    3. Call Groq (with retry on JSON parse failure)
    4. Extract + validate + sanitize JSON
    5. Return structured result

    Returns a dict with:
        success         bool
        data            dict | None  — the full teardown
        error           str | None   — human-readable error
        debug           str | None   — internal error code
        model           str          — model used
        attempt         int          — which attempt succeeded
    """

    # --- Input validation ---
    if not content or not content.strip():
        return _error_response("Input content cannot be empty.", "empty_input")

    word_count = len(content.strip().split())
    if input_type == "description" and word_count < MIN_DESCRIPTION_WORDS:
        return _error_response(
            f"Your description is too short ({word_count} words). "
            "Please provide at least a few sentences describing the product "
            "so the analysis can be meaningful.",
            "description_too_short"
        )

    user_prompt = build_user_prompt(input_type=input_type, content=content)
    client = AsyncGroq(api_key=groq_api_key)

    last_debug = None

    # --- Retry loop ---
    for attempt in range(1, MAX_RETRIES + 1):
        logger.info(f"Groq call attempt {attempt}/{MAX_RETRIES}")

        raw_text, api_error = await call_groq(client, user_prompt, attempt)

        if api_error:
            last_debug = api_error
            if attempt < MAX_RETRIES:
                logger.warning(f"Attempt {attempt} API error: {api_error} — retrying...")
                continue
            break

        # --- JSON extraction ---
        parsed = extract_json(raw_text)
        if not parsed:
            last_debug = f"json_parse_failed_attempt_{attempt}"
            logger.warning(f"Attempt {attempt}: JSON extraction failed. Raw snippet: {raw_text[:300]}")
            if attempt < MAX_RETRIES:
                logger.info("Retrying with same prompt...")
                continue
            break

        # --- Validation ---
        is_valid, missing_fields = validate_teardown(parsed)
        if not is_valid:
            last_debug = f"validation_failed: missing={missing_fields}"
            logger.warning(f"Attempt {attempt}: Validation failed. Missing: {missing_fields}")
            if attempt < MAX_RETRIES:
                continue
            # On final attempt, return what we have with a warning
            logger.warning("Returning partially valid teardown after all retries.")
            sanitized = sanitize_teardown(parsed)
            return {
                "success": True,
                "data": sanitized,
                "error": None,
                "debug": f"partial_result: {last_debug}",
                "model": MODEL,
                "attempt": attempt,
                "partial": True
            }

        # --- Sanitize + return ---
        sanitized = sanitize_teardown(parsed)
        logger.info(f"Teardown complete on attempt {attempt}. Score: {sanitized.get('pm_verdict', {}).get('overall_score')}")

        return {
            "success": True,
            "data": sanitized,
            "error": None,
            "debug": None,
            "model": MODEL,
            "attempt": attempt,
            "partial": False
        }

    # --- All attempts failed ---
    return _error_response(
        "The AI model failed to generate a valid teardown after multiple attempts. "
        "This is usually a temporary issue. Please try again in a moment.",
        last_debug or "all_attempts_failed"
    )


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _error_response(human_error: str, debug: str) -> dict:
    return {
        "success": False,
        "data": None,
        "error": human_error,
        "debug": debug,
        "model": MODEL,
        "attempt": 0,
        "partial": False
    }