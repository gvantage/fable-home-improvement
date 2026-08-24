import { useRef, useState, type ChangeEvent } from "react";
import { useQuote } from "../lib/QuoteContext";
import {
  defaultPriceSetName,
  downloadPriceSetFile,
  extractPrices,
  formatPriceSetTime,
  parsePriceSetPayload,
} from "../lib/quote";

const inputClass =
  "w-full border-0 border-b border-rule bg-transparent px-0 py-1.5 text-ink outline-none transition-colors duration-200 focus:border-copper";

export function PriceSetBar() {
  const { quote, priceSets, saveCurrentPrices, applyPriceSet, removeSavedPriceSet, importPriceSet } =
    useQuote();
  const [name, setName] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  if (!quote) {
    return null;
  }

  const currentQuote = quote;

  function handleSave() {
    const saved = saveCurrentPrices(name.trim() || defaultPriceSetName());
    if (!saved) {
      return;
    }
    setName(saved.name);
    setStatus(`已保存「${saved.name}」，共 ${saved.prices.length} 项单价。`);
    setPendingDeleteId(null);
  }

  function handleLoad(id: string) {
    applyPriceSet(id);
    const selected = priceSets.find((set) => set.id === id);
    if (selected) {
      setName(selected.name);
      setStatus(`已载入「${selected.name}」的单价，数量未改。`);
    }
    setPendingDeleteId(null);
  }

  function handleDelete(id: string) {
    if (pendingDeleteId !== id) {
      setPendingDeleteId(id);
      return;
    }
    const selected = priceSets.find((set) => set.id === id);
    removeSavedPriceSet(id);
    setPendingDeleteId(null);
    setStatus(selected ? `已删除「${selected.name}」。` : "已删除这套单价。");
  }

  function handleDownload() {
    const label = name.trim() || defaultPriceSetName();
    downloadPriceSetFile(label, extractPrices(currentQuote));
    setStatus(`已下载「${label}」的 JSON。`);
  }

  async function handleImport(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }
    try {
      const parsed = parsePriceSetPayload(JSON.parse(await file.text()));
      if (!parsed) {
        setStatus("这个文件不是装册单价套。");
        return;
      }
      const saved = importPriceSet(parsed);
      if (saved) {
        setName(saved.name);
        setStatus(`已导入并载入「${saved.name}」。`);
      }
    } catch {
      setStatus("文件读不出来。");
    }
  }

  return (
    <section className="mt-6 border-y border-rule py-5">
      <p className="text-xs text-muted">单价套</p>
      <div className="mt-3 flex flex-col gap-3 lg:flex-row lg:items-end">
        <div className="min-w-0 flex-1">
          <label className="text-xs text-muted" htmlFor="price-set-name">
            名称
          </label>
          <input
            id="price-set-name"
            className={`${inputClass} mt-1`}
            placeholder="例如：甲公司报价"
            value={name}
            onChange={(event) => setName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                handleSave();
              }
            }}
          />
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
          <button
            type="button"
            className="min-h-11 cursor-pointer text-copper hover:text-copper-dark"
            onClick={handleSave}
          >
            保存当前单价
          </button>
          <button
            type="button"
            className="min-h-11 cursor-pointer text-muted hover:text-ink"
            onClick={handleDownload}
          >
            下载 JSON
          </button>
          <button
            type="button"
            className="min-h-11 cursor-pointer text-muted hover:text-ink"
            onClick={() => fileRef.current?.click()}
          >
            导入
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="sr-only"
            aria-label="导入单价套 JSON"
            onChange={handleImport}
          />
        </div>
      </div>
      <p className="mt-2 text-xs text-muted">
        只记下各项目单价，数量和房屋信息不动。名称相同会覆盖。数据留在这台电脑，也可下载备份。
      </p>
      {status ? (
        <p className="mt-2 text-sm text-copper" role="status">
          {status}
        </p>
      ) : null}
      {priceSets.length > 0 ? (
        <ul className="mt-4 divide-y divide-rule">
          {priceSets.map((set) => (
            <li key={set.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
              <div className="min-w-0">
                <p className="truncate">{set.name}</p>
                <p className="text-xs text-muted">
                  {formatPriceSetTime(set.savedAt)} · {set.prices.length} 项
                </p>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <button
                  type="button"
                  className="min-h-11 cursor-pointer text-copper hover:text-copper-dark"
                  onClick={() => handleLoad(set.id)}
                >
                  载入
                </button>
                <button
                  type="button"
                  className={`min-h-11 cursor-pointer ${
                    pendingDeleteId === set.id ? "text-copper" : "text-muted hover:text-ink"
                  }`}
                  aria-label={pendingDeleteId === set.id ? `确认删除${set.name}` : `删除${set.name}`}
                  onClick={() => handleDelete(set.id)}
                >
                  {pendingDeleteId === set.id ? "确认删除" : "删除"}
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-sm text-muted">还没有保存过单价套。填好单价后点保存，就能对照几家公司的报价。</p>
      )}
    </section>
  );
}
