const LEDGER = (() => {
  const official = e => ['in','renew','out','trade'].includes(e.kind);
  const season = 2027;
  const platform = url => {
    try {
      const host = new URL(url).hostname.replace(/^www\./,'');
      return ({'x.com':'x','twitter.com':'x','instagram.com':'ig','youtube.com':'youtube','youtu.be':'youtube'})[host] || 'media';
    } catch { return 'media' }
  };
  const safe = url => { try { return new URL(url).protocol === 'https:' } catch { return false } };
  const key = e => [e.team,e.player?.toLowerCase(),e.kind].join('|');
  const fingerprint = e => official(e) ? [key(e),new Date(Date.parse(e.at)+32400000).toISOString().slice(0,10)].join('|') : e.url;
  function links(items) {
    const result = new Map();
    for(const item of items) {
      if(!item || !safe(item.url))continue;
      const u=new URL(item.url);u.hash='';
      for(const k of [...u.searchParams.keys()])if(/^(utm_|s$|t$|igsh|si$)/i.test(k))u.searchParams.delete(k);
      const id=u.href.replace(/\/$/,'');
      if(!result.has(id)||(!result.get(id).primary&&item.primary))result.set(id,{...item,url:u.href});
    }
    return [...result.values()].sort((a,b)=>Number(!!b.primary)-Number(!!a.primary));
  }
  function teamPost(url,team,verified){
    if(!safe(url)||!CLUB_CHANNELS[team])return false;
    const p=platform(url),u=new URL(url),club=CLUB_CHANNELS[team];
    if(p==='x'){
      const [author,action,id,...rest]=u.pathname.toLowerCase().split('/').filter(Boolean);
      return action==='status' && /^[0-9]+$/.test(id) && !rest.length && [club.x,...(club.xAlso||[])].some(x=>x.toLowerCase()===author);
    }
    if(!['ig','youtube'].includes(p))return false;
    const clean=v=>v.endsWith('/')?v.slice(0,-1):v;
    return verified===team || POST_EVIDENCE.some(e=>e.team===team&&e.links.some(l=>clean(l.url)===clean(url)));
  }
  function contractEvents(){
    const result=[];
    for(const c of CONTRACTS){
      if(!['in','renew','trade'].includes(c.kind)||STOVE.events.some(e=>key(e)===key(c)))continue;
      const proof=POST_EVIDENCE.find(e=>key(e)===key(c));
      const url=[c.url,...(proof?.links||[]).map(l=>l.url)].find(u=>teamPost(u,c.team)&&platform(u)==='x');
      if(!url)continue;
      const id=new URL(url).pathname.split('/').filter(Boolean).at(-1);
      const at=new Date(Number((BigInt(id)>>22n)+1288834974657n)).toISOString();
      result.push({team:c.team,role:c.role,player:c.player,kind:c.kind,until:c.until,url,at,roster:true,id:url,links:[...(proof?.links||[]).map(l=>({...l,primary:true})),{url:c.url,source:c.source,platform:platform(c.url)}],source:STOVE.teams[c.team].name+' 공식 X',title:STOVE.teams[c.team].name+' · '+c.player+' '+STOVE.labels[c.kind]});
    }
    return result;
  }
  function merge(records, now=Date.now()) {
    const episodes=new Map(), news=new Map();
    for(const e of records.filter(e=>e && safe(e.url) && e.title && STOVE.labels[e.kind] && Number.isFinite(Date.parse(e.at)) && Date.parse(e.at)<=now+60000).sort((a,b)=>Date.parse(a.at)-Date.parse(b.at))){
      if(!official(e)){news.set(e.url,e);continue}
      if(!STOVE.teams[e.team]||!e.player)continue;
      const seed=STOVE.events.find(s=>official(s)&&key(s)===key(e)&&Math.abs(Date.parse(s.at)-Date.parse(e.at))<72*3600000);
      const reviewed=seed ? POST_EVIDENCE.find(p=>key(p)===key(e)) : null;
      const direct=platform(e.url);
      const originals=links([...(reviewed?.links||[]).map(l=>({...l,platform:platform(l.url),primary:platform(l.url)!=='media'})),...(e.links||[]).map(l=>({...l,platform:platform(l.url),primary:teamPost(l.url,e.team,l.verifiedTeam)})),{url:e.url,source:e.source,platform:direct,primary:teamPost(e.url,e.team,e.verifiedTeam),at:e.at,verifiedTeam:e.verifiedTeam}]);
      if(!originals.some(l=>l.primary)){news.set(e.url,{...e,kind:'press',roster:false});continue}
      const bucket=episodes.get(key(e))||[], prior=bucket.at(-1);
      const same=prior&&(Date.parse(e.at)-Date.parse(prior.at)<72*3600000 || originals.some(l=>prior.links.some(o=>o.url===l.url)));
      const target=same?prior:{...e,id:fingerprint(e),links:[]};
      target.links=links([...target.links,...originals]);
      const first=target.links.find(l=>l.primary);
      target.url=first?.url||e.url;target.source=first?.source||e.source;
      target.until=e.until||reviewed?.until||target.until||null;
      if(!same){bucket.push(target);episodes.set(key(e),bucket)}
    }
    return [...news.values(),...[...episodes.values()].flat()].sort((a,b)=>Date.parse(b.at)-Date.parse(a.at));
  }
  function slots(team, events,now=Date.now()) {
    const rows=STOVE.roles.map(()=>[]), norm=v=>v.toLowerCase();
    const items=CONTRACTS.filter(c=>c.team===team&&Date.parse(c.asOf)<=now&&(!c.until||c.until>=season));
    for(const c of items){
      if(!STOVE.roles.includes(c.role))continue;
      const kind=c.kind==='existing'?'existing':c.kind;
      rows[STOVE.roles.indexOf(c.role)].push({name:c.player,kind,label:kind==='existing'?'기존 계약':STOVE.labels[kind],until:c.until,asOf:c.asOf,url:c.url,links:links([...(POST_EVIDENCE.find(e=>key(e)===key(c))?.links||[]).map(l=>({...l,platform:platform(l.url),primary:platform(l.url)!=='media'})),{url:c.url,source:c.source,platform:platform(c.url)}])});
    }
    for(const e of [...events].sort((a,b)=>Date.parse(a.at)-Date.parse(b.at))){
      if(!official(e)||!e.roster||!e.player||!e.links?.some(l=>l.primary)||Date.parse(e.at)>now)continue;
      if(e.team!==team && e.kind==='out')continue;
      const recorded=items.find(c=>norm(c.player)===norm(e.player));
      if(recorded && e.team!==team && recorded.asOf>new Date(Date.parse(e.at)+32400000).toISOString().slice(0,10))continue;
      const previous=rows.flat().find(p=>norm(p.name)===norm(e.player));
      for(let i=0;i<rows.length;i++)rows[i]=rows[i].filter(p=>norm(p.name)!==norm(e.player));
      if(e.team!==team||e.kind==='out'||!STOVE.roles.includes(e.role))continue;
      const proof=links([...(e.links||[]),...(previous?.links||[])]);
      rows[STOVE.roles.indexOf(e.role)].push({name:e.player,kind:e.kind,label:STOVE.labels[e.kind],url:e.url,until:e.until||recorded?.until||null,asOf:e.at,links:proof});
    }
    return rows;
  }
  return {official,key,platform,fingerprint,merge,slots,links,contractEvents};
})();
