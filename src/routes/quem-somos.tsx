import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import pixelIslandsLogo from "@/assets/pixel-islands-logo.png";
import forgeScene from "@/assets/lp-scene-forge.jpg";
import i9Logo from "@/assets/i9-logo.png.asset.json";

const ITCH_URL = "https://davioliver.itch.io/pixel-islands";
const I9_URL = "https://i9companymkt.online";

export const Route = createFileRoute("/quem-somos")({
  head: () => ({
    meta: [
      { title: "Quem somos · About — Pixel Islands" },
      {
        name: "description",
        content:
          "Conheça Davi Oliveira, desenvolvedor de 15 anos de Londrina (PR), criador de Pixel Islands. Meet Davi Oliveira, 15-year-old developer from Londrina, Brazil, creator of Pixel Islands.",
      },
      { property: "og:type", content: "website" },
      { property: "og:title", content: "Quem somos · About — Pixel Islands" },
      {
        property: "og:description",
        content:
          "Um dev de 15 anos, vibecoding, marketing digital pela i9company e um sandbox pixel-art feito à mão.",
      },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AboutPage,
});

type Copy = {
  nav: { home: string; play: string; support: string };
  hero: { kicker: string; title: string; subtitle: string };
  dev: {
    kicker: string;
    title: string;
    body: string[];
    factsTitle: string;
    facts: { k: string; v: string }[];
    itchCta: string;
  };
  agency: {
    kicker: string;
    title: string;
    body: string;
    cta: string;
  };
  game: {
    kicker: string;
    title: string;
    body: string;
    ctaPlay: string;
    ctaItch: string;
    ctaSupport: string;
  };
  footer: string;
};

const COPY: Record<"pt" | "en", Copy> = {
  pt: {
    nav: { home: "Início", play: "Jogar", support: "Apoiar" },
    hero: {
      kicker: "Quem somos",
      title: "Um garoto, uma ilha e muitos pixels",
      subtitle:
        "Pixel Islands nasceu da mão de um desenvolvedor de 15 anos que aprendeu programando sites reais e transformou vibecoding em jogo de verdade.",
    },
    dev: {
      kicker: "O desenvolvedor",
      title: "Davi Oliveira — Londrina, Paraná",
      body: [
        "Davi tem 15 anos e é o criador de Pixel Islands. Mora em Londrina, no Paraná, e há um bom tempo já atua profissionalmente em projetos de Marketing Digital pela agência i9company marketing digital.",
        "No dia a dia, ele participa da atualização e desenvolvimento de sites, jogos e experiências interativas para clientes da agência — combinando design, código moderno e vibecoding com IA.",
        "Pixel Islands é o projeto pessoal onde ele leva tudo isso ao extremo: um sandbox pixel-art autoral, feito pixel por pixel, sistema por sistema, com trilha, arte e mecânicas próprias.",
      ],
      factsTitle: "Ficha rápida",
      facts: [
        { k: "Nome", v: "Davi Oliveira" },
        { k: "Idade", v: "15 anos" },
        { k: "Cidade", v: "Londrina — PR" },
        { k: "Agência", v: "i9company marketing digital" },
        { k: "Atua com", v: "Sites, jogos, vibecoding, IA" },
        { k: "Jogo", v: "Pixel Islands (2026, pré-alpha)" },
      ],
      itchCta: "Ver o jogo no itch.io ↗",
    },
    agency: {
      kicker: "Onde ele trabalha",
      title: "i9company marketing digital",
      body:
        "Agência que dá o chão profissional ao Davi: sites, presença digital, campanhas e projetos sob medida. É lá que ele aprende, aplica e entrega para clientes reais — e é dali que sai boa parte da bagagem técnica por trás de Pixel Islands.",
      cta: "Visitar i9company ↗",
    },
    game: {
      kicker: "Sobre o jogo",
      title: "Pixel Islands",
      body:
        "Um sandbox 2D de sobrevivência feito à mão, rodando direto no navegador (PC e celular). Cave cavernas, funda barras, plante palmeiras, enfrente aranhas gigantes e reconstrua sua ilha. Save na nuvem, ciclo dia/noite, habilidades e mais.",
      ctaPlay: "▶ Jogar no navegador",
      ctaItch: "Baixar / apoiar no itch.io",
      ctaSupport: "Apoiar o projeto",
    },
    footer:
      "Pixel Islands · feito com vibecoding · Davi Oliveira · CNPJ 65.550.537/0001-70 · pixelislands.site",
  },
  en: {
    nav: { home: "Home", play: "Play", support: "Support" },
    hero: {
      kicker: "About us",
      title: "One kid, one island, a lot of pixels",
      subtitle:
        "Pixel Islands is built by a 15-year-old developer who learned by shipping real websites and turned vibecoding into an actual game.",
    },
    dev: {
      kicker: "The developer",
      title: "Davi Oliveira — Londrina, Brazil",
      body: [
        "Davi is 15 years old and the creator of Pixel Islands. He lives in Londrina (Paraná, Brazil) and already works professionally on Digital Marketing projects at the agency i9company marketing digital.",
        "Day to day he helps ship and update websites, games and interactive experiences for the agency's clients — mixing design, modern code and AI-powered vibecoding.",
        "Pixel Islands is the personal project where he pushes all of that to the limit: a hand-crafted pixel-art sandbox with its own art, sound and systems.",
      ],
      factsTitle: "Quick facts",
      facts: [
        { k: "Name", v: "Davi Oliveira" },
        { k: "Age", v: "15" },
        { k: "City", v: "Londrina — Brazil" },
        { k: "Agency", v: "i9company marketing digital" },
        { k: "Works with", v: "Websites, games, vibecoding, AI" },
        { k: "Game", v: "Pixel Islands (2026, pre-alpha)" },
      ],
      itchCta: "View the game on itch.io ↗",
    },
    agency: {
      kicker: "Where he works",
      title: "i9company marketing digital",
      body:
        "The agency where Davi grows as a pro: websites, digital presence, campaigns and tailor-made projects for real clients — and where a lot of the tech behind Pixel Islands comes from.",
      cta: "Visit i9company ↗",
    },
    game: {
      kicker: "About the game",
      title: "Pixel Islands",
      body:
        "A hand-crafted 2D survival sandbox running straight in the browser (desktop & mobile). Dig caves, smelt bars, plant palms, fight giant spiders and rebuild your island. Cloud saves, day/night cycle, skills and more.",
      ctaPlay: "▶ Play in browser",
      ctaItch: "Download / support on itch.io",
      ctaSupport: "Support the project",
    },
    footer:
      "Pixel Islands · built with vibecoding · Davi Oliveira · CNPJ 65.550.537/0001-70 · pixelislands.site",
  },
};

function AboutPage() {
  const [lang, setLang] = useState<"pt" | "en">("pt");
  const c = COPY[lang];

  return (
    <div
      className="min-h-screen bg-[#b7e4f3] text-[#2a1a0a]"
      style={{ fontFamily: "'Press Start 2P', system-ui, sans-serif", imageRendering: "pixelated" }}
    >
      {/* Nav */}
      <nav className="sticky top-0 z-40 border-b-4 border-[#7a3e1d] bg-[#fdf6dc]/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <Link to="/" className="flex items-center gap-2">
            <img
              src={pixelIslandsLogo}
              alt="Pixel Islands"
              className="h-14 w-auto sm:h-16"
              style={{ imageRendering: "pixelated", filter: "drop-shadow(3px 3px 0 rgba(0,0,0,0.4))" }}
            />
            <span className="text-[10px] tracking-widest text-[#7a3e1d]">PIXEL ISLANDS</span>
          </Link>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setLang(lang === "pt" ? "en" : "pt")}
              className="border-2 border-[#7a3e1d] bg-[#ffd166] px-2 py-1 text-[9px] uppercase tracking-widest text-[#0a141f]"
              aria-label="Toggle language"
            >
              {lang === "pt" ? "EN" : "PT"}
            </button>
            <Link
              to="/"
              className="border-2 border-[#7a3e1d] bg-[#fdf6dc] px-3 py-1 text-[9px] uppercase tracking-widest text-[#7a3e1d]"
            >
              {c.nav.home}
            </Link>
            <Link
              to="/apoio"
              className="border-2 border-[#7a3e1d] bg-[#ffd166] px-3 py-1 text-[9px] uppercase tracking-widest text-[#0a141f]"
            >
              {c.nav.support}
            </Link>
            <Link
              to="/game"
              className="border-2 border-[#7a3e1d] bg-[#7ee787] px-3 py-1 text-[9px] uppercase tracking-widest text-[#0a141f]"
            >
              {c.nav.play}
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <header
        className="relative overflow-hidden border-b-4 border-[#7a3e1d]"
        style={{
          backgroundImage: `linear-gradient(rgba(253,246,220,0.85), rgba(183,228,243,0.9)), url(${forgeScene})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          imageRendering: "pixelated",
        }}
      >
        <div className="mx-auto max-w-4xl px-4 py-16 text-center sm:py-24">
          <div className="mb-3 text-[10px] tracking-[0.4em] text-[#7a3e1d]">{c.hero.kicker}</div>
          <h1 className="text-2xl leading-tight sm:text-4xl">{c.hero.title}</h1>
          <p className="mx-auto mt-5 max-w-2xl text-[11px] leading-loose text-[#3a2410] sm:text-sm">
            {c.hero.subtitle}
          </p>
        </div>
      </header>

      {/* Developer */}
      <section className="border-b-4 border-[#7a3e1d]/40 bg-[#fdf6dc] py-14">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 md:grid-cols-[2fr,1fr]">
          <div>
            <div className="mb-3 text-[10px] tracking-[0.4em] text-[#7a3e1d]">{c.dev.kicker}</div>
            <h2 className="mb-6 text-xl sm:text-2xl">{c.dev.title}</h2>
            <div className="space-y-4">
              {c.dev.body.map((p, i) => (
                <p key={i} className="text-[11px] leading-loose text-[#3a2410]">
                  {p}
                </p>
              ))}
            </div>
            <a
              href={ITCH_URL}
              target="_blank"
              rel="noreferrer"
              className="mt-6 inline-block border-4 border-[#7a3e1d] bg-[#ffd166] px-4 py-3 text-[10px] uppercase tracking-widest text-[#0a141f]"
              style={{ boxShadow: "0 5px 0 #7a3e1d" }}
            >
              {c.dev.itchCta}
            </a>
          </div>

          <aside
            className="h-fit border-4 border-[#7a3e1d] bg-[#b7e4f3] p-5"
            style={{ boxShadow: "0 6px 0 #7a3e1d" }}
          >
            <div className="mb-4 text-[10px] tracking-widest text-[#7a3e1d]">{c.dev.factsTitle}</div>
            <ul className="space-y-3">
              {c.dev.facts.map((f) => (
                <li key={f.k} className="text-[10px] leading-relaxed">
                  <div className="text-[#7a3e1d]">{f.k}</div>
                  <div className="text-[#2a1a0a]">{f.v}</div>
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </section>

      {/* Agency */}
      <section className="border-b-4 border-[#7a3e1d]/40 bg-[#b7e4f3] py-14">
        <div className="mx-auto grid max-w-5xl items-center gap-8 px-4 md:grid-cols-[auto,1fr]">
          <a
            href={I9_URL}
            target="_blank"
            rel="noreferrer"
            className="mx-auto block border-4 border-[#7a3e1d] bg-[#fdf6dc] p-5"
            style={{ boxShadow: "0 6px 0 #7a3e1d" }}
          >
            <img
              src={i9Logo.url}
              alt="i9company marketing digital"
              className="h-24 w-auto sm:h-32"
              style={{ imageRendering: "auto" }}
            />
          </a>
          <div>
            <div className="mb-3 text-[10px] tracking-[0.4em] text-[#7a3e1d]">{c.agency.kicker}</div>
            <h2 className="mb-4 text-xl sm:text-2xl">{c.agency.title}</h2>
            <p className="mb-6 text-[11px] leading-loose text-[#3a2410]">{c.agency.body}</p>
            <a
              href={I9_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-block border-4 border-[#7a3e1d] bg-[#ffd166] px-4 py-3 text-[10px] uppercase tracking-widest text-[#0a141f]"
              style={{ boxShadow: "0 5px 0 #7a3e1d" }}
            >
              {c.agency.cta}
            </a>
          </div>
        </div>
      </section>

      {/* Game / CTAs */}
      <section className="border-b-4 border-[#7a3e1d]/40 bg-[#fdf6dc] py-14">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <div className="mb-3 text-[10px] tracking-[0.4em] text-[#7a3e1d]">{c.game.kicker}</div>
          <h2 className="mb-4 text-xl sm:text-2xl">{c.game.title}</h2>
          <p className="mx-auto mb-8 max-w-2xl text-[11px] leading-loose text-[#3a2410]">{c.game.body}</p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/game"
              className="border-4 border-[#7a3e1d] bg-[#7ee787] px-4 py-3 text-[10px] uppercase tracking-widest text-[#0a141f]"
              style={{ boxShadow: "0 5px 0 #7a3e1d" }}
            >
              {c.game.ctaPlay}
            </Link>
            <a
              href={ITCH_URL}
              target="_blank"
              rel="noreferrer"
              className="border-4 border-[#7a3e1d] bg-[#fdf6dc] px-4 py-3 text-[10px] uppercase tracking-widest text-[#7a3e1d]"
              style={{ boxShadow: "0 5px 0 #7a3e1d" }}
            >
              {c.game.ctaItch}
            </a>
            <Link
              to="/apoio"
              className="border-4 border-[#7a3e1d] bg-[#ffd166] px-4 py-3 text-[10px] uppercase tracking-widest text-[#0a141f]"
              style={{ boxShadow: "0 5px 0 #7a3e1d" }}
            >
              {c.game.ctaSupport}
            </Link>
          </div>
        </div>
      </section>

      <footer className="bg-[#fdf6dc] px-4 py-6 text-center text-[10px] tracking-widest text-[#3a2410]/60">
        {c.footer}
      </footer>
    </div>
  );
}
