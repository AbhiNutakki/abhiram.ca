/* A deliberately small ecological model. All units and rates are illustrative. */
(function(root){
'use strict';
class Ecosystem {
  constructor(seed=412){this.seed=seed;this.tick=0;this.nextId=0;this.stats={births:0,deaths:0,hunts:0,grazes:0,decomposed:0};this.animals=[];this.plants=[];this.fungi=[];this.islands=[0,1].map(()=>({cells:Array.from({length:144},()=>({nutrient:3,water:1,litter:.7}))}));
    for(let island=0;island<2;island++){for(let i=0;i<80;i++)this.plants.push({island,x:this.rand()*100,y:this.rand()*100,mass:1+this.rand()*2,age:this.rand()*700,seed:this.rand()*100});for(let i=0;i<9;i++)this.spawn('rabbit',island,this.rand()*100,this.rand()*100,16+this.rand()*9);for(let i=0;i<2;i++)this.spawn('fox',island,this.rand()*100,this.rand()*100,30+this.rand()*8);for(let i=0;i<10;i++)this.fungi.push({island,x:this.rand()*100,y:this.rand()*100,energy:5+this.rand()*4,age:0});}
  }
  rand(){this.seed=(Math.imul(this.seed,1664525)+1013904223)>>>0;return this.seed/4294967296;}
  spawn(type,island,x,y,energy){this.animals.push({id:++this.nextId,type,island,x,y,energy,age:0,vx:0,vy:0,target:null,cooldown:0});}
  cell(island,x,y){return this.islands[island].cells[Math.min(11,Math.max(0,Math.floor(y/100*12)))*12+Math.min(11,Math.max(0,Math.floor(x/100*12)))];}
  get light(){return Math.max(.08,(Math.sin((this.tick%360)/360*Math.PI*2)+1)/2);}
  get raining(){return this.tick%270<62;}
  nearest(a,list,accept){let best=null,dist=Infinity;for(const b of list){if(b.island!==a.island||b===a||accept&&!accept(b))continue;const d=(a.x-b.x)**2+(a.y-b.y)**2;if(d<dist){best=b;dist=d;}}return {target:best,distance:Math.sqrt(dist)};}
  step(){this.tick++;const light=this.light,rain=this.raining;
    for(const island of this.islands)for(const c of island.cells){c.water=Math.max(0,Math.min(2,c.water+(rain?.026:-.0015)));}
    for(const p of this.plants){const c=this.cell(p.island,p.x,p.y);p.age++;if(p.mass<.08){p.mass=0;if(c.nutrient>.2&&c.water>.2&&light>.35&&this.rand()<.012){p.mass=.16;c.nutrient-=.016;p.age=0;}continue;}const growth=Math.min((5-p.mass)*.012*light*Math.min(1,c.water),c.nutrient*2,c.water*2);p.mass+=growth;c.nutrient=Math.max(0,c.nutrient-growth*.1);c.water=Math.max(0,c.water-growth*.07);const shed=.0015*p.mass;p.mass-=shed;c.litter+=shed*.1;if(p.age>1800||c.water<.01){c.litter+=p.mass*.1;p.mass=0;p.age=0;}}
    // Colonies stay rooted; a local hyphal network consumes adjacent litter and releases nutrients.
    const newFungi=[];for(const f of this.fungi){const c=this.cell(f.island,f.x,f.y);let best=c;for(const [dx,dy] of [[0,8],[0,-8],[8,0],[-8,0]]){const x=Math.max(0,Math.min(99,f.x+dx)),y=Math.max(0,Math.min(99,f.y+dy)),n=this.cell(f.island,x,y);if(n.litter>best.litter){best=n;}}const home=best;const meal=Math.min(home.litter,.025*(.2+Math.min(1,home.water)));home.litter-=meal;home.nutrient+=meal*.93;f.energy+=meal*4-.012;f.age++;this.stats.decomposed+=meal;if(f.energy>12&&this.fungi.length+newFungi.length<70){f.energy*=.5;newFungi.push({island:f.island,x:Math.max(0,Math.min(99,f.x+(this.rand()-.5)*15)),y:Math.max(0,Math.min(99,f.y+(this.rand()-.5)*15)),energy:f.energy,age:0});}if(f.energy<=0||f.age>1800){home.litter+=.1;f.dead=true;}}this.fungi=this.fungi.filter(f=>!f.dead).concat(newFungi);
    const born=[];for(const a of this.animals){if(a.dead)continue;a.age++;a.cooldown=Math.max(0,a.cooldown-1);const rabbit=a.type==='rabbit';a.energy-=rabbit?.045:.064;const cell=this.cell(a.island,a.x,a.y);cell.litter+=rabbit?.002:.003;let destination=null,speed=rabbit?.30:.39;
      if(rabbit){const threat=this.nearest(a,this.animals,b=>b.type==='fox'&&!b.dead);if(threat.target&&threat.distance<14){destination={x:a.x+(a.x-threat.target.x)*3,y:a.y+(a.y-threat.target.y)*3};speed=.57;a.energy-=.012;}else{const food=this.nearest(a,this.plants,p=>p.mass>.22);destination=food.target;if(food.target&&food.distance<2.6){const bite=Math.min(.18,food.target.mass);food.target.mass-=bite;a.energy+=bite*1.9;this.stats.grazes++;}}}
      else{const prey=this.nearest(a,this.animals,b=>b.type==='rabbit'&&!b.dead);destination=prey.target;if(prey.target&&prey.distance<2.3){prey.target.dead=true;a.energy+=12+prey.target.energy*.3;this.cell(a.island,prey.target.x,prey.target.y).litter+=1;this.stats.hunts++;this.stats.deaths++;}if(prey.distance<12)speed=.63;}
      if(destination){const dx=destination.x-a.x,dy=destination.y-a.y,d=Math.hypot(dx,dy)||1;a.vx=a.vx*.4+dx/d*speed*.6;a.vy=a.vy*.4+dy/d*speed*.6;}else{a.vx+=(this.rand()-.5)*.08;a.vy+=(this.rand()-.5)*.08;}a.x=Math.max(1,Math.min(99,a.x+a.vx));a.y=Math.max(1,Math.min(99,a.y+a.vy));
      const threshold=rabbit?29:57,limit=rabbit?90:18,count=this.animals.filter(b=>b.type===a.type&&!b.dead).length;if(a.energy>threshold&&a.age>90&&!a.cooldown&&count+born.filter(b=>b.type===a.type).length<limit){a.energy*=.46;a.cooldown=100;born.push({type:a.type,island:a.island,x:a.x+(this.rand()-.5)*3,y:a.y+(this.rand()-.5)*3,energy:a.energy});this.stats.births++;}
      if(a.energy<=0||a.age>(rabbit?1500:2300)){a.dead=true;cell.litter+=rabbit?2:4;this.stats.deaths++;}}
    this.animals=this.animals.filter(a=>!a.dead);for(const b of born)this.spawn(b.type,b.island,b.x,b.y,b.energy);
  }
  summary(){const cells=this.islands.flatMap(i=>i.cells);return{tick:this.tick,plants:this.plants.filter(p=>p.mass>.08).length,rabbits:this.animals.filter(a=>a.type==='rabbit').length,foxes:this.animals.filter(a=>a.type==='fox').length,fungi:this.fungi.length,soil:cells.reduce((s,c)=>s+c.nutrient,0),litter:cells.reduce((s,c)=>s+c.litter,0),light:this.light,rain:this.raining,...this.stats};}
}
if(typeof module!=='undefined'&&module.exports)module.exports=Ecosystem;else root.Ecosystem=Ecosystem;
})(typeof window!=='undefined'?window:this);
