import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const context={URL,URLSearchParams,Date,Request,Response,AbortSignal,console};
vm.createContext(context);
const read=name=>fs.readFileSync(name,'utf8');
const files=['data','channels','contracts','watchlist','lck','tips','rumors','ledger'].map(n=>'public/'+n+'.js').concat(['service','collector','rumorfeed','sheep','community','archive'].map(n=>'worker/'+n+'.js'));
vm.runInContext(files.map(f=>read(f).replace('export default {','const worker={').replace('export {sweep};','')).join('\n')+'\nglobalThis.test={STOVE,CONTRACTS,POST_EVIDENCE,WATCHLIST,LEDGER,RUMORS,registry,sweep,publicFeed,classify,atomDocs,freeIndex,newsDocs,communityFeed,worker};',context);
const {STOVE,CONTRACTS,POST_EVIDENCE,WATCHLIST,LEDGER,RUMORS,registry,sweep,publicFeed,classify,atomDocs,freeIndex,newsDocs,communityFeed,worker}=context.test;
const at='2026-11-19T09:40:00Z', url='https://x.com/NS_RedForce/status/12345678';
const doc={at,url,title:'Welcome, Deft!',team:'NS',source:'NS X'};
assert.deepEqual([Object.keys(STOVE.teams).length,CONTRACTS.length,WATCHLIST.media.length,WATCHLIST.people.length,WATCHLIST.communities.length],[10,34,39,36,9]);
const initial=LEDGER.merge(STOVE.events),deft=initial.find(p=>p.player==='Deft'),raptor=initial.find(p=>p.player==='Raptor');
assert.equal(new Set(raptor.links.filter(l=>l.primary).map(l=>l.platform)).size,3);
assert.equal(deft.links.filter(l=>!l.primary).length,1);
assert.equal(LEDGER.slots('T1',initial)[2][0].until,2029);
assert.ok(LEDGER.slots('T1',initial)[2][0].links.length>=2);
assert.equal(LEDGER.slots('NS',initial)[3][0].kind,'in');
assert.equal(LEDGER.slots('DNS',initial)[1][0].until,null);
assert.equal(classify(doc).events?.[0].kind,'in');
for(const title of ['Welcome to the interview with Deft','Welcome, Deft?','Welcome, Deft and Raptor','Thank you fans for supporting Deft','Deft VALORANT 영입','Welcome to Deft stream'])assert.equal(classify({...doc,title}).events?.length||0,0,title);
assert.equal(classify({...doc,title:"정글러 ‘Nova’ 선수를 영입했습니다."}).events[0].player,'Nova');
assert.equal(classify({...doc,title:"농심은 KT와의 트레이드로 ‘Raptor’ 선수를 영입했습니다."}).events[0].kind,'trade');
assert.equal(classify({...doc,title:"Deft 선수와 2028년까지 재계약을 체결했습니다."}).events[0].until,2028);
const yt='UC4PoHC-R9EeJYTuUv3ndmJw',xml='<feed><entry><title>Welcome, Deft</title><yt:channelId>'+yt+'</yt:channelId><yt:videoId>0bKm23sM4XM</yt:videoId><published>'+at+'</published></entry></feed>';
assert.equal(atomDocs(xml,{team:'NS',youtube:yt,source:'NS YT'})[0].events[0].player,'Deft');assert.equal(atomDocs(xml,{team:'T1',youtube:'unrelated'})[0].events,undefined);
const first=classify(doc);
const rss='<rss><channel><item><title>LCK Gen.G Siwoo set to join</title><pubDate>'+at+'</pubDate><link>https://example.org/article</link><source>Example</source></item></channel></rss>';
assert.equal(newsDocs(rss,'test').events[0].kind,'press');assert.equal(RUMORS.tier(newsDocs(rss,'test').claims[0]),'report');
context.fetch=async()=>new Response('<a href="/leagueoflegends/1234567">LCK 젠지 루시드 영입설</a>');
const board=await communityFeed(WATCHLIST.communities.find(c=>c.domain==='theqoo.net'));assert.equal(RUMORS.tier(board.claims[0]),'rumor');
const claim={team:'NS',player:'Deft',role:'BOT',stage:'agreement',form:'direct',person:'wooloo',at,url:'https://example.org/leak'};
assert.equal(RUMORS.board([claim],[]).find(g=>g.id==='NS|deft').kind,'near');
const withdrawal={...claim,at:'2026-11-19T11:35:00Z',url:'https://example.org/retract',closed:'withdrawnByAuthor'};
assert.equal(RUMORS.board([claim,withdrawal].map(c=>({...c,player:'TestPlayer'})),[]).find(g=>g.id==='NS|testplayer').status,'ended');
assert.equal(RUMORS.board([claim],initial).find(g=>g.id==='NS|deft').status,'confirmed');
let json=null,runs=0;const env={ARCHIVE:{get:async()=>json,put:async(k,v)=>{json=v}}};
const jobs=[{id:'one',name:'피드',minute:1,run:async()=>{runs++;if(runs>1)throw Error('offline');return {events:first.events,claims:[claim],reviews:board.reviews}}},{id:'two',name:'인증',minute:1,requires:['X_BEARER_TOKEN'],run:()=>{throw Error('must skip')}}];
const base=Date.now(),p=sweep(env,{jobs,now:base});await Promise.all([p,sweep(env,{jobs,now:base})]);assert.equal(runs,1);
let data=await (await worker.fetch(new Request('https://test/api/feed'),env)).json();assert.equal(data.sources.find(s=>s.id==='two').status,'auth');assert.equal(data.events.length,1);assert.equal(runs,1);
await sweep(env,{jobs,now:base+61000});data=publicFeed(JSON.parse(json));assert.equal(data.events.length,1);assert.equal(data.sources[0].ok,false);assert.ok(data.sources[0].lastOk);
const jobs2=registry();assert.equal(new Set(jobs2.map(j=>j.id)).size,jobs2.length);assert.ok(jobs2.length>80);
console.log(JSON.stringify({test:'PASS',assertions:'ownership, YouTube, merger, contracts, trade, new players, rumor retraction, press, community, pagination checkpoint, scheduler, outage recovery, API readback',sources:jobs2.length,evidence:POST_EVIDENCE.length,contractYears:CONTRACTS.filter(c=>c.until).length}));

const {tipFrom,parseSheepArticle,readSheep,sheepIndex,STOVE_TIPS}=vm.runInContext('({tipFrom,parseSheepArticle,readSheep,sheepIndex,STOVE_TIPS})',context);
assert.ok(['shin','kwon','kimminq','leeduh','hongcha','eevee','park','molecule','bieung','dyumano','nonggal','fox','rostermania','esportmaniacos','showtana','zhukai','file77','bruno','diniz','laoyue','yao','lifehint','dong'].every(id=>WATCHLIST.people.some(p=>p.id===id)));
assert.ok(WATCHLIST.people.every(p=>registry().some(job=>job.id==='person-'+p.id)));
assert.ok(registry().every(j=>!j.requires&&!/^(x-|ig-|weibo-)/.test(j.id)));
const take=title=>tipFrom({title,at,url:'https://example.org/story',source:'test',person:'wooloo'}).claims[0];
for(const title of ['I hope Faker will join Gen.G','Maybe Gen.G reached a verbal agreement with Faker?','Gen.G is not interested in Faker']){
  const item=take(title);assert.equal(RUMORS.tier(item),'rumor',title);assert.equal(item.scope,'desk',title);
}
assert.equal(take("T1's Faker set to join FlyQuest").scope,'desk');
assert.equal(RUMORS.tier(take('Gen.G is in talks with Faker')),'rumor');
assert.equal(take('LCK 로스터 보강을 논의 중').scope,'desk');
assert.equal(RUMORS.board([],initial).find(g=>g.id==='KT|smash').status,'ended');
assert.equal(LEDGER.slots('DK',initial)[3][0].name,'Smash');
const hwi=STOVE_TIPS.filter(c=>c.destination==='FlyQuest'&&c.url.includes('hwichan'));
assert.ok(hwi.some(c=>c.player==='Poby'&&RUMORS.tier(c)==='rumor')&&hwi.some(c=>c.player==='Hwichan'&&c.stage==='agreement'));
const urlSheep='https://www.sheepesports.com/en/articles/sources-hwichan-lcs/en';
assert.equal(RUMORS.canon(urlSheep),RUMORS.canon(urlSheep.replace('/en/articles/','/kr/articles/').replace(/en$/,'kr')));
const article='<script type="application/ld+json">'+JSON.stringify({'@type':'NewsArticle',author:[{name:'Alejandro Gomis'},{name:'Brieuc Seeger'}],datePublished:at,headline:'Hwichan set to join FlyQuest for LCS 2027',articleBody:'Alex "Toasty" Chea and Yun "Poby" Sung-won were also considered.'})+'</script>';
const parsed=parseSheepArticle(article,urlSheep);
assert.equal(parsed[0].destination,'FlyQuest');assert.equal(parsed[0].scope,'desk');assert.ok(parsed[0].authors.includes('wooloo'));
for(const alias of ['Toasty','Poby'])assert.ok(parsed.some(c=>c.player===alias&&RUMORS.tier(c)==='rumor'&&c.scope==='desk'));
const docIndex=Array.from({length:6},(_,i)=>'<a href="/en/articles/player-'+i+'-lcs/en">LoL LCS LEAK</a>').join('')+'<a href="/en/articles/vct-2027/en">VCT VALORANT LEAK</a>';
assert.equal(sheepIndex(docIndex).length,6);
let failedOnce=false;context.fetch=async u=>{
  if(String(u).includes('/all/leaks'))return new Response(docIndex);
  if(!failedOnce&&String(u).includes('player-0')){failedOnce=true;return new Response(null,{status:503})}
  return new Response(article);
};
const batch=await readSheep({},{});assert.equal(batch.partial,true);assert.equal(batch.checkpoint.queue.length,3);assert.equal(batch.checkpoint.backlog,true);
const resumed=await readSheep({},batch.checkpoint);assert.equal(resumed.checkpoint.queue.length,1);
resumed.checkpoint.queue[0].retryAt=0;
assert.equal((await readSheep({},resumed.checkpoint)).checkpoint.queue.length,0);
console.log('PASS public sources, local archive, article queue recovery.');
const LCK=vm.runInContext('LCK',context);
const subject=t=>({title:t,source:'해외 취재자 · LCK 담당',at});
for(const t of ['G2 explores new LEC roster','T1 출신 선수가 유럽 구단과 재계약','LCK reporter says G2 is in talks with Caps','KT어진이 전한 바이퍼의 거취','C9 signs a Korean player','C9 roster update #LCK','NAVI signs former Gen.G player for LEC','C9 signs player inspired by T1']){
  assert.equal(LCK.includes(subject(t)),false,t);
}
for(const t of ['Dplus KIA in talks with a new top laner','LCK 중위권 팀의 정글러 영입설','Faker set to join FlyQuest','페이커의 재계약 논의','韩华生命有意引援']){
  assert.equal(LCK.includes(subject(t)),true,t);
}
const migrated=publicFeed({claims:STOVE_TIPS,reviews:[subject('LEC roster changes'),subject('T1 코치 선임설')],events:[{...subject('C9 signs Caps'),kind:'press'},{...subject('Gen.G signs new top laner'),kind:'press'}]});
assert.equal(migrated.reviews.length,1);assert.equal(migrated.events.length,1);
const visible=migrated.rumorSources[0].claims;
for(const p of ['Poby','Toasty','Guigo','Smiley','Viper','Nuguri'])assert.ok(!visible.some(c=>c.player===p),p);
for(const p of ['Clear','Diable','Hwichan','Frog','Life','Zeus'])assert.ok(visible.some(c=>c.player===p),p);
assert.equal(visible.filter(c=>c.player==='Rooster').length,1);
assert.equal(visible.find(c=>c.player==='Rooster').team,'BFX');
const mixedArticle='<script type="application/ld+json">'+JSON.stringify({'@type':'NewsArticle',headline:'Rooster set to join G2 Esports for LEC 2027',datePublished:at,articleBody:'BNK FearX showed interest in Rooster. G2 also considered an academy player.'})+'</script>';
const relevant=LCK.batch({claims:parseSheepArticle(mixedArticle,urlSheep)}).claims;
assert.equal(relevant.length,1);assert.equal(relevant[0].team,'BFX');assert.equal(relevant[0].stage,'interest');
const body='<script type="application/ld+json">'+JSON.stringify({'@type':'NewsArticle',headline:'Hwichan set to join FlyQuest for LCS 2027',datePublished:at,articleBody:'Coming from KT Rolster Challengers, the midlaner was still under contract. Alex "Toasty" Chea and Yun "Poby" Sung-won were also considered.'})+'</script>';
const crossing=LCK.batch({claims:parseSheepArticle(body,urlSheep)}).claims;
assert.equal(crossing.length,1);assert.equal(crossing[0].originTeam,'KT');assert.equal(crossing[0].team,'');
assert.ok(LCK.isReport(crossing[0]));
assert.ok(!LCK.isReport({url:'https://www.inven.co.kr/board/lol/1234/5',form:'reading'}));
assert.ok(!RUMORS.board(crossing,initial).some(g=>g.player==='Hwichan'));
console.log('PASS LCK-only migration, mixed reports, source attribution, transfers out, Korean player aliases and press treatment.');


{
// Public embed verification must survive an index layout change or an unverified third-party link.
const snowflake = String((BigInt(Date.parse(at)) - 1288834974657n) << 22n);
const post = 'https://x.com/NS_RedForce/status/' + snowflake;
const row = '<tr><td>2026-11-19</td><td>Deft</td><td>영입 <a href="' + post + '">구단 X</a></td></tr>';
const indexMarkup = '<h2>오피셜</h2><table>' + row + '</table><h2>커뮤니티 썰</h2><table>'+row+'</table>';
let author = 'NS_RedForce', body = 'Welcome, Deft!', failed = false, embeds = 0;
context.fetch = async (input, options) => {
  assert.equal(new Headers(options?.headers).has('Authorization'), false);
  if (String(input).startsWith('https://dugout26.github.io/')) return new Response(indexMarkup);
  assert.ok(String(input).startsWith('https://publish.twitter.com/oembed?'));
  embeds++;
  if (failed) return new Response('', {status: 503});
  return Response.json({author_url: 'https://x.com/' + author, html: '<p>' + body + '</p>'});
};
const verified = await freeIndex({}, {});
assert.equal(verified.events[0].kind, 'in');
assert.equal(verified.events[0].player, 'Deft');
await freeIndex({}, verified.checkpoint);
assert.equal(embeds, 1);
author = 'unaffiliated';
assert.equal((await freeIndex({}, {})).events.length, 0);
author = 'NS_RedForce'; body = 'Welcome, Raptor!';
assert.equal((await freeIndex({}, {})).reviews.length, 1);
failed = true;
const inaccessible = await freeIndex({}, {});
assert.equal(inaccessible.partial, true);
assert.equal(inaccessible.events.length, 0);
assert.equal(inaccessible.reviews.length, 1);
console.log('PASS free X verification, fallback reviews and cache.');


}
