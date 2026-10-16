#!/usr/bin/env python3
# Generates Volt's audio with ElevenLabs into the game's assets. The key is read from a local file and never
# written anywhere else. Existing files are skipped, so it's safe to re-run.
import json, os, sys, urllib.request, time

HERE = os.path.dirname(os.path.abspath(__file__))
KEY = os.environ.get('ELEVENLABS_API_KEY') or open(os.path.join(HERE, '.key')).read().strip()  # never commit the key
GAME = '/Users/jamesrowe/Documents/Volt Roguelike'
OUT_SFX = os.path.join(GAME, 'assets/audio/sfx'); OUT_VO = os.path.join(GAME, 'assets/audio/voice'); OUT_MUS = os.path.join(GAME, 'assets/audio/music')
for d in (OUT_SFX, OUT_VO, OUT_MUS): os.makedirs(d, exist_ok=True)

def post(url, body, out):
    req = urllib.request.Request(url, data=json.dumps(body).encode(), headers={'xi-api-key': KEY, 'Content-Type': 'application/json'})
    for attempt in range(3):
        try:
            with urllib.request.urlopen(req, timeout=180) as r: data = r.read()
            open(out, 'wb').write(data); return len(data)
        except urllib.error.HTTPError as e:
            msg = e.read()[:300]
            if e.code == 429: time.sleep(5); continue
            print('  FAIL', e.code, msg); return 0
        except Exception as e:
            print('  ERR', e); time.sleep(2)
    return 0

def fnv(s):  # FNV-1a 32-bit, same as the game's voiceKey()
    h = 0x811c9dc5
    for b in s.encode('utf-8'):
        h ^= b; h = (h * 0x01000193) & 0xffffffff
    return format(h, '08x')

# ---------- Casting ----------
VOICES = {
  'volt':      ('SAz9YHcvj6GT2YYXdXww', 0.35, 0.55),  # River: neutral; lower stability = livelier
  'halo':      ('pFZP5JQG7iQjIQuC4Bku', 0.6, 0.25),   # Lily
  'bastion':   ('pNInz6obpgDQGcFmaJgB', 0.55, 0.35),  # Adam
  'echo':      ('FGY2WhTYpPnrIDTdsKH5', 0.35, 0.55),  # Laura
  'thorn':     ('nPczCjzI2devNBz1zQrb', 0.6, 0.2),    # Brian
  'patch':     ('Xb7hH8MSUJpSbSDYk0k2', 0.7, 0.15),   # Alice: deadpan
  'kilnheart': ('EXAVITQu4vr4xnSDxMaL', 0.4, 0.5),    # Sarah
  'bellwether':('XrExE9yKIg1WjnnlVkGX', 0.3, 0.7),    # Matilda: big performance
  'verdigris': ('N2lVS1w4EtoT3dr4eOWO', 0.5, 0.45),   # Callum
  'glasswake': ('cgSgspJ2msm6clMCkdW9', 0.3, 0.65),   # Jessica
  'undertow':  ('SOYHLrjzK2X1ezoPC6cr', 0.5, 0.4),    # Harry
  'gravemark': ('pqHfZKP75CvOlQylNhV4', 0.75, 0.2),   # Bill: slowed and lowered in game
  'redactor':  ('onwK4e9ZLuTAKqWW03F9', 0.7, 0.3),    # Daniel: polite broadcaster
}

# Designed voices (design.py) replace the premade stand-ins for the characters they were made for.
if os.path.exists(os.path.join(HERE, 'designed.json')):
    for who, d in json.load(open(os.path.join(HERE, 'designed.json'))).items():
        if 'voice_id' not in d or who.endswith('2'): continue  # takes still waiting for a pick
        stab, style = {'volt':(0.35,0.5),'echo':(0.4,0.5),'bastion':(0.55,0.35),'kilnheart':(0.45,0.5),'bellwether':(0.3,0.7),'verdigris':(0.55,0.4),'undertow':(0.5,0.4),'gravemark':(0.75,0.25)}.get(who,(0.5,0.4))
        VOICES[who] = (d['voice_id'], stab, style)

def voice_lines(lines):
    done = 0
    for ln in lines:
        who, text = ln['who'], ln['text']
        if who not in VOICES: continue
        fn = os.path.join(OUT_VO, f"{who}_{fnv(who + '|' + text)}.mp3")
        if os.path.exists(fn): continue
        vid, stab, style = VOICES[who]
        n = post(f'https://api.elevenlabs.io/v1/text-to-speech/{vid}?output_format=mp3_44100_64',
                 {'text': text, 'model_id': 'eleven_multilingual_v2', 'voice_settings': {'stability': stab, 'similarity_boost': 0.75, 'style': style, 'use_speaker_boost': True}}, fn)
        done += 1; print('voice', who, n, text[:50])
    return done

SFX = json.load(open(os.path.join(HERE, 'sfx.json')))
def sfx():
    for name, (prompt, dur) in SFX.items():
        fn = os.path.join(OUT_SFX, name + '.mp3')
        if os.path.exists(fn): continue
        body = {'text': prompt, 'prompt_influence': 0.55}
        if dur: body['duration_seconds'] = dur
        n = post('https://api.elevenlabs.io/v1/sound-generation?output_format=mp3_44100_96', body, fn)
        print('sfx', name, n)

if __name__ == '__main__':
    what = sys.argv[1:] or ['sfx', 'voice']
    if 'sfx' in what: sfx()
    if 'voice' in what:
        lines = json.loads(open(os.path.join(HERE, 'lines.json')).read().splitlines()[0])['out']
        lines += json.load(open(os.path.join(HERE, 'barks.json')))
        print('voiced', voice_lines(lines))
