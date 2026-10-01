import React,{useEffect,useRef,useState} from 'react';
import {hasCoordinate,routeCoordinates} from './data.js';
import {CAMPUS_BOUNDS,MIN_ZOOM} from './mapPolicy.js';
import {loadNaverMaps,fitNaverBounds} from './naver.js';
function clearOverlays(overlays) {
    overlays.current.forEach(item=>{window.naver?.maps?.Event.clearInstanceListeners(item);item.setMap(null);});
    overlays.current=[];
}
function markerContent(pub,active,onSelect) {
    const button=document.createElement('button');
    button.type='button';button.className=`pub-pin ${active?'active':''}`;
    button.setAttribute('aria-label',`${pub.name} 주점 선택`);
    const image=document.createElement('img');image.src=`${import.meta.env.BASE_URL}assets/icon-FREE_BAR-marker.png`;image.alt='';button.append(image);
    const label=document.createElement('span');label.textContent=pub.name;button.append(label);
    button.addEventListener('click',event=>{event.stopPropagation();onSelect(pub);});
    return button;
}
export default function Map({pubs,selected,onSelect,mapRef,route,location}) {
    const host=useRef(),nativeMap=useRef(),markers=useRef([]),path=useRef([]),user=useRef([]);
    const [ready,setReady]=useState(false),[error,setError]=useState('');
    useEffect(()=>{
        let cancelled=false,observer;
        const authError=event=>{setReady(false);nativeMap.current=null;mapRef.current=null;markers.current=[];path.current=[];user.current=[];setError(event.detail);};
        window.addEventListener('kodaero:naver-map-error',authError);
        loadNaverMaps().then(maps=>{
            if(cancelled)return;
            const map=new maps.Map(host.current,{
                center:new maps.LatLng(37.5855,127.0295),zoom:17,minZoom:MIN_ZOOM,maxZoom:21,
                maxBounds:new maps.LatLngBounds(new maps.LatLng(CAMPUS_BOUNDS.south,CAMPUS_BOUNDS.west),new maps.LatLng(CAMPUS_BOUNDS.north,CAMPUS_BOUNDS.east)),
                zoomControl:false,mapTypeControl:false,scaleControl:true,logoControl:true,mapDataControl:true,
                logoControlOptions:{position:maps.Position.BOTTOM_LEFT},scaleControlOptions:{position:maps.Position.BOTTOM_LEFT},
            });
            nativeMap.current=map;
            mapRef.current={
                focus:([lat,lng],zoom=18)=>{map.setZoom(zoom);map.panTo(new maps.LatLng(lat,lng));},
                zoomIn:()=>map.setZoom(map.getZoom()+1,true),
                zoomOut:()=>map.setZoom(map.getZoom()-1,true),
                fitBounds:(points,options)=>fitNaverBounds(map,maps,points,options),
            };
            observer=new ResizeObserver(()=>map.autoResize());observer.observe(host.current);
            setReady(true);
        }).catch(e=>{if(!cancelled)setError(e.message);});
        return()=>{
            cancelled=true;observer?.disconnect();window.removeEventListener('kodaero:naver-map-error',authError);
            clearOverlays(markers);clearOverlays(path);clearOverlays(user);
            nativeMap.current?.destroy();nativeMap.current=null;mapRef.current=null;
        };
    },[mapRef]);
    useEffect(()=>{
        if(!ready||!nativeMap.current)return;
        const maps=window.naver.maps,map=nativeMap.current;
        clearOverlays(markers);
        pubs.filter(hasCoordinate).forEach(pub=>{
            const active=pub.id===selected?.id;
            const marker=new maps.Marker({map,position:new maps.LatLng(pub.latitude,pub.longitude),
                icon:{content:markerContent(pub,active,onSelect),size:new maps.Size(42,48),anchor:new maps.Point(21,48)},
                zIndex:active?1000:100,opacity:route?.path?(active?1:.4):1,title:pub.name,
            });
            markers.current.push(marker);
        });
    },[ready,pubs,selected?.id,onSelect,route]);
    useEffect(()=>{
        if(!ready||!nativeMap.current)return;
        const maps=window.naver.maps,map=nativeMap.current;
        clearOverlays(path);
        const segments=routeCoordinates(route);
        segments.forEach(points=>{
            const coords=points.map(([lat,lng])=>new maps.LatLng(lat,lng));
            path.current.push(new maps.Polyline({map,path:coords,strokeColor:'#ffffff',strokeWeight:9,zIndex:200}),new maps.Polyline({map,path:coords,strokeColor:'#F85C5C',strokeWeight:5,zIndex:201}));
        });
        if(segments.length){
            const points=segments.flat();
            [points[0],points.at(-1)].forEach((point,index)=>{
                const content=document.createElement('div');content.className=`route-endpoint ${index?'arrival':'departure'}`;content.textContent=index?'도착':'출발';
                path.current.push(new maps.Marker({map,position:new maps.LatLng(...point),icon:{content,anchor:new maps.Point(20,20)},zIndex:1100}));
            });
            fitNaverBounds(map,maps,points,{top:230,right:65,bottom:30,left:30,maxZoom:19});
        }
    },[ready,route]);
    useEffect(()=>{
        if(!ready||!nativeMap.current)return;clearOverlays(user);
        if(location){
            const maps=window.naver.maps;
            const dot=document.createElement('div');dot.className='my-location-dot';dot.setAttribute('aria-label','내 위치');
            user.current.push(new maps.Marker({map:nativeMap.current,position:new maps.LatLng(location.latitude,location.longitude),icon:{content:dot,size:new maps.Size(18,18),anchor:new maps.Point(9,9)},zIndex:1200}));
        }
    },[ready,location]);
    return <><div className="map" ref={host} role="region" aria-label="네이버 고연전 무료주점 지도"/>{error&&<div className="map-error" role="alert"><b>네이버 지도를 표시하지 못했어요</b><p>{error}</p><button onClick={()=>window.location.reload()}>다시 시도</button></div>}</>;
}
