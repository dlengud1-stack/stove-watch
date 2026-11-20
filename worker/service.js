const NEWS_QUERY='(LCK OR 젠지 OR "한화생명e스포츠" OR "농심 레드포스" OR "KT 롤스터") (영입 OR 재계약 OR "계약 종료" OR 이적 OR 스토브리그) when:7d';
const INDEX_URL='https://dugout26.github.io/prosetup/stove-2027.html';
const clubs=Object.fromEntries(Object.entries(CLUB_CHANNELS).flatMap(([id,c])=>[c.x,...(c.xAlso||[])].map(x=>[x.toLowerCase(),id])));
const teamSignals={NS:/농심|레드포스|redforce/i,T1:/\bT1\b|티원/i,GEN:/젠지|gen\.?g\b/i,HLE:/한화생명|HLE\b/i,KT:/kt\s*롤스터|kt\s*rolster/i,DK:/디플러스|dplus/i,BFX:/피어엑스|fearx/i,BRO:/브리온|brion/i,KRX:/\bDRX\b/i,DNS:/수퍼스|SOOPers/i};
const transfer=/(영입|재계약|계약.{0,3}(종료|연장|만료)|결별|합류|이적|스토브리그|로스터|자유계약)/i;
const league=/(LCK|리그\s*오브\s*레전드|롤드컵|데프트|페이커|쵸비|젠지.{0,3}이스포츠|디플러스\s*기아|BNK\s*피어엑스)/i;
const otherSport=/(야구|축구|발로란트|오버워치|배틀그라운드|골키퍼|투수|타자|외야수|배구|농구|카트라이더|FC온라인|PUBG|VALORANT|TFT|아카데미\s*수강)/i;
const textOnly=s=>String(s||'').replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,'$1').replace(/<[^>]*>/g,' ').replace(/&(?:amp|lt|gt|quot|apos|nbsp|#\d+|#x[a-f\d]+);/gi,m=>{
 const chars={'&amp;':'&','&lt;':'<','&gt;':'>','&quot;':'"','&apos;':"'",'&nbsp;':' '};if(chars[m])return chars[m];const v=m.startsWith('&#x')?parseInt(m.slice(3),16):parseInt(m.slice(2),10);return Number.isInteger(v)&&v<0x110000?String.fromCodePoint(v):' ';
}).replace(/\s+/g,' ').trim();
function xmlField(xml,tag){const m=new RegExp('<'+tag+'(?:\\s[^>]*)?>([\\s\\S]*?)</'+tag+'>','i').exec(xml);return textOnly(m?.[1])}
function teamOf(text){return Object.keys(teamSignals).find(key=>teamSignals[key].test(text))||''}
function useDate(v){const time=typeof v === 'number' ? v : Date.parse(v);return Number.isFinite(time)&&time>=Date.parse('2026-10-01')&&time<=Date.now()+60000?new Date(time).toISOString():null}
function goodUrl(v){try{const u=new URL(v);return u.protocol==='https:'?u.href:null}catch{return null}}
function parseNews(xml,source){
 if(!/<rss[\s>]|<rdf:RDF[\s>]/i.test(xml))throw Error('rss');
 const result=[];
 for(const match of xml.matchAll(/<item(?:\s[^>]*)?>([\s\S]*?)<\/item>/gi)){
   const item=match[1],original=xmlField(item,'title'),publisher=xmlField(item,'source')||source;
   const title=original.endsWith(' - '+publisher)?original.slice(0,-publisher.length-3):original;
   const context=title+' '+xmlField(item,'description').slice(0,180);
   const team=teamOf(title)||teamOf(context),at=useDate(xmlField(item,'pubDate')||xmlField(item,'dc:date')),url=goodUrl(xmlField(item,'link'));
   if(!title||!at||!url||otherSport.test(title)||!transfer.test(title)||!(league.test(context)||team))continue;
   result.push({id:url,at,team,title,kind:'press',source:publisher,url,roster:false});
 }
 return result;
}
function parseVideos(xml,team){
 if(!/<feed[\s>]/i.test(xml))throw Error('atom');
 const result=[];
 for(const match of xml.matchAll(/<entry(?:\s[^>]*)?>([\s\S]*?)<\/entry>/gi)){
  const e=match[1],title=xmlField(e,'title'),vid=xmlField(e,'yt:videoId'),at=useDate(xmlField(e,'published'));
  if(!at||xmlField(e,'yt:channelId')!==team.channel||!/^[\w-]{11}$/.test(vid)||otherSport.test(title)||!/(영입|재계약|계약.{0,4}(종료|연장|만료)|로스터|선수단 발표|welcome[, ]|thank you[, ]|re[- ]?signed|roster announcement)/i.test(title))continue;
  const url='https://www.youtube.com/watch?v='+vid;
  result.push({id:url,title,at,team:team.id,kind:'video',url,source:team.name+' 공식 유튜브',roster:false});
 }
 return result;
}
function parseOfficial(html){
 const section=html.split(/<h2(?:\s[^>]*)?>/i).slice(1).find(s=>textOnly(s.split(/<\/h2>/i)[0]).includes('오피셜'));
 if(!section)throw Error('index');
 const knownRoles=new Map(STOVE.events.filter(e=>e.role).map(e=>[e.player.toLowerCase(),e.role]));
 for(const team of Object.values(STOVE.teams))team.base.forEach((p,i)=>{if(p)knownRoles.set(p.toLowerCase(),STOVE.roles[i])});
 let available=0;const result=[];
 for(const row of section.matchAll(/<tr(?:\s[^>]*)?>([\s\S]*?)<\/tr>/gi)){
   const cells=Array.from(row[1].matchAll(/<td(?:\s[^>]*)?>([\s\S]*?)<\/td>/gi),m=>m[1]);
   if(cells.length<3)continue;available++;
   const rowText=textOnly(cells.slice(2).join(' ')),playerCell=textOnly(cells[1]);
   if(/챌린저스|\bCL\b|2군|아카데미|감독|코치|1군.{0,6}(미정|구분)|구분.{0,12}(없|미공개)/i.test(rowText))continue;
   const primary=row[1].match(/href\s*=\s*["']https:\/\/(?:www\.)?(?:x|twitter)\.com\/([A-Za-z0-9_]+)\/status\/(\d{16,21})/i);
   if(!primary)continue;
   const team=clubs[primary[1].toLowerCase()];if(!team)continue;
   const displayedDate=textOnly(cells[0]).match(/\d{4}[-.]\d{2}[-.]\d{2}/)?.[0].replaceAll('.','-');
   const at=useDate(Number((BigInt(primary[2])>>22n)+1288834974657n));
   if(!at||!displayedDate||new Date(Date.parse(at)+32400000).toISOString().slice(0,10)!==displayedDate)continue;
   const player=/^([A-Za-z][A-Za-z0-9_.-]{1,21})/.exec(playerCell)?.[1];
   const kind=/^(방출|계약 종료|FA\s)/.test(rowText)?'out':/^재계약/.test(rowText)?'renew':/^영입/.test(rowText)?'in':null;
   if(!kind||!player)continue;
   const url='https://x.com/'+primary[1]+'/status/'+primary[2],role=knownRoles.get(player.toLowerCase())||'';
   result.push({id:url,at,team,player,role,kind,url,roster:!!role,title:STOVE.teams[team].name+', ‘'+player+'’ '+STOVE.labels[kind],source:STOVE.teams[team].name+' 공식 X · 프로셋업'});
 }
 if(!available)throw Error('layout');
 return result;
}
async function readSource(name,url,parse){
 try{
  const r=await fetch(url,{signal:AbortSignal.timeout(7000),headers:{Accept:'application/atom+xml, application/rss+xml, text/html, application/xml;q=0.9, */*;q=0.5'}});
  if(!r.ok)throw Error('http');const body=await r.text();if(body.length>3500000)throw Error('size');
  return {name,ok:true,items:parse(body)};
 }catch{return {name,ok:false,items:[]}}
}
const playerRoles = new Map();
for(const team of Object.values(STOVE.teams))team.base.forEach((name,i)=>{if(name)playerRoles.set(name.toLowerCase(),STOVE.roles[i])});
for(const item of [...STOVE.events,...RUMORS.seed])if(item.role)playerRoles.set(item.player.toLowerCase(),item.role);
for(const [role,names] of Object.entries({TOP:['Rooster','Rich','Hoya'],JGL:['Willer','Sponge','Sylvie'],MID:['Scout','Clozer'],BOT:['Viper','Aiming','Taeyoon','Noah','Diable','Jiwoo'],SUP:['Kellin','Cloud','Lehends','Life','Quantum','Andil']}))for(const name of names)playerRoles.set(name.toLowerCase(),role);
const destinations=[
  ['HLE',/^(?:한화생명(?:e스포츠)?|한화|HLE\b)/i],['GEN',/^(?:젠지|GEN(?:\.G)?\b)/i],['NS',/^(?:농심(?: 레드포스)?|NS\b)/i],
  ['T1',/^(?:티원|T1\b)/i],['DK',/^(?:디플러스(?: 기아)?|DK\b|Dplus KIA\b)/i],['KT',/^(?:케이티|kt(?:\s*롤스터)?\b)/i],
  ['BRO',/^(?:한진 브리온|브리온|BRO\b)/i],['BFX',/^(?:BNK(?: 피어엑스)?|피어엑스|BFX\b)/i],['KRX',/^(?:키움(?: DRX)?|KRX\b|DRX\b)/i],['DNS',/^(?:DN\s*(?:SOOPers|수퍼스)|DNS\b)/i]
];
function rumorIndex(html){
  const sections=html.split(/<h2(?:\s[^>]*)?>/i).slice(1);
  const selected=sections.filter(s=>/커뮤니티.{0,10}썰|매체 보도|소식통.{0,5}보도/.test(textOnly(s.split(/<\/h2>/i)[0])));
  if(!selected.length)throw Error('rumor index layout');
  const claims=[];
  let tableRows=0;
  for(const section of selected){
    for(const row of section.matchAll(/<tr(?:\s[^>]*)?>([\s\S]*?)<\/tr>/gi)){
      const cells=Array.from(row[1].matchAll(/<td(?:\s[^>]*)?>([\s\S]*?)<\/td>/gi),m=>m[1]);
      if(cells.length<3)continue;
      tableRows++;
      const date=textOnly(cells[0]).match(/20\d\d-\d\d-\d\d/)?.[0];
      const player=textOnly(cells[1]).match(/^([A-Za-z][A-Za-z0-9_.-]{1,21})/)?.[1];
      if(!date||!player)continue;
      const rest=cells.slice(2).join(' ');
      const content=textOnly(rest), arrow=content.indexOf('→');
      if(arrow<0)continue;
      const direction=content.slice(arrow+1).trim();
      if(/^(?:.{0,19}\s+\((?:[^)]*아님|[^)]*부정)|미정|LPL|LCS|LEC)/i.test(direction))continue;
      const team=destinations.find(([,pattern])=>pattern.test(direction))?.[0];
      if(!team)continue;
      const external=Array.from(rest.matchAll(/<a\b[^>]*\bhref\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)).map(m=>({url:goodUrl(textOnly(m[1])),label:textOnly(m[2])})).find(l=>l.url&&new URL(l.url).hostname!==new URL(INDEX_URL).hostname);
      if(!external)continue;
      const at=date+'T00:00:00+09:00';
      if(!useDate(at))continue;
      const known=RUMORS.seed.find(c=>c.team===team&&c.player.toLowerCase()===player.toLowerCase()&&c.url===external.url);
      const closed=/^(무산|철회|오보|불발)/.test(content)?'ended':/^오피셜\s*확정/.test(content)?'settledIndex':'';
      if(!closed&&known)continue;
      // A list curator can quote several people on one row. Attribute the link, never its text to an individual.
      const source=new URL(external.url).hostname.replace(/^www\./,'');
      const cleanLabel=external.label.split('(')[0].trim();
      const named=Object.entries(RUMORS.people).filter(([,p])=>p.name.split(' · ')[0]===cleanLabel);
      const single=named.length===1&&!external.label.includes(' · ')&&!(external.label.match(/\(/g)?.length>1);
      claims.push({team,role:playerRoles.get(player.toLowerCase())||'',player,at,dateOnly:true,person:single?named[0][0]:'',form:single?'relay':'index',stage:'index',url:external.url,source:source+' · 프로셋업 경유',indexUrl:INDEX_URL,closed,
        note:'프로셋업의 이적시장 표에 연결된 출처입니다. 게시일만 확인됐으며, 발언자·합의 여부는 별도 검토 대상입니다.'});
    }
  }
  if(!tableRows)throw Error('rumor table');
  return claims;
}


const localNames=LCK.playerNames;
function personalPost(claim,embed){
  const url=new URL(claim.url);
  const match=/^\/midnoflash\/status\/(\d+)\/?$/i.exec(url.pathname);
  if(!match||!['x.com','twitter.com','www.x.com','www.twitter.com'].includes(url.hostname))return claim;
  let data;
  try{data=JSON.parse(embed)}catch{return claim}
  if(!/^https:\/\/(?:www\.)?(?:twitter|x)\.com\/midnoflash\/?$/i.test(data.author_url||''))return claim;
  const post=textOnly(data.html?.match(/<p\b[^>]*>([\s\S]*?)<\/p>/i)?.[1]);
  // Verify the wording inside an authenticated author's public post. Shortlists, quotes and negations keep their original level.
  if(!post||/아니|않|무산|철회|후보|영입설|협상 중|가능성|관심|보도에 따르면|인용|[?？]/.test(post))return claim;
  const sentences=post.split(/[.!?\n]/);
  const name=localNames[claim.player]||claim.player;
  const contains=sentences.some(s=>s.toLowerCase().includes(name.toLowerCase())&&teamSignals[claim.team]?.test(s)&&Object.keys(teamSignals).filter(k=>teamSignals[k].test(s)).length===1&&/영입에 성공|영입했|계약에 합의|합류하기로|계약을 맺|영입을 마쳤/.test(s));
  if(!contains)return claim;
  const at=useDate(Number((BigInt(match[1])>>22n)+1288834974657n));if(!at)return claim;
  return {...claim,person:'yoon',form:'direct',stage:'joining',at,dateOnly:false,source:'윤민섭 · X',note:'윤민섭 기자의 개인 X 원문에서 해당 선수와 팀의 합류·합의 표현을 확인했습니다.'};
}
async function checkPersonalPosts(claims){
  const urls=[...new Set(claims.filter(c=>!c.closed&&/^https:\/\/(?:www\.)?(?:twitter|x)\.com\/midnoflash\/status\/\d+/i.test(c.url)).map(c=>c.url))].slice(0,2);
  const results=await Promise.all(urls.map(url=>readSource('기자 X 원문','https://publish.twitter.com/oembed?omit_script=true&url='+encodeURIComponent(url),raw=>raw)));
  const posts=new Map(urls.map((url,i)=>[url,results[i]]));
  return claims.map(c=>posts.get(c.url)?.ok?personalPost(c,posts.get(c.url).items):c);
}


function readMeta(html,key){
  for(const tag of html.match(/<meta\b[^>]+>/gi)||[]){
    const props=Object.fromEntries(Array.from(tag.matchAll(/([\w:-]+)\s*=\s*(["'])([\s\S]*?)\2/g),m=>[m[1].toLowerCase(),textOnly(m[3])]));
    if(props.name===key||props.property===key)return props.content||'';
  }
  return '';
}
const sheepDestinations=[
 ['GEN',/^gen\.?g\b/i],['T1',/^t1\b/i],['HLE',/^hanwha life(?: esports)?\b/i],['KT',/^kt rolster\b/i],
 ['DK',/^dplus kia\b/i],['NS',/^nongshim redforce\b/i],['BRO',/^(?:hanjin )?brion\b/i],['KRX',/^(?:kiwoom )?drx\b/i],
 ['BFX',/^(?:bnk fearx|bfx)\b/i],['DNS',/^dn soopers\b/i]
];
