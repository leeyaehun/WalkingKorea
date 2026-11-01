import {createGirlSpriteCompanion} from '../characters/GirlSprite.js';
import {SEND_INTERVAL_MS} from './protocol.js';
import {validPrivateRoomToken} from './PrivateRoomLinks.js';

const MAX_RETRY_MS=20000;
const SMOOTHING=11;
const SNAP_DISTANCE=8;
const HEARTBEAT_INTERVAL_MS=15000;
const WATCHDOG_INTERVAL_MS=5000;
const STALE_CONNECTION_MS=45000;
const CONNECT_TIMEOUT_MS=14000;
const FULL_ROOM_RETRY_MS=15000;

export function createWalkMultiplayer({scene,hill,camera,onStatus,initialRoomToken=null}) {
  let socket=null,connected=false,started=false,localId=null,room=null;
  let reconnectDelay=1200,retry=null,lastSent=-Infinity,lastCount=1;
  let lastHeard=0,lastPing=0,connectStarted=0,watchdog=null,roomFull=false;
  let roomToken=validPrivateRoomToken(initialRoomToken)?initialRoomToken:null;
  const peers=new Map();
  const setStatus=(message)=>onStatus?.(message);
  const websocketUrl=()=>{
    const protocol=location.protocol==='https:'?'wss:':'ws:';
    const base=protocol+'//'+location.host+'/api/walk/join';
    return roomToken?base+'?room='+encodeURIComponent(roomToken):base;
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
        x,z,vx,vz,targetX:x,targetZ:z,updatedAt:performance.now()};
      peers.set(data.id,peer);
    }
    peer.targetX=x;peer.targetZ=z;
    peer.vx=vx;peer.vz=vz;
    peer.updatedAt=performance.now();
  }
  const isHidden=()=>typeof document!=='undefined'&&document.hidden;
  function statusLabel(){
    if(roomFull&&roomToken)return '비공개 방 정원이 가득 찼어요 (8/8) · 자리 확인 중';
    return roomToken?'비공개 방 연결 끊김 · 재시도 중':'혼자 산책 중 · 재연결 중';
  }
  function connectionLost(){
    connected=false;localId=null;room=null;lastCount=1;clearPeers();
    if(!started)return;
    setStatus(statusLabel());
    if(retry)return;
    const delay=roomFull?Math.max(FULL_ROOM_RETRY_MS,reconnectDelay):reconnectDelay;
    reconnectDelay=Math.min(MAX_RETRY_MS,reconnectDelay*1.7);
    retry=setTimeout(()=>{retry=null;connect();},delay);
  }
  function send(ws,message){
    try{
      if(ws.readyState!==WebSocket.OPEN)return false;
      ws.send(JSON.stringify(message));
      return true;
    }catch{
      try{ws.close();}catch{}
      return false;
    }
  }
  function connect(){
    if(!started||socket&&(socket.readyState===WebSocket.CONNECTING||
      socket.readyState===WebSocket.OPEN))return;
    setStatus(roomFull&&roomToken?'비공개 방 자리 확인 중…':
      roomToken?'비공개 방 연결 중…':'산책방 연결 중…');
    let ws;
    try{ws=new WebSocket(websocketUrl());}
    catch{connectionLost();return;}
    socket=ws;connectStarted=performance.now();
    ws.onopen=()=>{
      if(socket!==ws)return;
      lastSent=-Infinity;lastHeard=performance.now();lastPing=lastHeard;
    };
    ws.onmessage=(event)=>{
      if(socket!==ws)return; // Old room events must never enter the next room.
      lastHeard=performance.now();
      let data;
      try{data=JSON.parse(event.data);}catch{return;}
      if(!data||typeof data!=='object')return;
      switch(data.type){
        case 'welcome':
          if(typeof data.id!=='string'||!Array.isArray(data.players))return;
          if(roomToken && data.mode!=='private')return;
          if(!roomToken && data.mode==='private')return;
          localId=data.id;room=roomToken?null:Number(data.room)||1;
          connected=true;roomFull=false;reconnectDelay=1200;
          clearPeers();
          for(const p of data.players)onPlayer(p);
          setStatus((roomToken?'비공개 방':'산책방 '+room)+' · '+(peers.size+1)+'/8명');
          break;
        case 'room_full':
          if(roomToken){
            roomFull=true;
            setStatus(statusLabel());
            try{ws.close(1000,'room is full');}catch{}
          }
          break;
        case 'pong':break;
        case 'enter':if(connected)onPlayer(data.player);break;
        case 'pose':if(connected)onPlayer(data);break;
        case 'leave':if(connected&&typeof data.id==='string')removePeer(data.id);break;
        case 'count':
          if(connected&&Number.isInteger(data.count)&&data.count>=1&&data.count<=8){
            lastCount=data.count;
            setStatus((roomToken?'비공개 방':'산책방 '+room)+' · '+data.count+'/8명');
          }
          break;
        default:break;
      }
    };
    ws.onclose=()=>{
      if(socket!==ws)return;
      socket=null;connectionLost();
    };
    ws.onerror=()=>{
      // Browser errors have no HTTP status. The room_full WebSocket event
      // above communicates capacity explicitly without exposing a chat API.
      if(socket===ws)try{ws.close();}catch{}
    };
  }
  function heartbeatCheck(){
    if(!started||isHidden())return;
    const now=performance.now(),ws=socket;
    if(!ws)return; // Reconnect backoff handles closed connections.
    if(ws.readyState===WebSocket.CONNECTING){
      if(now-connectStarted>CONNECT_TIMEOUT_MS)try{ws.close();}catch{}
      return;
    }
    if(ws.readyState!==WebSocket.OPEN)return;
    if(now-lastHeard>STALE_CONNECTION_MS){
      try{ws.close();}catch{}
      return;
    }
    if(connected&&now-lastPing>=HEARTBEAT_INTERVAL_MS){
      if(send(ws,{type:'ping'}))lastPing=now;
    }
  }
  function onVisibilityReturn(){
    if(!started||isHidden())return;
    if(socket?.readyState===WebSocket.OPEN){
      heartbeatCheck();
      if(socket?.readyState===WebSocket.OPEN)
        send(socket,{type:'ping'}); // Quickly discover a dead mobile connection.
    }else if(!socket||socket.readyState===WebSocket.CLOSED){
      if(retry){clearTimeout(retry);retry=null;}
      connect();
    }
  }
  function start(){
    if(started)return;
    started=true;lastHeard=performance.now();
    if(typeof document!=='undefined')document.addEventListener?.('visibilitychange',onVisibilityReturn);
    if(typeof window!=='undefined')window.addEventListener?.('online',onVisibilityReturn);
    watchdog=setInterval(heartbeatCheck,WATCHDOG_INTERVAL_MS);
    connect();
  }
  // Switching rooms is explicit: a failed invite never falls back to public.
  function switchRoom(nextToken=null){
    if(nextToken!==null&&!validPrivateRoomToken(nextToken))
      throw new TypeError('Invalid invite token');
    if(roomToken===nextToken)return;
    roomToken=nextToken;
    if(retry){clearTimeout(retry);retry=null;}
    const old=socket;socket=null;
    try{old?.close(1000,'room change');}catch{}
    connected=false;localId=null;room=null;lastCount=1;clearPeers();
    reconnectDelay=1200;lastSent=-Infinity;roomFull=false;
    if(started)connect();
    else setStatus(roomToken?'비공개 산책방 대기':'공개 산책방 대기');
  }
  function update({x,z,vx,vz,dt,elapsed,walking}){
    const now=performance.now();
    if(connected&&socket?.readyState===WebSocket.OPEN&&now-lastSent>=SEND_INTERVAL_MS){
      if(send(socket,{type:'pose',x,z,vx,vz}))lastSent=now;
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
      const fresh=now-peer.updatedAt<550;
      const moving=fresh&&Math.hypot(peer.vx,peer.vz)>.13;
      peer.girl.update({x:peer.x,z:peer.z,
        vx:moving?peer.vx:0,
        vz:moving?peer.vz:0,
        dt,elapsed,walking:moving,visible:true});
    }
  }
  function stop(){
    started=false;
    if(retry){clearTimeout(retry);retry=null;}
    if(watchdog){clearInterval(watchdog);watchdog=null;}
    if(typeof document!=='undefined')document.removeEventListener?.('visibilitychange',onVisibilityReturn);
    if(typeof window!=='undefined')window.removeEventListener?.('online',onVisibilityReturn);
    const old=socket;socket=null;
    try{old?.close(1000,'leaving');}catch{}
    connected=false;roomFull=false;clearPeers();
  }
  return {start,update,stop,switchRoom,getStatus:()=>({
    connected,room,mode:roomToken?'private':'public',
    full:roomFull,count:lastCount,visiblePeers:peers.size
  })};
}
