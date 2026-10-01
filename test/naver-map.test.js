import test from 'node:test';
import assert from 'node:assert/strict';
import { fitNaverBounds, NAVER_MAP_CLIENT_ID } from '../src/koyeon/naver.js';
test('existing Kodaero-Web application and Naver coordinate bounds are preserved',()=>{
    assert.equal(NAVER_MAP_CLIENT_ID,'8alsyra0y4');
    class LatLng {constructor(lat,lng){this.lat=lat;this.lng=lng;}}
    class LatLngBounds {points=[];extend(point){this.points.push(point);}}
    let fitted;
    fitNaverBounds({fitBounds:(bounds,options)=>{fitted={bounds,options};}},{LatLng,LatLngBounds},[[37.585,127.029],[37.584,127.030]],{top:230,right:65,bottom:30,left:30,maxZoom:19});
    assert.deepEqual(fitted.bounds.points,[new LatLng(37.585,127.029),new LatLng(37.584,127.030)]);
    assert.deepEqual(fitted.options,{top:230,right:65,bottom:30,left:30,maxZoom:19});
});
