"""
Sehat Saathi orchestrator: triage (Agent 1) then optional specialist routing.
Uses google-genai with prompts extracted from Google AI Studio agent exports.
"""

from __future__ import annotations

import json
import logging
import os
import re
import time
from pathlib import Path
from typing import Any

from dotenv import load_dotenv
from google import genai
from google.genai import types
from google.genai.errors import ClientError

load_dotenv()

logger = logging.getLogger(__name__)

BASE_DIR = Path(__file__).resolve().parent
AGENTS_DIR = BASE_DIR / "agents"

MODEL = os.environ.get("GEMINI_MODEL", "").strip() or "gemini-2.5-flash-lite-preview-06-17"

_GEMINI_429_MAX_ATTEMPTS = max(1, int(os.environ.get("GEMINI_429_MAX_ATTEMPTS", "4")))

_SYSTEM_PROMPT_PATTERN = re.compile(
    r'system_instruction=\[\s*types\.Part\.from_text\(text="""(.*?)"""\s*\),',
    re.DOTALL,
)

ROUTE_TO_FILE: dict[str, Path] = {
    "AGENT_2_MATERNAL": AGENTS_DIR / "agent2.py",
    "AGENT_3_PEDIATRIC": AGENTS_DIR / "agent3.py",
    "AGENT_4_TREATMENT": AGENTS_DIR / "agent4.py",
    "AGENT_5_NUTRITION": AGENTS_DIR / "agent5.py",
    "AGENT_6_ADULT": AGENTS_DIR / "agent6.py",
}

_agent1_prompt_cache: str | None = None
_specialist_prompt_cache: dict[str, str] = {}


def extract_system_prompt(agent_file: Path) -> str:
    """Parse system_instruction from an agent .py export (Google AI Studio style)."""
    raw = agent_file.read_text(encoding="utf-8")
    m = _SYSTEM_PROMPT_PATTERN.search(raw)
    if not m:
        raise ValueError(
            f"No system_instruction block found in {agent_file} "
            '(expected types.Part.from_text(text="""...""") under system_instruction=[).'
        )
    return m.group(1)


def get_agent1_system_prompt() -> str:
    global _agent1_prompt_cache
    if _agent1_prompt_cache is None:
        _agent1_prompt_cache = extract_system_prompt(AGENTS_DIR / "agent1.py")
    return _agent1_prompt_cache


def get_specialist_system_prompt(route: str) -> str:
    if route not in ROUTE_TO_FILE:
        raise ValueError(f"Unknown specialist route: {route}")
    if route not in _specialist_prompt_cache:
        _specialist_prompt_cache[route] = extract_system_prompt(ROUTE_TO_FILE[route])
    return _specialist_prompt_cache[route]


def strip_markdown_fences(raw: str) -> str:
    """Remove ``` or ```json fences if the model wrapped JSON in markdown."""
    s = raw.strip()
    if not s.startswith("```"):
        return s
    s = s[3:].lstrip()
    if s.lower().startswith("json"):
        s = s[4:].lstrip()
    if s.startswith("\n"):
        s = s[1:]
    end = s.rfind("```")
    if end != -1:
        s = s[:end]
    return s.strip()


def _parse_json_dict(text: str, context: str) -> dict[str, Any]:
    cleaned = strip_markdown_fences(text)
    try:
        data = json.loads(cleaned)
    except json.JSONDecodeError as e:
        logger.warning("%s JSON parse failed: %s", context, e)
        raise ValueError(
            f"{context}: response is not valid JSON ({e.msg} at position {e.pos}). "
            f"Preview: {cleaned[:200]!r}..."
        ) from e
    if not isinstance(data, dict):
        raise ValueError(f"{context}: expected JSON object, got {type(data).__name__}")
    return data


def _retry_after_seconds(err: ClientError) -> float | None:
    """Parse suggested wait from a 429 RetryInfo block or message text."""
    raw = err.details
    if isinstance(raw, dict):
        err_obj = raw.get("error", raw)
        if isinstance(err_obj, dict):
            for item in err_obj.get("details") or []:
                if not isinstance(item, dict):
                    continue
                rd = item.get("retryDelay")
                if isinstance(rd, (int, float)):
                    return float(rd)
                if isinstance(rd, str) and rd.endswith("s"):
                    try:
                        return float(rd[:-1].strip())
                    except ValueError:
                        pass
            msg = err_obj.get("message") or ""
            m = re.search(r"retry in ([0-9]+(?:\.[0-9]+)?)\s*s", msg, re.I)
            if m:
                try:
                    return float(m.group(1))
                except ValueError:
                    pass
    return None


def call_agent(system_prompt: str, user_input: str) -> dict[str, Any]:
    """
    Call Gemini with the given system prompt and user text; return parsed JSON object.
    """
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY is not set (check your .env or environment).")

    client = genai.Client(api_key=api_key)
    response = None
    for attempt in range(_GEMINI_429_MAX_ATTEMPTS):
        try:
            response = client.models.generate_content(
                model=MODEL,
                contents=[
                    types.Content(
                        role="user",
                        parts=[types.Part.from_text(text=user_input)],
                    )
                ],
                config=types.GenerateContentConfig(system_instruction=system_prompt),
            )
            break
        except ClientError as e:
            code = getattr(e, "code", None)
            is_last = attempt >= _GEMINI_429_MAX_ATTEMPTS - 1
            if code != 429 or is_last:
                if code == 429:
                    logger.warning(
                        "Gemini rate limit (429) after %s attempts: %s",
                        attempt + 1,
                        getattr(e, "message", e) or e,
                    )
                else:
                    logger.exception("Gemini API call failed")
                raise RuntimeError(f"Gemini request failed: {e}") from e
            wait = _retry_after_seconds(e)
            if wait is None:
                wait = min(90.0, 2.0 * (2**attempt))
            wait = max(1.0, min(wait, 120.0))
            logger.warning(
                "Gemini 429 RESOURCE_EXHAUSTED; sleeping %.1fs then retry %s/%s (model=%s)",
                wait,
                attempt + 2,
                _GEMINI_429_MAX_ATTEMPTS,
                MODEL,
            )
            time.sleep(wait)
        except Exception as e:
            logger.exception("Gemini API call failed")
            raise RuntimeError(f"Gemini request failed: {e}") from e

    if response is None:
        raise RuntimeError("Gemini request failed: no response after retries.")

    raw_text = getattr(response, "text", None)
    if raw_text is None and response.candidates:
        parts = response.candidates[0].content.parts
        raw_text = "".join(getattr(p, "text", "") or "" for p in parts)
    if not raw_text:
        raise RuntimeError("Empty response from Gemini (no text in response).")

    return _parse_json_dict(raw_text, context="Agent response")


def handle_query(user_input: str) -> dict[str, Any]:
    """
    Run triage, optionally a specialist, and return the combined API payload.
    """
    empty_specialist_shape: dict[str, Any] = {
        "triage": None,
        "specialist": None,
        "agent_used": "NONE",
        "risk": "UNKNOWN",
        "patient_type": "unknown",
    }

    if not (user_input or "").strip():
        return {
            **empty_specialist_shape,
            "error": "user_input is empty or whitespace only.",
        }

    try:
        triage_prompt = get_agent1_system_prompt()
    except Exception as e:
        logger.exception("Failed to load Agent 1 system prompt")
        return {
            **empty_specialist_shape,
            "error": f"Failed to load triage agent prompt: {e}",
        }

    try:
        triage = call_agent(triage_prompt, user_input)
    except Exception as e:
        logger.exception("Triage agent failed")
        return {
            **empty_specialist_shape,
            "error": str(e),
        }

    # route_to_specialist from triage JSON (e.g. AGENT_2_MATERNAL, NONE)
    route = triage.get("route_to_specialist", "NONE")
    if not isinstance(route, str):
        route = "NONE"

    risk = triage.get("risk", "UNKNOWN")
    if not isinstance(risk, str):
        risk = "UNKNOWN"

    patient_type = triage.get("patient_type", "unknown")
    if not isinstance(patient_type, str):
        patient_type = "unknown"

    # Pass through full parsed JSON from each agent — no field filtering.
    specialist_response: dict[str, Any] | None = None

    if route == "NONE" or route not in ROUTE_TO_FILE:
        return {
            "triage": triage,
            "specialist": specialist_response,
            "agent_used": route,
            "risk": risk,
            "patient_type": patient_type,
        }

    try:
        specialist_prompt = get_specialist_system_prompt(route)
        specialist_response = call_agent(specialist_prompt, user_input)
    except Exception as e:
        logger.exception("Specialist agent failed for route %s", route)
        specialist_response = None
        return {
            "triage": triage,
            "specialist": None,
            "agent_used": route,
            "risk": risk,
            "patient_type": patient_type,
            "specialist_error": str(e),
        }

    return {
        "triage": triage,
        "specialist": specialist_response,
        "agent_used": route,
        "risk": risk,
        "patient_type": patient_type,
    }
