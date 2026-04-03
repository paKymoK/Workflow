import api from "./axios";

export async function askQuestion(question: string): Promise<string> {
  const res = await api.post("/chat-service/assist/ask", { question });
  return res.data.answer as string;
}
