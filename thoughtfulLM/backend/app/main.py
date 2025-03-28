from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import thoughts, memories
from app.config import settings
from fastapi.staticfiles import StaticFiles
import os

# Set OpenAI API key in environment
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

# Include routers
app.include_router(thoughts.router, prefix=settings.API_PREFIX)
app.include_router(memories.router, prefix=settings.API_PREFIX)

# Move the API welcome message to the API prefix path
@app.get(settings.API_PREFIX)
async def api_root():
    return {"message": "Welcome to ThoughtfulLM API"}

# Mount the React build directory - this needs to come AFTER API routes but BEFORE the catch-all route
frontend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../..", "frontend", "build"))
if os.path.exists(frontend_dir):
    print(f"Serving frontend from: {frontend_dir}")
    app.mount("/", StaticFiles(directory=frontend_dir, html=True), name="static")
else:
    print(f"Warning: Frontend build directory not found at {frontend_dir}")
    @app.get("/")
    async def root():
        return {"message": "Frontend not found. Please build the React app first."} 
