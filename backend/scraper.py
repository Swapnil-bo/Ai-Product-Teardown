import httpx
import re
from typing import Optional

JINA_BASE = "https://r.jina.ai/"
MAX_CONTENT_CHARS = 12000  # ~3000 tokens, keeps us well within Groq context limits
MIN_USEFUL_WORDS = 80       # minimum meaningful words after cleaning — below this = garbage content

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/122.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.5",
}

JINA_HEADERS = {
    **HEADERS,
    "X-Return-Format": "markdown",
    "X-Remove-Selector": "header,footer,nav,script,style",
    "X-Timeout": "15",
}


# ---------------------------------------------------------------------------
# Text cleaning + truncation
# ---------------------------------------------------------------------------

def clean_text(text: str) -> str:
    """
    Strips noise from scraped content:
    - Removes zero-width / invisible characters
    - Collapses 3+ newlines to 2
    - Collapses 3+ spaces to 2
    - Strips common cookie / GDPR banner patterns
    """
    # Remove zero-width and invisible chars
    text = re.sub(r'[\u200b\u200c\u200d\ufeff]', '', text)

    # Collapse 3+ newlines into 2
    text = re.sub(r'\n{3,}', '\n\n', text)

    # Collapse multiple spaces
    text = re.sub(r' {3,}', '  ', text)

    # Remove common cookie / GDPR noise
    noise_patterns = [
        r'(?i)we use cookies.*?\.(\s|$)',
        r'(?i)by (clicking|continuing|using).*?cookies.*?\.(\s|$)',
        r'(?i)accept (all )?cookies',
        r'(?i)privacy policy\s*\|\s*terms',
        r'(?i)this site uses cookies.*?\.(\s|$)',
    ]
    for pattern in noise_patterns:
        text = re.sub(pattern, '', text)

    return text.strip()


def is_content_useful(text: str) -> bool:
    """
    Quality gate: checks whether cleaned content has enough
    meaningful words to be worth sending to the LLM.
    Jina sometimes returns 3000 chars of nav/footer garbage
    that passes the length check but is useless for analysis.
    """
    useful_words = [w for w in text.split() if len(w) > 3]
    return len(useful_words) >= MIN_USEFUL_WORDS


def truncate_smart(text: str, max_chars: int = MAX_CONTENT_CHARS) -> str:
    """
    Truncates content intelligently — cuts at a paragraph boundary
    rather than mid-sentence to preserve coherence for the LLM.
    """
    if len(text) <= max_chars:
        return text

    truncated = text[:max_chars]
    last_para = truncated.rfind('\n\n')
    last_sentence = max(truncated.rfind('. '), truncated.rfind('.\n'))

    cut_point = last_para if last_para > max_chars * 0.8 else last_sentence
    if cut_point == -1:
        cut_point = max_chars

    return truncated[:cut_point] + "\n\n[Content truncated for analysis]"


# ---------------------------------------------------------------------------
# Scraping methods
# ---------------------------------------------------------------------------

async def scrape_via_jina(
    url: str,
    client: httpx.AsyncClient
) -> tuple[Optional[str], Optional[str]]:
    """
    Primary scraping method — Jina Reader.
    Free, no API key, returns clean markdown from any URL.

    Returns:
        (content, error_reason) — one of them will always be None.
    """
    try:
        jina_url = f"{JINA_BASE}{url}"
        response = await client.get(
            jina_url,
            headers=JINA_HEADERS,
            timeout=20.0,
            follow_redirects=True
        )
        response.raise_for_status()
        text = response.text

        if len(text.strip()) < 200:
            return None, "jina_thin_content"

        return text, None

    except httpx.TimeoutException:
        return None, "jina_timeout"
    except httpx.HTTPStatusError as e:
        return None, f"jina_http_{e.response.status_code}"
    except httpx.RequestError as e:
        return None, f"jina_request_error: {type(e).__name__}"
    except Exception as e:
        return None, f"jina_unexpected: {type(e).__name__}"


async def scrape_via_direct(
    url: str,
    client: httpx.AsyncClient
) -> tuple[Optional[str], Optional[str]]:
    """
    Fallback scraping method — direct HTTP fetch + basic HTML stripping.
    Used when Jina fails or returns thin / low-quality content.

    Returns:
        (content, error_reason) — one of them will always be None.
    """
    try:
        response = await client.get(
            url,
            headers=HEADERS,
            timeout=15.0,
            follow_redirects=True
        )
        response.raise_for_status()
        html = response.text

        # Strip <script>, <style>, <svg>, <noscript> blocks entirely
        html = re.sub(
            r'<(script|style|svg|noscript)[^>]*>.*?</\1>',
            '',
            html,
            flags=re.DOTALL | re.IGNORECASE
        )

        # Strip all remaining HTML tags
        text = re.sub(r'<[^>]+>', ' ', html)

        # Decode common HTML entities
        entities = {
            '&amp;': '&', '&lt;': '<', '&gt;': '>',
            '&quot;': '"', '&#39;': "'", '&nbsp;': ' ',
            '&mdash;': '—', '&ndash;': '–', '&hellip;': '…'
        }
        for entity, char in entities.items():
            text = text.replace(entity, char)

        if len(text.strip()) < 200:
            return None, "direct_thin_content"

        return text, None

    except httpx.TimeoutException:
        return None, "direct_timeout"
    except httpx.HTTPStatusError as e:
        return None, f"direct_http_{e.response.status_code}"
    except httpx.RequestError as e:
        return None, f"direct_request_error: {type(e).__name__}"
    except Exception as e:
        return None, f"direct_unexpected: {type(e).__name__}"


# ---------------------------------------------------------------------------
# Main entry point
# ---------------------------------------------------------------------------

async def scrape_url(url: str) -> dict:
    """
    Main entry point for URL scraping.
    Tries Jina first → falls back to direct scraping if Jina fails
    or returns low-quality content.

    Returns a dict with:
        success     bool
        content     str | None
        method      "jina" | "direct" | "none"
        char_count  int
        error       str | None  — human-readable error for the frontend
        debug       str | None  — raw error reason for logging / debugging
    """
    # Normalize URL
    if not url.startswith(("http://", "https://")):
        url = "https://" + url

    jina_error = None
    direct_error = None

    async with httpx.AsyncClient() as client:

        # --- Attempt 1: Jina Reader ---
        raw, jina_error = await scrape_via_jina(url, client)
        method_used = "jina"

        # If Jina returned content, run quality gate
        if raw:
            cleaned_check = clean_text(raw)
            if not is_content_useful(cleaned_check):
                raw = None
                jina_error = "jina_low_quality_content"

        # --- Attempt 2: Direct fallback ---
        if not raw:
            raw, direct_error = await scrape_via_direct(url, client)
            method_used = "direct"

            # Quality gate on direct too
            if raw:
                cleaned_check = clean_text(raw)
                if not is_content_useful(cleaned_check):
                    raw = None
                    direct_error = "direct_low_quality_content"

    # --- Both failed ---
    if not raw:
        debug_reason = f"jina={jina_error} | direct={direct_error}"
        return {
            "success": False,
            "content": None,
            "method": "none",
            "char_count": 0,
            "error": (
                "Failed to scrape this URL. The site may be behind a login wall, "
                "use heavy JavaScript rendering, or block automated requests. "
                "Try pasting the product description manually instead."
            ),
            "debug": debug_reason
        }

    cleaned = clean_text(raw)
    final = truncate_smart(cleaned)

    return {
        "success": True,
        "content": final,
        "method": method_used,
        "char_count": len(final),
        "error": None,
        "debug": None
    }


# ---------------------------------------------------------------------------
# URL validation
# ---------------------------------------------------------------------------

def validate_url(url: str) -> tuple[bool, str]:
    """
    Basic URL validation before we attempt scraping.
    Blocks empty input, malformed URLs, and local/private addresses.

    Returns:
        (is_valid: bool, error_message: str)
    """
    url = url.strip()

    if not url:
        return False, "URL cannot be empty."

    # Add scheme if missing for validation purposes
    check_url = url if url.startswith(("http://", "https://")) else "https://" + url

    url_pattern = re.compile(
        r'^https?://'
        r'(?:(?:[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?\.)+[A-Z]{2,6}\.?|'
        r'localhost|'
        r'\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})'
        r'(?::\d+)?'
        r'(?:/?|[/?]\S+)$',
        re.IGNORECASE
    )

    if not url_pattern.match(check_url):
        return False, "Invalid URL format. Please enter a valid product URL."

    blocked = ["localhost", "127.0.0.1", "0.0.0.0", "192.168.", "10.0."]
    if any(b in check_url for b in blocked):
        return False, "Local/private URLs are not allowed."

    return True, ""