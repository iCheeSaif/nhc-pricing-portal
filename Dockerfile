FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
COPY app.py ./
COPY static/ ./static/
RUN useradd -m -u 10001 pricing && mkdir -p /app/data && chown -R pricing:pricing /app
USER pricing
ENV APP_ENV=production PYTHONUNBUFFERED=1
EXPOSE 8000
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
