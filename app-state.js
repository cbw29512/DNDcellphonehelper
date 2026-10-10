/** Single source of truth. Save snapshots in order, so rapid turns don't race. */
export let state;
let pendingSave = Promise.resolve();
let onStateChange = () => {};
export function setRenderer(fn) { onStateChange = fn; }
export const activeActor = () => state?.combatants.find(a => a.id === state.activeId);
const message = text => { document.getElementById('message').textContent = text; };
export function notify(text) { message(text); }
export async function initialize() {
  const response = await fetch('/api/state', {cache:'no-store'});
  if (!response.ok) throw Error('Cannot load session');
  state = await response.json();
  onStateChange();
  message('Ready · Changes are saved locally');
  return state;
}
export function save() {
  if (!state) return;
  const snapshot = JSON.parse(JSON.stringify(state));
  onStateChange();
  document.getElementById('syncStatus').textContent = 'SYNCING';
  pendingSave = pendingSave.catch(() => {}).then(async () => {
    try {
      const response = await fetch('/api/state', {
        method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(snapshot),
      });
      const result = await response.json();
      if (!response.ok) throw Error(result.error || 'Cannot save');
      state.revision = result.revision;
      document.getElementById('syncStatus').textContent = 'LIVE';
      message('Saved · Player display updated');
    } catch (error) {
      document.getElementById('syncStatus').textContent = 'OFFLINE';
      message('Not synced: ' + error.message);
    }
  });
}
export function moveActor(id, targetId, after = false) {
  if (id === targetId || !id || !targetId) return;
  const actors = state.combatants;
  const source = actors.findIndex(a => a.id === id);
  if (source < 0) return;
  const [actor] = actors.splice(source, 1);
  const target = actors.findIndex(a => a.id === targetId);
  if (target < 0) { actors.splice(source, 0, actor); return; }
  actors.splice(target + (after ? 1 : 0), 0, actor);
  save();
}
export function toggleEffect(id, type, name, removeOnly = false) {
  if (!['buffs','debuffs'].includes(type) || typeof name !== 'string' || !name.trim() || name.length > 32) return;
  const actor = state.combatants.find(a => a.id === id);
  if (!actor) return notify('Select or drop onto a card first');
  const list = actor[type];
  const i = list.indexOf(name);
  if (i >= 0) list.splice(i, 1);
  else if (!removeOnly && list.length < 12) list.push(name);
  else return notify('Maximum 12 effects per group');
  save();
}
export function advance(delta) {
  const actors = state.combatants;
  if (!actors.length) return notify('Add a combatant first');
  const i = actors.findIndex(a => a.id === state.activeId);
  const next = delta > 0 ? (i + 1) % actors.length : (i - 1 + actors.length) % actors.length;
  if (delta > 0 && i === actors.length - 1) state.round++;
  if (delta < 0 && i === 0 && state.round > 1) state.round--;
  state.activeId = actors[next].id;
  save();
}
