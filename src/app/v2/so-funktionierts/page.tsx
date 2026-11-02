import type { Metadata } from "next";
import { ChatWidget } from "@/components/chatbot/ChatWidget";
import { HeaderV2 } from "@/components/sites/smileunion/HeaderV2";
import {
  HowItWorksCare,
  HowItWorksHero,
  HowItWorksTimeline,
} from "@/components/sites/smileunion/HowItWorksSections";
import { SiteFooter } from "@/components/sites/smileunion/SiteFooter";
import "@/components/sites/smileunion/smileunion.css";

export const metadata: Metadata = {
  title: "So funktioniert's",
};

export default function HowItWorksPageV2() {
  return (
    <div className="su-page su-subpage">
      <HeaderV2 />
      <main>
        <HowItWorksHero />
        <HowItWorksTimeline />
        <HowItWorksCare />
      </main>
      <SiteFooter v2 />
      <ChatWidget />
    </div>
  );
}
