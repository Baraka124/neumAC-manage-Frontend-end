#!/usr/bin/env python3
"""neumDesk Agent Evaluation Harness.
Seeds the eval data, fires every question at the LIVE engine, grades
(1) intent routing and (2) answer-fragment presence. Prints a scored report.
This is the instrument: it turns "is the agent good?" into a number.
"""
import json, re, pathlib, sys
from playwright.sync_api import sync_playwright

EVAL = json.load(open('/home/claude/eval_set.json'))
seed = EVAL['seed']

# ── Keep date-based fixtures valid regardless of when the eval runs ──
# The seed uses fixed 2026-07 dates; rewrite them relative to "today" so
# "who is on call today?" and "who is absent?" always have live data.
import datetime as _dt
_today = _dt.date.today()
def _d(offset): return (_today + _dt.timedelta(days=offset)).isoformat()
# On-call: put one shift TODAY (Antelo=id1), others in the coming days.
if seed.get('onCallSchedule'):
    _offsets = [0, 2, 5, 7]
    for i, o in enumerate(seed['onCallSchedule']):
        o['duty_date'] = _d(_offsets[i % len(_offsets)])
# Absence: make Santalla's leave span today (started 2 days ago, ends in 5).
if seed.get('absences'):
    for a in seed['absences']:
        a['start_date'] = _d(-2); a['end_date'] = _d(5)

cases = EVAL['cases']

# Build a seeded, fetch-stubbed test page from the real app.
def build():
    js = open('/home/claude/app.js').read()
    seed_js = (
        "staffOps.medicalStaff.value=" + json.dumps(seed['medicalStaff']) + ";"
        "onCallOps.onCallSchedule.value=" + json.dumps(seed['onCallSchedule']) + ";"
        "absenceOps.absences.value=" + json.dumps(seed['absences']) + ";"
        "rotations.value=" + json.dumps(seed['rotations']) + ";"
        "trainingUnits.value=" + json.dumps(seed['trainingUnits']) + ";"
        "researchOps.clinicalTrials.value=" + json.dumps(seed['clinicalTrials']) + ";"
        "researchOps.researchLines.value=" + json.dumps(seed['researchLines']) + ";"
        "researchOps.innovationProjects.value=" + json.dumps(seed['innovationProjects']) + ";"
        "try{departments.value=" + json.dumps(seed['departments']) + "}catch(e){}"
    )
    seed_reassert = (
        "window.__reseed=function(){try{"
        "staffOps.medicalStaff.value=" + json.dumps(seed['medicalStaff']) + ";"
        "onCallOps.onCallSchedule.value=" + json.dumps(seed['onCallSchedule']) + ";"
        "absenceOps.absences.value=" + json.dumps(seed['absences']) + ";"
        "rotations.value=" + json.dumps(seed['rotations']) + ";"
        "trainingUnits.value=" + json.dumps(seed['trainingUnits']) + ";"
        "researchOps.clinicalTrials.value=" + json.dumps(seed['clinicalTrials']) + ";"
        "researchOps.researchLines.value=" + json.dumps(seed['researchLines']) + ";"
        "researchOps.innovationProjects.value=" + json.dumps(seed['innovationProjects']) + ";"
        "try{departments.value=" + json.dumps(seed['departments']) + "}catch(e){}"
        "}catch(e){}};"
    )
    patch = ("currentView.value = 'medical_staff'\n"
             "              setTimeout(function(){ try{ " + seed_js + seed_reassert +
             " window.__route=function(q){return askBarMatchScored(q);};"
             " window.__resolve=function(q){"
             "   try{ askBar.lastResolvedIntent=null; var savedTurns=askBar.turns.length;"
             "     askBar.query=q; askBarResolve();"
             "     var it=askBar.lastResolvedIntent||'unknown';"
             "     askBar.turns.splice(savedTurns);"
             "     askBar.loading=false; askBar.trace=[];"
             "     return it;"
             "   }catch(e){ return 'ERR:'+e.message; } };"
             " openAskBar(); askBar.view='conversation'; }catch(e){console.log('SEEDERR '+e.message)} }, 2500)\n"
             "              // Validate in background")
    js = js.replace("currentView.value = 'dashboard'\n              // Validate in background", patch)
    open('/home/claude/app_eval.js','w').write(js)
    html = open('/home/claude/index.html').read()
    css = open('/home/claude/style.css').read()
    fonts = open('/home/claude/localfonts.css').read()
    html = html.replace('https://unpkg.com/vue@3.4.21/dist/vue.global.prod.js','./vue.global.prod.js')
    for pat in ['cloudflare','googleapis','gstatic']:
        html = re.sub(r'<link[^>]*'+pat+r'[^>]*>','',html)
    html = re.sub(r'<link rel="stylesheet" href="style\.css[^"]*">','<style>'+fonts+'</style>\n<style>'+css+'</style>',html)
    perms = '['+','.join(['{"module":"%s","can_read":true,"can_write":true}'%m for m in
             ['medical_staff','oncall_schedule','staff_absence','resident_rotations','communications','research_hub','analytics','system_settings','training_units']])+']'
    user = '{id:1,full_name:"Eval Admin",admin_level:9,permissions:%s}'%perms
    seed_by_endpoint = {
        'on-call': seed['onCallSchedule'], 'oncall': seed['onCallSchedule'],
        'medical-staff': seed['medicalStaff'], 'medical_staff': seed['medicalStaff'],
        'absence': seed['absences'], 'rotation': seed['rotations'],
        'training-unit': seed['trainingUnits'], 'clinical-trial': seed['clinicalTrials'],
        'research-line': seed['researchLines'], 'innovation': seed['innovationProjects'],
        'department': seed['departments']
    }
    endpoint_map = json.dumps(seed_by_endpoint)
    stub = ('<script>(function(){localStorage.setItem("neumocare_token","t");var u=%s;'
            'localStorage.setItem("neumocare_user",JSON.stringify(u));localStorage.setItem("neumax_onboarded_v1","1");'
            'var SEEDMAP=%s;'
            'window.fetch=function(x){var url=String(x);var bd=[];'
            'try{if(url.includes("/api/auth/me")){bd=u;}else{for(var k in SEEDMAP){if(url.includes(k)){bd=SEEDMAP[k];break;}}}}catch(e){}'
            'return Promise.resolve({ok:true,status:200,headers:{get:function(k){return(k&&k.toLowerCase()==="content-type")?"application/json":null;}},'
            'json:function(){return Promise.resolve(bd);},text:function(){return Promise.resolve(JSON.stringify(bd));}});};})();</script>'%(user, endpoint_map))
    html = re.sub(r'<script src="app\.js[^"]*"></script>', stub+'<script src="app_eval.js"></script>', html)
    open('/home/claude/test_eval.html','w').write(html)

def run():
    build()
    url = pathlib.Path('/home/claude/test_eval.html').as_uri()
    results = []
    with sync_playwright() as p:
        b = p.chromium.launch(); pg = b.new_page(viewport={'width':1280,'height':940})
        pg.goto(url, wait_until='domcontentloaded', timeout=15000); pg.wait_for_timeout(4200)
        for c in cases:
            pg.evaluate('()=>window.__reseed && window.__reseed()')
            pg.evaluate('()=>{ try{ askBar.context=null; askBar.lastAsked=""; askBar.turns.splice(0); askBar.trace=[]; }catch(e){} }')
            pg.wait_for_timeout(60)
            # 1. Intent routing check via the REAL resolve path (owns staff_attr etc.)
            routed = pg.evaluate('(q)=>window.__resolve(q)', c['q'])
            intent_ok = (routed == c['intent'])
            # 2. Answer-fragment check (fire the real query)
            pg.evaluate('()=>window.__reseed && window.__reseed()')
            pg.evaluate('()=>{ try{ askBar.context=null; askBar.lastAsked=""; askBar.turns.splice(0); }catch(e){} }')
            pg.evaluate('''(t)=>{const i=document.querySelector('.askbar-input input');i.value=t;i.dispatchEvent(new Event('input'));i.dispatchEvent(new KeyboardEvent('keyup',{key:'Enter',bubbles:true}));}''', c['q'])
            pg.wait_for_timeout(2100)
            ans = pg.evaluate('()=>{const a=document.querySelectorAll(".askbar-a-tx");return a.length?a[a.length-1].textContent:""}')
            frags = c.get('must', [])
            missing = [f for f in frags if f.lower() not in ans.lower()]
            frag_ok = (len(missing) == 0)
            results.append({'q': c['q'], 'expected': c['intent'], 'routed': routed,
                            'intent_ok': intent_ok, 'frag_ok': frag_ok, 'missing': missing,
                            'ans': ans[:70]})
        b.close()
    return results

def report(results):
    n = len(results)
    intent_pass = sum(r['intent_ok'] for r in results)
    frag_pass = sum(r['frag_ok'] for r in results)
    both = sum(r['intent_ok'] and r['frag_ok'] for r in results)
    print("="*70)
    print("neumDesk AGENT EVALUATION")
    print("="*70)
    for r in results:
        flag = "PASS" if (r['intent_ok'] and r['frag_ok']) else "FAIL"
        print(f"[{flag}] {r['q'][:44]:44s}")
        if not r['intent_ok']:
            print(f"        intent: got '{r['routed']}' expected '{r['expected']}'")
        if not r['frag_ok']:
            print(f"        missing fragments: {r['missing']}  | ans: {r['ans']}")
    print("-"*70)
    print(f"Intent routing:    {intent_pass}/{n}  ({100*intent_pass//n}%)")
    print(f"Answer fragments:  {frag_pass}/{n}  ({100*frag_pass//n}%)")
    print(f"BOTH (full pass):  {both}/{n}  ({100*both//n}%)")
    print("="*70)
    return both, n

if __name__ == '__main__':
    r = run()
    both, n = report(r)
    sys.exit(0 if both == n else 1)
