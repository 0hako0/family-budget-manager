import { FixedItemsTabs } from "@/components/FixedItemsTabs";
import { getBudgetData } from "@/lib/data";

export default async function SavingsPage({ searchParams }: { searchParams?: { error?: string } }) {
  const data = await getBudgetData();
  return <FixedItemsTabs data={data} initialTab="貯金・投資" errorMessage={searchParams?.error} />;
}
