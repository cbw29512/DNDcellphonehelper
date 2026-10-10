import {state, activeActor, setRenderer, initialize} from './app-state.js';
import {initDice} from './dice-ui.js';
import {initCards, renderCards} from './cards-ui.js';
import {initEffects} from './effects-ui.js';
const $ = id => document.getElementById(id);
function render() {
  renderCards();
  const actor=activeActor();
  $('rollPreview').textContent=state.lastRoll?state.lastRoll.total:'—';
  $('detailPreview').textContent=state.lastRoll?state.lastRoll.formula+' · '+state.lastRoll.detail:'Waiting for a roll';
  $('namePreview').textContent=actor?.name||'READY';
  $('roundPreview').textContent='ROUND '+state.round;
  $('previewBuffs').textContent=actor?.buffs?.length?'▲ '+actor.buffs.join(' · '):'▲ No buffs';
  $('previewDebuffs').textContent=actor?.debuffs?.length?'▼ '+actor.debuffs.join(' · '):'▼ No debuffs';
}
$('openPlayer').addEventListener('click',()=>{
  window.open('/player','DND_Player','width=980,height=650');
});
(async()=>{
  try {
    setRenderer(render);
    await initialize();
    initDice();initCards();initEffects();
    $('syncStatus').textContent='LIVE';
  } catch(error) {
    $('syncStatus').textContent='ERROR';
    $('message').textContent='Unable to start: '+error.message;
  }
})();
