import { ExpenseQuickEntry } from "@/components/ExpenseQuickEntry";
import { getBudgetData } from "@/lib/data";

export default async function ExpensesPage() {
  const data = await getBudgetData();
  return <ExpenseQuickEntry data={data} />;
}
