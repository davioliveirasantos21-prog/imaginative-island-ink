import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useI18n, LANGUAGES, type Lang } from "@/lib/i18n";
import pixelIslandsLogo from "@/assets/pixel-islands-logo.png";
import menuBg from "@/assets/menu-bg.png";
import beachBg from "@/assets/beach-bg.png.asset.json";
import caveEntrance from "@/assets/cave-entrance.png.asset.json";
import stoneBg from "@/assets/stone-bg.png.asset.json";
import skillsBg from "@/assets/skills-bg.png.asset.json";
import settingsBg from "@/assets/settings-bg.png.asset.json";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Pixel Islands — Survival Pixel Sandbox Built with Vibecoding AI" },
      {
        name: "description",
        content:
          "Pixel Islands is a handcrafted 2D survival sandbox — one of the first games built end-to-end with vibecoding AI. Explore islands, mine, craft, fight and shape your world.",
      },
      { property: "og:type", content: "website" },
      { property: "og:title", content: "Pixel Islands — Pixel Survival Sandbox" },
      {
        property: "og:description",
        content:
          "Explore, mine, craft and fight in Pixel Islands — a pixel-art survival sandbox forged with vibecoding AI.",
      },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

type Copy = {
  nav: { features: string; screens: string; faq: string; play: string };
  hero: {
    badge: string;
    title1: string;
    title2: string;
    subtitle: string;
    ctaPlay: string;
    ctaScroll: string;
    stat1: string;
    stat1l: string;
    stat2: string;
    stat2l: string;
    stat3: string;
    stat3l: string;
  };
  vibe: {
    kicker: string;
    title: string;
    body: string;
  };
  style: {
    title: string;
    subtitle: string;
    cards: { title: string; body: string; icon: string }[];
  };
  screens: { title: string; subtitle: string; caps: string[] };
  faq: { title: string; items: { q: string; a: string }[] };
  footer: string;
};

const COPY: Record<"pt" | "en" | "es", Copy> = {
  pt: {
    nav: { features: "Estilo", screens: "Imagens", faq: "FAQ", play: "Jogar" },
    hero: {
      badge: "◆ Pré-alpha · 2026",
      title1: "Sobreviva.",
      title2: "Construa seu arquipélago.",
      subtitle:
        "Um sandbox pixelado de sobrevivência forjado à mão, pixel por pixel. Cave cavernas, funda barras, plante palmeiras, enfrente aranhas gigantes e reconstrua a civilização — sozinho ou com quem chegar na sua ilha.",
      ctaPlay: "▶ Jogar agora",
      ctaScroll: "Descobrir o mundo",
      stat1: "3+",
      stat1l: "Biomas explorados",
      stat2: "40+",
      stat2l: "Itens & receitas",
      stat3: "∞",
      stat3l: "Ilhas geradas",
    },
    vibe: {
      kicker: "· Feito com Vibecoding IA ·",
      title: "Um dos primeiros jogos nascidos do vibecoding.",
      body:
        "Pixel Islands é um experimento honesto: cada tile, cada som, cada linha de mecânica foi orquestrada em parceria com uma IA generativa em tempo real. Não é um asset flip nem um wrapper — é design de verdade, iterando na velocidade do pensamento. Você está vendo uma nova forma de fazer jogos acontecer, ao vivo.",
    },
    style: {
      title: "Estilo de jogo",
      subtitle: "Sandbox de sobrevivência 2D, com uma alma old-school.",
      cards: [
        {
          icon: "⛏",
          title: "Mineração & Forja",
          body:
            "Do minério bruto ao machado de ferro: cave, funda, refine. Cada barra na sua mão te lembra que você é um ferreiro agora.",
        },
        {
          icon: "🌴",
          title: "Coleta & Cultivo",
          body:
            "Corte árvores adultas, plante mudas de palmeira, colha frutos. O tempo passa e a ilha responde ao que você planta.",
        },
        {
          icon: "🕷",
          title: "Combate por biomas",
          body:
            "Lacraias na praia, aranhas gigantes no teto da caverna. Cada bicho pede uma tática — e uma arma nova.",
        },
        {
          icon: "🏗",
          title: "Construção livre",
          body:
            "Blueprints coloridos mostram exatamente o que falta. Sua base cresce peça por peça, no seu ritmo.",
        },
        {
          icon: "🎒",
          title: "Habilidades",
          body:
            "Forja, Combate, Precisão. Cada golpe conta XP. Evolua o que você joga, não o que o menu decide.",
        },
        {
          icon: "🌗",
          title: "Ciclo dia/noite",
          body:
            "Sol nasce, vagalumes acendem, aranhas descem. A noite muda tudo — inclusive a trilha sonora.",
        },
      ],
    },
    screens: {
      title: "Um mundo pintado à mão",
      subtitle: "Cada bioma tem sua paleta. Cada tela é um cartão-postal pixelado.",
      caps: [
        "Praia ao amanhecer",
        "Cavernas profundas",
        "Salão de habilidades",
        "Fornalha & forja",
        "Configurações rústicas",
      ],
    },
    faq: {
      title: "Perguntas frequentes",
      items: [
        {
          q: "O jogo é gratuito?",
          a: "Sim. Durante o pré-alpha, Pixel Islands é totalmente gratuito. Basta criar uma conta com seu e-mail e senha para salvar seu progresso na nuvem.",
        },
        {
          q: "O que é 'vibecoding com IA'?",
          a: "É desenvolvimento colaborativo com uma IA generativa: você descreve a mecânica, a arte ou o bug, e a IA implementa em segundos. Pixel Islands é construído inteiro assim — desde o motor de física até os sprites dos itens.",
        },
        {
          q: "Precisa baixar?",
          a: "Não. Roda direto no navegador, tanto no PC quanto no celular. Se quiser, dá para instalar como app (PWA) e jogar offline entre sessões.",
        },
        {
          q: "Meu progresso fica salvo?",
          a: "Fica. Cada personagem é sincronizado com a nuvem por conta. Se você trocar de dispositivo, entra na sua conta e continua exatamente de onde parou.",
        },
        {
          q: "Vai ter multiplayer?",
          a: "Multiplayer cooperativo está no roadmap. Por enquanto o foco é polir a experiência solo e adicionar mais biomas, chefes e receitas.",
        },
        {
          q: "Como reporto bugs ou dou ideias?",
          a: "Entre no jogo e use o menu de feedback — ou fale direto com a comunidade. Cada relato ajusta o próximo update, que costuma sair no mesmo dia.",
        },
      ],
    },
    footer: "Pixel Islands · construído com vibecoding · pixelislands.site",
  },
  en: {
    nav: { features: "Style", screens: "Screens", faq: "FAQ", play: "Play" },
    hero: {
      badge: "◆ Pre-alpha · 2026",
      title1: "Survive.",
      title2: "Build your archipelago.",
      subtitle:
        "A handcrafted pixel survival sandbox, tile by tile. Dig caves, smelt bars, plant palms, fight giant spiders, and rebuild civilization — alone or with whoever washes ashore.",
      ctaPlay: "▶ Play now",
      ctaScroll: "Explore the world",
      stat1: "3+",
      stat1l: "Biomes to explore",
      stat2: "40+",
      stat2l: "Items & recipes",
      stat3: "∞",
      stat3l: "Islands generated",
    },
    vibe: {
      kicker: "· Built with Vibecoding AI ·",
      title: "One of the first games born from vibecoding.",
      body:
        "Pixel Islands is an honest experiment: every tile, every sound, every line of mechanics was orchestrated with a generative AI in real time. This is not an asset flip or a wrapper — it's real design, iterated at the speed of thought. You're watching a new way of making games happen, live.",
    },
    style: {
      title: "Game style",
      subtitle: "2D survival sandbox with an old-school soul.",
      cards: [
        {
          icon: "⛏",
          title: "Mine & Smelt",
          body:
            "From raw ore to iron axe: dig, smelt, refine. Every bar in your hand reminds you — you're the blacksmith now.",
        },
        {
          icon: "🌴",
          title: "Forage & Grow",
          body:
            "Chop adult trees, plant palm saplings, harvest fruit. Time passes and the island answers what you seed.",
        },
        {
          icon: "🕷",
          title: "Biome combat",
          body:
            "Centipedes on the beach, giant spiders in the cave ceiling. Each creature demands a new tactic — and a new weapon.",
        },
        {
          icon: "🏗",
          title: "Free-form building",
          body:
            "Color-coded blueprints show exactly what's missing. Your base grows piece by piece, at your pace.",
        },
        {
          icon: "🎒",
          title: "Skills",
          body:
            "Forge, Combat, Precision. Every swing earns XP. Level up what you actually play — not what a menu picks.",
        },
        {
          icon: "🌗",
          title: "Day/Night cycle",
          body:
            "Sun rises, fireflies glow, spiders descend. Night changes everything — including the soundtrack.",
        },
      ],
    },
    screens: {
      title: "A hand-painted world",
      subtitle: "Every biome has its palette. Every screen is a pixel postcard.",
      caps: [
        "Beach at dawn",
        "Deep caves",
        "Skill hall",
        "Furnace & forge",
        "Rustic settings",
      ],
    },
    faq: {
      title: "Frequently asked",
      items: [
        {
          q: "Is the game free?",
          a: "Yes. During pre-alpha, Pixel Islands is completely free. Just create an account with email and password to keep your progress in the cloud.",
        },
        {
          q: "What does 'vibecoding with AI' mean?",
          a: "It's collaborative development with a generative AI: you describe the mechanic, the art or the bug, and the AI ships it in seconds. Pixel Islands is built entirely that way — from the physics engine to the item sprites.",
        },
        {
          q: "Do I have to download it?",
          a: "No. It runs right in your browser on desktop and mobile. If you like, install it as an app (PWA) and play offline between sessions.",
        },
        {
          q: "Is my progress saved?",
          a: "Yes. Every character is synced to the cloud on your account. Switch devices, log in, and pick up exactly where you left off.",
        },
        {
          q: "Will there be multiplayer?",
          a: "Co-op multiplayer is on the roadmap. Right now the focus is polishing the solo experience and adding more biomes, bosses and recipes.",
        },
        {
          q: "How do I report bugs or suggest ideas?",
          a: "Use the in-game feedback menu — or reach out to the community. Every report shapes the next update, which usually ships the same day.",
        },
      ],
    },
    footer: "Pixel Islands · built with vibecoding · pixelislands.site",
  },
  es: {
    nav: { features: "Estilo", screens: "Imágenes", faq: "FAQ", play: "Jugar" },
    hero: {
      badge: "◆ Pre-alpha · 2026",
      title1: "Sobrevive.",
      title2: "Construye tu archipiélago.",
      subtitle:
        "Un sandbox de supervivencia pixelado hecho a mano, píxel a píxel. Excava cuevas, funde barras, planta palmeras, enfrenta arañas gigantes y reconstruye la civilización.",
      ctaPlay: "▶ Jugar ahora",
      ctaScroll: "Explorar el mundo",
      stat1: "3+",
      stat1l: "Biomas por explorar",
      stat2: "40+",
      stat2l: "Objetos & recetas",
      stat3: "∞",
      stat3l: "Islas generadas",
    },
    vibe: {
      kicker: "· Hecho con Vibecoding IA ·",
      title: "Uno de los primeros juegos nacidos del vibecoding.",
      body:
        "Pixel Islands es un experimento honesto: cada tile, cada sonido, cada línea de mecánica fue orquestada junto a una IA generativa en tiempo real. No es un asset flip — es diseño real a la velocidad del pensamiento.",
    },
    style: {
      title: "Estilo de juego",
      subtitle: "Sandbox de supervivencia 2D con alma old-school.",
      cards: [
        { icon: "⛏", title: "Minería & Fundición", body: "Del mineral al hacha de hierro: excava, funde, refina." },
        { icon: "🌴", title: "Recolección & Cultivo", body: "Tala árboles, planta palmeras, cosecha frutos." },
        { icon: "🕷", title: "Combate por bioma", body: "Cada criatura pide una táctica y un arma nueva." },
        { icon: "🏗", title: "Construcción libre", body: "Planos que muestran justo lo que falta." },
        { icon: "🎒", title: "Habilidades", body: "Forja, Combate, Precisión. Cada golpe cuenta XP." },
        { icon: "🌗", title: "Ciclo día/noche", body: "El sol sale, las luciérnagas brillan, las arañas bajan." },
      ],
    },
    screens: {
      title: "Un mundo pintado a mano",
      subtitle: "Cada bioma tiene su paleta. Cada pantalla es una postal pixelada.",
      caps: ["Playa al amanecer", "Cuevas profundas", "Sala de habilidades", "Horno & fragua", "Configuración rústica"],
    },
    faq: {
      title: "Preguntas frecuentes",
      items: [
        { q: "¿El juego es gratis?", a: "Sí. Durante el pre-alpha es totalmente gratuito." },
        { q: "¿Qué es 'vibecoding con IA'?", a: "Desarrollo colaborativo con IA generativa: describes y la IA lo implementa en segundos." },
        { q: "¿Hay que descargarlo?", a: "No. Corre en el navegador, en PC y móvil. También como PWA." },
        { q: "¿Se guarda mi progreso?", a: "Sí, sincronizado en la nube por cuenta." },
        { q: "¿Habrá multijugador?", a: "Cooperativo está en el roadmap." },
        { q: "¿Cómo reporto bugs?", a: "Menú de feedback in-game o comunidad." },
      ],
    },
    footer: "Pixel Islands · hecho con vibecoding · pixelislands.site",
  },
};

function Landing() {
  const { lang, setLang } = useI18n();
  const key = (lang === "pt" || lang === "en" || lang === "es" ? lang : "en") as "pt" | "en" | "es";
  const c = COPY[key];
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [langOpen, setLangOpen] = useState(false);

  const shots = [
    { url: menuBg as unknown as string, cap: c.screens.caps[0] },
    { url: caveEntrance.url, cap: c.screens.caps[1] },
    { url: skillsBg.url, cap: c.screens.caps[2] },
    { url: stoneBg.url, cap: c.screens.caps[3] },
    { url: settingsBg.url, cap: c.screens.caps[4] },
    { url: beachBg.url, cap: c.screens.caps[0] },
  ];

  return (
    <div className="min-h-screen bg-[#0a141f] text-[#f4e9c1] font-pixel selection:bg-[#ffd166] selection:text-[#0a141f]">
      {/* NAV */}
      <header className="sticky top-0 z-40 border-b-4 border-[#ffd166]/30 bg-[#0a141f]/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <a href="#top" className="flex items-center gap-3">
            <img
              src={pixelIslandsLogo}
              alt="Pixel Islands"
              className="h-8 w-auto"
              style={{ imageRendering: "pixelated" }}
            />
            <span className="hidden text-[10px] tracking-[0.3em] text-[#ffd166] sm:inline">
              PIXEL ISLANDS
            </span>
          </a>
          <nav className="flex items-center gap-1 text-[10px] tracking-widest sm:gap-4 sm:text-xs">
            <a href="#style" className="hidden text-[#f4e9c1]/80 hover:text-[#ffd166] sm:inline">
              {c.nav.features}
            </a>
            <a href="#screens" className="hidden text-[#f4e9c1]/80 hover:text-[#ffd166] sm:inline">
              {c.nav.screens}
            </a>
            <a href="#faq" className="hidden text-[#f4e9c1]/80 hover:text-[#ffd166] sm:inline">
              {c.nav.faq}
            </a>

            <div className="relative">
              <button
                onClick={() => setLangOpen((v) => !v)}
                className="border-2 border-[#f4e9c1]/40 px-2 py-1 text-[10px] uppercase tracking-widest text-[#f4e9c1] hover:border-[#ffd166]"
              >
                {LANGUAGES.find((l) => l.code === lang)?.flag ?? "🌐"} {lang.toUpperCase()}
              </button>
              {langOpen && (
                <div className="absolute right-0 top-full mt-2 flex flex-col border-4 border-[#ffd166] bg-[#1b2a3a] p-1">
                  {LANGUAGES.map((l) => (
                    <button
                      key={l.code}
                      onClick={() => {
                        setLang(l.code as Lang);
                        setLangOpen(false);
                      }}
                      className={`whitespace-nowrap px-3 py-2 text-left text-[10px] tracking-widest hover:bg-[#ffd166]/15 ${
                        lang === l.code ? "text-[#ffd166]" : "text-[#f4e9c1]"
                      }`}
                    >
                      {l.flag} {l.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <Link
              to="/game"
              className="ml-1 border-2 border-[#ffd166] bg-[#ffd166] px-3 py-1 text-[10px] uppercase tracking-widest text-[#0a141f] hover:bg-[#ffe08a]"
            >
              {c.nav.play}
            </Link>
          </nav>
        </div>
      </header>

      {/* HERO */}
      <section id="top" className="relative overflow-hidden border-b-4 border-[#ffd166]/30">
        <img
          src={menuBg}
          alt=""
          aria-hidden
          className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-60"
          style={{ imageRendering: "pixelated" }}
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#0a141f]/40 via-[#0a141f]/40 to-[#0a141f]" />
        <div className="relative mx-auto flex max-w-6xl flex-col items-center gap-8 px-4 py-20 text-center sm:py-28">
          <span className="border-2 border-[#ffd166]/70 bg-[#0a141f]/70 px-3 py-1 text-[10px] tracking-[0.35em] text-[#ffd166]">
            {c.hero.badge}
          </span>
          <img
            src={pixelIslandsLogo}
            alt="Pixel Islands"
            className="w-full max-w-[520px]"
            style={{
              imageRendering: "pixelated",
              filter:
                "drop-shadow(0 0 24px rgba(255,209,102,0.45)) drop-shadow(6px 6px 0 rgba(0,0,0,0.6))",
            }}
          />
          <h1 className="max-w-3xl text-2xl leading-tight sm:text-4xl md:text-5xl">
            <span className="text-[#ffd166]">{c.hero.title1}</span>{" "}
            <span className="text-[#f4e9c1]">{c.hero.title2}</span>
          </h1>
          <p className="max-w-2xl text-xs leading-relaxed text-[#f4e9c1]/85 sm:text-sm">
            {c.hero.subtitle}
          </p>
          <div className="flex flex-col items-center gap-3 sm:flex-row">
            <Link
              to="/game"
              className="border-4 border-[#7a3e1d] bg-[#ffd166] px-8 py-4 text-sm uppercase tracking-widest text-[#0a141f] hover:translate-y-[-2px]"
              style={{ boxShadow: "0 6px 0 #7a3e1d, 0 10px 0 rgba(0,0,0,0.55)" }}
            >
              {c.hero.ctaPlay}
            </Link>
            <a
              href="#style"
              className="border-4 border-[#f4e9c1] bg-[#1b2a3a] px-6 py-4 text-xs uppercase tracking-widest text-[#f4e9c1] hover:border-[#ffd166]"
              style={{ boxShadow: "0 6px 0 #0a141f, 0 10px 0 rgba(0,0,0,0.55)" }}
            >
              {c.hero.ctaScroll}
            </a>
          </div>

          <div className="mt-6 grid w-full max-w-2xl grid-cols-3 gap-3 sm:gap-6">
            {[
              [c.hero.stat1, c.hero.stat1l],
              [c.hero.stat2, c.hero.stat2l],
              [c.hero.stat3, c.hero.stat3l],
            ].map(([n, l]) => (
              <div
                key={l}
                className="border-2 border-[#ffd166]/40 bg-[#0a141f]/60 p-3 sm:p-4"
              >
                <div className="text-2xl text-[#ffd166] sm:text-3xl">{n}</div>
                <div className="mt-1 text-[9px] tracking-widest text-[#f4e9c1]/70 sm:text-[10px]">
                  {l}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* VIBECODING */}
      <section className="border-b-4 border-[#ffd166]/20 bg-[#0d1b2a] py-16 sm:py-24">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <div className="mb-4 text-[10px] tracking-[0.4em] text-[#ffd166]">{c.vibe.kicker}</div>
          <h2 className="text-2xl leading-tight sm:text-4xl">{c.vibe.title}</h2>
          <p className="mx-auto mt-6 max-w-2xl text-xs leading-relaxed text-[#f4e9c1]/80 sm:text-sm">
            {c.vibe.body}
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-2 text-[9px] tracking-widest text-[#ffd166]/80 sm:text-[10px]">
            <span className="border border-[#ffd166]/40 px-2 py-1">AI-DESIGNED SPRITES</span>
            <span className="border border-[#ffd166]/40 px-2 py-1">LIVE ITERATION</span>
            <span className="border border-[#ffd166]/40 px-2 py-1">HANDCRAFTED FEEL</span>
            <span className="border border-[#ffd166]/40 px-2 py-1">NO ASSET FLIP</span>
          </div>
        </div>
      </section>

      {/* STYLE / FEATURES */}
      <section id="style" className="border-b-4 border-[#ffd166]/20 py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-10 text-center">
            <h2 className="text-2xl sm:text-4xl">{c.style.title}</h2>
            <p className="mt-3 text-xs text-[#f4e9c1]/70 sm:text-sm">{c.style.subtitle}</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {c.style.cards.map((card) => (
              <div
                key={card.title}
                className="border-4 border-[#f4e9c1]/25 bg-[#1b2a3a] p-5 transition-transform hover:-translate-y-1 hover:border-[#ffd166]"
                style={{ boxShadow: "0 6px 0 #0a141f, 0 8px 0 rgba(0,0,0,0.4)" }}
              >
                <div className="mb-3 text-3xl">{card.icon}</div>
                <div className="mb-2 text-sm tracking-widest text-[#ffd166]">{card.title}</div>
                <p className="text-[11px] leading-relaxed text-[#f4e9c1]/80 sm:text-xs">
                  {card.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SCREENSHOTS */}
      <section id="screens" className="border-b-4 border-[#ffd166]/20 bg-[#0d1b2a] py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-10 text-center">
            <h2 className="text-2xl sm:text-4xl">{c.screens.title}</h2>
            <p className="mt-3 text-xs text-[#f4e9c1]/70 sm:text-sm">{c.screens.subtitle}</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {shots.map((s, i) => (
              <figure
                key={i}
                className="group relative overflow-hidden border-4 border-[#f4e9c1]/25 bg-[#0a141f] hover:border-[#ffd166]"
                style={{ boxShadow: "0 6px 0 #0a141f" }}
              >
                <img
                  src={s.url}
                  alt={s.cap}
                  className="h-56 w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  style={{ imageRendering: "pixelated" }}
                  loading="lazy"
                />
                <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#0a141f] to-transparent px-3 py-2 text-[10px] tracking-widest text-[#ffd166]">
                  {s.cap}
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-16 sm:py-24">
        <div className="mx-auto max-w-3xl px-4">
          <h2 className="mb-8 text-center text-2xl sm:text-4xl">{c.faq.title}</h2>
          <div className="flex flex-col gap-3">
            {c.faq.items.map((item, i) => {
              const open = openFaq === i;
              return (
                <div
                  key={i}
                  className="border-4 border-[#f4e9c1]/25 bg-[#1b2a3a]"
                  style={{ boxShadow: "0 4px 0 #0a141f" }}
                >
                  <button
                    onClick={() => setOpenFaq(open ? null : i)}
                    className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left text-xs uppercase tracking-widest text-[#f4e9c1] hover:text-[#ffd166] sm:text-sm"
                  >
                    <span>{item.q}</span>
                    <span className="text-[#ffd166]">{open ? "−" : "+"}</span>
                  </button>
                  {open && (
                    <div className="border-t-2 border-[#f4e9c1]/15 px-4 py-3 text-[11px] leading-relaxed text-[#f4e9c1]/80 sm:text-xs">
                      {item.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-14 text-center">
            <Link
              to="/game"
              className="inline-block border-4 border-[#7a3e1d] bg-[#ffd166] px-10 py-4 text-sm uppercase tracking-widest text-[#0a141f]"
              style={{ boxShadow: "0 6px 0 #7a3e1d, 0 10px 0 rgba(0,0,0,0.55)" }}
            >
              {c.hero.ctaPlay}
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t-4 border-[#ffd166]/20 bg-[#0a141f] px-4 py-6 text-center text-[10px] tracking-widest text-[#f4e9c1]/50">
        {c.footer}
      </footer>
    </div>
  );
}
