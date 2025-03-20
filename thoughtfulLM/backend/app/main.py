from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import thoughts

app = FastAPI(
    title="ThoughtfulLM API",
    description="API for ThoughtKit functionality",
    version="0.1.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React app's default port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Welcome to ThoughtfulLM API"}

# Include routers
app.include_router(thoughts.router) 
