import React,{useState,useEffect,useRef,useCallback} from 'react';
import {Search,X,ArrowLeft,ArrowUpRight,MapPin,Clock,Navigation,LocateFixed,Plus,Minus,SlidersHorizontal,ChevronDown,Footprints,ArrowDownUp,Share2,Check,RefreshCw} from 'lucide-react';
import Map from './Map.jsx';
import {getData,filterPubs,hasCoordinate,menusOf,formatTime,routeCoordinates} from './data.js';
import './style.css';
const Tiger=()=> <img className="tiger" src={`${import.meta.env.BASE_URL}assets/icon-tiger-red.svg`} alt=""/>;
export default function KoyeonMap(){
  const [pubs,setPubs]=useState([]),[loading,setLoading]=useState(true),[error,setError]=useState(''),[query,setQuery]=useState(''),[selected,setSelected]=useState(null),[detailError,setDetailError]=useState(''),[detailLoading,setDetailLoading]=useState(false),[season,setSeason]=useState(null),[sponsor,setSponsor]=useState('전체'),[showFilters,setShowFilters]=useState(false),[expanded,setExpanded]=useState(false),[start,setStart]=useState(null),[end,setEnd]=useState(null),[route,setRoute]=useState(null),[routing,setRouting]=useState(false),[routeError,setRouteError]=useState(''),[location,setLocation]=useState(null),[locating,setLocating]=useState(false),[notice,setNotice]=useState(''),[copied,setCopied]=useState(false);
  const mapRef=useRef(),detailAbort=useRef(),noticeTimer=useRef();
  const announce=useCallback(text=>{setNotice(text);clearTimeout(noticeTimer.current);noticeTimer.current=setTimeout(()=>setNotice(''),4500);},[]);
  const load=useCallback(async()=>{setLoading(true);setError('');try{const [list,currentSeason]=await Promise.all([getData('pubs'),getData('season').catch(()=>null)]);if(!Array.isArray(list?.list))throw new Error('주점 목록을 확인할 수 없습니다.');setPubs(list.list);setSeason(currentSeason);}catch(e){setError(e.message);}finally{setLoading(false);}},[]);
  useEffect(()=>{load();return()=>{detailAbort.current?.abort();clearTimeout(noticeTimer.current);};},[load]);
  const choose=useCallback(pub=>{
    detailAbort.current?.abort();const controller=new AbortController();detailAbort.current=controller;
    setSelected(pub);setDetailError('');setDetailLoading(true);setExpanded(false);
    const url=new URL(window.location.href);url.searchParams.set('pub',pub.id);url.hash='/';window.history.replaceState(null,'',url);
    if(hasCoordinate(pub))mapRef.current?.focus([pub.latitude,pub.longitude],18,{duration:.65});
    getData(`pubs/${pub.id}`,{},controller.signal).then(detail=>setSelected(current=>current?.id===pub.id?{...pub,...detail}:current)).catch(e=>{if(e.name!=='AbortError')setDetailError('상세정보를 가져오지 못했습니다. 목록 정보를 표시합니다.');}).finally(()=>{if(!controller.signal.aborted)setDetailLoading(false);});
  },[]);
  useEffect(()=>{if(!pubs.length)return;const id=new URLSearchParams(window.location.search || window.location.hash.split('?')[1]).get('pub');const match=pubs.find(pub=>String(pub.id)===id);if(match)choose(match);},[pubs,choose]);
  const close=()=>{detailAbort.current?.abort();setSelected(null);setDetailLoading(false);setDetailError('');const url=new URL(window.location.href);url.searchParams.delete('pub');url.hash='/';window.history.replaceState(null,'',url);};
  useEffect(()=>{const handler=e=>{if(e.key==='Escape'){close();setExpanded(false);setShowFilters(false);}};window.addEventListener('keydown',handler);return()=>window.removeEventListener('keydown',handler);},[]);
  useEffect(()=>{
    setRoute(null);setRouteError('');
    if(!start||!end){setRouting(false);return;}
    if(start.id===end.id){setRouteError('출발지와 도착지를 다르게 선택해주세요.');setRouting(false);return;}
    const controller=new AbortController();setRouting(true);
    getData('routes',{startLat:start.latitude,startLong:start.longitude,endLat:end.latitude,endLong:end.longitude},controller.signal).then(data=>{const found=data?.find(item=>routeCoordinates(item).length);if(!found)throw new Error('이 구간의 도보 경로를 찾지 못했습니다.');setRoute(found);}).catch(e=>{if(e.name!=='AbortError')setRouteError(e.message);}).finally(()=>{if(!controller.signal.aborted)setRouting(false);});
    return()=>controller.abort();
  },[start,end]);
  const locate=()=>{if(!navigator.geolocation){announce('이 브라우저에서는 내 위치를 사용할 수 없습니다.');return;}setLocating(true);navigator.geolocation.getCurrentPosition(position=>{const current={id:'my-location',name:'내 위치',latitude:position.coords.latitude,longitude:position.coords.longitude};setLocation(current);mapRef.current?.focus([current.latitude,current.longitude],17);setLocating(false);},e=>{setLocating(false);announce(e.code===1?'위치 권한을 허용하면 내 위치를 확인할 수 있어요.':'내 위치를 찾지 못했습니다. 다시 시도해주세요.');},{enableHighAccuracy:true,timeout:10000,maximumAge:60000});};
  const share=async()=>{try{await navigator.clipboard.writeText(window.location.href);setCopied(true);announce('주점 링크를 복사했어요.');setTimeout(()=>setCopied(false),2000);}catch{announce('주소창의 링크를 복사해서 공유해주세요.');}};
  const filtered=filterPubs(pubs,query,sponsor),sponsors=[...new Set(pubs.map(pub=>pub.sponsor).filter(Boolean))];
  const setEndpoint=(kind)=>{if(!hasCoordinate(selected)){announce('위치 정보가 없는 주점입니다.');return;}(kind==='start'?setStart:setEnd)(selected);announce(kind==='start'?'출발지를 설정했어요. 도착할 주점을 선택해주세요.':'도착지를 설정했어요. 출발할 주점을 선택해주세요.');};
  return <div className="app">
    <header className="header"><a href={import.meta.env.BASE_URL} className="brand" aria-label="고대로 고연전 지도 홈"><Tiger/><span>고대로</span><i/><strong>고연전 지도</strong></a><a className="app-link" href="https://kodaero.co.kr" target="_blank" rel="noopener noreferrer">고대로 앱 <ArrowUpRight size={16}/></a></header>
    <main className="workspace">
      <Map pubs={filtered} selected={selected} onSelect={choose} mapRef={mapRef} route={route} location={location}/>
      <div className="map-heading"><img src={`${import.meta.env.BASE_URL}assets/icon-FREE_BAR-button.svg`} alt=""/><div><b>고연전 무료주점</b><span>우리의 뒤풀이, 고대로에서</span></div></div>
      <div className="map-tools"><button onClick={locate} aria-label="내 위치" disabled={locating}><LocateFixed size={21} className={locating?'spin':''}/></button><div className="zoom"><button onClick={()=>mapRef.current?.zoomIn()} aria-label="지도 확대"><Plus size={21}/></button><button onClick={()=>mapRef.current?.zoomOut()} aria-label="지도 축소"><Minus size={21}/></button></div><button onClick={()=>{const positions=filtered.filter(hasCoordinate).map(p=>[p.latitude,p.longitude]);if(positions.length)mapRef.current?.fitBounds(positions,{padding:[60,70],maxZoom:17});}} aria-label="전체 주점 보기"><MapPin size={21}/></button></div>
      <aside className={`panel ${expanded?'expanded':''}`} aria-label="주점 목록 및 상세정보">
        <button className="sheet-handle" aria-label={expanded?'패널 줄이기':'패널 펼치기'} onClick={()=>setExpanded(!expanded)}><span/></button>
        {selected?<>
          <div className="detail-top"><button className="icon-button" onClick={close} aria-label="주점 목록으로"><ArrowLeft size={22}/></button><span>무료주점 정보</span><button className="icon-button" onClick={share} aria-label="주점 링크 복사">{copied?<Check size={20}/>:<Share2 size={20}/>}</button></div>
          <div className="detail-scroll">
            <img className="detail-image" src={`${import.meta.env.BASE_URL}assets/free-bar-main-image.png`} alt="고대로 무료주점 안내"/>
            <div className="detail-body"><div className="sponsor"><Tiger/>{selected.sponsor||'고연전 무료주점'}</div><h1>{selected.name}</h1><p className="address"><MapPin size={15}/>{selected.address||'주소 정보 미등록'}</p><p className="time"><Clock size={15}/>{formatTime(selected.operatingTime)}</p>
              {detailError&&<p className="inline-error" role="status">{detailError}</p>}
              <div className="directions"><button className="secondary" disabled={!hasCoordinate(selected)} onClick={()=>setEndpoint('start')}>출발</button><button className="primary" disabled={!hasCoordinate(selected)} onClick={()=>setEndpoint('end')}><Navigation size={17}/>도착</button></div>
            </div>
            <section className="menus"><h2>무료주점 메뉴</h2>{detailLoading?<p className="muted" role="status">메뉴를 확인하고 있어요…</p>:menusOf(selected).length?menusOf(selected).map((menu,index)=><div className="menu" key={`${menu}-${index}`}><img src={`${import.meta.env.BASE_URL}assets/menu-utensil-icon.svg`} alt=""/><span>{menu}</span><b>무료</b></div>):<p className="muted">등록된 메뉴 정보가 없어요.</p>}<p className="detail-note">운영시간과 제공 메뉴는 현장 상황에 따라 달라질 수 있어요.</p></section>
          </div>
        </>:<>
          <div className="list-top"><div className="eyebrow"><Tiger/>고연전과 함께하는 고대로</div><h1>고연전 뒤풀이를<br/>지도에서 찾아보세요<span>.</span></h1><div className="search"><Search size={19}/><input aria-label="주점 검색" placeholder="주점 이름, 후원처, 메뉴 검색" value={query} onChange={e=>setQuery(e.target.value)}/>{query&&<button className="icon-button" onClick={()=>setQuery('')} aria-label="검색어 지우기"><X size={17}/></button>}</div><div className="list-controls"><span className="chip"><img src={`${import.meta.env.BASE_URL}assets/icon-FREE_BAR-button.svg`} alt=""/>무료주점</span><button className={`filter-button ${sponsor!=='전체'?'chosen':''}`} onClick={()=>setShowFilters(!showFilters)} aria-expanded={showFilters}><SlidersHorizontal size={15}/>후원처<ChevronDown size={14}/></button></div>{showFilters&&<label className="filter-select">후원처 선택<select value={sponsor} onChange={e=>setSponsor(e.target.value)}><option>전체</option>{sponsors.map(item=><option key={item}>{item}</option>)}</select></label>}</div>
          <div className="list-summary"><span>무료주점 <b>{filtered.length}</b>곳</span><span>안암·고려대학교 주변</span></div>
          {season?.isKoyeon===false&&<p className="season-note">현재 고연전 시즌이 아니에요. 등록된 주점 정보를 표시합니다.</p>}
          <div className="pub-list">{loading?<div className="state" role="status"><RefreshCw className="spin" size={24}/><b>주점 정보를 불러오고 있어요</b></div>:error?<div className="state" role="alert"><b>정보를 불러오지 못했어요</b><p>{error}</p><button className="primary" onClick={load}><RefreshCw size={16}/>다시 시도</button></div>:filtered.length?filtered.map(pub=><button className="pub-card" key={pub.id} onClick={()=>choose(pub)}><div className="pub-card-heading"><span className="pub-avatar"><Tiger/></span><div><b>{pub.name}</b><span>{pub.sponsor||'고연전 무료주점'}</span></div><ArrowUpRight size={18}/></div><p><Clock size={14}/>{formatTime(pub.operatingTime)}</p><p className="card-address">{pub.address||'주소 정보 미등록'}</p></button>):<div className="state"><Search size={25}/><b>일치하는 주점이 없어요</b><p>다른 검색어나 후원처로 찾아보세요.</p><button className="secondary" onClick={()=>{setQuery('');setSponsor('전체');}}>전체 주점 보기</button></div>}</div>
          <footer className="list-footer">고연전 무료주점 정보 · 고대로</footer>
        </>}
      </aside>
      {(start||end)&&<section className="route-panel" aria-label="도보 길찾기"><div className="route-header"><b><Footprints size={18}/>도보 길찾기</b><button className="icon-button" onClick={()=>{setStart(null);setEnd(null);}} aria-label="길찾기 닫기"><X size={19}/></button></div><div className="route-points"><div><label>출발</label><select aria-label="출발 주점" value={start?.id||''} onChange={e=>setStart(e.target.value==='my-location'?location:pubs.find(p=>String(p.id)===e.target.value)||null)}><option value="">출발지를 선택하세요</option>{location&&<option value="my-location">내 위치</option>}{pubs.filter(hasCoordinate).map(p=><option value={p.id} key={p.id}>{p.name}</option>)}</select></div><div><label>도착</label><select aria-label="도착 주점" value={end?.id||''} onChange={e=>setEnd(pubs.find(p=>String(p.id)===e.target.value)||null)}><option value="">도착지를 선택하세요</option>{pubs.filter(hasCoordinate).map(p=><option value={p.id} key={p.id}>{p.name}</option>)}</select></div><button className="icon-button swap" onClick={()=>{setStart(end);setEnd(start);}} aria-label="출발 도착 바꾸기"><ArrowDownUp size={18}/></button></div>{!location&&<button className="location-link" onClick={locate} disabled={locating}><LocateFixed size={14}/>{locating?'위치 확인 중…':'내 위치 확인하기'}</button>}<div className="route-result" role="status">{routing?'도보 경로를 찾고 있어요…':route?<><b>도보 약 {Math.max(1,Math.ceil(route.duration/60))}분</b><span>{route.path.filter(s=>s.inOut===false).map(s=>s.info).filter(Boolean).join(' → ')}</span></>:routeError||'지도나 목록에서 출발지와 도착지를 선택해주세요.'}</div></section>}
      {notice&&<div className="toast" role="status">{notice}</div>}
    </main>
  </div>;
}
