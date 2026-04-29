import { Cctv, LayoutDashboard, Settings, TabletSmartphone } from "lucide-react";

export const NAV_ITEMS = [
  { icon: LayoutDashboard, path: "/dashboard", label: "대시보드" },
  { icon: TabletSmartphone, path: "/device/approveReq", label: "연결 요청" },
  { icon: Cctv, path: "/cctv", label: "실시간 관제" },
  { icon: Settings, path: "/settings", label: "설정" },
];

