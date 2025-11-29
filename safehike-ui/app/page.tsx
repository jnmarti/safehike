'use client';

import "@copilotkit/react-ui/styles.css";
import { CopilotChat } from "@copilotkit/react-ui";
import { useDefaultTool } from "@copilotkit/react-core"; 
import ToolCall from "./components/ToolCall";

export default function SafehikeChat() {
  useDefaultTool({
    render: ({ name, args, status, result }) => {
      return <ToolCall toolCallTitle={name} isComplete={status === "complete"} />;
    },
  });

  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-5xl space-y-6">
        <h1 className="text-2xl font-semibold">Safehike: a safety-first hiking assistant</h1>
        <CopilotChat
          labels={{
            title: "Popup Assistant",
            initial: "Hi! I'm connected to an agent. How can I help?",
          }}
        />
      </div>
    </main>
  );
}
