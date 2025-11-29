'use client';

import "@copilotkit/react-ui/styles.css";
import { CopilotChat } from "@copilotkit/react-ui";
import { useDefaultTool } from "@copilotkit/react-core"; 
import ToolCall from "./components/ToolCall";
import { useCoAgent } from "@copilotkit/react-core";
import { AlertCircleIcon, MountainSnowIcon } from "lucide-react"
import "@copilotkit/react-ui/styles.css"; 
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"

import CustomAssistantMessage from "./components/CustomAssistantMessage";

type AgentState = {
  mountain: string | null;
  hiking_dates: string | null;
  trail: string | null;
  current_date: string | null;
  weather_report: string | null;
  news_report: string | null;
};

export default function SafehikeChat() {
  useDefaultTool({
    render: ({ name, args, status, result }) => {
      return <ToolCall toolCallTitle={name} isComplete={status === "complete"} />;
    },
  });

  const { state } = useCoAgent<AgentState>({
    name: "safehike",
  })

  console.log(state)

  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="px-4">
            <h1 className="scroll-m-20 text-center text-4xl font-extrabold tracking-tight text-balance py-3">
            <span className="inline-flex items-center gap-3">
              <MountainSnowIcon className="h-8 w-8" />
              Safehike: a safety-first hiking assistant
            </span>
            </h1>
          <Alert variant="destructive">
            <AlertCircleIcon />
            <AlertTitle>Always double check</AlertTitle>
            <AlertDescription>
              <p>The information provided by Safehike may not be completely accurate or up-to-date. Always verify details before your hike.</p>
            </AlertDescription>
          </Alert>
        </div>
        <CopilotChat
          labels={{
            title: "Safehike",
            initial: "Let's plan your hike. Tell me where you want to go!",
          }}
          AssistantMessage={CustomAssistantMessage}
        />
      </div>
    </main>
  );
}
