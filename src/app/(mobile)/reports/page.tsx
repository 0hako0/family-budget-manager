import { ReportsTabs } from "@/components/ReportsTabs";
import { getBudgetData } from "@/lib/data";

export default async function ReportsPage() {
  const data = await getBudgetData();
  return <ReportsTabs data={data} />;
}
