import { strict as assert } from 'node:assert';
import { rollFormula, secureDie } from '../dice.js';
for (const sides of [2,4,6,8,10,12,20,100,1000000]) {
  for (let i=0;i<50;i++) {
    const n=secureDie(sides);
    assert(Number.isInteger(n) && n>=1 && n<=sides);
  }
}
for (const sides of [4,6,8,10,12,20,100,1000000]) {
  const result=rollFormula('1d'+sides);
  assert.equal(result.formula,'1d'+sides);
  assert(result.total>=1 && result.total<=sides);
  assert.equal(result.detail,String(result.total));
}
const multi=rollFormula('3d6');
assert.equal(multi.formula,'3d6');
assert.equal(multi.total,multi.detail.split(' + ').reduce((sum,n)=>sum+Number(n),0));
for (const mode of ['advantage','disadvantage']) {
  const result=rollFormula('1d20',mode);
  const faces=result.detail.match(/^(\d+) \/ (\d+) → (\d+)$/);
  assert(faces,mode+' includes both raw d20 rolls');
  const [a,b,kept]=faces.slice(1).map(Number);
  assert.equal(kept,mode==='advantage'?Math.max(a,b):Math.min(a,b));
  assert.equal(result.total,kept);
}
for (const invalid of ['1d20+5','2d6-1','d20','1d1','100d20','0d6','1d1000001','2d20+0']) {
  assert.throws(()=>rollFormula(invalid),undefined,invalid+' must fail');
}
assert.throws(()=>rollFormula('2d6','advantage'));
assert.throws(()=>rollFormula('1d20','invalid'));
console.log('Raw, cryptographically secure dice tests passed');
