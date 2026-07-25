import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { BuyButton } from "@/components/BuyButton";
import { createDonationSession } from "@/lib/donations.functions";
import pixelIslandsLogo from "@/assets/pixel-islands-logo.png";
import forgeScene from "@/assets/lp-scene-forge.jpg";

export const Route = createFileRoute("/apoio")({
  head: () => ({
    meta: [
      { title: "Apoie o Pixel Islands · Support Pixel Islands" },
      {
        name: "description",
        content:
          "Apoie o desenvolvimento de Pixel Islands — um sandbox pixel-art independente feito com vibecoding. Support the development of Pixel Islands.",
      },
      { property: "og:type", content: "website" },
      { property: "og:title", content: "Apoie o Pixel Islands · Support Pixel Islands" },
      {
        property: "og:description",
        content:
          "Contribua com o projeto e ajude a manter servidores, arte e novas mecânicas. Help keep the servers running and new content coming.",
      },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SupportPage,
});

type Copy = {
  nav: { home: string; play: string };
  hero: { kicker: string; title: string; subtitle: string };
  why: { title: string; items: { title: string; body: string }[] };
  donate: {
    kicker: string;
    title: string;
    subtitle: string;
    pickAmount: string;
    custom: string;
    customPlaceholder: string;
    method: string;
    methodCard: string;
    methodPix: string;
    methodBoth: string;
    nameLabel: string;
    namePlaceholder: string;
    msgLabel: string;
    msgPlaceholder: string;
    cta: string;
    sending: string;
    err: string;
    min: string;
    legal: string;
  };
  tiers: {
    title: string;
    subtitle: string;
    supporter: { title: string; body: string; perks: string[]; cta: string };
    cosmetic: { title: string; body: string; perks: string[]; cta: string };
    premium: { title: string; body: string; perks: string[]; cta: string };
    soon: string;
  };
  other: {
    title: string;
    subtitle: string;
    share: { title: string; body: string };
    feedback: { title: string; body: string; cta: string };
    play: { title: string; body: string; cta: string };
  };
  footer: string;
};

const COPY: Record<"pt" | "en", Copy> = {
  pt: {
    nav: { home: "Início", play: "Jogar" },
    hero: {
      kicker: "Apoie o projeto",
      title: "Ajude Pixel Islands a crescer",
      subtitle:
        "Pixel Islands é um jogo indie feito com vibecoding. Cada apoio paga servidores, arte pixel e novas mecânicas — obrigado por fazer parte.",
    },
    why: {
      title: "Para onde vai o seu apoio",
      items: [
        { title: "Servidores", body: "Banco de dados, sincronização de personagens e hospedagem do site." },
        { title: "Arte e Áudio", body: "Novos sprites, cenários, trilha sonora e efeitos sonoros." },
        { title: "Novas mecânicas", body: "Mais biomas, criaturas, ferramentas e conteúdo cooperativo." },
      ],
    },
    tiers: {
      title: "Formas de apoiar",
      subtitle: "Os pagamentos serão liberados em breve. Enquanto isso, você já pode escolher seu pacote favorito.",
      supporter: {
        title: "Pacote Apoiador",
        body: "A forma mais simples de dizer obrigado. Uma contribuição única.",
        perks: ["Nome nos créditos do jogo", "Selo de Apoiador no perfil"],
        cta: "Apoiar",
      },
      cosmetic: {
        title: "Pacote Cosmético",
        body: "Ajuda o projeto e ganha itens visuais exclusivos.",
        perks: ["Roupas exclusivas", "Selo de Apoiador", "Nome nos créditos"],
        cta: "Comprar",
      },
      premium: {
        title: "Premium Mensal",
        body: "Apoio contínuo — mantém o mundo vivo mês a mês.",
        perks: ["Todos os cosméticos", "Acesso antecipado a novidades", "Selo Premium animado"],
        cta: "Assinar",
      },
      soon: "Em breve",
    },
    other: {
      title: "Outras formas de ajudar",
      subtitle: "Nem tudo precisa de dinheiro. Essas coisas também fazem uma diferença enorme.",
      share: {
        title: "Compartilhe o jogo",
        body: "Manda pros amigos, posta um clipe, faz uma live. Cada novo jogador ajuda demais.",
      },
      feedback: {
        title: "Envie feedback",
        body: "Bugs, ideias, críticas — tudo é bem-vindo pelo formulário de contato.",
        cta: "Enviar mensagem",
      },
      play: {
        title: "Jogue e volte sempre",
        body: "Um mundo vivo precisa de gente vivendo nele. Bora?",
        cta: "Entrar no jogo",
      },
    },
    footer: "Pixel Islands · Feito com vibecoding · Obrigado por apoiar",
  },
  en: {
    nav: { home: "Home", play: "Play" },
    hero: {
      kicker: "Support the project",
      title: "Help Pixel Islands grow",
      subtitle:
        "Pixel Islands is an indie game built with vibecoding. Every bit of support pays for servers, pixel art and new mechanics — thanks for being part of it.",
    },
    why: {
      title: "Where your support goes",
      items: [
        { title: "Servers", body: "Database, character sync and site hosting." },
        { title: "Art & Audio", body: "New sprites, scenery, soundtrack and effects." },
        { title: "New mechanics", body: "More biomes, creatures, tools and co-op content." },
      ],
    },
    tiers: {
      title: "Ways to support",
      subtitle: "Payments will open soon. In the meantime, you can already pick your favorite pack.",
      supporter: {
        title: "Supporter Pack",
        body: "The simplest way to say thanks. A one-time contribution.",
        perks: ["Your name in the credits", "Supporter badge on your profile"],
        cta: "Support",
      },
      cosmetic: {
        title: "Cosmetic Pack",
        body: "Support the project and unlock exclusive cosmetics.",
        perks: ["Exclusive outfits", "Supporter badge", "Name in credits"],
        cta: "Buy",
      },
      premium: {
        title: "Monthly Premium",
        body: "Ongoing support — keeps the world alive month after month.",
        perks: ["All cosmetics", "Early access to new content", "Animated Premium badge"],
        cta: "Subscribe",
      },
      soon: "Coming soon",
    },
    other: {
      title: "Other ways to help",
      subtitle: "Not everything requires money. These help just as much.",
      share: {
        title: "Share the game",
        body: "Send it to friends, post a clip, stream it. Every new player matters.",
      },
      feedback: {
        title: "Send feedback",
        body: "Bugs, ideas, critique — all welcome through the contact form.",
        cta: "Send a message",
      },
      play: {
        title: "Play and come back",
        body: "A living world needs people living in it. Let's go?",
        cta: "Enter the game",
      },
    },
    footer: "Pixel Islands · Built with vibecoding · Thanks for supporting",
  },
};

function SupportPage() {
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
            <img src={pixelIslandsLogo} alt="Pixel Islands" className="h-8 w-8" />
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

      {/* Why */}
      <section className="border-b-4 border-[#7a3e1d]/40 bg-[#fdf6dc] py-14">
        <div className="mx-auto max-w-5xl px-4">
          <h2 className="mb-8 text-center text-xl sm:text-2xl">{c.why.title}</h2>
          <div className="grid gap-5 sm:grid-cols-3">
            {c.why.items.map((it) => (
              <div
                key={it.title}
                className="border-4 border-[#7a3e1d]/50 bg-[#b7e4f3] p-5"
                style={{ boxShadow: "0 6px 0 #7a3e1d" }}
              >
                <div className="mb-2 text-[11px] tracking-widest text-[#7a3e1d]">{it.title}</div>
                <div className="text-[11px] leading-relaxed text-[#3a2410]">{it.body}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tiers */}
      <section className="border-b-4 border-[#7a3e1d]/40 bg-[#b7e4f3] py-14">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-8 text-center">
            <h2 className="text-xl sm:text-2xl">{c.tiers.title}</h2>
            <p className="mx-auto mt-3 max-w-2xl text-[10px] leading-loose text-[#3a2410]/80 sm:text-xs">
              {c.tiers.subtitle}
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            <TierCard
              title={c.tiers.supporter.title}
              body={c.tiers.supporter.body}
              perks={c.tiers.supporter.perks}
              sku="supporter_pack"
              cta={c.tiers.supporter.cta}
              accent="#ffd166"
            />
            <TierCard
              title={c.tiers.cosmetic.title}
              body={c.tiers.cosmetic.body}
              perks={c.tiers.cosmetic.perks}
              sku="cosmetic_bundle"
              cta={c.tiers.cosmetic.cta}
              accent="#7ee787"
              highlight
            />
            <TierCard
              title={c.tiers.premium.title}
              body={c.tiers.premium.body}
              perks={c.tiers.premium.perks}
              sku="premium_monthly"
              cta={c.tiers.premium.cta}
              accent="#e94560"
            />
          </div>
        </div>
      </section>

      {/* Other ways */}
      <section className="border-b-4 border-[#7a3e1d]/40 bg-[#fdf6dc] py-14">
        <div className="mx-auto max-w-5xl px-4">
          <div className="mb-8 text-center">
            <h2 className="text-xl sm:text-2xl">{c.other.title}</h2>
            <p className="mx-auto mt-3 max-w-xl text-[10px] leading-loose text-[#3a2410]/80 sm:text-xs">
              {c.other.subtitle}
            </p>
          </div>
          <div className="grid gap-5 sm:grid-cols-3">
            <div
              className="border-4 border-[#7a3e1d]/50 bg-[#b7e4f3] p-5"
              style={{ boxShadow: "0 6px 0 #7a3e1d" }}
            >
              <div className="mb-2 text-[11px] tracking-widest text-[#7a3e1d]">{c.other.share.title}</div>
              <div className="text-[11px] leading-relaxed text-[#3a2410]">{c.other.share.body}</div>
            </div>
            <div
              className="border-4 border-[#7a3e1d]/50 bg-[#b7e4f3] p-5"
              style={{ boxShadow: "0 6px 0 #7a3e1d" }}
            >
              <div className="mb-2 text-[11px] tracking-widest text-[#7a3e1d]">{c.other.feedback.title}</div>
              <div className="mb-4 text-[11px] leading-relaxed text-[#3a2410]">{c.other.feedback.body}</div>
              <Link
                to="/"
                hash="contact"
                className="inline-block border-2 border-[#7a3e1d] bg-[#ffd166] px-3 py-2 text-[9px] uppercase tracking-widest text-[#0a141f]"
              >
                {c.other.feedback.cta}
              </Link>
            </div>
            <div
              className="border-4 border-[#7a3e1d]/50 bg-[#b7e4f3] p-5"
              style={{ boxShadow: "0 6px 0 #7a3e1d" }}
            >
              <div className="mb-2 text-[11px] tracking-widest text-[#7a3e1d]">{c.other.play.title}</div>
              <div className="mb-4 text-[11px] leading-relaxed text-[#3a2410]">{c.other.play.body}</div>
              <Link
                to="/game"
                className="inline-block border-2 border-[#7a3e1d] bg-[#7ee787] px-3 py-2 text-[9px] uppercase tracking-widest text-[#0a141f]"
              >
                {c.other.play.cta}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-[#fdf6dc] px-4 py-6 text-center text-[10px] tracking-widest text-[#3a2410]/60">
        {c.footer}
      </footer>
    </div>
  );
}

function TierCard({
  title,
  body,
  perks,
  sku,
  cta,
  accent,
  highlight,
}: {
  title: string;
  body: string;
  perks: string[];
  sku: "supporter_pack" | "cosmetic_bundle" | "premium_monthly";
  cta: string;
  accent: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`relative flex flex-col border-4 border-[#7a3e1d] bg-[#fdf6dc] p-5 ${
        highlight ? "sm:-translate-y-2" : ""
      }`}
      style={{ boxShadow: `0 8px 0 #7a3e1d` }}
    >
      <div
        className="mb-4 inline-block self-start border-2 border-[#7a3e1d] px-2 py-1 text-[9px] tracking-widest text-[#0a141f]"
        style={{ background: accent }}
      >
        {title}
      </div>
      <p className="mb-4 text-[11px] leading-relaxed text-[#3a2410]">{body}</p>
      <ul className="mb-6 space-y-2">
        {perks.map((p) => (
          <li key={p} className="flex items-start gap-2 text-[10px] leading-relaxed text-[#3a2410]">
            <span className="mt-[2px] text-[#7a3e1d]">▸</span>
            <span>{p}</span>
          </li>
        ))}
      </ul>
      <div className="mt-auto">
        <BuyButton
          sku={sku}
          className="w-full border-4 border-[#7a3e1d] bg-[#ffd166] px-4 py-3 text-[10px] uppercase tracking-widest text-[#0a141f] disabled:opacity-70"
        >
          {cta}
        </BuyButton>
      </div>
    </div>
  );
}
