import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root=path.join(path.dirname(fileURLToPath(import.meta.url)),'..');
const out=path.join(root,'dist');
const files={'index.html':'text/html; charset=utf-8','data.js':'text/javascript; charset=utf-8','rumors.js':'text/javascript; charset=utf-8','app.js':'text/javascript; charset=utf-8','campfire.js':'text/javascript; charset=utf-8','style.css':'text/css; charset=utf-8','flame.svg':'image/svg+xml'};
for(const name of ['channels','contracts','watchlist','lck','tips','ledger']) files[name+'.js']='text/javascript; charset=utf-8';
const assets={};for(const [name,type] of Object.entries(files))assets['/'+name]=[type,await fs.readFile(path.join(root,'public',name),'utf8')];
const service=(await Promise.all(['service','collector','rumorfeed','sheep','community','archive'].map(name=>fs.readFile(path.join(root,'worker',name+'.js'),'utf8')))).join('\n');
await fs.mkdir(path.join(out,'server'),{recursive:true});
await fs.mkdir(path.join(out,'.openai'),{recursive:true});
try { await fs.copyFile(path.join(root,'.openai','hosting.json'),path.join(out,'.openai','hosting.json')); } catch(error) { if(error.code!=='ENOENT')throw error }
await fs.writeFile(path.join(out,'server/index.js'),['data','channels','contracts','watchlist','lck','tips','rumors','ledger'].map(name=>assets['/'+name+'.js'][1]).join('\n')+'\nconst ASSETS='+JSON.stringify(assets)+';\n'+service);
console.log('Built standalone Worker, '+Object.keys(assets).length+' embedded assets.');
