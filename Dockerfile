# Use Python base image that also supports Node.js
FROM python:3.11-slim

# Install Node.js
RUN apt-get update && apt-get install -y \
    curl \
    && curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy the entire project
COPY . .

# Install and build frontend
WORKDIR /app/thinkaloudLM/frontend
RUN npm install
RUN CI=false npm run build

# Install backend dependencies (including local thought_kit package)
WORKDIR /app/thinkaloudLM/backend
RUN pip install -r requirements.txt

# Expose port
EXPOSE $PORT

# Start the server
CMD ["python", "run.py"] 