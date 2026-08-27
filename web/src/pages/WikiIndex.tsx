import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchWikiList } from "../lib/api";
import type { WikiSummary } from "../lib/types";

export function WikiIndex() {
  const [pages, setPages] = useState<WikiSummary[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchWikiList()
      .then(setPages)
      .catch(() => setError("知识目录加载失败。"));
  }, []);

  const concepts = pages.filter((page) => page.section === "concepts");
  const comparisons = pages.filter((page) => page.section === "comparisons");

  return (
    <article className="py-8 md:py-12">
      <p className="text-sm text-muted">知识</p>
        <h1 className="mt-2 font-serif text-4xl tracking-tight">二十页装修备忘</h1>
      <p className="mt-4 max-w-[55ch] text-muted">
        问答用的是这些整页，不是切片。先翻目录，再把具体条款带回工册。
      </p>
      {error ? (
        <p className="mt-6 text-sm text-copper" role="alert">
          {error}
        </p>
      ) : null}
      <div className="mt-10 grid grid-cols-1 gap-12 md:grid-cols-2">
        <PageGroup title="概念" pages={concepts} />
        <PageGroup title="对比" pages={comparisons} />
      </div>
    </article>
  );
}

function PageGroup({ title, pages }: { title: string; pages: WikiSummary[] }) {
  return (
    <section>
      <h2 className="border-b border-ink/80 pb-2 font-serif text-xl">{title}</h2>
      {pages.length === 0 ? (
        <div className="mt-6 h-32 animate-pulse bg-wash" aria-busy="true" />
      ) : (
        <ul className="divide-y divide-rule">
          {pages.map((page) => (
            <li key={page.slug}>
              <Link
                to={`/wiki/${page.slug}`}
                className="block cursor-pointer py-4 hover:text-slate"
              >
                <p className="font-medium">{page.title}</p>
                <p className="mt-1 text-sm text-muted">{page.tags.join(" · ")}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
