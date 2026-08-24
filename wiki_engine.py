"""Compiled-wiki query engine.

Replaces chunk RAG. At query time: score compiled pages by title/tags/aliases,
then return a few full pages as LLM context.
"""
from __future__ import annotations

import os
import re
from dataclasses import dataclass, field
from typing import Iterable

try:
    import jieba
except ImportError:  # pragma: no cover
    jieba = None


FRONTMATTER_RE = re.compile(r"^---\s*\n(.*?)\n---\s*\n?(.*)$", re.S)
WIKILINK_RE = re.compile(r"\[\[([^\]]+)\]\]")
HEADING_RE = re.compile(r"^#{1,3}\s+(.+)$", re.M)
LIST_ITEM_RE = re.compile(r"[-*]\s+([^\n]+)")

STOP_WORDS = {
    "装修", "要", "注意", "什么", "的", "了", "是", "怎么", "如何", "哪些",
    "一下", "请问", "帮我", "告诉", "应该", "可以", "吗", "呢", "啊",
    "这个", "那个", "一个", "一下", "我", "你", "我们", "家",
}


def _parse_frontmatter(text: str) -> tuple[dict, str]:
    match = FRONTMATTER_RE.match(text)
    if not match:
        return {}, text.strip()
    raw_meta, body = match.group(1), match.group(2)
    meta: dict = {}
    for line in raw_meta.splitlines():
        if ":" not in line:
            continue
        key, value = line.split(":", 1)
        key, value = key.strip(), value.strip()
        if value.startswith("[") and value.endswith("]"):
            inner = value[1:-1].strip()
            meta[key] = [item.strip().strip("'\"") for item in inner.split(",") if item.strip()]
        else:
            meta[key] = value.strip().strip("'\"")
    return meta, body.strip()


def _tokenize(text: str) -> list[str]:
    if not text:
        return []
    if jieba:
        tokens = [t.strip().lower() for t in jieba.cut(text) if t.strip()]
    else:
        tokens = re.findall(r"[\u4e00-\u9fff]{2,}|[a-zA-Z0-9]{2,}", text.lower())
    return [t for t in tokens if t not in STOP_WORDS and len(t) > 1]


@dataclass
class WikiPage:
    slug: str
    path: str
    title: str
    page_type: str
    section: str = ""
    tags: list[str] = field(default_factory=list)
    aliases: list[str] = field(default_factory=list)
    sources: list[str] = field(default_factory=list)
    body: str = ""
    headings: list[str] = field(default_factory=list)

    @property
    def search_blob(self) -> str:
        return " ".join([self.title, *self.tags, *self.aliases, *self.headings, self.body])


@dataclass
class Citation:
    slug: str
    title: str
    score: float
    page_type: str

    def to_dict(self) -> dict:
        return {
            "slug": self.slug,
            "title": self.title,
            "score": round(self.score, 1),
            "type": self.page_type,
        }


class WikiEngine:
    def __init__(self, wiki_dir: str = "wiki"):
        self.wiki_dir = wiki_dir
        self.pages: list[WikiPage] = []
        self.index_text = ""
        self._by_slug: dict[str, WikiPage] = {}
        self._load()

    def _load(self) -> None:
        self.pages = []
        self._by_slug = {}
        index_path = os.path.join(self.wiki_dir, "index.md")
        if os.path.exists(index_path):
            with open(index_path, encoding="utf-8") as f:
                self.index_text = f.read()

        for subdir in ("concepts", "comparisons", "entities", "queries"):
            folder = os.path.join(self.wiki_dir, subdir)
            if not os.path.isdir(folder):
                continue
            for name in sorted(os.listdir(folder)):
                if not name.endswith(".md"):
                    continue
                path = os.path.join(folder, name)
                with open(path, encoding="utf-8") as f:
                    raw = f.read()
                meta, body = _parse_frontmatter(raw)
                slug = name[:-3]
                page = WikiPage(
                    slug=slug,
                    path=path,
                    title=meta.get("title", slug),
                    page_type=meta.get("type", subdir.rstrip("s")),
                    section=subdir,
                    tags=list(meta.get("tags") or []),
                    aliases=list(meta.get("aliases") or []),
                    sources=list(meta.get("sources") or []),
                    body=body,
                    headings=HEADING_RE.findall(body),
                )
                self.pages.append(page)
                self._by_slug[slug] = page

    def _score(self, query: str, page: WikiPage) -> float:
        q = query.strip()
        q_lower = q.lower()
        tokens = set(_tokenize(q))
        score = 0.0

        title = page.title
        if title and title in q:
            score += 12
        for alias in page.aliases:
            if alias and alias in q:
                score += 8
        for tag in page.tags:
            if tag and tag in q:
                score += 6

        title_tokens = set(_tokenize(" ".join([title, *page.aliases, *page.tags, *page.headings])))
        overlap = tokens & title_tokens
        score += 3 * len(overlap)

        body_tokens = set(_tokenize(page.body))
        body_overlap = tokens & body_tokens
        score += min(8, len(body_overlap))

        # Phrase bonus for remaining 2-char+ query fragments
        for token in tokens:
            if token in page.search_blob:
                score += 0.4

        if page.page_type == "comparison" and any(w in q_lower for w in ("对比", "区别", "还是", "vs", "还是选")):
            score += 4
        return score

    def select_pages(self, query_text: str, n_results: int = 4) -> list[tuple[WikiPage, float]]:
        scored = [(page, self._score(query_text, page)) for page in self.pages]
        scored.sort(key=lambda item: item[1], reverse=True)
        picked = [item for item in scored if item[1] > 0][:n_results]
        if not picked and scored:
            picked = scored[: min(2, len(scored))]
        return picked

    def get_page(self, slug: str) -> WikiPage | None:
        return self._by_slug.get(slug)

    def list_pages(self) -> list[WikiPage]:
        return list(self.pages)

    def query_detailed(
        self, query_text: str, n_results: int = 4
    ) -> tuple[str, list[Citation]]:
        picked = self.select_pages(query_text, n_results=n_results)
        if not picked:
            return "知识库暂时没有匹配页面。请先查看 wiki/index.md。", []

        print(f"Wiki query: {query_text}")
        citations: list[Citation] = []
        blocks = []
        for page, score in picked:
            print(f"  - {page.title} ({page.slug}) score={score:.1f}")
            citations.append(
                Citation(
                    slug=page.slug,
                    title=page.title,
                    score=score,
                    page_type=page.page_type,
                )
            )
            source_note = "、".join(os.path.basename(s) for s in page.sources[:4])
            header = f"[Wiki: {page.title}]"
            if source_note:
                header += f"\n来源：{source_note}"
            blocks.append(f"{header}\n{self._resolve_links(page.body)}")
        return "\n\n---\n\n".join(blocks), citations

    def query(self, query_text: str, n_results: int = 4) -> str:
        """Return compiled wiki pages as LLM context."""
        context, _citations = self.query_detailed(query_text, n_results=n_results)
        return context

    def _resolve_links(self, body: str) -> str:
        titles = {page.slug: page.title for page in self.pages}
        return WIKILINK_RE.sub(lambda m: f"《{titles.get(m.group(1), m.group(1))}》", body)

    def to_web_markdown(self, body: str) -> str:
        titles = {page.slug: page.title for page in self.pages}

        def repl(match: re.Match[str]) -> str:
            slug = match.group(1)
            title = titles.get(slug, slug)
            return f"[{title}](/wiki/{slug})"

        return WIKILINK_RE.sub(repl, body)

    def outgoing_links(self, body: str) -> list[dict]:
        titles = {page.slug: page.title for page in self.pages}
        seen: list[str] = []
        for slug in WIKILINK_RE.findall(body):
            if slug not in seen:
                seen.append(slug)
        return [
            {
                "slug": slug,
                "title": titles.get(slug, slug),
                "exists": slug in self._by_slug,
            }
            for slug in seen
        ]

    def list_titles(self) -> Iterable[str]:
        return [page.title for page in self.pages]
