import { Alert, AlertTitle } from "@/components/ui/alert"
import { Check } from "lucide-react"
import { Spinner } from "@/components/ui/spinner"
import React from "react"

export default function ToolCall({toolCallTitle, isComplete}: {toolCallTitle: string, isComplete: boolean}) {
  return (
    <Alert className="my-4">
    {isComplete ? <Check /> : <Spinner />}
    <AlertTitle>
        {toolCallTitle}
    </AlertTitle>
    </Alert>
  )
}