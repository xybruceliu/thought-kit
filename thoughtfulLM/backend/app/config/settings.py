"""
Configuration settings for the ThoughtfulLM backend.
"""

import os
from dotenv import load_dotenv

# Load environment variables from .env file if it exists
load_dotenv()

# API settings
API_PREFIX = "/api/v1"
API_TITLE = "ThoughtfulLM API"
API_DESCRIPTION = "API for ThoughtKit functionality"
API_VERSION = "0.1.0"

# CORS settings
CORS_ORIGINS = [
    "http://localhost:3000",  # React app
    "http://localhost:8000",  # FastAPI docs
]

# Default model settings
DEFAULT_MODEL = "gpt-4o-mini"
DEFAULT_TEMPERATURE = 0.7
DEFAULT_MAX_TOKENS = 500

# Environment-specific settings
DEBUG = os.getenv("DEBUG", "False").lower() in ("true", "1", "t")
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")

# OpenAI API key - ensure it's set in environment or .env file
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
if not OPENAI_API_KEY and ENVIRONMENT != "test":
    import warnings
    warnings.warn("OPENAI_API_KEY not set. ThoughtKit functionality may not work properly.") 