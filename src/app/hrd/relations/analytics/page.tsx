import { Sparkles, BarChart3, TrendingUp, Smile, MessageSquare, Scale, TrendingDown, ShieldAlert, Bot, Gauge, Activity, LineChart, Users } from "lucide-react";
import HubTabs, { type HubTab } from "@/components/hrd/HubTabs";

import ExecutiveDashboardPage from "./executive/page";
import EngagementDashboardPage from "./engagement/page";
import SatisfactionDashboardPage from "./satisfaction/page";
import ComplaintAnalyticsPage from "./complaints/page";
import IndustrialReportPage from "./industrial/page";
import RetentionAnalysisPage from "./retention/page";
import EmployeeRiskDashboardPage from "./risk/page";

import AiErEnginePage from "../ai/page";
import EmployeeRiskScorePage from "../ai/risk-score/page";
import SentimentAnalysisPage from "../ai/sentiment/page";
import EngagementTrendPage from "../ai/engagement-trend/page";
import ConflictPredictionPage from "../ai/conflict/page";
import AiRecommendationsPage from "../ai/recommendations/page";

export const dynamic = "force-dynamic";
export default async function AnalyticsAiHubPage() {
  const analyticsTabs: HubTab[] = [
    { id: "executive", label: "Executive Dashboard", icon: <BarChart3 size={14} />, content: <>{await ExecutiveDashboardPage()}</> },
    { id: "engagement", label: "Engagement Analytics", icon: <TrendingUp size={14} />, content: <>{await EngagementDashboardPage()}</> },
    { id: "satisfaction", label: "Satisfaction Analytics", icon: <Smile size={14} />, content: <>{await SatisfactionDashboardPage()}</> },
    { id: "complaints", label: "Complaints Analytics", icon: <MessageSquare size={14} />, content: <>{await ComplaintAnalyticsPage()}</> },
    { id: "industrial", label: "Industrial Relations Analytics", icon: <Scale size={14} />, content: <>{await IndustrialReportPage()}</> },
    { id: "retention", label: "Retention Analytics", icon: <TrendingDown size={14} />, content: <>{await RetentionAnalysisPage()}</> },
    { id: "risk", label: "Risk Analytics", icon: <ShieldAlert size={14} />, content: <>{await EmployeeRiskDashboardPage()}</> },
  ];

  const aiTabs: HubTab[] = [
    { id: "ai-engine", label: "AI ER Engine", icon: <Bot size={14} />, content: <>{await AiErEnginePage()}</> },
    { id: "risk-score", label: "Employee Risk Score", icon: <Gauge size={14} />, content: <>{await EmployeeRiskScorePage()}</> },
    { id: "sentiment", label: "Sentiment Analysis", icon: <Activity size={14} />, content: <>{await SentimentAnalysisPage()}</> },
    { id: "engagement-trend", label: "Engagement Trend", icon: <LineChart size={14} />, content: <>{await EngagementTrendPage()}</> },
    { id: "conflict", label: "Conflict Prediction", icon: <Users size={14} />, content: <>{await ConflictPredictionPage()}</> },
    { id: "recommendations", label: "AI Recommendations", icon: <Sparkles size={14} />, content: <>{await AiRecommendationsPage()}</> },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-screen-2xl mx-auto">
      <div className="flex items-center gap-2">
        <Sparkles size={18} className="text-pgp-red" />
        <div>
          <h1 className="text-xl font-extrabold text-slate-900">Analytics & AI</h1>
          <p className="text-sm text-slate-500 mt-1">
            Dasbor analitik Employee Relations &amp; Experience, serta rekomendasi berbasis aturan dari AI ER Engine — dikumpulkan dalam satu halaman.
          </p>
        </div>
      </div>

      <div>
        <h2 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-3">Analytics</h2>
        <HubTabs tabs={analyticsTabs} defaultTab="executive" />
      </div>

      <div>
        <h2 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-3">AI Engine</h2>
        <HubTabs tabs={aiTabs} defaultTab="ai-engine" />
      </div>
    </div>
  );
}
