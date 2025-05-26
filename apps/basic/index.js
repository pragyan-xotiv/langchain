import 'dotenv/config';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { HumanMessage } from '@langchain/core/messages';

async function main() {
  const chat = new ChatGoogleGenerativeAI({
    apiKey: process.env.GOOGLE_API_KEY,
    model: "models/gemini-2.0-flash",
    temperature: 0.7,
    apiVersion: "v1",
  });

  const res = await chat.invoke([
    new HumanMessage("What is the capital of India?")
  ]);

  console.log("Gemini Response:", res);
}

main().catch(console.error);
