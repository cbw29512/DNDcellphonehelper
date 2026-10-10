"""Validate and persist the local DM session state."""
import json
import os
from pathlib import Path

MAX_ACTORS = 60
MAX_EFFECTS = 12

def blank_state():
    return {"version": 1, "round": 1, "activeId": None, "combatants": [], "lastRoll": None}


def clean_state(data):
    if not isinstance(data, dict) or data.get("version") != 1:
        raise ValueError("Unsupported state schema")
    actors = data.get("combatants")
    if not isinstance(actors, list) or len(actors) > MAX_ACTORS:
        raise ValueError("Invalid combatant list")
    cleaned, seen = [], set()
    for actor in actors:
        if not isinstance(actor, dict):
            raise ValueError("Invalid combatant")
        ident, name = actor.get("id"), actor.get("name")
        if not isinstance(ident, str) or not 1 <= len(ident) <= 60 or ident in seen:
            raise ValueError("Invalid combatant ID")
        if not isinstance(name, str) or not 1 <= len(name.strip()) <= 36:
            raise ValueError("Invalid combatant name")
        seen.add(ident)
        kind = actor.get("kind", "player")
        if kind not in ("player", "monster"):
            raise ValueError("Invalid combatant type")
        clean_actor = {"id": ident, "name": name.strip(), "kind": kind}
        for key in ("buffs", "debuffs"):
            items = actor.get(key)
            if not isinstance(items, list) or len(items) > MAX_EFFECTS:
                raise ValueError("Invalid effects")
            if not all(isinstance(v, str) and 1 <= len(v.strip()) <= 32 for v in items):
                raise ValueError("Invalid effect name")
            clean_actor[key] = list(dict.fromkeys(v.strip() for v in items))
        cleaned.append(clean_actor)
    active = data.get("activeId")
    if active is not None and active not in seen:
        raise ValueError("Unknown active combatant")
    round_num = data.get("round")
    if type(round_num) is not int or not 1 <= round_num <= 9999:
        raise ValueError("Invalid round")
    roll = data.get("lastRoll")
    if roll is not None:
        if not isinstance(roll, dict) or type(roll.get("total")) is not int:
            raise ValueError("Invalid roll")
        if abs(roll["total"]) > 100_000_000:
            raise ValueError("Roll exceeds limit")
        if not all(isinstance(roll.get(k), str) and len(roll[k]) <= 180 for k in ("formula", "detail")):
            raise ValueError("Invalid roll description")
        roll = {"formula": roll["formula"], "detail": roll["detail"], "total": roll["total"]}
    return {"version": 1, "round": round_num, "activeId": active,
            "combatants": cleaned, "lastRoll": roll}


def data_file():
    base = Path(os.environ.get("LOCALAPPDATA") or Path.home()) / "DNDcellphonehelper"
    base.mkdir(parents=True, exist_ok=True)
    return base / "session.json"


def load_state(path=None):
    path = Path(path) if path else data_file()
    try:
        return clean_state(json.loads(path.read_text(encoding="utf-8")))
    except FileNotFoundError:
        return blank_state()
    except (OSError, ValueError, json.JSONDecodeError) as exc:
        print(f"Warning: stored state unreadable ({exc}); starting a new session")
        return blank_state()


def save_state(state, path=None):
    path = Path(path) if path else data_file()
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(".tmp")
    tmp.write_text(json.dumps(clean_state(state), indent=2), encoding="utf-8")
    tmp.replace(path)
