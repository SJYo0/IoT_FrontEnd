import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Bell, ChevronDown, Info } from "lucide-react";
import { useLocation } from "react-router-dom";
import { apiFetch } from "../Auth/api";

const SELECTED_DEVICE_MAC_KEY = "iot.selectedDeviceMac";

function createStableId(prefix) {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function formatAgoText(createdAt) {
  const ts = createdAt ? new Date(createdAt).getTime() : NaN;
  if (!Number.isFinite(ts)) return "방금 전";
  const diffMin = Math.max(0, Math.floor((Date.now() - ts) / 60000));
  if (diffMin < 1) return "방금 전";
  if (diffMin < 60) return `${diffMin}분 전`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}시간 전`;
  return `${Math.floor(diffHour / 24)}일 전`;
}

function alertText(alert) {
  if (alert?.message) return alert.message;
  if (alert?.category) return `${alert.category} 경고`;
  return "알람이 발생했습니다.";
}

function TopSidebar() {
  const location = useLocation();
  const hidePaths = ["/", "/signup"];
  const shouldHide = hidePaths.includes(location.pathname);
  const [currentUsername, setCurrentUsername] = useState("");
  const [alarmExpanded, setAlarmExpanded] = useState(false);
  const [deviceExpanded, setDeviceExpanded] = useState(false);
  const [recentAlerts, setRecentAlerts] = useState([]);
  const [sessionDevices, setSessionDevices] = useState([]);
  const [selectedDeviceIdx, setSelectedDeviceIdx] = useState(0);

  useEffect(() => {
    if (shouldHide) return;

    let active = true;
    const loadCurrentUser = async () => {
      try {
        const response = await apiFetch("/api/auth/me");
        if (!response.ok) return;

        const payload = await response.json();
        if (!active) return;
        setCurrentUsername(typeof payload?.username === "string" ? payload.username : "");
        const parsedDevices = Array.isArray(payload?.devices)
          ? payload.devices
              .map((item) => ({
                mac: typeof item?.mac === "string" ? item.mac : "",
                ip: typeof item?.ip === "string" ? item.ip : "",
                online: item?.online === true,
              }))
              .filter((item) => item.mac || item.ip)
          : [];
        if (parsedDevices.length > 0) {
          setSessionDevices(parsedDevices);
          const savedMac =
            sessionStorage.getItem(SELECTED_DEVICE_MAC_KEY) ||
            localStorage.getItem(SELECTED_DEVICE_MAC_KEY) ||
            "";
          const defaultIdx = savedMac
            ? Math.max(
                0,
                parsedDevices.findIndex((item) => String(item.mac || "").trim() === savedMac),
              )
            : 0;
          setSelectedDeviceIdx(defaultIdx);
        } else {
          const single = {
            mac: typeof payload?.deviceMac === "string" ? payload.deviceMac : "",
            ip: typeof payload?.deviceIp === "string" ? payload.deviceIp : "",
            online: false,
          };
          setSessionDevices(single.mac || single.ip ? [single] : []);
          setSelectedDeviceIdx(0);
        }
      } catch {
        if (active) {
          setCurrentUsername("");
          setSessionDevices([]);
          setSelectedDeviceIdx(0);
        }
      }
    };

    loadCurrentUser();

    return () => {
      active = false;
    };
  }, [shouldHide, location.pathname]);

  useEffect(() => {
    const closeMenus = () => {
      setAlarmExpanded(false);
      setDeviceExpanded(false);
    };
    window.addEventListener("click", closeMenus);
    return () => window.removeEventListener("click", closeMenus);
  }, []);

  useEffect(() => {
    // window.dispatchEvent(new CustomEvent("iot-alert-raised", { detail: { category, severity, message, timestamp } }))
    const onAlertRaised = (event) => {
      const detail = event?.detail ?? {};
      if (!detail.category || !detail.severity) return;
      if (detail.severity !== "WARNING" && detail.severity !== "CRITICAL") return;

      const createdAt = detail.timestamp ? new Date(detail.timestamp) : new Date();
      setRecentAlerts((prev) => {
        const next = [
          {
            id: createStableId("alert"),
            category: detail.category,
            severity: detail.severity,
            message: detail.message || "",
            createdAt: createdAt.toISOString(),
            read: false,
          },
          ...prev,
        ];
        return next.slice(0, 20);
      });
    };

    window.addEventListener("iot-alert-raised", onAlertRaised);
    return () => window.removeEventListener("iot-alert-raised", onAlertRaised);
  }, []);

  const unreadAlerts = useMemo(() => recentAlerts.filter((alert) => !alert.read).length, [recentAlerts]);
  const selectedDevice = sessionDevices[selectedDeviceIdx] || sessionDevices[0] || null;
  const displayUsername = currentUsername.trim() || "Admin User";
  const userInitial = displayUsername.charAt(0).toUpperCase();

  useEffect(() => {
    if (shouldHide) return;
    const mac = String(selectedDevice?.mac || "").trim();
    const ip = String(selectedDevice?.ip || "").trim();

    if (mac) {
      sessionStorage.setItem(SELECTED_DEVICE_MAC_KEY, mac);
      localStorage.setItem(SELECTED_DEVICE_MAC_KEY, mac);
    }

    window.dispatchEvent(
      new CustomEvent("iot-device-selected", {
        detail: { mac, ip },
      }),
    );
  }, [selectedDevice?.mac, selectedDevice?.ip, shouldHide]);

  if (shouldHide) return null;

  return (
    <header
      className="relative flex h-20 items-center justify-between border-b border-slate-200 bg-[#f7f8fb] px-6 tracking-[-0.02em] leading-relaxed"
    >
      <div className="flex items-center gap-8">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-[12px] font-semibold text-slate-600">
            {userInitial}
          </span>
          <p className="text-[14px] font-medium text-slate-500">{displayUsername}</p>
        </div>
        <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-slate-800">
          IoT Monitoring
        </h1>
      </div>

      <div className="z-20">
        <div className="flex items-start gap-2">
          <div className="relative">
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                setAlarmExpanded((prev) => !prev);
                setDeviceExpanded(false);
              }}
              className="relative top-[6px] flex h-10 w-10 items-center justify-center rounded-[10px] border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-800"
              title="최근 울림 알람"
            >
              <Bell className="h-[18px] w-[18px]" />
              {unreadAlerts > 0 && (
                <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
                  {unreadAlerts > 99 ? "99+" : unreadAlerts}
                </span>
              )}
            </button>

            {alarmExpanded && (
              <div className="absolute right-0 top-12 z-40 w-[280px] overflow-hidden rounded-xl border border-slate-200 bg-slate-50 shadow-lg">
                <div className="flex items-center justify-between border-b border-slate-200 px-3 py-2">
                  <div className="inline-flex items-center gap-1.5">
                    <p className="text-[15px] font-semibold text-slate-700">최근 알람</p>
                    {unreadAlerts > 0 && (
                      <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-100 px-1 text-[11px] font-bold text-red-600">
                        {unreadAlerts > 99 ? "99+" : unreadAlerts}
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setRecentAlerts((alerts) => alerts.map((alert) => ({ ...alert, read: true })))}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
                  >
                    모두 읽음
                  </button>
                </div>
                <div className="max-h-72 overflow-y-auto divide-y divide-slate-200">
                  {recentAlerts.length === 0 && (
                    <div className="px-3 py-6 text-center text-xs text-slate-400">
                      최근 알람이 없습니다.
                    </div>
                  )}
                  {recentAlerts.map((alert) => (
                    <button
                      key={alert.id}
                      type="button"
                      onClick={() => {
                        setRecentAlerts((alerts) =>
                          alerts.map((item) => (item.id === alert.id ? { ...item, read: true } : item)),
                        );
                      }}
                      className="w-full bg-white px-3 py-3 text-left hover:bg-slate-100"
                    >
                      <div className="flex items-center gap-2">
                        {alert.severity === "CRITICAL" ? (
                          <AlertTriangle className="h-4 w-4 shrink-0 text-rose-500" />
                        ) : alert.severity === "WARNING" ? (
                          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" />
                        ) : (
                          <Info className="h-4 w-4 shrink-0 text-blue-500" />
                        )}
                        <p className="min-w-0 flex-1 truncate text-[15px] font-semibold text-slate-700">{alertText(alert)}</p>
                        <span className="inline-flex items-center gap-2 pl-2">
                          {!alert.read && <span className="h-2 w-2 shrink-0 rounded-full bg-blue-500" />}
                        </span>
                      </div>
                      <p className="pl-6 pt-1 text-xs font-medium text-slate-400">
                        {formatAgoText(alert.createdAt)}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                setDeviceExpanded((prev) => !prev);
                setAlarmExpanded(false);
              }}
              className="w-[180px] rounded-[10px] border border-slate-300 bg-white px-2.5 py-1 text-left text-slate-700 hover:bg-slate-50"
              title="연결 디바이스 목록"
            >
              <div className="flex min-w-0 items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  <span
                    className={`mt-1 h-2.5 w-2.5 shrink-0 self-center rounded-full ${
                      selectedDevice?.online
                        ? "bg-emerald-500 shadow-[0_0_0_2px_rgba(16,185,129,0.2)]"
                        : "bg-slate-400"
                    }`}
                  />
                  <div className="min-w-0">
                    <p className="truncate text-[12px] font-semibold text-slate-900">
                      {selectedDevice?.mac?.trim() ? selectedDevice.mac : "연결된 디바이스 없음"}
                    </p>
                    <p className="truncate text-[12px] font-medium text-slate-500">
                      {selectedDevice?.ip?.trim() ? selectedDevice.ip : "-"}
                    </p>
                  </div>
                </div>
                <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
              </div>
            </button>

            {deviceExpanded && (
              <div className="absolute right-0 top-12 z-40 w-[260px] overflow-hidden rounded-xl border border-slate-200 bg-slate-50 shadow-lg">
                <div className="border-b border-slate-200 px-3 py-2">
                  <p className="text-[13px] font-semibold text-slate-700">연결 디바이스</p>
                </div>
                <div className="max-h-72 overflow-y-auto divide-y divide-slate-200">
                  {sessionDevices.length === 0 && (
                    <div className="px-3 py-6 text-center text-xs text-slate-400">
                      연결된 디바이스 정보가 없습니다.
                    </div>
                  )}
                  {sessionDevices.map((device, idx) => (
                    <button
                      key={`${device.mac}-${idx}`}
                      type="button"
                      onClick={() => {
                        setSelectedDeviceIdx(idx);
                        setDeviceExpanded(false);
                      }}
                      className={`w-full px-3 py-3 text-left ${
                        selectedDeviceIdx === idx ? "bg-slate-100" : "bg-white hover:bg-slate-100"
                      }`}
                    >
                      <div className="flex min-w-0 items-center gap-2">
                        <span
                          className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                            device.online
                              ? "bg-emerald-500 shadow-[0_0_0_2px_rgba(16,185,129,0.2)]"
                              : "bg-slate-400"
                          }`}
                        />
                        <p className="truncate text-[13px] font-semibold text-slate-800">{device.mac || "-"}</p>
                      </div>
                      <p className="mt-0.5 truncate pl-4 text-[12px] font-medium text-slate-500">{device.ip || "-"}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export default TopSidebar;

