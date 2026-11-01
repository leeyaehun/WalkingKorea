import {createGirlSpriteCompanion} from '../characters/GirlSprite.js';
import {SEND_INTERVAL_MS} from './protocol.js';

const MAX_RETRY_MS=20000;
const SMOOTHING=11;
const SNAP_DISTANCE=8;

export function createWalkMultiplayer({scene,hill,camera,onStatus}) {
  let socket=null,connected=false,started=false,localId=null,room=null;
  let reconnectDelay=1200,retry=null,lastSent=-Infinity,lastCount=1;
  const peers=new Map();
  const setStatus=(message)=>onStatus?.(message);
  const websocketUrl=()=>{
    const protocol=location.protocol==='https:'?'wss:':'ws:';
    return protocol+'//'+location.host+'/api/walk/join';
  };
  function removePeer(id){
    const peer=peers.get(id);
    if(!peer)return;
    scene.remove(peer.girl.group);
    peer.girl.group.traverse(node=>{
      node.geometry?.dispose?.();
      if(node.material){
        const materials=Array.isArray(node.material)?node.material:[node.material];
        for(const material of materials){material.map?.dispose?.();material.dispose?.();}
      }
    });
    peers.delete(id);
  }
  function clearPeers(){for(const id of peers.keys())removePeer(id);}
  function onPlayer(data){
    if(!data||typeof data.id!=='string'||data.id===localId)return;
    const {x,z,vx,vz}=data;
    if(![x,z,vx,vz].every(Number.isFinite))return;
    let peer=peers.get(data.id);
    if(!peer){
      peer={girl:createGirlSpriteCompanion(scene,hill,camera),
        x,z,targetX:x,targetZ:z,updatedAt:performance.now()};
      peers.set(data.id,peer);
    }
    peer.targetX=x;peer.targetZ=z;peer.updatedAt=performance.now();
  }
  function connectionLost(){
    connected=false;localId=null;room=null;lastCount=1;clearPeers();
    setStatus('혼자 산책 중 · 재연결 중');
    if(!started||retry)return;
    const delay=reconnectDelay;
    reconnectDelay=Math.min(MAX_RETRY_MS,reconnectDelay*1.7);
    retry=setTimeout(()=>{retry=null;connect();},delay);
  }
  function connect(){
    if(!started||socket&&(socket.readyState===WebSocket.CONNECTING||
      socket.readyState===WebSocket.OPEN))return;
    setStatus('산책방 연결 중…');
    const ws=new WebSocket(websocketUrl());
    socket=ws;
    ws.onopen=()=>{lastSent=-Infinity;};
    ws.onmessage=(event)=>{
      let data;
      try{data=JSON.parse(event.data);}catch{return;}
      if(!data||typeof data!=='object')return;
      switch(data.type){
        case 'welcome':
          if(typeof data.id!=='string'||!Array.isArray(data.players))return;
          localId=data.id;
          room=Number(data.room)||1;connected=true;reconnectDelay=1200;
          clearPeers();
          for(const p of data.players)onPlayer(p);
          setStatus('산책방 '+room+' · '+(peers.size+1)+'/8명');
          break;
        case 'enter':onPlayer(data.player);break;
        case 'pose':onPlayer(data);break;
        case 'leave':if(typeof data.id==='string')removePeer(data.id);break;
        case 'count':
          if(Number.isInteger(data.count)&&data.count>=1&&data.count<=8){
            lastCount=data.count;
            if(connected)setStatus('산책방 '+room+' · '+data.count+'/8명');
          }
          break;
        default:break;
      }
    };
    ws.onclose=()=>{
      if(socket!==ws)return;
      socket=null;connectionLost();
    };
    ws.onerror=()=>{ws.close();};
  }
  function start(){
    if(started)return;
    started=true;connect();
  }
  function update({x,z,vx,vz,dt,elapsed,walking}){
    const now=performance.now();
    if(connected&&socket?.readyState===WebSocket.OPEN&&now-lastSent>=SEND_INTERVAL_MS){
      socket.send(JSON.stringify({type:'pose',x,z,vx,vz}));
      lastSent=now;
    }
    for(const peer of peers.values()){
      const gap=Math.hypot(peer.targetX-peer.x,peer.targetZ-peer.z);
      if(gap>SNAP_DISTANCE){
        peer.x=peer.targetX;peer.z=peer.targetZ;
      }else{
        const t=1-Math.exp(-Math.min(.12,dt)*SMOOTHING);
        peer.x+=(peer.targetX-peer.x)*t;
        peer.z+=(peer.targetZ-peer.z)*t;
      }
      const recentlyMoving=now-peer.updatedAt<550;
      const dx=peer.targetX-peer.x,dz=peer.targetZ-peer.z;
      const speed=Math.hypot(dx,dz);
      const factor=recentlyMoving?Math.min(3.35,speed/Math.max(.016,dt)):0;
      peer.girl.update({x:peer.x,z:peer.z,
        vx:speed>.001?dx/speed*factor:0,
        vz:speed>.001?dz/speed*factor:0,
        dt,elapsed,walking:recentlyMoving&&factor>.13,visible:true});
    }
  }
  function stop(){
    started=false;
    if(retry){clearTimeout(retry);retry=null;}
    socket?.close(1000,'leaving');socket=null;
    connected=false;clearPeers();
  }
  return {start,update,stop,getStatus:()=>({
    connected,room,count:lastCount,visiblePeers:peers.size
  })};
}
