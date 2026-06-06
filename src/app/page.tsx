import { SelektApp } from "@/components/SelektApp";
import { getBrands } from "@/lib/get-brands";

export const revalidate = 300;

export default async function HomePage() {
  const { brands, source } = await getBrands();

  return <SelektApp brands={brands} source={source} />;
}
