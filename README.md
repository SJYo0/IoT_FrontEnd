# IoT Dashboard FrontEnd

React와 Vite 기반의 IoT 데이터 수집·관제 플랫폼 관리자 프론트엔드입니다.
Spring 백엔드 API, MQTT 실시간 메시지, MediaMTX CCTV 스트림과 연동해 인증, 대시보드, 기기 승인, 환경 제어, 히스토리, AI 리포트 화면을 제공합니다.

## 주요 기능

| 영역 | 설명 |
| --- | --- |
| 인증 | 로그인, 회원가입, 비밀번호 재설정, CSRF 토큰 처리, 세션 기반 보호 라우트 |
| 대시보드 | 실외 날씨, 실내 센서값, 경보, AI 분석 요약, CCTV 스트림을 한 화면에서 표시 |
| 실시간 관제 | MQTT 토픽을 구독해 센서 텔레메트리, 알람, AI 분석 결과를 즉시 반영 |
| 기기 관리 | 연결 요청 승인/거절, 온라인 기기와 대기 기기의 연결 상태 확인 |
| 환경 제어 | 선택한 기기의 창문, 냉난방, 가습/제습, 공기청정, 스프링클러, 화재 경보 상태 제어 |
| 제어 권한 설정 | AI가 제어할 수 있는 환경 요소를 기기별로 설정 |
| 히스토리 | 일간, 주간, 월간 실내·실외 센서 데이터를 차트와 테이블로 조회 |
| AI 리포트 | 선택 기기의 일간 AI 분석 리포트, 주요 알람, 제어 효율, 에너지 사용 추정 표시 |

## 기술 스택

| 구분 | 사용 기술 |
| --- | --- |
| 런타임 | React 19, React DOM 19 |
| 라우팅 | React Router DOM 7 |
| 빌드 | Vite 8, `@vitejs/plugin-react` |
| 스타일 | Tailwind CSS 4, `@tailwindcss/vite` |
| UI 유틸 | Radix UI primitives, class-variance-authority |
| 애니메이션 | Framer Motion |
| 아이콘 | Lucide React |
| HTTP | Fetch 기반 `apiFetch` 래퍼, 일부 화면의 axios |
| 실시간 통신 | Eclipse Paho MQTT over WebSocket |
| 정적 분석 | ESLint 9, React Hooks ESLint, React Refresh ESLint |

## 실행 방법

```bash
npm install
npm run dev
```

프로덕션 빌드와 로컬 미리보기:

```bash
npm run build
npm run preview
```

정적 분석:

```bash
npm run lint
```

## 환경 변수

Vite 환경 변수는 `VITE_` 접두사를 사용합니다. `.env*` 파일은 Git에 포함하지 않도록 ignore 되어 있으므로, 로컬과 클라우드 환경별 값을 별도로 관리하세요.

| 변수 | 설명 | 예시 |
| --- | --- | --- |
| `VITE_API_BASE_URL` | 백엔드 API base URL. 비워두면 현재 origin 기준 상대 경로(`/api`)를 사용합니다. | `http://127.0.0.1:8080` |
| `VITE_MQTT_BROKER` | MQTT WebSocket 브로커 호스트. 코드에서 port `9001`을 사용합니다. | `127.0.0.1` |
| `VITE_MEDIAMTX_IP` | 대시보드 내 CCTV iframe에 사용할 MediaMTX 호스트. 코드에서 `http://{host}:8889/cam` 형식으로 사용합니다. | `127.0.0.1` |

로컬 개발 예시:

```env
VITE_API_BASE_URL=http://127.0.0.1:8080
VITE_MQTT_BROKER=127.0.0.1
VITE_MEDIAMTX_IP=127.0.0.1
```

클라우드 배포에서 프론트와 API가 같은 도메인 뒤에 있다면 `VITE_API_BASE_URL`을 비워두고 Nginx 등에서 `/api`를 백엔드로 프록시하는 구성이 적합합니다.

## API와 인증 흐름

- 공통 API 호출은 `src/Auth/api.js`의 `apiFetch`를 사용합니다.
- `VITE_API_BASE_URL`이 있으면 해당 URL을 base로 사용하고, 없으면 상대 경로로 호출합니다.
- `POST`, `PUT`, `PATCH`, `DELETE` 요청 전에는 `/api/auth/csrf`를 호출해 `XSRF-TOKEN` 쿠키를 읽고 `X-XSRF-TOKEN` 헤더를 붙입니다.
- 보호 라우트는 화면 진입 전 `/api/auth/me` 응답으로 인증 상태를 확인합니다.
- 기기 승인 화면은 기존 axios 흐름을 사용하며, axios 전역 `withCredentials`와 XSRF 헤더 설정을 사용합니다.

## 실시간 MQTT 연동

| 토픽 | 사용 화면 | 용도 |
| --- | --- | --- |
| `gateway/+/telemetry` | 대시보드, 기기 연결정보 | 센서 텔레메트리 수신, 기기 온라인 판정 |
| `webbackend/alarm/+` | 대시보드, 상단바 | 온도·습도·화재·TVOC·eCO2 알람 반영 |
| `webbackend/analysis/+` | 대시보드 | AI 분석 상태와 요약 갱신 |
| `webbackend/control/{mac}` | 환경 제어 | 백엔드/AI 제어 상태 동기화 |

MQTT 연결은 `VITE_MQTT_BROKER` 호스트와 WebSocket port `9001`을 사용합니다. 페이지가 HTTPS로 열리면 `useSSL: true`로 연결합니다.

## 라우트

| 경로 | 화면 | 인증 |
| --- | --- | --- |
| `/` | 로그인 | 불필요 |
| `/signup` | 회원가입 | 불필요 |
| `/forgot-password` | 비밀번호 재설정 | 불필요 |
| `/dashboard` | 대시보드 | 필요 |
| `/weather` | `/dashboard` 리다이렉트 | 필요 |
| `/device/approveReq` | 기기 연결 요청 승인 | 필요 |
| `/device/connections` | 기기 연결 상태 | 필요 |
| `/cctv` | CCTV 단독 관제 화면 | 필요 |
| `/env-control` | 환경 제어 인터페이스 | 필요 |
| `/history` | 센서 히스토리 | 필요 |
| `/ai-report` | AI 일간 리포트 | 필요 |
| `/settings` | AI 제어 권한 설정 | 필요 |

## 디렉터리 구조

```text
src/
  App.jsx                 # 라우팅과 ProtectedRoute 구성
  main.jsx                # React 앱 엔트리포인트
  Auth/                   # 로그인, 회원가입, 비밀번호 재설정, 공통 API 유틸
  DashBoard/              # 실시간 대시보드, 센서 게이지, 알람, AI 분석, CCTV 카드
  CCTV/                   # CCTV 단독 화면
  registerDevice/         # 기기 승인/거절, 연결 상태 확인
  envControl/             # 환경 제어 화면과 제어 API 유틸
  history/                # 센서 데이터 히스토리 차트와 테이블
  aiReport/               # AI 일간 리포트 화면
  settings/               # AI 제어 가능 항목 설정 화면
  sidebar/                # 좌측 사이드바, 상단바, 기기 선택, 알림 처리
  navigation/             # 네비게이션 메뉴 정의
  components/ui/          # 버튼, 카드, 입력, 탭, 로그인 UI 등 공통 컴포넌트
  constants/              # 인증 화면 문구 상수
  lib/                    # 공통 유틸리티
  assets/                 # 앱 내부 이미지 자산
public/                   # favicon, sprite 등 정적 파일
scripts/                  # 보조 스크립트
.github/workflows/        # GitHub Actions 배포 워크플로
```

## 기기 선택과 로컬 상태

선택한 기기 MAC 주소는 `iot.selectedDeviceMac` 키로 `sessionStorage`와 `localStorage`에 저장됩니다.
대시보드, 환경 제어, 설정, 히스토리, AI 리포트 화면은 이 값을 기준으로 데이터를 조회하거나 MQTT 메시지를 필터링합니다.

## 배포

`.github/workflows/deploy.yml`은 `main` 브랜치 push 시 SSH로 KT Cloud 서버에 접속해 프론트엔드 저장소를 갱신하고, Docker Compose로 Nginx 서비스를 재빌드하도록 구성되어 있습니다.

필요한 GitHub Secrets:

- `HOST`
- `USERNAME`
- `SSH_KEY`

## 개발 메모

- 로컬 개발 서버는 Vite proxy를 통해 `/api`와 `/devices` 요청을 백엔드로 전달합니다.
- `VITE_API_BASE_URL`을 설정하면 브라우저에서 해당 API 서버로 직접 요청합니다.
- 클라우드에서 같은 origin 프록시를 사용할 경우 `VITE_API_BASE_URL`을 비워두는 구성이 안전합니다.
- MediaMTX iframe URL은 대시보드와 CCTV 화면에서 각각 사용되며, 배포 환경의 HTTPS/mixed content 정책을 함께 확인해야 합니다.
