import {createGirlSpriteCompanion} from '../characters/GirlSprite.js';

/** Remote guests reuse the exact same 2.5D female atlas, not a new avatar. */
export function createRemoteWalkers(scene,hill,camera){
  const visitors=new Map();
  function valid(p){
    return !!p&&typeof p.id==='string'&&p.id.length<90&&
      [p.x,p.z,p.vx,p.vz].every(v=>typeof v==='number'&&Number.isFinite(v));
  }
  function remove(id){
    const w=visitors.get(id);
    if(!w)return;
    scene.remove(w.avatar.group);
    const sprite=w.avatar.sprite;
    sprite.material.map?.dispose();
    sprite.material.dispose();
    const shadow=w.avatar.group.children.find(c=>c.isMesh);
    if(shadow){shadow.geometry.dispose();shadow.material.dispose();}
    visitors.delete(id);
  }
  function add(p){
    if(!valid(p))return;
    if(visitors.has(p.id)){move(p);return;}
    const avatar=createGirlSpriteCompanion(scene,hill,camera);
    visitors.set(p.id,{avatar,x:p.x,z:p.z,tx:p.x,tz:p.z,age:0});
  }
  function move(p){
    if(!valid(p))return;
    const w=visitors.get(p.id);
    if(!w){add(p);return;}
    w.tx=p.x;w.tz=p.z;w.age=0;
  }
  function reset(players=[]){
    for(const id of [...visitors.keys()])remove(id);
    for(const p of players)add(p);
  }
  function update(dt,elapsed){
    const alpha=1-Math.exp(-dt*11);
    for(const w of visitors.values()){
      w.age+=dt;
      const oldX=w.x,oldZ=w.z;
      if(w.age<2){w.x+=(w.tx-w.x)*alpha;w.z+=(w.tz-w.z)*alpha;}
      const vx=(w.x-oldX)/Math.max(dt,.001);
      const vz=(w.z-oldZ)/Math.max(dt,.001);
      w.avatar.update({x:w.x,z:w.z,vx,vz,dt,elapsed,
        walking:Math.hypot(vx,vz)>.13,visible:true});
    }
  }
  return {add,move,remove,reset,update,count:()=>visitors.size};
}
