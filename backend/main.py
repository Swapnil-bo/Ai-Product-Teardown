import os
import time
import logging
import asyncio
from contextlib import asynccontextmanager
from typing import Optional

from fastapi import FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, field_validator, model_validator
from dotenv import load_dotenv

from scraper import scrape_url, validate_url
from analyzer import analyze_product

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
)
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Environment
# ---------------------------------------------------------------------------

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:5173,http://localhost:3000"
).split(",")

# ---------------------------------------------------------------------------
# Rate limiting (in-memory, per IP)
# ---------------------------------------------------------------------------

REQUEST_LIMIT = 10        # max requests per window
WINDOW_SECONDS = 60       # rolling window in seconds

_rate_store: dict[str, list[float]] = {}  # ip -> list of request timestamps

def is_rate_limited(ip: str) -> tuple[bool, int]:
    """
    Simple in-memory sliding window rate limiter.
    Returns (is_limited, retry_after_seconds).
    """
    now = time.time()
    window_start = now - WINDOW_SECONDS

    timestamps = _rate_store.get(ip, [])
    timestamps = [t for t in timestamps if t > window_start]  # prune old

    if len(timestamps) >= REQUEST_LIMIT:
        oldest = timestamps[0]
        retry_after = int(WINDOW_SECONDS - (now - oldest)) + 1
        _rate_store[ip] = timestamps
        return True, retry_after

    timestamps.append(now)
    _rate_store[ip] = timestamps
    return False, 0


async def cleanup_rate_store():
    """Background task — prunes stale IPs from the rate store every 5 minutes."""
    while True:
        await asyncio.sleep(300)
        now = time.time()
        window_start = now - WINDOW_SECONDS
        stale = [ip for ip, ts in _rate_store.items() if not any(t > window_start for t in ts)]
        for ip in stale:
            del _rate_store[ip]
        if stale:
            logger.info(f"Rate store cleanup: removed {len(stale)} stale IPs")

# ---------------------------------------------------------------------------
# Lifespan
# ---------------------------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    if not GROQ_API_KEY:
        logger.critical("GROQ_API_KEY is not set. All /analyze requests will fail.")
    else:
        logger.info("GROQ_API_KEY loaded successfully.")
    logger.info(f"CORS origins: {ALLOWED_ORIGINS}")

    cleanup_task = asyncio.create_task(cleanup_rate_store())
    logger.info("Background rate store cleanup task started.")

    yield

    # Shutdown
    cleanup_task.cancel()
    try:
        await cleanup_task
    except asyncio.CancelledError:
        pass
    logger.info("Shutdown complete.")

# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------

app = FastAPI(
    title="AI Product Teardown API",
    description="PM-style product teardowns powered by LLaMA 3.3 70B on Groq.",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Request / Response models
# ---------------------------------------------------------------------------

class AnalyzeRequest(BaseModel):
    input_type: str          # "url" | "description"
    url: Optional[str] = None
    description: Optional[str] = None

    @field_validator("input_type")
    @classmethod
    def validate_input_type(cls, v):
        if v not in {"url", "description"}:
            raise ValueError("input_type must be 'url' or 'description'")
        return v

    @model_validator(mode="after")
    def validate_content_present(self):
        if self.input_type == "url":
            if not self.url or not self.url.strip():
                raise ValueError("url is required when input_type is 'url'")
        elif self.input_type == "description":
            if not self.description or not self.description.strip():
                raise ValueError("description is required when input_type is 'description'")
        return self


class AnalyzeResponse(BaseModel):
    success: bool
    data: Optional[dict] = None
    error: Optional[str] = None
    model: str
    attempt: int
    partial: bool
    scrape_method: Optional[str] = None
    char_count: Optional[int] = None
    processing_time_ms: Optional[int] = None

# ---------------------------------------------------------------------------
# Global exception handler
# ---------------------------------------------------------------------------

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception on {request.url}: {type(exc).__name__}: {exc}")
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": "An unexpected server error occurred. Please try again.",
            "detail": type(exc).__name__
        }
    )

# ---------------------------------------------------------------------------
# Middleware — request logging + timing
# ---------------------------------------------------------------------------

@app.middleware("http")
async def request_logger(request: Request, call_next):
    start = time.time()
    response = await call_next(request)
    duration_ms = int((time.time() - start) * 1000)
    logger.info(
        f"{request.method} {request.url.path} | "
        f"status={response.status_code} | "
        f"time={duration_ms}ms | "
        f"ip={request.client.host}"
    )
    return response

# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.get("/", tags=["Health"])
async def root():
    return {
        "status": "online",
        "service": "AI Product Teardown API",
        "version": "1.0.0",
        "endpoints": {
            "analyze": "POST /analyze",
            "health":  "GET /health",
            "docs":    "GET /docs"
        }
    }


@app.get("/health", tags=["Health"])
async def health():
    return {
        "status": "healthy",
        "groq_key_loaded": bool(GROQ_API_KEY),
        "rate_limit": f"{REQUEST_LIMIT} requests per {WINDOW_SECONDS}s per IP",
        "active_ips_tracked": len(_rate_store)
    }


@app.post("/analyze", response_model=AnalyzeResponse, tags=["Teardown"])
async def analyze(request: Request, body: AnalyzeRequest):
    start_time = time.time()

    # --- API key check ---
    if not GROQ_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Service misconfigured: GROQ_API_KEY not set."
        )

    # --- Rate limiting ---
    client_ip = request.client.host
    limited, retry_after = is_rate_limited(client_ip)
    if limited:
        logger.warning(f"Rate limit hit: {client_ip}")
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Rate limit exceeded. Try again in {retry_after} seconds.",
            headers={"Retry-After": str(retry_after)}
        )

    scrape_method = None
    char_count = None
    content = None

    # --- URL path ---
    if body.input_type == "url":
        url = body.url.strip()

        is_valid, url_error = validate_url(url)
        if not is_valid:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=url_error
            )

        logger.info(f"Scraping URL: {url}")
        scrape_result = await scrape_url(url)

        if not scrape_result["success"]:
            logger.warning(f"Scrape failed: {scrape_result['debug']}")
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=scrape_result["error"]
            )

        content = scrape_result["content"]
        scrape_method = scrape_result["method"]
        char_count = scrape_result["char_count"]
        logger.info(f"Scrape success via {scrape_method} | {char_count} chars")

    # --- Description path ---
    elif body.input_type == "description":
        content = body.description.strip()
        char_count = len(content)
        logger.info(f"Description input | {char_count} chars")

    # --- Analyze ---
    logger.info(f"Starting teardown | input_type={body.input_type}")
    result = await analyze_product(
        input_type=body.input_type,
        content=content,
        groq_api_key=GROQ_API_KEY
    )

    processing_time_ms = int((time.time() - start_time) * 1000)

    if not result["success"]:
        logger.warning(f"Analysis failed: {result['debug']}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=result["error"]
        )

    logger.info(
        f"Teardown complete | "
        f"score={result['data'].get('pm_verdict', {}).get('overall_score')} | "
        f"verdict={result['data'].get('pm_verdict', {}).get('kill_or_scale')} | "
        f"time={processing_time_ms}ms"
    )

    return AnalyzeResponse(
        success=True,
        data=result["data"],
        error=None,
        model=result["model"],
        attempt=result["attempt"],
        partial=result["partial"],
        scrape_method=scrape_method,
        char_count=char_count,
        processing_time_ms=processing_time_ms
    )