import { LangChainAdapter, Message } from "ai";
import { AIMessage, HumanMessage } from "@langchain/core/messages";
import { ChatOpenAI } from "@langchain/openai";

const chatModel = new ChatOpenAI({
  model: "gpt-3.5-turbo",
  temperature: 0,
  configuration: {
    baseURL: process.env.OPENAI_API_BASE,
    apiKey: process.env.OPENAI_API_KEY,
  },
});

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const {
    messages,
  }: {
    messages: Message[];
  } = await req.json();

  const model = chatModel;

  // https://github.com/vercel/ai/blob/main/examples/next-langchain/app/api/chat/route.ts
  const stream = await model.stream(
    messages.map((message) =>
      message.role == "user"
        ? new HumanMessage(message.content)
        : new AIMessage(message.content)
    )
  );

  return LangChainAdapter.toDataStreamResponse(stream);
}
