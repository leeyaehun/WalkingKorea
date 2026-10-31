import test from 'node:test';
import assert from 'node:assert/strict';
import { createHanokKit } from '../src/world/HanokKit.js';

function buildHanok(type) {
  const calls = { box: [], face: [], sphere: [], cylinder: [], textured: [] };
  const kit = createHanokKit({
    box: (...args) => calls.box.push(args),
    face: (...args) => calls.face.push(args),
    sphere: (...args) => calls.sphere.push(args),
    cylinder: (...args) => calls.cylinder.push(args),
    textured: (...args) => calls.textured.push(args),
    signs: { hanokCafe: [0,0,1,1], hanokAtelier: [0,0,1,1] },
  });
  return { archetype: kit.build(type), calls };
}

test('A01 is a dedicated procedural model while old archetypes stay intact', () => {
  assert.equal(buildHanok(100).archetype, 'a01');
  assert.equal(buildHanok(0).archetype, 'gate');
  assert.equal(buildHanok(2).archetype, 'facing');
  assert.equal(buildHanok(7).archetype, 'cafe');
});

test('A01 adds roof tiles, gate detail, lanterns and onggi without huge mesh cost', () => {
  const a01 = buildHanok(100);
  const standard = buildHanok(0);
  assert.ok(a01.calls.box.length > standard.calls.box.length + 80);
  assert.ok(a01.calls.cylinder.length >= standard.calls.cylinder.length + 3);
  const lanterns = a01.calls.box.filter(c => c[6] === 'warmLight');
  assert.ok(lanterns.length >= 2);
  assert.ok(a01.calls.box.length < 2000);
});

test('A01 vertex coordinates and dimensions are finite', () => {
  const { calls } = buildHanok(100);
  for (const name of ['box','face','sphere','cylinder']) {
    for (const call of calls[name]) {
      for (const arg of call) {
        if (typeof arg === 'number') assert.ok(Number.isFinite(arg), name);
        if (Array.isArray(arg)) arg.forEach(n => assert.ok(Number.isFinite(n), name));
      }
    }
  }
});
