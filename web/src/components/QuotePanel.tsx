import { Plus, Trash } from "@phosphor-icons/react";
import { useState, type ReactNode } from "react";
import { PriceSetBar } from "./PriceSetBar";
import { useQuote } from "../lib/QuoteContext";
import {
  categoryTotal,
  formatMoney,
  grandTotal,
  lineSubtotal,
  questionForItem,
} from "../lib/quote";
import { PACKAGE_OPTIONS } from "../lib/quote";
import type { Category, LineItem } from "../lib/types";

type QuotePanelProps = {
  onAsk: (question: string) => void;
};

export function QuotePanel({ onAsk }: QuotePanelProps) {
  const { quote, loading, error, setHouse, setItem, deleteItem, createItem, restoreTemplate } =
    useQuote();

  if (loading || !quote) {
    return (
      <div className="space-y-4 py-8" aria-busy="true" aria-label="正在载入工册">
        <div className="h-16 animate-pulse bg-wash" />
        <div className="h-40 animate-pulse bg-wash" />
      </div>
    );
  }

  const total = grandTotal(quote);
  const empty = total === 0;

  return (
    <section className="py-6 md:py-8">
      {error ? (
        <p className="mb-4 text-sm text-copper" role="alert">
          {error}
        </p>
      ) : null}

      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-sm text-copper">工册合计</p>
          <p className="mt-1 font-mono text-4xl tracking-tight text-copper tabular-nums">
            ¥ {formatMoney(total)}
          </p>
        </div>
        <button
          type="button"
          className="cursor-pointer text-sm text-muted underline-offset-4 hover:text-ink hover:underline"
          onClick={restoreTemplate}
        >
          恢复模板
        </button>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4 border-y border-rule py-5 md:grid-cols-4">
        <Field label="套内面积" htmlFor="house-area">
          <input
            id="house-area"
            className={inputClass}
            type="number"
            min={0}
            inputMode="decimal"
            value={quote.house.area ?? ""}
            onChange={(event) =>
              setHouse({ area: event.target.value === "" ? null : Number(event.target.value) })
            }
          />
        </Field>
        <Field label="装修模式" htmlFor="house-package">
          <select
            id="house-package"
            className={inputClass}
            value={quote.house.packageType}
            onChange={(event) =>
              setHouse({ packageType: event.target.value as (typeof PACKAGE_OPTIONS)[number] })
            }
          >
            {PACKAGE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </Field>
        <Field label="卫生间数" htmlFor="house-bathrooms">
          <input
            id="house-bathrooms"
            className={inputClass}
            type="number"
            min={0}
            inputMode="numeric"
            value={quote.house.bathrooms}
            onChange={(event) => setHouse({ bathrooms: Number(event.target.value) || 0 })}
          />
        </Field>
        <label className="flex cursor-pointer items-end gap-2 pb-1 text-sm">
          <input
            type="checkbox"
            className="size-4 accent-copper"
            checked={quote.house.encloseBalcony}
            onChange={(event) => setHouse({ encloseBalcony: event.target.checked })}
          />
          封阳台
        </label>
      </div>

      <p className="mt-3 text-sm text-muted">
        卫生间数量只预填马桶、花洒等件数，不会改单价。参考价请对照知识页，不要当作行情库。
      </p>

      <PriceSetBar />

      {empty ? (
        <p className="mt-6 border-l-2 border-copper pl-3 text-sm text-muted">
          先填几项单价和数量。右边可以问这项该怎么算、公司有没有坑。
        </p>
      ) : null}

      <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted">
        {quote.categories.map((category) => (
          <li key={category.name}>
            {category.name}
            <span className="ml-2 font-mono tabular-nums text-ink">
              {formatMoney(categoryTotal(category))}
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-8 space-y-10">
        {quote.categories.map((category) => (
          <CategoryBlock
            key={category.name}
            category={category}
            onChange={setItem}
            onDelete={deleteItem}
            onAdd={createItem}
            onAsk={onAsk}
          />
        ))}
      </div>
    </section>
  );
}

function CategoryBlock({
  category,
  onChange,
  onDelete,
  onAdd,
  onAsk,
}: {
  category: Category;
  onChange: (categoryName: string, itemId: string, patch: Partial<LineItem>) => void;
  onDelete: (categoryName: string, itemId: string) => void;
  onAdd: (categoryName: string, draft: Omit<LineItem, "id">) => void;
  onAsk: (question: string) => void;
}) {
  return (
    <section>
      <div className="flex items-baseline justify-between border-b border-ink/80 pb-2">
        <h2 className="font-serif text-xl tracking-tight">{category.name}</h2>
        <p className="font-mono text-sm tabular-nums text-copper">
          {formatMoney(categoryTotal(category))}
        </p>
      </div>
      <p className="mt-2 text-xs text-muted">小计 = 数量 × 单价。单位只是个、㎡、套这类说法。</p>
      <div className="mt-3 hidden gap-2 px-1 text-xs text-muted lg:flex">
        <span className="min-w-0 flex-[1.6]">项目</span>
        <span className="w-14 shrink-0">单位</span>
        <span className="w-20 shrink-0 text-right">数量</span>
        <span className="w-24 shrink-0 text-right">单价</span>
        <span className="w-28 shrink-0 text-right">小计</span>
        <span className="w-28 shrink-0" />
      </div>
      <ul className="divide-y divide-rule">
        {category.items.map((item) => (
          <li key={item.id} className="flex flex-col gap-3 py-3 lg:flex-row lg:items-end lg:gap-2">
            <FieldBox label="项目" className="min-w-0 flex-[1.6]">
              <input
                id={`${item.id}-name`}
                className={inputClass}
                aria-label={`${item.name}名称`}
                value={item.name}
                onChange={(event) => onChange(category.name, item.id, { name: event.target.value })}
              />
            </FieldBox>
            <FieldBox label="单位" className="w-full lg:w-14 lg:shrink-0">
              <input
                id={`${item.id}-unit`}
                className={inputClass}
                aria-label={`${item.name}单位`}
                value={item.unit}
                onChange={(event) => onChange(category.name, item.id, { unit: event.target.value })}
              />
            </FieldBox>
            <FieldBox label="数量" className="w-full lg:w-20 lg:shrink-0">
              <PriceInput
                id={`${item.id}-qty`}
                ariaLabel={`${item.name}数量`}
                value={item.quantity}
                onCommit={(quantity) => onChange(category.name, item.id, { quantity })}
              />
            </FieldBox>
            <FieldBox label="单价" className="w-full lg:w-24 lg:shrink-0">
              <PriceInput
                id={`${item.id}-price`}
                ariaLabel={`${item.name}单价`}
                value={item.price}
                onCommit={(price) => onChange(category.name, item.id, { price })}
              />
            </FieldBox>
            <FieldBox label="小计" className="w-full lg:w-28 lg:shrink-0">
              <p className="py-1.5 text-right font-mono text-sm tabular-nums">
                {formatMoney(lineSubtotal(item))}
              </p>
            </FieldBox>
            <div className="flex justify-end gap-3 lg:w-28 lg:shrink-0 lg:pb-1">
              <button
                type="button"
                className="cursor-pointer text-sm text-copper hover:text-copper-dark"
                onClick={() => onAsk(questionForItem(item))}
              >
                问这行
              </button>
              <button
                type="button"
                className="cursor-pointer text-muted hover:text-ink"
                aria-label={`删除${item.name}`}
                onClick={() => onDelete(category.name, item.id)}
              >
                <Trash size={16} />
              </button>
            </div>
          </li>
        ))}
      </ul>
      <AddRow categoryName={category.name} onAdd={onAdd} />
    </section>
  );
}

function AddRow({
  categoryName,
  onAdd,
}: {
  categoryName: string;
  onAdd: (categoryName: string, draft: Omit<LineItem, "id">) => void;
}) {
  const [name, setName] = useState("");
  const [unit, setUnit] = useState("项");
  const [price, setPrice] = useState("0");
  const [quantity, setQuantity] = useState("1");

  function submit() {
    if (!name.trim()) {
      return;
    }
    onAdd(categoryName, {
      name: name.trim(),
      unit: unit.trim() || "项",
      price: Number(price) || 0,
      quantity: Number(quantity) || 0,
    });
    setName("");
    setUnit("项");
    setPrice("0");
    setQuantity("1");
  }

  return (
    <div className="mt-2 flex flex-col gap-3 lg:flex-row lg:items-end lg:gap-2">
      <FieldBox label="项目" className="min-w-0 flex-[1.6]">
        <input
          id={`${categoryName}-new-name`}
          className={inputClass}
          placeholder="增加一项"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
      </FieldBox>
      <FieldBox label="单位" className="w-full lg:w-14 lg:shrink-0">
        <input
          className={inputClass}
          aria-label="新项目单位"
          value={unit}
          onChange={(event) => setUnit(event.target.value)}
        />
      </FieldBox>
      <FieldBox label="数量" className="w-full lg:w-20 lg:shrink-0">
        <PriceInput
          ariaLabel="新项目数量"
          value={Number(quantity) || 0}
          onCommit={(next) => setQuantity(String(next))}
        />
      </FieldBox>
      <FieldBox label="单价" className="w-full lg:w-24 lg:shrink-0">
        <PriceInput
          ariaLabel="新项目单价"
          value={Number(price) || 0}
          onCommit={(next) => setPrice(String(next))}
        />
      </FieldBox>
      <div className="lg:w-28 lg:shrink-0" />
      <button
        type="button"
        className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-1 text-sm text-copper hover:text-copper-dark lg:w-28 lg:shrink-0"
        onClick={submit}
      >
        <Plus size={16} />
        添加
      </button>
    </div>
  );
}

function PriceInput({
  id,
  ariaLabel,
  value,
  onCommit,
}: {
  id?: string;
  ariaLabel: string;
  value: number;
  onCommit: (price: number) => void;
}) {
  const [hot, setHot] = useState(false);
  const [draft, setDraft] = useState<string | null>(null);
  const shown = draft !== null ? draft : hot && value === 0 ? "" : String(value);

  function cool() {
    setHot(false);
    setDraft(null);
  }

  return (
    <input
      id={id}
      className={`${inputClass} text-right font-mono tabular-nums`}
      aria-label={ariaLabel}
      type="number"
      min={0}
      inputMode="decimal"
      value={shown}
      onMouseEnter={() => setHot(true)}
      onMouseLeave={(event) => {
        if (event.currentTarget !== document.activeElement) {
          cool();
        }
      }}
      onFocus={() => setHot(true)}
      onBlur={cool}
      onChange={(event) => {
        const raw = event.target.value;
        setDraft(raw);
        onCommit(raw === "" ? 0 : Number(raw) || 0);
      }}
    />
  );
}

function FieldBox({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={`flex min-w-0 flex-col gap-1 ${className ?? ""}`}>
      <span className="text-[11px] text-muted lg:hidden">{label}</span>
      {children}
    </div>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs text-muted" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
    </div>
  );
}

const inputClass =
  "w-full border-0 border-b border-rule bg-transparent px-0 py-1.5 text-ink outline-none transition-colors duration-200 focus:border-copper";
