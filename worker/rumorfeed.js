// Unconfirmed statements can enter the feed before a player, destination or role is known.
const tipTerms=/스토브|찌라시|썰|루머|행선지|거론|이적 가능성|영입 후보|제안|영입설|재계약|이적|선수단 구성|로스터|거취|협상|접촉|영입.{0,5}관심|오퍼|테스트 입단|트라이아웃|매물|구두\s*합의|선수.{0,6}후보|보강|물망|러브콜|탐색|재편|팀을 찾|자유계약|rumou?r|offseason|roster|transfer|shortlist|interested in|interest in|consider(?:ed|ing)|in (?:advanced )?talks|negotiat|explor(?:e|ing).*options|open to offers|offer(?:ed)?|trial(?:ing|ling)?|set to|expected to|verbal agreement|renew|re-sign|free agen|加盟|转会|转會|轉會|续约|續約|有意|接触|接觸|洽谈|报价|爆料|去向|引援|补强|自由人|签约|谣言|爆料|小道消息|传言|传闻|传补|大名单|试训|候选|離隊|离队|阵容|转会期|interesse|fichaje|rumores|negociaç|negociación|s[aã]o cotados|contrataç|explora opciones|oferta|acordo verbal|acuerdo verbal|mercado de fichajes|mercado de transferências/i;
const tipOther=/\b(?:VCT|Valorant|CS2|Counter.Strike|Dota\s?2|Rocket League|Overwatch)\b|발로란트|오버워치|스트라이커|야구|축구|배구|농구/i;
const quoteTerms=/인용|재전언|피셜에 따르면|보도에 따르면|기사에 따르면|에 의하면|외신에 따르면|(?:according to|reported by|as (?:first |previously )?reported by|via)\s+(?!sources?\b|people\b|our\b)|援引|转述|转载|据韩媒/i;
const speculative=/[?？]|만약|바란다|바랍니다|희망사항|기원|싶다|원해요|개인.{0,3}(바람|예상)|확인되지|합의.{0,5}(아니|없)|단순.{0,3}예상|부인|\b(?:if|might|could|perhaps|maybe|hope|hopes|hopefully|denies|denied|unconfirmed|wishlist|should join)\b|talvez|quizás|ojalá|poderia|podría|would love|no agreement|not (?:set to|confirmed|agreed|in talks|interested)/i;
function statementStage(t){
  if(/결렬|무산|협상.{0,9}(불발|중단)|합의.{0,5}못|제안.{0,5}거절|talks (?:broke down|fell through)|failed to reach|will not join|not joining|no longer|辟谣|谈崩/i.test(t))return 'negotiationFailed';
  if(speculative.test(t))return 'hearsay';
  if(/구두\s*합의|계약에 합의|(?:reache[sd]?|has|in) (?:a |an )?(?:verbal |three-year )?agreement|agreed (?:to|terms)|verbal agreement|达成协议|acordo verbal|acuerdo verbal/i.test(t))return 'agreement';
  if(/오퍼|러브콜|제안(?:했|을|받)|offer(?:ed|s)?\b|报价|報價|oferta/i.test(t))return 'offer';
  if(/협상|접촉|논의|미팅|접선|negotiat|in (?:advanced )?talks|in discussions|contacted|접촉|接触|洽谈|negociaç|negociación|em conversas|en conversaciones|close to sign|advancing toward the signing/i.test(t))return 'talks';
  if(/후보|물망|검토|shortlist|option[s]?\b|consider(?:ed|ing)|trial|트라이아웃|人选/i.test(t))return 'shortlist';
  if(/관심|눈여겨|노리|지켜보|interested|interest in|explor|monitoring|有意|interesse|interés|interesad[oa]/i.test(t))return 'interest';
  if(/합류한다|합류하기로|영입에 성공|영입했|set to (?:join|return|sign)|will join|已签约/i.test(t))return 'joining';
  if(/힌트|암시|hint|行方/i.test(t))return 'hint';
  return 'hearsay';
}
function mentionIds(t){
  return WATCHLIST.people.filter(p=>{
    const aliases=[...(p.aliases?.length?p.aliases:[p.name]),p.x].filter(a=>a&&a.length>1);
    return aliases.some(a=>new RegExp('(?:^|[^a-z0-9])'+boundary(a)+'(?:$|[^a-z0-9])','i').test(t));
  }).map(p=>p.id);
}
function tipFrom(doc,opts={}){
  const title=(doc.title||'').trim();
  if(!title||!doc.at||!goodUrl(doc.url)||otherSport.test(title)||tipOther.test(title))return {};
  const subjects=playersIn(title),teams=scopeTeams(title),stage=statementStage(title);
  if(!tipTerms.test(title)&&!rosterTerms.test(title)&&!(doc.person&&teams.length&&/쉽지 않|어렵|변수|바뀔|남을|떠날/.test(title)))return {};
  const roster=subjects.length===1&&teams.length===1&&!secondTeam.test(title)&&!/(계약 종료|결별|떠나|depart|leav(?:e|es|ing)|전 소속|formerly|대신|이전 시즌|지난해|작년|last year|last season|조인설 부인|임대 복귀|mutual termination)/i.test(title)&&!['negotiationFailed'].includes(stage)
    &&/(영입|합류|복귀|행(?:\s|$|이|을|설)|구두\s*합의|join|return to|agreement with|sign(?:s|ing)? with|加盟)|(?:관심|노리|물망|협상|접촉|오퍼|관심을 보|in talks with|interested in|offered to)/i.test(title);
  const person=doc.person||'', relay=opts.form==='relay'||quoteTerms.test(title);
  const form=relay?'relay':opts.form||'direct';
  let scope=roster?'roster':'desk';
  if(opts.desk||/은퇴|은퇴설|무산|철회|정정|if |만약|기원|희망|원해요|would love|wishlist|\?|？|should join|원소속|from (?:T1|Gen\.?G|KT|Nongshim|Dplus|Hanwha|BNK|DRX)\b/i.test(title))scope='desk';
  const target=title.match(/\b(?:join|agreement with|sign with|in talks with)\s+([A-Za-z][\w .-]*)/i)?.[1];
  if(speculative.test(title)||(target&&!sheepDestinations.some(([,pattern])=>pattern.test(target))))scope='desk';
  const source=doc.source||'공개 게시물';
  if(opts.mentioned?.length&&form==='reading')scope='desk';
  const c={at:doc.at,url:doc.url,source,team:teams.length===1?teams[0]:'',player:subjects.length===1?subjects[0].player:'',role:subjects.length===1?subjects[0].role:'',
    stage,form,scope,person,topic:title.slice(0,190),note:title.slice(0,280),publisher:!!opts.publisher,observed:!!opts.observed};
  if(opts.authors?.length)c.authors=opts.authors;
  if(opts.mentioned?.length)c.mentions=opts.mentioned;
  if(opts.originUrl)c.originUrl=opts.originUrl;
  if(doc.person&&teams.length===1&&subjects.length===1&&/철회|정정|오보|retract|correction|no longer joining/i.test(title)&&!relay){
    return {claims:[{...c,scope:'roster',form:'direct',closed:'withdrawnByAuthor'},c]};
  }
  return {claims:[c]};
}
