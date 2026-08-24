import { PaperPlaneTilt } from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { STARTER_QUESTIONS, streamChat } from "../lib/api";
import { loadLlmConfig, type LlmConfig } from "../lib/llmSettings";
import { saveLastNote, summarizeQuote } from "../lib/quote";
import type { ChatMessage, QuoteState } from "../lib/types";
import { LlmSettingsBar } from "./LlmSettingsBar";
import { MarkdownBody } from "./MarkdownBody";

type AssistantPanelProps = {
  quote: QuoteState | null;
  pendingQuestion: string | null;
  onPendingConsumed: () => void;
};

export function AssistantPanel({
  quote,
  pendingQuestion,
  onPendingConsumed,
}: AssistantPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [llm, setLlm] = useState<LlmConfig>(loadLlmConfig);
  const listRef = useRef<HTMLDivElement>(null);
  const askedRef = useRef<string | null>(null);
  const llmRef = useRef(llm);
  llmRef.current = llm;

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages, sending]);

  useEffect(() => {
    if (!pendingQuestion || askedRef.current === pendingQuestion) {
      return;
    }
    askedRef.current = pendingQuestion;
    onPendingConsumed();
    void send(pendingQuestion);
  }, [pendingQuestion, onPendingConsumed]);

  async function send(text: string) {
    const question = text.trim();
    if (!question || sending) {
      return;
    }
    setError(null);
    setDraft("");
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: question,
    };
    const assistantId = `assistant-${Date.now()}`;
    const history = [...messages];
    setMessages((current) => [
      ...current,
      userMessage,
      { id: assistantId, role: "assistant", content: "", citations: [] },
    ]);
    setSending(true);
    try {
      await streamChat(question, history, quote ? summarizeQuote(quote) : "", {
        onCitations: (citations) => {
          setMessages((current) =>
            current.map((item) => (item.id === assistantId ? { ...item, citations } : item)),
          );
        },
        onToken: (token) => {
          setMessages((current) =>
            current.map((item) =>
              item.id === assistantId ? { ...item, content: item.content + token } : item,
            ),
          );
        },
      }, llmRef.current);
      setMessages((current) => {
        const last = current.find((item) => item.id === assistantId);
        if (last?.content) {
          saveLastNote(last.content);
        }
        return current;
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "助手暂时无法回答";
      setError(message);
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="flex min-h-[70dvh] flex-col py-6 md:min-h-[calc(100dvh-6rem)] md:py-8">
      <div>
        <p className="text-sm text-muted">助手</p>
        <h2 className="mt-1 font-serif text-2xl tracking-tight">先查 wiki，再谈价钱</h2>
      </div>

      <LlmSettingsBar onChange={setLlm} />

      <div ref={listRef} className="mt-6 min-h-0 flex-1 space-y-6 overflow-y-auto pr-1">
        {messages.length === 0 ? (
          <div className="space-y-3">
            <p className="text-sm text-muted">从这些常见问题开始，或点工册里的「问这行」。</p>
            <div className="flex flex-col items-start gap-2">
              {STARTER_QUESTIONS.map((question) => (
                <button
                  key={question}
                  type="button"
                  className="cursor-pointer border-b border-rule pb-1 text-left text-sm hover:border-copper hover:text-copper"
                  onClick={() => void send(question)}
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <article key={message.id}>
              {message.role === "user" ? (
                <p className="text-sm font-medium">{message.content}</p>
              ) : (
                <div>
                  {message.citations && message.citations.length > 0 ? (
                    <div className="mb-3 flex flex-wrap gap-2">
                      {message.citations.map((citation) => (
                        <Link
                          key={citation.slug}
                          to={`/wiki/${citation.slug}`}
                          className="cursor-pointer border border-rule px-2 py-1 text-xs text-muted hover:border-copper hover:text-copper"
                        >
                          {citation.title}
                        </Link>
                      ))}
                    </div>
                  ) : null}
                  {message.content ? (
                    <MarkdownBody text={message.content} />
                  ) : (
                    <div className="space-y-2" aria-busy="true" aria-label="正在作答">
                      <div className="h-3 w-5/6 animate-pulse bg-wash" />
                      <div className="h-3 w-2/3 animate-pulse bg-wash" />
                    </div>
                  )}
                </div>
              )}
            </article>
          ))
        )}
      </div>

      {error ? (
        <p className="mt-3 text-sm text-copper" role="alert">
          {error}
        </p>
      ) : null}

      <form
        className="mt-4 flex items-end gap-2 border-t border-rule pt-4"
        onSubmit={(event) => {
          event.preventDefault();
          void send(draft);
        }}
      >
        <label className="sr-only" htmlFor="assistant-input">
          向装册提问
        </label>
        <textarea
          id="assistant-input"
          className="min-h-11 flex-1 resize-none border-0 bg-transparent py-2 outline-none"
          rows={2}
          placeholder="问合同、水电、半包，或一项预算怎么算"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              void send(draft);
            }
          }}
        />
        <button
          type="submit"
          className="inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center bg-copper text-paper transition-colors duration-200 hover:bg-copper-dark disabled:opacity-50"
          disabled={sending || !draft.trim()}
          aria-label="发送"
        >
          <PaperPlaneTilt size={18} />
        </button>
      </form>
    </section>
  );
}
