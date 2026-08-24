import type { Components } from "react-markdown";
import ReactMarkdown from "react-markdown";
import { Link } from "react-router-dom";
import remarkGfm from "remark-gfm";

const components: Components = {
  a({ href, children }) {
    if (href && href.startsWith("/wiki/")) {
      return (
        <Link className="text-copper underline decoration-copper/40 underline-offset-4 hover:decoration-copper" to={href}>
          {children}
        </Link>
      );
    }
    return (
      <a
        className="text-copper underline decoration-copper/40 underline-offset-4 hover:decoration-copper"
        href={href}
        target="_blank"
        rel="noreferrer"
      >
        {children}
      </a>
    );
  },
  h2({ children }) {
    return <h2 className="mt-8 mb-3 font-serif text-xl tracking-tight">{children}</h2>;
  },
  h3({ children }) {
    return <h3 className="mt-6 mb-2 font-medium">{children}</h3>;
  },
  ul({ children }) {
    return <ul className="my-3 list-disc space-y-1 pl-5">{children}</ul>;
  },
  ol({ children }) {
    return <ol className="my-3 list-decimal space-y-1 pl-5">{children}</ol>;
  },
  p({ children }) {
    return <p className="my-3 leading-relaxed">{children}</p>;
  },
};

export function MarkdownBody({ text, className = "" }: { text: string; className?: string }) {
  return (
    <div className={`max-w-[65ch] text-[15px] leading-relaxed text-ink ${className}`}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {text}
      </ReactMarkdown>
    </div>
  );
}
