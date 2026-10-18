"""Fill and verify the exhaustive dialogue inventory. API key stays in the environment."""
import json,hashlib,concurrent.futures,threading,re
from pathlib import Path
import gen,qa
root=Path(gen.GAME);here=Path(gen.HERE)
lines=json.loads((here/'lines.json').read_text(encoding='utf-8'))['out']
lines=list({(x['who'],x['text']):x for x in lines if not gen.SILENT(x['text'])}.values())
assert all(x['who'] in gen.VOICES for x in lines),'Unknown speaker in inventory'
manifest_path=here/'cast-v4-manifest.json'
manifest=json.loads(manifest_path.read_text(encoding='utf-8')) if manifest_path.exists() else {}
lock=threading.Lock();done=0
def key(x):return x['who']+'_'+gen.fnv(x['who']+'|'+x['text'])
def path(x):return root/'assets/audio/voice'/f'{key(x)}.mp3'
def verified(x):
 p=path(x);m=manifest.get(key(x),{})
 return p.exists() and m.get('model')=='eleven_v4' and m.get('sha256')==hashlib.sha256(p.read_bytes()).hexdigest()
pending=[x for x in lines if not verified(x)]
print(json.dumps({'required':len(lines),'verified_existing':len(lines)-len(pending),'to_record':len(pending)}),flush=True)
def record(x):
 global done
 assert gen.voice_lines([x],force=True,quiet=True)==1,'Recording failed: '+key(x)
 with lock:
  manifest[key(x)]={'who':x['who'],'text':x['text'],'model':'eleven_v4','voice_id':gen.VOICES[x['who']][0],'sha256':hashlib.sha256(path(x).read_bytes()).hexdigest()}
  manifest_path.write_text(json.dumps(manifest,indent=1,ensure_ascii=False)+'\n',encoding='utf-8')
  done+=1
  if done%25==0:print(f'Recorded {done}/{len(pending)} missing lines',flush=True)
 return x
with concurrent.futures.ThreadPoolExecutor(3) as pool:list(pool.map(record,pending))
assert all(verified(x) for x in lines)
active={key(x):manifest[key(x)] for x in lines}
manifest_path.write_text(json.dumps(active,indent=1,ensure_ascii=False)+'\n',encoding='utf-8')
p=root/'js/audio-manifest.js';s=p.read_text();a=s.index('const VOICED = ');b=s.index('\nconst SFX_NAMES',a)
s=s[:a]+'const VOICED = new Set('+json.dumps(sorted(active))+');'+s[b:]
s=re.sub(r"const VOICE_REVISION = '[^']+'", "const VOICE_REVISION = '2026-10-18-motion-progression-v4'",s)
p.write_text(s,encoding='utf-8',newline='\n')
print('Every active spoken line now has a verified Eleven v4 recording. Checking transcripts.',flush=True)
qa_path=here/'cast-v4-qa.json';previous=json.loads(qa_path.read_text(encoding='utf-8')) if qa_path.exists() else []
qa_map={(x['who'],x['text']):x for x in previous if x}
checks=0
def check(x):
 global checks
 result=qa.check(x)
 with lock:
  qa_map[(x['who'],x['text'])]=result
  checks+=1
  if checks%50==0:print(f'Transcribed {checks}/{len(pending)} new recordings',flush=True)
 return result
with concurrent.futures.ThreadPoolExecutor(3) as pool:list(pool.map(check,pending))
report=[qa_map.get((x['who'],x['text'])) for x in lines]
qa_path.write_text(json.dumps(report,indent=1,ensure_ascii=False)+'\n',encoding='utf-8')
print(json.dumps({'required':len(active),'recorded':len(pending),'qa_missing':sum(x is None for x in report),'review':sum(bool(x and (x.get('error') or x.get('sim',1)<.85)) for x in report)}),flush=True)
