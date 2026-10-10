// Same CSPRNG plus rejection-sampling method used by Nothing But a Dice Roller custom dice.
const UINT32_RANGE = 0x1_0000_0000;
export function secureDie(sides) {
  if (!Number.isSafeInteger(sides) || sides < 2 || sides > 1_000_000) throw Error('Invalid die');
  const limit = Math.floor(UINT32_RANGE / sides) * sides;
  const sample = new Uint32Array(1);
  do { crypto.getRandomValues(sample); } while (sample[0] >= limit);
  return (sample[0] % sides) + 1;
}
export function rollFormula(raw, mode = 'normal') {
  const match = String(raw).replace(/\s/g, '').match(/^([1-9][0-9]?)d([0-9]{1,7})([+-][0-9]{1,3})?$/i);
  if (!match) throw Error('Use a formula such as 1d20+5 or 2d6+3');
  const count = Number(match[1]), sides = Number(match[2]), modifier = Number(match[3] || 0);
  if (count > 30 || sides < 2 || sides > 1_000_000) throw Error('Maximum 30 dice, d2 to d1,000,000');
  if (mode !== 'normal' && (count !== 1 || sides !== 20)) throw Error('Advantage/disadvantage requires 1d20');
  if (!['normal','advantage','disadvantage'].includes(mode)) throw Error('Invalid roll mode');
  const dice = Array.from({ length: mode === 'normal' ? count : 2 }, () => secureDie(sides));
  const kept = mode === 'advantage' ? Math.max(...dice) : mode === 'disadvantage' ? Math.min(...dice) : dice.reduce((a,b)=>a+b,0);
  const total = kept + modifier;
  const label = count+'d'+sides+(modifier >= 0 ? '+' : '')+(modifier || '')+(mode === 'normal' ? '' : ' ('+mode+')');
  const detail = mode === 'normal' ? dice.join(' + ')+(modifier ? ' '+(modifier>0?'+':'-')+' '+Math.abs(modifier) : '') : dice.join(' / ')+' → '+kept+(modifier ? ' '+(modifier>0?'+':'-')+' '+Math.abs(modifier) : '');
  return { formula: label, detail, total };
}
