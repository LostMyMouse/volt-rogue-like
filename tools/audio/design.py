#!/usr/bin/env python3
# Designs custom ElevenLabs voices for Volt's cast from character descriptions. Saves the three previews per
# character for the audition page, creates a voice from the chosen take (default: first), and records the
# voice ids in designed.json for gen.py.
import json, os, base64, sys, urllib.request
HERE = os.path.dirname(os.path.abspath(__file__)); KEY = os.environ.get('ELEVENLABS_API_KEY') or open(os.path.join(HERE, '.key')).read().strip()  # never commit the key
GAME = '/Users/jamesrowe/Documents/Volt Roguelike'; AUD = os.path.join(GAME, 'voice-audition'); os.makedirs(AUD, exist_ok=True)

def api(path, body):
    req = urllib.request.Request('https://api.elevenlabs.io' + path, data=json.dumps(body).encode(), headers={'xi-api-key': KEY, 'Content-Type': 'application/json'})
    try:
        with urllib.request.urlopen(req, timeout=180) as r: return json.loads(r.read())
    except urllib.error.HTTPError as e: return {'error': e.code, 'detail': e.read()[:400].decode('utf-8', 'replace')}

CAST = {
 'volt': ("A young adult superhero rookie with an androgynous, gender-neutral voice, neither clearly male nor female. Bright, eager, quick-talking and a little nervous, with comic timing. Warm, earnest, slightly breathless. American.",
          "Hi! Sorry. Your front door has, like, nine locks. I'm Volt. I'm a hero. Rookie hero. I saw the broadcast, and I want to help. What table?"),
 'echo': ("A smug, sharp-tongued young adult psychic with an androgynous, gender-neutral voice. Dry, quick, teasing and sarcastic, always sounding like they already know the answer. Cool and confident. American.",
          "Before you ask: no. You were going to ask if I'm reading your mind. Can we skip to the part where I'm right? We need more people."),
 'bastion': ("A gruff, battle-worn military commander in his late fifties. Deep, gravelly, clipped and stern, a drill sergeant who secretly cares. Weary authority. American.",
          "Four districts dark. Half my roster drained. Somebody give me good news. Training roof. Now. And don't touch my table."),
 'kilnheart': ("A gruff, tired, working-class woman in her forties who worked twenty years in a steel foundry. Smoky, gravelly, blunt and sarcastic, with a menacing laugh. American.",
          "Whoa, whoa. Hold up. You're the new kid? They sent the new kid? Kid, I've been running furnaces since before you had teeth."),
 'bellwether': ("A flamboyant diva pop star woman in her thirties. Theatrical, rich, sultry and melodramatic, treats every sentence like a stage performance. Playful menace.",
          "Oh, finally. An audience. Everyone says that before the first song. Nobody says it after the encore. Darling, it's a residency."),
 'verdigris': ("A creepy, unnervingly calm and polite gardener villain with an androgynous voice. Soft, slow, whispery and soothing, but quietly sinister, like a patient plant that eats people.",
          "Mind the vines. They bite. Well. They don't bite. They just never let go. Everything on this roof is slowly becoming mine."),
 'undertow': ("A bitter, weathered dockworker man in his forties. Rough, low, tired and resentful, with a cold deadpan edge. Speaks like the sea wore him down.",
          "Picked a bad night to go swimming, rookie. Nobody chooses the docks. The docks choose you. Out here, sorry doesn't float."),
 'gravemark': ("An ancient stone golem. An extremely deep, slow, rumbling, resonant voice, like grinding rock in a cavern. Calm, ominous and literal, speaking in short heavy sentences.",
          "Another one. Another small, loud hero on my roof. I have carved forty-one names. Yours will be forty-two. The stone does not say hi."),
}
pick = json.load(open(os.path.join(HERE, 'picks.json'))) if os.path.exists(os.path.join(HERE, 'picks.json')) else {}
designed = json.load(open(os.path.join(HERE, 'designed.json'))) if os.path.exists(os.path.join(HERE, 'designed.json')) else {}
only = sys.argv[1:]
for who, (desc, text) in CAST.items():
    if only and who not in only: continue
    if who in designed and not only: continue
    r = api('/v1/text-to-voice/create-previews', {'voice_description': desc, 'text': text})
    if 'previews' not in r: print(who, 'preview fail', r); continue
    ids = []
    for i, p in enumerate(r['previews']):
        open(os.path.join(AUD, f'{who}_{i}.mp3'), 'wb').write(base64.b64decode(p['audio_base_64'])); ids.append(p['generated_voice_id'])
    k = pick.get(who, 0)
    v = api('/v1/text-to-voice/create-voice-from-preview', {'voice_name': f'Volt · {who.title()}', 'voice_description': desc, 'generated_voice_id': ids[k]})
    if 'voice_id' not in v: print(who, 'create fail', v); continue
    designed[who] = {'voice_id': v['voice_id'], 'take': k, 'previews': ids}
    json.dump(designed, open(os.path.join(HERE, 'designed.json'), 'w'), indent=1)
    print(who, 'ok', v['voice_id'], 'take', k)
