from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import thoughts, memories
from app.config import settings

# Set OpenAI API key in environment
import os
os.environ["OPENAI_API_KEY"] = settings.OPENAI_API_KEY or ""

app = FastAPI(
    title=settings.API_TITLE,
    description=settings.API_DESCRIPTION,
    version=settings.API_VERSION,
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Welcome to ThoughtfulLM API"}

# Include routers
app.include_router(thoughts.router, prefix=settings.API_PREFIX)
app.include_router(memories.router, prefix=settings.API_PREFIX) 
