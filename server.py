from __future__ import annotations

import json
import os
from pathlib import Path
from urllib.parse import urlparse

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from llm_client import LLMClient
from wiki_engine import WikiEngine

ROOT = Path(__file__).resolve().parent
DIST = ROOT / "web" / "dist"
CATALOG_PATH = ROOT / "data" / "yyyjson.json"

wiki = WikiEngine(str(ROOT / "wiki"))
llm = LLMClient()

app = FastAPI(title="装册")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatTurn(BaseModel):
    role: str
    content: str


class LlmOptions(BaseModel):
    api_key: str | None = None
    base_url: str | None = None
    model: str | None = None


class ChatRequest(BaseModel):
    message: str
    history: list[ChatTurn] = Field(default_factory=list)
    quote_summary: str | None = None
    llm: LlmOptions | None = None


def _page_summary(page) -> dict:
    return {
        "slug": page.slug,
        "title": page.title,
        "type": page.page_type,
        "section": page.section,
        "tags": page.tags,
        "aliases": page.aliases,
    }


def _clean_base_url(url: str | None) -> str | None:
    if url is None:
        return None
    text = url.strip()
    if not text:
        return None
    parsed = urlparse(text)
    if parsed.scheme not in {"http", "https"} or not parsed.netloc:
        raise HTTPException(status_code=400, detail="接口地址无效，需要 http 或 https")
    return text.rstrip("/")


def _load_catalog() -> dict:
    raw = json.loads(CATALOG_PATH.read_text(encoding="utf-8"))
    categories = []
    for category_name, items in raw.items():
        lined = []
        for index, item in enumerate(items):
            lined.append(
                {
                    "id": f"{category_name}:{item['name']}:{index}",
                    "name": item["name"],
                    "unit": item["unit"],
                    "price": item["price"],
                    "quantity": item["quantity"],
                }
            )
        categories.append({"name": category_name, "items": lined})
    return {"categories": categories}


@app.get("/api/catalog")
def get_catalog():
    if not CATALOG_PATH.exists():
        raise HTTPException(status_code=404, detail="预算模板不存在")
    return _load_catalog()


@app.get("/api/wiki")
def list_wiki():
    return {"pages": [_page_summary(page) for page in wiki.list_pages()]}


@app.get("/api/wiki/{slug}")
def get_wiki_page(slug: str):
    page = wiki.get_page(slug)
    if page is None:
        raise HTTPException(status_code=404, detail="没有这一页")
    return {
        **_page_summary(page),
        "body": page.body,
        "markdown": wiki.to_web_markdown(page.body),
        "links": wiki.outgoing_links(page.body),
        "sources": [os.path.basename(source) for source in page.sources],
        "headings": page.headings,
    }


@app.get("/api/llm")
def llm_status():
    return {
        "configured": bool((llm.api_key or "").strip()),
        "default_model": llm.model,
        "default_base_url": llm.base_url,
    }


@app.post("/api/llm/test")
def llm_test(options: LlmOptions):
    result = llm.test_connection(
        api_key=(options.api_key or "").strip() or None,
        base_url=_clean_base_url(options.base_url),
        model=(options.model or "").strip() or None,
    )
    return result


@app.post("/api/chat")
def chat(request: ChatRequest):
    message = request.message.strip()
    if not message:
        raise HTTPException(status_code=400, detail="请输入问题")

    options = request.llm
    api_key = (options.api_key or "").strip() if options else ""
    model = (options.model or "").strip() if options else ""
    base_url = _clean_base_url(options.base_url if options else None)

    context, citations = wiki.query_detailed(message)
    history = [turn.model_dump() for turn in request.history]

    def events():
        yield _sse({"type": "citations", "citations": [item.to_dict() for item in citations]})
        for chunk in llm.generate_rag_response_stream(
            message,
            context,
            quote_summary=request.quote_summary,
            history=history,
            api_key=api_key or None,
            base_url=base_url,
            model=model or None,
        ):
            if chunk:
                yield _sse({"type": "token", "text": chunk})
        yield _sse({"type": "done"})

    return StreamingResponse(
        events(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


def _sse(payload: dict) -> str:
    return f"data: {json.dumps(payload, ensure_ascii=False)}\n\n"


if DIST.exists():
    assets = DIST / "assets"
    if assets.exists():
        app.mount("/assets", StaticFiles(directory=assets), name="assets")

    @app.api_route("/", methods=["GET", "HEAD"])
    def index():
        return FileResponse(DIST / "index.html")

    @app.api_route("/{full_path:path}", methods=["GET", "HEAD"])
    def spa(full_path: str):
        if full_path.startswith("api/"):
            raise HTTPException(status_code=404, detail="接口不存在")
        candidate = DIST / full_path
        if candidate.is_file():
            return FileResponse(candidate)
        return FileResponse(DIST / "index.html")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "server:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", "8000")),
        reload=os.getenv("RELOAD", "0") == "1",
    )
