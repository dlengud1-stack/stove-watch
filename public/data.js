const STOVE = (() => {
  // Slot entries are announced players or players under contract entering the offseason.
  const reference = 'https://www.esfanz.com/stove/2027';
  const rows = [
    ['NS','농심 레드포스','#ff625d','UC4PoHC-R9EeJYTuUv3ndmJw',[]],
    ['T1','T1','#ff5268','UCJprx3bX49vNl6Bcw01Cwfg',['','Oner','Faker','Peyz','Keria']],
    ['GEN','젠지','#dcb75c','UCDmmbxGg8g-EBkC_ku6vybg',['','','Chovy','Ruler','Duro']],
    ['HLE','한화생명e스포츠','#ff8d55','UCrfB1-zWijAYkgfZW7Ehc8Q',['','','Zeka','Gumayusi','Delight']],
    ['KT','KT 롤스터','#ff706b','UC8FErYSi74YwGUAoTpjvgzQ',['PerfecT','','Bdd','','']],
    ['DK','디플러스 기아','#66dbcb','UCepHesz_5Lwr7qRaqjB-p1A',['Siwoo','Lucid','','','Career']],
    ['BFX','BNK 피어엑스','#f9d04c','UCxedTJNaGRHiq6YfNtQVCNA',['','','VicLa','','']],
    ['BRO','한진 브리온','#7ede98','UCYQO6n0KZmwfwzWtm4_nAPA',['Casting','GIDEON','Roamer','Teddy','Namgung']],
    ['KRX','키움 DRX','#97b4ff','UC5WN-znPsJK0BbA8aHxZHWQ',['','','','LazyFeel','']],
    ['DNS','DN 수퍼스','#78a7ff','UCLjQgCF-lhvn5kTj-_nGjPg',['DuDu','Cuzz','','deokdam','']]
  ];
  const teams = Object.fromEntries(rows.map(([id,name,color,channel,base]) => [id,{id,name,color,channel,base}]));
  const facts = [
    ['11-19 22:31','DK','renew','Smash','BOT','디플러스 기아, 스매쉬 재계약 발표','','https://x.com/DplusKia/status/2123408943422828942','디플러스 기아 공식 X'],
    ['11-19 22:30','DK','renew','ShowMaker','MID','디플러스 기아, 쇼메이커 재계약 발표','','https://x.com/DplusKia/status/2123408492333842753','디플러스 기아 공식 X'],
    ['11-19 20:10','NS','in','Pyosik','JGL','농심, 정글러 ‘표식’ 홍창현 영입','','https://x.com/NS_RedForce/status/2123373218912444889','농심 공식 X'],
    ['11-19 20:00','NS','in','Andil','SUP','농심, 서포터 ‘안딜’ 문관빈 영입','','https://x.com/NS_RedForce/status/2123370715185639699','농심 공식 X'],
    ['11-19 19:00','NS','in','Deft','BOT','농심 레드포스, ‘데프트’ 김혁규 영입','복귀한 데프트가 농심의 바텀을 맡는다.','https://www.inven.co.kr/webzine/news/?news=323613&site=lol','인벤 · 구단 발표 인용'],
    ['11-19 19:00','KT','in','Raptor','JGL','KT 롤스터, 새 정글러로 ‘랩터’ 영입','전어진이 2027 시즌 KT에 합류한다.','https://www.instagram.com/p/Df60FEiTmoD/','KT 공식 인스타그램'],
    ['11-19 19:00','DNS','in','Bluffing','SUP','DN 수퍼스, 서포터 ‘블러핑’ 합류 발표','구단 공식 X에 2028년까지의 계약이 게시됐다.','https://x.com/SOOPers_LoL/status/2123355631793180874','DN 공식 X'],
    ['11-19 18:10','HLE','press','Career','SUP','한화생명, ‘커리어’ 영입 보도','엑스포츠뉴스 단독 보도. 구단의 합류 발표를 기다리는 단계다.','https://www.xportsnews.com/article/2221197','엑스포츠뉴스'],
    ['11-19 18:00','T1','out','Doran','TOP','T1, ‘도란’ 최현준과 계약 종료','도란의 다음 소속팀은 이번 발표에 포함되지 않았다.','https://x.com/T1LoL/status/2123340508978454951','T1 공식 X'],
    ['11-19 10:37','HLE','out','Kanavi','JGL','한화생명, ‘카나비’ 서진혁과 계약 종료','','https://x.com/HLEofficial/status/2123229103595860182','한화생명 공식 X'],
    ['11-19 09:21','HLE','out','Zeus','TOP','한화생명, ‘제우스’ 최우제와 계약 종료','','https://x.com/HLEofficial/status/2123210041985761285','한화생명 공식 X'],
    ['11-19 03:20','T1','press','Zeus','TOP','제우스의 T1 복귀 합의 보도','쉽이스포츠가 계약 합의를 보도했다. T1의 공식 영입 발표를 기다리는 단계다.','https://www.sheepesports.com/kr/articles/sources-zeus-set-to-return-to-t1-ahead-of-lck-2027/kr','Sheep Esports'],
    ['11-19 01:54','HLE','press','Kiin · Canyon','','기인·캐니언의 한화생명 합류 보도','국민일보가 두 선수의 한화생명행을 보도했다.','https://m.sports.naver.com/esports/article/005/0001886076','국민일보'],
    ['11-18 20:00','DNS','in','Ucal','MID','DN 수퍼스, 미드 ‘유칼’ 손우현 영입','','https://x.com/SOOPers_LoL/status/2123008346878013600','DN 공식 X'],
    ['11-18 17:10','NS','renew','Kingen','TOP','농심, ‘킹겐’과 2028년까지 재계약','','https://x.com/NS_RedForce/status/2122965531816841534','농심 공식 X'],
    ['11-18 17:00','NS','renew','Calix','MID','농심, 미드 ‘칼릭스’와 계약 연장','','https://x.com/NS_RedForce/status/2122963016899580079','농심 공식 X'],
    ['11-18 17:00','BFX','in','Vincenzo','JGL','BNK 피어엑스, ‘빈센조’ 영입','','https://x.com/BNKFEARXLoL/status/2122963019109945538','BNK 공식 X'],
    ['11-18 12:00','BRO','in','SeTab','MID','한진 브리온, ‘세탭’ 합류 발표','구단은 발표에서 선수단 구분을 밝히지 않았다.','https://x.com/Brionesports/status/2122887537018442057','브리온 공식 X'],
    ['11-17 09:00','GEN','out','Kiin','TOP','젠지, 탑 ‘기인’과 계약 종료','','https://x.com/GenG/status/2122479835192918393','젠지 공식 X'],
    ['11-17 09:00','GEN','out','Canyon','JGL','젠지, 정글 ‘캐니언’과 계약 종료','','https://x.com/GenG/status/2122480083319308699','젠지 공식 X']
  ];
  const events = facts.map(([date,team,kind,player,role,title,detail,url,source]) => ({id:url,team,kind,player,role,title,detail,url,source,at:'2026-'+date.replace(' ','T')+':00+09:00',roster:kind!=='press'&&player!=='SeTab'}));
  return {teams,events,reference,roles:['TOP','JGL','MID','BOT','SUP'],labels:{trade:'트레이드',in:'영입',out:'계약 종료',renew:'재계약',press:'보도',video:'구단 영상',near:'거피셜',rumor:'찌라시',report:'보도'}};
})();
