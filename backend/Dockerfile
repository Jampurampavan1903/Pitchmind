FROM python:3.11-slim

# Set environment variables for production execution
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PORT=8000

# Define container runtime directory
WORKDIR /app

# Install system dependencies required for OpenCV, MediaPipe, and FFmpeg
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    ffmpeg \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy packaging configuration files first to enable layer caching
COPY pyproject.toml ./

# Upgrade package installers and compile python dependencies
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir .

# Copy backend application source package code
COPY app/ ./app/

# Expose FastAPI backend listener port
EXPOSE 8000

# Launch FastAPI web application via production Uvicorn daemon
CMD ["python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
