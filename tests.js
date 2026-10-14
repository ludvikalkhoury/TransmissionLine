const assert = require('assert');
const { createSimulation } = require('./physics.js');
const close = (actual, expected, label) => assert.ok(Math.abs(actual - expected) < 1e-8, `${label}: expected ${expected}, got ${actual}`);
function standard(overrides = {}) { return Object.assign({ vs: 5, rs: 50, z0: 50, td: 6, rl: Infinity, duration: 48 }, overrides); }
// A: open load, matched source.
let s = createSimulation(standard());
close(s.voltage(0, 0), 2.5, 'A at 0 ns'); close(s.voltage(.5, 3), 2.5, 'B at 3 ns'); close(s.voltage(1, 6), 5, 'C at 6 ns'); close(s.voltage(.5, 9), 5, 'B at 9 ns'); close(s.voltage(0, 12), 5, 'A at 12 ns'); assert.equal(s.reflectionCount, 1, 'open/matched reflection count');
// B: matched load.
s = createSimulation(standard({ rl: 50 })); close(s.launch, 2.5, 'matched launch'); close(s.voltage(1, 6), 2.5, 'matched load'); assert.equal(s.reflectionCount, 0, 'matched reflection count');
// C: short.
s = createSimulation(standard({ rl: 0 })); close(s.voltage(1, 6), 0, 'short load'); close(s.voltage(.5, 9), 0, 'short midpoint after reflection');
// D: ideal source, open load.
s = createSimulation(standard({ rs: 0 })); close(s.launch, 5, 'ideal source launch'); close(s.voltage(1, 6), 10, 'ideal/open load peak'); close(s.gammaSource, -1, 'ideal source gamma'); assert.ok(s.reflectionCount > 2, 'ideal/open continues reflecting');
// Pulse edges are finite and source command is bounded by Vs.
s = createSimulation(standard({ mode: 'pulse', frequencyMHz: 100, dutyPercent: 50, duration: 30 })); close(s.sourceCommand(0), 5, 'pulse high'); close(s.sourceCommand(6), 0, 'pulse low'); assert.ok(s.waves.some(w => w.amplitude < 0 && !w.reflected), 'falling edge exists');
console.log('All transmission-line physics tests passed.');
