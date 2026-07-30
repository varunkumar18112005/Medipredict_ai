FROM python:3.10-slim

WORKDIR /app

# Install system dependencies for Tesseract OCR and PDF conversion
RUN apt-get update && \
    apt-get install -y tesseract-ocr libtesseract-dev poppler-utils && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Run the training script first to generate the synthetic models
RUN python train_models.py

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
