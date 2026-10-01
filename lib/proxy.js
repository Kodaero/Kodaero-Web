const ORIGIN = 'https://be.kodaero.store/api/';
export function resolveUpstream(input) {
  const url = new URL(input, 'http://localhost');
  const resource = url.searchParams.get('resource') || 'pubs';
  if (!/^(season|pubs|pubs\/\d+|routes)$/.test(resource)) throw new Error('INVALID_RESOURCE');
  const upstream = new URL(resource === 'season' ? 'koyeon' : resource === 'routes' ? 'routes' : `koyeon/${resource}`, ORIGIN);
  if (resource === 'routes') {
    for (const name of ['startLat','startLong','endLat','endLong']) {
      const raw = url.searchParams.get(name);
      const value = Number(raw);
      if (!raw || !Number.isFinite(value) || Math.abs(value) > (name.endsWith('Lat') ? 90 : 180)) throw new Error('INVALID_COORDINATE');
      upstream.searchParams.set(name, String(value));
    }
    upstream.searchParams.set('startType','COORD'); upstream.searchParams.set('endType','COORD');
  }
  return upstream;
}
export async function proxyKoyeon(req,res) {
  res.setHeader('Content-Type','application/json; charset=utf-8');
  if (req.method !== 'GET') {res.statusCode=405; res.setHeader('Allow','GET'); return res.end(JSON.stringify({message:'GET 요청만 지원합니다.'}));}
  let upstream;
  try {upstream=resolveUpstream(req.url);} catch {res.statusCode=400; return res.end(JSON.stringify({message:'잘못된 요청입니다.'}));}
  try {
    const response=await fetch(upstream,{signal:AbortSignal.timeout(12000),headers:{Accept:'application/json'}});
    const data=await response.json();
    res.statusCode=response.status;
    res.setHeader('Cache-Control',upstream.pathname.endsWith('/routes')?'private, no-store':'public, s-maxage=60, stale-while-revalidate=120');
    res.end(JSON.stringify(data));
  } catch {res.statusCode=502; res.end(JSON.stringify({message:'주점 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.'}));}
}
