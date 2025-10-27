import { MarketingNavbar } from "@/components/marketing/MarketingNavbar";
import { CRMLeads } from "@/components/marketing/CRMLeads";

export default function MarketingCRM() {
  return (
    <div className="min-h-screen bg-background">
      <MarketingNavbar />
      <div className="container mx-auto px-4 py-8">
        <CRMLeads />
      </div>
    </div>
  );
}