import {state, activeActor, moveActor, toggleEffect, advance, save, notify} from './app-state.js';
const $ = id => document.getElementById(id);
function action(text, title, fn, className='') {
  const button=document.createElement('button');
  button.type='button'; button.textContent=text; button.title=title; button.className=className;
  button.addEventListener('click',event=>{event.stopPropagation();fn();}); return button;
}
function card(actor, index) {
  const active=actor.id===state.activeId;
  const el=document.createElement('article');
  el.className='combat-card'+(active?' current':'')+(actor.kind==='monster'?' monster':'');
  el.dataset.actorId=actor.id;
  el.tabIndex=0; el.setAttribute('role','button');
  el.setAttribute('aria-label', actor.name+(active?' current turn':''));
  el.addEventListener('click',()=>{state.activeId=actor.id;save();});
  el.addEventListener('keydown',e=>{if(e.target===el&&(e.key==='Enter'||e.key===' ')){e.preventDefault();state.activeId=actor.id;save();}});
  const top=document.createElement('div');top.className='card-top';
  const handle=document.createElement('span');handle.className='drag-handle';handle.textContent='⠿';
  handle.title='Drag card to reorder';handle.draggable=true;handle.setAttribute('aria-label','Drag to change initiative');
  handle.addEventListener('dragstart',e=>{
    e.stopPropagation();e.dataTransfer.setData('text/plain',JSON.stringify({kind:'actor',id:actor.id}));
    e.dataTransfer.effectAllowed='move';el.classList.add('dragging');
  });
  handle.addEventListener('dragend',()=>{el.classList.remove('dragging');document.querySelectorAll('.drop-before,.drop-after,.drop-effect').forEach(x=>x.classList.remove('drop-before','drop-after','drop-effect'));});
  const kind=document.createElement('span');kind.className='card-kind';kind.textContent=actor.kind==='monster'?'MONSTER':'HERO';
  const remove=action('×','Remove '+actor.name,()=>removeActor(actor.id),'remove-card');
  top.append(handle,kind,remove);
  const name=document.createElement('h3');name.textContent=actor.name;
  const effects=document.createElement('div');effects.className='card-effects';
  for (const type of ['buffs','debuffs']) for (const label of actor[type]) {
    effects.append(action(label+' ×','Remove '+label,()=>toggleEffect(actor.id,type,label,true),'status-chip '+type));
  }
  const footer=document.createElement('div');footer.className='card-bottom';
  const selected=document.createElement('span');selected.textContent=active?'▶ ON SCREEN':`TURN ${index+1}`;
  const arrows=document.createElement('span');arrows.className='card-arrows';
  arrows.append(action('←','Move earlier',()=>shift(index,-1),'arrow'),action('→','Move later',()=>shift(index,1),'arrow'));
  footer.append(selected,arrows);
  el.append(top,name,effects,footer);
  el.addEventListener('dragover',event=>{if(!event.dataTransfer.types.includes('text/plain'))return;event.preventDefault();});
  el.addEventListener('dragenter',event=>{event.preventDefault();el.classList.add('drop-effect');});
  el.addEventListener('dragleave',event=>{if(!el.contains(event.relatedTarget))el.classList.remove('drop-effect');});
  el.addEventListener('drop',event=>{
    event.preventDefault();event.stopPropagation();el.classList.remove('drop-effect');
    let payload;try{payload=JSON.parse(event.dataTransfer.getData('text/plain'));}catch{return;}
    if(payload.kind==='actor')moveActor(payload.id,actor.id,event.clientX>el.getBoundingClientRect().left+el.offsetWidth/2);
    if(payload.kind==='effect')toggleEffect(actor.id,payload.type,payload.name);
  });
  return el;
}
function removeActor(id) {
  state.combatants=state.combatants.filter(a=>a.id!==id);
  if(state.activeId===id) state.activeId=state.combatants[0]?.id??null;
  save();
}
function shift(index,delta) {
  const other=state.combatants[index+delta];if(!other)return;
  moveActor(state.combatants[index].id,other.id,delta>0);
}
export function renderCards() {
  const roster=$('roster');roster.replaceChildren();
  state.combatants.forEach((actor,index)=>roster.append(card(actor,index)));
  if(!state.combatants.length){const empty=document.createElement('p');empty.className='empty-card';empty.textContent='Add a hero or monster to start your initiative deck.';roster.append(empty);}
  const actor=activeActor();
  $('editing').textContent=actor?`Click an effect to add to ${actor.name}, or drag it onto another card.`:'Choose a card or drag an effect onto it.';
}
export function initCards() {
  $('addActor').addEventListener('submit',event=>{
    event.preventDefault(); const name=$('actorInput').value.trim();
    if(!name || name.length>36 || state.combatants.length>=60)return notify('Enter a name (max 36 characters, 60 cards)');
    const actor={id:crypto.randomUUID(),name,kind:$('actorKind').value,buffs:[],debuffs:[]};
    state.combatants.push(actor);if(!state.activeId)state.activeId=actor.id;
    $('actorInput').value='';save();
  });
  $('nextBtn').addEventListener('click',()=>advance(1));
  $('prevBtn').addEventListener('click',()=>advance(-1));
}
