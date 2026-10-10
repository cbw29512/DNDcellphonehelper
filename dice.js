// Web Crypto CSPRNG with unbiased rejection sampling; identical method to
// Nothing But A Dice Roller's secure custom rolls. No result modifiers.
const UINT32_RANGE = 0x1_0000_0000;

export function secureDie(sides) {
  if (!Number.isSafeInteger(sides) || sides < 2 || sides > 1_000_000) {
    throw Error('Invalid die');
  }
  const limit = Math.floor(UINT32_RANGE / sides) * sides;
  const sample = new Uint32Array(1);
  do { crypto.getRandomValues(sample); } while (sample[0] >= limit);
  return (sample[0] % sides) + 1;
}

export function rollFormula(raw, mode = 'normal') {
  const match = String(raw).replace(/\s/g, '').match(/^([1-9][0-9]?)d([0-9]{1,7})$/i);
  if (!match) throw Error('Raw dice only: use 1d20 or 2d6 (no modifiers)');
  const count=Number(match[1]), sides=Number(match[2]);
  if (count > 30 || sides < 2 || sides > 1_000_000) {
    throw Error('Maximum 30 dice, d2 to d1,000,000');
  }
  if (!['normal','advantage','disadvantage'].includes(mode)) throw Error('Invalid roll mode');
  if (mode !== 'normal' && (count !== 1 || sides !== 20)) {
    throw Error('Advantage/disadvantage requires 1d20');
  }
  const dice=Array.from({length:mode==='normal'?count:2},()=>secureDie(sides));
  const total=mode==='advantage'?Math.max(...dice)
    :mode==='disadvantage'?Math.min(...dice)
    :dice.reduce((sum,face)=>sum+face,0);
  const formula=count+'d'+sides+(mode==='normal'?'':' ('+mode+')');
  const detail=mode==='normal'?dice.join(' + '):dice.join(' / ')+' → '+total;
  return {formula,detail,total};
}
