import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import '../public/korean.js';

const worker = fileURLToPath(new URL('./translate.py', import.meta.url));
const korean = globalThis.StoveKorean;

export async function translateFeed(feed, previous = {}) {
  const titles = korean.collect(feed);
  const cache = Object.create(null), missing = [];
  for (const raw of titles) {
    const saved = korean.lookup(raw, previous);
    if (saved) cache[raw]=saved;
    else missing.push(raw);
  }
  if (!missing.length) return cache;
  const batch = missing.slice(0, 120), allowed = new Set(batch);
  await new Promise(resolve => {
    const child=spawn(process.env.STOVE_PYTHON || (process.platform==='win32'?'python':'python3'),
      [worker], {stdio:['pipe','pipe','inherit'],windowsHide:true,env:{...process.env,PYTHONIOENCODING:'utf-8'}});
    const timer=setTimeout(()=>child.kill(), 240000);
    let buffer='';
    child.stdout.setEncoding('utf8');
    child.stdout.on('data', chunk => {
      buffer+=chunk;
      const lines=buffer.split('\n');buffer=lines.pop();
      for (const line of lines) {
        try {
          const [raw,translated]=JSON.parse(line);
          if (allowed.has(raw) && typeof translated==='string' && /[가-힣]/u.test(translated)) cache[raw]=translated;
        } catch { /* Keep completed translations if the worker stops mid-batch. */ }
      }
    });
    child.stdin.on('error',()=>{});
    child.stdin.end(JSON.stringify(batch));
    child.once('error',err=>{ clearTimeout(timer); console.warn('Korean translation deferred:',err.message);resolve() });
    child.once('close',code=>{ clearTimeout(timer); if(code) console.warn('Korean translation will retry on the next collection.');resolve() });
  });
  console.log('Korean translations: '+Object.keys(cache).length+'/'+titles.length+' automatic, plus the edited glossary.');
  return cache;
}

