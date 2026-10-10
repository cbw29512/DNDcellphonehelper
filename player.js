const $ = id => document.getElementById(id);
let previous = null;
function render(state) {
  const actor = state.combatants.find(a => a.id === state.activeId);
  const roll = state.lastRoll;
  if (previous && JSON.stringify(previous.lastRoll) !== JSON.stringify(roll)) pulse($('rollPanel'));
  if (previous && (previous.activeId !== state.activeId || previous.round !== state.round)) pulse($('turnPanel'));
  if (previous && actor && JSON.stringify(previous.combatants.find(a=>a.id===actor.id)) !== JSON.stringify(actor)) pulse($('effectsPanel'));
  $('total').textContent = roll ? roll.total : '—';
  $('formula').textContent = roll ? roll.formula : 'Waiting for roll';
  $('detail').textContent = roll ? roll.detail : '';
  $('name').textContent = actor ? actor.name : 'READY';
  $('round').textContent = `ROUND ${state.round}`;
  for (const key of ['buffs','debuffs']) {
    const box = $(key); box.replaceChildren();
    const items = actor?.[key] || [];
    if (!items.length) { const el=document.createElement('span'); el.textContent='—'; box.append(el); }
    for (const label of items) { const el=document.createElement('div'); el.textContent=label; box.append(el); }
  }
  previous = state;
}
function pulse(element) { element.classList.remove('flash'); void element.offsetWidth; element.classList.add('flash'); }
async function refresh() {
  try {
    const response = await fetch('/api/state', {cache:'no-store'});
    if (!response.ok) throw Error('No connection');
    const state = await response.json();
    if (state.revision !== previous?.revision) render(state);
    $('connection').textContent = 'LIVE';
  } catch { $('connection').textContent = 'RECONNECTING'; }
}
refresh(); setInterval(refresh, 300);
