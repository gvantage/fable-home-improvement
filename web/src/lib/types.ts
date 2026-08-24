export type PackageType = "半包" | "全包" | "清包";

export type HouseProfile = {
  area: number | null;
  packageType: PackageType;
  bathrooms: number;
  encloseBalcony: boolean;
};

export type LineItem = {
  id: string;
  name: string;
  unit: string;
  price: number;
  quantity: number;
};

export type Category = {
  name: string;
  items: LineItem[];
};

export type QuoteState = {
  house: HouseProfile;
  categories: Category[];
};

export type PriceEntry = {
  category: string;
  name: string;
  price: number;
};

export type PriceSet = {
  id: string;
  name: string;
  savedAt: string;
  prices: PriceEntry[];
};

export type CatalogResponse = {
  categories: Category[];
};

export type WikiSummary = {
  slug: string;
  title: string;
  type: string;
  section: string;
  tags: string[];
  aliases: string[];
};

export type WikiLink = {
  slug: string;
  title: string;
  exists: boolean;
};

export type WikiPage = WikiSummary & {
  body: string;
  markdown: string;
  links: WikiLink[];
  sources: string[];
  headings: string[];
};

export type Citation = {
  slug: string;
  title: string;
  score: number;
  type: string;
};

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
};
