import { FixedItemsTabs } from "@/components/FixedItemsTabs";
import { getBudgetData } from "@/lib/data";

export default async function FixedCostsPage({ searchParams }: { searchParams?: { error?: string } }) {
  const data = await getBudgetData();
  return <FixedItemsTabs data={data} initialTab="固定費" errorMessage={searchParams?.error} />;
}
