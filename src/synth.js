// Loop de demo generado en el navegador con Web Audio API (sin archivos de audio).
// 128 BPM en Fa menor: bombo, palmas, charles, bajo, acordes y un arpegio.
// Expone un analizador para que el vinilo reaccione al sonido real.

export function createSynth({ bpm = 128 } = {}) {
  const spb = 60 / bpm;          // segundos por pulso
  const s16 = spb / 4;           // semicorchea
  // progresión Fm – Db – Ab – Eb (MIDI)
  const CHORDS = [[53, 56, 60], [49, 53, 56], [56, 60, 63], [51, 55, 58]];
  const ROOTS = [41, 37, 44, 39];
  const ARP = [0, 3, 6, 8, 10, 11, 14];

  let ctx = null, out = null, analyser = null, noise = null;
  let timer = 0, nextTime = 0, step = 0, startTime = 0, playing = false;
  const freq = new Uint8Array(128);

  const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);

  function init() {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    out = ctx.createGain();
    out.gain.value = 0;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14;
    comp.ratio.value = 4;
    analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.78;
    out.connect(comp).connect(analyser).connect(ctx.destination);

    noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = noise.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }

  function env(g, t, peak, attack, decay) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
  }

  function kick(t) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(150, t);
    o.frequency.exponentialRampToValueAtTime(44, t + 0.12);
    env(g, t, 0.95, 0.002, 0.38);
    o.connect(g).connect(out);
    o.start(t); o.stop(t + 0.45);
  }

  function noiseHit(t, { type, f, q = 1, peak, decay }) {
    const s = ctx.createBufferSource(), fl = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = noise;
    fl.type = type; fl.frequency.value = f; fl.Q.value = q;
    env(g, t, peak, 0.001, decay);
    s.connect(fl).connect(g).connect(out);
    s.start(t); s.stop(t + decay + 0.05);
  }

  function bass(t, m) {
    const o = ctx.createOscillator(), fl = ctx.createBiquadFilter(), g = ctx.createGain();
    o.type = 'sawtooth'; o.frequency.value = mtof(m);
    fl.type = 'lowpass'; fl.Q.value = 7;
    fl.frequency.setValueAtTime(900, t);
    fl.frequency.exponentialRampToValueAtTime(140, t + s16 * 1.6);
    env(g, t, 0.32, 0.005, s16 * 1.7);
    o.connect(fl).connect(g).connect(out);
    o.start(t); o.stop(t + s16 * 2);
  }

  function pad(t, notes, dur) {
    const fl = ctx.createBiquadFilter(), g = ctx.createGain();
    fl.type = 'lowpass'; fl.frequency.value = 1400; fl.Q.value = 0.7;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.09, t + 0.25);
    g.gain.setValueAtTime(0.09, t + dur - 0.3);
    g.gain.linearRampToValueAtTime(0.0001, t + dur);
    fl.connect(g).connect(out);
    notes.forEach((m) => [-7, 7].forEach((cents) => {
      const o = ctx.createOscillator();
      o.type = 'sawtooth'; o.frequency.value = mtof(m); o.detune.value = cents;
      o.connect(fl); o.start(t); o.stop(t + dur + 0.05);
    }));
  }

  function pluck(t, m) {
    const o = ctx.createOscillator(), fl = ctx.createBiquadFilter(), g = ctx.createGain();
    o.type = 'square'; o.frequency.value = mtof(m);
    fl.type = 'lowpass';
    fl.frequency.setValueAtTime(3200, t);
    fl.frequency.exponentialRampToValueAtTime(500, t + 0.18);
    env(g, t, 0.07, 0.003, 0.22);
    o.connect(fl).connect(g).connect(out);
    o.start(t); o.stop(t + 0.3);
  }

  function schedule(n, t) {
    const bar = Math.floor(n / 16) % 4;
    const s = n % 16;
    const chord = CHORDS[bar];
    if (s % 4 === 0) kick(t);
    if (s === 4 || s === 12) noiseHit(t, { type: 'bandpass', f: 1600, q: 0.8, peak: 0.35, decay: 0.16 });
    if (s % 2 === 1) noiseHit(t, { type: 'highpass', f: 8000, peak: 0.12, decay: 0.04 });
    if (s % 4 === 2) { noiseHit(t, { type: 'highpass', f: 7000, peak: 0.16, decay: 0.12 }); bass(t, ROOTS[bar]); }
    if (s === 15) bass(t, ROOTS[bar] + 12);
    if (s === 0) pad(t, chord, s16 * 16);
    if (ARP.includes(s)) pluck(t, chord[ARP.indexOf(s) % 3] + 12);
  }

  function tick() {
    while (nextTime < ctx.currentTime + 0.12) {
      schedule(step, nextTime);
      nextTime += s16;
      step++;
    }
    timer = setTimeout(tick, 25);
  }

  return {
    get playing() { return playing; },
    async start() {
      if (!ctx) init();
      await ctx.resume();
      out.gain.cancelScheduledValues(ctx.currentTime);
      out.gain.setValueAtTime(out.gain.value, ctx.currentTime);
      out.gain.linearRampToValueAtTime(0.6, ctx.currentTime + 0.4);
      startTime = ctx.currentTime + 0.06;
      nextTime = startTime;
      step = 0;
      clearTimeout(timer);
      tick();
      playing = true;
    },
    stop() {
      if (!ctx) return;
      out.gain.cancelScheduledValues(ctx.currentTime);
      out.gain.setValueAtTime(out.gain.value, ctx.currentTime);
      out.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.35);
      clearTimeout(timer);
      playing = false;
    },
    // 0 justo en el bombo → 1 justo antes del siguiente
    beatPhase() {
      if (!ctx || !playing) return null;
      const t = ctx.currentTime - startTime;
      return t < 0 ? 0 : (t % spb) / spb;
    },
    // nivel 0–1 por banda (128 bandas, graves primero)
    levels() {
      if (!analyser || !playing) return null;
      analyser.getByteFrequencyData(freq);
      return freq;
    }
  };
}
