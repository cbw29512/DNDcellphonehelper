import {rollFormula} from './dice.js';
import {state, save, notify} from './app-state.js';
const $ = id => document.getElementById(id);
function modifier() {
  const value=Number($('modifier').value);
  if (!Number.isSafeInteger(value) || value < -999 || value > 999) throw Error('Modifier must be -999 to +999');
  return value ? (value>0?'+':'')+value : '';
}
function roll(formula, mode='normal') {
  try {
    state.lastRoll=rollFormula(formula, mode);
    save();
    $('rollPreview').closest('.preview-cell')?.classList.remove('result-flash');
    void $('rollPreview').offsetWidth;
    $('rollPreview').closest('.preview-cell')?.classList.add('result-flash');
  } catch (error) {notify(error.message);}
}
export function initDice() {
  $('diceTray').addEventListener('click', event => {
    const button=event.target.closest('button[data-sides]');
    if (!button) return;
    try {
      const count=Number($('diceCount').value);
      if (!Number.isSafeInteger(count) || count<1 || count>30) throw Error('Use 1–30 dice');
      roll(count+'d'+button.dataset.sides+modifier());
    } catch(error){notify(error.message);}
  });
  $('advBtn').addEventListener('click',()=>{try{roll('1d20'+modifier(),'advantage')}catch(e){notify(e.message)}});
  $('disBtn').addEventListener('click',()=>{try{roll('1d20'+modifier(),'disadvantage')}catch(e){notify(e.message)}});
  $('customRoll').addEventListener('submit',event=>{event.preventDefault();roll($('formulaInput').value);});
}
