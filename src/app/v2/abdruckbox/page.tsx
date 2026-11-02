import type { Metadata } from "next";
import { ChatWidget } from "@/components/chatbot/ChatWidget";
import { BoxCards, BoxContents, BoxHero, BoxVideos } from "@/components/sites/smileunion/BoxPageSections";
import { HeaderV2 } from "@/components/sites/smileunion/HeaderV2";
import { SiteFooter } from "@/components/sites/smileunion/SiteFooter";
import "@/components/sites/smileunion/smileunion.css";

export const metadata: Metadata = {
  title: "Abdruckbox",
};

export default function BoxPageV2() {
  return (
    <div className="su-page su-subpage">
      <HeaderV2 />
      <main>
        <BoxHero />
        <BoxContents />
        <BoxVideos />
        <BoxCards />
      </main>
      <SiteFooter v2 />
      <ChatWidget />
    </div>
  );
}
