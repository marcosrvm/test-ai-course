import type { Metadata } from "next";
import { SiteFooter } from "@/components/sites/smileunion/SiteFooter";
import { SiteHeader } from "@/components/sites/smileunion/SiteHeader";
import { SuitabilityQuiz } from "@/components/sites/smileunion/SuitabilityQuiz";
import "@/components/sites/smileunion/smileunion.css";

export const metadata: Metadata = {
  title: "Bin ich geeignet?",
  description: "Ist deine Fehlstellung für unsichtbare Zahnschienen geeignet? Erhalte eine erste Einschätzung in 30 Sekunden.",
};

export default function SuitabilityPage() {
  return (
    <div className="su-page">
      <SiteHeader />
      <main>
        <SuitabilityQuiz variant="original" />
      </main>
      <SiteFooter />
    </div>
  );
}
