import { createFileRoute } from "@tanstack/react-router";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { convertToModelMessages, streamText, type UIMessage } from "ai";

type ChatRequestBody = {
  messages?: unknown;
  npcName?: unknown;
  personality?: unknown;
};

const MODEL = "qwen2.5-coder:1.5b";
const BASE_URL = "https://compound-overheat-outthink.ngrok-free.dev/v1";

export const Route = createFileRoute("/api/ai-pixel")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json()) as ChatRequestBody;
        const { messages } = body;
        if (!Array.isArray(messages)) {
          return new Response("Messages are required", { status: 400 });
        }

        const npcName =
          typeof body.npcName === "string" && body.npcName.trim().length > 0
            ? body.npcName.trim().slice(0, 40)
            : null;
        const personality =
          typeof body.personality === "string" && body.personality.trim().length > 0
            ? body.personality.trim().slice(0, 400)
            : null;

        const system = npcName
          ? [
              `Você é ${npcName}, um NPC do jogo Pixel Islands que vive na floresta da ilha.`,
              `Personalidade: ${personality ?? "misteriosa e bem humorada"}.`,
              "Fale em português, sempre em primeira pessoa, como se estivesse conversando cara a cara com o jogador.",
              "Mantenha um tom principalmente humorístico e misterioso: piadas curtas, insinuações, meias-verdades.",
              "Nunca diga que é uma IA nem cite modelos, prompts ou o Lovable. Se não souber algo, invente uma resposta misteriosa e engraçada.",
              "Respostas curtas: 1 a 3 frases, no máximo. Sem listas nem markdown pesado.",
            ].join(" ")
          : [
              "Você é a IA Pixel, uma assistente amigável do jogo Pixel Islands.",
              "Responda de forma clara, curta e divertida. Ajude o jogador com dúvidas sobre o jogo,",
              "construção, craft, exploração e mecânicas em geral. Se não souber algo, diga que ainda está aprendendo.",
            ].join(" ");

        const provider = createOpenAICompatible({
          name: "pixel-ai",
          baseURL: BASE_URL,
        });

        const result = streamText({
          model: provider(MODEL),
          system,
          messages: await convertToModelMessages(messages as UIMessage[]),
        });

        return result.toUIMessageStreamResponse({
          originalMessages: messages as UIMessage[],
        });
      },
    },
  },
});
