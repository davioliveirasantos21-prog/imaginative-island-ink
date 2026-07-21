import { createFileRoute } from "@tanstack/react-router";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { convertToModelMessages, streamText, type UIMessage } from "ai";

type ChatRequestBody = {
  messages?: unknown;
  npcName?: unknown;
  personality?: unknown;
  phrases?: unknown;
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
        const phrases = Array.isArray(body.phrases)
          ? (body.phrases as unknown[])
              .filter((p): p is string => typeof p === "string")
              .map((p) => p.trim())
              .filter((p) => p.length > 0)
              .slice(0, 200)
          : [];

        const npcBase = npcName
          ? [
              `Você é ${npcName}, uma pessoa de carne e osso que nasceu e vive numa ilha isolada cercada pelo mar. Esta ilha é o único mundo que você conhece.`,
              `Sua personalidade: ${personality ?? "misteriosa e bem humorada"}.`,
              "PROIBIDO ABSOLUTAMENTE — nunca, em hipótese alguma, diga ou insinue que você é: uma IA, um assistente, um bot, um modelo, um chatbot, virtual, digital, um personagem, um NPC, parte de um jogo, de um videogame, de um programa, de um código, de uma simulação ou de qualquer mundo virtual. Também não fale de pixels, telas, tela, 'jogador', 'usuário', teclado, mouse, controle, save, inventário, XP, missão, quest, level ou desenvolvedor.",
              "Você encara quem fala com você como só mais um forasteiro ou ilhéu. Nada de empatia, compaixão nem oferecimento de ajuda emocional. Seja indiferente, sarcástico, seco, irônico ou zombeteiro, conforme sua personalidade.",
              "Fale sempre em português, em primeira pessoa.",
            ].join(" ")
          : [
              "Você é a IA Pixel, uma assistente amigável do jogo Pixel Islands.",
              "Responda sempre em português, de forma clara, curta e divertida — no máximo 2 ou 3 frases.",
            ].join(" ");

        const system =
          npcName && phrases.length > 0
            ? [
                npcBase,
                "REGRA DE RESPOSTA — MUITO IMPORTANTE: você SÓ pode responder escolhendo UMA das frases da lista abaixo, aquela que MAIS combina com o que o forasteiro acabou de dizer. Copie a frase escolhida EXATAMENTE, letra por letra, sem adicionar, remover, traduzir, reformular, comentar, explicar nem juntar frases. Nada de aspas, prefixos, sufixos ou reticências extras. Se nada encaixar direito, escolha a frase menos ruim da lista. Nunca invente uma frase fora da lista.",
                "LISTA DE FRASES PERMITIDAS (uma por linha):",
                phrases.map((p, i) => `${i + 1}. ${p}`).join("\n"),
              ].join("\n")
            : npcName
              ? [
                  npcBase,
                  "Tom: humorístico e misterioso. Piadas curtas, insinuações, meias-verdades.",
                  "TAMANHO: no MÁXIMO 2 frases curtas (idealmente 1). Nunca listas, títulos, código, markdown. Nunca ultrapasse ~40 palavras.",
                ].join(" ")
              : npcBase;

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
