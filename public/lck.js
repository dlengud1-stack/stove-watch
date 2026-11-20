// Scope follows the subject of each statement, independently of its speaker or publisher.
const LCK = (() => {
  const clubs = {
    T1:/\bT1\b|티원/i, GEN:/\bGen[. ]?G\b|\bGEN\b|젠지/i,
    HLE:/韩华生命|韓華生命|韩华电竞|韓華電競|Hanwha Life|\bHLE\b|한화생명|한화(?:가|는|와|의|행|에서|\s)/i, KT:/\bKT\b|케이티|kt롤스터/i,
    DK:/Dplus(?:\s*Kia)?|\bDK\b|디플러스|딮기/i, NS:/农心|農心|Nongshim|\bNS\b|농심|레드포스/i,
    BFX:/FearX|\bBFX\b|피어엑스|피어엑/i, BRO:/[Bb][Rr][Ii][Oo][Nn]|브리온|\bBRO\b/,
    KRX:/\b(?:DRX|KRX)\b|키움\s*디알엑스/i, DNS:/DN\s*(?:Freecs|SOOPers)|\bDNS\b|수퍼스|수퍼즈/i
  };
  const teamNames='(?:LCK|T1|Gen\\.?G|GEN|Hanwha Life(?: Esports)?|KT(?: Rolster)?|Dplus(?: Kia)?|Nongshim(?: RedForce)?|BNK FearX|Brion|DRX|HLE|BFX|젠지|한화생명|농심|디플러스(?: 기아)?|피어엑스|브리온)';
  const historical=new RegExp('(?:ex[- ]|former(?:ly)?(?: of)? |once (?:played )?for |previously (?:at|with) )'+teamNames+'(?:[ -](?:player|star|champion|midlaner|toplaner|coach))?|'+teamNames+'(?:\\s*출신|에서 (?:뛰었던|활약했던)|의 전설| alumni| veteran)|(?:전직|과거)\\s*'+teamNames,'gi');
  const attribution=new RegExp(teamNames+'\\s*(?:기자|관계자|해설위원|캐스터|해설|취재진|소식통|reporter|journalist|caster|insider|analyst|correspondent)|KT어진','gi');
  const otherSport=/\b(?:valorant|VCT|counter[- ]strike|CS2|Dota ?2|Overwatch|KBO|KBL)\b|발로란트|야구|농구|배구|축구/i;
  const qualified=/^(?:in|out|trade|renew|video)$/;
  const rosterAction=/영입|합류|이적|계약|복귀|방출|협상|접촉|잔류|오퍼|행선지|트레이드|팀을 (?:찾|떠)|팀 물색|거취|후보|합의|콜업|주전|로스터|코치|선임|스토브|관심|제안|교체|보강|이탈|FA\b|\b(?:join|leav|sign|offer|contact|interest|recruit|renew|return|transfer|roster|agreement|shortlist|contract|buyout|explor|part ways|consider|options|negotiat|in talks)|加盟|转会|轉會|续约|簽約|有意|意向|报价|接触|阵容|移籍|獲得|contrata|fichaj|recrut/i;
  const query='(LCK OR T1 OR "Gen.G" OR "Hanwha Life" OR "KT Rolster" OR "Dplus KIA" OR "BNK FearX" OR DRX OR "Nongshim RedForce" OR BRION OR "DN SOOPers" OR 젠지 OR 한화생명 OR 디플러스 OR 피어엑스 OR 브리온 OR 롤스터 OR 수퍼스)';
  const comparisons=new RegExp('(?:compared (?:with|to)|unlike|inspired by|lost to|beat|against)\\s+'+teamNames+'|(?:'+teamNames+')(?:와 비교|전 승리|전 패배)|(?:^|\\s)#(?:LCK|T1|GEN|HLE|BFX|DK)\\b','gi');
  const scrub=t=>String(t||'').replace(comparisons,' ').replace(/https?:\/\/\S+|@[\w.]+/g,' ').replace(historical,' ').replace(attribution,' ');
  const teamIds=text=>Object.keys(clubs).filter(id=>clubs[id].test(text));
  const league=text=>/(?:^|[^a-z0-9])LCK(?![a-z0-9])|韩国赛区|韓國賽區|韩国联赛|韓国リーグ|한국 리그/i.test(text);
  const mentioned=text=>teamIds(text).length>0||league(text);
  const isClub=id=>!!id&&Object.hasOwn(STOVE.teams,id);
  const escape=s=>s.replace(/[.*+?^\x24{}()|[\]\\]/g,'\\$&');
  // Match a player's own move. A name inside a comparison or a cited comment is insufficient.
  const subjectAction=name=>new RegExp('(?:^|[^a-z0-9])'+escape(name)+'(?:[’\\x27]s)?\\s*(?:(?:is|has|will|could|may|reportedly|set|open|close|expected|agrees|reached|to|a|an|verbal|in|his)\\s+){0,6}(?:join|return|leave|sign|agree|negotiat|talks|offer|transfer|contract|roster|explor|renew)|(?:sign|signing|acquir|recruit|in talks with|interest(?:ed)? in|agreement with|offer to)\\w*\\s+'+escape(name)+'(?![a-z0-9])','i');
  const playerNames={Kiin:'기인',Canyon:'캐니언',Zeus:'제우스',Siwoo:'시우',Lucid:'루시드',Doran:'도란',Career:'커리어',Sharvel:'샤벨',Kanavi:'카나비',Noah:'노아',Deft:'데프트',Raptor:'랩터',Bluffing:'블러핑',Andil:'안딜',Pyosik:'표식',Faker:'페이커',Oner:'오너',Gumayusi:'구마유시',Keria:'케리아',Peyz:'페이즈',Chovy:'쵸비',Ruler:'룰러',Duro:'듀로',Zeka:'제카',Delight:'딜라이트',PerfecT:'퍼펙트',Bdd:'비디디',ShowMaker:'쇼메이커',Smash:'스매쉬',VicLa:'빅라',Casting:'캐스팅',GIDEON:'기드온',Roamer:'로머',Teddy:'테디',Namgung:'남궁',LazyFeel:'레이지필',DuDu:'두두',Cuzz:'커즈',deokdam:'덕담',Ucal:'유칼',Calix:'칼릭스',Kingen:'킹겐',Vincenzo:'빈센조',SeTab:'세탭',Viper:'바이퍼',Aiming:'에이밍'};
  const localAliases=new Map(Object.entries(playerNames).map(([name,label])=>[name.toLowerCase(),label]));
  function matcher(events=[]){
    const membership=new Map();
    const add=(name,team,at)=>{if(!name||!Number.isFinite(at))return;const n=name.toLowerCase(),history=membership.get(n)||[];history.push({at,team});membership.set(n,history)};
    for(const c of CONTRACTS)add(c.player,c.team,Date.parse(c.asOf));
    for(const e of [...STOVE.events,...events])if(isClub(e?.team)&&['in','renew','out','trade'].includes(e.kind)&&e.roster)add(e.player,e.kind==='out'?'':e.team,Date.parse(e.at));
    const subjects=[...membership].map(([name,history])=>({name,pattern:subjectAction(name),korean:localAliases.has(name)?new RegExp(localAliases.get(name)+'(?:[이가은는의와을를도]\\s*|\\s+)(?:.{0,14}?)(?:합류|영입|재계약|잔류|이적|거취|떠날|행선지|계약|오퍼|팀을 찾)'):null,history:history.sort((a,b)=>a.at-b.at)}));
    return item=>{
      if(!item)return false;
      if(isClub(item.team)&&qualified.test(item.kind))return true;
      if(isClub(item.originTeam)||isClub(item.verifiedTeam))return true;
      const headline=item.title||item.topic||'';
      const raw=item.passage?item.note:[headline,item.note].filter(Boolean).join(' ');
      if(otherSport.test(raw))return false;
      const text=scrub(raw);
      if(isClub(item.team)&&!headline&&!item.passage)return true;
      if(item.closed&&isClub(item.team)&&!headline)return true;
      if(!text.trim())return false;
      const main=scrub(item.passage?item.note:headline||item.note);
      if(mentioned(main))return true;
      if(item.passage)return false;
      if(item.stage&&isClub(item.team)&&teamIds(scrub(item.note)).includes(item.team))return true;
      if(!headline&&mentioned(text))return true;
      // Editors and article parsers can provide separately evidenced originTeam for a cross-border move.
      if(!rosterAction.test(main))return false;
      const at=Date.parse(item.at);
      return subjects.some(({name,pattern,korean,history})=>{
        if(!pattern.test(main)&&!korean?.test(main)&&!(item.player?.toLowerCase()===name&&main.includes(item.player)&&/이적|영입|재계약|합류|잔류|트레이드|거취/.test(main)))return false;
        return !!history.filter(h=>h.at<=at).at(-1)?.team;
      });
    };
  }
  const includes=matcher();
  const hostOf=url=>{try{return new URL(url).hostname.replace(/^www\./,'')}catch{return ''}};
  const mediaHosts=new Set(WATCHLIST.media.map(m=>m.domain));
  function isReport(c){
    if(c.form==='reading'||/inven\.co\.kr\/board\//i.test(c.originUrl||c.url||''))return false;
    if(c.publisher||c.kind==='press')return true;
    const host=hostOf(c.originUrl||c.url);
    return [...mediaHosts].some(h=>host===h||host.endsWith('.'+h));
  }
  function batch(data,events=[]){
    const accepts=matcher([...events,...(data.events||[])]);
    return {events:(data.events||[]).filter(accepts),claims:(data.claims||[]).filter(accepts),reviews:(data.reviews||[]).filter(accepts)};
  }
  return {includes,matcher,batch,query,isReport,teamIds,hostOf,playerNames};
})();

