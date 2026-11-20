/* Original pixel landscape. The static terrain is painted once per canvas. */
(() => {
  const width = 336;
  const height = 126;

  function landscape(canvas) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return () => {};
    canvas.width = width;
    canvas.height = height;
    canvas.style.imageRendering = 'pixelated';
    const backdrop = document.createElement('canvas');
    backdrop.width = width;
    backdrop.height = height;
    const scene = backdrop.getContext('2d');
    let brush = scene;
    let seed = 43991;
    const rand = () => ((seed = (Math.imul(1664525, seed) + 1013904223) >>> 0) / 4294967296);
    const dot = (x, y, w, h, color) => {
      brush.fillStyle = color;
      brush.fillRect(Math.floor(x), Math.floor(y), w, h);
    };
    function shape(points, color) {
      const ys = points.map(point => point[1]);
      brush.fillStyle = color;
      for (let y = Math.max(0, Math.min(...ys)); y < Math.min(height, Math.max(...ys)); y++) {
        const cross = [];
        points.forEach(([x1, y1], i) => {
          const [x2, y2] = points[(i + 1) % points.length];
          if ((y1 <= y && y < y2) || (y2 <= y && y < y1))
            cross.push(x1 + (x2 - x1) * (y - y1) / (y2 - y1));
        });
        cross.sort((a, b) => a - b);
        for (let i = 0; i + 1 < cross.length; i += 2)
          brush.fillRect(Math.ceil(cross[i]), y, Math.ceil(cross[i + 1]) - Math.ceil(cross[i]), 1);
      }
    }
    function glow(x, y, radius, stops) {
      const fill = brush.createRadialGradient(x, y, 0, x, y, radius);
      stops.forEach(([offset, color]) => fill.addColorStop(offset, color));
      brush.fillStyle = fill;
      brush.fillRect(0, 0, width, height);
    }
    function pine(x, ground, size, shadow, rim) {
      const coords = [[0,0],[-1,4],[-.5,4],[-2.5,7],[-1.3,7],[-3.5,10],[-1.9,10],[-4.7,13.8],[-.8,13],[0,16],[.8,13],[4.9,13.8],[2.3,10.3],[3.5,10.3],[1.6,7],[2.4,7],[.65,4],[1.3,4]];
      const toWorld = ([dx, dy]) => [Math.round(x + dx * size / 16), Math.round(ground - size + dy * size / 16)];
      shape(coords.map(toWorld), shadow);
      if (size > 20 && rim)
        shape([[0,1],[-1.2,4.5],[-.2,4.4],[-2.2,7.2],[-.9,7],[-2.7,10],[.1,8.4],[.8,7.5],[.2,7.6],[.5,4.8],[.1,5]].map(toWorld), rim);
    }

    const sky = scene.createLinearGradient(0, 0, 0, 100);
    sky.addColorStop(0, '#0b1226');
    sky.addColorStop(.58, '#1b374b');
    sky.addColorStop(1, '#426a70');
    scene.fillStyle = sky;
    scene.fillRect(0, 0, width, height);
    glow(244, 31, 98, [[0,'rgba(54,125,135,.42)'],[.68,'rgba(40,83,100,.12)'],[1,'rgba(30,76,89,0)']]);
    for (let i = 0; i < 119; i++) {
      const x = Math.floor(rand() * width), y = Math.floor(rand() * 55);
      dot(x, y, 1, 1, ['#6c8f9b','#456576','#77999c','#334d63'][i % 4]);
    }
    [[170,16],[217,8],[280,20],[309,7]].forEach(([x,y]) => {
      dot(x - 1, y, 3, 1, '#708e97');
      dot(x, y - 2, 1, 5, '#708e97');
      dot(x, y, 1, 1, '#d9dfbd');
    });
    // A stepped crescent and narrow, high clouds.
    shape([[251,12],[255,12],[251,15],[249,19],[250,23],[253,26],[257,27],[262,25],[260,29],[256,31],[251,31],[247,29],[244,26],[243,22],[244,18],[246,15]], '#b5d8cb');
    shape([[251,13],[254,12],[249,16],[247,20],[248,25],[244,23],[245,18]], '#e2edcb');
    for (let i = 0; i < 19; i++) {
      const x = Math.round(105 + rand() * 210), y = Math.round(25 + rand() * 32), w = 7 + Math.round(rand() * 20);
      dot(x, y, w, 1, 'rgba(99,149,154,.16)');
      dot(x + 3, y - 1, Math.max(3,w-8), 1, 'rgba(99,149,154,.09)');
    }

    const farRidge = [[0,44],[18,37],[32,46],[50,31],[65,44],[83,36],[103,56],[116,42],[130,49],[153,28],[166,39],[183,51],[202,30],[212,40],[224,49],[239,41],[255,56],[270,47],[284,33],[299,48],[313,40],[336,49],[336,88],[0,88]];
    shape(farRidge, '#294457');
    [[[153,28],[151,37],[146,40],[147,37],[140,42]],[[202,30],[200,37],[197,40],[197,37],[191,42]],[[284,33],[282,40],[279,39],[275,44]],[[50,31],[49,36],[44,39]]].forEach(s => shape(s, '#53727a'));
    shape([[0,58],[25,46],[41,51],[71,33],[91,55],[107,50],[129,64],[151,53],[163,41],[185,64],[205,60],[220,50],[238,65],[259,52],[267,56],[286,45],[306,61],[330,44],[336,45],[336,91],[0,91]], '#253d50');
    [[[71,33],[73,41],[80,48],[76,47],[86,55],[79,52],[69,42],[65,45]],[[163,41],[165,47],[175,57],[167,53],[161,48],[158,48]],[[286,45],[291,54],[285,50],[279,53]],[[220,50],[223,57],[219,54],[215,57]]].forEach(s => shape(s, '#385668'));
    shape([[0,57],[37,60],[51,52],[68,58],[87,42],[106,56],[126,59],[142,63],[151,62],[179,70],[196,67],[219,58],[239,61],[260,54],[276,62],[294,51],[310,56],[336,46],[336,98],[0,98]], '#1c3243');

    function tower(x, y, s) {
      dot(x, y, 5*s, 12*s, '#13293a');
      dot(x+s, y-s*4, 3*s, 4*s, '#162d3e');
      shape([[x-s,y-s*3],[x+s*2,y-s*8],[x+s*6,y-s*3]], '#172e40');
      dot(x+s*2, y+s, s, 2*s, '#718e86');
      dot(x+s*4, y, s, 8*s, '#203b4b');
    }
    tower(183,60,1); tower(192,61,1); tower(187,58,1);
    dot(182,65,18,4,'#152c3c');
    for (let i=0;i<110;i++) {
      const x = Math.round(rand()*width), g = 73 + Math.round(5*Math.sin(x*.036));
      pine(x,g,4+Math.floor(rand()*10),'#1a3041');
    }
    shape([[0,71],[30,69],[57,76],[80,71],[112,77],[135,71],[161,76],[180,78],[199,74],[215,71],[237,72],[257,67],[284,65],[306,70],[336,61],[336,96],[0,96]], '#1d3542');
    shape([[137,77],[171,77],[183,79],[203,78],[211,79],[188,81],[195,83],[211,84],[164,89],[125,88],[151,84],[176,83],[168,81],[181,79]], '#3d6570');
    for(let i=0;i<25;i++) dot(153+rand()*39,78+rand()*9,1+Math.floor(rand()*5),1,'rgba(136,181,174,.27)');
    shape([[0,65],[32,68],[57,60],[86,70],[105,72],[120,79],[150,85],[170,86],[167,89],[0,110]], '#172c38');
    for(let i=0;i<68;i++) {
      const x=Math.round(rand()*width), g=x<163 ? 67+Math.round(x*.12) : 80-Math.round((x-185)*.055);
      if(x<153 || x>204) pine(x,g,6+Math.round(rand()*14),'#142c38');
    }
    // Layered shelves of stone falling into the gorge.
    shape([[0,88],[22,83],[44,80],[68,84],[88,82],[111,88],[127,87],[151,92],[172,90],[190,93],[210,91],[242,86],[267,84],[291,79],[320,74],[336,71],[336,126],[0,126]], '#10232e');
    shape([[129,115],[154,107],[171,104],[183,100],[201,99],[213,94],[240,88],[260,89],[269,86],[292,86],[314,82],[336,82],[336,126],[134,126]], '#1c3038');
    shape([[142,112],[164,106],[177,105],[192,100],[205,100],[214,96],[243,91],[264,92],[278,89],[303,90],[326,84],[336,86],[336,94],[317,96],[304,100],[282,100],[260,106],[233,108],[200,115],[167,117]], '#465248');
    shape([[142,112],[167,112],[194,109],[210,108],[218,106],[232,106],[245,102],[259,102],[271,98],[282,100],[304,97],[308,99],[336,90],[336,126],[134,126]], '#29373b');
    shape([[147,115],[167,114],[184,112],[180,117],[172,118],[169,123],[156,126],[139,126]], '#1b2c34');
    shape([[184,113],[203,110],[196,117],[189,119],[185,125],[176,126]], '#192a32');
    shape([[214,111],[237,105],[234,109],[224,111],[216,117],[213,119],[211,119]], '#3c4640');
    shape([[254,105],[267,100],[271,101],[263,108],[261,112],[257,113],[258,108]], '#39443e');
    shape([[284,102],[302,99],[297,104],[293,104],[288,110],[282,114],[286,106]], '#1e3036');
    for(let i=0;i<71;i++) {
      const x=169+rand()*159, y=109-(x-169)*.13+rand()*3;
      dot(x,y,1+Math.floor(rand()*4),1,['#5e6050','#68705b','#344b43','#404d44'][i%4]);
    }
    function grass(x,y,color) {
      shape([[x-4,y],[x-5,y-3],[x-2,y-1],[x-2,y-5],[x,y-2],[x+2,y-6],[x+1,y-1],[x+4,y-3],[x+2,y]],color);
    }
    [[169,107],[191,102],[210,98],[262,93],[294,90],[304,88],[318,87],[278,93]].forEach(([x,y],i) => grass(x,y,i%2?'#52604d':'#344b45'));
    // Bronze standard: a rigid gilded pole, weathered teal cloth and a pixel rune.
    dot(282,45,2,46,'#303736'); dot(282,46,1,45,'#ac8860'); dot(281,47,4,2,'#726449');
    shape([[282,41],[284,45],[282,47],[280,45]],'#d1b378');
    dot(284,48,19,1,'#bea376'); dot(283,49,19,1,'#655745');
    shape([[285,50],[300,50],[299,66],[296,70],[294,68],[289,74],[288,69],[285,72]],'#1a353f');
    shape([[286,50],[298,50],[297,65],[294,68],[293,66],[289,70],[288,66],[286,69]],'#346060');
    dot(287,50,1,17,'#8b9877'); dot(295,50,2,15,'#294e54');
    shape([[292,52],[295,56],[292,61],[289,56]],'#d5bd80');
    shape([[292,54],[293,56],[292,58],[291,56]],'#47817c');
    dot(291,61,2,3,'#ab9e71');
    shape([[277,92],[280,88],[284,88],[287,90],[286,92]],'#46514a');dot(280,89,3,1,'#707362');
    // An adventurer's sword resting in a cairn.
    shape([[215,83],[217,84],[211,98],[209,99],[210,95]],'#87979a');
    shape([[216,83],[217,84],[211,98],[210,98]],'#4c606b');
    shape([[212,82],[214,82],[219,85],[220,84],[219,87],[212,84]],'#aa8e67');
    shape([[215,83],[218,77],[219,78],[217,84]],'#524944');
    dot(218,76,2,2,'#c3a476');
    shape([[204,100],[207,96],[213,95],[217,98],[214,101]],'#34444b');dot(208,96,5,1,'#6c7770');
    // Close pines frame the scene. Their varied, asymmetric branches preserve depth.
    [[3,106,83],[18,102,62],[32,100,32],[53,95,46],[73,91,25],[95,93,25],[119,94,17],[146,93,15],[300,85,17],[314,86,36],[324,87,41],[339,92,65]].forEach(([x,y,h])=>pine(x,y,h,'#10232e','#223944'));
    shape([[0,97],[14,97],[29,91],[53,93],[72,88],[88,95],[105,94],[122,98],[140,97],[152,101],[164,103],[140,109],[131,114],[112,116],[127,119],[116,126],[0,126]],'#10202a');
    [[9,110,48],[35,106,28],[70,103,20],[96,102,15]].forEach(([x,y,h])=>pine(x,y,h,'#0c1c26','#182d37'));
    const shade = scene.createLinearGradient(0,0,195,0);
    shade.addColorStop(0,'rgba(9,16,25,.71)');shade.addColorStop(.6,'rgba(9,16,25,.39)');shade.addColorStop(1,'rgba(9,16,25,0)');
    scene.fillStyle=shade;scene.fillRect(0,0,195,height);
    glow(244,96,31,[[0,'rgba(255,143,50,.27)'],[.4,'rgba(222,104,40,.12)'],[1,'rgba(222,104,40,0)']]);
    shape([[231,98],[235,95],[245,94],[253,96],[257,98],[254,100],[240,102],[230,101]],'#2c302e');
    [[231,98],[235,96],[240,95],[249,95],[252,96],[254,98],[250,99],[245,100],[239,100],[234,100]].forEach(([x,y],i)=>{
      dot(x,y,3,2,i<5?'#71594a':'#55524a'); dot(x,y,2,1,i<5?'#a38a68':'#9e8162');
    });
    shape([[235,96],[248,91],[251,93],[237,99]],'#643e2a');dot(236,97,2,1,'#af6e41');
    shape([[235,92],[238,91],[252,97],[250,99]],'#835035');dot(248,97,3,1,'#d7914c');

    const movement = window.matchMedia('(prefers-reduced-motion: reduce)');
    let timeout;
    let visible = true;
    let count = 0;
    const tongues = [[0,0],[3,2],[2,5],[-1,4],[-3,1],[-1,-2]];
    function paint(frame) {
      brush=ctx;
      ctx.drawImage(backdrop,0,0);
      const [drift, lift]=tongues[frame % tongues.length], x=244, y=96;
      glow(x,y-7,25,[[0,'rgba(255,156,60,.35)'],[.46,'rgba(255,133,50,.12)'],[1,'rgba(255,111,35,0)']]);
      const flame = (points,color) => shape(points.map(([dx,dy]) => [x+dx,y+dy]),color);
      flame([[-9,-2],[-11,-7],[-9,-14],[-7,-11],[-7,-19],[-4,-16],[-1,-23],[drift,-31+lift],[3+drift,-25+lift],[2,-18],[6,-21],[6,-12],[9,-15],[8,-8],[11,-9],[8,-2],[4,0],[-4,0]],'#cf5b36');
      flame([[-8,-2],[-8,-9],[-5,-6],[-6,-15],[-3,-11],[-1,-18],[1+drift,-25+lift],[2,-20],[1,-14],[4,-16],[5,-11],[6,-7],[8,-10],[7,-3],[3,0],[-3,0]],'#ff913d');
      flame([[-5,-2],[-6,-6],[-4,-8],[-3,-6],[-2,-13],[1,-17+Math.floor(lift/2)],[0,-9],[2,-12],[4,-10],[4,-5],[6,-6],[4,-2],[0,0]],'#ffca5c');
      flame([[-2,-2],[-3,-5],[-1,-4],[0,-9],[2,-11],[1,-6],[3,-5],[2,-2]],'#fff1ac');
      for(let i=0;i<8;i++) {
        const t=(frame+i*5)%31;
        const dx=((i*7)%13)-6+Math.round(t*.15)+Math.round(Math.sin((frame+i)*.49)*2);
        dot(x+dx,y-9-t,1,i%3?1:2,t>22?'#bf8259':(i%2?'#ffb759':'#f18a42'));
      }
    }
    function update() {
      clearTimeout(timeout);
      if (!visible || document.hidden) return;
      paint(movement.matches ? 0 : count++);
      if (!movement.matches) timeout=setTimeout(update,155);
    }
    const visibility = typeof IntersectionObserver !== 'undefined' ? new IntersectionObserver(entries => {
      visible=entries[entries.length-1].isIntersecting; update();
    }) : null;
    visibility?.observe(canvas);
    movement.addEventListener('change',update);
    document.addEventListener('visibilitychange',update);
    update();
    return () => {
      clearTimeout(timeout);
      visibility?.disconnect();
      movement.removeEventListener('change',update);
      document.removeEventListener('visibilitychange',update);
    };
  }
  let current, stop;
  const start = () => {
    const canvas = document.getElementById('campfire');
    if (canvas === current) return;
    if (stop) stop();
    current = canvas;
    stop = canvas instanceof HTMLCanvasElement ? landscape(canvas) : undefined;
  };
  start();
  new MutationObserver(start).observe(document.documentElement,{childList:true,subtree:true});
})();
