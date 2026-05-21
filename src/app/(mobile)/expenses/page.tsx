import { ExpenseQuickEntry } from "@/components/ExpenseQuickEntry";
import { getBudgetData } from "@/lib/data";

export default async function ExpensesPage({ searchParams }: { searchParams?: { error?: string } }) {
  const data = await getBudgetData();
  return <ExpenseQuickEntry data={data} errorMessage={searchParams?.error} />;
}
