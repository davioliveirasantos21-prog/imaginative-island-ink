import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useState } from "react";
import { LANGUAGES, useI18n, type Lang } from "@/lib/i18n";

const AdminPanel = lazy(() => import("@/components/AdminPanel").then((m) => ({ default: m.AdminPanel })));
import {
  signInWithPassword,
  signUpWithPassword,
  getCurrentUser,
} from "@/lib/cloud-sync";
import { playerSignOut } from "@/lib/player-sync";
import { usePlayerSession } from "@/hooks/use-player-session";
import pixelIslandsLogo from "@/assets/pixel-islands-logo.png";
import menuBg from "@/assets/menu-bg.png";


export const Route = createFileRoute("/")({
  component: MainMenu,
});

type Modal = null | "settings" | "language" | "admin-login" | "ia-pixel";

function MainMenu() {
  const { t, lang, setLang } = useI18n();
  const navigate = useNavigate();
  const [modal, setModal] = useState<Modal>(null);
  const [music, setMusic] = useState(70);
  const [sfx, setSfx] = useState(80);
  const [adminOpen, setAdminOpen] = useState(false);
  const [adminUser, setAdminUser] = useState("");
  const [adminPw, setAdminPw] = useState("");
  const [adminErr, setAdminErr] = useState<string | null>(null);
  const [adminMode, setAdminMode] = useState<"signin" | "signup">("signin");
  const [adminBusy, setAdminBusy] = useState(false);
  const { canInstall, isInstalled, promptInstall } = usePwaInstall();
  const { session: playerSession } = usePlayerSession();

  /** Admin accounts are addressed by username only. Supabase Auth still
   *  requires an email under the hood, so we deterministically derive one
   *  from the username. Users never see or type this email. */
  function usernameToEmail(u: string): string {
    return `${u.trim().toLowerCase()}@admin.local`;
  }

  async function submitAdminAuth() {
    if (adminBusy) return;
    const uname = adminUser.trim();
    if (!/^[a-z0-9_.-]{3,32}$/i.test(uname)) {
      setAdminErr("Usuário deve ter 3-32 caracteres (letras, números, _.-).");
      return;
    }
    if (adminPw.length < 6) {
      setAdminErr("Senha deve ter pelo menos 6 caracteres.");
      return;
    }
    setAdminBusy(true);
    setAdminErr(null);
    try {
      const fn = adminMode === "signin" ? signInWithPassword : signUpWithPassword;
      const email = usernameToEmail(uname);
      const { error } = await fn(email, adminPw);
      if (error) {
        setAdminErr(error.message);
        return;
      }
      // Auto-confirm is on, so signup returns a live session — sign in again
      // is unnecessary. Just verify we have a user.
      const u = await getCurrentUser();
      if (!u) {
        setAdminErr("Não foi possível entrar.");
        return;
      }
      if (!u.isAdmin) {
        setAdminErr("Sua conta não é admin. Peça a um admin para promover.");
        return;
      }
      setModal(null);
      setAdminOpen(true);
      setAdminPw("");
      setAdminUser("");
    } finally {
      setAdminBusy(false);
    }
  }


  return (
    <div className="relative min-h-screen overflow-hidden bg-[#1a4a7a] text-[#f4e9c1] font-pixel">
      <img
        src={menuBg}
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full select-none"
        style={{
          objectFit: "cover",
          objectPosition: "left center",
          transform: "scale(1.0667)",
          transformOrigin: "left center",
          imageRendering: "pixelated",
        }}
        draggable={false}
      />

      <main className="relative z-10 flex min-h-screen flex-col items-center justify-between px-6 py-6 short:px-4 short:py-2">
        <img
          src={pixelIslandsLogo}
          alt={t("menu.title")}
          className="mt-4 w-full max-w-[92vw] sm:max-w-[560px] short:max-w-[360px] h-auto select-none"
          style={{
            imageRendering: "pixelated",
            filter:
              "drop-shadow(0 0 18px rgba(255,209,102,0.35)) drop-shadow(6px 6px 0 rgba(0,0,0,0.55))",
            transform: "scale(1.5)"
          }}
          draggable={false}
        />

        <div className="mb-6 flex w-full max-w-xs flex-col gap-4 short:mb-2 short:max-w-2xl short:flex-row short:gap-2">

          <PixelButton
            variant="primary"
            onClick={() =>
              navigate({ to: playerSession ? "/characters" : "/auth" })
            }
          >
            {t("menu.play")}
          </PixelButton>
          <PixelButton onClick={() => setModal("ia-pixel")}>
            🤖 IA Pixel
          </PixelButton>
          <PixelButton onClick={() => setModal("settings")}>
            {t("menu.settings")}
          </PixelButton>
          <PixelButton onClick={() => setModal("language")}>
            {(() => {
              const current = LANGUAGES.find((l) => l.code === lang);
              return current ? `${current.label} ${current.flag}` : lang.toUpperCase();
            })()}
          </PixelButton>
          {!isInstalled && canInstall && (
            <PixelButton onClick={() => void promptInstall()}>
              📱 Instalar App
            </PixelButton>
          )}
        </div>


        <div className="absolute bottom-4 text-[10px] text-[#f4e9c1]/50 tracking-widest short:bottom-1 short:text-[8px]">
          v0.1 · pre-alpha
        </div>

        <button
          onClick={async () => {
            setAdminPw("");
            setAdminUser("");
            setAdminErr(null);
            setAdminMode("signin");
            // If already signed in as admin, skip the login modal.
            const u = await getCurrentUser();
            if (u?.isAdmin) {
              setAdminOpen(true);
            } else {
              setModal("admin-login");
            }
          }}
          className="absolute bottom-3 right-3 border-2 border-[#ffd166]/60 bg-[#1b2a3a]/80 px-2 py-1 text-[9px] uppercase tracking-widest text-[#ffd166] hover:border-[#ffd166]"
        >
          🛠 Admin
        </button>

        {playerSession ? (
          <button
            onClick={() => void playerSignOut()}
            className="absolute bottom-11 right-3 border-2 border-[#f4e9c1]/50 bg-[#1b2a3a]/80 px-2 py-1 text-[9px] uppercase tracking-widest text-[#f4e9c1] hover:border-[#f4e9c1] max-w-[160px] truncate"
            title={`Sair (${playerSession.username})`}
          >
            🚪 {playerSession.username}
          </button>
        ) : (
          <button
            onClick={() => navigate({ to: "/auth" })}
            className="absolute bottom-11 right-3 border-2 border-[#f4e9c1]/50 bg-[#1b2a3a]/80 px-2 py-1 text-[9px] uppercase tracking-widest text-[#f4e9c1] hover:border-[#f4e9c1]"
          >
            🔑 Entrar
          </button>
        )}
      </main>


      {modal === "settings" && (
        <Modal title={t("settings.title")} onClose={() => setModal(null)}>
          <SliderRow label={t("settings.music")} value={music} onChange={setMusic} />
          <SliderRow label={t("settings.sfx")} value={sfx} onChange={setSfx} />
          <div className="mt-6 flex justify-end">
            <PixelButton onClick={() => setModal(null)}>{t("settings.close")}</PixelButton>
          </div>
        </Modal>
      )}

      {modal === "language" && (
        <Modal title={t("lang.title")} onClose={() => setModal(null)}>
          <div className="flex flex-col gap-3">
            {LANGUAGES.map((l) => (
              <button
                key={l.code}
                onClick={() => {
                  setLang(l.code as Lang);
                  setModal(null);
                }}
                className={`flex items-center justify-between border-4 px-4 py-3 text-sm transition-colors ${
                  lang === l.code
                    ? "border-[#ffd166] bg-[#ffd166]/10"
                    : "border-[#f4e9c1]/30 hover:border-[#f4e9c1]/70"
                }`}
              >
                <span>{l.label}</span>
                <span className="text-lg">{l.flag}</span>
              </button>
            ))}
          </div>
        </Modal>
      )}

      {modal === "admin-login" && (
        <Modal title="ADMIN" onClose={() => setModal(null)}>
          <div className="mb-3 text-[10px] tracking-widest text-[#f4e9c1]/70">
            {adminMode === "signin"
              ? "Entre com sua conta de admin:"
              : "Crie uma conta (o primeiro cadastro vira admin):"}
          </div>
          <input
            autoFocus
            type="text"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            placeholder="usuário"
            value={adminUser}
            onChange={(e) => {
              setAdminUser(e.target.value);
              setAdminErr(null);
            }}
            className="mb-2 w-full border-4 border-[#f4e9c1]/50 bg-[#0d1b2a] px-3 py-2 text-sm text-[#f4e9c1] outline-none focus:border-[#ffd166]"
          />
          <input
            type="password"
            placeholder="senha"
            value={adminPw}
            onChange={(e) => {
              setAdminPw(e.target.value);
              setAdminErr(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") void submitAdminAuth();
            }}
            className="w-full border-4 border-[#f4e9c1]/50 bg-[#0d1b2a] px-3 py-2 text-sm text-[#f4e9c1] outline-none focus:border-[#ffd166]"
          />
          {adminErr && (
            <div className="mt-2 text-[10px] text-[#e94560]">{adminErr}</div>
          )}
          {/* Cadastro público desativado — só o admin existente pode entrar. */}
          <div className="mt-4 flex justify-end gap-2">
            <PixelButton onClick={() => setModal(null)}>Cancelar</PixelButton>
            <PixelButton variant="primary" onClick={() => void submitAdminAuth()}>
              {adminBusy ? "..." : adminMode === "signin" ? "Entrar" : "Criar"}
            </PixelButton>
          </div>
        </Modal>
      )}

      {adminOpen && (
        <Suspense fallback={null}>
          <AdminPanel onClose={() => setAdminOpen(false)} />
        </Suspense>
      )}
    </div>
  );
}

function PixelButton({
  children,
  onClick,
  variant = "default",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "default" | "primary";
}) {
  const isPrimary = variant === "primary";
  return (
    <button
      onClick={onClick}
      className={`group relative w-full select-none text-xs sm:text-sm uppercase transition-transform active:translate-y-[3px] ${
        isPrimary ? "text-[#0d1b2a]" : "text-[#f4e9c1]"
      }`}
    >
      <span
        className="block px-6 py-4 border-4 short:px-3 short:py-2 short:text-[10px]"
        style={{
          background: isPrimary ? "#ffd166" : "#1b2a3a",
          borderColor: isPrimary ? "#7a3e1d" : "#f4e9c1",
          boxShadow: isPrimary
            ? "0 6px 0 #7a3e1d, 0 8px 0 rgba(0,0,0,0.5)"
            : "0 6px 0 #0a141f, 0 8px 0 rgba(0,0,0,0.5)",
        }}
      >
        {children}
      </span>
    </button>
  );
}

function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md border-4 border-[#f4e9c1] bg-[#1b2a3a] p-6 text-[#f4e9c1] font-pixel"
        style={{ boxShadow: "0 8px 0 #0a141f, 0 12px 0 rgba(0,0,0,0.5)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-4 text-sm sm:text-base tracking-widest text-[#ffd166]">
          {title}
        </h2>
        {children}
      </div>
    </div>
  );
}

function SliderRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <div className="mb-4">
      <div className="mb-2 flex items-center justify-between text-[10px] sm:text-xs">
        <span>{label}</span>
        <span className="text-[#ffd166]">{value}</span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-[#ffd166]"
      />
    </div>
  );
}

function PixelSun() {
  // Pixel sun with soft outer glow and 8 radiating pixel rays.
  const px = 4;
  const size = 22 * px; // 88px
  const cx = 11, cy = 11;
  const cells: Array<[number, number, string]> = [];
  // Body (circle-ish 8x8) with shading
  for (let y = 0; y < 22; y++) {
    for (let x = 0; x < 22; x++) {
      const d = Math.hypot(x - cx + 0.5, y - cy + 0.5);
      if (d < 4.2) cells.push([x, y, "#ffe08a"]);
      else if (d < 5.3) cells.push([x, y, "#ffd166"]);
      else if (d < 6.2) cells.push([x, y, "#f0a93a"]);
    }
  }
  // Rays (short pixel bars N/S/E/W + diagonals)
  const ray = (x: number, y: number) => cells.push([x, y, "#ffd166"]);
  for (let i = 0; i < 3; i++) { ray(cx, i); ray(cx, 21 - i); ray(i, cy); ray(21 - i, cy); }
  ray(2, 2); ray(3, 3); ray(19, 2); ray(18, 3);
  ray(2, 19); ray(3, 18); ray(19, 19); ray(18, 18);
  return (
    <svg width={size} height={size} shapeRendering="crispEdges"
      style={{ filter: "drop-shadow(0 0 12px rgba(255,209,102,0.45))" }}>
      {cells.map(([x, y, c], i) => (
        <rect key={i} x={x * px} y={y * px} width={px} height={px} fill={c} />
      ))}
    </svg>
  );
}

function PixelGull({ small = false }: { small?: boolean }) {
  // Two chevrons — a stylized flying seagull. Chunky pixel style.
  const px = small ? 3 : 4;
  const cells: Array<[number, number]> = [
    [0,1],[1,0],[2,1],       // left wing
    [3,1],                     // body
    [4,1],[5,0],[6,1],       // right wing
  ];
  return (
    <svg width={7 * px} height={2 * px} shapeRendering="crispEdges"
      style={{ filter: "drop-shadow(1px 2px 0 rgba(0,0,0,0.25))" }}>
      {cells.map(([x, y], i) => (
        <rect key={i} x={x * px} y={y * px} width={px} height={px} fill="#2c2830" />
      ))}
    </svg>
  );
}

function PixelHorizonIsland({ w, h }: { w: number; h: number }) {
  // A flat silhouette dome for distant islands.
  const px = 4;
  const cells: Array<[number, number]> = [];
  for (let y = 0; y < h; y++) {
    const inset = Math.round((y / h) * (w * 0.35));
    for (let x = inset; x < w - inset; x++) cells.push([x, h - 1 - y]);
  }
  return (
    <svg width={w * px} height={h * px} shapeRendering="crispEdges">
      {cells.map(([x, y], i) => (
        <rect key={i} x={x * px} y={y * px} width={px} height={px} fill="#1a4a7a" />
      ))}
    </svg>
  );
}

function PixelCloud({ variant = "big" }: { variant?: "big" | "small" | "wide" }) {
  const px = 6;
  let cells: Array<[number, number]>;
  let w = 7, h = 4;
  if (variant === "small") {
    w = 5; h = 3;
    cells = [
      [1,0],[2,0],
      [0,1],[1,1],[2,1],[3,1],[4,1],
      [1,2],[2,2],[3,2],
    ];
  } else if (variant === "wide") {
    w = 10; h = 4;
    cells = [
      [2,1],[3,1],[4,1],[5,1],[6,1],[7,1],
      [1,2],[2,2],[3,2],[4,2],[5,2],[6,2],[7,2],[8,2],[9,2],
      [2,3],[3,3],[4,3],[5,3],[6,3],[7,3],
    ];
  } else {
    cells = [
      [1,1],[2,1],[3,1],[4,1],
      [0,2],[1,2],[2,2],[3,2],[4,2],[5,2],[6,2],
      [1,3],[2,3],[3,3],[4,3],[5,3],
    ];
  }
  // Bottom shading row
  const shade = new Set(cells.filter(([, y]) => y === h - 1).map(([x]) => x));
  return (
    <svg width={w * px} height={h * px} shapeRendering="crispEdges"
      style={{ display: "block", filter: "drop-shadow(2px 3px 0 rgba(0,0,0,0.15))" }}>
      {cells.map(([x, y], i) => (
        <rect key={i} x={x * px} y={y * px} width={px} height={px}
          fill={shade.has(x) && y === h - 1 ? "#dfeaf3" : "#ffffff"} />
      ))}
    </svg>
  );
}

function PixelIsland({ variant, scale = 1 }: { variant: "palm" | "rock" | "small" | "twin" | "arch"; scale?: number }) {

  const px = 5;
  // Base sand + darker sand + rim of shadow water underneath
  const SAND = "#f2d17a";
  const SAND_D = "#c99b48";
  const GRASS = "#4aa64a";
  const GRASS_D = "#2e7a34";
  const TRUNK = "#7a4a1f";
  const ROCK = "#6a7080";
  const ROCK_D = "#3f4553";
  const WATER = "#1a4a7a";

  // Simple pixel patterns per variant
  type Cell = { x: number; y: number; c: string };
  const cells: Cell[] = [];
  const add = (x: number, y: number, c: string) => cells.push({ x, y, c });

  if (variant === "palm") {
    // 10x8 grid
    // sand base
    for (let x = 1; x <= 8; x++) add(x, 5, SAND);
    for (let x = 2; x <= 7; x++) add(x, 4, SAND);
    for (let x = 0; x <= 9; x++) add(x, 6, SAND_D);
    for (let x = 1; x <= 8; x++) add(x, 7, WATER);
    // trunk
    add(4, 3, TRUNK); add(4, 2, TRUNK); add(4, 1, TRUNK);
    // leaves
    add(3, 0, GRASS_D); add(4, 0, GRASS); add(5, 0, GRASS_D);
    add(2, 1, GRASS_D); add(3, 1, GRASS); add(5, 1, GRASS); add(6, 1, GRASS_D);
  } else if (variant === "rock") {
    // 8x6
    for (let x = 1; x <= 6; x++) add(x, 4, SAND);
    for (let x = 0; x <= 7; x++) add(x, 5, SAND_D);
    add(2, 3, ROCK); add(3, 3, ROCK); add(4, 3, ROCK); add(5, 3, ROCK_D);
    add(3, 2, ROCK); add(4, 2, ROCK_D);
    add(4, 1, ROCK_D);
    for (let x = 1; x <= 6; x++) add(x, 6, WATER);
  } else if (variant === "twin") {
    // 14x8 wider island with two palms
    for (let x = 1; x <= 12; x++) add(x, 5, SAND);
    for (let x = 2; x <= 11; x++) add(x, 4, SAND);
    for (let x = 0; x <= 13; x++) add(x, 6, SAND_D);
    for (let x = 1; x <= 12; x++) add(x, 7, WATER);
    // left palm
    add(3, 3, TRUNK); add(3, 2, TRUNK); add(3, 1, TRUNK);
    add(2, 0, GRASS_D); add(3, 0, GRASS); add(4, 0, GRASS_D);
    add(1, 1, GRASS_D); add(2, 1, GRASS); add(4, 1, GRASS);
    // right palm (taller)
    add(9, 3, TRUNK); add(9, 2, TRUNK); add(9, 1, TRUNK); add(9, 0, TRUNK);
    add(8, -1 as unknown as number, GRASS_D); // fallback; use y=0..
    add(8, 0, GRASS); add(9, 0, GRASS_D); add(10, 0, GRASS);
    add(7, 1, GRASS_D); add(11, 1, GRASS_D);
  } else if (variant === "arch") {
    // 10x7 rocky arch island
    for (let x = 1; x <= 8; x++) add(x, 4, SAND);
    for (let x = 0; x <= 9; x++) add(x, 5, SAND_D);
    for (let x = 1; x <= 8; x++) add(x, 6, WATER);
    // arch pillars
    add(2, 3, ROCK); add(2, 2, ROCK); add(2, 1, ROCK_D);
    add(7, 3, ROCK); add(7, 2, ROCK); add(7, 1, ROCK_D);
    // arch top
    add(3, 0, ROCK_D); add(4, 0, ROCK); add(5, 0, ROCK); add(6, 0, ROCK_D);
    add(3, 1, ROCK); add(6, 1, ROCK);
  } else {
    // small: 6x4
    for (let x = 1; x <= 4; x++) add(x, 2, SAND);
    for (let x = 0; x <= 5; x++) add(x, 3, SAND_D);
    add(2, 1, GRASS); add(3, 1, GRASS_D);
    for (let x = 1; x <= 4; x++) add(x, 4, WATER);
  }

  // Drop any negative-y stragglers
  const filtered = cells.filter((c) => c.y >= 0);
  cells.length = 0;
  cells.push(...filtered);


  const maxX = Math.max(...cells.map((c) => c.x)) + 1;
  const maxY = Math.max(...cells.map((c) => c.y)) + 1;

  return (
    <svg
      width={maxX * px * scale}
      height={maxY * px * scale}
      viewBox={`0 0 ${maxX * px} ${maxY * px}`}
      shapeRendering="crispEdges"
      style={{ display: "block", filter: "drop-shadow(2px 4px 0 rgba(0,0,0,0.35))" }}
    >
      {cells.map((c, i) => (
        <rect key={i} x={c.x * px} y={c.y * px} width={px} height={px} fill={c.c} />
      ))}
    </svg>
  );
}



type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function usePwaInstall() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia?.("(display-mode: standalone)").matches ||
      // iOS Safari
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsInstalled(!!standalone);

    const ua = window.navigator.userAgent || "";
    const iOS = /iPhone|iPad|iPod/i.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua);
    setIsIos(iOS);

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setIsInstalled(true);
      setDeferred(null);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  async function promptInstall() {
    if (deferred) {
      await deferred.prompt();
      const { outcome } = await deferred.userChoice;
      if (outcome === "accepted") setIsInstalled(true);
      setDeferred(null);
      return;
    }
    if (isIos) {
      alert(
        "Para instalar no iPhone/iPad:\n\n1. Toque no botão Compartilhar (□↑)\n2. Escolha 'Adicionar à Tela de Início'",
      );
    } else {
      alert(
        "Para instalar: abra o menu do navegador e escolha 'Instalar app' ou 'Adicionar à tela inicial'.",
      );
    }
  }

  return {
    canInstall: !!deferred || isIos,
    isInstalled,
    promptInstall,
  };
}

