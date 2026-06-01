import { FixedItemsTabs } from "@/components/FixedItemsTabs";
import { getBudgetData } from "@/lib/data";

export default async function IncomesPage({ searchParams }: { searchParams?: { error?: string } }) {
  const data = await getBudgetData();
  return <FixedItemsTabs data={data} initialTab="収入" errorMessage={searchParams?.error} />;
}
