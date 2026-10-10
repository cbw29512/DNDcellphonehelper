import {rollFormula} from './dice.js';
import {state, save, notify} from './app-state.js';
const $ = id => document.getElementById(id);

function roll(formula, mode='normal') {
  try {
    state.lastRoll=rollFormula(formula, mode);
    save();
    const preview=$('rollPreview');
    preview.closest('.preview-cell')?.classList.remove('result-flash');
    void preview.offsetWidth;
    preview.closest('.preview-cell')?.classList.add('result-flash');
  } catch (error) {notify(error.message);}
}

export function initDice() {
  $('diceTray').addEventListener('click', event => {
    const button=event.target.closest('button[data-sides]');
    if (!button) return;
    const count=Number($('diceCount').value);
    if (!Number.isSafeInteger(count) || count<1 || count>30) return notify('Use 1–30 dice');
    roll(count+'d'+button.dataset.sides);
  });
  $('advBtn').addEventListener('click',()=>roll('1d20','advantage'));
  $('disBtn').addEventListener('click',()=>roll('1d20','disadvantage'));
  $('customRoll').addEventListener('submit',event=>{
    event.preventDefault();
    roll($('formulaInput').value);
  });
}
