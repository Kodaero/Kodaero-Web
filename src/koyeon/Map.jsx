import React,{useEffect,useRef} from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {hasCoordinate,routeCoordinates} from './data.js';
export default function Map({pubs,selected,onSelect,mapRef,route,location}) {
  const host=useRef(), markers=useRef(), path=useRef(), user=useRef();
  useEffect(()=>{
    const map=L.map(host.current,{zoomControl:false,center:[37.5851,127.0298],zoom:17,minZoom:11,maxZoom:19});
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>'}).addTo(map);
    mapRef.current=map; markers.current=L.layerGroup().addTo(map); path.current=L.layerGroup().addTo(map); user.current=L.layerGroup().addTo(map);
    const observer=new ResizeObserver(()=>map.invalidateSize()); observer.observe(host.current);
    return ()=>{observer.disconnect();map.remove();mapRef.current=null;};
  },[]);
  useEffect(()=>{
    if(!markers.current)return;
    markers.current.clearLayers();
    pubs.filter(hasCoordinate).forEach(pub=>{
      const active=pub.id===selected?.id;
      const html=document.createElement('div'); html.className=`pub-pin ${active?'active':''}`;
      const image=document.createElement('img');image.src=`${import.meta.env.BASE_URL}assets/icon-FREE_BAR-marker.png`;image.alt='';html.append(image);
      const label=document.createElement('span'); label.textContent=pub.name; html.append(label);
      const marker=L.marker([pub.latitude,pub.longitude],{icon:L.divIcon({html,className:'pin-container',iconSize:[42,48],iconAnchor:[21,48]}),opacity:route?.path ? (active?1:.4) : 1,zIndexOffset:active?1000:0,title:pub.name,alt:`${pub.name} 주점 선택`}).addTo(markers.current);
      marker.on('click',()=>onSelect(pub));
    });
  },[pubs,selected?.id,onSelect,route]);
  useEffect(()=>{
    if(!path.current)return;path.current.clearLayers();
    const points=routeCoordinates(route);
    points.forEach(segment=>{L.polyline(segment,{color:'white',weight:9}).addTo(path.current);L.polyline(segment,{color:'#F85C5C',weight:5}).addTo(path.current);});
    if(points.length){
      const all=points.flat();
      [all[0],all.at(-1)].forEach((point,index)=>L.circleMarker(point,{radius:7,color:'white',weight:3,fillColor:index===0?'#4d4d4d':'#F85C5C',fillOpacity:1}).bindTooltip(index===0?'출발':'도착',{permanent:true,direction:'right'}).addTo(path.current));
      const mobile=window.matchMedia('(max-width:760px)').matches;
      mapRef.current.fitBounds(L.latLngBounds(all),{paddingTopLeft:mobile?[30,230]:[60,90],paddingBottomRight:mobile?[65,30]:[60,90],maxZoom:18});
    }
  },[route]);
  useEffect(()=>{if(!user.current)return;user.current.clearLayers();if(location)L.circleMarker([location.latitude,location.longitude],{radius:8,color:'white',weight:3,fillColor:'#4285F4',fillOpacity:1}).addTo(user.current);},[location]);
  return <div className="map" ref={host} role="region" aria-label="고연전 무료주점 지도"/>;
}
