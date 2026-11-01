import {ROOM_CAPACITY,SPAWN,sanitizePose,plausibleStep} from '../multiplayer/protocol.js';

const PUBLIC_ROOM_LIMIT=256;
const ROOM_PREFIX='bukchon-public-v1-';

function jsonError(message,status) {
  return Response.json({error:message},{status,headers:{'Cache-Control':'no-store'}});
}
function safeSend(ws,data){
  try{ws.send(JSON.stringify(data));return true;}catch{return false;}
}

export class PublicWalkRoom {
  constructor(ctx,env){this.ctx=ctx;this.env=env;}

  members(){return this.ctx.getWebSockets();}

  // No async suspension between capacity check and socket acceptance.
  // Each named Durable Object is the authoritative owner of its eight slots.
  fetch(request) {
    if(request.headers.get('Upgrade')?.toLowerCase()!=='websocket')
      return jsonError('websocket_required',426);
    if(this.members().length>=ROOM_CAPACITY)
      return jsonError('room_full',409);

    const [client,server]=Object.values(new WebSocketPair());
    const id=crypto.randomUUID();
    const stamp=Date.now();
    const meta={id,pose:{...SPAWN},lastAt:stamp,receivedPose:false};
    server.serializeAttachment(meta);
    this.ctx.acceptWebSocket(server);
    const others=this.members().filter(ws=>ws!==server);
    const players=others.map(ws=>{
      const p=ws.deserializeAttachment();
      return p?{id:p.id,...p.pose}:null;
    }).filter(Boolean);
    safeSend(server,{type:'welcome',id,room:new URL(request.url).searchParams.get('slot'),
      capacity:ROOM_CAPACITY,players});
    for(const ws of others)
      safeSend(ws,{type:'enter',player:{id,...SPAWN}});
    this.broadcastCount();
    return new Response(null,{status:101,webSocket:client});
  }

  broadcastCount(){
    const sockets=this.members();
    const message={type:'count',count:sockets.length,capacity:ROOM_CAPACITY};
    for(const ws of sockets)safeSend(ws,message);
  }
  async webSocketMessage(ws,message){
    if(typeof message!=='string'||message.length>256)return;
    let data;
    try{data=JSON.parse(message);}catch{return;}
    const pose=sanitizePose(data);
    if(!pose)return;
    const meta=ws.deserializeAttachment();
    if(!meta)return;
    const now=Date.now(),elapsed=now-meta.lastAt;
    if(meta.receivedPose&&elapsed<70)return;
    if(!plausibleStep(meta.pose,pose,elapsed,!meta.receivedPose))return;
    ws.serializeAttachment({...meta,pose,lastAt:now,receivedPose:true});
    for(const other of this.members())
      if(other!==ws)safeSend(other,{type:'pose',id:meta.id,...pose});
  }
  depart(ws){
    const meta=ws.deserializeAttachment();
    if(!meta)return;
    for(const other of this.members()){
      if(other!==ws)safeSend(other,{type:'leave',id:meta.id});
    }
    this.broadcastCount();
  }
  async webSocketClose(ws){this.depart(ws);}
  async webSocketError(ws){this.depart(ws);}
}

export default {
  async fetch(request,env){
    const url=new URL(request.url);
    if(url.pathname!=='/api/walk/join')
      return env.ASSETS.fetch(request);
    if(request.method!=='GET')return jsonError('method_not_allowed',405);
    if(request.headers.get('Upgrade')?.toLowerCase()!=='websocket')
      return jsonError('websocket_required',426);
    const origin=request.headers.get('Origin');
    if(origin&&origin!==url.origin)return jsonError('invalid_origin',403);
    // First available public room is preferred; DOs are instantiated only
    // when requested. Room admission itself is atomic and rechecked in DO.
    for(let slot=0;slot<PUBLIC_ROOM_LIMIT;slot++){
      const id=env.PUBLIC_WALK_ROOMS.idFromName(ROOM_PREFIX+slot);
      const stub=env.PUBLIC_WALK_ROOMS.get(id);
      const destination=new URL(request.url);
      destination.searchParams.set('slot',String(slot+1));
      const response=await stub.fetch(new Request(destination,request));
      if(response.status===409)continue;
      return response;
    }
    return jsonError('public_rooms_busy',503);
  }
};
