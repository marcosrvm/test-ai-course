import type { Metadata } from "next";
import { ChatWidget } from "@/components/chatbot/ChatWidget";
import { HeaderV2 } from "@/components/sites/smileunion/HeaderV2";
import { SiteFooter } from "@/components/sites/smileunion/SiteFooter";
import { SuitabilityQuiz } from "@/components/sites/smileunion/SuitabilityQuiz";
import "@/components/sites/smileunion/smileunion.css";

export const metadata: Metadata = {
  title: "Bin ich geeignet?",
  description: "Ist deine Fehlstellung für unsichtbare Zahnschienen geeignet? Erhalte eine erste Einschätzung in 30 Sekunden.",
};

export default function SuitabilityPageV2() {
  return (
    <div className="su-page">
      <HeaderV2 />
      <main>
        <SuitabilityQuiz variant="improved" />
      </main>
      <SiteFooter />
      <ChatWidget />
    </div>
  );
}
