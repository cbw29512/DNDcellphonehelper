import {activeActor, toggleEffect, notify} from './app-state.js';
const $ = id => document.getElementById(id);
const PRESETS = {
  buffs:['Bless','Haste','Shield of Faith','Inspiration','Invisible','Resistance','Guidance','Heroism'],
  debuffs:['Poisoned','Prone','Blinded','Frightened','Restrained','Stunned','Paralyzed','Grappled','Charmed','Unconscious'],
};
function palette(targetId, type) {
  const parent=$(targetId);
  PRESETS[type].forEach(name=>{
    const chip=document.createElement('button');chip.type='button';chip.textContent=name;
    chip.className='palette-chip '+type;chip.draggable=true;
    chip.title='Drag '+name+' onto a card or click to apply to the selected card';
    chip.addEventListener('dragstart',event=>{
      event.dataTransfer.setData('text/plain',JSON.stringify({kind:'effect',type,name}));
      event.dataTransfer.effectAllowed='copy';
    });
    chip.addEventListener('click',()=>{
      const actor=activeActor();if(!actor)return notify('Select a card first');
      toggleEffect(actor.id,type,name);
    });
    parent.append(chip);
  });
}
export function initEffects() {
  palette('buffPalette','buffs');palette('debuffPalette','debuffs');
  $('customEffect').addEventListener('submit',event=>{
    event.preventDefault();const actor=activeActor();if(!actor)return notify('Select a card first');
    const name=$('effectInput').value.trim();if(!name || name.length>32)return notify('Enter an effect name (up to 32 characters)');
    const type=$('effectType').value;toggleEffect(actor.id,type,name);
    $('effectInput').value='';
  });
}
