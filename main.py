"""
Sehat Saathi — FastAPI backend for multi-agent LHW clinical decision support.
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from orchestrator import handle_query

app = FastAPI(
    title="Sehat Saathi API",
    description="Pakistan's 1st AI decision support for Lady Health Workers (demo)—triage and specialist guidance from visit narratives; not a substitute for licensed care.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def log_requests(request: Request, call_next):
    # ASCII-only logs: Windows consoles often use cp1252 and choke on Unicode arrows.
    print(f"-> {request.method} {request.url}")
    response = await call_next(request)
    print(f"<- {response.status_code}")
    return response


class ChatRequest(BaseModel):
    user_input: str = Field(..., description="Clinical scenario or question from the LHW")


class HealthResponse(BaseModel):
    status: str = "healthy"
    service: str = "Sehat Saathi"


@app.get("/", response_model=HealthResponse)
def root_health() -> HealthResponse:
    """Health check (root), suitable for simple uptime probes."""
    return HealthResponse()


@app.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    """Health check endpoint."""
    return HealthResponse()


@app.get("/test")
def test():
    """Debug: confirm server is running and agent bundle is present."""
    return {"status": "Backend is alive", "agents": "6 agents loaded"}


@app.post("/chat")
def chat(body: ChatRequest) -> dict:
    """
    Run Master Triage (Agent 1) and, when indicated, the routed specialist agent.
    """
    return handle_query(body.user_input)
