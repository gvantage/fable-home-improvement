import { Check, Circle, Eye, EyeSlash, GearSix, WarningCircle } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { fetchLlmStatus, testLlmConnection, type LlmStatus } from "../lib/api";
import {
  LLM_PRESETS,
  hasLocalApiKey,
  loadLlmConfig,
  saveLlmConfig,
  type LlmConfig,
} from "../lib/llmSettings";

const inputClass =
  "w-full border-0 border-b border-rule bg-transparent px-0 py-1.5 text-ink outline-none transition-colors duration-200 focus:border-copper";

type Probe = {
  state: "idle" | "testing" | "ok" | "fail";
  detail?: string;
};

type LlmSettingsBarProps = {
  onChange: (config: LlmConfig) => void;
};

export function LlmSettingsBar({ onChange }: LlmSettingsBarProps) {
  const [open, setOpen] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [config, setConfig] = useState<LlmConfig>(loadLlmConfig);
  const [status, setStatus] = useState<LlmStatus | null>(null);
  const [probe, setProbe] = useState<Probe>({ state: "idle" });

  useEffect(() => {
    onChange(config);
    fetchLlmStatus()
      .then((data) => {
        setStatus(data);
        if (hasLocalApiKey(config) || data.configured) {
          void probeNow();
        }
      })
      .catch(() => setStatus(null));
  }, []);

  function update(patch: Partial<LlmConfig>) {
    const next = { ...config, ...patch };
    setConfig(next);
    saveLlmConfig(next);
    onChange(next);
    setProbe({ state: "idle" });
  }

  async function probeNow(next = config) {
    setProbe({ state: "testing" });
    try {
      const result = await testLlmConnection(next);
      setProbe(
        result.ok
          ? { state: "ok", detail: result.model }
          : { state: "fail", detail: result.error || "连不上" },
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "检测失败";
      setProbe({ state: "fail", detail: message.slice(0, 180) });
    }
  }

  function toggle() {
    const nextOpen = !open;
    setOpen(nextOpen);
    if (nextOpen && probe.state === "idle") {
      void probeNow();
    }
  }

  const ready = hasLocalApiKey(config) || Boolean(status?.configured);

  return (
    <div className="mt-4 border-b border-rule pb-4">
      <div className="flex items-center justify-between gap-3">
        <StatusMark probe={probe} ready={ready} />
        <button
          type="button"
          className="inline-flex cursor-pointer items-center gap-1 text-sm text-muted hover:text-ink"
          onClick={toggle}
          aria-expanded={open}
        >
          <GearSix size={16} />
          模型设置
        </button>
      </div>

      {open ? (
        <div className="mt-4 space-y-3">
          <p className="text-xs text-muted">兼容 OpenAI 接口。填好后点测试，确认能连上再提问。</p>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
            {LLM_PRESETS.map((preset) => {
              const active = config.baseUrl === preset.baseUrl;
              return (
                <button
                  key={preset.name}
                  type="button"
                  className={`cursor-pointer ${
                    active ? "text-copper" : "text-muted hover:text-ink"
                  }`}
                  onClick={() =>
                    update({
                      baseUrl: preset.baseUrl,
                      model: preset.model,
                    })
                  }
                >
                  {preset.name}
                </button>
              );
            })}
          </div>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-muted">API 密钥</span>
            <div className="flex items-center gap-2">
              <input
                className={inputClass}
                type={showKey ? "text" : "password"}
                autoComplete="off"
                spellCheck={false}
                value={config.apiKey}
                onChange={(event) => update({ apiKey: event.target.value })}
              />
              <button
                type="button"
                className="cursor-pointer text-muted hover:text-ink"
                aria-label={showKey ? "隐藏密钥" : "显示密钥"}
                onClick={() => setShowKey((current) => !current)}
              >
                {showKey ? <EyeSlash size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-muted">接口地址</span>
            <input
              className={inputClass}
              type="url"
              spellCheck={false}
              value={config.baseUrl}
              onChange={(event) => update({ baseUrl: event.target.value })}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-muted">模型名</span>
            <input
              className={inputClass}
              spellCheck={false}
              value={config.model}
              onChange={(event) => update({ model: event.target.value })}
            />
          </label>
          <div className="flex items-center justify-between gap-3 pt-1">
            <button
              type="button"
              className="cursor-pointer text-sm text-copper hover:text-copper-dark disabled:opacity-50"
              disabled={probe.state === "testing"}
              onClick={() => void probeNow()}
            >
              {probe.state === "testing" ? "检测中…" : "测试连接"}
            </button>
            {probe.state === "fail" && probe.detail ? (
              <p className="min-w-0 text-right text-xs text-copper">{probe.detail}</p>
            ) : null}
            {probe.state === "ok" ? (
              <p className="text-xs text-muted">可以用这个配置提问</p>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function StatusMark({ probe, ready }: { probe: Probe; ready: boolean }) {
  if (probe.state === "testing") {
    return (
      <p className="flex items-center gap-1.5 text-xs text-muted">
        <Circle size={10} className="animate-pulse" />
        检测中
      </p>
    );
  }
  if (probe.state === "ok") {
    return (
      <p className="flex items-center gap-1.5 text-xs text-ink">
        <Check size={12} />
        已连通
      </p>
    );
  }
  if (probe.state === "fail") {
    return (
      <p className="flex items-center gap-1.5 text-xs text-copper">
        <WarningCircle size={12} />
        连不上
      </p>
    );
  }
  if (!ready) {
    return (
      <p className="flex items-center gap-1.5 text-xs text-copper">
        <Circle size={10} />
        未配置
      </p>
    );
  }
  return (
    <p className="flex items-center gap-1.5 text-xs text-muted">
      <Circle size={10} />
      未测试
    </p>
  );
}
