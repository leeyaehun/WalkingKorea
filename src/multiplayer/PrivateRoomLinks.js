// A private invite is a bearer capability: possession of this unpredictable
// 122-bit random UUID allows entry. No account, password, or chat is involved.
export const PRIVATE_ROOM_PREFIX='bukchon-private-v1-';
const UUID_V4=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

export function validPrivateRoomToken(token){
  return typeof token==='string' && UUID_V4.test(token);
}

// Only the invite room is shared. Do not pass ?qa, browser preference,
// tracking params, or fragments when producing a link for a friend.
export function makePrivateInviteUrl(href,token){
  if(!validPrivateRoomToken(token))throw new TypeError('Invalid private room token');
  const url=new URL(href);
  url.search='';url.hash='';
  url.searchParams.set('room',token);
  return url.toString();
}
