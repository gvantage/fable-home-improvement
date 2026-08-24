import type {
  CatalogResponse,
  Category,
  HouseProfile,
  LineItem,
  PackageType,
  PriceEntry,
  PriceSet,
  QuoteState,
} from "./types";

export const STORAGE_KEY = "zhuangce-quote-v1";
export const PRICE_SETS_KEY = "zhuangce-price-sets-v1";
export const LAST_NOTE_KEY = "zhuangce-last-note";

export const DEFAULT_HOUSE: HouseProfile = {
  area: null,
  packageType: "半包",
  bathrooms: 1,
  encloseBalcony: false,
};

export const PACKAGE_OPTIONS: PackageType[] = ["半包", "全包", "清包"];

const QTY_HINTS: Record<string, (house: HouseProfile) => number> = {
  马桶: (house) => house.bathrooms,
  浴室柜: (house) => house.bathrooms,
  浴霸: (house) => house.bathrooms,
  面盆龙头: (house) => house.bathrooms,
  淋浴花洒套装: (house) => house.bathrooms,
  淋浴隔断: (house) => house.bathrooms,
};

export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

export function lineSubtotal(item: LineItem): number {
  return roundMoney(Number(item.price || 0) * Number(item.quantity || 0));
}

export function categoryTotal(category: Category): number {
  return roundMoney(category.items.reduce((sum, item) => sum + lineSubtotal(item), 0));
}

export function grandTotal(state: QuoteState): number {
  return roundMoney(state.categories.reduce((sum, category) => sum + categoryTotal(category), 0));
}

export function formatMoney(value: number): string {
  return new Intl.NumberFormat("zh-CN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function applyHouseHints(state: QuoteState): QuoteState {
  return {
    ...state,
    categories: state.categories.map((category) => ({
      ...category,
      items: category.items.map((item) => {
        const hint = QTY_HINTS[item.name];
        return hint ? { ...item, quantity: hint(state.house) } : item;
      }),
    })),
  };
}

export function fromCatalog(catalog: CatalogResponse): QuoteState {
  return applyHouseHints({
    house: { ...DEFAULT_HOUSE },
    categories: catalog.categories.map((category) => ({
      name: category.name,
      items: category.items.map((item) => ({ ...item })),
    })),
  });
}

function mergeCategories(template: Category[], saved: Category[]): Category[] {
  const savedMap = new Map(saved.map((category) => [category.name, category]));
  return template.map((category) => {
    const previous = savedMap.get(category.name);
    if (!previous || previous.items.length === 0) {
      return category;
    }
    const templateByName = new Map(category.items.map((item) => [item.name, item]));
    return {
      name: category.name,
      items: previous.items.map((item) => {
        const template = templateByName.get(item.name);
        if (
          template &&
          item.name === "全屋瓷砖" &&
          Number(item.quantity || 0) === 0 &&
          Number(item.price || 0) === 0
        ) {
          return { ...item, unit: template.unit };
        }
        return item;
      }),
    };
  });
}

export function loadQuote(catalog: CatalogResponse): QuoteState {
  const fresh = fromCatalog(catalog);
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return fresh;
    }
    const saved = JSON.parse(raw) as QuoteState;
    if (!Array.isArray(saved.categories)) {
      return fresh;
    }
    return {
      house: { ...DEFAULT_HOUSE, ...saved.house },
      categories: mergeCategories(fresh.categories, saved.categories),
    };
  } catch {
    return fresh;
  }
}

export function saveQuote(state: QuoteState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function resetQuote(catalog: CatalogResponse): QuoteState {
  localStorage.removeItem(STORAGE_KEY);
  return fromCatalog(catalog);
}

export function updateHouse(
  state: QuoteState,
  patch: Partial<HouseProfile>,
): QuoteState {
  const next = {
    ...state,
    house: { ...state.house, ...patch },
  };
  if (patch.bathrooms !== undefined) {
    return applyHouseHints(next);
  }
  return next;
}

export function updateItem(
  state: QuoteState,
  categoryName: string,
  itemId: string,
  patch: Partial<LineItem>,
): QuoteState {
  return {
    ...state,
    categories: state.categories.map((category) =>
      category.name === categoryName
        ? {
            ...category,
            items: category.items.map((item) =>
              item.id === itemId ? { ...item, ...patch } : item,
            ),
          }
        : category,
    ),
  };
}

export function removeItem(
  state: QuoteState,
  categoryName: string,
  itemId: string,
): QuoteState {
  return {
    ...state,
    categories: state.categories.map((category) =>
      category.name === categoryName
        ? {
            ...category,
            items: category.items.filter((item) => item.id !== itemId),
          }
        : category,
    ),
  };
}

export function addItem(
  state: QuoteState,
  categoryName: string,
  draft: Omit<LineItem, "id">,
): QuoteState {
  const item: LineItem = {
    ...draft,
    id: `${categoryName}:${draft.name}:${Date.now()}`,
  };
  return {
    ...state,
    categories: state.categories.map((category) =>
      category.name === categoryName
        ? { ...category, items: [...category.items, item] }
        : category,
    ),
  };
}

export function summarizeQuote(state: QuoteState): string {
  const lines = [
    `套内面积：${state.house.area ?? "未填"}㎡`,
    `模式：${state.house.packageType}`,
    `卫生间：${state.house.bathrooms}间`,
    `封阳台：${state.house.encloseBalcony ? "是" : "否"}`,
    `总计：${formatMoney(grandTotal(state))}元`,
  ];
  for (const category of state.categories) {
    lines.push(`${category.name}小计 ${formatMoney(categoryTotal(category))}元`);
    for (const item of category.items) {
      if (lineSubtotal(item) <= 0) {
        continue;
      }
      lines.push(
        `- ${item.name} ${item.quantity}${item.unit} × ${item.price} = ${formatMoney(lineSubtotal(item))}`,
      );
    }
  }
  return lines.join("\n");
}

export function questionForItem(item: LineItem): string {
  return `请结合 wiki，说明「${item.name}」在预算里通常怎么算、有哪些坑。当前工册这一项是 ${item.quantity}${item.unit} × ${item.price} 元。`;
}

export function saveLastNote(text: string): void {
  sessionStorage.setItem(LAST_NOTE_KEY, text);
}

export function loadLastNote(): string {
  return sessionStorage.getItem(LAST_NOTE_KEY) || "";
}

export function defaultPriceSetName(now = new Date()): string {
  const stamp = new Intl.DateTimeFormat("zh-CN", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(now);
  return `报价 ${stamp}`;
}

export function formatPriceSetTime(iso: string): string {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function extractPrices(state: QuoteState): PriceEntry[] {
  const entries: PriceEntry[] = [];
  for (const category of state.categories) {
    for (const item of category.items) {
      entries.push({
        category: category.name,
        name: item.name,
        price: Number(item.price) || 0,
      });
    }
  }
  return entries;
}

export function applyPrices(state: QuoteState, prices: PriceEntry[]): QuoteState {
  const map = new Map<string, number>();
  for (const entry of prices) {
    map.set(`${entry.category}\0${entry.name}`, Number(entry.price) || 0);
  }
  return {
    ...state,
    categories: state.categories.map((category) => ({
      ...category,
      items: category.items.map((item) => {
        const nextPrice = map.get(`${category.name}\0${item.name}`);
        return nextPrice === undefined ? item : { ...item, price: nextPrice };
      }),
    })),
  };
}

function isPriceEntry(value: unknown): value is PriceEntry {
  if (!value || typeof value !== "object") {
    return false;
  }
  const entry = value as PriceEntry;
  return (
    typeof entry.category === "string" &&
    typeof entry.name === "string" &&
    typeof entry.price === "number" &&
    Number.isFinite(entry.price)
  );
}

function isPriceSet(value: unknown): value is PriceSet {
  if (!value || typeof value !== "object") {
    return false;
  }
  const set = value as PriceSet;
  return (
    typeof set.id === "string" &&
    typeof set.name === "string" &&
    typeof set.savedAt === "string" &&
    Array.isArray(set.prices) &&
    set.prices.every(isPriceEntry)
  );
}

export function loadPriceSets(): PriceSet[] {
  try {
    const raw = localStorage.getItem(PRICE_SETS_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter(isPriceSet);
  } catch {
    return [];
  }
}

export function persistPriceSets(sets: PriceSet[]): void {
  localStorage.setItem(PRICE_SETS_KEY, JSON.stringify(sets));
}

export function upsertPriceSetFromEntries(
  sets: PriceSet[],
  name: string,
  prices: PriceEntry[],
  now = new Date(),
): { sets: PriceSet[]; saved: PriceSet } {
  const label = name.trim() || defaultPriceSetName(now);
  const saved: PriceSet = {
    id: `ps-${now.getTime()}`,
    name: label,
    savedAt: now.toISOString(),
    prices,
  };
  const index = sets.findIndex((set) => set.name === label);
  if (index >= 0) {
    saved.id = sets[index].id;
    return { sets: [saved, ...sets.filter((_, i) => i !== index)], saved };
  }
  return { sets: [saved, ...sets], saved };
}

export function deletePriceSet(sets: PriceSet[], id: string): PriceSet[] {
  return sets.filter((set) => set.id !== id);
}

export function parsePriceSetPayload(
  raw: unknown,
): { name: string; prices: PriceEntry[] } | null {
  if (Array.isArray(raw) && raw.every(isPriceEntry)) {
    return { name: defaultPriceSetName(), prices: raw };
  }
  if (!raw || typeof raw !== "object") {
    return null;
  }
  const body = raw as { name?: unknown; prices?: unknown };
  if (!Array.isArray(body.prices) || !body.prices.every(isPriceEntry)) {
    return null;
  }
  const name = typeof body.name === "string" && body.name.trim() ? body.name.trim() : defaultPriceSetName();
  return { name, prices: body.prices };
}

export function downloadPriceSetFile(name: string, prices: PriceEntry[]): void {
  const label = name.trim() || defaultPriceSetName();
  const payload = {
    name: label,
    savedAt: new Date().toISOString(),
    prices,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `装册-单价-${label}.json`;
  link.click();
  URL.revokeObjectURL(url);
}
