import type { Metadata } from "next";
import { ChatWidget } from "@/components/chatbot/ChatWidget";
import { HeaderV2 } from "@/components/sites/smileunion/HeaderV2";
import {
  PricingAdvantages,
  PricingComparison,
  PricingHero,
  PricingLevels,
  PricingSteps,
} from "@/components/sites/smileunion/PricingPageSections";
import { SiteFooter } from "@/components/sites/smileunion/SiteFooter";
import "@/components/sites/smileunion/smileunion.css";

export const metadata: Metadata = {
  title: "Preise",
};

export default function PricingPageV2() {
  return (
    <div className="su-page su-subpage">
      <HeaderV2 />
      <main>
        <PricingHero />
        <PricingSteps />
        <PricingComparison />
        <PricingLevels />
        <PricingAdvantages />
      </main>
      <SiteFooter v2 />
      <ChatWidget />
    </div>
  );
}
