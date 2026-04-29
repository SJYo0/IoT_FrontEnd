import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../Auth/api";
import Paho from "paho-mqtt";

const TELEMETRY_ONLINE_MS = 30000;

function normalizeMac(value) {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-F0-9]/g, "");
}

function formatMac(normalizedMac) {
  if (!normalizedMac || normalizedMac.length !== 12) return "";
  return normalizedMac.match(/.{1,2}/g)?.join(":") ?? "";
}

function isDummyMac(value) {
  const normalized = normalizeMac(value);
  return !normalized || normalized === "000000000000";
}

function isDummyIp(value) {
  const ip = String(value || "").trim();
  return !ip || ip === "0.0.0.0";
}

function DeviceConnectionInfoPage() {
  const [knownDevices, setKnownDevices] = useState([]);
  const [serverOnlineMacs, setServerOnlineMacs] = useState([]);
  const [lastSeenByMac, setLastSeenByMac] = useState({});
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const fetchKnownDevices = async () => {
      try {
        const [onlineRes, pendingRes] = await Promise.all([
          apiFetch("/devices/online"),
          apiFetch("/devices/pending"),
        ]);

        if (!onlineRes.ok || !pendingRes.ok) {
          throw new Error("연결 정보를 불러오지 못했습니다.");
        }

        const [onlinePayload, pendingPayload] = await Promise.all([onlineRes.json(), pendingRes.json()]);
        const merged = [...(Array.isArray(onlinePayload) ? onlinePayload : []), ...(Array.isArray(pendingPayload) ? pendingPayload : [])];
        const onlineMacList = (Array.isArray(onlinePayload) ? onlinePayload : [])
          .map((device) => normalizeMac(device?.macId))
          .filter(Boolean);
        const uniqueByMac = new Map();
        merged.forEach((device) => {
          const key = normalizeMac(device?.macId);
          if (key) {
            uniqueByMac.set(key, device);
          }
        });

        if (!active) return;
        setKnownDevices(Array.from(uniqueByMac.values()));
        setServerOnlineMacs(onlineMacList);
        setError("");
      } catch {
        if (!active) return;
        setKnownDevices([]);
        setServerOnlineMacs([]);
        setError("연결 정보를 불러오지 못했습니다.");
      }
    };

    fetchKnownDevices();
    const intervalId = window.setInterval(fetchKnownDevices, 10000);

    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    const brokerHost = "vegetables-polyester-chair-mission.trycloudflare.com";
    const brokerPort = 443;
    const clientId = "react_conn_" + Math.random().toString(16).slice(2, 10);
    const topic = "gateway/+/telemetry";
    const client = new Paho.Client(brokerHost, brokerPort, clientId);

    client.onMessageArrived = (message) => {
      const parts = String(message.destinationName || "").split("/");
      if (parts.length !== 3) return;
      if (parts[0] !== "gateway" || parts[2] !== "telemetry") return;

      const normalizedMac = normalizeMac(parts[1]);
      if (!normalizedMac) return;

      setLastSeenByMac((prev) => ({
        ...prev,
        [normalizedMac]: Date.now(),
      }));
    };

    client.connect({
      timeout: 3,
      useSSL: true,
      onSuccess: () => client.subscribe(topic),
      onFailure: () => {},
    });

    return () => {
      if (client.isConnected()) {
        client.disconnect();
      }
    };
  }, []);

  const rows = useMemo(() => {
    const deviceByMac = new Map();
    knownDevices.forEach((device) => {
      deviceByMac.set(normalizeMac(device?.macId), device);
    });

    const macKeys = new Set([...Object.keys(lastSeenByMac), ...serverOnlineMacs]);
    const now = Date.now();
    return Array.from(macKeys)
      .map((normalizedMac) => {
        const device = deviceByMac.get(normalizedMac);
        const lastSeen = lastSeenByMac[normalizedMac];
        const fromTelemetry = typeof lastSeen === "number" && now - lastSeen <= TELEMETRY_ONLINE_MS;
        const fromServer = serverOnlineMacs.includes(normalizedMac);
        const isOnline = fromTelemetry || fromServer;
        const displayMac = isDummyMac(device?.macId)
          ? formatMac(normalizedMac) || "미확인"
          : String(device.macId);
        const displayIp = isDummyIp(device?.ipAddress) ? "미확인" : String(device.ipAddress);

        return {
          id: device?.id ?? normalizedMac,
          isOnline,
          name: device?.name || "이름 미설정",
          macId: displayMac,
          ipAddress: displayIp,
        };
      })
      .sort((a, b) => Number(b.isOnline) - Number(a.isOnline));
  }, [knownDevices, lastSeenByMac, serverOnlineMacs]);

  return (
    <div className="h-full bg-slate-100 p-6">
      <div className="mx-auto max-w-6xl rounded-[24px] border border-slate-200/70 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.06),0_14px_34px_rgba(15,23,42,0.06)]">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-black tracking-[-0.02em] text-slate-800">디바이스 연결정보</h2>
          <p className="text-sm font-semibold text-slate-500">{rows.filter((row) => row.isOnline).length}대 ONLINE</p>
        </div>

        {error && (
          <p className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-600">
            {error}
          </p>
        )}

        <div className="overflow-hidden rounded-xl border border-slate-200">
          <div className="grid grid-cols-[80px_1fr_1.2fr_1fr] bg-slate-100 px-4 py-3 text-xs font-bold text-slate-600">
            <p>상태</p>
            <p>디바이스명</p>
            <p>MAC 주소</p>
            <p>IP 주소</p>
          </div>

          {rows.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm font-semibold text-slate-500">
              아직 텔레메트리 수신 이력이 없습니다.
            </p>
          ) : (
            <div className="max-h-[460px] overflow-y-auto">
              {rows.map((device) => (
                <div
                  key={device.id}
                  className="grid grid-cols-[80px_1fr_1.2fr_1fr] items-center border-t border-slate-100 px-4 py-3 text-sm text-slate-700"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${
                        device.isOnline
                          ? "bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.15)]"
                          : "bg-slate-300"
                      }`}
                    />
                    <span className={`text-xs font-bold ${device.isOnline ? "text-emerald-700" : "text-slate-500"}`}>
                      {device.isOnline ? "ONLINE" : "IDLE"}
                    </span>
                  </div>
                  <p className="truncate font-semibold">{device.name || "이름 미설정"}</p>
                  <p className="truncate font-mono text-xs">{device.macId || "-"}</p>
                  <p className="truncate font-semibold">{device.ipAddress || "-"}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DeviceConnectionInfoPage;
