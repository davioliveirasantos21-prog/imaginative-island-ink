import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
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

type ScreenPos = { x: number; y: number };

export function NpcChat({
  npc,
  slot,
  onClose,
  canvasRef,
  viewW,
  viewH,
  getNpcScreen,
  getPlayerScreen,
}: {
  npc: Npc;
  slot: number;
  onClose: () => void;
  canvasRef: RefObject<HTMLCanvasElement | null>;
  viewW: number;
  viewH: number;
  getNpcScreen: () => ScreenPos | null;
  getPlayerScreen: () => ScreenPos;
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

  // Persist messages to localStorage.
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

  const inputRef = useRef<HTMLInputElement | null>(null);
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const text = input.trim();
    if (!text || isLoading) return;
    setInput("");
    await sendMessage({ text });
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

  // Last message per role for the balloons.
  const lastNpcMsg = [...messages].reverse().find((m) => m.role === "assistant");
  const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
  const npcText = lastNpcMsg ? messageText(lastNpcMsg) : "";
  const userText = lastUserMsg ? messageText(lastUserMsg) : "";

  // Live-tracked screen positions of NPC and player (in CSS px, relative
  // to the canvas' bounding rect).
  const [npcPos, setNpcPos] = useState<ScreenPos | null>(null);
  const [playerPos, setPlayerPos] = useState<ScreenPos | null>(null);
  const [scale, setScale] = useState(1);

  const [rect, setRect] = useState<{ left: number; top: number; width: number; height: number }>({ left: 0, top: 0, width: 0, height: 0 });

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const canvas = canvasRef.current;
      if (canvas) {
        const r = canvas.getBoundingClientRect();
        const sx = r.width / viewW;
        const sy = r.height / viewH;
        setScale(sx);
        setRect({ left: r.left, top: r.top, width: r.width, height: r.height });
        const nRaw = getNpcScreen();
        if (nRaw) setNpcPos({ x: r.left + nRaw.x * sx, y: r.top + nRaw.y * sy });
        const pRaw = getPlayerScreen();
        setPlayerPos({ x: r.left + pRaw.x * sx, y: r.top + pRaw.y * sy });
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [canvasRef, viewW, viewH, getNpcScreen, getPlayerScreen]);

  return (
    <div className="pointer-events-none fixed inset-0 z-40 font-pixel">
      {/* NPC balloon (above the NPC's head) */}
      {npcPos && npcText ? (
        <Balloon
          x={npcPos.x}
          y={npcPos.y}
          side="npc"
          text={
            isLoading && lastNpcMsg && lastNpcMsg.id === messages[messages.length - 1]?.id
              ? npcText || "..."
              : npcText
          }
          scale={scale}
        />
      ) : isLoading && !npcText && npcPos ? (
        <Balloon x={npcPos.x} y={npcPos.y} side="npc" text="..." scale={scale} />
      ) : null}

      {/* Player balloon (above the player's head) */}
      {playerPos && userText ? (
        <Balloon
          x={playerPos.x}
          y={playerPos.y}
          side="player"
          text={userText}
          scale={scale}
        />
      ) : null}

      {/* Close (X) — top-right of the canvas overlay */}
      <button
        onClick={onClose}
        className="pointer-events-auto absolute top-2 right-2 border-2 border-[#f4e9c1] bg-[#0d1b2a]/90 px-2 py-1 text-[10px] uppercase tracking-widest text-[#f4e9c1] hover:bg-[#1b2a3a]"
        aria-label="Fechar conversa"
      >
        ✕ Sair
      </button>

      {messages.length > 0 ? (
        <button
          onClick={handleClear}
          className="pointer-events-auto absolute top-2 right-20 border-2 border-[#f4e9c1]/60 bg-[#0d1b2a]/80 px-2 py-1 text-[10px] uppercase tracking-widest text-[#f4e9c1]/80 hover:bg-[#1b2a3a]"
          aria-label="Limpar conversa"
        >
          Limpar
        </button>
      ) : null}

      {/* Speech input at the bottom */}
      <form
        onSubmit={handleSubmit}
        className="pointer-events-auto absolute bottom-3 left-1/2 -translate-x-1/2 flex w-[min(92%,520px)] items-center gap-2 border-4 border-[#f4e9c1] bg-[#1b2a3a] px-2 py-2"
        style={{ boxShadow: "0 4px 0 #0a141f" }}
      >
        <span className="hidden sm:inline text-[10px] uppercase tracking-widest text-[#ffd166]">
          Você:
        </span>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={`Falar com ${npc.name}...`}
          className="flex-1 border-2 border-[#f4e9c1]/40 bg-[#0d1b2a] px-2 py-1.5 text-xs text-[#f4e9c1] outline-none focus:border-[#ffd166]"
          disabled={isLoading}
          autoComplete="off"
          onKeyDown={(e) => {
            // Swallow game key events at capture time via stopPropagation
            e.stopPropagation();
          }}
          onKeyUp={(e) => e.stopPropagation()}
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="border-2 border-[#ffd166] bg-[#ffd166] px-3 py-1.5 text-xs font-bold uppercase text-[#0d1b2a] disabled:opacity-50"
        >
          {isLoading ? "..." : "Dizer"}
        </button>
      </form>
    </div>
  );
}

/**
 * Pixel-art speech balloon. Positioned so its "tail" points DOWN at (x, y)
 * (i.e. the character's head). Uses chunky 4px pixel borders drawn with
 * layered box-shadows to keep the look pixelated without a real bitmap.
 */
function Balloon({
  x,
  y,
  side,
  text,
  scale,
}: {
  x: number;
  y: number;
  side: "npc" | "player";
  text: string;
  scale: number;
}) {
  const px = Math.max(2, Math.round(scale)); // 1 "pixel" in CSS px
  const bg = side === "npc" ? "#f4e9c1" : "#ffd166";
  const fg = "#0d1b2a";

  const maxCh = 28; // wrap width in characters
  // Pixel-styled border using layered outlines that look like blocky pixels.
  const border = `
    0 0 0 ${px}px ${fg},
    ${px}px 0 0 0 ${fg},
    -${px}px 0 0 0 ${fg},
    0 ${px}px 0 0 ${fg},
    0 -${px}px 0 0 ${fg}
  `;

  return (
    <div
      className="pointer-events-none absolute select-none"
      style={{
        left: x,
        top: y,
        transform: `translate(-50%, calc(-100% - ${18 * px}px))`,
        zIndex: 50,
      }}
    >
      <div
        style={{
          background: bg,
          color: fg,
          padding: `${px * 2}px ${px * 3}px`,
          maxWidth: `${maxCh}ch`,
          minWidth: `${8 * px}px`,
          fontSize: Math.max(10, Math.round(px * 3.5)),
          lineHeight: 1.25,
          fontFamily: "inherit",
          textAlign: "center",
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
          boxShadow: border,
          imageRendering: "pixelated",
        }}
      >
        {text}
      </div>
      {/* Chunky pixel tail pointing down at the character. */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          bottom: `-${px * 3}px`,
          transform: "translateX(-50%)",
          width: `${px * 4}px`,
          height: `${px * 3}px`,
          display: "grid",
          gridTemplateColumns: `repeat(4, ${px}px)`,
          gridTemplateRows: `repeat(3, ${px}px)`,
        }}
      >
        {/* Row 1 */}
        <div style={{ background: bg, boxShadow: `0 -${px}px 0 ${bg}` }} />
        <div style={{ background: bg }} />
        <div style={{ background: bg }} />
        <div style={{ background: bg }} />
        {/* Row 2 */}
        <div />
        <div style={{ background: bg }} />
        <div style={{ background: bg }} />
        <div />
        {/* Row 3 */}
        <div />
        <div />
        <div style={{ background: bg }} />
        <div />
      </div>
    </div>
  );
}
