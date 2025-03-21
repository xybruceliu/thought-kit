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
│   │   ├── __init__.py
│   │   └── thoughtkit_client.py # ThoughtKit API client
│   └── config/              # Configuration settings
│       ├── __init__.py
│       └── settings.py      # Configuration settings
├── requirements.txt         # Python dependencies
├── .env.example             # Example environment variables
├── .env                     # Environment variables (not in version control)
├── test_api.py              # Simple API test script
├── README.md                # Documentation
└── run.py                   # Script to run the application
```

## Setup

1. Create a virtual environment (optional but recommended):
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install the ThoughtKit package in development mode:
```bash
cd ../..  # Navigate to root directory
pip install -e .
```

3. Install dependencies:
```bash
cd thoughtfulLM/backend
pip install -r requirements.txt
```

4. Set up environment variables:
```bash
cp .env.example .env
# Edit .env file to add your OpenAI API key
```

5. Run the server:
```bash
python run.py
```

The API will be available at http://localhost:8000

Documentation will be available at http://localhost:8000/docs

### Troubleshooting

If you encounter dependency issues, you may need to update your dependencies:

```bash
pip install -r requirements.txt --upgrade
```

## API Endpoints

- `POST /api/v1/thoughts/generate`: Generate a thought based on provided input
- `POST /api/v1/thoughts/operate`: Perform an operation on thoughts
- `POST /api/v1/thoughts/articulate`: Articulate thoughts into a coherent response

## Testing

To test if the API is working correctly:

1. Start the server:
```bash
python run.py
```

2. In a separate terminal, run the test script:
```bash
python test_api.py
```

This will test all three endpoints (generate, operate, articulate) and display the results.

## Development

To run the server in development mode with hot reloading:

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
``` 