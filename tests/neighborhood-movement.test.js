import test from 'node:test';
import assert from 'node:assert/strict';
import { chooseFacing } from '../src/characters/GirlSprite.js';
import { cameraRelativeDirection } from '../src/controllers/MovementDirections.js';
import { createHanokKit } from '../src/world/HanokKit.js';

const almost = (v, expected) => assert.ok(Math.abs(v - expected) < 1e-8, `${v} != ${expected}`);

test('A / D move left/right in screen space at original and turned camera yaws', () => {
  const yaw0Left = cameraRelativeDirection(0, -1, 0);
  const yaw0Right = cameraRelativeDirection(0, 1, 0);
  almost(yaw0Left.dx, -1); almost(yaw0Right.dx, 1);
  almost(yaw0Left.dz, 0); almost(yaw0Right.dz, 0);

  const yaw90Left = cameraRelativeDirection(0, -1, Math.PI / 2);
  const yaw90Right = cameraRelativeDirection(0, 1, Math.PI / 2);
  almost(yaw90Left.dz, -1); almost(yaw90Right.dz, 1);
  const forward = cameraRelativeDirection(1, 0, 0);
  almost(forward.dz, -1);
});

test('girl sprite shows left movement mirrored, right movement unmirrored', () => {
  const camera = {position:{x:0,z:9}};
  const character = {x:0,z:0};
  const right = chooseFacing(Math.PI/2,camera,character);
  const left = chooseFacing(-Math.PI/2,camera,character);
  assert.deepEqual(right,{direction:2,mirror:false});
  assert.deepEqual(left,{direction:2,mirror:true});
  const front = chooseFacing(0,camera,character);
  assert.equal(front.direction,0);
  assert.equal(front.mirror,false);
});

function model(type, variant = 0) {
  const calls = {boxes:0,faces:0,cylinders:0,materials:new Set(),invalid:0};
  const sample = name => (...args) => {
    calls[name]++;
    for (const a of args) {
      if (typeof a === 'number' && !Number.isFinite(a)) calls.invalid++;
      if (Array.isArray(a)) for (const v of a) {
        if(typeof v === 'number' && !Number.isFinite(v)) calls.invalid++;
      }
      if (typeof a === 'string') calls.materials.add(a);
    }
  };
  const kit = createHanokKit({
    box:sample('boxes'), face:sample('faces'), cylinder:sample('cylinders'),
    sphere:()=>{}, textured:()=>{}, signs:{hanokCafe:null,hanokAtelier:null}
  });
  const archetype = kit.build(type,variant);
  return {...calls,archetype};
}

test('four decorated hanok styles have distinct roof materials and valid geometry', () => {
  const roofs = ['tileIndigo','tileJade','tileInk','tilePlum'];
  const baseline = model(0,0);
  for(let variant=1;variant<=4;variant++) {
    const result = model(0,variant);
    assert.equal(result.archetype,'gate');
    assert.ok(result.faces>baseline.faces + 150);
    assert.ok(result.materials.has(roofs[variant-1]));
    assert.equal(result.invalid,0);
  }
  assert.equal(model(100,1).archetype,'a01');
  assert.equal(model(2,2).archetype,'facing');
  assert.equal(model(7,3).archetype,'cafe');
});
