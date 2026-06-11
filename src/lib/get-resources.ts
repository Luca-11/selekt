import { cache } from "react";
import { fallbackBrands } from "@/lib/brands-fallback";
import { fallbackAccounts, fallbackRetailers } from "@/lib/resources-fallback";
import { fetchAllResourcesFromNotion, isNotionConfigured } from "@/lib/notion";
import type { Brand } from "@/types/brand";
import type { ExploreResource } from "@/types/resource";

export type DataSource = "notion" | "fallback";

export interface ResourceBundle {
  brands: Brand[];
  retailers: ExploreResource[];
  accounts: ExploreResource[];
  source: DataSource;
}

function withFallback<T>(items: T[], fallback: T[]): T[] {
  return items.length > 0 ? items : fallback;
}

async function loadResources(): Promise<ResourceBundle> {
  if (!isNotionConfigured()) {
    return {
      brands: fallbackBrands,
      retailers: fallbackRetailers,
      accounts: fallbackAccounts,
      source: "fallback",
    };
  }

  try {
    const data = await fetchAllResourcesFromNotion();

    return {
      brands: withFallback(data.brands, fallbackBrands),
      retailers: withFallback(data.retailers, fallbackRetailers),
      accounts: withFallback(data.accounts, fallbackAccounts),
      source: "notion",
    };
  } catch (error) {
    console.error("[getResources] Erreur Notion, fallback local:", error);
    return {
      brands: fallbackBrands,
      retailers: fallbackRetailers,
      accounts: fallbackAccounts,
      source: "fallback",
    };
  }
}

export const getResources = cache(loadResources);

export async function getBrands(): Promise<{ brands: Brand[]; source: DataSource }> {
  const { brands, source } = await getResources();
  return { brands, source };
}

export async function getRetailers(): Promise<{
  retailers: ExploreResource[];
  source: DataSource;
}> {
  const { retailers, source } = await getResources();
  return { retailers, source };
}

export async function getAccounts(): Promise<{
  accounts: ExploreResource[];
  source: DataSource;
}> {
  const { accounts, source } = await getResources();
  return { accounts, source };
}
