import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import worker,{sweep} from '../dist/server/index.js';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
try{process.loadEnvFile(path.join(root,'.env'))}catch(error){if(error.code!=='ENOENT')throw error}
const directory=path.resolve(process.env.STOVE_DATA_DIR||path.join(root,'storage'));
await fs.mkdir(directory,{recursive:true});
const filename=path.join(directory,'season-2027.json');
let current;
try{current=await fs.readFile(filename,'utf8');JSON.parse(current)}catch(e){if(e.code!=='ENOENT')throw e}
const env={ARCHIVE:{
  get:async()=>current||null,
  put:async(key,value)=>{const next=filename+'.tmp-'+process.pid;await fs.writeFile(next,value,{encoding:'utf8',mode:0o600});await fs.rename(next,filename);current=value}
}};
const server=http.createServer(async(req,res)=>{
  try{
    const result=await worker.fetch(new Request(new URL(req.url,'http://localhost'),{method:req.method}),env);
    res.writeHead(result.status,Object.fromEntries(result.headers));res.end(Buffer.from(await result.arrayBuffer()));
  }catch{res.writeHead(500);res.end('Service unavailable')}
});
function tick(){sweep(env).then(s=>{const n=Object.values(s.progress);console.log(s.checkedAt+'  '+n.filter(v=>v.ok).length+'/'+n.length+' sources responding')}).catch(e=>console.error('Collector:',e.message))}
server.listen(Number(process.env.PORT||4197),process.env.HOST||'127.0.0.1',()=>{
  console.log('STOVEWATCH  http://localhost:'+server.address().port);tick();setInterval(tick,60000);
});
