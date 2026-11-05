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
function resize(){width=innerWidth;height=innerHeight;unit=width<700?3:4;const dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);render();}
function tile(x,y,color,alpha){ctx.globalAlpha=alpha;ctx.fillStyle=color;ctx.fillRect(Math.round(x)*unit+.4,Math.round(y)*unit+.4,unit-.8,unit-.8);}
function place(a,cols,rows){const islandCols=Math.floor(cols/2);return {x:a.island*islandCols+Math.round(2+a.x/100*(islandCols-23)),y:Math.round(4+a.y/100*(rows-20))};}
function sprite(shape,position,colors,alpha,flip=false,bounce=0){const sw=Math.max(...shape.map(r=>r.length));for(let y=0;y<shape.length;y++)for(let x=0;x<shape[y].length;x++){const color=colors[shape[y][x]];if(color)tile(position.x+(flip?sw-1-x:x),position.y+y+bounce,color,alpha);}}
function render(){ctx.clearRect(0,0,width,height);const cols=Math.ceil(width/unit),rows=Math.ceil(height/unit),islandCols=Math.floor(cols/2);
  // The same grid underlies terrain cells, resources, and every creature sprite.
  ctx.globalAlpha=.32;ctx.strokeStyle='#e7ebe1';ctx.lineWidth=.5;ctx.beginPath();for(let x=0;x<width;x+=unit){ctx.moveTo(x+.5,0);ctx.lineTo(x+.5,height);}for(let y=0;y<height;y+=unit){ctx.moveTo(0,y+.5);ctx.lineTo(width,y+.5);}ctx.stroke();
  world.islands.forEach((island,index)=>{island.cells.forEach((cell,n)=>{const gx=n%12,gy=Math.floor(n/12),px=index*islandCols+Math.round((gx+.5)/12*(islandCols-4)),py=Math.round((gy+.5)/12*(rows-3));if(cell.litter>.4)tile(px,py,'#baad8a',Math.min(.32,cell.litter*.08));if(cell.water>1.35&&gy>8){tile(px,py+1,'#a5c3c2',.29);tile(px+1,py+1,'#c1d4ce',.26);}});});
  for(const p of world.plants){if(p.mass<.15)continue;const pos=place(p,cols,rows);const shape=p.mass>4.1?flower:p.mass>1.7?fern:sprout;pos.y+=12-shape.length;sprite(shape,pos,palette.plant,.32+Math.min(p.mass,5)*.035,p.seed>50);}
  for(const f of world.fungi){const pos=place(f,cols,rows);pos.y+=7;sprite(mushroom,pos,palette.fungi,.48);}
  for(const a of world.animals){const pos=place(a,cols,rows),rabbitType=a.type==='rabbit',walk=!paused&&(Math.abs(a.vx)+Math.abs(a.vy)>.1)&&Math.floor(frame/9+a.id)%2===0?1:0;sprite(rabbitType?rabbit:fox,pos,rabbitType?palette.rabbit:palette.fox,.73,a.vx<0,walk);}
  if(world.raining){for(let i=0;i<Math.floor(cols/3);i++){const x=(i*31)%cols,y=(i*17+Math.floor(frame/3))%rows;tile(x,y,'#afc4cc',.28);}}
  ctx.globalAlpha=1;
}
function update(){const s=world.summary();mini.textContent=`${s.rabbits} rabbits / ${s.foxes} foxes${paused?' / paused':''}`;weather.textContent=`day ${Math.floor(s.tick/360)+1} / ${s.light<.25?'night':s.light>.75?'daylight':'twilight'} / ${s.rain?'rain':'dry'}`;counts.innerHTML=`<span><b>${s.plants}</b>plant patches</span><span><b>${s.rabbits}</b>rabbits</span><span><b>${s.foxes}</b>foxes</span><span><b>${s.fungi}</b>fungal colonies</span><span>${s.births} animal births</span><span>${s.hunts} successful hunts</span><span>${s.deaths} animal deaths</span><span>${Math.round(s.decomposed)} litter recycled</span>`;pause.textContent=paused?'[resume]':'[pause]';pause.setAttribute('aria-pressed',String(paused));}
function loop(timestamp){if(document.hidden){lastTime=timestamp;requestAnimationFrame(loop);return;}const elapsed=Math.min(timestamp-lastTime,150);lastTime=timestamp;if(!paused){accumulator+=elapsed*rate;while(accumulator>=125){world.step();accumulator-=125;}frame++;if(frame%3===0)render();if(frame%10===0)update();}requestAnimationFrame(loop);}
pause.addEventListener('click',()=>{paused=!paused;update();render();});speedButton.addEventListener('click',()=>{rate=rate===1?4:1;speedButton.textContent='['+rate+'x]';speedButton.setAttribute('aria-pressed',String(rate===4));});document.querySelector('#eco-reset').addEventListener('click',()=>{world=new Ecosystem(Math.floor(Math.random()*4294967295));accumulator=0;update();render();});motion.addEventListener('change',()=>{paused=motion.matches;update();render();});window.addEventListener('resize',resize);resize();update();requestAnimationFrame(loop);
})();
