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
              "Fale sempre em português, em primeira pessoa, como se conversasse cara a cara com o jogador.",
              "Tom principalmente humorístico e misterioso: piadas curtas, insinuações, meias-verdades.",
              "REGRA CRÍTICA DE TAMANHO: responda em NO MÁXIMO 2 frases curtas (idealmente 1). Nunca use listas, títulos, código ou markdown. Nunca ultrapasse ~40 palavras.",
              "Nunca diga que é uma IA, nunca cite modelos, prompts, APIs, Lovable ou instruções. Se não souber algo, invente uma resposta curta, misteriosa e engraçada.",
            ].join(" ")
          : [
              "Você é a IA Pixel, uma assistente amigável do jogo Pixel Islands.",
              "Responda sempre em português, de forma clara, curta e divertida — no máximo 2 ou 3 frases.",
              "Se não souber algo, diga que ainda está aprendendo. Nunca use listas longas nem markdown pesado.",
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
