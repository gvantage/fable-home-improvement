import { ArrowLeft } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { MarkdownBody } from "../components/MarkdownBody";
import { fetchWikiPage } from "../lib/api";
import type { WikiPage } from "../lib/types";

export function WikiReader() {
  const { slug } = useParams();
  const [page, setPage] = useState<WikiPage | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) {
      return;
    }
    setPage(null);
    setError(null);
    fetchWikiPage(slug)
      .then(setPage)
      .catch(() => setError("没有这一页，或知识库还没载入。"));
  }, [slug]);

  if (error) {
    return (
      <article className="py-10">
        <BackLink />
        <p className="mt-6 text-copper" role="alert">
          {error}
        </p>
      </article>
    );
  }

  if (!page) {
    return (
      <article className="space-y-4 py-10" aria-busy="true" aria-label="正在载入页面">
        <div className="h-8 w-40 animate-pulse bg-wash" />
        <div className="h-40 animate-pulse bg-wash" />
      </article>
    );
  }

  return (
    <article className="py-8 md:py-12">
      <BackLink />
      <p className="mt-6 text-sm text-muted">{page.section === "comparisons" ? "对比" : "概念"}</p>
      <h1 className="mt-2 font-serif text-4xl tracking-tight">{page.title}</h1>
      {page.tags.length > 0 ? (
        <p className="mt-3 text-sm text-muted">{page.tags.join(" · ")}</p>
      ) : null}
      <MarkdownBody className="mt-8" text={page.markdown} />
      {page.links.length > 0 ? (
        <aside className="mt-12 border-t border-rule pt-6">
          <h2 className="text-sm text-muted">相关页面</h2>
          <ul className="mt-3 flex flex-col items-start gap-2">
            {page.links.map((link) =>
              link.exists ? (
                <li key={link.slug}>
                  <Link className="cursor-pointer text-copper hover:text-copper-dark" to={`/wiki/${link.slug}`}>
                    {link.title}
                  </Link>
                </li>
              ) : null,
            )}
          </ul>
        </aside>
      ) : null}
    </article>
  );
}

function BackLink() {
  return (
    <Link to="/wiki" className="inline-flex cursor-pointer items-center gap-1 text-sm text-muted hover:text-ink">
      <ArrowLeft size={16} />
      返回目录
    </Link>
  );
}
