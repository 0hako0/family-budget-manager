import { ExpenseQuickEntry } from "@/components/ExpenseQuickEntry";
import { budgetData } from "@/lib/mock-data";

export default function ExpensesPage() {
  return <ExpenseQuickEntry data={budgetData} />;
}
