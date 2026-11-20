const sheepRoot='https://www.sheepesports.com';
function sheepLink(href){
  try{
    const u=new URL(href,sheepRoot);
    const match=u.pathname.match(/^\/(?:[a-z]{2}(?:-[a-z]{2})?\/)?articles\/([a-z0-9%-]+)\/([a-z]{2})\/?$/i);
    return u.origin===sheepRoot&&match?{url:u.origin+u.pathname.replace(/\/$/,''),slug:match[1]}:null;
  }catch{return null}
}
function sheepIndex(html){
  const pages=new Map();let any=0;
  for(const [,attrs,inner] of html.matchAll(/<a\b([^>]+)>([\s\S]*?)<\/a>/gi)){
    const href=attrs.match(/\bhref\s*=\s*["']([^"']+)/i)?.[1];
    const entry=sheepLink(href);if(!entry)continue;
    any++;
    const title=textOnly(inner),ctx=title+' '+entry.slug.replaceAll('-',' ');
    if(tipOther.test(ctx)||/\b(?:vct|csgo|rocket league|counter strike|valorant|offseason live tracker)\b/i.test(ctx))continue;
    if(!/\b(?:lol|league of legends|lck|lec|lpl|lcs|lcp|cblol|prime league|erl|lfl)\b/i.test(ctx))continue;
    if(!tipTerms.test(ctx)&&!rosterTerms.test(ctx)&&!/(?:\bleak\b|\[sources\])/i.test(ctx))continue;
    if(!pages.has(entry.slug))pages.set(entry.slug,entry);
  }
  if(!any)throw Error('Sheep 기사 목록 확인 필요');
  return [...pages.values()];
}
function sheepMetadata(html,url){
  const candidates=[];
  for(const [,raw] of html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)){
    try{const d=JSON.parse(raw);const nodes=Array.isArray(d)?d:[d,...(d['@graph']||[])];candidates.push(...nodes.filter(x=>/Article|BlogPosting/i.test(String(x?.['@type']))))}catch{}
  }
  const d=candidates[0]||{};
  const bylines=[...new Set([...(Array.isArray(d.author)?d.author:[d.author]).map(a=>typeof a==='string'?a:a?.name),readMeta(html,'author')].filter(Boolean))];
  const prefix=html.slice(Math.max(0,html.search(/<h1\b/i))).split(/<p\b[^>]*>\s*(?:<[^>]+>\s*)*(?:According to|Sources close|Ahead of)|<h2\b|<hr\b|<\/header>|related articles/i)[0].slice(0,28000);
  // Author profile links inside the byline only. Body references and story recommendations are not bylines.
  const byline=textOnly(prefix.match(/(?:>\s*(?:By|Written by|작성자|Par|Por)\s*<[\s\S]{0,1700}?)(?=<time|<\/header>|<\/p>|<\/section>)/i)?.[0]||'');
  const authorLinks=[...prefix.matchAll(/<a[^>]+href=["'][^"']*\/authors\/([^"'/?]+)[^"']*["'][^>]*>([\s\S]*?)<\/a>/gi)].map(m=>m[1].replaceAll('-',' ')+' '+textOnly(m[2]));
  const authors=[...new Set([...bylines,...authorLinks,byline].flatMap(mentionIds))];
  const date=d.datePublished||readMeta(html,'article:published_time')||html.match(/<time\b[^>]*datetime=["']([^"']+)/i)?.[1]||html.match(/\b(\d{2})\.(\d{2})\.(\d{2})\s*-\s*\d{2}:\d{2}/)?.[0];
  const shortDate=date?.match(/^(\d{2})\.(\d{2})\.(\d{2})/);
  const locale=new URL(url).pathname.split('/')[1];
  const [year,month,day]=!shortDate?[]:locale==='kr'?[shortDate[1],shortDate[2],shortDate[3]]:
    locale==='us'&&Number(shortDate[1])<=12?[shortDate[3],shortDate[1],shortDate[2]]:[shortDate[3],shortDate[2],shortDate[1]];
  const at=shortDate?useDate('20'+year+'-'+month+'-'+day+'T00:00:00+09:00'):useDate(date);
  return {title:textOnly(d.headline||readMeta(html,'og:title')||html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1]).replace(/\s*[|–]\s*Sheep Esports.*$/i,''),
    at,dated:!!date,dateOnly:!!shortDate,authors,byline:bylines.filter(v=>!/https?:\/\//.test(v)).join(', ').slice(0,120),body:d.articleBody};
}
function sheepParagraphs(html,meta){
  if(meta.body)return String(meta.body).split(/(?:\n+|(?<=[.!?])\s+(?=[A-Z]))/);
  const main=(html.match(/<article\b[^>]*>([\s\S]*?)<\/article>/i)?.[1]||html.split(/<h1\b/i).at(-1)).split(/(?:Related (?:news|articles)|관련 기사|More articles|id=["']related)/i)[0];
  return [...main.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)].map(m=>textOnly(m[1])).filter(Boolean);
}
function parseSheepArticle(html,url,observedAt=new Date().toISOString()){
  const meta=sheepMetadata(html,url);if(!meta.title)throw Error('Sheep 원제 확인 필요');
  if(meta.dated&&!meta.at||tipOther.test(meta.title))return [];
  const at=meta.at||observedAt,source='Sheep Esports',primary=meta.authors[0]||'';
  const data={at,url,source,title:meta.title,person:primary};
  const headline=tipFrom(data,{publisher:true,authors:meta.authors,desk:true}).claims?.[0];
  const claims=[],base={team:'',player:'',role:'',stage:'hearsay',form:'direct',scope:'desk',...headline,at,url,source,person:primary,authors:meta.authors,byline:meta.byline,
    dateOnly:meta.dateOnly,observed:!meta.at,publisher:true,topic:meta.title,note:meta.title};
  // Explicit player-to-team direction is required to project a player onto a Korean team.
  const subject=meta.title.replace(/^\s*(?:\[?sources?\]?\s*[:\-]?\s*)/i,'').match(/^([a-zA-Z0-9][\w.-]{1,22})\s+(?:is\s+)?(?:set to (?:join|return to|sign with)|reache[sd]? (?:an? )?(?:[\w-]+ )?agreement with|in talks with|linked (?:with|to)|in discussions with|expected to join)\s+(.+)/i);
  if(subject&&!speculative.test(meta.title)&&!secondTeam.test(meta.title)&&!quoteTerms.test(meta.title)&&base.stage!=='negotiationFailed'){
    const destination=sheepDestinations.find(([,pattern])=>pattern.test(subject[2]))?.[0];
    const destLabel=subject[2].split(/\s+(?:ahead of|for (?:the |LCK|LCS|LEC|20)|in the |in 20)/i)[0].replace(/[.,;]+$/,'').slice(0,50);
    base.player=subject[1];base.role=playerRoles.get(subject[1].toLowerCase())||'';
    if(destination){base.team=destination;base.scope='roster'}else base.destination=destLabel;
  }
  if(quoteTerms.test(meta.title))base.form='relay';
  claims.push(base);
  const sentences=sheepParagraphs(html,meta).flatMap(p=>p.split(/(?<=[.!?])\s+(?=[A-Z"“])/)).filter(s=>s.length>=16&&s.length<1050);
  if(subject&&base.form==='direct'&&base.stage==='joining'){
    const named=new RegExp('(?:^|[^a-z0-9])'+boundary(subject[1])+'(?:$|[^a-z0-9])','i');
    const lead=sentences.slice(0,4).filter(s=>named.test(s)&&!quoteTerms.test(s)&&!speculative.test(s));
    if(lead.some(s=>statementStage(s)==='agreement'))base.stage='agreement';
    else if(lead.some(s=>/close to sign|advancing toward the signing|still (?:negotiating|in talks)/i.test(s)))base.stage='talks';
  }
  if(subject&&base.destination){
    // Use this article's lead only when it connects its subject to a present contract or an immediate departure.
    for(const sentence of sentences.slice(0,8)){
      const clubs=LCK.teamIds(sentence);
      if(clubs.length!==1||/\b(?:formerly|previously|former|once|career began|in 202[0-5])\b/i.test(sentence))continue;
      const directlyNamed=new RegExp('(?:^|[^a-z0-9])'+boundary(subject[1])+'(?:$|[^a-z0-9])','i').test(sentence);
      const firstPersonContext=/^(?:Coming from|Currently (?:playing for|under contract)|Still under contract)/i.test(sentence);
      if(!(directlyNamed||firstPersonContext)||!/(?:still |currently )?under contract|buyout agreement|will leave|is leaving|joins? from|transfers? from/i.test(sentence))continue;
      base.originTeam=clubs[0];base.originProof=url;break;
    }
  }
  const seen=new Set();
  for(const s of sentences){
    const stage=statementStage(s);
    if(!['offer','talks','shortlist','interest','negotiationFailed'].includes(stage)||seen.has(s)||s.includes(meta.title))continue;
    seen.add(s);
    const subjects=playersIn(s),teams=scopeTeams(s);
    const referenced=quoteTerms.test(s)||/as (?:previously )?reported|last (?:year|season)|in 202[0-5]\b/i.test(s);
    const item={...base,originTeam:'',originProof:'',scope:'desk',team:teams.length===1?teams[0]:'',player:subjects.length===1?subjects[0].player:'',role:'',stage,destination:'',form:referenced?'relay':'direct',
      topic:meta.title,note:s.slice(0,260),passage:true};
    const quoted=[...new Set([...s.matchAll(/["“]([A-Z0-9][\w.-]{1,24})["”]/gi)].map(m=>m[1]))];
    if(stage==='shortlist'&&quoted.length>1&&/(?:were|both|also) (?:also )?considered/i.test(s)){
      for(const player of quoted)claims.push({...item,player});
    }else claims.push(item);
  }
  return claims;
}
// Retain discovered URLs, including failed pages, between runs. Old pages cannot monopolize the front of the queue.
async function readSheep(env,state={}){
  const now=Date.now(),entries=new Map(),done={...(state.done||{})};
  const first=await (await retrieve(sheepRoot+'/en/all/leaks')).text();
  for(const item of sheepIndex(first))entries.set(item.slug,item);
  let page=Number(state.page)||2;
  if(page<=5){
    try{
      const html=await (await retrieve(sheepRoot+'/en/all/leaks?page='+page)).text();
      for(const item of sheepIndex(html))if(!entries.has(item.slug))entries.set(item.slug,item);
      page=page===5?2:page+1;
    }catch{ /* keep the backfill page scheduled while processing the main feed */ }
  }
  const queue=new Map();
  for(const item of state.queue||[])if(sheepLink(item.url))queue.set(item.slug,item);
  for(const item of entries.values())if(!queue.has(item.slug)&&(!done[item.slug]||now-done[item.slug]>86400000))queue.set(item.slug,item);
  const batch=[...queue.values()].filter(i=>!(i.retryAt>now)).slice(0,4),claims=[];
  let success=0;
  for(const item of batch){
    try{
      const raw=await (await retrieve(item.url)).text();claims.push(...parseSheepArticle(raw,item.url,item.seenAt||new Date(now).toISOString()));
      queue.delete(item.slug);done[item.slug]=now;success++;
    }catch{
      queue.delete(item.slug);
      const attempts=(item.attempts||0)+1;queue.set(item.slug,{...item,attempts,retryAt:now+Math.min(360,2**Math.min(attempts,8))*60000,seenAt:item.seenAt||new Date(now).toISOString()});
    }
  }
  for(const [id,t] of Object.entries(done))if(now-t>7*86400000)delete done[id];
  return {claims,partial:batch.length>success,checkpoint:{page,queue:[...queue.values()],done,backlog:[...queue.values()].some(x=>!(x.retryAt>now))}};
}
