const RUMORS = (() => {
  const sheep = 'https://www.sheepesports.com';
  const links = {
    hle:'https://www.kmib.co.kr/article/20261119500020',
    zeus:sheep+'/kr/articles/sources-zeus-set-to-return-to-t1-ahead-of-lck-2027/kr',
    zeusFirst:'https://www.xportsnews.com/article/2220591/',
    siwoo:sheep+'/en/articles/siwoo-set-to-join-gen-g-for-lck-2027-season/en',
    gen:'https://www.osen.co.kr/article/G1112912098',
    career:'https://www.xportsnews.com/article/2221197',
    doran:'https://gall.dcinside.com/mgallery/board/view/?id=longzhugaming&no=1319161&page=1',
    lucid:'https://dugout26.github.io/prosetup/stove-2027.html',
    
  };
  const people = {
    wooloo:{name:'LEC Wooloo',org:'Sheep Esports',type:'이적 취재',trusted:true,note:'Brieuc Seeger. 공저 기사는 취재진 공동 보도로 표시합니다.',url:links.zeus,
      history:['브리온 주전 5인 동행 보도 → 구단 재계약 발표',sheep+'/en/articles/sources-hanjin-brion-set-to-retain-its-whole-roster-for-the-lck-season-2027/en','https://www.xportsnews.com/article/2211038']},
    yoon:{name:'윤민섭',org:'국민일보 · @midnoflash',type:'이적 취재',trusted:true,note:'기사와 본인의 SNS가 같은 취재를 전하면 한 출처로 묶습니다.',url:links.hle,
      history:['김정균 감독 T1 복귀 공동 보도 → T1 발표','https://sports.naver.com/news?oid=005&aid=0001653529','https://x.com/T1LoL/status/1726805130669158575']},
    ko:{name:'고용준',org:'OSEN',type:'이적 취재',trusted:true,note:'같은 기사에서도 구두 합의와 검토 중인 후보의 등급을 따로 매깁니다.',url:links.gen,
      history:['블러핑 DN 합류 보도 → DN 발표','https://www.osen.co.kr/article/G1112911823','https://x.com/SOOPers_LoL/status/2123355631793180874']},
    yoo:{name:'유희은',org:'엑스포츠뉴스',type:'이적 취재',trusted:false,note:'선수가 특정된 실명 취재 보도를 추적합니다. 다른 취재원과의 교차 확인도 함께 표시합니다.',url:'https://www.xportsnews.com/journalist/11716/?page=1'},
    roll:{name:'롤마노 · 한상용',org:'전 감독 · 개인 방송',type:'방송',trusted:false,note:'방송에서 언급한 팀 상황과 시청자가 해석한 선수 행선지를 구분합니다. 구체적인 합류 언급이 없는 방송은 후보 명단에서 제외합니다.',url:'https://www.youtube.com/watch?v=7Ds3b8xFmDI'},
    doinb:{name:'도인비 · 김태상',org:'개인 방송',type:'방송',trusted:true,note:'중국권 스토브리그 방송 발언을 추적합니다. 룰러 사례는 방송을 인용한 당시 보도이며, 이번 시즌에 같은 수준의 근거가 있는지 건별로 봅니다.',url:'https://www.dexerto.com/league-of-legends/doinb-reportedly-fined-by-the-lpl-for-leaking-information-1844328/',
      history:['2022 룰러의 JDG행 방송 힌트 보도 → JDG 발표 보도','https://www.xemgame.com/lo-jdg-ruler-cong-dong-xin-loi-doinb-post476848.html','https://ol.gamersky.com/news/202212/1546173.shtml']},
    fox:{name:'폭마노',org:'커뮤니티 활동명',type:'커뮤니티',trusted:false,note:'키움 DRX 갤러리에 옮겨진 힌트 해석을 추적합니다. 원 발언과 구단 발표를 대조할 수 있는 적중 기록은 미확인입니다.',url:links.doran},
    lifehint:{name:'라이프좌',org:'한화 갤러리 전언에 붙은 별칭',type:'커뮤니티',trusted:false,note:'여러 게시판에서 원 발언자를 지칭할 때 쓴 별칭입니다. 개인 신원과 적중 이력은 미확인이며 조건부 발언으로 다룹니다.',url:'https://na.mania.kr/g2/bbs/board.php?bo_table=loltalk&wr_id=905777'},
    dong:{name:'동글라밍',org:'에펨코리아 활동명',type:'커뮤니티',trusted:false,note:'댓글 재인용으로 확인한 발언입니다. 직접 댓글과 적중 이력은 미확인입니다.',url:'https://dugout26.github.io/prosetup/teams/gen.html'}
  };
  for(const profile of WATCHLIST.people){
    if(!people[profile.id])people[profile.id]={name:profile.name,org:profile.role,type:['bieung','dyumano','nonggal','fox','park','hongcha'].includes(profile.id)?'커뮤니티':profile.role.includes('기자')||profile.role.includes('취재')?'이적 취재':'방송',trusted:false,note:profile.notes||'원문에서 확인되는 선수와 행선지를 기록합니다.',url:profile.profile||profile.proof};
  }
  const stages={interest:'관심',talks:'접촉·협상',offer:'오퍼',negotiationFailed:'협상 중단·불발',agreement:'합의 보도',joining:'합류 보도',shortlist:'영입 후보',hint:'힌트 해석',hearsay:'전언',index:'색인 수집'};
  const forms={direct:'직접 취재·발언',relay:'재인용',reading:'팬 해석',index:'색인 링크'};
  const cases = [
    ['11-19 01:27','HLE','TOP','Kiin','yoon','joining','direct','https://x.com/midnoflash/status/2123090709552984196','윤민섭 기자 개인 X의 선행 취재입니다. 뒤이은 국민일보 기사는 같은 취재원으로 묶습니다.'],
    ['11-19 01:27','HLE','JGL','Canyon','yoon','joining','direct','https://x.com/midnoflash/status/2123090709552984196','기인과 캐니언의 행선지를 함께 전한 개인 X 게시물입니다. 두 선수는 각각 별도로 추적합니다.'],
    ['11-19 01:54','HLE','TOP','Kiin','yoon','joining','direct',links.hle,'윤민섭 기자가 기인과 한화생명의 계약을 보도했습니다. 같은 기사에 실린 캐니언 건과 취재 출처를 공유합니다.'],
    ['11-19 01:54','HLE','JGL','Canyon','yoon','joining','direct',links.hle,'국민일보가 캐니언의 한화생명 합류를 보도했습니다. 구단 영입 발표를 기다리고 있습니다.'],
    ['11-18 10:41','T1','TOP','Zeus','yoo','joining','direct',links.zeusFirst,'엑스포츠뉴스가 제우스의 T1 복귀를 먼저 보도했습니다.'],
    ['11-19 03:20','T1','TOP','Zeus','wooloo','agreement','direct',links.zeus,'울루 등 취재진이 T1과 3년 계약에 합의했다고 보도했습니다. 기사에서 엑스포츠뉴스의 선행 보도를 밝힙니다.'],
    ['11-19 10:59','GEN','TOP','Siwoo','wooloo','joining','direct',links.siwoo,'Sheep Esports 취재진이 시우의 젠지 합류를 보도했습니다.'],
    ['11-19 11:19','GEN','TOP','Siwoo','ko','agreement','direct',links.gen,'OSEN이 취재한 내용은 시우와 젠지가 구두 합의에 이르렀다는 것입니다.'],
    ['11-19 11:19','GEN','JGL','Sharvel','ko','shortlist','direct',links.gen,'젠지가 검토하는 정글러 두 명 중 한 명입니다. 이 기사에서 샤벨과의 합의는 보도되지 않았습니다.'],
    ['11-19 11:19','GEN','JGL','Kanavi','ko','shortlist','direct',links.gen,'OSEN이 샤벨과 함께 언급한 정글 후보입니다. 한화생명과의 계약 종료 발표에는 다음 행선지가 없습니다.'],
    ['11-19 18:10','HLE','SUP','Career','yoo','joining','direct',links.career,'엑스포츠뉴스가 한화생명 합류를 보도했습니다. 기존 계약 선수 딜라이트와 다음 시즌 주전 여부는 별개입니다.'],
    ['11-17 17:53','GEN','JGL','Lucid','dong','hearsay','relay',links.lucid,'프로셋업이 동글라밍의 에펨코리아 댓글을 재인용했습니다. 루시드의 젠지행을 들었다는 내용이며 원댓글은 확인되지 않았습니다.'],
    ['11-14 23:29','KRX','TOP','Doran','fox','hint','reading',links.doran,'키움 DRX 갤러리 이용자가 폭마노의 힌트를 도란으로 해석한 글입니다. 폭마노가 도란의 행선지를 직접 밝혔다고 확인된 자료는 없습니다.'],
    ['11-18 02:33','HLE','TOP','Siwoo','lifehint','hearsay','relay','https://na.mania.kr/g2/bbs/board.php?bo_table=loltalk&wr_id=905777','제우스 재계약이 무산될 경우 한화가 시우를 노린다는 조건부 전언입니다. 이후 젠지행을 보도한 취재 기록도 있습니다.'],
    ['11-13 00:16','BFX','BOT','Noah','wooloo','joining','direct','https://www.sheepesports.com/us/articles/sources-noah-set-to-join-bnk-fearx-ahead-of-2027-lck-season/kr','울루 등 취재진이 노아의 BNK 피어엑스 합류를 보도했습니다.'],
    ['11-18 16:24','DNS','SUP','Bluffing','ko','joining','direct','https://www.osen.co.kr/article/G1112911823','OSEN의 이적 보도 이후 DN 수퍼스가 영입을 발표했습니다.']
  ];
  const seed=cases.map(([date,team,role,player,person,stage,form,url,note])=>({at:'2026-'+date.replace(' ','T')+':00+09:00',team,role,player,person,stage,form,url,note}));
  const key=c=>[c.team,c.player.toLowerCase()].join('|');
  function canon(url){
    try{
      const u=new URL(url);
      u.hash=''; for(const k of [...u.searchParams.keys()])if(/^utm_|^igsh/i.test(k))u.searchParams.delete(k);
      if(['www.sheepesports.com','sheepesports.com'].includes(u.hostname)){
        const article=u.pathname.match(/\/articles\/([^/]+)/);
        if(article)return 'sheep/'+article[1];
      }
      return u.href.replace(/\/$/,'');
    }catch{return url||''}
  }
  function evidenceKey(c){
    return [canon(c.url),c.team||'',(c.player||'').toLowerCase(),c.scope||'roster',c.stage,c.destination||'',c.passage||(!c.player&&!c.team)?c.note||c.topic:'',c.closed||''].join('|');
  }
  function participants(c){
    return [...new Set([c.person,...(c.authors||[]),...(c.mentions||[])].filter(Boolean))];
  }
  function statements(live,now=Date.now(),accepts=LCK.includes){
    const unique=new Map();
    for(const c of [...seed,...STOVE_TIPS,...live]){
      if(!accepts(c)||!/^https:\/\//i.test(c.url)||!Number.isFinite(Date.parse(c.at))||Date.parse(c.at)>now||!stages[c.stage])continue;
      const id=evidenceKey(c),prev=unique.get(id);
      if(!prev)unique.set(id,{...c});
      else unique.set(id,{...c,...prev,authors:[...new Set([...(prev.authors||[]),...(c.authors||[])])],mentions:[...new Set([...(prev.mentions||[]),...(c.mentions||[])])]});
    }
    return [...unique.values()].sort((a,b)=>Date.parse(b.at)-Date.parse(a.at));
  }
  function tier(c){
    if(c.form!=='direct'||['interest','offer','talks','shortlist','hint','hearsay','index','negotiationFailed'].includes(c.stage))return 'rumor';
    
    if(c.player&&(c.team||c.destination)&&[c.person,...(c.authors||[])].some(id=>people[id]?.trusted) && c.form==='direct'&&['agreement','joining'].includes(c.stage))return 'near';
    return c.publisher||people[c.person]?.type==='이적 취재'?'report':'rumor';
  }
  function board(live,officials,now=Date.now()){
    const groups=new Map();
    for(const c of statements(live,now,LCK.matcher(officials))){
      if(c.scope==='desk')continue;
      if(!c||typeof c.player!=='string'||!Object.hasOwn(STOVE.teams,c.team)||(c.role!==''&&!STOVE.roles.includes(c.role))||!c.player||!/^https:\/\//i.test(c.url)||!Number.isFinite(Date.parse(c.at))||Date.parse(c.at)>now)continue;
      const id=key(c);
      if(!groups.has(id))groups.set(id,{id,team:c.team,role:c.role,player:c.player,evidence:[],closures:[]});
      const g=groups.get(id);
      if(!g.role&&c.role)g.role=c.role;
      if(c.closed){g.closures.push(c);continue}
      if(!g.evidence.some(v=>evidenceKey(v)===evidenceKey(c)))g.evidence.push(c);
    }
    for(const g of groups.values()){
      if(!g.evidence.length){groups.delete(g.id);continue}
      g.evidence.sort((a,b)=>Date.parse(b.at)-Date.parse(a.at));
      g.history=[...g.evidence];
      g.at=g.evidence[0].at;g.dateOnly=g.evidence[0].dateOnly;
      const tiers=g.evidence.map(tier);g.kind=tiers.includes('near')?'near':tiers.includes('report')?'report':'rumor';
      // A later pickup in a different role for the same player can still settle their destination.
      const since=Math.min(...g.evidence.map(c=>Date.parse(c.at)));
      const results=officials.filter(e=>e.roster&&e.player?.toLowerCase()===g.player.toLowerCase()&&Date.parse(e.at)>=since&&Date.parse(e.at)<=now).sort((a,b)=>Date.parse(a.at)-Date.parse(b.at));
      const settled=results.find(e=>['in','renew','trade'].includes(e.kind)||(e.kind==='out'&&e.team===g.team));
      const latest=g.closures.sort((a,b)=>Date.parse(b.at)-Date.parse(a.at))[0];
      g.status='active';
      if(settled){g.status=settled.team===g.team&&settled.kind!=='out'?'confirmed':'ended';g.resolution=settled.url}
      else if(latest){
        if(latest.closed==='settledIndex'){g.status='settledIndex';g.resolution=latest.url}
        else {
          const withdrawn=new Set(g.closures.map(c=>c.url));
          const kept=g.evidence.filter(c=>!withdrawn.has(c.url)&&!g.closures.some(x=>x.closed==='withdrawnByAuthor'&&x.person===c.person&&Date.parse(x.at)>=Date.parse(c.at)));
          if(!kept.length){g.status='ended';g.resolution=latest.url}
          else {g.evidence=kept;const ranks=kept.map(tier);g.kind=ranks.includes('near')?'near':ranks.includes('report')?'report':'rumor';g.at=kept[0].at;g.dateOnly=kept[0].dateOnly}
        }
      }
    }
    return [...groups.values()].sort((a,b)=>Date.parse(b.at)-Date.parse(a.at)||a.player.localeCompare(b.player));
  }
  return {people,stages,forms,seed,board,tier,key,evidenceKey,participants,statements,canon};
})();
