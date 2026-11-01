import {DurableObject} from 'cloudflare:workers';
import {
  MAX_PUBLIC_ROOMS,MAX_WALKERS_PER_ROOM,WALK_SPAWN,validateMovement
} from '../multiplayer/Protocol.js';

const json=(data,status=200)=>new Response(JSON.stringify(data),{
  status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}
});
const openSockets=ctx=>ctx.getWebSockets().filter(ws=>ws.readyState===1);
const playerFromSocket=ws=>{
  const state=ws.deserializeAttachment();
  return state && {id:state.id,x:state.x,z:state.z,vx:state.vx,vz:state.vz};
};

export default {
  async fetch(request,env){
    const url=new URL(request.url);
    if(url.pathname==='/api/walk/health')
      return json({ok:true,protocol:1,roomCapacity:MAX_WALKERS_PER_ROOM,chat:false});
    if(url.pathname==='/api/walk'){
      if(request.method!=='GET'||request.headers.get('Upgrade')?.toLowerCase()!=='websocket')
        return json({error:'WebSocket upgrade required'},426);
      // Browsers send Origin on WS upgrades: reject cross-site connection theft.
      const origin=request.headers.get('Origin');
      if(origin&&origin!==url.origin)return json({error:'Invalid origin'},403);
      if(!env.WALK_ROOMS)return json({error:'Multiplayer unavailable'},503);
      for(let index=1;index<=MAX_PUBLIC_ROOMS;index++){
        const stub=env.WALK_ROOMS.getByName('bukchon-public-v1-'+index);
        const response=await stub.fetch('https://walk.internal/join?room='+index,{
          headers:{Upgrade:'websocket'}
        });
        if(response.status===409)continue;
        return response;
      }
      return json({error:'All public rooms occupied'},503);
    }
    if(url.pathname.startsWith('/api/'))return json({error:'Not found'},404);
    return env.ASSETS.fetch(request);
  }
};

/** Each room has a distinct DO instance and max eight live WebSockets. */
export class PublicWalkRoom extends DurableObject {
  constructor(ctx,env){
    super(ctx,env);
  }

  broadcast(packet,excluded=null){
    const encoded=JSON.stringify(packet);
    for(const socket of openSockets(this.ctx)){
      if(socket===excluded)continue;
      try{socket.send(encoded)}catch(_error){/* disconnected; close handler cleans up */}
    }
  }

  async fetch(request){
    if(new URL(request.url).pathname!=='/join'||
       request.headers.get('Upgrade')?.toLowerCase()!=='websocket')
      return json({error:'Not available'},404);
    const peers=openSockets(this.ctx);
    if(peers.length>=MAX_WALKERS_PER_ROOM)
      return json({error:'Room full'},409);
    const room=Number(new URL(request.url).searchParams.get('room'));
    if(!Number.isInteger(room)||room<1||room>MAX_PUBLIC_ROOMS)
      return json({error:'Invalid room'},400);

    const pair=new WebSocketPair();
    const [client,server]=Object.values(pair);
    const state={id:crypto.randomUUID(),...WALK_SPAWN,vx:0,vz:0,at:Date.now(),initial:true};
    this.ctx.acceptWebSocket(server); // Enables hibernation, no always-on event loop.
    server.serializeAttachment(state);
    const players=peers.map(playerFromSocket).filter(Boolean);
    server.send(JSON.stringify({t:'welcome',protocol:1,room,
      id:state.id,max:MAX_WALKERS_PER_ROOM,players}));
    this.broadcast({t:'join',player:playerFromSocket(server)},server);
    return new Response(null,{status:101,webSocket:client});
  }

  async webSocketMessage(socket,message){
    if(typeof message!=='string'||message.length>240)return;
    let data;
    try{data=JSON.parse(message)}catch(_error){return}
    const prior=socket.deserializeAttachment();
    const next=validateMovement(data,prior,Date.now());
    if(!next)return;
    socket.serializeAttachment({...prior,...next,initial:false});
    this.broadcast({t:'p',id:prior.id,x:next.x,z:next.z,
      vx:next.vx,vz:next.vz},socket);
  }

  async webSocketClose(socket,code,reason){
    const player=playerFromSocket(socket);
    if(player)this.broadcast({t:'leave',id:player.id},socket);
    try{socket.close(code||1000,reason||'left')}catch(_error){}
  }

  async webSocketError(socket){
    const player=playerFromSocket(socket);
    if(player)this.broadcast({t:'leave',id:player.id},socket);
    try{socket.close(1011,'connection error')}catch(_error){}
  }
}
