import test from 'node:test';
import assert from 'node:assert/strict';
import {resolveUpstream} from '../lib/proxy.js';
import {filterPubs,hasCoordinate,routeCoordinates,formatTime} from '../src/koyeon/data.js';
test('proxy allows only public Koyeon reads and validated coordinate routes',()=>{
  assert.equal(resolveUpstream('/?resource=pubs/17').href,'https://be.kodaero.store/api/koyeon/pubs/17');
  assert.throws(()=>resolveUpstream('/?resource=../users'));assert.throws(()=>resolveUpstream('/?resource=https://evil.test'));
  assert.throws(()=>resolveUpstream('/?resource=routes&startLat=91&startLong=127&endLat=37&endLong=127'));
  const result=resolveUpstream('/?resource=routes&startLat=37.5&startLong=127&endLat=37.6&endLong=127.1&token=secret');
  assert.equal(result.searchParams.get('startType'),'COORD');assert.equal(result.searchParams.has('token'),false);
});
test('search includes names, sponsors, menus and whitespace while combining filters',()=>{
  const pubs=[{id:1,name:'맛 닭꼬',sponsor:'교우회',filteredMenus:['치킨']},{id:2,name:'주점',sponsor:'동기회'}];
  assert.equal(filterPubs(pubs,'맛닭꼬').length,1);assert.equal(filterPubs(pubs,'치킨','교우회').length,1);assert.equal(filterPubs(pubs,'치킨','동기회').length,0);
});
test('route geometry excludes indoor segments and metadata; time preserves event date',()=>{
  assert.equal(hasCoordinate({latitude:null,longitude:127}),false);
  assert.deepEqual(routeCoordinates({path:[{inOut:true,route:[[1,2],[2,3]]},{inOut:false,route:[[37,127,1],[37.1,127.1,2]]}]}),[[[37,127],[37.1,127.1]]]);
  assert.equal(formatTime('9/28 19:00-22:00'),'9/28 19:00 ~ 22:00');
});
