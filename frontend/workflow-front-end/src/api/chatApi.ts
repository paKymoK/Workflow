import { api } from "@takypok/shared";

export async function askQuestion(question: string): Promise<string> {
  const res = await api.post("/chat-service/assist/ask", { question });
  return res.data.answer as string;
}
