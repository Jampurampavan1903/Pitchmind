import os
from fastapi import APIRouter

router = APIRouter()

@router.get("/developer/config")
async def get_developer_config():
    """
    Exposes API configuration status metrics for secure frontend settings checklist checks.
    Does NOT leak actual private keys or secrets.
    """
    anthropic_key = os.getenv("ANTHROPIC_API_KEY", "").strip()
    openai_key = os.getenv("OPENAI_API_KEY", "").strip()
    
    return {
        "claude_active": len(anthropic_key) > 0,
        "openai_active": len(openai_key) > 0
    }
