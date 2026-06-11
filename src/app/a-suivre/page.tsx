import { ExploreApp } from "@/components/ExploreApp";
import { getAccounts } from "@/lib/get-resources";

export const metadata = {
  title: "À suivre — Selekt",
  description: "Médias, créateurs et comptes à suivre pour développer sa culture mode.",
};

export const revalidate = 300;

export default async function AccountsPage() {
  const { accounts, source } = await getAccounts();
  return <ExploreApp resources={accounts} source={source} variant="account" />;
}
