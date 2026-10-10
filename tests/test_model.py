import sys
import tempfile
import unittest
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from model import blank_state, clean_state, load_state, save_state

class StateTests(unittest.TestCase):
    def test_default(self):
        self.assertEqual(blank_state()['round'], 1)
        self.assertEqual(blank_state()['combatants'], [])

    def test_round_trip(self):
        with tempfile.TemporaryDirectory() as td:
            f = Path(td)/'session.json'
            s=blank_state();s['combatants']=[{'id':'a','name':'Thorin','buffs':['Bless'],'debuffs':['Poisoned']}];s['activeId']='a'
            s['lastRoll']={'formula':'1d20+5','detail':'18 + 5','total':23}
            save_state(s,f)
            loaded = load_state(f)
            self.assertEqual(loaded['combatants'][0]['kind'], 'player')
            self.assertEqual(loaded['lastRoll'], s['lastRoll'])
            self.assertEqual(loaded['activeId'], s['activeId'])

    def test_invalid_actor_rejected(self):
        s=blank_state();s['combatants']=[{'id':'x','name':'','buffs':[],'debuffs':[]}]
        with self.assertRaises(ValueError):clean_state(s)

    def test_unknown_active_rejected(self):
        s=blank_state();s['activeId']='not-here'
        with self.assertRaises(ValueError):clean_state(s)

    def test_bad_effects_rejected(self):
        s=blank_state();s['combatants']=[{'id':'x','name':'A','buffs':[''] ,'debuffs':[]}]
        with self.assertRaises(ValueError):clean_state(s)

    def test_roll_validation(self):
        s=blank_state();s['lastRoll']={'formula':'x','detail':'y','total':True}
        with self.assertRaises(ValueError):clean_state(s)

    def test_monster_round_trip(self):
        s=blank_state();s['combatants']=[{'id':'m','name':'Dragon','kind':'monster','buffs':['Haste'],'debuffs':[]}]
        with tempfile.TemporaryDirectory() as td:
            f=Path(td)/'session.json';save_state(s,f)
            self.assertEqual(load_state(f)['combatants'][0]['kind'],'monster')

    def test_unknown_kind_rejected(self):
        s=blank_state();s['combatants']=[{'id':'m','name':'Dragon','kind':'robot','buffs':[],'debuffs':[]}]
        with self.assertRaises(ValueError):clean_state(s)

    def test_missing_returns_default(self):
        with tempfile.TemporaryDirectory() as td:
            self.assertEqual(load_state(Path(td)/'missing.json'),blank_state())

if __name__=='__main__':unittest.main()
