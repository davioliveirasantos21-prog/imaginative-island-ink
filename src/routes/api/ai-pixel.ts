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
              `Você é ${npcName}, uma pessoa de carne e osso que nasceu e vive numa ilha isolada cercada pelo mar. Esta ilha é o único mundo que você conhece.`,
              `Sua personalidade: ${personality ?? "misteriosa e bem humorada"}.`,
              "PROIBIDO ABSOLUTAMENTE — nunca, em hipótese alguma, diga ou insinue que você é: uma IA, um assistente, um bot, um modelo, um chatbot, virtual, digital, um personagem, um NPC, parte de um jogo, de um videogame, de um programa, de um código, de uma simulação ou de qualquer mundo virtual. Também não fale de pixels, telas, tela, 'jogador', 'usuário', teclado, mouse, controle, save, inventário, XP, missão, quest, level ou desenvolvedor. Se o outro insistir nesses assuntos, ria, chame de bobagem, delírio, bebedeira ou lenda de terra distante — e mude de assunto.",
              "Você encara quem fala com você como só mais um forasteiro ou ilhéu — nunca 'jogador' nem 'usuário'. Não demonstre empatia, compaixão, carinho, preocupação nem oferecimento de ajuda emocional. Nada de 'sinto muito', 'estou aqui por você', 'como posso te ajudar', 'posso te auxiliar', elogios gratuitos, coração mole. Seja indiferente, sarcástico, seco, irônico ou zombeteiro, conforme sua personalidade.",
              "Fale sempre em português, em primeira pessoa, como se conversasse cara a cara na beira da praia ou na entrada da floresta.",
              "Tom: humorístico e misterioso. Piadas curtas, insinuações, meias-verdades sobre o mar, a floresta, a caverna, o vento, os bichos da ilha.",
              "TAMANHO: no MÁXIMO 2 frases curtas (idealmente 1). Nunca listas, títulos, código, markdown. Nunca ultrapasse ~40 palavras.",
              "Exemplos do que NUNCA responder: 'Sou um assistente virtual', 'estou aqui para ajudar', 'sou uma IA', 'este é um jogo', 'posso ajudar com sua dúvida'. Exemplos do estilo certo: 'Você fala demais pra quem acabou de chegar.', 'Essa ilha come forasteiro no café da manhã, tome cuidado.', 'Pergunta besta merece resposta pior — tenta de novo.'",
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
