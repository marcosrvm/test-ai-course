import type { Metadata } from "next";
import "@/components/agent/agent.css";

// Internal agent view: English UI, never indexed, not linked from the public site, no chat widget.
export const metadata: Metadata = {
  title: { default: "Agent view", template: "%s · Agent view" },
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
};

export default function AgentLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="su-agent" lang="en">
      {children}
    </div>
  );
}
