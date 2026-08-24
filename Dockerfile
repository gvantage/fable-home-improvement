FROM node:22-alpine AS frontend
WORKDIR /web
COPY web/package.json web/package-lock.json* ./
RUN npm install
COPY web/ ./
RUN npm run build

FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY wiki_engine.py llm_client.py server.py ./
COPY data ./data
COPY wiki ./wiki
COPY --from=frontend /web/dist ./web/dist
EXPOSE 8000
CMD ["python", "server.py"]
