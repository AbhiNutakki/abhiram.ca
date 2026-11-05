(function(){
'use strict';
let world=new Ecosystem(Math.floor(Math.random()*4294967295));
const canvas=document.querySelector('#ecosystem-bg'),ctx=canvas.getContext('2d'),mini=document.querySelector('#eco-mini'),counts=document.querySelector('#eco-counts'),weather=document.querySelector('#eco-weather'),pause=document.querySelector('#eco-pause'),speedButton=document.querySelector('#eco-speed');
const motion=matchMedia('(prefers-reduced-motion: reduce)');let paused=motion.matches,rate=1,frame=0,lastTime=0,accumulator=0,width=innerWidth,height=innerHeight,unit=4;
const rabbit=[".....g.g...",".....g.g...",".....ccc...","....cccck..",".ccccccccc.","cccccccccc.",".cccccccc..","..gg..gg..."];
const fox=["........o.o..","........ooo..",".......ookoo.","wwoooooooooak",".woooooooaa..","..ooooooo....","...k...k....."];
const fern=['...l...','...lg..','.l.gl..','..lgl..','ll.g.ll','..lgl..','.l.g.l.','...g...'];
const flower=['..y..','.ycy.','..y..','..g..','lg.g.','.lgl.','..g..'];
const sprout=['l.l','.g.','.g.'];
const mushroom=['..rrrr..','.rwrwrr.','rrrrrrrr','.cccccc.','...cc...','...cc...','..dddd..'];
const palette={rabbit:{"g":"#aeb6a2","c":"#d9ddce","k":"#65735a"},fox:{"o":"#cf946c","w":"#eee6d6","a":"#eee6d6","k":"#6f6c55"},plant:{l:'#a8b887',g:'#7f9c71',y:'#d4be79',c:'#ad9962'},fungi:{r:'#bd8b75',w:'#ece2c9',c:'#d8cfb1',d:'#a5a084'}};
const sky={sun:['..yyy..','.yyyyy.','yyyyyyy','yyyyyyy','yyyyyyy','.yyyyy.','..yyy..'],moon:['..mm...','.mm....','mmm....','mmm....','mmmm...','.mmmmm.','..mmm..']};
const root=document.documentElement;
function mix(a,b,t){return '#'+a.map((v,i)=>Math.round(v+(b[i]-v)*t).toString(16).padStart(2,'0')).join('');}
function readable(bg,muted=false){const lum=hex=>{const rgb=hex.match(/[a-f0-9]{2}/gi).map(v=>parseInt(v,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722;};const light='#e4e9e1',dark='#282a27',l=lum(bg),contrast=hex=>(Math.max(l,lum(hex))+.05)/(Math.min(l,lum(hex))+.05),ink=contrast(light)>contrast(dark)?light:dark,candidate=ink===light?'#a2afab':'#646960';return muted&&contrast(candidate)>=4.5?candidate:contrast(ink)>=4.5?ink:l>.179?'#000000':'#ffffff';}
function phase(){const t=(world.tick%360)/360;return t<.125||t>=.875?'dawn':t<.375?'daylight':t<.625?'dusk':'night';}
function lighting(){const daylight=Math.min(1,Math.max(0,(world.light-.08)/.92)),night=1-daylight;
  const colors={
    '--cycle-bg':[[22,30,39],[255,255,255]],
    '--ink':[[228,233,225],[40,42,39]],
    '--line':[[55,66,73],[235,237,232]],
    '--cycle-muted':[[162,175,171],[119,122,115]],
    '--cycle-link':[[147,169,157],[164,168,157]],
    '--cycle-yellow':[[76,68,37],[251,244,188]],
    '--cycle-lavender':[[65,52,81],[233,222,247]],
    '--cycle-blue':[[40,63,83],[223,234,248]],
    '--cycle-rose':[[77,49,65],[243,223,233]]
  };
  for(const [key,[dark,light]] of Object.entries(colors))root.style.setProperty(key,mix(dark,light,daylight));
  const background=mix([22,30,39],[255,255,255],daylight);
  root.style.setProperty('--ink',readable(background));
  root.style.setProperty('--cycle-muted',readable(background,true));
  for(const name of ['yellow','lavender','blue','rose']){const [dark,light]=colors['--cycle-'+name];root.style.setProperty('--cycle-'+name+'-ink',readable(mix(dark,light,daylight)));}
  root.style.setProperty('--cycle-canvas-opacity' ,String(.42+night*.25));
  root.dataset.night=String(daylight<.35);
  document.querySelector('meta[name="theme-color"]').content=mix([22,30,39],[255,255,255],daylight);
  return {daylight,night};
}
function resize(){width=innerWidth;height=innerHeight;unit=width<700?3:4;const dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);render();}
function tile(x,y,color,alpha){ctx.globalAlpha=alpha;ctx.fillStyle=color;ctx.fillRect(Math.round(x)*unit+.4,Math.round(y)*unit+.4,unit-.8,unit-.8);}
function place(a,cols,rows){const islandCols=Math.floor(cols/2);return {x:a.island*islandCols+Math.round(2+a.x/100*(islandCols-23)),y:Math.round(4+a.y/100*(rows-20))};}
function sprite(shape,position,colors,alpha,flip=false,bounce=0){const sw=Math.max(...shape.map(r=>r.length));for(let y=0;y<shape.length;y++)for(let x=0;x<shape[y].length;x++){const color=colors[shape[y][x]];if(color)tile(position.x+(flip?sw-1-x:x),position.y+y+bounce,color,alpha);}}
function render(){const {daylight,night}=lighting();ctx.clearRect(0,0,width,height);const cols=Math.ceil(width/unit),rows=Math.ceil(height/unit),islandCols=Math.floor(cols/2);
  // The same grid underlies terrain cells, resources, and every creature sprite.
  ctx.globalAlpha=.32;ctx.strokeStyle=mix([78,95,107],[231,235,225],daylight);ctx.lineWidth=.5;ctx.beginPath();for(let x=0;x<width;x+=unit){ctx.moveTo(x+.5,0);ctx.lineTo(x+.5,height);}for(let y=0;y<height;y+=unit){ctx.moveTo(0,y+.5);ctx.lineTo(width,y+.5);}ctx.stroke();
  // A fixed star field and grid-drawn sun/moon follow the same simulation clock.
  if(night>.35){for(let i=0;i<30;i++){const x=(i*73+19)%cols,y=(i*37+7)%Math.max(1,Math.floor(rows*.7));tile(x,y,'#d6e0ce',(night-.35)*.85);}}
  const cycle=(world.tick%360)/360,dayArc=cycle<.5,arc=dayArc?cycle*2:(cycle-.5)*2;
  const skyPos={x:Math.round(cols*(.08+.84*arc)),y:Math.round(5+Math.sin(arc*Math.PI)*5)};
  sprite(dayArc?sky.sun:sky.moon,skyPos,{y:'#cfac60',m:'#c9d5d5'},.65);
  world.islands.forEach((island,index)=>{island.cells.forEach((cell,n)=>{const gx=n%12,gy=Math.floor(n/12),px=index*islandCols+Math.round((gx+.5)/12*(islandCols-4)),py=Math.round((gy+.5)/12*(rows-3));if(cell.litter>.4)tile(px,py,'#baad8a',Math.min(.32,cell.litter*.08));if(cell.water>1.35&&gy>8){tile(px,py+1,'#a5c3c2',.29);tile(px+1,py+1,'#c1d4ce',.26);}});});
  for(const p of world.plants){if(p.mass<.15)continue;const pos=place(p,cols,rows);const shape=p.mass>4.1?flower:p.mass>1.7?fern:sprout;pos.y+=12-shape.length;sprite(shape,pos,palette.plant,.32+Math.min(p.mass,5)*.035,p.seed>50);}
  for(const f of world.fungi){const pos=place(f,cols,rows);pos.y+=7;sprite(mushroom,pos,palette.fungi,.48);}
  for(const a of world.animals){const pos=place(a,cols,rows),rabbitType=a.type==='rabbit',walk=!paused&&(Math.abs(a.vx)+Math.abs(a.vy)>.1)&&Math.floor(frame/9+a.id)%2===0?1:0;sprite(rabbitType?rabbit:fox,pos,rabbitType?palette.rabbit:palette.fox,.73,a.vx<0,walk);}
  if(world.raining){for(let i=0;i<Math.floor(cols/3);i++){const x=(i*31)%cols,y=(i*17+Math.floor(frame/3))%rows;tile(x,y,'#afc4cc',.28);}}
  ctx.globalAlpha=1;
}
function update(){const s=world.summary();mini.textContent=`${phase()} / ${s.rabbits} rabbits / ${s.foxes} foxes${paused?' / paused':''}`;weather.textContent=`day ${Math.floor(s.tick/360)+1} / ${phase()} / ${s.rain?'rain':'dry'}`;counts.innerHTML=`<span><b>${s.plants}</b>plant patches</span><span><b>${s.rabbits}</b>rabbits</span><span><b>${s.foxes}</b>foxes</span><span><b>${s.fungi}</b>fungal colonies</span><span>${s.births} animal births</span><span>${s.hunts} successful hunts</span><span>${s.deaths} animal deaths</span><span>${Math.round(s.decomposed)} litter recycled</span>`;pause.textContent=paused?'[resume]':'[pause]';pause.setAttribute('aria-pressed',String(paused));}
function loop(timestamp){if(document.hidden){lastTime=timestamp;requestAnimationFrame(loop);return;}const elapsed=Math.min(timestamp-lastTime,150);lastTime=timestamp;if(!paused){accumulator+=elapsed*rate;while(accumulator>=125){world.step();accumulator-=125;}frame++;if(frame%3===0)render();if(frame%10===0)update();}requestAnimationFrame(loop);}
pause.addEventListener('click',()=>{paused=!paused;update();render();});speedButton.addEventListener('click',()=>{rate=rate===1?4:1;speedButton.textContent='['+rate+'x]';speedButton.setAttribute('aria-pressed',String(rate===4));});document.querySelector('#eco-reset').addEventListener('click',()=>{world=new Ecosystem(Math.floor(Math.random()*4294967295));accumulator=0;update();render();});motion.addEventListener('change',()=>{paused=motion.matches;update();render();});window.addEventListener('resize',resize);resize();update();requestAnimationFrame(loop);
})();
