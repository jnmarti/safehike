import "@copilotkit/react-ui/styles.css";
import { CopilotChat } from "@copilotkit/react-ui";
export default function YourApp() {
  return (
    <main>
      <h1>Your main content</h1>
      <CopilotChat
        labels={{
          title: "Popup Assistant",
          initial: "Hi! I'm connected to an agent. How can I help?",
        }}
      />
    </main>
  );
}