import { MarketingNavbar } from "@/components/marketing/MarketingNavbar";
import { CalendarioEditorial } from "@/components/marketing/CalendarioEditorial";

export default function MarketingCalendario() {
  return (
    <div className="min-h-screen bg-background">
      <MarketingNavbar />
      <div className="container mx-auto px-4 py-8">
        <CalendarioEditorial />
      </div>
    </div>
  );
}