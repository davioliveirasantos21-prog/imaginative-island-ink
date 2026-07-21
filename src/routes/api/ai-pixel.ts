import { createFileRoute } from "@tanstack/react-router";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  generateText,
  streamText,
  type UIMessage,
} from "ai";

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

        const provider = createOpenAICompatible({
          name: "pixel-ai",
          baseURL: BASE_URL,
        });

        const uiMessages = messages as UIMessage[];
        const modelMessages = await convertToModelMessages(uiMessages);

        // --- Phrase-selection mode ---------------------------------------
        // Quando existem frases cadastradas, o modelo NÃO gera texto livre.
        // Ele apenas escolhe o número da frase mais adequada; nós devolvemos
        // a frase exata do array (garante que nunca inventa nada).
        if (npcName && phrases.length > 0) {
          const lastUser = [...uiMessages]
            .reverse()
            .find((m) => m.role === "user");
          const lastText =
            lastUser?.parts
              .filter((p): p is { type: "text"; text: string } => p.type === "text")
              .map((p) => p.text)
              .join(" ")
              .trim() ?? "";

          // Frases já ditas pelo NPC nesta conversa — evitamos repetir.
          const usedPhrases = new Set<string>();
          for (const m of uiMessages) {
            if (m.role !== "assistant") continue;
            for (const p of m.parts) {
              if (p.type === "text") usedPhrases.add(p.text.trim());
            }
          }

          // Curto-circuito: se a mensagem for muito curta ou vazia,
          // sorteia direto sem chamar o modelo (rápido e evita repetição).
          let chosenIndex = -1;
          const shouldAskModel = lastText.length >= 3;

          if (shouldAskModel) {
            const selectorSystem = [
              `Você é ${npcName}, um ilhéu ${personality ?? "misterioso e bem humorado"}.`,
              "Escolha qual das frases numeradas abaixo responde melhor à mensagem do forasteiro.",
              "Responda APENAS com o número (ex.: 7). Sem texto, sem pontuação.",
              "LISTA:",
              phrases.map((p, i) => `${i + 1}. ${p}`).join("\n"),
            ].join("\n");

            try {
              const controller = new AbortController();
              const timeout = setTimeout(() => controller.abort(), 8000);
              const { text } = await generateText({
                model: provider(MODEL),
                system: selectorSystem,
                temperature: 0.4,
                prompt: `Forasteiro disse: "${lastText}"\nNúmero:`,
                abortSignal: controller.signal,
              });
              clearTimeout(timeout);
              const match = text.match(/\d+/);
              const n = match ? parseInt(match[0], 10) : NaN;
              if (Number.isFinite(n) && n >= 1 && n <= phrases.length) {
                chosenIndex = n - 1;
              }
            } catch {
              /* fallback abaixo */
            }
          }

          // Se a IA falhou/timed out OU escolheu uma frase já usada,
          // pega uma frase ainda não dita nesta conversa aleatoriamente.
          const chosenPhrase = chosenIndex >= 0 ? phrases[chosenIndex] : null;
          let phrase: string;
          if (chosenPhrase && !usedPhrases.has(chosenPhrase)) {
            phrase = chosenPhrase;
          } else {
            const available = phrases.filter((p) => !usedPhrases.has(p));
            const pool = available.length > 0 ? available : phrases;
            phrase = pool[Math.floor(Math.random() * pool.length)];
          }

          const stream = createUIMessageStream({
            execute: ({ writer }) => {
              const id = crypto.randomUUID();
              writer.write({ type: "text-start", id });
              writer.write({ type: "text-delta", id, delta: phrase });
              writer.write({ type: "text-end", id });
            },
            originalMessages: uiMessages,
          });
          return createUIMessageStreamResponse({ stream });
        }


        // --- Free-form fallback ------------------------------------------
        const system = npcName
          ? [
              `Você é ${npcName}, uma pessoa de carne e osso que nasceu e vive numa ilha isolada cercada pelo mar. Esta ilha é o único mundo que você conhece.`,
              `Sua personalidade: ${personality ?? "misteriosa e bem humorada"}.`,
              "PROIBIDO ABSOLUTAMENTE — nunca, em hipótese alguma, diga ou insinue que você é: uma IA, um assistente, um bot, um modelo, um chatbot, virtual, digital, um personagem, um NPC, parte de um jogo, de um videogame, de um programa, de um código, de uma simulação ou de qualquer mundo virtual.",
              "Seja indiferente, sarcástico, seco, irônico ou zombeteiro. Nada de empatia.",
              "Fale sempre em português, em primeira pessoa.",
              "TAMANHO: no MÁXIMO 2 frases curtas.",
            ].join(" ")
          : [
              "Você é a IA Pixel, uma assistente amigável do jogo Pixel Islands.",
              "Responda sempre em português, de forma clara, curta e divertida — no máximo 2 ou 3 frases.",
            ].join(" ");

        const result = streamText({
          model: provider(MODEL),
          system,
          temperature: 0.7,
          messages: modelMessages,
        });

        return result.toUIMessageStreamResponse({
          originalMessages: uiMessages,
        });
      },
    },
  },
});
