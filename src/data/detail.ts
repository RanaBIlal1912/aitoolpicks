// Descriptive fields for every tool (features, use cases, audience, strengths, limitations, platforms), generated from content/tools.
// Imported only by search, comparison and alternatives, so pages that just list tools do not pay for it.
import detail from "./generated/catalog-detail.json";

export type ToolDetail = {
  features: string[];
  useCases: string[];
  audience: string[];
  strengths: string[];
  limitations: string[];
  platforms: string[];
  alternatives: string[];
  api: string | null;
  freeDetails: string | null;
  trialDetails: string | null;
};

const DETAIL = detail as Record<string, ToolDetail>;

export function getDetail(id: string): ToolDetail | undefined {
  return DETAIL[id];
}
