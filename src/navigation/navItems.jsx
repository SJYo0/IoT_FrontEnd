import { LayoutDashboard, Settings, TabletSmartphone, ChartNoAxesColumn, Bot } from "lucide-react";

export const NAV_ITEMS = [
  { icon: LayoutDashboard, path: "/dashboard", label: "대시보드" },
  { icon: TabletSmartphone, path: "/device/approveReq", label: "연결 요청" },
  { icon: Bot, path: "/env-control", label: "AI 환경 제어" },
  { icon: ChartNoAxesColumn, path: "/history", label: "그래프 목록" },
  { icon: Settings, path: "/settings", label: "설정" },
];

