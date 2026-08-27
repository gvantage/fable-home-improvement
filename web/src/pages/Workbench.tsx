import { useSearchParams } from "react-router-dom";
import { useState } from "react";
import { AssistantPanel } from "../components/AssistantPanel";
import { QuotePanel } from "../components/QuotePanel";
import { useQuote } from "../lib/QuoteContext";

export function Workbench() {
  const { quote } = useQuote();
  const [params, setParams] = useSearchParams();
  const [pendingQuestion, setPendingQuestion] = useState<string | null>(null);
  const askOpen = params.get("pane") === "ask";

  function ask(question: string) {
    setPendingQuestion(question);
    if (window.matchMedia("(max-width: 1023px)").matches) {
      setParams({ pane: "ask" });
    }
  }

  return (
    <div className="grid grid-cols-1 lg:min-h-[calc(100dvh-4.75rem)] lg:grid-cols-12">
      <div
        className={`${askOpen ? "hidden lg:block" : "block"} px-4 md:px-6 lg:col-span-7 lg:pl-[max(1.5rem,calc((100vw-1400px)/2+1.5rem))] lg:pr-10`}
      >
        <QuotePanel onAsk={ask} />
      </div>
      <aside
        className={`${askOpen ? "block" : "hidden lg:block"} flex min-h-[calc(100dvh-8rem)] flex-col bg-pane px-4 md:px-6 lg:col-span-5 lg:min-h-0 lg:border-l lg:border-rule lg:px-8`}
        aria-label="Wiki 问答"
      >
        <AssistantPanel
          quote={quote}
          pendingQuestion={pendingQuestion}
          onPendingConsumed={() => setPendingQuestion(null)}
        />
      </aside>
    </div>
  );
}
