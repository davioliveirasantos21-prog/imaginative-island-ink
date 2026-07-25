import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useI18n, LANGUAGES, type Lang } from "@/lib/i18n";
import { logPageView } from "@/lib/tracker.functions";
import { submitContact } from "@/lib/contact.functions";
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
  nav: { features: string; screens: string; faq: string; contact: string; play: string };
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
  vibe: { kicker: string; title: string; body: string };
  style: { title: string; subtitle: string; cards: { title: string; body: string; icon: string }[] };
  screens: { title: string; subtitle: string; caps: string[]; captions: string[] };
  faq: { title: string; items: { q: string; a: string }[] };
  contact: {
    kicker: string;
    title: string;
    subtitle: string;
    name: string;
    email: string;
    subject: string;
    message: string;
    send: string;
    sending: string;
    ok: string;
    err: string;
    or: string;
    directEmail: string;
  };
  footer: string;
};

const COPY: Record<"pt" | "en" | "es", Copy> = {
  pt: {
    nav: { features: "Estilo", screens: "Imagens", faq: "FAQ", contact: "Contato", play: "Jogar" },
    hero: {
      badge: "◆ Pré-alpha · 2026",
      title1: "Sobreviva.",
      title2: "Construa seu arquipélago.",
      subtitle:
        "Um sandbox pixelado de sobrevivência forjado à mão, pixel por pixel. Cave cavernas, funda barras, plante palmeiras, enfrente aranhas gigantes e reconstrua a civilização — sozinho ou com quem chegar na sua ilha.",
      ctaPlay: "▶ Jogar agora",
      ctaScroll: "Descobrir o mundo",
      stat1: "3+", stat1l: "Biomas explorados",
      stat2: "40+", stat2l: "Itens & receitas",
      stat3: "∞", stat3l: "Ilhas geradas",
    },
    vibe: {
      kicker: "· Feito com Vibecoding IA ·",
      title: "Um dos primeiros jogos nascidos do vibecoding.",
      body:
        "Pixel Islands é um experimento honesto: cada tile, cada som, cada linha de mecânica foi orquestrada em parceria com uma IA generativa em tempo real. Não é um asset flip nem um wrapper — é design de verdade, iterando na velocidade do pensamento.",
    },
    style: {
      title: "Estilo de jogo",
      subtitle: "Sandbox de sobrevivência 2D, com uma alma old-school.",
      cards: [
        { icon: "⛏", title: "Mineração & Forja", body: "Do minério bruto ao machado de ferro: cave, funda, refine. Cada barra na sua mão te lembra que você é um ferreiro agora." },
        { icon: "🌴", title: "Coleta & Cultivo", body: "Corte árvores adultas, plante mudas de palmeira, colha frutos. O tempo passa e a ilha responde ao que você planta." },
        { icon: "🕷", title: "Combate por biomas", body: "Lacraias na praia, aranhas gigantes no teto da caverna. Cada bicho pede uma tática — e uma arma nova." },
        { icon: "🏗", title: "Construção livre", body: "Blueprints coloridos mostram exatamente o que falta. Sua base cresce peça por peça, no seu ritmo." },
        { icon: "🎒", title: "Habilidades", body: "Forja, Combate, Precisão. Cada golpe conta XP. Evolua o que você joga." },
        { icon: "🌗", title: "Ciclo dia/noite", body: "Sol nasce, vagalumes acendem, aranhas descem. A noite muda tudo — inclusive a trilha." },
      ],
    },
    screens: {
      title: "Um mundo pintado à mão",
      subtitle: "Cada bioma tem sua paleta. Cada tela é um cartão-postal pixelado.",
      caps: ["Praia ao amanhecer", "Cavernas profundas", "Salão de habilidades", "Fornalha & forja", "Configurações rústicas", "Ilhas ao entardecer"],
      captions: [
        "Onde a maré traz madeira, coco e as primeiras lacraias.",
        "Ferro, salitre e aranhas gigantes esperando lá no fundo.",
        "Três árvores de habilidade que evoluem conforme você joga.",
        "Barras derretidas frame a frame — uma fornalha por prédio.",
        "Configuração e áudio com estética de acampamento medieval.",
        "Ciclo dia/noite completo com estrelas, luar e vagalumes.",
      ],
    },
    faq: {
      title: "Perguntas frequentes",
      items: [
        { q: "O jogo é gratuito?", a: "Sim. Durante o pré-alpha, Pixel Islands é totalmente gratuito. Basta criar uma conta com seu e-mail e senha para salvar seu progresso na nuvem." },
        { q: "O que é 'vibecoding com IA'?", a: "É desenvolvimento colaborativo com uma IA generativa: você descreve a mecânica, a arte ou o bug, e a IA implementa em segundos. Pixel Islands é construído inteiro assim." },
        { q: "Precisa baixar?", a: "Não. Roda direto no navegador, tanto no PC quanto no celular. Se quiser, dá para instalar como app (PWA) e jogar offline entre sessões." },
        { q: "Meu progresso fica salvo?", a: "Fica. Cada personagem é sincronizado com a nuvem por conta. Se você trocar de dispositivo, entra na sua conta e continua exatamente de onde parou." },
        { q: "Vai ter multiplayer?", a: "Multiplayer cooperativo está no roadmap. Por enquanto o foco é polir a experiência solo e adicionar mais biomas, chefes e receitas." },
        { q: "Como reporto bugs ou dou ideias?", a: "Use o formulário de contato abaixo — a gente lê tudo, e as ideias boas costumam sair no update do mesmo dia." },
      ],
    },
    contact: {
      kicker: "· Fale com a gente ·",
      title: "Contato & suporte",
      subtitle: "Reportou um bug? Tem uma ideia? Quer parceria? Manda ver — a gente responde.",
      name: "Nome",
      email: "E-mail",
      subject: "Assunto (opcional)",
      message: "Mensagem",
      send: "✉ Enviar mensagem",
      sending: "Enviando…",
      ok: "Mensagem enviada! Vamos responder no seu e-mail em breve.",
      err: "Não foi possível enviar agora. Tente de novo em instantes.",
      or: "ou escreva direto para",
      directEmail: "contact@pixelislands.site",
    },
    footer: "Pixel Islands · construído com vibecoding · pixelislands.site",
  },
  en: {
    nav: { features: "Style", screens: "Screens", faq: "FAQ", contact: "Contact", play: "Play" },
    hero: {
      badge: "◆ Pre-alpha · 2026",
      title1: "Survive.",
      title2: "Build your archipelago.",
      subtitle:
        "A handcrafted pixel survival sandbox, tile by tile. Dig caves, smelt bars, plant palms, fight giant spiders, and rebuild civilization — alone or with whoever washes ashore.",
      ctaPlay: "▶ Play now",
      ctaScroll: "Explore the world",
      stat1: "3+", stat1l: "Biomes to explore",
      stat2: "40+", stat2l: "Items & recipes",
      stat3: "∞", stat3l: "Islands generated",
    },
    vibe: {
      kicker: "· Built with Vibecoding AI ·",
      title: "One of the first games born from vibecoding.",
      body:
        "Pixel Islands is an honest experiment: every tile, every sound, every line of mechanics was orchestrated with a generative AI in real time. Not an asset flip — real design, iterated at the speed of thought.",
    },
    style: {
      title: "Game style",
      subtitle: "2D survival sandbox with an old-school soul.",
      cards: [
        { icon: "⛏", title: "Mine & Smelt", body: "From raw ore to iron axe: dig, smelt, refine. Every bar in your hand reminds you — you're the blacksmith now." },
        { icon: "🌴", title: "Forage & Grow", body: "Chop adult trees, plant palm saplings, harvest fruit. Time passes and the island answers what you seed." },
        { icon: "🕷", title: "Biome combat", body: "Centipedes on the beach, giant spiders on the cave ceiling. Every creature demands a new tactic." },
        { icon: "🏗", title: "Free-form building", body: "Color-coded blueprints show exactly what's missing. Your base grows piece by piece." },
        { icon: "🎒", title: "Skills", body: "Forge, Combat, Precision. Every swing earns XP. Level up what you actually play." },
        { icon: "🌗", title: "Day/Night cycle", body: "Sun rises, fireflies glow, spiders descend. Night changes everything." },
      ],
    },
    screens: {
      title: "A hand-painted world",
      subtitle: "Every biome has its palette. Every screen is a pixel postcard.",
      caps: ["Beach at dawn", "Deep caves", "Skill hall", "Furnace & forge", "Rustic settings", "Islands at dusk"],
      captions: [
        "Where the tide brings driftwood, coconuts and the first centipedes.",
        "Iron, saltpeter and giant spiders waiting deep below.",
        "Three skill trees that level with the way you actually play.",
        "Bars melted frame by frame — one furnace per building.",
        "Settings and audio dressed like a medieval camp.",
        "Full day/night cycle with stars, moonlight and fireflies.",
      ],
    },
    faq: {
      title: "Frequently asked",
      items: [
        { q: "Is the game free?", a: "Yes. During pre-alpha, Pixel Islands is completely free. Just create an account with email and password to keep your progress in the cloud." },
        { q: "What does 'vibecoding with AI' mean?", a: "Collaborative development with a generative AI: you describe the mechanic, the art or the bug and it ships in seconds. Pixel Islands is built entirely that way." },
        { q: "Do I have to download it?", a: "No. It runs in your browser on desktop and mobile. You can also install it as a PWA and play offline between sessions." },
        { q: "Is my progress saved?", a: "Yes. Every character is synced to the cloud on your account. Switch devices, log in, and pick up exactly where you left off." },
        { q: "Will there be multiplayer?", a: "Co-op multiplayer is on the roadmap. Right now the focus is polishing solo and adding more biomes, bosses and recipes." },
        { q: "How do I report bugs?", a: "Use the contact form below — we read everything, and good ideas usually ship the same day." },
      ],
    },
    contact: {
      kicker: "· Talk to us ·",
      title: "Contact & support",
      subtitle: "Bug report? Idea? Partnership? Send it in — we actually reply.",
      name: "Name",
      email: "Email",
      subject: "Subject (optional)",
      message: "Message",
      send: "✉ Send message",
      sending: "Sending…",
      ok: "Message sent! We'll get back to your inbox soon.",
      err: "Couldn't send right now. Please try again in a moment.",
      or: "or write directly to",
      directEmail: "contact@pixelislands.site",
    },
    footer: "Pixel Islands · built with vibecoding · pixelislands.site",
  },
  es: {
    nav: { features: "Estilo", screens: "Imágenes", faq: "FAQ", contact: "Contacto", play: "Jugar" },
    hero: {
      badge: "◆ Pre-alpha · 2026",
      title1: "Sobrevive.",
      title2: "Construye tu archipiélago.",
      subtitle:
        "Un sandbox de supervivencia pixelado hecho a mano, píxel a píxel. Excava cuevas, funde barras, planta palmeras, enfrenta arañas gigantes y reconstruye la civilización.",
      ctaPlay: "▶ Jugar ahora",
      ctaScroll: "Explorar el mundo",
      stat1: "3+", stat1l: "Biomas por explorar",
      stat2: "40+", stat2l: "Objetos & recetas",
      stat3: "∞", stat3l: "Islas generadas",
    },
    vibe: {
      kicker: "· Hecho con Vibecoding IA ·",
      title: "Uno de los primeros juegos nacidos del vibecoding.",
      body:
        "Pixel Islands es un experimento honesto: cada tile, cada sonido y cada mecánica fue orquestada junto a una IA generativa en tiempo real. Diseño real a la velocidad del pensamiento.",
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
      caps: ["Playa al amanecer", "Cuevas profundas", "Sala de habilidades", "Horno & fragua", "Configuración rústica", "Islas al atardecer"],
      captions: [
        "Donde la marea trae madera, cocos y las primeras escolopendras.",
        "Hierro, salitre y arañas gigantes esperan en lo profundo.",
        "Tres árboles de habilidades que evolucionan como juegas.",
        "Barras fundidas cuadro a cuadro — un horno por edificio.",
        "Ajustes y audio con estética de campamento medieval.",
        "Ciclo día/noche completo con estrellas y luciérnagas.",
      ],
    },
    faq: {
      title: "Preguntas frecuentes",
      items: [
        { q: "¿El juego es gratis?", a: "Sí. Durante el pre-alpha es totalmente gratuito." },
        { q: "¿Qué es 'vibecoding con IA'?", a: "Desarrollo colaborativo con IA generativa: describes y la IA lo implementa en segundos." },
        { q: "¿Hay que descargarlo?", a: "No. Corre en el navegador, en PC y móvil. También como PWA." },
        { q: "¿Se guarda mi progreso?", a: "Sí, sincronizado en la nube por cuenta." },
        { q: "¿Habrá multijugador?", a: "Cooperativo está en el roadmap." },
        { q: "¿Cómo reporto bugs?", a: "Usa el formulario de contacto abajo — leemos todo." },
      ],
    },
    contact: {
      kicker: "· Habla con nosotros ·",
      title: "Contacto & soporte",
      subtitle: "¿Bug? ¿Idea? ¿Colaboración? Escríbenos — respondemos de verdad.",
      name: "Nombre",
      email: "Email",
      subject: "Asunto (opcional)",
      message: "Mensaje",
      send: "✉ Enviar mensaje",
      sending: "Enviando…",
      ok: "¡Mensaje enviado! Te respondemos por email pronto.",
      err: "No pudimos enviar ahora. Intenta de nuevo en un momento.",
      or: "o escribe directamente a",
      directEmail: "contact@pixelislands.site",
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

  const track = useServerFn(logPageView);
  useEffect(() => {
    void track({
      data: {
        path: "/",
        referrer: typeof document !== "undefined" ? document.referrer : "",
        userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
      },
    }).catch(() => {});
  }, [track]);

  const shots = [
    { url: menuBg as unknown as string, cap: c.screens.caps[0], desc: c.screens.captions[0] },
    { url: caveEntrance.url, cap: c.screens.caps[1], desc: c.screens.captions[1] },
    { url: skillsBg.url, cap: c.screens.caps[2], desc: c.screens.captions[2] },
    { url: stoneBg.url, cap: c.screens.caps[3], desc: c.screens.captions[3] },
    { url: settingsBg.url, cap: c.screens.caps[4], desc: c.screens.captions[4] },
    { url: beachBg.url, cap: c.screens.caps[5], desc: c.screens.captions[5] },
  ];

  return (
    <div className="min-h-screen bg-[#0a141f] text-[#f4e9c1] font-pixel selection:bg-[#ffd166] selection:text-[#0a141f]">
      {/* NAV */}
      <header className="sticky top-0 z-40 border-b-4 border-[#ffd166]/30 bg-[#0a141f]/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <a href="#top" className="flex items-center gap-3">
            <img src={pixelIslandsLogo} alt="Pixel Islands" className="h-8 w-auto" style={{ imageRendering: "pixelated" }} />
            <span className="hidden text-[10px] tracking-[0.3em] text-[#ffd166] sm:inline">PIXEL ISLANDS</span>
          </a>
          <nav className="flex items-center gap-1 text-[10px] tracking-widest sm:gap-4 sm:text-xs">
            <a href="#style" className="hidden text-[#f4e9c1]/90 hover:text-[#ffd166] sm:inline">{c.nav.features}</a>
            <a href="#screens" className="hidden text-[#f4e9c1]/90 hover:text-[#ffd166] sm:inline">{c.nav.screens}</a>
            <a href="#faq" className="hidden text-[#f4e9c1]/90 hover:text-[#ffd166] sm:inline">{c.nav.faq}</a>
            <a href="#contact" className="hidden text-[#f4e9c1]/90 hover:text-[#ffd166] sm:inline">{c.nav.contact}</a>

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
                      onClick={() => { setLang(l.code as Lang); setLangOpen(false); }}
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
          className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-40"
          style={{ imageRendering: "pixelated" }}
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#0a141f]/85 via-[#0a141f]/75 to-[#0a141f]" />
        <div className="relative mx-auto flex max-w-6xl flex-col items-center gap-8 px-4 py-20 text-center sm:py-28">
          <span className="border-2 border-[#ffd166]/70 bg-[#0a141f]/80 px-3 py-1 text-[10px] tracking-[0.35em] text-[#ffd166]">
            {c.hero.badge}
          </span>
          <img
            src={pixelIslandsLogo}
            alt="Pixel Islands"
            className="w-full max-w-[520px]"
            style={{
              imageRendering: "pixelated",
              filter: "drop-shadow(0 0 24px rgba(255,209,102,0.45)) drop-shadow(6px 6px 0 rgba(0,0,0,0.7))",
            }}
          />
          <h1 className="max-w-3xl text-2xl leading-tight sm:text-4xl md:text-5xl" style={{ textShadow: "3px 3px 0 #000, 0 0 20px rgba(0,0,0,0.9)" }}>
            <span className="text-[#ffd166]">{c.hero.title1}</span>{" "}
            <span className="text-[#f4e9c1]">{c.hero.title2}</span>
          </h1>
          <p className="max-w-2xl rounded-sm bg-[#0a141f]/70 px-4 py-3 text-xs leading-relaxed text-[#f4e9c1] sm:text-sm">
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
            {[[c.hero.stat1, c.hero.stat1l], [c.hero.stat2, c.hero.stat2l], [c.hero.stat3, c.hero.stat3l]].map(([n, l]) => (
              <div key={l} className="border-2 border-[#ffd166]/50 bg-[#0a141f]/85 p-3 sm:p-4">
                <div className="text-2xl text-[#ffd166] sm:text-3xl">{n}</div>
                <div className="mt-1 text-[9px] tracking-widest text-[#f4e9c1]/90 sm:text-[10px]">{l}</div>
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
          <p className="mx-auto mt-6 max-w-2xl text-xs leading-relaxed text-[#f4e9c1] sm:text-sm">{c.vibe.body}</p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-2 text-[9px] tracking-widest text-[#ffd166] sm:text-[10px]">
            <span className="border border-[#ffd166]/50 bg-[#0a141f]/60 px-2 py-1">AI-DESIGNED SPRITES</span>
            <span className="border border-[#ffd166]/50 bg-[#0a141f]/60 px-2 py-1">LIVE ITERATION</span>
            <span className="border border-[#ffd166]/50 bg-[#0a141f]/60 px-2 py-1">HANDCRAFTED FEEL</span>
            <span className="border border-[#ffd166]/50 bg-[#0a141f]/60 px-2 py-1">NO ASSET FLIP</span>
          </div>
        </div>
      </section>

      {/* STYLE / FEATURES */}
      <section id="style" className="border-b-4 border-[#ffd166]/20 py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-10 text-center">
            <h2 className="text-2xl sm:text-4xl">{c.style.title}</h2>
            <p className="mt-3 text-xs text-[#f4e9c1]/85 sm:text-sm">{c.style.subtitle}</p>
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
                <p className="text-[11px] leading-relaxed text-[#f4e9c1]/90 sm:text-xs">{card.body}</p>
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
            <p className="mt-3 text-xs text-[#f4e9c1]/85 sm:text-sm">{c.screens.subtitle}</p>
          </div>

          {/* Feature shot */}
          <div
            className="mb-6 overflow-hidden border-4 border-[#ffd166]/70 bg-[#0a141f]"
            style={{ boxShadow: "0 8px 0 #0a141f, 0 12px 0 rgba(0,0,0,0.55)" }}
          >
            <div className="relative">
              <img
                src={shots[0].url}
                alt={shots[0].cap}
                className="h-[280px] w-full object-cover sm:h-[420px]"
                style={{ imageRendering: "pixelated" }}
                loading="lazy"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#0a141f] via-[#0a141f]/85 to-transparent p-5 sm:p-8">
                <div className="text-[10px] tracking-[0.4em] text-[#ffd166]">{shots[0].cap}</div>
                <div className="mt-2 max-w-xl text-xs leading-relaxed text-[#f4e9c1] sm:text-sm">{shots[0].desc}</div>
              </div>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {shots.slice(1).map((s, i) => (
              <figure
                key={i}
                className="group overflow-hidden border-4 border-[#f4e9c1]/25 bg-[#0a141f] hover:border-[#ffd166]"
                style={{ boxShadow: "0 6px 0 #0a141f" }}
              >
                <div className="relative">
                  <img
                    src={s.url}
                    alt={s.cap}
                    className="h-52 w-full object-cover transition-transform duration-500 group-hover:scale-105 sm:h-60"
                    style={{ imageRendering: "pixelated" }}
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0a141f] via-[#0a141f]/30 to-transparent" />
                </div>
                <figcaption className="border-t-2 border-[#ffd166]/30 bg-[#0a141f] px-4 py-3">
                  <div className="text-[10px] tracking-[0.35em] text-[#ffd166]">{s.cap}</div>
                  <div className="mt-1 text-[11px] leading-relaxed text-[#f4e9c1]/90">{s.desc}</div>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="border-b-4 border-[#ffd166]/20 py-16 sm:py-24">
        <div className="mx-auto max-w-3xl px-4">
          <h2 className="mb-8 text-center text-2xl sm:text-4xl">{c.faq.title}</h2>
          <div className="flex flex-col gap-3">
            {c.faq.items.map((item, i) => {
              const open = openFaq === i;
              return (
                <div key={i} className="border-4 border-[#f4e9c1]/25 bg-[#1b2a3a]" style={{ boxShadow: "0 4px 0 #0a141f" }}>
                  <button
                    onClick={() => setOpenFaq(open ? null : i)}
                    className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left text-xs uppercase tracking-widest text-[#f4e9c1] hover:text-[#ffd166] sm:text-sm"
                  >
                    <span>{item.q}</span>
                    <span className="text-[#ffd166]">{open ? "−" : "+"}</span>
                  </button>
                  {open && (
                    <div className="border-t-2 border-[#f4e9c1]/15 px-4 py-3 text-[12px] leading-relaxed text-[#f4e9c1] sm:text-sm">
                      {item.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <ContactSection copy={c.contact} lang={key} />

      <div className="py-14 text-center">
        <Link
          to="/game"
          className="inline-block border-4 border-[#7a3e1d] bg-[#ffd166] px-10 py-4 text-sm uppercase tracking-widest text-[#0a141f]"
          style={{ boxShadow: "0 6px 0 #7a3e1d, 0 10px 0 rgba(0,0,0,0.55)" }}
        >
          {c.hero.ctaPlay}
        </Link>
      </div>

      <footer className="border-t-4 border-[#ffd166]/20 bg-[#0a141f] px-4 py-6 text-center text-[10px] tracking-widest text-[#f4e9c1]/60">
        {c.footer}
      </footer>
    </div>
  );
}

function ContactSection({ copy, lang }: { copy: Copy["contact"]; lang: string }) {
  const send = useServerFn(submitContact);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "ok" | "err">("idle");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (state === "sending") return;
    setState("sending");
    try {
      await send({ data: { name, email, subject, message, lang } });
      setState("ok");
      setName(""); setEmail(""); setSubject(""); setMessage("");
    } catch {
      setState("err");
    }
  }

  return (
    <section id="contact" className="border-b-4 border-[#ffd166]/20 bg-[#0d1b2a] py-16 sm:py-24">
      <div className="mx-auto max-w-3xl px-4">
        <div className="mb-8 text-center">
          <div className="mb-3 text-[10px] tracking-[0.4em] text-[#ffd166]">{copy.kicker}</div>
          <h2 className="text-2xl sm:text-4xl">{copy.title}</h2>
          <p className="mt-3 text-xs text-[#f4e9c1]/85 sm:text-sm">{copy.subtitle}</p>
        </div>

        <form
          onSubmit={onSubmit}
          className="border-4 border-[#ffd166]/40 bg-[#1b2a3a] p-6"
          style={{ boxShadow: "0 8px 0 #0a141f, 0 12px 0 rgba(0,0,0,0.5)" }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-[10px] tracking-widest text-[#ffd166]">{copy.name}</label>
              <input
                required
                maxLength={120}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border-4 border-[#f4e9c1]/40 bg-[#0d1b2a] px-3 py-2 text-sm text-[#f4e9c1] outline-none focus:border-[#ffd166]"
              />
            </div>
            <div>
              <label className="mb-1 block text-[10px] tracking-widest text-[#ffd166]">{copy.email}</label>
              <input
                required
                type="email"
                maxLength={255}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border-4 border-[#f4e9c1]/40 bg-[#0d1b2a] px-3 py-2 text-sm text-[#f4e9c1] outline-none focus:border-[#ffd166]"
              />
            </div>
          </div>
          <div className="mt-4">
            <label className="mb-1 block text-[10px] tracking-widest text-[#ffd166]">{copy.subject}</label>
            <input
              maxLength={200}
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full border-4 border-[#f4e9c1]/40 bg-[#0d1b2a] px-3 py-2 text-sm text-[#f4e9c1] outline-none focus:border-[#ffd166]"
            />
          </div>
          <div className="mt-4">
            <label className="mb-1 block text-[10px] tracking-widest text-[#ffd166]">{copy.message}</label>
            <textarea
              required
              rows={6}
              maxLength={4000}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full resize-y border-4 border-[#f4e9c1]/40 bg-[#0d1b2a] px-3 py-2 text-sm text-[#f4e9c1] outline-none focus:border-[#ffd166]"
            />
          </div>

          {state === "ok" && <div className="mt-4 border-2 border-[#7ee787]/60 bg-[#7ee787]/10 px-3 py-2 text-[11px] text-[#7ee787]">{copy.ok}</div>}
          {state === "err" && <div className="mt-4 border-2 border-[#e94560]/60 bg-[#e94560]/10 px-3 py-2 text-[11px] text-[#ff8ea3]">{copy.err}</div>}

          <div className="mt-6 flex flex-col items-center justify-between gap-3 sm:flex-row">
            <div className="text-[10px] tracking-widest text-[#f4e9c1]/70">
              {copy.or}{" "}
              <a href={`mailto:${copy.directEmail}`} className="text-[#ffd166] hover:underline">{copy.directEmail}</a>
            </div>
            <button
              type="submit"
              disabled={state === "sending"}
              className="border-4 border-[#7a3e1d] bg-[#ffd166] px-6 py-3 text-xs uppercase tracking-widest text-[#0a141f] disabled:opacity-60"
              style={{ boxShadow: "0 5px 0 #7a3e1d" }}
            >
              {state === "sending" ? copy.sending : copy.send}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
