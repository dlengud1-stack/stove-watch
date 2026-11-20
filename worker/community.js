const boards={
 'inven.co.kr':['https://www.inven.co.kr/board/lol/4625',/^\/board\/lol\/4625\/\d+/],
 'dcinside.com':['https://gall.dcinside.com/board/lists/?id=leagueoflegends6',/^\/board\/view\/?\?/, 'leagueoflegends6'],
 'fmkorea.com':['https://www.fmkorea.com/lol',/^\/(?:\d{6,}|index\.php\?.*document_srl=\d+)/],
 'theqoo.net':['https://theqoo.net/leagueoflegends',/^\/leagueoflegends\/\d+/],
 'mania.kr':['https://na.mania.kr/g2/bbs/board.php?bo_table=loltalk',/^\/g2\/bbs\/board\.php\?/, 'loltalk'],
 'reddit.com':['https://www.reddit.com/r/leagueoflegends/new/.rss',/^\/r\/leagueoflegends\/comments\//i],
 'hupu.com':['https://bbs.hupu.com/lol',/^\/\d+\.html/]
};
async function communityFeed(c){
  const [board,path,category]=c.boardId?['https://gall.dcinside.com/mgallery/board/lists/?id='+c.boardId,/^\/mgallery\/board\/view\/?\?/,c.boardId]:boards[c.domain];
  const raw=await (await retrieve(board)).text(),results=[];let matched=0;
  const candidates=[];
  if(c.domain==='reddit.com'){
    if(!/<feed[\s>]/.test(raw))throw Error('게시판 접근 실패');
    for(const [,item] of raw.matchAll(/<entry\b[^>]*>([\s\S]*?)<\/entry>/gi)){
      candidates.push({href:item.match(/<link[^>]+href=["']([^"']+)/)?.[1],title:xmlField(item,'title'),at:useDate(xmlField(item,'published')||xmlField(item,'updated'))});
    }
  }else{
    for(const [,attrs,inner] of raw.matchAll(/<a\b([^>]*?)>([\s\S]*?)<\/a>/gi)){
      const href=attrs.match(/\bhref\s*=\s*["']([^"']+)/i)?.[1];
      if(href)candidates.push({href:href.replaceAll('&amp;','&'),title:textOnly(inner)});
    }
  }
  for(const p of candidates){
    let u;try{u=new URL(p.href,board)}catch{continue}
    if(u.hostname!==new URL(board).hostname||u.protocol!=='https:'||!path.test(u.pathname+u.search)||(category&&u.searchParams.get(c.domain==='dcinside.com'?'id':'bo_table')!==category))continue;
    if((c.domain==='dcinside.com'&&!u.searchParams.has('no'))||(c.domain==='mania.kr'&&!u.searchParams.has('wr_id')))continue;
    if(p.title.length<4)continue;
    matched++;
    if(!tipTerms.test(p.title)&&!rosterTerms.test(p.title)&&!/(찌라시|썰|rumor|leak)/i.test(p.title))continue;
    const at=p.at||new Date().toISOString(),label=p.at?'커뮤니티 원문':'커뮤니티 원문 · 최초 감지 시각';
    const doc={at,title:p.title,url:u.href,source:c.name,team:'',person:''};
    results.push(review(doc,label));
    const tip=tipFrom(doc,{form:'reading',observed:!p.at,mentioned:mentionIds(p.title)});
    if(tip.claims)results.push(tip);
  }
  if(!matched)throw Error('게시판 목록 확인 필요');
  return combine(results);
}
