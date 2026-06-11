import type { ExploreResource } from "@/types/resource";

export type ResourceSortOption = "name" | "name-desc";

export function buildResourceCategories(resources: ExploreResource[]): string[] {
  const cats = new Set(resources.map((r) => r.category).filter(Boolean));
  return ["Tout", ...Array.from(cats).sort((a, b) => a.localeCompare(b, "fr"))];
}

export function buildResourceOrigins(resources: ExploreResource[]): string[] {
  const origins = new Set<string>();
  for (const resource of resources) {
    const origin = resource.origin?.trim();
    if (origin && origin !== "–") {
      origins.add(origin);
    }
  }
  return Array.from(origins).sort((a, b) => a.localeCompare(b, "fr"));
}

export type ResourceFilterOptions = {
  category: string;
  origin?: string;
  search: string;
};

export function resourceMatchesFilters(
  resource: ExploreResource,
  options: ResourceFilterOptions,
): boolean {
  const q = options.search.trim().toLowerCase();
  const matchCat = options.category === "Tout" || resource.category === options.category;
  const matchOrigin =
    !options.origin ||
    options.origin === "Tout" ||
    resource.origin === options.origin;
  const matchSearch =
    !q ||
    resource.name.toLowerCase().includes(q) ||
    resource.desc.toLowerCase().includes(q) ||
    resource.category.toLowerCase().includes(q) ||
    (resource.contentType?.toLowerCase().includes(q) ?? false) ||
    (resource.origin?.toLowerCase().includes(q) ?? false) ||
    resource.tags.some((t) => t.toLowerCase().includes(q));

  return matchCat && matchOrigin && matchSearch;
}

export function filterResources(resources: ExploreResource[], options: ResourceFilterOptions): ExploreResource[] {
  return resources.filter((resource) => resourceMatchesFilters(resource, options));
}

export function sortResources(
  resources: ExploreResource[],
  sort: ResourceSortOption,
): ExploreResource[] {
  const copy = [...resources];
  copy.sort((a, b) => {
    if (sort === "name-desc") {
      return b.name.localeCompare(a.name, "fr");
    }
    return a.name.localeCompare(b.name, "fr");
  });
  return copy;
}

export const RESOURCE_SORT_LABELS: Record<ResourceSortOption, string> = {
  name: "Nom (A → Z)",
  "name-desc": "Nom (Z → A)",
};
