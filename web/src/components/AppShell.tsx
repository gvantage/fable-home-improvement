import {
  BookOpen,
  ChatCircleText,
  Notebook,
  Printer,
} from "@phosphor-icons/react";
import type { ReactNode } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";

const ICON = { size: 18, weight: "regular" as const };

export function AppShell() {
  const { pathname, search } = useLocation();
  const onPrint = pathname === "/print";
  const onWiki = pathname.startsWith("/wiki");
  const askOpen = pathname === "/" && new URLSearchParams(search).get("pane") === "ask";
  const onQuote = pathname === "/" && !askOpen;

  if (onPrint) {
    return <Outlet />;
  }

  return (
    <div className="min-h-[100dvh] bg-paper text-ink">
      <header className="no-print border-b border-rule">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4 px-4 py-4 md:px-6">
          <NavLink to="/" className="font-serif text-2xl tracking-tight text-ink">
            装册
          </NavLink>
          <nav className="hidden items-center gap-8 text-sm lg:flex" aria-label="主导航">
            <NavLink
              to="/"
              className={`cursor-pointer pb-0.5 ${onQuote || askOpen ? "text-copper" : "text-muted hover:text-ink"}`}
            >
              工册
            </NavLink>
            <NavLink
              to="/wiki"
              className={`cursor-pointer pb-0.5 ${onWiki ? "text-copper" : "text-muted hover:text-ink"}`}
            >
              知识
            </NavLink>
            <NavLink
              to="/print"
              className="inline-flex cursor-pointer items-center gap-1.5 text-muted hover:text-ink"
            >
              <Printer {...ICON} />
              打印
            </NavLink>
          </nav>
          <NavLink
            to="/print"
            className="inline-flex cursor-pointer items-center gap-1 text-sm text-muted hover:text-ink lg:hidden"
            aria-label="打印报告"
          >
            <Printer {...ICON} />
            打印
          </NavLink>
        </div>
      </header>

      <main className="mx-auto max-w-[1400px] px-4 pb-24 md:px-6 md:pb-10">
        <Outlet />
      </main>

      <nav
        className="no-print fixed inset-x-0 bottom-0 z-20 grid grid-cols-3 border-t border-rule bg-paper/95 backdrop-blur lg:hidden"
        aria-label="底部导航"
      >
        <TabLink to="/" active={onQuote} icon={<Notebook {...ICON} />} label="工册" />
        <TabLink to="/?pane=ask" active={askOpen} icon={<ChatCircleText {...ICON} />} label="问答" />
        <TabLink to="/wiki" active={onWiki} icon={<BookOpen {...ICON} />} label="知识" />
      </nav>
    </div>
  );
}

function TabLink({
  to,
  active,
  icon,
  label,
}: {
  to: string;
  active: boolean;
  icon: ReactNode;
  label: string;
}) {
  return (
    <NavLink
      to={to}
      className={`flex min-h-11 cursor-pointer flex-col items-center justify-center gap-1 py-2 text-xs ${
        active ? "text-copper" : "text-muted"
      }`}
    >
      {icon}
      {label}
    </NavLink>
  );
}
