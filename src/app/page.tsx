import type { Metadata } from "next";
import {
  About,
  Benefits,
  Hero,
  Media,
  Order,
  Pricing,
  Qualifications,
  Steps,
} from "@/components/sites/smileunion/HomeSections";
import { SiteFooter } from "@/components/sites/smileunion/SiteFooter";
import { SiteHeader } from "@/components/sites/smileunion/SiteHeader";
import "@/components/sites/smileunion/smileunion.css";

export const metadata: Metadata = {
  title: "Unsichtbare Zahnkorrektur vom Testsieger - schon ab 26€ pro Monat!",
  description: "Gerade Zähne mit unsichtbaren Zahnschienen – ärztlich betreut, ab 30€ pro Monat.",
};

export default function Home() {
  return (
    <div className="su-page">
      <SiteHeader />
      <main>
        <Hero />
        <Qualifications />
        <About />
        <Steps />
        <Pricing />
        <Benefits />
        <Order />
        <Media />
      </main>
      <SiteFooter />
    </div>
  );
}
