import type { Metadata } from "next";
import { ChatWidget } from "@/components/chatbot/ChatWidget";
import { HeaderV2 } from "@/components/sites/smileunion/HeaderV2";
import {
  About,
  Benefits,
  HeroV2,
  Media,
  Order,
  Pricing,
  Qualifications,
  Steps,
} from "@/components/sites/smileunion/HomeSections";
import { SiteFooter } from "@/components/sites/smileunion/SiteFooter";
import { footerNavV2, links } from "@/components/sites/smileunion/content";
import "@/components/sites/smileunion/smileunion.css";

export const metadata: Metadata = {
  title: "Unsichtbare Zahnkorrektur vom Testsieger - schon ab 26€ pro Monat!",
  description: "Gerade Zähne mit unsichtbaren Zahnschienen – ärztlich betreut, ab 30€ pro Monat.",
};

export default function HomeV2() {
  return (
    <div className="su-page">
      <HeaderV2 />
      <main>
        <HeroV2 />
        <Qualifications />
        <About suitabilityHref={links.suitabilityV2} />
        <Steps />
        <Pricing />
        <Benefits />
        <Order />
        <Media />
      </main>
      <SiteFooter navItems={footerNavV2} />
      <ChatWidget />
    </div>
  );
}
