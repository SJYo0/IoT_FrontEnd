# IoT Dashboard — FrontEnd

React(Vite) 기반 IoT 데이터 수집·관리 플랫폼 관리자 UI입니다.  
백엔드 API와 연동해 인증, 대시보드, 기기 승인, 실시간 관제 화면을 제공합니다.

**저장소:** [IoT-data-collection-platform-project/FrontEnd](https://github.com/IoT-data-collection-platform-project/FrontEnd)

---

## GitHub 저장소 설명용 (한 줄)

> React + Vite 기반 IoT 플랫폼 관리자 프론트엔드 — 로그인/회원가입, 센서·날씨 대시보드, 기기 연결 승인, CCTV 관제

**English (optional):** Admin frontend for an IoT data platform (React, Vite): auth, sensor/weather dashboard, device approval, CCTV monitoring.

---

## 주요 기능

| 영역 | 설명 |
|------|------|
| **인증** | 로그인·회원가입, CSRF 대응 API 호출, 세션 기반 `/api/auth/me`로 보호 라우트 |
| **대시보드** | 실외 날씨·센서 지표 시각화(반원 게이지), 주의보(강풍/건조), 주간 점수 차트, 실시간 시계 |
| **기기 관리** | 연결 요청 승인 화면 (`/device/approveReq`) |
| **관제** | CCTV 실시간 관제 페이지 (`/cctv`, 로그인 필요) |
| **네비게이션** | 좌측 아이콘 사이드바, 로그인·회원가입 화면에서는 사이드바 숨김 |

---

## 기술 스택

- **런타임:** React 19, React Router 7  
- **빌드:** Vite 8  
- **스타일:** Tailwind CSS 4 (`@tailwindcss/vite`)  
- **UI·애니메이션:** Radix UI primitives, `class-variance-authority`, Framer Motion  
- **아이콘:** Lucide React  
- **HTTP:** `fetch` 래퍼 + axios(의존성)

---

## 시작하기

```bash
npm install
npm run dev
```

프로덕션 빌드:

```bash
npm run build
npm run preview
```

백엔드는 동일 프로젝트의 Spring API와 함께 구동하는 것을 전제로 하며, 개발 시 프록시 또는 API 베이스 URL을 환경에 맞게 설정하세요.

---

## 디렉터리 구조 (요약)

```
src/
  Auth/           # 로그인·회원가입, API 유틸
  DashBoard/      # 날씨·센서 대시보드
  registerDevice/ # 기기 승인
  CCTV/           # 실시간 관제
  components/ui/  # 공통 UI (버튼, 입력, 게이미파이드 로그인/회원가입 카드 등)
  sidebar/        # 사이드바
  App.jsx         # 라우팅·보호 라우트
```

---

## 라우트 요약

| 경로 | 설명 |
|------|------|
| `/`, `/signup` | 로그인·회원가입 (전체 화면) |
| `/dashboard` | 대시보드 (인증 필요) |
| `/weather` | `/dashboard`로 리다이렉트 |
| `/device/approveReq` | 연결 요청 승인 |
| `/cctv` | 실시간 관제 (인증 필요) |

---

## 라이선스

조직/프로젝트 정책에 맞게 상위 저장소와 동일하게 지정하세요.
