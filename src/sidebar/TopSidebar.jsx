import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useLocation } from "react-router-dom";

const DEVICES_STORAGE_KEY = "iot.connectedDevices";
const SELECTED_DEVICE_KEY = "iot.selectedDeviceId";

function parseDevices(raw) {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function normalizeDevices(devices) {
  return devices.map((device) => ({
    ...device,
    name: device?.name === "Device-A" ? "Device" : device?.name || "Device",
  }));
}

function loadDevices() {
  const sessionDevices = normalizeDevices(parseDevices(sessionStorage.getItem(DEVICES_STORAGE_KEY)));
  if (sessionDevices.length > 0) return sessionDevices;
  return normalizeDevices(parseDevices(localStorage.getItem(DEVICES_STORAGE_KEY)));
}

function persistDevices(devices) {
  const serialized = JSON.stringify(devices);
  localStorage.setItem(DEVICES_STORAGE_KEY, serialized);
  sessionStorage.setItem(DEVICES_STORAGE_KEY, serialized);
}

function loadSelectedId() {
  return sessionStorage.getItem(SELECTED_DEVICE_KEY) || localStorage.getItem(SELECTED_DEVICE_KEY) || "";
}

function persistSelectedId(deviceId) {
  localStorage.setItem(SELECTED_DEVICE_KEY, deviceId);
  sessionStorage.setItem(SELECTED_DEVICE_KEY, deviceId);
}

function TopSidebar() {
  const location = useLocation();
  const hidePaths = ["/", "/signup"];
  const shouldHide = hidePaths.includes(location.pathname);
  const [expanded, setExpanded] = useState(false);
  const [infoDeviceId, setInfoDeviceId] = useState("");
  const [contextMenu, setContextMenu] = useState(null);
  const [showInfoPanel, setShowInfoPanel] = useState(false);
  const [now, setNow] = useState(() => new Date());
  const [devices, setDevices] = useState(() => {
    const loaded = loadDevices();
    if (loaded.length > 0) return loaded;
    const fallback = [
      {
        id: "device-sample-1",
        name: "Device",
        mac: "00:00:00:00:00:00",
        ip: "0.0.0.0",
        online: false,
      },
    ];
    persistDevices(fallback);
    return fallback;
  });
  const [selectedDeviceId, setSelectedDeviceId] = useState(() => loadSelectedId());

  useEffect(() => {
    persistDevices(devices);
  }, [devices]);

  useEffect(() => {
    if (!selectedDeviceId && devices.length > 0) {
      setSelectedDeviceId(devices[0].id);
      return;
    }
    if (selectedDeviceId && !devices.some((device) => device.id === selectedDeviceId)) {
      setSelectedDeviceId(devices[0]?.id ?? "");
    }
  }, [devices, selectedDeviceId]);

  useEffect(() => {
    persistSelectedId(selectedDeviceId);
  }, [selectedDeviceId]);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const closeMenu = () => setContextMenu(null);
    window.addEventListener("click", closeMenu);
    return () => window.removeEventListener("click", closeMenu);
  }, []);

  useEffect(() => {
    // 다른 화면/소스에서 연결 이벤트를 발생시키면 저장 목록 갱신
    // window.dispatchEvent(new CustomEvent("iot-device-connected", { detail: { name, mac, ip, online } }))
    const onDeviceConnected = (event) => {
      const detail = event?.detail ?? {};
      if (!detail.name || !detail.mac || !detail.ip) return;
      setDevices((prev) => {
        const existing = prev.find((d) => d.mac === detail.mac);
        if (existing) {
          return prev.map((d) =>
            d.mac === detail.mac
              ? { ...d, name: detail.name, ip: detail.ip, online: detail.online !== false }
              : d,
          );
        }
        return [
          ...prev,
          {
            id: crypto.randomUUID(),
            name: detail.name,
            mac: detail.mac,
            ip: detail.ip,
            online: detail.online !== false,
          },
        ];
      });
    };

    window.addEventListener("iot-device-connected", onDeviceConnected);
    return () => window.removeEventListener("iot-device-connected", onDeviceConnected);
  }, []);

  const selectedDevice = useMemo(
    () => devices.find((device) => device.id === selectedDeviceId) || devices[0] || null,
    [devices, selectedDeviceId],
  );
  const infoDevice = useMemo(
    () => devices.find((device) => device.id === infoDeviceId) || null,
    [devices, infoDeviceId],
  );
  const nowText = useMemo(() => {
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hour = String(now.getHours()).padStart(2, "0");
    const minute = String(now.getMinutes()).padStart(2, "0");
    const second = String(now.getSeconds()).padStart(2, "0");
    return `${year}년 ${month}월 ${day}일 ${hour}시 ${minute}분 ${second}초`;
  }, [now]);

  if (shouldHide) return null;

  return (
    <motion.header
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 160, damping: 18 }}
      className="relative flex h-20 items-center justify-between border-b border-slate-200 bg-white px-4 tracking-[-0.02em] leading-relaxed"
    >
      <div className="w-[120px]" />

      <h1 className="pointer-events-none absolute left-1/2 -translate-x-1/2 text-3xl font-extrabold tracking-wide text-slate-800">
        Iot Monitoring
      </h1>

      <div className="absolute right-[238px] top-1/2 z-20 -translate-y-1/2">
        {selectedDevice && (
          <div className="flex flex-col items-start">
            <motion.button
              type="button"
              onClick={() => setExpanded((prev) => !prev)}
              onContextMenu={(event) => {
                event.preventDefault();
                setContextMenu({ x: event.clientX, y: event.clientY, deviceId: selectedDevice.id });
              }}
              className="flex h-8 w-fit max-w-[130px] items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50"
              title="기기 목록 열기"
              whileHover={{ scale: 1.02 }}
              whileFocus={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
            >
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  selectedDevice.online ? "bg-emerald-500 shadow-[0_0_0_2px_rgba(16,185,129,0.2)]" : "bg-slate-300"
                }`}
              />
              <span className="truncate">{selectedDevice.name}</span>
            </motion.button>
            <p className="mt-1 text-[11px] font-normal text-slate-500 tracking-[-0.02em] leading-relaxed">
              {nowText}
            </p>
          </div>
        )}

        {expanded && (
          <div className="absolute right-0 top-12 z-40 w-[320px] rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
            <div className="max-h-64 space-y-2 overflow-y-auto">
              {devices.map((device) => (
                <motion.button
                  key={device.id}
                  type="button"
                  onClick={() => {
                    setSelectedDeviceId(device.id);
                    setExpanded(false);
                  }}
                  onContextMenu={(event) => {
                    event.preventDefault();
                    setContextMenu({ x: event.clientX, y: event.clientY, deviceId: device.id });
                  }}
                  className={`flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-left text-xs font-semibold ${
                    selectedDeviceId === device.id
                      ? "border-slate-400 bg-slate-100 text-slate-800"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 240, damping: 20 }}
                >
                  <span
                    className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                      device.online ? "bg-emerald-500 shadow-[0_0_0_2px_rgba(16,185,129,0.2)]" : "bg-slate-300"
                    }`}
                  />
                  <span className="truncate">{device.name}</span>
                </motion.button>
              ))}
            </div>
          </div>
        )}
      </div>

      {contextMenu && (
        <div
          className="fixed z-50 rounded-lg border border-slate-200 bg-white p-1 shadow-lg"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(event) => event.stopPropagation()}
        >
          <button
            type="button"
            className="rounded-md px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
            onClick={() => {
              setInfoDeviceId(contextMenu.deviceId);
              setShowInfoPanel(true);
              setContextMenu(null);
              setExpanded(true);
            }}
          >
            연결정보
          </button>
        </div>
      )}

      {showInfoPanel && infoDevice && (
        <div className="absolute right-4 top-20 z-50 w-[320px] rounded-xl border border-slate-200 bg-white p-3 shadow-xl">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-slate-800">연결정보</p>
            <button
              type="button"
              className="h-6 w-6 rounded border border-slate-300 text-xs font-bold text-slate-600 hover:bg-slate-100"
              onClick={() => setShowInfoPanel(false)}
              aria-label="닫기"
            >
              X
            </button>
          </div>
          <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 p-2 text-[11px] text-slate-600">
            <p className="font-semibold text-slate-700">{infoDevice.name}</p>
            <p className="mt-1">MAC: {infoDevice.mac}</p>
            <p>IP: {infoDevice.ip}</p>
          </div>
        </div>
      )}
    </motion.header>
  );
}

export default TopSidebar;

