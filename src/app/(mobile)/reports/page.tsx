import { ReportsTabs } from "@/components/ReportsTabs";
import { getCategoryBudgetSuggestions } from "@/lib/budget";
import { getBudgetData } from "@/lib/data";

export default async function ReportsPage() {
  const data = await getBudgetData();
  const budgetSuggestions = getCategoryBudgetSuggestions(data);
  return <ReportsTabs data={data} budgetSuggestions={budgetSuggestions} />;
}
