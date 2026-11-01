import {WALK_SEND_INTERVAL_MS,MAX_WALKERS_PER_ROOM} from './Protocol.js';

/** Networking is optional; a disconnected visitor can keep walking solo. */
export function createPublicWalkClient({
  onWelcome=()=>{},onJoin=()=>{},onMove=()=>{},onLeave=()=>{},
  onStatus=()=>{},WebSocketCtor=globalThis.WebSocket,
  locationRef=globalThis.location
}={}){
  let socket=null,started=false,id=null,room=0,retries=0,timer=null;
  let lastSentAt=-Infinity,lastSent=null;
  const peers=new Set();
  const status=()=>onStatus({connected:!!id,room,count:id?1+peers.size:1,
    max:MAX_WALKERS_PER_ROOM});
  function endpoint(){
    return (locationRef.protocol==='https:'?'wss://':'ws://')+
      locationRef.host+'/api/walk';
  }
  function connect(){
    if(!started||!WebSocketCtor)return;
    try{socket=new WebSocketCtor(endpoint());}
    catch(_error){scheduleRetry();return}
    const active=socket;
    active.onmessage=event=>{
      if(active!==socket||typeof event.data!=='string'||event.data.length>4096)return;
      let m;
      try{m=JSON.parse(event.data)}catch(_error){return}
      if(m.t==='welcome'&&m.protocol===1&&typeof m.id==='string'){
        id=m.id;room=m.room;retries=0;peers.clear();
        const players=Array.isArray(m.players)?m.players.slice(0,7):[];
        for(const p of players)if(p&&typeof p.id==='string'&&p.id!==id)
          peers.add(p.id);
        lastSentAt=-Infinity;lastSent=null;
        onWelcome(players.filter(p=>p&&p.id!==id));status();
      }else if(m.t==='join'&&m.player&&typeof m.player.id==='string'&&id){
        if(m.player.id!==id){peers.add(m.player.id);onJoin(m.player);status();}
      }else if(m.t==='p'&&typeof m.id==='string'&&m.id!==id&&id){
        if(peers.has(m.id))onMove(m);
      }else if(m.t==='leave'&&typeof m.id==='string'&&id){
        if(peers.delete(m.id)){onLeave(m.id);status();}
      }
    };
    active.onclose=()=>{
      if(active!==socket)return;
      socket=null;id=null;room=0;peers.clear();onWelcome([]);status();
      scheduleRetry();
    };
    active.onerror=()=>{try{active.close()}catch(_error){}};
  }
  function scheduleRetry(){
    if(!started||timer!==null)return;
    const delay=Math.min(30000,1500*2**Math.min(retries++,5));
    timer=setTimeout(()=>{timer=null;connect()},delay);
  }
  function start(){
    if(started)return;
    started=true;status();connect();
  }
  function tick(time,player){
    if(!id||!socket||socket.readyState!==1||!player?.started)return;
    if(time-lastSentAt<WALK_SEND_INTERVAL_MS)return;
    const payload={t:'p',x:player.x,z:player.z,vx:player.vx,vz:player.vz};
    const moved=!lastSent||Math.hypot(payload.x-lastSent.x,payload.z-lastSent.z)>.003;
    const velocityChanged=!lastSent||
      (Math.hypot(lastSent.vx,lastSent.vz)>.13)!==(Math.hypot(payload.vx,payload.vz)>.13);
    if(!moved&&!velocityChanged)return; // Idle players use no update bandwidth.
    lastSentAt=time;lastSent=payload;
    try{socket.send(JSON.stringify(payload))}catch(_error){}
  }
  function stop(){
    started=false;
    if(timer!==null){clearTimeout(timer);timer=null;}
    if(socket){const current=socket;socket=null;try{current.close(1000,'leaving')}catch(_error){}}
    id=null;room=0;peers.clear();onWelcome([]);status();
  }
  return {start,stop,tick,status};
}
