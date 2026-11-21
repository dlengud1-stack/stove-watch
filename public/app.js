(function startStoveWatch() {
  'use strict';
  if (typeof KOREAN==='undefined') {
    const loader=document.createElement('script');
    loader.src=new URL('korean.js',document.currentScript?.src || document.baseURI).href;
    loader.onload=startStoveWatch;
    document.head.append(loader);
    return;
  }
  const $ = s => document.querySelector(s);
  const esc = v => String(v ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const glyphs = {
    star:'<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>',
    clock:'<circle cx="12" cy="12" r="8.5"/><path d="M12 7v5l3.5 2"/>', bolt:'<path d="m13.6 2.8-9 11.4h6.7l-.9 7 9-12.2h-6.5z"/>',
    flame:'<path d="M13 2c1 6-4 6.3-3 11-2.1-.7-2.8-2.2-2.8-4.1C1.7 15 5.6 22 12 22c7.2 0 11.1-7.2 6.2-13-.6 2-1.4 3-3.1 3.7C17.2 7.3 14.6 4.4 13 2z"/>',
    external:'<path d="M13 4h7v7m0-7-9 9m-3-7H5v13h13v-3"/>', refresh:'<path d="M4 10a8 8 0 0 1 13.5-4.5L20 8m0-5v5h-5M20 14a8 8 0 0 1-13.5 4.5L4 16m0 5v-5h5"/>',
    activity:'<path d="M2 12h5l3-7 4 14 3-7h5"/>',grid:'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
    down:'<path d="m6 9 6 6 6-6"/>',close:'<path d="m6 6 12 12m0-12L6 18"/>',signal:'<path d="M4 19v-4m5 4v-7m5 7V9m5 10V5"/>',
    log:'<rect x="5" y="4" width="14" height="16" rx="2"/><path d="M9 9h6m-6 5h6"/>',flag:'<path d="M5 21V4m.4 1c6-4 8 3 14-1v10c-6 4-8-3-14 1"/>',
    TOP:'<path d="m4 4 16 0-4 4H8v8l-4 4z"/><path d="m11 16 5-5v5z"/>',JGL:'<path d="m4 4 4 3 2 6 1-10 4 5-1 6 6-7-2 10-6 5-6-6z"/>',MID:'<path d="M4 16 16 4h4v4L8 20H4z"/><path d="M5 8V5h3m8 14h3v-3"/>',BOT:'<path d="m20 20-16 0 4-4h8V8l4-4z"/><path d="m13 8-5 5V8z"/>',SUP:'<path d="m3 7 7 2 2-5 2 5 7-2-4 6-3-1-2 8-2-8-3 1z"/>'
  };
  const logo = '<svg viewBox="0 0 32 34" aria-hidden="true"><path fill="#ff7242" d="M13 1h5v5h4v7h3v-4h3v8h3v9h-4v4h-5v3H10v-3H5v-4H2v-9h4v-6h4v6h3V9h3V5h-3z"/><path fill="#ffbd6a" d="M17 14h3v6h3v-2h2v8h-4v3h-8v-3H9v-6h4v3h2v-6h2z"/></svg>';
  const icon = name => name==='brand'?logo:'<svg viewBox="0 0 24 24" aria-hidden="true">'+(glyphs[name]||'')+'</svg>';
  document.querySelectorAll('[data-icon]').forEach(el=>el.innerHTML=icon(el.dataset.icon));
  const {teams,roles,labels,events:seed}=STOVE;
  const get=(key,def)=>{try {const v=localStorage.getItem('sw27.'+key);return v===null?def:JSON.parse(v)}catch{return def}};
  const save=(key,value)=>{try{localStorage.setItem('sw27.'+key,JSON.stringify(value))}catch{}};
  let translations=get('koreanTranslations', {});
  if (!translations || typeof translations!=='object' || Array.isArray(translations)) translations={};
  function ko(value) {
    if (!value) return '';
    return KOREAN.lookup(value,translations) || '한국어 번역 대기 중';
  }
  function translatedEvidence(value) {
    if (!value) return '';
    const translated=ko(value);
    if(translated===value) return '<p>'+esc(value)+'</p>';
    const label=KOREAN.edited.has(value)?'원문 보기':KOREAN.lookup(value,translations)?'자동 번역 · 원문 보기':'원문 보기';
    return '<p>'+esc(translated)+'</p><details class="evidence-meta"><summary>'+label+'</summary><p lang="">'+esc(value)+'</p></details>';
  }
  const safeUrl=url=>{try{const u=new URL(url); return u.protocol==='https:' ? u.href : ''}catch{return ''}};
  const storedWatched=get('stars',[]);let watched=Array.isArray(storedWatched)?storedWatched.filter(t=>teams[t]):[];
  let focusTeam=watched[0]||'GEN', filtering='all',onlyWatch=false,limit=7,selectedDay='',modalMode='',busy=false;
  let events=[],current=[],latest=null,health=null;
  let groups=[],rosterMode=get('rosterMode','forecast')==='official'?'official':'forecast';
  let rumorCache=get('rumorSources',{});
  if(!rumorCache||typeof rumorCache!=='object'||Array.isArray(rumorCache))rumorCache={};
  const kst = ts=>new Date(new Date(ts).getTime()+32400000).toISOString();
  const day=t=>kst(t).slice(0,10), hm=t=>kst(t).slice(11,16);
  const displayDate=t=>t.slice(5,7)+'월 '+t.slice(8,10)+'일';
  const isOfficial=LEDGER.official, fingerprint=LEDGER.fingerprint;
  function merge(incoming){
    const browsable=LCK.matcher(incoming);
    events=LEDGER.merge([...seed,...LEDGER.contractEvents(),...incoming].filter(browsable));current=events.filter(e=>isOfficial(e)&&e.links.some(l=>l.primary));latest=current[0];
    const live=Object.values(rumorCache).filter(Array.isArray).flat();
    statements=RUMORS.statements(live,Date.now(),browsable);groups=RUMORS.board(live,current);
  }
  function eventRow(e,first=false) {
    const team=teams[e.team];
    const official=isOfficial(e);
    const start=e.tip?'<button type="button" data-tip="'+esc(e.tip)+'"':official?'<button data-official="'+esc(e.id)+'"':e.claim?'<button type="button" data-claim="'+esc(e.claim)+'"':'<a href="'+esc(safeUrl(e.url))+'" target="_blank" rel="noopener noreferrer"';
    return start+' class="event'+(first?' featured':'')+'"><time datetime="'+esc(e.at)+'">'+(e.dateOnly?'시각 미상':hm(e.at))+'</time><div><div class="chips"><span class="pill '+e.kind+'">'+esc((official?'오피셜 · ':'')+labels[e.kind])+'</span>'+ (team?'<span class="team-tag" style="--team:'+team.color+'">'+team.id+'</span>':'')+(e.player?'<span class="player-tag">'+esc(e.player)+'</span>':'')+'</div><h3>'+esc(ko(e.title))+'</h3><small>'+esc(e.source)+(official?' · 근거 '+e.links.length+'개':'')+'</small></div><span class="ext">'+icon(e.claim?'log':'external')+'</span>'+(official||e.claim||e.tip?'</button>':'</a>');
  }
  function showTimeline(){
    tipControls();
    const follows=c=>!onlyWatch||[c.team,c.originTeam,...(c.relatedTeams||[])].some(t=>watched.includes(t));
    const items=statements.filter(c=>!c.closed&&follows(c));
    const reports=items.filter(LCK.isReport);
    const covered=new Set(reports.flatMap(c=>[RUMORS.canon(c.url),RUMORS.canon(c.originUrl||c.url)]));
    const news=events.filter(e=>follows(e)&&(e.kind!=='press'||!covered.has(RUMORS.canon(e.url))));
    const visible=items.filter(showCommunityClaim);
    const active=groups.filter(g=>g.status==='active'&&follows(g)).flatMap(g=>{
      if(g.kind!=='rumor'||includeDiscussion)return [eventFromGroup(g)];
      const evidence=g.evidence.filter(isTransferTip);
      if(!evidence.length)return [];
      return [eventFromGroup({...g,evidence,at:evidence[0].at,dateOnly:evidence[0].dateOnly})];
    });
    let values;
    if(filtering==='media')values=[...news.filter(e=>e.kind==='press'),...tipRows(reports)];
    else if(filtering==='rumor')values=tipRows(visible.filter(c=>RUMORS.tier(c)==='rumor'&&(tipSource==='any'||tipChannel(c)===tipSource)));
    else if(filtering==='near')values=[...active.filter(e=>e.kind==='near'),...tipRows(items.filter(c=>c.scope==='desk'&&RUMORS.tier(c)==='near'))];
    else if(filtering==='all')values=[...news,...active,...tipRows(visible.filter(c=>c.scope==='desk'))];
    else values=news.filter(e=>filtering==='official'?isOfficial(e):e.kind===filtering);
    values.sort((a,b)=>Date.parse(b.at)-Date.parse(a.at));
    let last='';
    $('#timeline').innerHTML=values.slice(0,limit).map((e,i)=>{const d=day(e.at),header=d!==last?'<div class="day-head">'+displayDate(d)+' <span>'+d.slice(0,4)+'</span></div>':'';last=d;return header+eventRow(e,i===0&&isOfficial(e))}).join('')||'<div class="empty">'+(onlyWatch&&!watched.length?'관심 팀을 고르면 이곳에서 해당 팀 소식만 볼 수 있어요.<button data-edit-stars>관심 팀 선택</button>':'이 조건에서 확인한 소식이 없습니다.')+'</div>';
    $('#more').hidden=values.length<=limit;
    $('#filters').innerHTML=[['all','전체'],['official','오피셜'],['near','거피셜'],['rumor','찌라시'],['media','보도'],['video','구단 영상']].map(([v,t])=>'<button data-filter="'+v+'" aria-pressed="'+(v===filtering)+'">'+t+'</button>').join('');
    $('#onlyWatch').setAttribute('aria-pressed',String(onlyWatch));
  }
  function slotsFor(id){return LEDGER.slots(id,current)}
    const statusText={active:'추적 중',confirmed:'오피셜 전환',ended:'가능성 종료',settledIndex:'색인 종료'};
  const rank={near:0,report:1,rumor:2};
  function badge(kind){return '<span class="pill '+kind+'">'+esc(labels[kind])+'</span>'}
  function link(url,label){const href=safeUrl(url);return href?'<a class="evidence-link" target="_blank" rel="noopener noreferrer" href="'+esc(href)+'">'+esc(label)+icon('external')+'</a>':''}
  let tipSource='any',statements=[];
  let includeDiscussion=get('communityDiscussion',false)===true;
  const communityDomains=[...new Set(WATCHLIST.communities.map(c=>c.domain))];
  const playerLabels=Object.values(LCK.playerNames).concat(['클라우드','스카웃','너구리','씨맥','감독','코치']);
  const playerIds=new Set(Object.keys(LCK.playerNames).concat(['Cloud','Scout','Nuguri','cvMax','SMK']).map(name=>name.toLowerCase()));
  const sourceAliases=WATCHLIST.people.flatMap(p=>p.aliases||[]).filter(v=>v.length>=2).map(v=>v.toLowerCase());
  const rosterClaim=/영입|이적|재계약|계약|협상|협의|오퍼|접촉|합류|복귀|복귀설|콜업|승격|잔류|방출|은퇴|트레이드|바이아웃|입단|결렬|물망|노린|노리|행선지|팀을\s*떠|[가-힣A-Za-z0-9](?:행|행설)(?:[^\p{L}]|이|을|은|$)|\b(?:join(?:s|ing)?|sign(?:s|ed|ing)?|talks|offer(?:ed)?|agreement|renew(?:al|ed)?|transfer|leav(?:e|ing)|retir(?:e|es|ing)|trade|return(?:s|ing)?|contract)\b|加盟|加入|签约|簽約|续约|續約|转会|轉會|接触|接觸|沟通|溝通|报价|報價|离队|離隊|退役|重返|回归|回歸|回LCK|洽谈|争取|爭取|落笔|落筆|锁定|鎖定|租借/iu;
  const lineup=/로스터|라인업|행선지|차기\s*팀|阵容|陣容|名单|名單|\b(?:roster|lineup)\b/i;
  const attribution=/에\s*따르면|피셜|(?:기자|관계자|소식통|에이전트|썰쟁이|지인)(?:발|가|는|이|에\s*따르면|한테|에게|[)\s:：])|(?:방송|인터뷰|기사)(?:에서|발)|전해\s*들|들었|들[은린]\s*썰|제보|단독|유출|소식통|전언|(?:영입|이적|복귀|은퇴|합류|계약|행)설|한다더라|한다는\s*(?:썰|말|얘기)|\b(?:sources?|insider|reportedly|report(?:s|ed)?|leak(?:s|ed)?|according to)\b|爆料|消息|小道|传闻|傳聞|据报|據報|韩媒|韓媒|外媒|透露/i;
  const commitment=/구두\s*합의|협상\s*(?:중|결렬|재개|불발)|(?:영입|합류|복귀|은퇴|재계약|이적|계약)\s*(?:임박|유력|예정|합의|불발|확정|거절|결렬)|오퍼(?:를)?\s*(?:넣|보냈|받|제시)|접촉(?:했|한|중)|계약(?:을)?\s*체결|(?:이적|영입|재계약|합류|복귀|잔류|은퇴)(?:한대|한다더라|한다던데|하기로)|\b(?:in talks|set to join|verbal agreement|agreed to|offered a contract)\b|即将|即將|大概率|确定签约|確定簽約|达成协议|達成協議|有望加盟/i;
  const discussion=/[?？]|어떰|어떻게\s*생각|어떨까|아니냐|맞(?:냐|음)|뭐[임냐]|궁금|개인적|갠적|상상해|만약|가정해|내가\s*예상|내\s*(?:희망|예상)|희망\s*(?:로스터|회로)|(?:영입|복귀|이적|합류)(?:하면|한다면)|했으면|좋겠|같은데|같지\s*않|거\s*같|더\s*(?:세|쎄|강)|마음에\s*듬|[ㅋㅎ]{2,}|如何评价|怎么评价|怎麼評價|怎么看|怎麼看|要是|假如|我觉得|我覺得|\b(?:what if|wish|hope|my prediction|thoughts|should|imagine)\b/i;
  const recap=/스토브\s*(?:현황|정리)|(?:이적시장|이적\s*현황)\s*(?:총?정리|업데이트)|(?:^|[\s)\]])오피셜\s*[):：]|发布人员变动公告|發布人員變動公告|发布.{0,25}(?:告别|祝福)视频|發布.{0,25}(?:告別|祝福)影片|각\s*팀.{0,8}로스터\s*(?:정리|모음)/i;
  function boardUrl(url){
    const host=LCK.hostOf(url);
    if(host==='inven.co.kr'||host.endsWith('.inven.co.kr'))return /\/board\//i.test(url);
    return communityDomains.some(domain=>host===domain||host.endsWith('.'+domain));
  }
  function tipChannel(c){
    if(boardUrl(c.originUrl||c.url))return 'community';
    if(LCK.isReport(c))return 'media';
    if(c.form==='reading'||RUMORS.people[c.person]?.type==='커뮤니티'||/커뮤니티|갤러리|게시판/.test(c.source||''))return 'community';
    return 'people';
  }
  function isTransferTip(c){
    if(tipChannel(c)!=='community')return true;
    if(c.form==='index')return false;
    const original=c.passage?c.note:(c.topic||c.note||'');
    if(!original||recap.test(original))return false;
    const segments=original.split(/[。！!；;]|(?<=[?？])\s*/u).map(part=>part.trim()).filter(Boolean);
    const namedSource=Boolean(c.person||c.authors?.length||c.mentions?.length)||sourceAliases.some(name=>original.toLowerCase().includes(name));
    const quoted=namedSource||attribution.test(original)||/쉽이스포츠|羊刀社|Sheep\s*Esports/i.test(original)||Boolean(c.originUrl&&c.originUrl!==c.url);
    // Some titles introduce the source in one sentence and the claim in the next.
    const hasTeam=Boolean(c.team||c.originTeam||c.destination)||LCK.teamIds(original).length>0||/\bLCK\b|韩华|韓華|한화|딮기|키움/i.test(original);
    const hasPerson=Boolean(c.player)||playerLabels.some(name=>original.includes(name))||
      (original.match(/[a-z][a-z0-9]*/gi)||[]).some(word=>playerIds.has(word.toLowerCase()));
    if(!c.topic&&c.person&&c.player&&c.team&&['direct','relay','reading'].includes(c.form))return true;
    return segments.some(part=>{
      if(discussion.test(part))return false;
      const action=rosterClaim.test(part);
      const namedLineup=hasPerson&&hasTeam&&/(?:이라|라고)\s*(?:했|전했)|(?:GEN|KRX|DK|T1)[锁盯]/i.test(part);
      if(quoted&&(hasPerson||hasTeam)&&(action||lineup.test(part)||namedLineup||/발표|힌트|官宣|优先选择LCK|優先選擇LCK/i.test(part)))return true;
      if(!hasPerson||!hasTeam)return false;
      if(commitment.test(part))return true;
      return part.length<=65&&/(?:영입|합류|복귀|재계약|은퇴|계약\s*종료|행\s*유력)(?:[.!…]|$)|(?:退役|续约|續約|离队|離隊)$/.test(part);
    });
  }
  function showCommunityClaim(c){
    return includeDiscussion||isTransferTip(c);
  }
  function sourceName(c){
    const names=[...new Set([c.person,...(c.authors||[])].map(id=>RUMORS.people[id]?.name).filter(Boolean))];
    const by=names.join(' · ')||c.byline||'';
    return [by,c.source||''].filter((s,i)=>s&&(i===0||!by.includes(s))).join(' · ')||'커뮤니티 전언';
  }
  function tipTitle(c){
    if(c.passage)return [c.team&&teams[c.team]?.name,c.player,RUMORS.stages[c.stage]].filter(Boolean).join(' · ')+(c.team||c.player?'':' · '+ko(c.note).slice(0,100));
    return c.topic ? ko(c.topic) : [c.team,c.player,RUMORS.stages[c.stage]].filter(Boolean).join(' · ');
  }
  function tipRows(items){
    const byArticle=new Map();
    for(const c of items){
      const key=RUMORS.canon(c.originUrl||c.url),group=byArticle.get(key)||[];
      group.push(c);byArticle.set(key,group);
    }
    return [...byArticle.entries()].map(([key,items])=>{
      const c=items.find(v=>v.form==='direct'&&!v.passage&&v.topic)||items.find(v=>!v.originUrl&&v.topic)||items[0];
      return {tip:key,kind:RUMORS.tier(c),url:c.url,team:c.team||c.originTeam,player:c.player,at:c.at,dateOnly:c.dateOnly,
        title:tipTitle(c),source:(c.originTeam?'원소속 '+(c.originLabel||teams[c.originTeam].name)+' · ':'')+sourceName(c)+' · '+[...new Set(items.map(v=>RUMORS.stages[v.stage]))].join(' / ')+(items.length>1?' · 언급 '+items.length+'건':'')};
    });
  }
  function articleDetail(key){
    const items=statements.filter(c=>RUMORS.canon(c.originUrl||c.url)===key||RUMORS.canon(c.url)===key);
    if(!items.length)return;
    const first=items.find(c=>!c.originUrl)||items[0],heading=tipTitle(first);
    const blocks=items.map(c=>{
      const origin=c.originUrl?link(c.url,'전달 게시물')+' '+link(c.originUrl,'인용된 원문'):'';
      const mentioned=(c.mentions||[]).filter(id=>id!==c.person&&!(c.authors||[]).includes(id)).map(id=>RUMORS.people[id]?.name).filter(Boolean);
      const group=c.scope!=='desk'&&groups.find(g=>g.id===RUMORS.key(c));
      const status=group?'<button class="candidate-link" data-claim="'+esc(group.id)+'">'+esc(group.team+' · '+group.player+' · '+statusText[group.status])+'</button>':'';
      return '<article class="evidence-item"><div class="evidence-top">'+badge(RUMORS.tier(c))+'<strong>'+esc(RUMORS.stages[c.stage])+'</strong></div>'+translatedEvidence(c.note||c.topic)+'<span class="evidence-meta">'+esc(sourceName(c)+' · '+(RUMORS.forms[c.form]||'출처 기록'))+'</span>'+(mentioned.length?'<p class="evidence-meta">본문에 언급된 인물 · '+esc(mentioned.join(', '))+'</p>':'')+((c.originTeam&&teams[c.originTeam])?'<p class="evidence-meta">원소속 · '+esc(c.originLabel||teams[c.originTeam].name)+'</p>'+(c.originProof?link(c.originProof,'원소속 근거'):''):'')+status+origin+'</article>';
    }).join('');
    setModal(heading,'<p class="evidence-meta">'+esc(day(first.at)+(first.dateOnly?'':' '+hm(first.at)+' KST')+(first.observed?' · 최초 감지':' · 게시일'))+'</p>'+link(first.originUrl||first.url,'기사·게시물 원문')+blocks);
  }
  function tipControls(){
    const section=$('#tipControls');
    section.hidden=filtering!=='all'&&filtering!=='rumor';
    if(section.hidden)return;
    const sources=filtering==='rumor'?'<div role="group" aria-label="출처 유형">'+[['any','모든 출처'],['media','언론'],['people','기자·SNS'],['community','커뮤니티']].map(([key,title])=>'<button data-origin="'+key+'" aria-pressed="'+(key===tipSource)+'">'+title+'</button>').join('')+'</div>':'';
    const canFilter=filtering==='all'||tipSource==='any'||tipSource==='community';
    const quality='<div role="group" aria-label="커뮤니티 글 필터"><span class="meta-note">커뮤니티 글</span>'+
      [['tips','이적 제보만'],['all','팬 반응 포함']].map(([key,label])=>'<button type="button" data-community="'+key+'" aria-pressed="'+((key==='all')===includeDiscussion)+'">'+label+'</button>').join('')+'</div>';
    section.innerHTML=sources+(canFilter?quality:'');
  }

  function eventFromGroup(g){
    const best=g.evidence.find(c=>RUMORS.tier(c)===g.kind)||g.evidence[0];
    return {kind:g.kind,team:g.team,player:g.player,at:g.at,dateOnly:g.dateOnly,claim:g.id,
      title:teams[g.team].name+' · '+g.player+' '+(g.kind==='near'?'합류 유력':g.kind==='report'?'합류 관련 보도':'합류설'),
      source:sourceName(best)+' · '+RUMORS.stages[best.stage],url:best.url};
  }
  function setModal(title,html){
    $('#modalTitle').textContent=title;$('#modalBody').innerHTML=html;
    if(!$('#modal').open)$('#modal').showModal();
  }
  function detail(id){
    const g=groups.find(c=>c.id===id);if(!g)return;
    modalMode='evidence';
    const samePlayer=groups.filter(c=>c.status==='active'&&c.player.toLowerCase()===g.player.toLowerCase()&&c.team!==g.team);
    const rivals=groups.filter(c=>c.status==='active'&&c.team===g.team&&c.role&&c.role===g.role&&c.player!==g.player);
    const paths=[...(g.history||g.evidence),...g.closures].sort((a,b)=>Date.parse(b.at)-Date.parse(a.at)).map(c=>{
      const who=sourceName(c);
      const form=c.closed?'정정·종료 기록':RUMORS.forms[c.form]||'색인 링크';
      return '<article class="evidence-item"><div class="evidence-top">'+badge(RUMORS.tier(c))+'<strong>'+esc(who)+'</strong></div><span class="evidence-meta">'+esc(day(c.at))+(c.dateOnly?'':' '+hm(c.at)+' KST')+(c.observed?' 최초 감지':'')+' · '+esc(form)+' · '+esc(RUMORS.stages[c.stage])+'</span>'+translatedEvidence(c.note)+link(c.url,c.form==='direct'?'최초 출처 보기':c.form==='reading'?'팬 해석 글 보기':c.form==='relay'?'재인용 기록 보기':'연결된 출처 보기')+(c.indexUrl?' '+link(c.indexUrl,'수집 색인'):'')+'</article>';
    }).join('');
    const alt=(a)=>'<button class="candidate-link" data-claim="'+esc(a.id)+'">'+esc(teams[a.team].id+' '+a.player)+'</button>';
    const why=g.kind==='near'?'거피셜 근거 · 추적 소식통의 직접 발언이나 기명 취재에서 이 선수의 합의·합류를 구체적으로 전했습니다.':g.kind==='report'?'보도 근거 · 기명 취재에서 거론된 선수입니다. 기사에 명시된 협상 단계를 아래에 표시합니다.':'찌라시 근거 · 후보와 접촉, 발언·전언을 원문에 나온 단계로 기록합니다.';
    const closed=g.status==='active'?'':'<p class="case-state">'+statusText[g.status]+' '+link(g.resolution,'결과 확인')+'</p>';
    const also=rivals.length?'<p class="related">같은 포지션의 다른 후보 '+rivals.map(alt).join(' · ')+'</p>':'';
    const other=samePlayer.length?'<p class="related">다른 행선지 '+samePlayer.map(alt).join(' · ')+'</p>':'';
    setModal(g.player+' · '+teams[g.team].name,'<div class="case-summary">'+badge(g.kind)+' <span>'+esc(g.role||'포지션 미확인')+' · '+esc(statusText[g.status])+'</span></div><p class="tier-explain">'+why+'</p>'+closed+also+other+paths);
  }
  function rosterModeButtons(){
    return [['forecast','예상 로스터'],['official','확정 로스터']].map(([v,t])=>'<button data-mode="'+v+'" aria-pressed="'+(rosterMode===v)+'">'+t+'</button>').join('');
  }
  function roleRows(id,players,i){
    const role=roles[i],predict=rosterMode==='forecast';
    const candidates=predict?groups.filter(g=>g.status==='active'&&g.role===role&&g.team===id&&!players.some(p=>p.name.toLowerCase()===g.player.toLowerCase())).sort((a,b)=>rank[a.kind]-rank[b.kind]):[];
    const head='<span class="role">'+icon(role)+role+'</span>';
    const confirmed=players.map(p=>{
      const elsewhere=predict?groups.filter(g=>g.status==='active'&&g.player.toLowerCase()===p.name.toLowerCase()&&g.team!==id):[];
      const departure=elsewhere.map(g=>'<button class="outlook" data-claim="'+esc(g.id)+'">'+esc(g.team)+' 이적설</button>').join(' ');
      return '<div class="slot confirmed">'+head+'<strong><button class="player-proof" data-proof="'+esc(id+'|'+p.name)+'">'+esc(p.name)+'</button>'+departure+'</strong><span class="contract'+(p.kind==='existing'?'':' new')+'">'+esc(p.kind==='existing'?'기존 계약':'오피셜 · '+p.label)+(p.until?'<small>'+p.until+'년까지</small>':'')+'</span></div>';
    }).join('');
    const projected=candidates.map(g=>'<button class="slot forecast-slot" data-claim="'+esc(g.id)+'">'+head+'<strong>'+esc(g.player)+'</strong>'+badge(g.kind)+'</button>').join('');
    if(!confirmed&&!projected)return '<div class="slot">'+head+'<strong class="pending">'+(predict?'후보 미확인':'발표 대기')+'</strong><span></span></div>';
    return confirmed+projected;
  }
  const domesticPeople=new Set(['ko','yoon','shin','kenzi','roll','yoo','kwon','kimminq','leeduh','parksangjin','bieung','dyumano','nonggal','fox','dong','lifehint','ashley']);
  function visiblePeople(){
    const inFeed=new Set(statements.flatMap(RUMORS.participants));
    return WATCHLIST.people.filter(p=>domesticPeople.has(p.id)||inFeed.has(p.id));
  }
  function peopleView(){
    $('#people').innerHTML=visiblePeople().map(({id:key})=>{
      const p=RUMORS.people[key];
      const active=groups.filter(g=>g.status==='active'&&g.evidence.some(c=>RUMORS.participants(c).includes(key)));
      return '<article class="panel source-card"><div class="source-type">'+esc(p.type)+'</div><h3>'+esc(p.name)+'</h3><small>'+esc(p.org)+'</small><p>'+esc(p.note)+'</p>'+link(p.url,'출처 보기')+(p.history&&domesticPeople.has(key)?'<div class="history"><strong>대조한 과거 사례</strong><p>'+esc(p.history[0])+'</p>'+link(p.history[1],'선행 기록')+' '+link(p.history[2],'발표 기록')+'</div>':'')+(active.length?'<div class="source-claims">'+active.map(g=>'<button class="candidate-link" data-claim="'+esc(g.id)+'">'+esc(g.team+' '+g.player)+'</button>').join('')+'</div>':'')+'</article>';
    }).join('');
    const closed=groups.filter(g=>g.status!=='active');
    $('#resolvedClaims').innerHTML=closed.length?closed.map(g=>'<button class="resolved-case" data-claim="'+esc(g.id)+'"><span>'+esc(g.team+' · '+g.player)+'</span><span>'+esc(statusText[g.status])+'</span></button>').join(''):'<p class="meta-note">결과를 대조한 이적설이 없습니다.</p>';
  }


  const platformLabel={x:'X',ig:'Instagram',youtube:'YouTube',media:'보도·자료'};
  const states={link:'계정 직접 보기',partial:'일부 기사 재시도',auth:'인증 필요',ok:'수집 정상',limited:'호출 제한',denied:'접근 거절',waiting:'첫 수집 대기',error:'재시도 대기'};
  let reviewItems=[],deskMode='clubs';
  function proofRows(links){
    return links.map(l=>'<div class="proof-row"><span>'+esc(platformLabel[l.platform]||'자료')+'</span>'+link(l.url,l.source||'원문')+(l.at?'<small>'+esc(day(l.at)+' '+hm(l.at))+'</small>':'')+'</div>').join('');
  }
  function showProof(team,player,eventId){
    const e=eventId&&current.find(v=>v.id===eventId);
    const p=e||slotsFor(team).flat().find(v=>v.name===player);
    if(!p)return;
    const related=groups.filter(g=>g.team===team&&g.player.toLowerCase()===player.toLowerCase());
    const stamp=p.asOf||p.at;
    setModal(player+' · '+teams[team].name,'<div class="case-summary"><span class="pill in">'+esc(p.kind==='existing'?'기존 계약':'오피셜 · '+labels[p.kind])+'</span></div><p class="tier-explain">'+esc(p.kind==='out'?'구단이 계약 종료를 발표했습니다. 새 소속은 별도 발표에서 확인합니다.':p.until?p.until+'년까지 계약이 확인됐습니다.':'계약 만료 연도 확인 중')+'</p>'+(stamp?'<p class="evidence-meta">기록 기준 '+esc(stamp.slice(0,10))+'</p>':'')+proofRows(p.links||[])+(related.length?'<h3>앞선 이적설</h3>'+related.map(g=>'<button class="candidate-link" data-claim="'+esc(g.id)+'">'+esc(g.player+' · '+statusText[g.status])+'</button>').join(''):''));
  }
  function status(s,fallback='첫 수집 대기'){
    if(!s)return '<small class="channel-status">'+esc(fallback)+'</small>';
    const stale=s.lastOk&&Date.now()-Date.parse(s.lastOk)>Math.max(30,s.minute*3)*60000;
    return '<small class="channel-status '+(s.ok&&!stale?'healthy':'')+'">'+esc(s.ok&&stale?'수집 지연':states[s.status]||fallback)+(s.lastOk?' · '+esc(day(s.lastOk).slice(5)+' '+hm(s.lastOk)):'')+'</small>';
  }
  function sourceDesk(){
    const healthFor=id=>(health||[]).find(s=>s.id===id);
    const manual={status:'link'};
    const recentSources=[...statements,...events,...reviewItems];
    const domains=new Set(recentSources.map(c=>LCK.hostOf(c.originUrl||c.url)));
    const hasDomain=d=>[...domains].some(h=>h===d||h.endsWith('.'+d));
    const media=WATCHLIST.media.filter(m=>m.lang==='ko'||hasDomain(m.domain)||recentSources.some(c=>c.source===m.name));
    const communities=WATCHLIST.communities.filter(c=>!['reddit.com','hupu.com'].includes(c.domain)||hasDomain(c.domain));
    const modes=[['clubs','구단',10],['media','언론',media.length],['insiders','발언자',visiblePeople().length],['community','커뮤니티',communities.length],['review','수집함',reviewItems.length]];
    $('#deskTabs').innerHTML=modes.map(([id,title,count])=>'<button data-desk="'+id+'" aria-pressed="'+(id===deskMode)+'">'+title+' <b>'+count+'</b></button>').join('');
    const offline=document.querySelector('meta[name="stove-preview"]')||location.protocol==='file:';
    const fallback=offline?'저장본 · 상태 미연결':'첫 수집 대기';
    const row=(href,name,s,desc)=>'<div class="desk-line"><div>'+link(href,name)+(desc?'<small>'+esc(desc)+'</small>':'')+'</div>'+status(s,fallback)+'</div>';
    let html='';
    if(deskMode==='clubs')html=Object.entries(CLUB_CHANNELS).map(([id,a])=>'<article class="panel desk-card"><h3><i style="background:'+teams[id].color+'"></i>'+id+' <small>'+esc(teams[id].name)+'</small></h3>'+[a.x,...(a.xAlso||[])].map(x=>row('https://x.com/'+x,'X · @'+x,manual)).join('')+row('https://www.instagram.com/'+a.ig+'/','Instagram · @'+a.ig,manual)+row('https://www.youtube.com/channel/'+a.youtube,'YouTube',healthFor('yt-'+id))+(a.xNote?'<small>'+esc(a.xNote)+'</small>':'')+'</article>').join('');
    if(deskMode==='media')html='<article class="panel desk-card wide"><h3>LCK 기사 검색</h3>'+['ko','en','zh'].map((l,i)=>'<div class="desk-line"><strong>'+['한국어','영어','중국어'][i]+'</strong>'+status(healthFor('open-'+l),fallback)+'</div>').join('')+'</article>'+media.map(m=>{
      const extra=m.domain==='sheepesports.com'?row('https://www.sheepesports.com/en/all/leaks','리크 기사 본문',healthFor('sheep'),'LCK 관련 발언')+row('https://x.com/Sheep_Esports','매체 X',manual):'';
      return '<article class="panel desk-card">'+row(m.proof,m.name,healthFor('media-'+m.domain),'LCK 관련 기사')+extra+'</article>';
    }).join('');
    if(deskMode==='community')html=communities.map(c=>'<article class="panel desk-card">'+row(c.proof,c.name,healthFor('community-'+(c.boardId||c.domain)),'게시판 새 글')+'</article>').join('');
    if(deskMode==='insiders')html=visiblePeople().map(p=>{
      const claims=statements.filter(c=>RUMORS.participants(c).includes(p.id));
      const sources=[...(p.x?[row('https://x.com/'+p.x,'X · @'+p.x,manual)]:[]),...(p.youtube?[row('https://www.youtube.com/channel/'+p.youtube,'YouTube',healthFor('yt-'+p.id))]:[]),...(p.weibo?[row(p.profile,'웨이보 원계정',manual)]:[])];
      return '<article class="panel desk-card"><h3>'+esc(p.name)+'</h3><small>'+esc(p.role)+'</small>'+sources.join('')+row(p.profile||p.proof,'공개 출처 · 이름 언급 기사',healthFor('person-'+p.id),'이름 언급 기사 추적')+'<button class="candidate-link" data-person="'+esc(p.id)+'">발언 흐름 '+claims.length+'건</button></article>';
    }).join('');
    if(deskMode==='review')html=reviewItems.length?reviewItems.map(r=>'<article class="panel desk-card">'+link(r.url,ko(r.title))+'<small>'+esc(r.source+' · '+r.reason+' · '+day(r.at)+' '+hm(r.at))+'</small></article>').join(''):'<p class="meta-note">아직 수신한 새 게시물이 없습니다. 수집기가 확인한 기사와 판독이 필요한 게시물이 여기에 쌓입니다.</p>';
    $('#deskBody').innerHTML=html;
  }
  function personFlow(id){
    const p=WATCHLIST.people.find(v=>v.id===id);if(!p)return;
    const flow=statements.filter(c=>RUMORS.participants(c).includes(id));
    const html=flow.map(e=>{
      const label=e.person===id||(e.authors||[]).includes(id)?(RUMORS.forms[e.form]||'출처 기록'):'다른 출처에서 언급';
      return '<article class="evidence-item"><div class="evidence-meta">'+esc(day(e.at)+(e.dateOnly?'':' '+hm(e.at))+' · '+label)+'</div><button class="candidate-link" data-tip="'+esc(RUMORS.canon(e.originUrl||e.url))+'">'+esc(tipTitle(e))+'</button>'+translatedEvidence(e.note)+link(e.url,'원문')+'</article>';
    }).join('');
    setModal(p.name+' · 발언 흐름',html||'<p>선수와 행선지를 대조한 발언이 아직 없습니다.</p>'+link(p.profile||p.proof,'공개 출처 보기'));
  }

  function card(id){
    const team=teams[id];
    return '<div class="roster-body" style="--team:'+team.color+'"><div class="club"><div class="club-emblem">'+id+'</div><div><h3>'+esc(team.name)+'</h3><small>2027 ROSTER</small></div><button class="club-star" data-star="'+id+'" aria-label="'+team.name+' 관심 팀" aria-pressed="'+watched.includes(id)+'">'+icon('star')+'</button></div>'+
      slotsFor(id).map((players,i)=>roleRows(id,players,i)).join('')+'</div>';
  }
  function showRoster(){
    $('#teamPicks').innerHTML=Object.values(teams).map(t=>'<button style="--team:'+t.color+'" class="'+(t.id===focusTeam?'active':'')+'" aria-pressed="'+(t.id===focusTeam)+'" data-team="'+t.id+'">'+t.id+'</button>').join('');
    $('#miniSwitch').innerHTML=$('#boardSwitch').innerHTML=rosterModeButtons();
    $('#rosterMini').innerHTML=card(focusTeam);
    $('#allRosters').innerHTML=Object.keys(teams).map(id=>'<article class="panel">'+card(id)+'</article>').join('');
    $('#watchCount').textContent=watched.length?' '+watched.length:'';
  }
  function archive(){
    const days=[...new Set(current.map(e=>day(e.at)))];
    if(!days.includes(selectedDay))selectedDay=days[0]||'';
    $('#archiveDates').innerHTML=days.map(d=>'<button data-date="'+d+'" class="'+(d===selectedDay?'active':'')+'" aria-pressed="'+(d===selectedDay)+'">'+displayDate(d)+' · '+current.filter(e=>day(e.at)===d).length+'건</button>').join('');
    $('#archiveFeed').innerHTML=current.filter(e=>day(e.at)===selectedDay).map(e=>eventRow(e)).join('')||'<div class="empty">기록된 발표가 없습니다.</div>';
  }
  function metrics(){const today=day(Date.now());
    $('#metrics').innerHTML=[['bolt','오늘의 오피셜',current.filter(e=>day(e.at)===today).length,'건'],['log','누적 오피셜',current.length,'건'],['flag','추적 중인 팀',Object.keys(teams).length,'팀']].map(([ic,name,num,unit])=>'<div class="metric"><span class="metric-name">'+icon(ic)+name+'</span><span class="metric-value">'+num+'<small>'+unit+'</small></span></div>').join('');
  }
  function hero(){
    if(!latest) return;
    $('#latestText').textContent=ko(latest.title);$('#latestEvent').href=latest.url;$('#latestEvent').target='_blank';$('#latestEvent').rel='noopener';
    $('#stokes').textContent=Number(get('fire-'+latest.id,0))||0;
    tick();
  }
  let clockDay='';
  function tick(){
    const now=Date.now(), secs=latest?Math.max(0,Math.floor((now-Date.parse(latest.at))/1000)):0;
    for(const [id,n] of [['hours',Math.floor(secs/3600)],['minutes',Math.floor(secs/60)%60],['seconds',secs%60]]){const t=String(n).padStart(2,'0');if($('#'+id).textContent!==t)$('#'+id).textContent=t}
    const stamp=kst(now);$('#dateClock').textContent=stamp.slice(0,10).replaceAll('-','.')+'  '+stamp.slice(11,16);
    if(clockDay!==stamp.slice(0,10)){clockDay=stamp.slice(0,10);metrics()}
  }
  function render(){showTimeline();showRoster();metrics();archive();peopleView();sourceDesk();hero()}
  function routing(){
    const page=['rosters','records','sources'].includes(location.hash.slice(1))?location.hash.slice(1):'live';
    for(const id of ['live','rosters','records','sources']){ $('#'+id+'View').hidden=id!==page; const a=$('[data-tab="'+id+'"]');if(id===page)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current')}
  }
  function modal(mode){modalMode=mode;
    $('#modalTitle').textContent=mode==='watch'?'관심 팀 선택':'집계 기준';
    $('#modalBody').innerHTML=mode==='watch'?'<p class="modal-note">응원하는 팀을 고르면 타임라인에서 모아볼 수 있어요. 이 기기에 저장됩니다.</p><div class="modal-picks">'+Object.values(teams).map(t=>'<button data-star="'+t.id+'" aria-pressed="'+watched.includes(t.id)+'">'+icon('star')+esc(t.name)+'</button>').join('')+'</div>':'<ul class="rules"><li>LCK 구단의 영입·방출·계약과 이번 이적시장의 해외 진출을 다룹니다. 해외 기사에서는 LCK와 직접 관련된 발언만 표시합니다. 쉽이스포츠를 포함한 언론 기사는 보도에서 볼 수 있습니다.</li><li>선수 영입·재계약·계약 종료가 확인되면 오피셜로 집계합니다. 시계는 확인된 발표 시각을 기준으로 움직입니다.</li><li>구단 원문과 이를 인용한 기사, <a href="https://dugout26.github.io/prosetup/stove-2027.html" target="_blank" rel="noopener">프로셋업</a>의 구단 원문 연결 기록을 참고합니다. 보도와 구단 영상은 별도로 표시합니다.</li><li>거피셜은 추적하는 취재자·방송인이 직접 전한 구체적인 합의 또는 합류 소식입니다. 누군가 거론한 후보, 접촉, 오퍼, 전언은 찌라시에서 원문과 함께 볼 수 있습니다. 같은 기사에 나온 구두 합의와 다른 후보는 따로 표시합니다. 같은 원 발언이 반복 인용돼도 등급은 오르지 않습니다.</li><li>무료 수집기는 구단 유튜브, 보도, 공개 게시판과 이적 색인을 확인합니다. X는 색인에 실린 공개 원문을 대조합니다. 인스타그램·웨이보는 계정 링크와 재인용을 볼 수 있습니다. 소식통에서 채널별 연결 상태와 마지막 성공 시각을 볼 수 있습니다. 웹 화면은 60초마다 저장된 수집 결과를 읽습니다.</li><li>발표 대기는 이번 시즌 계약을 확인할 자료가 부족한 자리입니다. 장작 수와 관심 팀은 이 기기에 저장됩니다.</li></ul>';
    if(!$('#modal').open)$('#modal').showModal();
  }
  function toggleStar(t){if(!teams[t])return;watched=watched.includes(t)?watched.filter(k=>k!==t):[...watched,t];save('stars',watched);showRoster();showTimeline();if($('#modal').open)modal(modalMode)}
  document.addEventListener('click',e=>{
    const b=e.target.closest('button');if(!b)return;
    if(b.dataset.mode){rosterMode=b.dataset.mode;save('rosterMode',rosterMode);showRoster()}
    if(b.dataset.tip){articleDetail(b.dataset.tip);return}
    if(b.dataset.community){
      includeDiscussion=b.dataset.community==='all';save('communityDiscussion',includeDiscussion);
      limit=7;showTimeline();$('#tipControls [data-community="'+b.dataset.community+'"]')?.focus();return;
    }
    if(b.dataset.origin){tipSource=b.dataset.origin;limit=7;showTimeline();return}
    if(b.dataset.person){personFlow(b.dataset.person);return}
    if(b.dataset.desk){deskMode=b.dataset.desk;sourceDesk();return}
    if(b.dataset.proof){const [team,player]=b.dataset.proof.split('|');showProof(team,player);return}
    if(b.dataset.official){const o=current.find(v=>v.id===b.dataset.official);if(o)showProof(o.team,o.player,o.id);return}
    if(b.dataset.claim){detail(b.dataset.claim);return}
    if(b.dataset.filter){filtering=b.dataset.filter;limit=7;showTimeline()}
    if(b.dataset.team){focusTeam=b.dataset.team;showRoster()}
    if(b.dataset.star)toggleStar(b.dataset.star);
    if(b.dataset.date){selectedDay=b.dataset.date;archive()}
    if(b.hasAttribute('data-edit-stars')||b.id==='watchBtn')modal('watch');
    if(b.id==='aboutBtn')modal('about');
    if(b.id==='closeModal')$('#modal').close();
    if(b.id==='more'){limit+=12;showTimeline()}
    if(b.id==='onlyWatch'){onlyWatch=!onlyWatch;limit=7;showTimeline()}
    if(b.id==='syncButton')sync();
    if(b.id==='stoke'&&latest){let n=Number($('#stokes').textContent)||0;save('fire-'+latest.id,++n);$('#stokes').textContent=n;$('#fireTip').textContent='내 장작 +1';b.classList.remove('spark');void b.offsetWidth;b.classList.add('spark');}
  });
  $('#modal').addEventListener('click',e=>{if(e.target===$('#modal')){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)e.target.close()}});
  window.addEventListener('hashchange',()=>{routing();window.scrollTo(0,0)});
  let savedFeed=get('feed',[]);if(!Array.isArray(savedFeed))savedFeed=[];
  function feedUrl(){
    const match=location.hostname.match(/^([a-z0-9-]+)\.github\.io$/i);
    if(!match)return '/api/feed';
    const base=location.pathname.replace(/\/public\/(?:index\.html)?$/,'');
    const repo=base.split('/').filter(Boolean)[0]||location.hostname;
    return 'https://raw.githubusercontent.com/'+match[1]+'/'+encodeURIComponent(repo)+'/stovewatch-feed/feed.json';
  }
  async function sync(){
    if(document.querySelector('meta[name="stove-preview"]')||location.protocol==='file:'){
      $('#syncButton').disabled=true;$('#syncText').textContent='저장본';$('#networkInfo').textContent='저장된 소식입니다. 실시간 수집은 서버 연결 시 동작합니다.';return;
    }
    if(busy||document.hidden)return;busy=true;$('#syncButton').disabled=true;$('#syncText').textContent='확인 중';
    try{
      if(location.protocol==='file:')throw Error('offline');
      const r=await fetch(feedUrl(),{cache:'no-store',signal:AbortSignal.timeout(17000)});
      if(!r.ok)throw Error('network');const data=await r.json();
      if(!Array.isArray(data.events)||!Array.isArray(data.sources))throw Error('invalid');
      if(data.mode==='snapshot'){
        $('#syncText').textContent='저장본';$('#networkInfo').textContent='저장된 소식입니다. 무료 수집 서버가 연결되면 갱신됩니다.';return;
      }
      if (data.koreanTranslations && typeof data.koreanTranslations==='object' && !Array.isArray(data.koreanTranslations)) {
        translations={...translations,...data.koreanTranslations};
        save('koreanTranslations',translations);
      }
      const updated=LEDGER.merge([...savedFeed,...data.events]);
      for(const src of data.rumorSources||[])if(src.ok&&Array.isArray(src.claims)&&['archive','index','sheep'].includes(src.id))rumorCache[src.id]=src.claims.filter(LCK.matcher(updated));
      save('rumorSources',rumorCache);
      savedFeed=updated.filter(LCK.matcher(updated)).filter(e=>Date.parse(e.at)>=Date.parse('2026-10-01')).sort((a,b)=>Date.parse(b.at)-Date.parse(a.at)).slice(0,700);
      save('feed',savedFeed);health=data.sources;reviewItems=(Array.isArray(data.reviews)?data.reviews:[]).filter(LCK.matcher(updated));
      const ok=health.filter(s=>s.ok).length;
      $('#networkInfo').textContent=data.checkedAt?(data.mode==='pages'?'무료 예약 수집 ':'무료 수집 서버 ')+day(data.checkedAt)+' '+hm(data.checkedAt)+' KST'+(Date.now()-Date.parse(data.checkedAt)>30*60000?' · 갱신 지연':'')+' · 최근 성공 '+ok+'/'+health.length+'개 수집 경로':'수집 서버의 첫 실행을 기다리고 있습니다.';
      $('#syncText').textContent=ok?'다시 확인':'연결 재시도';
      merge(savedFeed);render();
    }catch{$('#syncText').textContent='연결 재시도';$('#networkInfo').textContent=location.protocol==='file:'?'저장본을 보고 있습니다. 자동 수집은 서버에서 동작합니다.':'출처 연결 대기 중 · 저장된 소식을 표시합니다.'}
    finally{busy=false;$('#syncButton').disabled=false}
  }
  merge(savedFeed);render();routing();sync();setInterval(tick,1000);setInterval(sync,60000);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden){tick();sync()}});
})();

