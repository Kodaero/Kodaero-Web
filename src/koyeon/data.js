export const hasCoordinate = (pub) => Number.isFinite(pub?.latitude) && Number.isFinite(pub?.longitude) && Math.abs(pub.latitude)<=90 && Math.abs(pub.longitude)<=180;
export const menusOf = (pub) => pub?.menus || pub?.filteredMenus || [];
export function filterPubs(pubs,query,sponsor='전체') {
  const term=query.trim().toLocaleLowerCase('ko').replace(/\s/g,'');
  return pubs.filter(pub=>(sponsor==='전체'||pub.sponsor===sponsor)&&[pub.name,pub.sponsor,pub.address,...menusOf(pub)].join(' ').toLocaleLowerCase('ko').replace(/\s/g,'').includes(term));
}
export const formatTime = (value) => value ? value.replace(/(\d{1,2}:\d{2})\s*[-~–]\s*(\d{1,2}:\d{2})/g,'$1 ~ $2') : '운영 시간 미정';
export function routeCoordinates(route) {return (route?.path||[]).filter(segment=>segment.inOut===false).map(segment=>(segment.route||[]).filter(point=>Number.isFinite(point[0])&&Number.isFinite(point[1])).map(point=>point.slice(0,2))).filter(points=>points.length>1);}
export async function getData(resource,params={},signal) {
  const response=await fetch(`/api/koyeon?${new URLSearchParams({resource,...params})}`,{signal});
  const result=await response.json();
  if (!response.ok || result.statusCode!==0) throw new Error(result.message||'정보를 불러오지 못했습니다.');
  return result.data;
}
