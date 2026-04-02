import httpx
import re
from typing import Optional

JINA_BASE = "https://r.jina.ai/"
MAX_CONTENT_CHARS = 12000  # ~3000 tokens, keeps us well within Groq context limits

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
    "X-Return-Format": "markdown",          # clean markdown output
    "X-Remove-Selector": "header,footer,nav,script,style",  # strip boilerplate
    "X-Timeout": "15",
}


def clean_text(text: str) -> str:
    """
    Strips noise from scraped content:
    - Collapses excessive whitespace
    - Removes repeated newlines (3+ → 2)
    - Removes zero-width characters
    - Strips cookie banners / GDPR noise patterns
    """
    # Remove zero-width and invisible chars
    text = re.sub(r'[\u200b\u200c\u200d\ufeff]', '', text)

    # Collapse 3+ newlines into 2
    text = re.sub(r'\n{3,}', '\n\n', text)

    # Collapse multiple spaces
    text = re.sub(r' {3,}', '  ', text)

    # Remove common cookie/GDPR noise
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


def truncate_smart(text: str, max_chars: int = MAX_CONTENT_CHARS) -> str:
    """
    Truncates content intelligently — cuts at a paragraph boundary
    rather than mid-sentence to preserve coherence.
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


async def scrape_via_jina(url: str, client: httpx.AsyncClient) -> Optional[str]:
    """
    Primary scraping method — Jina Reader.
    Free, no API key, returns clean markdown from any URL.
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
            return None  # Jina returned almost nothing, trigger fallback

        return text

    except Exception:
        return None


async def scrape_via_direct(url: str, client: httpx.AsyncClient) -> Optional[str]:
    """
    Fallback scraping method — direct HTTP fetch + basic HTML stripping.
    Used when Jina fails or returns thin content.
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
        html = re.sub(r'<(script|style|svg|noscript)[^>]*>.*?</\1>', '', html, flags=re.DOTALL | re.IGNORECASE)

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
            return None

        return text

    except Exception:
        return None


async def scrape_url(url: str) -> dict:
    """
    Main entry point for URL scraping.
    Tries Jina first → falls back to direct scraping.
    Returns a dict with content and metadata.
    """
    # Normalize URL
    if not url.startswith(("http://", "https://")):
        url = "https://" + url

    async with httpx.AsyncClient() as client:

        # --- Attempt 1: Jina Reader ---
        raw = await scrape_via_jina(url, client)
        method_used = "jina"

        # --- Attempt 2: Direct fallback ---
        if not raw:
            raw = await scrape_via_direct(url, client)
            method_used = "direct"

        # --- Both failed ---
        if not raw:
            return {
                "success": False,
                "content": None,
                "method": "none",
                "char_count": 0,
                "error": (
                    "Failed to scrape the URL using both Jina Reader and direct fetch. "
                    "The site may be behind a login wall, use heavy JavaScript rendering, "
                    "or block automated requests. Try pasting the product description manually."
                )
            }

    cleaned = clean_text(raw)
    final = truncate_smart(cleaned)

    return {
        "success": True,
        "content": final,
        "method": method_used,
        "char_count": len(final),
        "error": None
    }


def validate_url(url: str) -> tuple[bool, str]:
    """
    Basic URL validation before we attempt scraping.
    Returns (is_valid, error_message).
    """
    url = url.strip()

    if not url:
        return False, "URL cannot be empty."

    # Add scheme if missing for validation
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