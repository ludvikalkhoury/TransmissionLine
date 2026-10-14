/* Lossless resistive transmission-line physics; usable in both browser and Node. */
(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.TLPhysics = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const EPSILON = 1e-9;
  function validate(p) {
    for (const key of ['vs', 'rs', 'z0', 'td', 'duration']) if (!Number.isFinite(p[key])) throw new Error(`${key} must be finite.`);
    if (p.rs < 0 || p.z0 <= 0 || p.td <= 0 || p.duration <= 0) throw new Error('Rs ≥ 0; Z0, TD, and duration must be positive.');
    if (!(Number.isFinite(p.rl) || p.rl === Infinity) || p.rl < 0) throw new Error('RL must be non-negative or infinity.');
    if (p.mode === 'pulse' && (!Number.isFinite(p.frequencyMHz) || p.frequencyMHz <= 0 || !Number.isFinite(p.dutyPercent) || p.dutyPercent <= 0 || p.dutyPercent >= 100)) throw new Error('Pulse frequency must be positive and duty cycle must be between 0 and 100%.');
  }
  function gamma(resistance, z0) { return resistance === Infinity ? 1 : (resistance - z0) / (resistance + z0); }
  function createSimulation(input) {
    const p = Object.assign({ mode: 'step', frequencyMHz: 50, dutyPercent: 50, maxReflections: 1000, threshold: 1e-6 }, input);
    validate(p);
    const gammaLoad = gamma(p.rl, p.z0);
    const gammaSource = gamma(p.rs, p.z0);
    const launch = p.vs * p.z0 / (p.rs + p.z0);
    const waves = [], queue = [];
    const addSeed = (amplitude, start) => { const w = { amplitude, direction: 1, start, reflected: false }; waves.push(w); queue.push(w); };
    if (p.mode === 'pulse') {
      const period = 1000 / p.frequencyMHz, width = period * p.dutyPercent / 100;
      for (let start = 0; start <= p.duration + EPSILON; start += period) {
        addSeed(launch, start);
        if (start + width <= p.duration + EPSILON) addSeed(-launch, start + width);
      }
    } else addSeed(launch, 0);
    let reflectionCount = 0;
    while (queue.length && reflectionCount < p.maxReflections) {
      const wave = queue.shift(), arrival = wave.start + p.td;
      if (arrival > p.duration + EPSILON) continue;
      const amplitude = wave.amplitude * (wave.direction === 1 ? gammaLoad : gammaSource);
      if (Math.abs(amplitude) < p.threshold) continue;
      const reflected = { amplitude, direction: -wave.direction, start: arrival, reflected: true };
      waves.push(reflected); queue.push(reflected); reflectionCount++;
    }
    const arrived = (wave, x, t) => t + EPSILON >= wave.start + (wave.direction === 1 ? x : 1 - x) * p.td;
    const voltage = (x, t) => waves.reduce((sum, w) => sum + (arrived(w, x, t) ? w.amplitude : 0), 0);
    const current = (x, t) => waves.reduce((sum, w) => sum + (arrived(w, x, t) ? w.direction * w.amplitude / p.z0 : 0), 0);
    return { p, waves, launch, gammaLoad, gammaSource, reflectionCount, voltage, current,
      sourceCommand(t) { if (p.mode !== 'pulse') return t >= 0 ? p.vs : 0; const period = 1000 / p.frequencyMHz, width = period * p.dutyPercent / 100; return (t % period) < width ? p.vs : 0; },
      activeFronts(t) { return waves.map(w => { const age = (t - w.start) / p.td; return { x: w.direction === 1 ? age : 1 - age, amplitude: w.amplitude, direction: w.direction }; }).filter(w => w.x >= 0 && w.x <= 1); }
    };
  }
  return { createSimulation, gamma };
});
