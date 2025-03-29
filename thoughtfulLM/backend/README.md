# ThoughtfulLM Backend

A FastAPI application that provides API endpoints for the ThoughtKit functionality.

## Project Structure

```
thoughtfulLM/backend/
├── app/
│   ├── main.py              # Main FastAPI application
│   ├── routes/              # API endpoint definitions
│   ├── models/              # Pydantic data models
│   ├── utils/               # Utility functions
│   └── config/              # Configuration settings
├── requirements.txt         # Python dependencies
├── .env.example             # Example environment variables
└── run.py                   # Script to run the application
```

## Setup

1. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install the ThoughtKit package:
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

The API will be available at http://localhost:8000 with documentation at http://localhost:8000/docs

## API Endpoints

- `POST /api/v1/thoughts/generate`: Generate thoughts based on input
- `POST /api/v1/thoughts/operate`: Perform operations on thoughts
- `POST /api/v1/thoughts/articulate`: Articulate thoughts into responses

## Testing

To test the API:

```bash
python test_api.py
```

## Development

To run the server in development mode with hot reloading:

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
``` 