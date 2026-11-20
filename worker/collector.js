// Normalized documents contain a verified account, original URL and source publication time.
const extendedNames=LCK.playerNames;
const names=new Map();
for(const p of [...CONTRACTS,...STOVE.events,...RUMORS.seed])if(p.role&&p.player&&!p.player.includes('·'))names.set(p.player.toLowerCase(),{player:p.player,role:p.role});
for(const [p,role] of playerRoles)if(!names.has(p))names.set(p,{player:Object.keys(extendedNames).find(n=>n.toLowerCase()===p)||p,role});
const boundary=s=>s.replace(/[.*+?^\x24{}()|[\]\\]/g,'\\$&');
function playersIn(t){
  return [...names.values()].filter(p=>new RegExp('(?:^|[^a-z0-9])'+boundary(p.player)+'(?:$|[^a-z0-9])','i').test(t)||!!extendedNames[p.player]&&t.includes(extendedNames[p.player]));
}
const rosterTerms=/welcome|thank you|farewell|re-sign|has signed|signing|roster|join|trade|renew|transfer|contract|offseason|영입|환영|합류|입단|이적|재계약|트레이드|계약|스토브|결별|로스터|거취|구두 합의|去向|转会|官宣|转会期|转会窗口|选手加盟|mercato|transfert|fichaje|chuyển nhượng|移籍/i;
const uncertain=/[?？]|아니|않았|않습니다|불발|무산|가능성|희망|후보|검토|협상|오보|철회|부인|루머|영입설|만약|떠난다면|승인.{0,6}대기|rumou?r|if\s+we|might|could|denies|not\s+(?:sign|join|renew)|in talks|pending|subject to|reportedly/i;
const secondTeam=/\b(?:LCK\s*CL|challengers|academy|coach|creator|streamer|ambassador)\b|2군|아카데미|코치|감독|크리에이터|스트리머|앰버서더|연습생|레전드\s*매치|콘텐츠|팬미팅|인터뷰|하이라이트|리액션|팬사인회|하이라이[트츠]|회고|추억|지난\s*시즌|anniversary|interview|highlights|reaction|throwback/i;
function scopeTeams(t){
  return Object.keys(STOVE.teams).filter(id=>teamSignals[id].test(t)||new RegExp('(?:^|[^a-z0-9])'+id+'(?:$|[^a-z0-9])','i').test(t));
}
const review=(doc,reason)=>({reviews:[{url:doc.url,title:doc.title.slice(0,200)||'이미지·영상 게시물',source:doc.source,team:doc.team||'',person:doc.person||'',verifiedTeam:doc.team&&(doc.x||doc.ig||doc.youtube)?doc.team:'',at:doc.at,reason}]});
function classify(doc){
  if(!doc.at||!goodUrl(doc.url))return {};
  const t=doc.title.trim(), found=playersIn(t);
  if(!found.length&&doc.team){
    const newcomer=t.match(/(?:탑(?:라이너)?|정글(?:러)?|미드(?:라이너)?|원딜(?:러)?|서포터)\s*[‘'“"]([a-zA-Z][\w.-]{1,20})[’'”"]/i);
    const role=newcomer&&(/정글/.test(newcomer[0])?'JGL':/서포터/.test(newcomer[0])?'SUP':/원딜/.test(newcomer[0])?'BOT':/미드/.test(newcomer[0])?'MID':'TOP');
    if(newcomer)found.push({player:newcomer[1],role});
  }
  if(!t||/^https?:\/\/\S+$/.test(t))return doc.team?review(doc,'이미지·영상 본문 확인 필요'):{};
  if(otherSport.test(t))return {};
  if(!doc.team && doc.person)return tipFrom(doc);
  if(!rosterTerms.test(t)&&!found.length)return {};
  if(!rosterTerms.test(t))return review(doc,'게시물 맥락 확인 필요');
  if(found.length!==1||secondTeam.test(t))return review(doc,found.length>1?'복수 선수·거래 방향 확인 필요':'선수·1군 여부 확인 필요');
  const {player,role}=found[0], teams=scopeTeams(t);
  const item={at:doc.at,url:doc.url,source:doc.source,player,role};
  if(/임대|loan(?:ed)?|대여|은퇴|retire|팬사인|쇼매치|showmatch/i.test(t))return review(doc,'소속 및 계약 형태 확인 필요');
  const inboundTrade=/트레이드로.{0,60}(영입|합류)|(?:we have |we )acquired.{0,50}(?:via|in) a trade/i.test(t);
  if(uncertain.test(t)||(!inboundTrade&&teams.some(team=>team!==doc.team))||/축하|congratulations|복기|상대 팀|상대팀|팬 여러분|fans!|트레이드.{0,18}(보내|떠나)|trade[ds]? (?:away|to)/i.test(t))return review(doc,'문맥·거래 방향 확인 필요');
  const actions=[
    ['renew',/재계약(?:을 체결|했|합니다|에 성공|을 맺| 완료| 발표)|계약(?:을| 기간을)?\s*연장(?:했|합니다|했습니다)|(?:re[- ]signs?|re[- ]signed|extends? (?:his |the )?contract|contract extension)\b|^.{0,36}재계약[!\s.#|]*$/i],
    ['out',/계약(?:이|을)?\s*(?:종료|해지|만료)|상호\s*합의.{0,10}결별|^\s*(?:\[[^\]]+\]\s*)?(?:thank you|farewell)[,\s!]+[\w가-힣‘’'"]+|(?:parts? ways with|has left our team)/i],
    ['in',/영입(?:했|합니다|했습니다|을 발표| 완료)|합류(?:했|합니다|했습니다)|(?:welcome(?: back)?[,! \n]+|has joined (?:our|the) team|we (?:have signed|are signing))|^.{0,40}(?:영입|입단|합류)[!\s.#|]*$/i]
  ];
  const matches=actions.filter(([,r])=>r.test(t));
  if(inboundTrade&&matches.length===0)matches.push(['in']);
  if(matches.length!==1)return review(doc,'발표 유형 확인 필요');
  let kind=matches[0][0];
  if(/welcome|thank you|farewell/i.test(t)&&!/(영입했|재계약했|계약 종료|has joined our team)/i.test(t)){
    const subject=[player,extendedNames[player]].filter(Boolean).map(boundary).join('|');
    if(!new RegExp('(?:welcome(?: back)?|thank you|farewell)[,!.\\s‘“]+(?:'+subject+')(?![a-z0-9])','i').test(t)||/welcome (?:to|our fans)|birthday|생일|토크쇼|welcome party|watch party|팬미팅/i.test(t))return review(doc,'환영·감사 대상 확인 필요');
  }
  if(/트레이드|\btrad(?:e|ed)\b/i.test(t)){
    if(kind!=='in'||!inboundTrade)return review(doc,'트레이드 방향 확인 필요');
    kind='trade';
  }
  const until=kind!=='out'&&t.match(/(20[2-9][0-9])\s*(?:년|시즌)\s*까지|(?:through|until|end of)\s+(?:the\s+)?(20[2-9][0-9])(?:\s+season)?/i);
  return {events:[{...item,id:doc.url,team:doc.team,verifiedTeam:doc.team,kind,until:until?Number(until[1]||until[2]):null,roster:true,title:STOVE.teams[doc.team].name+' · '+player+' '+STOVE.labels[kind],links:[{url:doc.url,source:doc.source,platform:LEDGER.platform(doc.url),at:doc.at,primary:true,verifiedTeam:doc.team}]}]};
}
function combine(results){return Object.fromEntries(['events','claims','reviews'].map(key=>[key,results.flatMap(r=>r[key]||[])]))}
async function retrieve(url){
  const r=await fetch(url,{signal:AbortSignal.timeout(8500),headers:{Accept:'*/*'}});
  if(!r.ok){const err=new Error('HTTP '+r.status);err.status=r.status;err.after=Math.max(Number(r.headers.get('retry-after'))||0,(Number(r.headers.get('x-rate-limit-reset'))||0)-Date.now()/1000);throw err}
  return r;
}
function atomDocs(xml,actor){
  if(!/<feed[\s>]/.test(xml))throw Error('Atom 형식 변경');
  return Array.from(xml.matchAll(/<entry\b[^>]*>([\s\S]*?)<\/entry>/gi),m=>{
    const e=m[1],id=xmlField(e,'yt:videoId'),channel=xmlField(e,'yt:channelId');
    if(channel!==actor.youtube||!/^[\w-]{11}$/.test(id))return {};
    const doc={...actor,title:xmlField(e,'title'),url:'https://www.youtube.com/watch?v='+id,at:useDate(xmlField(e,'published'))};
    let result=classify(doc);
    const desc=xmlField(e,'media:description').split(/https?:\/\//)[0].slice(0,520);
    if(actor.person&&!result.claims?.length&&desc&&tipTerms.test(desc))result=tipFrom({...doc,title:doc.title+' '+desc},{desk:true});
    if(actor.team&&!result.events?.length&&doc.at&&desc&&rosterTerms.test(desc)){
      const enriched=classify({...doc,title:doc.title+' '+desc});if(enriched.events?.length)result=enriched;
    }
    if(actor.team && result.reviews?.length && doc.at)result.events=[{id:doc.url,url:doc.url,title:doc.title,at:doc.at,team:actor.team,source:doc.source,kind:'video',roster:false}];
    return result;
  });
}
const leagueWords=/LCK|LPL|LEC|LCS|LCP|CBLOL|LJL|LMHT|英雄聯盟|リーグ・オブ・レジェンド|리그\s*오브\s*레전드|롤드컵|英雄联盟|League of Legends|LoL Esports|젠지|디플러스|롤스터|Gen[.]G|Hanwha Life Esports/i;
const googleQuery=(q,lang='ko')=>{
  const [gl,hl]=({en:['US','en-US'],zh:['TW','zh-TW'],fr:['FR','fr'],pt:['BR','pt-BR'],es:['ES','es'],vi:['VN','vi'],ja:['JP','ja']})[lang]||['KR','ko'];
  return 'https://news.google.com/rss/search?'+new URLSearchParams({q:q+' when:7d',hl,gl,ceid:gl+':'+(lang==='en'?'en':hl)});
};
function newsDocs(xml,source,community=false,personFilter=''){
  if(!/<rss[\s>]|<rdf:RDF[\s>]/i.test(xml))throw Error('RSS 형식 변경');
  const results=[];
  for(const m of xml.matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/gi)){
    const e=m[1],at=useDate(xmlField(e,'pubDate')||xmlField(e,'dc:date')),url=goodUrl(xmlField(e,'link'));
    const publisher=xmlField(e,'source')||source;
    const title=xmlField(e,'title').replace(new RegExp(' - '+boundary(publisher)+'$'),'');
    const scope=title+' '+xmlField(e,'description').slice(0,280);
    if(!url||!at||!title||otherSport.test(title)||!(leagueWords.test(scope)||LCK.teamIds(scope).length||LCK.includes({title,at})))continue;
    const team=teamOf(title),doc={at,url,source:publisher,title,team};
    const by=xmlField(e,'dc:creator')||xmlField(e,'author');
    const metadataAuthors=mentionIds(by);
    const mentioned=mentionIds(scope);
    if(personFilter&&!metadataAuthors.includes(personFilter)&&!mentioned.includes(personFilter))continue;
    if(community && personFilter && (tipTerms.test(scope)||rosterTerms.test(title))){
      const author=metadataAuthors[0]||'';
      const snippet=(tipTerms.test(title)||rosterTerms.test(title))?title:scope;
      const statement=tipFrom({...doc,team:'',person:author,title:snippet},{form:author?'direct':'relay',publisher:true,authors:metadataAuthors,mentioned,desk:true});
      results.push(statement);continue;
    }
    if(!community&&(rosterTerms.test(title)||tipTerms.test(title))){
      const change={events:[{...doc,id:url,kind:'press',roster:false}]};
      const article=tipFrom({...doc,team:'',person:metadataAuthors[0]||''},{publisher:true,authors:metadataAuthors,mentioned});
      if(article.claims)change.claims=article.claims;
      results.push(change);
    }
    else results.push(review(doc,community?'커뮤니티 원글 · 작성자 확인 필요':'리그 취재 기사'));
  }
  return combine(results);
}
async function freeIndex(env,state={}){
  const html=await (await retrieve(INDEX_URL)).text();
  const results=[],items=parseOfficial(html),now=Date.now();
  const checked=Object.fromEntries(items.flatMap(e=>state.checked?.[e.url]?[[e.url,state.checked[e.url]]]:[]));
  const pending=items.filter(e=>!checked[e.url]?.verified&&!(checked[e.url]?.retryAt>now));
  let failed=false;
  for(const e of pending.slice(0,4)){
    const author=new URL(e.url).pathname.split('/')[1];
    const descriptor={...e,title:e.title,source:'프로셋업 · 구단 X 링크'};
    try{
      const embed=await (await retrieve('https://publish.twitter.com/oembed?omit_script=true&url='+encodeURIComponent(e.url))).json();
      const href=new URL(embed.author_url);
      const paragraph=embed.html?.match(/<p\b[^>]*>([\s\S]*?)<\/p>/i)?.[1]||'';
      const owner=href.protocol==='https:'&&['twitter.com','www.twitter.com','x.com','www.x.com'].includes(href.hostname)&&href.pathname.replace(/^\/|\/$/g,'').toLowerCase()===author.toLowerCase();
      const direct=owner&&paragraph?classify({...descriptor,title:textOnly(paragraph),source:STOVE.teams[e.team].name+' 공식 X · 공개 원문'}):{};
      if(direct.events?.some(v=>v.player.toLowerCase()===e.player.toLowerCase()&&v.kind===e.kind)){
        results.push(direct);checked[e.url]={verified:true};
      }else{
        results.push(review(descriptor,'구단 X 원문 · 선수 또는 계약 유형 확인 필요'));
        checked[e.url]={retryAt:now+6*3600000};
      }
    }catch{
      results.push(review(descriptor,'구단 X 공개 원문 접근 대기'));checked[e.url]={retryAt:now+30*60000};failed=true;
    }
  }
  let claims=[];
  try{claims=await checkPersonalPosts(rumorIndex(html))}catch{failed=true}
  return {...combine([...results,{claims}]),partial:failed,checkpoint:{checked,backlog:pending.length>4}};
}


function catalog(){
  const tasks=[],add=(id,name,minute,run,extra={})=>tasks.push({id,name,minute,run,...extra});
  const people=WATCHLIST.people.map(p=>({...p,person:p.id}));
  for(const a of [...Object.entries(CLUB_CHANNELS).map(([team,p])=>({...p,team,name:STOVE.teams[team].name})),...people]){
    const who=a.team||a.person;
    const tube=a.youtube?.match(/UC[\w-]{22}/)?.[0];
    if(tube){const actor={...a,youtube:tube,source:a.name+' YouTube'};
      add('yt-'+who,actor.source,2,async()=>combine(atomDocs(await (await retrieve('https://www.youtube.com/feeds/videos.xml?channel_id='+tube)).text(),actor)))}
  }
  for(const m of WATCHLIST.media){
    const query='site:'+m.domain+' '+LCK.query;
    const url=m.rss||googleQuery(query,m.lang);
    add('media-'+m.domain,m.name,10,async()=>newsDocs(await (await retrieve(url)).text(),m.name));
  }
  for(const [lang,terms] of [['ko','(이적 OR 계약 OR 영입 OR 로스터 OR 스토브리그)'],['en','(roster OR transfer OR contract OR signing)'],['zh','(转会 OR 续约 OR 官宣 OR 选手)']]){
    const q=LCK.query+' '+terms;
    add('open-'+lang,'LCK 기사 검색 · '+lang,5,async()=>newsDocs(await (await retrieve(googleQuery(q,lang))).text(),'Google 뉴스'));
  }
  for(const c of WATCHLIST.communities){
    
    add('community-'+(c.boardId||c.domain),c.name,15,async()=>communityFeed(c));
  }
  add('index','프로셋업 · 구단 X 원문 확인',5,freeIndex);
  add('sheep','Sheep Esports · LoL 이적 리크',4,readSheep);
  return tasks;
}
