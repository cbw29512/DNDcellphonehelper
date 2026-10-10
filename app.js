import { rollFormula } from './dice.js';
const $ = id => document.getElementById(id);
let state = null;
let pendingSave = Promise.resolve();
const showError = msg => { $('message').textContent = msg; };
const newId = () => crypto.randomUUID();
const activeActor = () => state.combatants.find(a => a.id === state.activeId);
function save() {
  const snapshot = JSON.parse(JSON.stringify(state));
  render();
  pendingSave = pendingSave.catch(() => {}).then(async () => {
    try {
      const response = await fetch('/api/state', {
        method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(snapshot),
      });
      const result = await response.json();
      if (!response.ok) throw Error(result.error || 'Unable to save');
      state.revision = result.revision;
      showError('Saved · player display updated');
    } catch (error) { showError('NOT SYNCED: '+error.message); }
  });
}
function button(text, title, fn, disabled=false) {
  const el=document.createElement('button'); el.textContent=text; el.title=title; el.disabled=disabled; el.addEventListener('click',fn); return el;
}
function render() {
  const list=$('roster'); list.replaceChildren();
  state.combatants.forEach((actor,i) => {
    const row=document.createElement('div'); row.className='actor-row'+(actor.id===state.activeId?' selected':'');
    const name=button(actor.name,'Show this combatant',()=>{state.activeId=actor.id;save();}); name.className='actor-name'; row.append(name);
    row.append(button('↑','Move up',()=>move(i,-1),i===0));
    row.append(button('↓','Move down',()=>move(i,1),i===state.combatants.length-1));
    row.append(button('✕','Remove combatant',()=>removeActor(actor.id)));
    list.append(row);
  });
  const actor=activeActor();
  $('editing').textContent=actor ? 'Effects: '+actor.name : 'Select a combatant';
  $('rollPreview').textContent=state.lastRoll ? state.lastRoll.total+' · '+state.lastRoll.formula : 'No roll yet';
  $('namePreview').textContent=actor?.name || 'READY';
  $('roundPreview').textContent='Round '+state.round;
  for(const type of ['buffs','debuffs']) {
    const panel=$(type); panel.replaceChildren();
    for(const effect of actor?.[type] || []) {
      const el=button(effect+' ×', 'Remove '+effect,()=>{actor[type]=actor[type].filter(v=>v!==effect);save();});
      el.className='effect-chip '+type; panel.append(el);
    }
  }
}
function move(i,by) {
  const next=i+by; if(next<0||next>=state.combatants.length)return;
  [state.combatants[i],state.combatants[next]]=[state.combatants[next],state.combatants[i]]; save();
}
function removeActor(id) {
  state.combatants=state.combatants.filter(a=>a.id!==id);
  if(state.activeId===id)state.activeId=state.combatants[0]?.id||null;
  save();
}
$('rollBtn').addEventListener('click',()=>{
  try { state.lastRoll=rollFormula($('formulaInput').value,$('mode').value); save(); }
  catch(error) {showError(error.message);}
});
$('addBtn').addEventListener('click',()=>{
  const name=$('actorInput').value.trim();
  if(!name||name.length>36||state.combatants.length>=60)return showError('Enter a name (1–36 characters, max 60)');
  const actor={id:newId(),name,buffs:[],debuffs:[]};state.combatants.push(actor);
  if(!state.activeId)state.activeId=actor.id;
  $('actorInput').value=''; save();
});
$('actorInput').addEventListener('keydown',e=>{if(e.key==='Enter')$('addBtn').click();});
$('nextBtn').addEventListener('click',()=>{
  if(!state.combatants.length)return;
  const i=state.combatants.findIndex(a=>a.id===state.activeId);
  if(i>=state.combatants.length-1)state.round++;
  state.activeId=state.combatants[(i+1)%state.combatants.length].id;save();
});
$('prevBtn').addEventListener('click',()=>{
  if(!state.combatants.length)return;
  const i=state.combatants.findIndex(a=>a.id===state.activeId);
  if(i<=0&&state.round>1)state.round--;
  state.activeId=state.combatants[(i-1+state.combatants.length)%state.combatants.length].id;save();
});
$('effectBtn').addEventListener('click',()=>{
  const actor=activeActor(),name=$('effectInput').value.trim(),type=$('effectType').value;
  if(!actor)return showError('Select a combatant first');
  if(!name||name.length>32)return showError('Effect name must be 1–32 characters');
  if(actor[type].length>=12)return showError('Maximum 12 effects per category');
  if(!actor[type].includes(name))actor[type].push(name);
  $('effectInput').value='';save();
});
$('openPlayer').addEventListener('click',()=>{window.open('/player','DND_Player','width=930,height=600');});
async function init() {
  try { const res=await fetch('/api/state',{cache:'no-store'});if(!res.ok)throw Error('Server unavailable');state=await res.json();render(); }
  catch(error){showError('Unable to start: '+error.message);document.querySelectorAll('button').forEach(b=>b.disabled=true);}
}
init();
