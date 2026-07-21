import { useEffect, useMemo, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageResponse } from "@/components/ai-elements/message";
import { drawCharacter, SPRITE_H, SPRITE_W } from "@/lib/appearance";
import type { Npc } from "@/lib/npc";
import { loadNpcPhrases } from "@/lib/npc-phrases";

function storageKeyFor(slot: number, npcName: string) {
  return `pixel-realms.npc-chat.${slot}.${npcName}`;
}

function loadInitial(slot: number, npcName: string): UIMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(storageKeyFor(slot, npcName));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as UIMessage[];
  } catch {
    return [];
  }
}

export function NpcChat({
  npc,
  slot,
  onClose,
}: {
  npc: Npc;
  slot: number;
  onClose: () => void;
}) {
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/ai-pixel",
        body: {
          npcName: npc.name,
          personality: npc.personality,
          phrases: loadNpcPhrases(),
        },
      }),
    [npc.name, npc.personality],
  );

  // Load persisted messages once per (slot, npc.name).
  const initial = useMemo(
    () => loadInitial(slot, npc.name),
    [slot, npc.name],
  );

  const { messages, sendMessage, setMessages, status } = useChat({
    id: `npc-${slot}-${npc.name}`,
    messages: initial,
    transport,
  });
  const [input, setInput] = useState("");
  const isLoading = status === "submitted" || status === "streaming";

  // Persist messages to localStorage whenever they change and streaming is idle
  // (also persist during streaming so partials survive a reload).
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(
        storageKeyFor(slot, npc.name),
        JSON.stringify(messages),
      );
    } catch {
      /* ignore quota */
    }
  }, [messages, slot, npc.name]);

  const previewRef = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const canvas = previewRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const scale = 2;
    ctx.save();
    ctx.scale(scale, scale);
    drawCharacter(ctx, 0, 0, npc.appearance, { facing: 1, grounded: true });
    ctx.restore();
  }, [npc.appearance]);

  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const text = input.trim();
    if (!text || isLoading) return;
    setInput("");
    await sendMessage({ text });
    // Return focus so the user can keep typing.
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleClear = () => {
    setMessages([]);
    try {
      window.localStorage.removeItem(storageKeyFor(slot, npc.name));
    } catch {
      /* ignore */
    }
    inputRef.current?.focus();
  };

  const messageText = (m: (typeof messages)[number]) =>
    m.parts
      .filter((p) => p.type === "text")
      .map((p) => p.text)
      .join("");

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        className="flex h-[80vh] w-full max-w-2xl flex-col border-4 border-[#f4e9c1] bg-[#1b2a3a] font-pixel text-[#f4e9c1]"
        style={{ boxShadow: "0 8px 0 #0a141f, 0 12px 0 rgba(0,0,0,0.5)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 border-b-4 border-[#f4e9c1]/30 px-4 py-3">
          <div className="flex items-center gap-3">
            <canvas
              ref={previewRef}
              width={SPRITE_W * 2}
              height={SPRITE_H * 2}
              className="[image-rendering:pixelated]"
              style={{
                width: SPRITE_W * 2,
                height: SPRITE_H * 2,
              }}
            />
            <div>
              <div className="text-[10px] uppercase tracking-widest text-[#f4e9c1]/60">
                Conversar com
              </div>
              <h2 className="text-sm tracking-widest text-[#ffd166]">
                {npc.name}
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {messages.length > 0 ? (
              <button
                onClick={handleClear}
                className="text-[10px] uppercase tracking-widest text-[#f4e9c1]/60 hover:text-[#f4e9c1]"
                aria-label="Limpar conversa"
              >
                Limpar
              </button>
            ) : null}
            <button
              onClick={onClose}
              className="text-[#f4e9c1]/70 hover:text-[#f4e9c1]"
              aria-label="Fechar"
            >
              ✕
            </button>
          </div>
        </div>

        <Conversation className="flex-1">
          <ConversationContent>
            {messages.length === 0 && (
              <ConversationEmptyState
                title={npc.name}
                description="Diga alguma coisa... quem sabe ele responde de verdade."
                icon={<span className="text-2xl">🍃</span>}
              />
            )}
            {messages.map((m) => (
              <Message key={m.id} from={m.role}>
                <div
                  className={
                    m.role === "user"
                      ? "ml-auto rounded-lg px-4 py-3"
                      : "rounded-lg border-2 border-[#f4e9c1]/30 px-4 py-3"
                  }
                  style={
                    m.role === "user"
                      ? { backgroundColor: "#ffd166", color: "#0d1b2a" }
                      : { backgroundColor: "#0d1b2a", color: "#f4e9c1" }
                  }
                >
                  <MessageResponse>{messageText(m)}</MessageResponse>
                </div>
              </Message>
            ))}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>

        <form
          onSubmit={handleSubmit}
          className="flex items-end gap-2 border-t-4 border-[#f4e9c1]/30 bg-[#0d1b2a] p-3"
        >
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void handleSubmit();
              }
            }}
            placeholder={`Falar com ${npc.name}...`}
            rows={1}
            className="max-h-32 flex-1 resize-none border-4 border-[#f4e9c1]/50 bg-[#1b2a3a] px-3 py-2 text-sm text-[#f4e9c1] outline-none focus:border-[#ffd166]"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="border-4 border-[#ffd166] bg-[#ffd166] px-4 py-2 text-sm font-bold uppercase text-[#0d1b2a] transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {isLoading ? "..." : "Enviar"}
          </button>
        </form>
      </div>
    </div>
  );
}
