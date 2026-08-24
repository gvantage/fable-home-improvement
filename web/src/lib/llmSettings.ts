export const LLM_STORAGE_KEY = "zhuangce-llm-v1";

export type LlmConfig = {
  apiKey: string;
  baseUrl: string;
  model: string;
};

export const LLM_PRESETS = [
  {
    name: "OpenRouter",
    baseUrl: "https://openrouter.ai/api/v1",
    model: "deepseek/deepseek-v4-flash-0731",
  },
  {
    name: "DeepSeek",
    baseUrl: "https://api.deepseek.com/v1",
    model: "deepseek-chat",
  },
  {
    name: "Ollama",
    baseUrl: "http://127.0.0.1:11434/v1",
    model: "qwen2.5",
  },
] as const;

export const DEFAULT_LLM_CONFIG: LlmConfig = {
  apiKey: "",
  baseUrl: LLM_PRESETS[0].baseUrl,
  model: LLM_PRESETS[0].model,
};

export function loadLlmConfig(): LlmConfig {
  try {
    const raw = localStorage.getItem(LLM_STORAGE_KEY);
    if (!raw) {
      return { ...DEFAULT_LLM_CONFIG };
    }
    const parsed = JSON.parse(raw) as Partial<LlmConfig>;
    return {
      apiKey: typeof parsed.apiKey === "string" ? parsed.apiKey : "",
      baseUrl:
        typeof parsed.baseUrl === "string" && parsed.baseUrl.trim()
          ? parsed.baseUrl.trim()
          : DEFAULT_LLM_CONFIG.baseUrl,
      model:
        typeof parsed.model === "string" && parsed.model.trim()
          ? parsed.model.trim()
          : DEFAULT_LLM_CONFIG.model,
    };
  } catch {
    return { ...DEFAULT_LLM_CONFIG };
  }
}

export function saveLlmConfig(config: LlmConfig): void {
  localStorage.setItem(LLM_STORAGE_KEY, JSON.stringify(config));
}

export function hasLocalApiKey(config: LlmConfig): boolean {
  return Boolean(config.apiKey.trim());
}
