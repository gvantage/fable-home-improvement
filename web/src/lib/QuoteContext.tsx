import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { fetchCatalog } from "./api";
import {
  addItem,
  applyPrices,
  extractPrices,
  fromCatalog,
  loadPriceSets,
  loadQuote,
  persistPriceSets,
  removeItem,
  resetQuote,
  saveQuote,
  updateHouse,
  updateItem,
  upsertPriceSetFromEntries,
  deletePriceSet,
} from "./quote";
import type {
  CatalogResponse,
  HouseProfile,
  LineItem,
  PriceEntry,
  PriceSet,
  QuoteState,
} from "./types";

type QuoteContextValue = {
  quote: QuoteState | null;
  catalog: CatalogResponse | null;
  loading: boolean;
  error: string | null;
  priceSets: PriceSet[];
  setHouse: (patch: Partial<HouseProfile>) => void;
  setItem: (categoryName: string, itemId: string, patch: Partial<LineItem>) => void;
  deleteItem: (categoryName: string, itemId: string) => void;
  createItem: (categoryName: string, draft: Omit<LineItem, "id">) => void;
  restoreTemplate: () => void;
  saveCurrentPrices: (name: string) => PriceSet | null;
  applyPriceSet: (id: string) => void;
  removeSavedPriceSet: (id: string) => void;
  importPriceSet: (payload: { name: string; prices: PriceEntry[] }) => PriceSet | null;
};

const QuoteContext = createContext<QuoteContextValue | null>(null);

export function QuoteProvider({ children }: { children: ReactNode }) {
  const [quote, setQuote] = useState<QuoteState | null>(null);
  const [catalog, setCatalog] = useState<CatalogResponse | null>(null);
  const [priceSets, setPriceSets] = useState<PriceSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setPriceSets(loadPriceSets());
    fetchCatalog()
      .then((data) => {
        setCatalog(data);
        setQuote(loadQuote(data));
      })
      .catch(() => {
        setError("工册模板加载失败，请确认后端已启动。");
        setQuote(fromCatalog({ categories: [] }));
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (quote && catalog) {
      saveQuote(quote);
    }
  }, [quote, catalog]);

  const value = useMemo<QuoteContextValue>(
    () => ({
      quote,
      catalog,
      loading,
      error,
      priceSets,
      setHouse: (patch) => setQuote((current) => (current ? updateHouse(current, patch) : current)),
      setItem: (categoryName, itemId, patch) =>
        setQuote((current) => (current ? updateItem(current, categoryName, itemId, patch) : current)),
      deleteItem: (categoryName, itemId) =>
        setQuote((current) => (current ? removeItem(current, categoryName, itemId) : current)),
      createItem: (categoryName, draft) =>
        setQuote((current) => (current ? addItem(current, categoryName, draft) : current)),
      restoreTemplate: () => {
        if (catalog) {
          setQuote(resetQuote(catalog));
        }
      },
      saveCurrentPrices: (name) => {
        if (!quote) {
          return null;
        }
        const { sets, saved } = upsertPriceSetFromEntries(priceSets, name, extractPrices(quote));
        persistPriceSets(sets);
        setPriceSets(sets);
        return saved;
      },
      applyPriceSet: (id) => {
        const selected = priceSets.find((set) => set.id === id);
        if (!selected) {
          return;
        }
        setQuote((current) => (current ? applyPrices(current, selected.prices) : current));
      },
      removeSavedPriceSet: (id) => {
        setPriceSets((current) => {
          const next = deletePriceSet(current, id);
          persistPriceSets(next);
          return next;
        });
      },
      importPriceSet: (payload) => {
        setQuote((current) => (current ? applyPrices(current, payload.prices) : current));
        const { sets, saved } = upsertPriceSetFromEntries(priceSets, payload.name, payload.prices);
        persistPriceSets(sets);
        setPriceSets(sets);
        return saved;
      },
    }),
    [quote, catalog, loading, error, priceSets],
  );

  return <QuoteContext.Provider value={value}>{children}</QuoteContext.Provider>;
}

export function useQuote(): QuoteContextValue {
  const value = useContext(QuoteContext);
  if (!value) {
    throw new Error("useQuote 必须在 QuoteProvider 内使用");
  }
  return value;
}
