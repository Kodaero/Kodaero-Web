# Kodaero-Web · 고연전 지도

현행 고대로 앱 테마로 재구성한 고연전 무료주점 전용 웹입니다. Pretendard, 코랄 포인트, 호랑이 아이콘과 앱 마커를 사용합니다. 주점 검색, 후원처 필터, 상세정보·메뉴, 링크 공유, 내 위치, 출발·도착 선택과 도보 경로를 제공합니다.

## 로컬 실행

Node 22 이상에서 `npm ci`, `npm run dev -- --host 0.0.0.0 --port 8100 --strictPort`를 실행합니다. Expo 앱의 8097과 분리합니다. `npm test`, `npm run build`로 검증합니다.

## 구조와 이전 링크

- `src/koyeon/`: 새 지도와 모바일 하단 패널 / PC 사이드바
- `api/koyeon.js`, `lib/proxy.js`: 운영 백엔드의 공개 고연전 GET 및 좌표 기반 도보 경로 중계
- 기존 `/#/menu/:id` 링크는 새 상세 패널로 연결하고 `/#/search` 경로도 유지합니다.
- 기존 화면 파일과 마커 JSON은 참고용으로 보존합니다. 활성 화면은 운영 API 데이터를 사용합니다.

운영시간의 원본 날짜를 그대로 표시하며 영업 중 여부를 추정하지 않습니다. 내 위치는 버튼 클릭 시에만 요청하고 저장하지 않습니다. 내 위치를 출발지로 선택하면 도보 경로 계산에만 좌표를 전달합니다. 프록시는 임의 URL·인증 API·쓰기 요청을 허용하지 않고 경로 응답을 캐시하지 않습니다.

지도는 기존 Kodaero-Web과 동일한 NAVER Maps JavaScript API v3를 사용합니다. 기본 웹 Client ID와 인증 파라미터도 기존 구현을 유지합니다. 키가 변경되면 `VITE_NAVER_MAP_CLIENT_ID`를 지정하고 신규 Maps 애플리케이션은 `VITE_NAVER_MAP_KEY_PARAM=ncpKeyId`를 지정합니다. 네이버 클라우드의 Web Dynamic Map 서비스와 `https://kodaero.co.kr` 도메인 등록을 확인해야 합니다. 인증 실패 시 오류를 표시하며 다른 지도 서비스로 대체하지 않습니다.

## 배포

지도 주소는 https://kodaero.co.kr/koyeon/ 입니다. 기존 `kodaero-landing` Vercel 프로젝트에서 랜딩과 지도를 함께 제공합니다. 이 저장소용 별도 Vercel 프로젝트는 사용하지 않습니다.

이 저장소에서 지도 코드를 수정하고 커밋한 뒤, Kodaero_Landing 저장소에서 `npm run koyeon:sync`를 실행해 `/koyeon/` 기준으로 빌드합니다. 랜딩의 `public/koyeon`에 지도 산출물을 포함하고 API 프록시도 함께 갱신합니다. 배포 서버에는 지도 의존성이나 별도 GitHub 연결이 필요하지 않습니다.

기존 EC2 워크플로는 참고용 수동 실행으로 보존했습니다. 기존 API 도메인 `be.kodaero.site`는 사용하지 않습니다.
