// Simple SFX helpers for one-shot and looping sounds.
// Volume is scaled by the user's ambient volume (0-100) already applied by callers.

const oneShotPool: Record<string, HTMLAudioElement[]> = {};

export function playOneShot(url: string, volume = 1) {
  if (typeof window === "undefined") return;
  try {
    let pool = oneShotPool[url];
    if (!pool) {
      pool = [];
      oneShotPool[url] = pool;
    }
    // Find a free (ended/paused) node, else create up to 4.
    let node = pool.find((a) => a.paused || a.ended);
    if (!node) {
      if (pool.length >= 4) node = pool[0];
      else {
        node = new Audio(url);
        pool.push(node);
      }
    }
    node.volume = Math.max(0, Math.min(1, volume));
    try { node.currentTime = 0; } catch { /* ignore */ }
    node.play().catch(() => {});
  } catch { /* ignore */ }
}

// ------------------ Reverb (WebAudio) ------------------
// Lazily-created shared AudioContext + convolver with a synthesized
// "cave" impulse response. Used by playOneShotReverb.
let audioCtx: AudioContext | null = null;
let convolver: ConvolverNode | null = null;
let wetGain: GainNode | null = null;
let dryGain: GainNode | null = null;
const bufferCache: Record<string, AudioBuffer | Promise<AudioBuffer>> = {};

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (audioCtx) return audioCtx;
  try {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioCtx = new AC();
  } catch { return null; }
  return audioCtx;
}

function buildImpulse(ctx: AudioContext, seconds = 2.4, decay = 2.6): AudioBuffer {
  const rate = ctx.sampleRate;
  const length = Math.max(1, Math.floor(rate * seconds));
  const ir = ctx.createBuffer(2, length, rate);
  for (let ch = 0; ch < 2; ch++) {
    const data = ir.getChannelData(ch);
    for (let i = 0; i < length; i++) {
      const t = i / length;
      // Noise * exponential decay — classic cave-ish reverb tail.
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - t, decay);
    }
  }
  return ir;
}

function ensureReverb(): { ctx: AudioContext; dry: GainNode; wet: GainNode } | null {
  const ctx = getCtx();
  if (!ctx) return null;
  if (!convolver) {
    convolver = ctx.createConvolver();
    convolver.buffer = buildImpulse(ctx, 2.4, 2.6);
    wetGain = ctx.createGain();
    dryGain = ctx.createGain();
    wetGain.gain.value = 0.85; // strong reverb tail
    dryGain.gain.value = 1.0;
    convolver.connect(wetGain);
    wetGain.connect(ctx.destination);
    dryGain.connect(ctx.destination);
  }
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  return { ctx, dry: dryGain!, wet: wetGain! };
}

async function loadBuffer(ctx: AudioContext, url: string): Promise<AudioBuffer> {
  const hit = bufferCache[url];
  if (hit) return hit as Promise<AudioBuffer>;
  const p = fetch(url)
    .then((r) => {
      if (!r.ok) throw new Error(`sfx fetch ${url} → ${r.status}`);
      return r.arrayBuffer();
    })
    .then((ab) => ctx.decodeAudioData(ab))
    .then((buf) => { bufferCache[url] = buf; return buf; })
    .catch((err) => { delete bufferCache[url]; throw err; });
  bufferCache[url] = p;
  return p;
}

export function playOneShotReverb(
  url: string,
  volume = 1,
  startOffset = 0,
  mix: { dry?: number; wet?: number } = {},
) {
  const r = ensureReverb();
  if (!r) { playOneShot(url, volume); return; }
  const { ctx, dry, wet } = r;
  loadBuffer(ctx, url).then((buf) => {
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const g = ctx.createGain();
    g.gain.value = Math.max(0, Math.min(1, volume));
    src.connect(g);
    const dryTap = ctx.createGain();
    const wetTap = ctx.createGain();
    dryTap.gain.value = mix.dry ?? 1;
    wetTap.gain.value = mix.wet ?? 1;
    g.connect(dryTap);
    g.connect(wetTap);
    dryTap.connect(dry);
    wetTap.connect(convolver!);
    const off = Math.max(0, Math.min(buf.duration - 0.01, startOffset));
    src.start(0, off);
  }).catch(() => { playOneShot(url, volume); });
}


export type SfxLoop = {
  setVolume: (v: number) => void;
  play: () => void;
  pause: () => void;
  dispose: () => void;
};

export function createLoop(url: string, opts?: { playbackRate?: number }): SfxLoop {
  const audio = new Audio(url);
  audio.loop = true;
  audio.volume = 0;
  audio.preload = "auto";
  if (opts?.playbackRate) {
    audio.playbackRate = Math.max(0.25, Math.min(4, opts.playbackRate));
  }
  let disposed = false;
  let desiredVolume = 0;
  const tryPlay = () => {
    if (disposed) return;
    audio.play().catch(() => {});
  };
  const onInteract = () => { tryPlay(); };
  window.addEventListener("pointerdown", onInteract);
  window.addEventListener("keydown", onInteract);
  // Watchdog: if the browser pauses/ends the loop for any reason (autoplay
  // policy, tab focus, media session hiccup, decoder glitch), resume it as
  // long as the caller still wants it audible.
  const onPause = () => { if (!disposed && desiredVolume > 0) tryPlay(); };
  const onEnded = () => {
    if (disposed) return;
    try { audio.currentTime = 0; } catch { /* ignore */ }
    tryPlay();
  };
  const onVisible = () => { if (!disposed && desiredVolume > 0 && audio.paused) tryPlay(); };
  audio.addEventListener("pause", onPause);
  audio.addEventListener("ended", onEnded);
  document.addEventListener("visibilitychange", onVisible);
  const watchdog = window.setInterval(() => {
    if (disposed) return;
    if (desiredVolume > 0 && audio.paused) tryPlay();
  }, 1500);
  tryPlay();
  return {
    setVolume: (v: number) => {
      const c = Math.max(0, Math.min(1, v));
      desiredVolume = c;
      audio.volume = c;
      if (c > 0 && audio.paused) tryPlay();
    },
    play: () => tryPlay(),
    pause: () => { audio.pause(); },
    dispose: () => {
      disposed = true;
      window.clearInterval(watchdog);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onEnded);
      document.removeEventListener("visibilitychange", onVisible);
      audio.pause();
      audio.src = "";
      window.removeEventListener("pointerdown", onInteract);
      window.removeEventListener("keydown", onInteract);
    },
  };
}

// A looping SFX that runs through the shared reverb (cave-style tail).
// Uses WebAudio's MediaElementAudioSource so we can split dry/wet like the
// one-shot reverb helper. If WebAudio isn't available we fall back to a
// plain looping <audio> so callers always get a working handle.
export function createReverbLoop(
  url: string,
  opts?: { playbackRate?: number; wet?: number; dry?: number },
): SfxLoop {
  const audio = new Audio(url);
  audio.loop = true;
  audio.crossOrigin = "anonymous";
  audio.volume = 1;
  if (opts?.playbackRate) {
    audio.playbackRate = Math.max(0.25, Math.min(4, opts.playbackRate));
  }
  const r = ensureReverb();
  let gain: GainNode | null = null;
  let wired = false;
  const wire = () => {
    if (wired || !r) return;
    try {
      const src = r.ctx.createMediaElementSource(audio);
      gain = r.ctx.createGain();
      gain.gain.value = 0;
      const wetTap = r.ctx.createGain();
      const dryTap = r.ctx.createGain();
      wetTap.gain.value = opts?.wet ?? 0.9;
      dryTap.gain.value = opts?.dry ?? 0.6;
      src.connect(gain);
      gain.connect(dryTap);
      gain.connect(convolver!);
      dryTap.connect(r.ctx.destination);
      // wetTap unused (convolver already goes through wetGain), kept for clarity
      wetTap.disconnect();
      wired = true;
    } catch { /* already wired or unsupported */ }
  };
  wire();

  let started = false;
  const tryPlay = () => {
    if (started) return;
    if (r && r.ctx.state === "suspended") r.ctx.resume().catch(() => {});
    audio.play().then(() => { started = true; }).catch(() => {});
  };
  const onInteract = () => {
    if (r && r.ctx.state === "suspended") r.ctx.resume().catch(() => {});
    wire();
    tryPlay();
    if (started) {
      window.removeEventListener("pointerdown", onInteract);
      window.removeEventListener("keydown", onInteract);
    }
  };
  window.addEventListener("pointerdown", onInteract);
  window.addEventListener("keydown", onInteract);
  tryPlay();

  return {
    setVolume: (v: number) => {
      const c = Math.max(0, Math.min(1, v));
      if (gain) gain.gain.value = c;
      else audio.volume = c;
    },
    play: () => tryPlay(),
    pause: () => { audio.pause(); },
    dispose: () => {
      audio.pause();
      audio.src = "";
      window.removeEventListener("pointerdown", onInteract);
      window.removeEventListener("keydown", onInteract);
    },
  };
}
