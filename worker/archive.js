function registry() {
  const tasks=catalog();
  for(const p of WATCHLIST.people){
    const keyword=p.query||({doinb:'(Doinb OR 도인비)',hanyi:'(涵艺 OR 한이)'})[p.id]||'"'+p.name+'"';
    const lang=p.lang||(['hanyi','doinb','hongcha','park'].includes(p.id)?'zh':'ko');
    tasks.push({id:'person-'+p.id,name:p.name+' · 이름 언급 색인',minute:10,run:async()=>{
      const url=googleQuery(keyword+' '+LCK.query,lang);
      const feed=newsDocs(await (await retrieve(url)).text(),p.name+' 언급',true,p.id);
      return feed;
    }});
  }
  return tasks;
}
function recent(items,key,max){
  const byKey=new Map();for(const item of items){const id=key(item);if(!byKey.has(id)||Date.parse(byKey.get(id).at)<=Date.parse(item.at))byKey.set(id,item)}
  return [...byKey.values()].sort((a,b)=>Date.parse(b.at)-Date.parse(a.at)).slice(0,max);
}
function appendArchive(prior,delta) {
  // Keep season announcements and claims even after the source page rolls over.
  const events=[...(prior.events||[]),...(delta.events||[])];
  const official=LEDGER.merge(events.filter(LEDGER.official));
  const news=recent(events.filter(e=>!LEDGER.official(e)),e=>e.url,2000);
  return {events:[...official,...news],claims:mergeObserved(prior.claims||[],delta.claims||[],c=>RUMORS.evidenceKey(c),12000),
    reviews:mergeObserved(prior.reviews||[],delta.reviews||[],r=>r.url,1800)};
}
function mergeObserved(older,newer,key,max){
  const times=new Map(older.map(v=>[key(v),v.at]));
  return recent([...older,...newer.map(v=>{
    const previous=times.get(key(v));
    return previous && (v.observed||v.reason?.includes('최초 감지'))?{...v,at:previous}:v;
  })],key,max);
}
const archiveKey='stove-2027-v2';
let running=null;
function sweep(env,options={}){
  if(!env?.ARCHIVE)throw Error('수집 기록 저장소가 필요합니다.');
  if(running)return running;
  running=(async()=>{
    const saved=JSON.parse((await env.ARCHIVE.get(archiveKey))||'{}'), sources=saved.progress||{};
    const jobs=options.jobs||registry(), now=options.now||Date.now(), at=new Date(now).toISOString();
    let archive=LCK.batch(saved);
    const activeIds=new Set(jobs.map(j=>j.id));for(const id of Object.keys(sources))if(!activeIds.has(id))delete sources[id];
    const due=[];
    for(const job of jobs){
      const s=sources[job.id]||{};
      const descriptor={id:job.id,name:job.name,members:job.members||[],minute:job.minute};
      if(job.requires?.some(k=>!env[k])){
        sources[job.id]={...s,...descriptor,status:'auth',ok:false,nextAt:0};continue;
      }
      if(!sources[job.id])sources[job.id]={...descriptor,status:'waiting',ok:false,nextAt:0};
      if(s.nextAt>now)continue;
      due.push({job,s,descriptor});
    }
    due.sort((a,b)=>(a.s.nextAt||0)-(b.s.nextAt||0));
    const queue=due.slice(0,options.limit||due.length), changes=[];
    async function run(){
      for(let entry;(entry=queue.shift());){
        const {job,s,descriptor}=entry;
        try {
          const raw=await job.run(env,s.checkpoint||{});
          const delta={...raw,...LCK.batch(raw,archive.events)};
          changes.push(raw);
          const next=delta.checkpoint?.next||delta.checkpoint?.after||delta.checkpoint?.backlog?1:job.minute;
          sources[job.id]={...descriptor,status:delta.partial?'partial':'ok',ok:!delta.partial,lastTry:at,lastOk:delta.partial?s.lastOk:at,lastCount:['events','claims','reviews'].reduce((n,k)=>n+(delta[k]?.length||0),0),nextAt:now+next*60000,checkpoint:delta.checkpoint||s.checkpoint||{},failures:0};
        } catch(err){
          const failures=(s.failures||0)+1, status=err.status===429?'limited':([401,403].includes(err.status)?'denied':'error');
          const retry=Math.max((err.after||0)*1000,Math.min(60,2**Math.min(failures,6))*60000);
          sources[job.id]={...s,...descriptor,status,ok:false,lastTry:at,failures,nextAt:now+retry};
        }
      }
    }
    await Promise.all(Array.from({length:Math.min(6,queue.length)},run));
    if(changes.length)archive=appendArchive(archive,LCK.batch(combine(changes),archive.events));
    const snapshot={...archive,progress:sources,checkedAt:at};
    await env.ARCHIVE.put(archiveKey,JSON.stringify(snapshot));
    return snapshot;
  })().finally(()=>{running=null});
  return running;
}
function publicFeed(snapshot={}){
  const scoped=LCK.batch(snapshot);
  const sources=Object.values(snapshot.progress||{}).map(({checkpoint,failures,...s})=>s);
  const ok=sources.some(s=>s.ok);
  return {events:scoped.events,sources,koreanTranslations:snapshot.koreanTranslations || {},checkedAt:snapshot.checkedAt||null,reviews:scoped.reviews.slice(0,300),
    rumorSources:[{id:'archive',ok:!!snapshot.checkedAt,claims:scoped.claims}],collector:!snapshot.checkedAt?'waiting':ok?'running':'unavailable'};
}
export default {
  async fetch(request,env={}){
    const url=new URL(request.url);
    if(!['GET','HEAD'].includes(request.method))return new Response('Method not allowed',{status:405,headers:{Allow:'GET, HEAD'}});
    if(url.pathname==='/api/feed'){
      const cached=env.ARCHIVE?await env.ARCHIVE.get(archiveKey):null;
      const body={...publicFeed(cached?JSON.parse(cached):{}),mode:env.ARCHIVE?'local':'snapshot'};
      return Response.json(body,{headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
    }
    const asset=ASSETS[url.pathname==='/'?'/index.html':url.pathname];if(!Array.isArray(asset))return new Response('Not found',{status:404});
    return new Response(request.method==='HEAD'?null:asset[1],{headers:{'Content-Type':asset[0],'Cache-Control':'no-cache','X-Content-Type-Options':'nosniff','Referrer-Policy':'strict-origin-when-cross-origin'}});
  }
};
export {sweep};
