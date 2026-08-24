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
    <div className="grid grid-cols-1 lg:grid-cols-12 lg:gap-10">
      <div className={`${askOpen ? "hidden lg:block" : "block"} lg:col-span-7`}>
        <QuotePanel onAsk={ask} />
      </div>
      <div
        className={`${askOpen ? "block" : "hidden lg:block"} border-rule lg:col-span-5 lg:border-l lg:pl-8`}
      >
        <AssistantPanel
          quote={quote}
          pendingQuestion={pendingQuestion}
          onPendingConsumed={() => setPendingQuestion(null)}
        />
      </div>
    </div>
  );
}
