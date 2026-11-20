// Profiles linked by the clubs. Channel IDs identify YouTube feeds across handle changes.
const CLUB_CHANNELS = {
  NS: {
    x: 'NS_RedForce', ig: 'ns_redforce', youtube: 'UC4PoHC-R9EeJYTuUv3ndmJw',
    proof: ['https://www.ns-esports.com/page/53', 'https://nsredforce.bstage.in/community/board/699fc478bdd36b01ad447065/post/69d5f7e86116a41e98cbf467']
  },
  T1: {
    x: 'T1LoL', ig: 't1lol', youtube: 'UCJprx3bX49vNl6Bcw01Cwfg',
    proof: ['https://litt.ly/t1.lol']
  },
  GEN: {
    x: 'GenG', xAlso: ['GenG_KR'], ig: 'gengesports', youtube: 'UCDmmbxGg8g-EBkC_ku6vybg',
    proof: ['https://linktr.ee/gengesports', 'https://x.com/GenG_KR']
  },
  HLE: {
    x: 'HLEofficial', ig: 'hle.official', youtube: 'UCrfB1-zWijAYkgfZW7Ehc8Q',
    proof: ['https://linktr.ee/hle.official']
  },
  KT: {
    x: 'KTRolsterLoL', ig: 'ktrolstagram', youtube: 'UC8FErYSi74YwGUAoTpjvgzQ',
    proof: ['https://x.com/KTRolsterLoL/status/2123355910454358286', 'https://handledex.com/en/person/kt-rolster/']
  },
  DK: {
    x: 'DplusKia', ig: 'dpluskia.lol', youtube: 'UCepHesz_5Lwr7qRaqjB-p1A',
    proof: ['https://dpluskia.gg', 'https://www.youtube.com/watch?v=vQ5Q-dD87Zg']
  },
  BFX: {
    x: 'BNKFEARXLoL', ig: 'bnk_fearx', youtube: 'UCxedTJNaGRHiq6YfNtQVCNA',
    proof: ['https://www.youtube.com/watch?v=ffgjWPeI7xQ', 'https://x.com/BNKFEARXLoL/status/2122963019109945538']
  },
  BRO: {
    x: 'Brionesports', ig: 'brionesports', youtube: 'UCYQO6n0KZmwfwzWtm4_nAPA',
    proof: ['https://litt.ly/brionesports', 'https://www.youtube.com/watch?v=oIb5xWB8Re4']
  },
  KRX: {
    x: 'DRX_LCK', xAlso: ['DRX_Global'], ig: 'drxglobal', youtube: 'UC5WN-znPsJK0BbA8aHxZHWQ',
    proof: ['https://www.drx.gg/', 'https://litt.ly/drx_official', 'https://x.com/DRX_Global']
  },
  DNS: {
    x: 'SOOPers_LoL', ig: 'soopers_lol', youtube: 'UCLjQgCF-lhvn5kTj-_nGjPg',
    proof: ['https://soopers.gg/']
  }
};

// Links identify the specific announcement. Profile pages belong in CLUB_CHANNELS only.
const POST_EVIDENCE = [
  {team: 'NS', player: 'Deft', kind: 'in', links: [
    {url: 'https://x.com/NS_RedForce/status/2123357741892678032', platform: 'x', source: '농심 레드포스 X · 영입 발표'},
    {url: 'https://www.youtube.com/watch?v=0bKm23sM4XM', platform: 'youtube', source: '농심 레드포스 YouTube · Welcome Deft'},
    {url: 'https://x.com/NS_RedForce/status/2123361430158389441', platform: 'x', source: '농심 레드포스 X · 환영 영상'}
  ]},
  {team: 'NS', player: 'Pyosik', kind: 'in', links: [
    {url: 'https://x.com/NS_RedForce/status/2123373218912444889', platform: 'x', source: '농심 레드포스 X'}
  ]},
  {team: 'NS', player: 'Andil', kind: 'in', links: [
    {url: 'https://x.com/NS_RedForce/status/2123370715185639699', platform: 'x', source: '농심 레드포스 X'}
  ]},
  {team: 'KT', player: 'Raptor', kind: 'in', links: [
    {url: 'https://www.instagram.com/p/Df60FEiTmoD/', platform: 'ig', source: 'KT 롤스터 Instagram'},
    {url: 'https://x.com/KTRolsterLoL/status/2123355910454358286', platform: 'x', source: 'KT 롤스터 X'},
    {url: 'https://www.youtube.com/watch?v=NJeQk8VNq50', platform: 'youtube', source: 'KT 롤스터 YouTube · Welcome Raptor'}
  ]},
  {team: 'DNS', player: 'Bluffing', kind: 'in', until: 2028, links: [
    {url: 'https://x.com/SOOPers_LoL/status/2123355631793180874', platform: 'x', source: 'DN 수퍼스 X'},
    {url: 'https://www.youtube.com/watch?v=fbVJ-8PzNuo', platform: 'youtube', source: 'DN 수퍼스 YouTube · OFFICIAL #4'}
  ]},
  {team: 'T1', player: 'Doran', kind: 'out', links: [
    {url: 'https://x.com/T1LoL/status/2123340508978454951', platform: 'x', source: 'T1 X'},
    {url: 'https://www.youtube.com/watch?v=geP1C28wCeE', platform: 'youtube', source: 'T1 YouTube · 도란 작별 영상'}
  ]},
  {team: 'HLE', player: 'Kanavi', kind: 'out', links: [
    {url: 'https://x.com/HLEofficial/status/2123229103595860182', platform: 'x', source: '한화생명e스포츠 X'}
  ]},
  {team: 'HLE', player: 'Zeus', kind: 'out', links: [
    {url: 'https://x.com/HLEofficial/status/2123210041985761285', platform: 'x', source: '한화생명e스포츠 X'}
  ]},
  {team: 'DNS', player: 'Ucal', kind: 'in', links: [
    {url: 'https://x.com/SOOPers_LoL/status/2123008346878013600', platform: 'x', source: 'DN 수퍼스 X'},
    {url: 'https://www.youtube.com/watch?v=hGy_6SUSV9Y', platform: 'youtube', source: 'DN 수퍼스 YouTube · OFFICIAL #3'}
  ]},
  {team: 'DNS', player: 'Cuzz', kind: 'in', links: [
    {url: 'https://x.com/SOOPers_LoL/status/2122645987386864037', platform: 'x', source: 'DN 수퍼스 X'},
    {url: 'https://www.youtube.com/watch?v=lMs-NUUZerw', platform: 'youtube', source: 'DN 수퍼스 YouTube · OFFICIAL #2'}
  ]},
  {team: 'NS', player: 'Kingen', kind: 'renew', until: 2028, links: [
    {url: 'https://x.com/NS_RedForce/status/2122965531816841534', platform: 'x', source: '농심 레드포스 X'}
  ]},
  {team: 'NS', player: 'Calix', kind: 'renew', until: 2028, links: [
    {url: 'https://x.com/NS_RedForce/status/2122963016899580079', platform: 'x', source: '농심 레드포스 X'}
  ]},
  {team: 'BFX', player: 'Vincenzo', kind: 'in', until: 2028, links: [
    {url: 'https://x.com/BNKFEARXLoL/status/2122963019109945538', platform: 'x', source: 'BNK 피어엑스 X'},
    {url: 'https://www.youtube.com/watch?v=1gGLQ2gKN4A', platform: 'youtube', source: 'BNK 피어엑스 YouTube · Official #2'}
  ]},
  {team: 'BRO', player: 'SeTab', kind: 'in', links: [
    {url: 'https://x.com/Brionesports/status/2122887537018442057', platform: 'x', source: '한진 브리온 X'}
  ]},
  {team: 'GEN', player: 'Kiin', kind: 'out', links: [
    {url: 'https://x.com/GenG/status/2122479835192918393', platform: 'x', source: '젠지 X'}
  ]},
  {team: 'GEN', player: 'Canyon', kind: 'out', links: [
    {url: 'https://x.com/GenG/status/2122480083319308699', platform: 'x', source: '젠지 X'}
  ]},
  {team: 'T1', player: 'Faker', kind: 'existing', until: 2029, links: [
    {url: 'https://x.com/T1LoL/status/1949458170163642493', platform: 'x', source: 'T1 X · 2025년 재계약 발표'}
  ]},
  {team: 'T1', player: 'Oner', kind: 'existing', until: 2028, links: [
    {url: 'https://x.com/T1LoL/status/2003481975340863657', platform: 'x', source: 'T1 X · 계약 연장 발표'},
    {url: 'https://www.youtube.com/watch?v=o3AWTf_cRxE', platform: 'youtube', source: 'T1 YouTube · 오너의 크리스마스 선물'}
  ]},
  {team: 'T1', player: 'Keria', kind: 'existing', until: 2029, links: [
    {url: 'https://x.com/T1LoL/status/2048370809920712885', platform: 'x', source: 'T1 X · 재계약 발표'},
    {url: 'https://www.youtube.com/watch?v=7Pu1-h4e5ng', platform: 'youtube', source: 'T1 YouTube · 케리아 재계약 영상'}
  ]},
  {team: 'T1', player: 'Peyz', kind: 'existing', until: 2028, links: [
    {url: 'https://x.com/T1LoL/status/1991099133197758903', platform: 'x', source: 'T1 X · 영입 및 계약 기간 발표'}
  ]},
  ...['Casting', 'GIDEON', 'Roamer', 'Teddy', 'Namgung'].map(player => ({
    team: 'BRO', player, kind: 'renew', links: [
      {url: 'https://x.com/Brionesports/status/2113925129373978690', platform: 'x', source: '한진 브리온 X · 선수단 재계약'},
      {url: 'https://www.youtube.com/watch?v=37G_K553gZg', platform: 'youtube', source: '한진 브리온 YouTube · 재계약 선언문 낭독'}
    ]
  }))
];
