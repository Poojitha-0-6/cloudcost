# ============================================================
# CloudCost Guardian
# Dockerfile
# ============================================================

FROM python:3.13-slim

# Prevent Python from creating .pyc files
# and keep logs visible in Docker
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Application directory
WORKDIR /app

# Install Python dependencies first
# This improves Docker build caching.
COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

# Copy the complete application
COPY backend ./backend
COPY frontend ./frontend
COPY tests ./tests

# Expose Flask port
EXPOSE 5000

# Start CloudCost Guardian
CMD ["python", "-m", "backend.app"]# Docker configuration will be completed in Phase 8.
