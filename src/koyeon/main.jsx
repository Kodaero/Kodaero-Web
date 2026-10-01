import React,{useState,useEffect,useRef,useCallback} from 'react';
import {Search,X,ArrowLeft,ArrowUpRight,MapPin,Clock,Navigation,LocateFixed,Plus,Minus,SlidersHorizontal,ChevronDown,Footprints,ArrowDownUp,Share2,Check,RefreshCw} from 'lucide-react';
import Map from './Map.jsx';
import {isWithinCampus} from './mapPolicy.js';
import {getData,filterPubs,hasCoordinate,formatTime,routeCoordinates} from './data.js';
import './style.css';
const Tiger=()=> <img className="tiger" src={`${import.meta.env.BASE_URL}assets/icon-tiger-red.svg`} alt=""/>;
export default function KoyeonMap(){
  const [pubs,setPubs]=useState([]),[loading,setLoading]=useState(true),[error,setError]=useState(''),[query,setQuery]=useState(''),[selected,setSelected]=useState(null),[detailError,setDetailError]=useState(''),[detailLoading,setDetailLoading]=useState(false),[season,setSeason]=useState(null),[sponsor,setSponsor]=useState('전체'),[showFilters,setShowFilters]=useState(false),[expanded,setExpanded]=useState(false),[collapsed,setCollapsed]=useState(false),[start,setStart]=useState(null),[end,setEnd]=useState(null),[route,setRoute]=useState(null),[routing,setRouting]=useState(false),[routeError,setRouteError]=useState(''),[location,setLocation]=useState(null),[locating,setLocating]=useState(false),[notice,setNotice]=useState(''),[copied,setCopied]=useState(false);
  const panelRef=useRef(),workspaceRef=useRef(),dragStart=useRef(),filterDialog=useRef(),mapRef=useRef(),detailAbort=useRef(),noticeTimer=useRef();
  const announce=useCallback(text=>{setNotice(text);clearTimeout(noticeTimer.current);noticeTimer.current=setTimeout(()=>setNotice(''),4500);},[]);
  const load=useCallback(async()=>{setLoading(true);setError('');try{const [list,currentSeason]=await Promise.all([getData('pubs'),getData('season').catch(()=>null)]);if(!Array.isArray(list?.list))throw new Error('주점 목록을 확인할 수 없습니다.');setPubs(list.list);setSeason(currentSeason);}catch(e){setError(e.message);}finally{setLoading(false);}},[]);
  useEffect(()=>{load();return()=>{detailAbort.current?.abort();clearTimeout(noticeTimer.current);};},[load]);
  const choose=useCallback(pub=>{
    detailAbort.current?.abort();const controller=new AbortController();detailAbort.current=controller;
    setSelected(pub);setDetailError('');setDetailLoading(true);setExpanded(false);setCollapsed(false);
    const url=new URL(window.location.href);url.searchParams.set('pub',pub.id);url.hash='/';window.history.replaceState(null,'',url);
    if(hasCoordinate(pub))mapRef.current?.focus([pub.latitude,pub.longitude],18,{duration:.65});
    getData(`pubs/${pub.id}`,{},controller.signal).then(detail=>setSelected(current=>current?.id===pub.id?{...pub,...detail}:current)).catch(e=>{if(e.name!=='AbortError')setDetailError('상세정보를 가져오지 못했습니다. 목록 정보를 표시합니다.');}).finally(()=>{if(!controller.signal.aborted)setDetailLoading(false);});
  },[]);
  useEffect(()=>{if(!pubs.length)return;const id=new URLSearchParams(window.location.search || window.location.hash.split('?')[1]).get('pub');const match=pubs.find(pub=>String(pub.id)===id);if(match)choose(match);},[pubs,choose]);
  const close=()=>{detailAbort.current?.abort();setSelected(null);setDetailLoading(false);setDetailError('');const url=new URL(window.location.href);url.searchParams.delete('pub');url.hash='/';window.history.replaceState(null,'',url);};
  useEffect(()=>{const handler=e=>{if(e.key==='Escape'&&!e.target.closest('dialog')){close();setExpanded(false);setShowFilters(false);}};window.addEventListener('keydown',handler);return()=>window.removeEventListener('keydown',handler);},[]);
  useEffect(()=>{
    setRoute(null);setRouteError('');
    if(!start||!end){setRouting(false);return;}
    if(start.id===end.id){setRouteError('출발지와 도착지를 다르게 선택해주세요.');setRouting(false);return;}
    const controller=new AbortController();setRouting(true);
    getData('routes',{startLat:start.latitude,startLong:start.longitude,endLat:end.latitude,endLong:end.longitude},controller.signal).then(data=>{const found=data?.find(item=>routeCoordinates(item).length);if(!found)throw new Error('이 구간의 도보 경로를 찾지 못했습니다.');setRoute(found);}).catch(e=>{if(e.name!=='AbortError')setRouteError(e.message);}).finally(()=>{if(!controller.signal.aborted)setRouting(false);});
    return()=>controller.abort();
  },[start,end]);
  const locate=()=>{if(!navigator.geolocation){announce('이 브라우저에서는 내 위치를 사용할 수 없습니다.');return;}setLocating(true);navigator.geolocation.getCurrentPosition(position=>{if(!isWithinCampus(position.coords.latitude,position.coords.longitude)){setLocating(false);announce('현재 위치가 교내 영역을 벗어났습니다.');return;}const current={id:'my-location',name:'내 위치',latitude:position.coords.latitude,longitude:position.coords.longitude};setLocation(current);mapRef.current?.focus([current.latitude,current.longitude],17);setLocating(false);},e=>{setLocating(false);announce(e.code===1?'위치 권한을 허용하면 내 위치를 확인할 수 있어요.':'내 위치를 찾지 못했습니다. 다시 시도해주세요.');},{enableHighAccuracy:true,timeout:10000,maximumAge:60000});};
  const share=async()=>{try{await navigator.clipboard.writeText(window.location.href);setCopied(true);announce('주점 링크를 복사했어요.');setTimeout(()=>setCopied(false),2000);}catch{announce('주소창의 링크를 복사해서 공유해주세요.');}};
  useEffect(()=>{
    const observer=new ResizeObserver(()=>workspaceRef.current?.style.setProperty('--sheet-height',`${panelRef.current.offsetHeight}px`));
    observer.observe(panelRef.current);return()=>observer.disconnect();
  },[]);
  useEffect(()=>{if(showFilters)filterDialog.current?.showModal();else filterDialog.current?.close();},[showFilters]);
  const changeSheet=(direction)=>{if(direction==='down'){if(expanded)setExpanded(false);else setCollapsed(true);}else{if(collapsed)setCollapsed(false);else if(!selected)setExpanded(true);}};
  const filtered=filterPubs(pubs,query,sponsor),sponsors=[...new Set(pubs.map(pub=>pub.sponsor).filter(Boolean))];
  const setEndpoint=(kind)=>{if(!hasCoordinate(selected)){announce('위치 정보가 없는 주점입니다.');return;}(kind==='start'?setStart:setEnd)(selected);announce(kind==='start'?'출발지를 설정했어요. 도착할 주점을 선택해주세요.':'도착지를 설정했어요. 출발할 주점을 선택해주세요.');};
  return <div className="app">
    <header className="header"><a href={import.meta.env.BASE_URL} className="brand" aria-label="고대로 고연전 지도 홈"><Tiger/><span>고대로</span><i/><strong>고연전 지도</strong></a><a className="app-link" href="https://kodaero.co.kr" target="_blank" rel="noopener noreferrer">고대로 앱 <ArrowUpRight size={16}/></a></header>
    <main className="workspace" ref={workspaceRef}>
      <Map pubs={filtered} selected={selected} onSelect={choose} mapRef={mapRef} route={route} location={location}/>
      <div className="home-controls"><div className="search"><Search size={19}/><input aria-label="주점 검색" placeholder="무료주점을 검색해보세요" value={query} onChange={e=>{setQuery(e.target.value);close();setCollapsed(false);}}/>{query&&<button className="icon-button" onClick={()=>setQuery('')} aria-label="검색어 지우기"><X size={17}/></button>}</div><div className="list-controls"><button className={`filter-button ${sponsor!=='전체'?'chosen':''}`} onClick={()=>setShowFilters(true)} aria-haspopup="dialog" aria-expanded={showFilters} aria-label={sponsor==='전체'?'후원처':'후원처 활성'}>후원처</button></div></div>
      <dialog ref={filterDialog} className="sponsor-dialog" aria-labelledby="sponsor-title" onCancel={()=>setShowFilters(false)} onClick={e=>{if(e.target===e.currentTarget)setShowFilters(false);}} onClose={()=>setShowFilters(false)}><div className="sponsor-modal"><div className="modal-title"><h2 id="sponsor-title">후원처</h2><button className="icon-button" aria-label="후원처 모달 닫기" onClick={()=>setShowFilters(false)}><X size={22}/></button></div><div className="sponsor-options">{['전체',...sponsors].map(item=><button key={item} className={`sponsor-option ${sponsor===item?'active':''}`} aria-pressed={sponsor===item} onClick={()=>{setSponsor(current=>current===item?'전체':item);close();setCollapsed(false);setShowFilters(false);}}><span>{item}</span>{sponsor===item&&<Check size={18}/>}</button>)}</div></div></dialog>
      <div className="map-tools"><button className="location-button" onClick={locate} aria-label="내 위치" disabled={locating}><LocateFixed size={21} className={locating?'spin':''}/></button><div className="zoom"><button onClick={()=>mapRef.current?.zoomIn()} aria-label="지도 확대"><Plus size={21}/></button><button onClick={()=>mapRef.current?.zoomOut()} aria-label="지도 축소"><Minus size={21}/></button></div><button onClick={()=>{const positions=filtered.filter(hasCoordinate).map(p=>[p.latitude,p.longitude]);if(positions.length)mapRef.current?.fitBounds(positions,{padding:[60,70],maxZoom:17});}} aria-label="전체 주점 보기"><MapPin size={21}/></button></div>
      <aside ref={panelRef} className={`panel ${selected?'has-detail':''} ${expanded?'expanded':''} ${collapsed?'collapsed':''}`} aria-label="주점 목록 및 상세정보">
        <button className="sheet-handle" aria-label={collapsed?'패널 펼치기':'패널 줄이기'} onPointerDown={e=>{dragStart.current=e.clientY;e.currentTarget.setPointerCapture(e.pointerId);}} onPointerUp={e=>{const delta=e.clientY-dragStart.current;if(Math.abs(delta)>20){changeSheet(delta>0?'down':'up');dragStart.current=null;}}} onClick={()=>{if(dragStart.current===null){dragStart.current=undefined;return;}if(collapsed)setCollapsed(false);else setCollapsed(true);}} onKeyDown={e=>{if(e.key==='ArrowUp'){e.preventDefault();changeSheet('up');}if(e.key==='ArrowDown'){e.preventDefault();changeSheet('down');}}}><span/></button>
        {selected?<>

          <div className="detail-scroll">
            
            <div className="detail-body">{selected.sponsor&&<div className="sponsor"><Tiger/>{selected.sponsor}</div>}<h1>{selected.name}</h1><p className="address"><MapPin size={15}/>{selected.address||'주소 정보 미등록'}</p><p className="time"><Clock size={15}/>{formatTime(selected.operatingTime)}</p>
              {detailError&&<p className="inline-error" role="status">{detailError}</p>}
              <div className="directions"><button className="secondary" disabled={!hasCoordinate(selected)} onClick={()=>setEndpoint('start')}>출발</button><button className="primary" disabled={!hasCoordinate(selected)} onClick={()=>setEndpoint('end')}>도착</button></div>
            </div>

          </div>
        </>:<>

          <div className="list-summary"><span>무료주점 <b>{filtered.length}</b>곳</span><span>안암·고려대학교 주변</span></div>
          {season?.isKoyeon===false&&<p className="season-note">현재 고연전 시즌이 아니에요. 등록된 주점 정보를 표시합니다.</p>}
          <div className="pub-list">{loading?<div className="state" role="status"><RefreshCw className="spin" size={24}/><b>주점 정보를 불러오고 있어요</b></div>:error?<div className="state" role="alert"><b>정보를 불러오지 못했어요</b><p>{error}</p><button className="primary" onClick={load}><RefreshCw size={16}/>다시 시도</button></div>:filtered.length?filtered.map(pub=><button className="pub-card" key={pub.id} onClick={()=>choose(pub)}><div className="pub-card-heading"><span className="pub-avatar"><Tiger/></span><div><span>{pub.sponsor||'고연전 무료주점'}</span><b>{pub.name}</b></div><ArrowUpRight size={18}/></div><p><Clock size={14}/>{formatTime(pub.operatingTime)}</p><p className="card-address">{pub.address||'주소 정보 미등록'}</p></button>):<div className="state"><Search size={25}/><b>일치하는 주점이 없어요</b><p>다른 검색어나 후원처로 찾아보세요.</p><button className="secondary" onClick={()=>{setQuery('');setSponsor('전체');}}>전체 주점 보기</button></div>}</div>
          <footer className="list-footer">고연전 무료주점 정보 · 고대로</footer>
        </>}
      </aside>
      {(start||end)&&<section className="route-panel" aria-label="도보 길찾기"><div className="route-header"><b><Footprints size={18}/>도보 길찾기</b><button className="icon-button" onClick={()=>{setStart(null);setEnd(null);}} aria-label="길찾기 닫기"><X size={19}/></button></div><div className="route-points"><div><label>출발</label><select aria-label="출발 주점" value={start?.id||''} onChange={e=>setStart(e.target.value==='my-location'?location:pubs.find(p=>String(p.id)===e.target.value)||null)}><option value="">출발지를 선택하세요</option>{location&&<option value="my-location">내 위치</option>}{pubs.filter(hasCoordinate).map(p=><option value={p.id} key={p.id}>{p.name}</option>)}</select></div><div><label>도착</label><select aria-label="도착 주점" value={end?.id||''} onChange={e=>setEnd(pubs.find(p=>String(p.id)===e.target.value)||null)}><option value="">도착지를 선택하세요</option>{pubs.filter(hasCoordinate).map(p=><option value={p.id} key={p.id}>{p.name}</option>)}</select></div><button className="icon-button swap" onClick={()=>{setStart(end);setEnd(start);}} aria-label="출발 도착 바꾸기"><ArrowDownUp size={18}/></button></div>{!location&&<button className="location-link" onClick={locate} disabled={locating}><LocateFixed size={14}/>{locating?'위치 확인 중…':'내 위치 확인하기'}</button>}<div className="route-result" role="status">{routing?'도보 경로를 찾고 있어요…':route?<><b>도보 약 {Math.max(1,Math.ceil(route.duration/60))}분</b><span>{route.path.filter(s=>s.inOut===false).map(s=>s.info).filter(Boolean).join(' → ')}</span></>:routeError||'지도나 목록에서 출발지와 도착지를 선택해주세요.'}</div></section>}
      {notice&&<div className="toast" role="status">{notice}</div>}
    </main>
  </div>;
}
