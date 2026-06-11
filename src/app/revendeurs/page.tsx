import { ExploreApp } from "@/components/ExploreApp";
import { getRetailers } from "@/lib/get-resources";

export const metadata = {
  title: "Revendeurs — Selekt",
  description: "Revendeurs de confiance pour retrouver des pièces streetwear, sneakers et créateurs.",
};

export const revalidate = 300;

export default async function RetailersPage() {
  const { retailers, source } = await getRetailers();
  return <ExploreApp resources={retailers} source={source} variant="retailer" />;
}
