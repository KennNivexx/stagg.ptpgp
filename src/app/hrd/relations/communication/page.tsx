import {
  Megaphone, FileText, Newspaper, Share2, ScrollText, Siren, BarChart3,
  Lightbulb, Rocket, Mic2, Vote, MessageCircle, Smile, ClipboardList,
  MessageSquare, Users,
} from "lucide-react";
import HubTabs, { type HubTab } from "@/components/hrd/HubTabs";

import AnnouncementsPage from "./announcements/page";
import MemosPage from "./memos/page";
import CompanyNewsPage from "./news/page";
import PolicyDistributionPage from "./policy-dist/page";
import CircularsPage from "./circulars/page";
import EmergencyPage from "./emergency/page";
import CommunicationAnalyticsPage from "./analytics/page";

import SuggestionsPage from "../participation/suggestions/page";
import InnovationsPage from "../participation/innovations/page";
import VoicePage from "../participation/voice/page";
import PollingPage from "../participation/polling/page";
import FeedbackPage from "../participation/feedback/page";
import SatisfactionPage from "../participation/satisfaction/page";

import SurveiKaryawan from "../surveys/page";

export const dynamic = "force-dynamic";
// This page is a merged hub for the "Communication & Participation" top-nav
// entry — it composes the original, still-intact page.tsx files from
// communication/*, participation/*, and surveys/ as tabs via HubTabs, rather
// than duplicating their data-fetching/business logic. Each original route
// still exists and works standalone; they're just no longer linked from the
// top nav (that's handled centrally in src/lib/hrd-menu.ts, not touched here).
//
// All 14 target pages are plain `export default async function X()` Server
// Components with no required props, so each can simply be awaited and its
// JSX passed straight through as a tab's `content`. None needed to be skipped.
//
// Grouped into three labeled clusters (Communication / Participation /
// Survey), each its own HubTabs row, since one flat 14-tab row would be too
// cluttered to scan at a glance.

export default async function CommunicationParticipationHub() {
  const [
    announcements, memos, news, policyDist, circulars, emergency, analytics,
    suggestions, innovations, voice, polling, feedback, satisfaction,
    survey,
  ] = await Promise.all([
    AnnouncementsPage(),
    MemosPage(),
    CompanyNewsPage(),
    PolicyDistributionPage(),
    CircularsPage(),
    EmergencyPage(),
    CommunicationAnalyticsPage(),
    SuggestionsPage(),
    InnovationsPage(),
    VoicePage(),
    PollingPage(),
    FeedbackPage(),
    SatisfactionPage(),
    SurveiKaryawan(),
  ]);

  const communicationTabs: HubTab[] = [
    { id: "announcements", label: "Announcements", icon: <Megaphone size={14} />, content: announcements },
    { id: "memos", label: "Memos", icon: <FileText size={14} />, content: memos },
    { id: "news", label: "News", icon: <Newspaper size={14} />, content: news },
    { id: "policy-dist", label: "Policy Distribution", icon: <Share2 size={14} />, content: policyDist },
    { id: "circulars", label: "Circulars", icon: <ScrollText size={14} />, content: circulars },
    { id: "emergency", label: "Emergency Broadcast", icon: <Siren size={14} />, content: emergency },
    { id: "analytics", label: "Communication Analytics", icon: <BarChart3 size={14} />, content: analytics },
  ];

  const participationTabs: HubTab[] = [
    { id: "suggestions", label: "Suggestions", icon: <Lightbulb size={14} />, content: suggestions },
    { id: "innovations", label: "Innovations", icon: <Rocket size={14} />, content: innovations },
    { id: "voice", label: "Voice of Employee", icon: <Mic2 size={14} />, content: voice },
    { id: "polling", label: "Polling", icon: <Vote size={14} />, content: polling },
    { id: "feedback", label: "Feedback", icon: <MessageCircle size={14} />, content: feedback },
    { id: "satisfaction", label: "Satisfaction Survey", icon: <Smile size={14} />, content: satisfaction },
  ];

  const surveyTabs: HubTab[] = [
    { id: "survey", label: "Employee Survey", icon: <ClipboardList size={14} />, content: survey },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-screen-2xl mx-auto">
      <div className="flex items-center gap-2">
        <div className="p-2 bg-blue-100 rounded-xl">
          <MessageSquare size={20} className="text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[#1A2530]">Communication &amp; Participation</h1>
          <p className="text-sm text-slate-500 mt-1">
            Komunikasi internal perusahaan dan partisipasi karyawan dalam satu tempat.
          </p>
        </div>
      </div>

      <div>
        <h2 className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
          <Megaphone size={12} /> Communication
        </h2>
        <HubTabs tabs={communicationTabs} />
      </div>

      <div>
        <h2 className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
          <Users size={12} /> Participation
        </h2>
        <HubTabs tabs={participationTabs} />
      </div>

      <div>
        <h2 className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
          <ClipboardList size={12} /> Survey
        </h2>
        <HubTabs tabs={surveyTabs} />
      </div>
    </div>
  );
}
