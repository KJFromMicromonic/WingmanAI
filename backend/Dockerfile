FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the entire backend application
COPY . .

# Set Python path to include the current directory
ENV PYTHONPATH=/app

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV LIVEKIT_URL=""
ENV LIVEKIT_API_KEY=""
ENV LIVEKIT_API_SECRET=""
ENV GOOGLE_APPLICATION_CREDENTIALS="/app/service-account.json"
ENV GOOGLE_API_KEY=""
ENV DEEPGRAM_API_KEY=""

# Expose port (if running HTTP server alongside agent)
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import sys; sys.exit(0)" || exit 1

# Run the WingMan agent
CMD ["python", "wingmanagent.py"]
