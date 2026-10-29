// Types for the structured tool catalog. One JSON file per tool lives in content/tools/.
export type PricingStatus = "verified" | "partial" | "unverified";
export type PricingModel = "free" | "freemium" | "free-trial" | "paid" | "usage-based" | "contact-sales" | "open-source" | "unknown";
export type PlanAudience = "individual" | "team" | "business" | "enterprise" | "api";
export type MerchantCurrency = "USD" | "GBP" | "EUR" | "PKR" | "CAD" | "AUD";

export type Plan = {
  name: string;
  audience: PlanAudience;
  currency: MerchantCurrency;
  unit: string;
  /** Price when billed monthly, in the merchant's currency. */
  monthly?: number;
  /** Per-month price when billed annually. */
  annual?: number;
  /** Total charged for a year, when the page states it. */
  annualTotal?: number;
  custom?: boolean;
  billing?: string;
  highlights?: string[];
  limits?: string[];
  note?: string;
};

export type Pricing = {
  status: PricingStatus;
  model: PricingModel;
  checked: string;
  source: string;
  free?: { available: boolean; details?: string };
  trial?: string;
  plans: Plan[];
  api?: { summary: string; source: string };
  regional?: string;
  notes?: string[];
  reference?: { plan: string; amount: number; currency: MerchantCurrency; per: string; billing: string };
  blockedReason?: string;
};

export type SourceLink = { label: string; url: string; type: "pricing" | "official" | "news" | "docs"; checked: string };

export type ToolRecord = {
  id: string;
  name: string;
  vendor: string;
  website: string;
  category: string;
  categories: string[];
  tagline: string;
  description: string;
  features: string[];
  useCases: string[];
  audience: string[];
  strengths: string[];
  limitations: string[];
  alternatives: string[];
  platforms?: string[];
  integrations?: string[];
  aliases?: string[];
  tags?: string[];
  hue: number;
  review?: string;
  subcategory?: string;
  added: string;
  openSource?: { status: "open-source" | "source-available" | "open-weights" | "proprietary"; note: string; source: string };
  verified: string;
  status: "active" | "unavailable" | "renamed";
  pricing: Pricing;
  sources: SourceLink[];
};

/** The light-weight entry used by cards, filters and the comparison table. */
export type Tool = {
  id: string;
  name: string;
  vendor: string;
  category: string;
  subcategory: string | null;
  categories: string[];
  tagline: string;
  description: string;
  keyFeature: string;
  trial: boolean;
  openSource: "open-source" | "source-available" | "open-weights" | "proprietary" | null;
  added: string;
  bestFor: string;
  officialUrl: string;
  hue: number;
  review?: string;
  /** true/false only when documented; null when the pricing page does not say. */
  freePlan: boolean | null;
  pricingModel: PricingModel;
  pricingStatus: PricingStatus;
  fromUsd: number | null;
  verified: string;
  checked: string;
  pricingSource: string;
  plans: { name: string; price: string }[];
};
