import React from 'react';
import { AssistantMessageProps } from '@copilotkit/react-ui';
import ToolCall from './ToolCall';
import Markdown from 'react-markdown'
import ThinkingBubble from './ThinkingBubble';

import { Badge } from "@/components/ui/badge"

type WeatherReportItem = {
  date: string;
  max_temperature: string;
  min_temperature: string;
  precipitation_probability: string;
  wind_speed: string;
};

type TrailInfoItem = {
  name: string;
  difficulty_level: string;
  estimated_ascent_time: string;
  estimated_descent_time: string;
};

type LinksItem = {
  title: string;
  url: string;
};

type Risk = {
  name: string;
  emoji: string;
};

type RiskAnalysisItem = {
  risk: Risk;
  relevance: string;
  recommendations: string;
};

type HikingReport = {
  summary: string;
  risk_emojis: string[];
  weather_report: WeatherReportItem[];
  relevant_news: string[];
  trails_info: TrailInfoItem[];
  risk_analysis: RiskAnalysisItem[];
  links: LinksItem[];
};

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === 'string');

const isWeatherReportArray = (value: unknown): value is WeatherReportItem[] =>
  Array.isArray(value) &&
  value.every(
    (item) =>
      item &&
      typeof item === 'object' &&
      typeof (item as WeatherReportItem).date === 'string' &&
      typeof (item as WeatherReportItem).max_temperature === 'string' &&
      typeof (item as WeatherReportItem).min_temperature === 'string' &&
      typeof (item as WeatherReportItem).precipitation_probability === 'string' &&
      typeof (item as WeatherReportItem).wind_speed === 'string',
  );

const isTrailInfoArray = (value: unknown): value is TrailInfoItem[] =>
  Array.isArray(value) &&
  value.every(
    (item) =>
      item &&
      typeof item === 'object' &&
      typeof (item as TrailInfoItem).name === 'string' &&
      typeof (item as TrailInfoItem).difficulty_level === 'string' &&
      typeof (item as TrailInfoItem).estimated_ascent_time === 'string' &&
      typeof (item as TrailInfoItem).estimated_descent_time === 'string',
  );

const isLinksArray = (value: unknown): value is LinksItem[] =>
  Array.isArray(value) &&
  value.every(
    (item) =>
      item &&
      typeof item === 'object' &&
      typeof (item as LinksItem).title === 'string' &&
      typeof (item as LinksItem).url === 'string',
  );

const isRisk = (value: unknown): value is Risk =>
  !!value &&
  typeof value === 'object' &&
  typeof (value as Risk).name === 'string' &&
  typeof (value as Risk).emoji === 'string';

const isRiskAnalysisArray = (value: unknown): value is RiskAnalysisItem[] =>
  Array.isArray(value) &&
  value.every(
    (item) =>
      item &&
      typeof item === 'object' &&
      isRisk((item as RiskAnalysisItem).risk) &&
      typeof (item as RiskAnalysisItem).relevance === 'string' &&
      typeof (item as RiskAnalysisItem).recommendations === 'string',
  );

const isHikingReport = (data: unknown): data is HikingReport => {
  if (!data || typeof data !== 'object') return false;
  const report = data as Record<string, unknown>;

  return (
    typeof report.summary === 'string' &&
    isRiskAnalysisArray(report.risk_analysis) &&
    isStringArray(report.risk_emojis) &&
    isStringArray(report.relevant_news) &&
    isWeatherReportArray(report.weather_report) &&
    isTrailInfoArray(report.trails_info) &&
    isLinksArray(report.links)
  );
};

const parseHikingReport = (content: string): HikingReport | null => {
  const trimmed = content.trim();
  const candidates: string[] = [trimmed];

  const codeBlockMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (codeBlockMatch && codeBlockMatch[1]) {
    candidates.unshift(codeBlockMatch[1].trim());
  }

  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate);
      if (isHikingReport(parsed)) return parsed;
    } catch (error) {
      continue;
    }
  }

  return null;
};

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="space-y-2 rounded-lg border border-slate-200 bg-white/70 p-4 shadow-sm">
    <div className="text-sm font-semibold uppercase tracking-wide text-slate-600">{title}</div>
    {children}
  </div>
);

const ListLabel = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-center justify-between text-sm text-slate-700">
    <span className="font-medium">{label}</span>
    <span className="text-slate-600">{value}</span>
  </div>
);

export default function CustomAssistantMessage(assistantMessageProps: AssistantMessageProps) {

  if (assistantMessageProps.message?.id == "Let's plan your hike. Tell me where you want to go!") {
    return <div className="scroll-m-20 text-xl font-semibold tracking-tight py-4">"Hi! I'm Safehike, your safety-first hiking assistant. Let's plan a safe and enjoyable hike together!" </div>
  }
    // It's a tool call
    if (assistantMessageProps.message?.toolCalls && assistantMessageProps.message.toolCalls.length > 0) {
      return <ToolCall toolCallTitle={assistantMessageProps.message.name || ""} isComplete={true} />
    }

    const rawContent = assistantMessageProps.message?.content;
    const hikingReport =
      typeof rawContent === 'string' ? parseHikingReport(rawContent) : null;

    if (hikingReport && !assistantMessageProps.isGenerating && !assistantMessageProps.isLoading) {
      return (
        <div className="my-4 overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-slate-50 shadow-lg">
          <div className="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-slate-300">Hiking Safety Report</p>
              <p className="text-lg font-semibold">Your tailored plan is ready</p>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-lg">
              {hikingReport.risk_emojis.map((emoji) => (
                <Badge key={emoji}>
                  {emoji}
                </Badge>
              ))}
            </div>
          </div>

          <div className="space-y-4 bg-white px-5 py-5 text-slate-900">
            <div className="grid gap-4 lg:grid-cols-2">
              <Section title="Summary">
                <Markdown className="text-sm leading-relaxed text-slate-800">
                  {hikingReport.summary}
                </Markdown>
              </Section>

              <Section title="Weather Outlook">
                <div className="grid gap-3 sm:grid-cols-2">
                  {hikingReport.weather_report.map((item) => (
                    <div
                      key={item.date}
                      className="bg-white p-3"
                    >
                      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        {item.date}
                      </div>
                      <div className="mt-2 space-y-1 text-sm text-slate-700">
                        <ListLabel label="Max" value={item.max_temperature} />
                        <ListLabel label="Min" value={item.min_temperature} />
                        <ListLabel label="Precip." value={item.precipitation_probability} />
                        <ListLabel label="Wind" value={item.wind_speed} />
                      </div>
                    </div>
                  ))}
                </div>
              </Section>
            </div>

            <Section title="Relevant News">
              <div className="space-y-3">
                {hikingReport.relevant_news.map((news, index) => (
                  <div
                    key={`${index}-${news.slice(0, 20)}`}
                    className="bg-white p-3"
                  >
                    <Markdown className="text-sm leading-relaxed text-slate-800">{news}</Markdown>
                  </div>
                ))}
              </div>
            </Section>

            <Section title="Trails">
              <div className="grid gap-3 md:grid-cols-2">
                {hikingReport.trails_info.map((trail) => (
                  <div
                    key={`${trail.name}-${trail.difficulty_level}`}
                    className="from-slate-50 via-white to-slate-100 p-4"
                  >
                    <div className="text-base font-semibold text-slate-900">{trail.name}</div>
                    <div className="mt-1 text-sm text-slate-600">{trail.difficulty_level}</div>
                    <div className="mt-3 space-y-1 text-sm text-slate-700">
                      <ListLabel label="Ascent" value={trail.estimated_ascent_time} />
                      <ListLabel label="Descent" value={trail.estimated_descent_time} />
                    </div>
                  </div>
                ))}
              </div>
            </Section>

            <Section title="Risk Analysis">
              <div className="space-y-3">
                {hikingReport.risk_analysis.map((item) => (
                  <div
                    key={item.risk.name}
                    className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
                  >
                    <div className="flex items-center gap-2">
                      <Badge className="text-base leading-none">{item.risk.emoji} <div className="text-sm font-semibold text-slate-900 text-white">{item.risk.name}</div></Badge>
                    </div>
                    <div className="mt-3 space-y-2 text-sm leading-relaxed text-slate-800">
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Relevance</div>
                        <p className="mt-1 text-slate-800">{item.relevance}</p>
                      </div>
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Recommendations</div>
                        <p className="mt-1 text-slate-800">{item.recommendations}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Section>

            <Section title="Essential Links">
              <div className="grid gap-2 sm:grid-cols-2">
                {hikingReport.links.map((link) => (
                  <a
                    key={link.url}
                    href={link.url}
                    target="_blank"
                    rel="noreferrer"
                    className="group rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-400 hover:shadow-md"
                  >
                    <div className="line-clamp-2">{link.title}</div>
                  </a>
                ))}
              </div>
            </Section>
          </div>
        </div>
      );
    }
    // It's a regular assistant message with some content
    if (rawContent) {
      return (
        <ThinkingBubble content={rawContent} />
      );
    }
}
