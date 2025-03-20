# ThoughtfulLM Backend

A FastAPI application that provides API endpoints for the ThoughtKit functionality.

## Project Structure

```
thoughtfulLM/backend/
├── app/
│   ├── __init__.py          # Package initialization
│   ├── main.py              # Main FastAPI application entry point
│   ├── routes/              # API endpoint definitions
│   │   ├── __init__.py
│   │   └── thoughts.py      # Thought-related endpoints
│   ├── models/              # Pydantic data models
│   │   ├── __init__.py
│   │   └── thought_models.py # Data models for API requests/responses
│   ├── utils/               # Utility functions
│   └── config/              # Configuration settings
├── requirements.txt         # Python dependencies
├── README.md                # Documentation
└── run.py                   # Script to run the application
```

## Setup

1. Create a virtual environment (optional but recommended):
```
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```
pip install -r requirements.txt
```

3. Run the server:
```
uvicorn app.main:app --reload
```

The API will be available at http://localhost:8000

Documentation will be available at http://localhost:8000/docs

## API Endpoints

- `POST /thoughts/generate`: Generate a thought based on provided input
- `POST /thoughts/operate`: Perform an operation on thoughts
- `POST /thoughts/articulate`: Articulate thoughts into a coherent response 