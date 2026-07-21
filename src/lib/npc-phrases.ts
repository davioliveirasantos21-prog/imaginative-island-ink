// Shared list of NPC phrases managed via the admin panel. The AI picks one
// of these lines when a player talks to an NPC — the list is global (all
// NPCs share the same pool) and persisted in localStorage.

const STORAGE_KEY = "pixel-realms.admin.npc-phrases";

export const DEFAULT_NPC_PHRASES: string[] = [
  "Você respirou fundo ou foi só impressão? Que desperdício de oxigênio.",
  "Ah, um novo ser humano para eu ignorar solenemente. Seja bem-vindo.",
  "Quer conversar? Sorte sua que eu não tenho para onde fugir nesta ilha.",
  "Sua expressão facial me diz que você está confuso. Isso é o seu estado natural ou novidade?",
  "Pode fazer perguntas à vontade. Nenhuma delas vai mudar o fato de que estamos presos aqui.",
  "Interessante. Você tem a exata quantidade de relevância de um grão de areia molhada.",
  "Veio buscar respostas ou só quer gastar o meu tempo precioso?",
  "Dizem que a esperança é a última que morre. No seu caso, ela deve estar sofrendo muito.",
  "Pode falar. Eu finjo que me importo e você finge que acreditou.",
  "Cada minuto conversando com você é um minuto a menos que eu poderia passar em silêncio.",
  "Parabéns por chegar até aqui. Quer um troféu de 'sobrevivente medíocre' ou prefere em dinheiro?",
  "O horizonte é lindo, não é? Pena que você insiste em atrapalhar a vista.",
  "Se eu quisesse ouvir reclamações, teria falado com as pedras da praia. Elas são mais úteis.",
  "Sua jornada épica começa com um fracasso previsível. Boa sorte com isso.",
  "Eu daria um conselho útil, mas duvido muito que você saiba o que fazer com algo inteligente.",
  "A natureza é fascinante. Cria criaturas complexas e, de vez em quando, cria você.",
  "Pode continuar insistindo. A minha paciência é infinita, mas a sua utilidade já acabou.",
  "Você tem o dom impressionante de tornar qualquer lugar desinteressante.",
  "Olha só, mais um herói de araque. O estoque na ilha tá em promoção?",
  "Se as suas respostas forem tão boas quanto a sua cara de perdido, estamos perdidos.",
  "Eu ia te ajudar, mas lembrei que a sua dor é altamente cômica para mim.",
  "Quer um mapa? Porque rumo na vida claramente você não tem.",
  "Dizem que o silêncio é de ouro. Depois de te ouvir, o silêncio virou diamante.",
  "Você mexe os lábios, mas só sai vento e decepção.",
  "Sabe qual é a diferença entre você e um naufrágio? O naufrágio pelo menos atrai curiosos.",
  "Continue perguntando. Adoro ver a ilusão de que você está no controle.",
  "Se o objetivo era me dar tédio instantâneo, você conseguiu na primeira frase.",
  "Fascinante como você consegue errar o passo mesmo andando reto.",
  "A ilha tem muitos mistérios, mas o maior deles é como você sobreviveu até a fase adulta.",
  "Pode chorar o quanto quiser. Os peixes adoram sal.",
  "Sua presença brilha tanto quanto uma lâmpada queimada.",
  "Você faz perguntas como se a resposta fosse mudar o seu destino patético.",
  "Eu revelaria os segredos do universo, mas você provavelmente não entenderia nem a tabuada.",
  "Que bom que você apareceu. Estava faltando alguém para eu ignorar hoje.",
  "Isso foi uma pergunta ou um pedido de socorro disfarçado de burrice?",
  "Tente não tocar em nada importante. Na verdade, tente não tocar em nada.",
  "A cada palavra sua, meu QI diminui uns três pontos. Vamos parar por aqui?",
  "Você tem futuro... Pena que o passado e o presente pesam contra.",
  "Se persistência pagasse contas, você estaria rico. Mas como é só chatice, você tá falido.",
  "Pode continuar com essa pose de herói. Os monstros da ilha adoram carne macia.",
];

export function loadNpcPhrases(): string[] {
  if (typeof window === "undefined") return DEFAULT_NPC_PHRASES;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_NPC_PHRASES;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return DEFAULT_NPC_PHRASES;
    const list = parsed.filter((v): v is string => typeof v === "string");
    return list.length > 0 ? list : DEFAULT_NPC_PHRASES;
  } catch {
    return DEFAULT_NPC_PHRASES;
  }
}

export function saveNpcPhrases(list: string[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    /* ignore quota */
  }
}

/**
 * Parse a raw admin string. Splits on "/" so the admin can paste
 * "frase 1/frase 2/frase 3" and get three separate phrases.
 */
export function parsePhrasesInput(raw: string): string[] {
  return raw
    .split("/")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

export function addNpcPhrases(raw: string): string[] {
  const current = loadNpcPhrases();
  const incoming = parsePhrasesInput(raw);
  const seen = new Set(current);
  const merged = [...current];
  for (const p of incoming) {
    if (!seen.has(p)) {
      merged.push(p);
      seen.add(p);
    }
  }
  saveNpcPhrases(merged);
  return merged;
}

export function removeNpcPhrase(index: number): string[] {
  const current = loadNpcPhrases();
  if (index < 0 || index >= current.length) return current;
  const next = current.slice(0, index).concat(current.slice(index + 1));
  saveNpcPhrases(next);
  return next;
}

export function clearNpcPhrases(): string[] {
  saveNpcPhrases([]);
  return [];
}
