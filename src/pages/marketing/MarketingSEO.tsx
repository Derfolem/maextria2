import { MarketingNavbar } from "@/components/marketing/MarketingNavbar";
import { SEOManager } from "@/components/marketing/SEOManager";

export default function MarketingSEO() {
  return (
    <div className="min-h-screen bg-background">
      <MarketingNavbar />
      <div className="container mx-auto px-4 py-8">
        <SEOManager />
      </div>
    </div>
  );
}