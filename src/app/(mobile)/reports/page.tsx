import { ReportsTabs } from "@/components/ReportsTabs";
import { budgetData } from "@/lib/mock-data";

export default function ReportsPage() {
  return <ReportsTabs data={budgetData} />;
}
