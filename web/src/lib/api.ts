import type { CatalogResponse, ChatMessage, Citation, WikiPage, WikiSummary } from "./types";
import type { LlmConfig } from "./llmSettings";

export const STARTER_QUESTIONS = [
  "第一次去装修公司谈什么",
  "水电怎么收费",
  "半包和全包有什么区别",
  "封阳台选什么窗",
];

async function readJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || `请求失败 ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export function fetchCatalog(): Promise<CatalogResponse> {
  return fetch("/api/catalog").then((response) => readJson<CatalogResponse>(response));
}

export function fetchWikiList(): Promise<WikiSummary[]> {
  return fetch("/api/wiki")
    .then((response) => readJson<{ pages: WikiSummary[] }>(response))
    .then((data) => data.pages);
}

export function fetchWikiPage(slug: string): Promise<WikiPage> {
  return fetch(`/api/wiki/${slug}`).then((response) => readJson<WikiPage>(response));
}

export type LlmStatus = {
  configured: boolean;
  default_model: string;
  default_base_url: string;
};

export function fetchLlmStatus(): Promise<LlmStatus> {
  return fetch("/api/llm").then((response) => readJson<LlmStatus>(response));
}

export type LlmProbe = {
  ok: boolean;
  model?: string;
  error?: string;
};

export function testLlmConnection(llm: LlmConfig): Promise<LlmProbe> {
  return fetch("/api/llm/test", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: llm.apiKey,
      base_url: llm.baseUrl,
      model: llm.model,
    }),
  }).then((response) => readJson<LlmProbe>(response));
}

type ChatHandlers = {
  onCitations: (citations: Citation[]) => void;
  onToken: (text: string) => void;
};

export async function streamChat(
  message: string,
  history: ChatMessage[],
  quoteSummary: string,
  handlers: ChatHandlers,
  llm?: LlmConfig,
): Promise<void> {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message,
      quote_summary: quoteSummary,
      history: history.map((item) => ({ role: item.role, content: item.content })),
      llm: llm
        ? {
            api_key: llm.apiKey,
            base_url: llm.baseUrl,
            model: llm.model,
          }
        : undefined,
    }),
  });

  if (!response.ok || !response.body) {
    const detail = await response.text();
    throw new Error(detail || "助手暂时无法回答");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split("\n\n");
    buffer = parts.pop() ?? "";
    for (const part of parts) {
      const line = part
        .split("\n")
        .filter((row) => row.startsWith("data:"))
        .map((row) => row.slice(5).trim())
        .join("");
      if (!line) {
        continue;
      }
      const event = JSON.parse(line) as {
        type: string;
        citations?: Citation[];
        text?: string;
      };
      if (event.type === "citations" && event.citations) {
        handlers.onCitations(event.citations);
      }
      if (event.type === "token" && event.text) {
        handlers.onToken(event.text);
      }
    }
  }
}
