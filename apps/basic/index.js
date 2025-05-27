import 'dotenv/config';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage } from '@langchain/core/messages';

async function main() {
  const chat = new ChatOpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    model: "gpt-4o-mini",
    temperature: 0.7,
    apiVersion: "v1",
  });

  const res = await chat.invoke([
    new HumanMessage("What is the capital of India?")
  ]);

  console.log("Gemini Response:", res);
}

main().catch(console.error);
