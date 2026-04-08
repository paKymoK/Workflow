import { useMutation } from "@tanstack/react-query";
import { askQuestion } from "../api/chatApi";

/** Send a question to the AI assistant. */
export function useAskQuestion() {
  return useMutation({
    mutationFn: (question: string) => askQuestion(question),
  });
}
