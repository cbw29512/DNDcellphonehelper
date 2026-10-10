import { strict as assert } from 'node:assert';
import { rollFormula, secureDie } from '../dice.js';
for(const sides of [2,4,6,8,10,12,20,100,1000000])for(let i=0;i<50;i++){
  const n=secureDie(sides);assert(n>=1&&n<=sides);
}
assert.equal(rollFormula('1d20+5').formula,'1d20+5');
assert.equal(rollFormula('1d20').formula,'1d20');
assert.equal(rollFormula('2d6+3').formula,'2d6+3');
assert.equal(rollFormula('1d20','advantage').detail.includes('→'),true);
assert.throws(()=>rollFormula('2d6','advantage'));
assert.throws(()=>rollFormula('100d20'));
assert.throws(()=>rollFormula('1d1'));
console.log('Secure dice tests passed');
