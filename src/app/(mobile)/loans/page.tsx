import { FixedItemsTabs } from "@/components/FixedItemsTabs";
import { getBudgetData } from "@/lib/data";

export default async function LoansPage({ searchParams }: { searchParams?: { error?: string } }) {
  const data = await getBudgetData();
  return <FixedItemsTabs data={data} initialTab="ローン" errorMessage={searchParams?.error} />;
}
