// 기존 Kodaero-Web의 웹 지도 애플리케이션 ID를 기본값으로 사용한다.
export const NAVER_MAP_CLIENT_ID = import.meta.env?.VITE_NAVER_MAP_CLIENT_ID || '8alsyra0y4';
const keyParameter = import.meta.env?.VITE_NAVER_MAP_KEY_PARAM || 'ncpClientId';
let sdkPromise;
export function loadNaverMaps() {
    if (window.naver?.maps?.Map) return Promise.resolve(window.naver.maps);
    if (sdkPromise) return sdkPromise;
    sdkPromise = new Promise((resolve, reject) => {
        const script = document.createElement('script');
        const timeout = setTimeout(() => reject(new Error('네이버 지도를 불러오지 못했습니다. 연결 상태를 확인해주세요.')), 15000);
        const fail = message => {
            clearTimeout(timeout);
            window.dispatchEvent(new CustomEvent('kodaero:naver-map-error', {detail:message}));
            reject(new Error(message));
        };
        window.navermap_authFailure = () => fail('네이버 지도 인증을 확인해주세요. 웹 지도 키와 kodaero.co.kr 도메인 등록이 필요합니다.');
        script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?${keyParameter}=${encodeURIComponent(NAVER_MAP_CLIENT_ID)}`;
        script.async = true;
        script.onload = () => {
            clearTimeout(timeout);
            if (window.naver?.maps?.Map) resolve(window.naver.maps);
            else fail('네이버 지도 SDK를 불러오지 못했습니다.');
        };
        script.onerror = () => fail('네이버 지도 서버에 연결하지 못했습니다. 잠시 후 다시 시도해주세요.');
        document.head.appendChild(script);
    }).catch(error => { sdkPromise = null; throw error; });
    return sdkPromise;
}
export function fitNaverBounds(map, maps, points, options = {}) {
    if (!points.length) return;
    const bounds = new maps.LatLngBounds();
    points.forEach(([lat,lng])=>bounds.extend(new maps.LatLng(lat,lng)));
    map.fitBounds(bounds, {
        top: options.top ?? options.padding?.[1] ?? 60,
        right: options.right ?? options.padding?.[0] ?? 60,
        bottom: options.bottom ?? options.padding?.[1] ?? 60,
        left: options.left ?? options.padding?.[0] ?? 60,
        maxZoom: options.maxZoom ?? 18,
    });
}
