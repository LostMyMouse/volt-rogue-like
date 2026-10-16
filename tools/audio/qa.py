#!/usr/bin/env python3
# Checks voiced lines without listening: transcribes each with ElevenLabs speech-to-text, compares the
# transcript with the script (catches mispronounced, dropped or garbled words) and measures pacing from
# the word timings (words per second, longest pause). Writes qa-report.json and prints the flagged lines.
import json, os, re, difflib, urllib.request, uuid, concurrent.futures as cf
HERE = os.path.dirname(os.path.abspath(__file__))
KEY = os.environ.get('ELEVENLABS_API_KEY') or open(os.path.join(HERE, '.key')).read().strip()
VO = os.path.join(HERE, '..', '..', 'assets', 'audio', 'voice')
import importlib.util; spec = importlib.util.spec_from_file_location('gen', os.path.join(HERE, 'gen.py'))

def fnv(s):
    h = 0x811c9dc5
    for b in s.encode('utf-8'): h ^= b; h = (h * 0x01000193) & 0xffffffff
    return format(h, '08x')
def words(t): return re.findall(r"[a-z0-9']+", t.lower().replace('—', ' ').replace('-', ' '))

def stt(path):
    bnd = uuid.uuid4().hex; data = open(path, 'rb').read()
    body = (f'--{bnd}\r\nContent-Disposition: form-data; name="model_id"\r\n\r\nscribe_v1\r\n--{bnd}\r\nContent-Disposition: form-data; name="file"; filename="a.mp3"\r\nContent-Type: audio/mpeg\r\n\r\n').encode() + data + f'\r\n--{bnd}--\r\n'.encode()
    req = urllib.request.Request('https://api.elevenlabs.io/v1/speech-to-text', data=body, headers={'xi-api-key': KEY, 'Content-Type': f'multipart/form-data; boundary={bnd}'})
    with urllib.request.urlopen(req, timeout=120) as r: return json.loads(r.read())

def check(ln):
    who, text = ln['who'], ln['text']; fn = os.path.join(VO, f"{who}_{fnv(who + '|' + text)}.mp3")
    if not os.path.exists(fn): return None
    try: r = stt(fn)
    except Exception as e: return {'who': who, 'text': text, 'error': str(e)[:120]}
    heard = r.get('text', ''); ws = [w for w in r.get('words', []) if w.get('type') == 'word']
    a, b = words(text), words(heard); sim = difflib.SequenceMatcher(None, a, b).ratio()
    missing = [x for x in a if x not in b]
    dur = (ws[-1]['end'] - ws[0]['start']) if len(ws) > 1 else 0
    wps = len(ws) / dur if dur > 0 else 0
    gaps = [ws[i+1]['start'] - ws[i]['end'] for i in range(len(ws) - 1)]
    flags = []
    if sim < 0.85: flags.append('wording/pronunciation')
    if len(a) >= 5 and wps > 3.4: flags.append('too fast')
    if gaps and max(gaps) > 1.6: flags.append('long pause')
    return {'who': who, 'text': text, 'heard': heard, 'sim': round(sim, 2), 'wps': round(wps, 2), 'max_gap': round(max(gaps), 2) if gaps else 0, 'missing': missing, 'flags': flags}

if __name__ == '__main__':
    lines = json.loads(open(os.path.join(HERE, 'lines.json')).read().splitlines()[0])['out'] + json.load(open(os.path.join(HERE, 'barks.json')))
    with cf.ThreadPoolExecutor(4) as ex: res = [r for r in ex.map(check, lines) if r]
    json.dump(res, open(os.path.join(HERE, 'qa-report.json'), 'w'), indent=1)
    flagged = [r for r in res if r.get('flags') or r.get('error')]
    print(f'checked {len(res)}  flagged {len(flagged)}  avg words/sec {sum(r.get("wps",0) for r in res)/max(1,len(res)):.2f}')
    for r in flagged: print(f"- {r['who']}: {r.get('flags') or r.get('error')} | script: {r['text']} | heard: {r.get('heard','')} | missing {r.get('missing')}")
