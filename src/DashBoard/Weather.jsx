import { AlertTriangle, CloudSun, Frown, MapPin, Meh, Smile, Maximize2, Thermometer, Droplets, Lightbulb, RotateCcw } from "lucide-react";
import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../Auth/api";

// 💡 1. MQTT 라이브러리 임포트
import Paho from "paho-mqtt";

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
const normalizeMac = (value) => String(value || "").trim().toUpperCase();

function apiNumber(value) {
  if (value == null || value === "") return null;
  const n = Number(value);
  return Number.isNaN(n) ? null : n;
}

function formatDashNumber(value, fractionDigits) {
  if (value == null) return "-";
  if (fractionDigits != null) return Number(value).toFixed(fractionDigits);
  return String(value);
}

function polar(cx, cy, r, angleDeg) {
  const rad = (angleDeg * Math.PI) / 180;
  return [cx + r * Math.cos(rad), cy - r * Math.sin(rad)];
}

function arcPath(cx, cy, r, startAngle, endAngle) {
  const [x1, y1] = polar(cx, cy, r, startAngle);
  const [x2, y2] = polar(cx, cy, r, endAngle);
  const large = Math.abs(endAngle - startAngle) > 180 ? 1 : 0;
  return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`;
}

const GAUGE_SEGMENTS = [
  { from: 180, to: 144, color: "#ef4444" },
  { from: 144, to: 108, color: "#f97316" },
  { from: 108, to: 72, color: "#eab308" },
  { from: 72, to: 36, color: "#22c55e" },
  { from: 36, to: 0, color: "#3b82f6" },
];

const pageStagger = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.05 },
  },
};

const riseIn = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 140, damping: 18 },
  },
};

const cardShadow = "shadow-[0_1px_2px_rgba(15,23,42,0.06),0_14px_34px_rgba(15,23,42,0.06)]";
const cardHover = "hover:shadow-[0_2px_4px_rgba(15,23,42,0.08),0_18px_40px_rgba(15,23,42,0.10)]";

function SemiGaugeCard({ title, value, unit, min, max, sublabel, alertSeverity, alertMessage }) {
  const missing = value == null;
  const percent = missing ? 0 : clamp(((value - min) / (max - min)) * 100, 0, 100);
  const needleAngle = 180 - (percent / 100) * 180;
  const hasAlert = alertSeverity === "WARNING" || alertSeverity === "CRITICAL";
  const alertClass =
    alertSeverity === "CRITICAL"
      ? "border-rose-300 bg-rose-50/70"
      : alertSeverity === "WARNING"
        ? "border-amber-300 bg-amber-50/70"
        : "border-slate-200/70 bg-white/95";
  const cx = 84;
  const cy = 66;
  const rOuter = 54;
  const rInner = 38;
  const needleLength = rInner - 8;

  const [nx, ny] = polar(cx, cy, rInner - 8, needleAngle);

  return (
    <motion.div
      variants={riseIn}
      whileHover={{ scale: 1.02, y: -2 }}
      transition={{ type: "spring", stiffness: 220, damping: 20 }}
      className={`flex h-full min-h-[152px] w-full min-w-0 flex-col rounded-[24px] border p-4 ${alertClass} ${cardShadow} ${cardHover}`}
    >
      <p className="text-base font-extrabold text-slate-800 tracking-[-0.02em] leading-relaxed">{title}</p>
      {hasAlert && (
        <p
          className={`mt-1 rounded-md px-2 py-1 text-[11px] font-semibold ${
            alertSeverity === "CRITICAL" ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700"
          }`}
        >
          {alertMessage || (alertSeverity === "CRITICAL" ? "위험 경보 발생" : "주의 경보 발생")}
        </p>
      )}
      <div className="mt-2 flex min-h-0 flex-1 items-center justify-between gap-3">
        <div className="flex flex-col justify-center">
          <p className="text-sm font-normal text-slate-500 tracking-[-0.02em] leading-relaxed">점수</p>
          <p className="text-[24px] font-black leading-tight text-slate-800 tracking-[-0.02em]">
            {missing ? (
              "-"
            ) : (
              <>
                {typeof value === "number" && !Number.isInteger(value) ? value.toFixed(1) : value}
                <span className="ml-1 text-sm 2xl:text-xl font-bold opacity-70">{unit}</span>
              </>
            )}
          </p>
          {!missing && sublabel && (
            <p className="mt-1 text-sm font-normal text-slate-500 tracking-[-0.02em] leading-relaxed">
              {sublabel}
            </p>
          )}
        </div>
        <div className="relative h-[86px] w-[132px] shrink-0">
          <svg className="h-full w-full overflow-visible" viewBox="0 0 168 88">
            {GAUGE_SEGMENTS.map((seg) => (
              <path key={`${seg.from}-${seg.to}`} d={arcPath(cx, cy, rOuter, seg.from, seg.to)} fill="none" stroke={seg.color} strokeWidth="12" strokeLinecap="butt" className={missing ? "opacity-30" : ""} />
            ))}
            {!missing && (
              <line
                x1={cx} y1={cy} x2={cx - needleLength} y2={cy}
                stroke="#334155" strokeWidth="3" strokeLinecap="round"
                style={{
                  transform: `rotate(${percent * 1.8}deg)`,
                  transformOrigin: `${cx}px ${cy}px`,
                  transition: "transform 1.2s cubic-bezier(0.34, 1.56, 0.64, 1)" 
                }}
              />
            )}
            <circle cx={cx} cy={cy} r="6" fill="#fff" stroke="#334155" strokeWidth="2" />
            <text x={cx} y={cy + 26} textAnchor="middle" className="fill-slate-600 text-[13px] 2xl:text-[16px] font-bold">{missing ? "-" : `${Math.round(percent)}%`}</text>
          </svg>
        </div>
      </div>
    </motion.div>
  );
}

function scoreLabelFromValue(score) {
  if (score == null) return "-";
  if (score >= 80) return "좋음";
  if (score >= 60) return "보통";
  if (score >= 40) return "나쁨";
  return "매우나쁨";
}

function windDirectionInfo(degree) {
  if (degree == null) {
    return { label: "-", short: "-", angle: 0 };
  }
  const normalized = ((degree % 360) + 360) % 360;
  const labels = [
    { label: "북풍", short: "N" },
    { label: "북동풍", short: "NE" },
    { label: "동풍", short: "E" },
    { label: "남동풍", short: "SE" },
    { label: "남풍", short: "S" },
    { label: "남서풍", short: "SW" },
    { label: "서풍", short: "W" },
    { label: "북서풍", short: "NW" },
  ];
  const index = Math.round(normalized / 45) % 8;
  return { ...labels[index], angle: normalized };
}

function CompassRose({ angle, sizeClass = "h-28 w-28" }) {
  return (
    <svg viewBox="0 0 120 120" className={sizeClass}>
      <circle cx="60" cy="60" r="54" fill="#0b1220" stroke="#1e3a5f" strokeWidth="3" />
      <circle cx="60" cy="60" r="42" fill="none" stroke="#1e3a5f" strokeWidth="1.5" />
      <circle cx="60" cy="60" r="30" fill="none" stroke="#1e3a5f" strokeWidth="1.2" />

      {[...Array(36)].map((_, i) => {
        const deg = i * 10;
        const isMajor = deg % 30 === 0;
        const r1 = isMajor ? 44 : 48;
        const r2 = 52;
        return (
          <line
            key={deg}
            x1={60 + r1 * Math.cos((deg * Math.PI) / 180)}
            y1={60 + r1 * Math.sin((deg * Math.PI) / 180)}
            x2={60 + r2 * Math.cos((deg * Math.PI) / 180)}
            y2={60 + r2 * Math.sin((deg * Math.PI) / 180)}
            stroke="#2d4f73"
            strokeWidth={isMajor ? 1.4 : 0.8}
          />
        );
      })}

      <text x="60" y="16" textAnchor="middle" fill="#e2e8f0" fontSize="10" fontWeight="700">
        N
      </text>
      <text x="104" y="64" textAnchor="middle" fill="#94a3b8" fontSize="9" fontWeight="700">
        E
      </text>
      <text x="60" y="112" textAnchor="middle" fill="#94a3b8" fontSize="9" fontWeight="700">
        S
      </text>
      <text x="16" y="64" textAnchor="middle" fill="#94a3b8" fontSize="9" fontWeight="700">
        W
      </text>

      <g style={{ transform: `rotate(${angle}deg)`, transformOrigin: "60px 60px", transition: "transform 0.35s ease" }}>
        <polygon points="60,19 56,60 64,60" fill="#ef4444" />
        <polygon points="60,101 56,60 64,60" fill="#3b82f6" />
      </g>
      <circle cx="60" cy="60" r="4" fill="#e2e8f0" />
    </svg>
  );
}

function normalizeAnalysisStatus(statusValue) {
  if (!statusValue) return { severity: "", score: null };

  if (typeof statusValue === "object") {
    const severity = statusValue?.severity ? String(statusValue.severity).trim().toUpperCase() : "";
    const scoreNum = Number(statusValue?.score);
    const score = Number.isFinite(scoreNum) ? scoreNum : null;
    return { severity, score };
  }

  const text = String(statusValue).trim();
  const upper = text.toUpperCase();
  const withScore = upper.match(/^([A-Z_]+)\s*\((\d+)\)$/);
  if (withScore) {
    return {
      severity: withScore[1],
      score: Number(withScore[2]),
    };
  }
  return { severity: upper, score: null };
}

function labelFromAnalysisSeverity(severityValue) {
  const severity = String(severityValue || "").trim().toUpperCase();
  if (!severity) return "";
  if (["NORMAL", "GOOD", "SAFE", "LOW", "OK"].includes(severity)) return "좋음";
  if (["INFO", "NOTICE", "MODERATE", "MEDIUM"].includes(severity)) return "보통";
  if (["WARNING", "CAUTION", "BAD"].includes(severity)) return "나쁨";
  if (["CRITICAL", "DANGER", "SEVERE", "VERY_BAD"].includes(severity)) return "매우나쁨";
  return "";
}

function normalizeAnalysisSummary(summaryValue) {
  if (!summaryValue) return "";
  if (typeof summaryValue === "string") return summaryValue;
  if (typeof summaryValue === "object") {
    const lines = []
      .concat(Array.isArray(summaryValue.comment) ? summaryValue.comment : [])
      .concat(Array.isArray(summaryValue.control_sum) ? summaryValue.control_sum : [])
      .concat(Array.isArray(summaryValue.todo) ? summaryValue.todo : []);
    if (lines.length > 0) {
      return lines.join("\n");
    }
  }
  return String(summaryValue);
}

function toThreeLines(source, fallbackLine) {
  const cleaned = source
    .map((line) => String(line || "").replace(/^[-*•]\s*/, "").trim())
    .filter(Boolean)
    .slice(0, 3);
  while (cleaned.length < 3) {
    cleaned.push(fallbackLine);
  }
  return cleaned;
}

function parseAnalysisSections(summaryValue) {
  if (summaryValue && typeof summaryValue === "object") {
    const comments = Array.isArray(summaryValue.comment) ? summaryValue.comment : [];
    const controls = Array.isArray(summaryValue.control_sum) ? summaryValue.control_sum : [];
    const todos = Array.isArray(summaryValue.todo) ? summaryValue.todo : [];

    return {
      overviewLines: toThreeLines(comments, "종합 분석 결과 대기 중"),
      controlLines: toThreeLines(controls, "AI 제어 결과 대기 중"),
      guideLines: toThreeLines(todos, "권장 행동 지침 대기 중"),
    };
  }

  const lines = normalizeAnalysisSummary(summaryValue)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  return {
    overviewLines: toThreeLines(lines.slice(0, 3), "종합 분석 결과 대기 중"),
    controlLines: toThreeLines(lines.slice(3, 6), "AI 제어 결과 대기 중"),
    guideLines: toThreeLines(lines.slice(6, 9), "권장 행동 지침 대기 중"),
  };
}

function Weather() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  const [latestTelemetry, setLatestTelemetry] = useState(null);
  const [telemetryByMac, setTelemetryByMac] = useState({});
  const [alarmByCategory, setAlarmByCategory] = useState({});
  const [analysisByMac, setAnalysisByMac] = useState({});
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [activeMac, setActiveMac] = useState("");
  const activeMacRef = useRef("");
  const dispatchedAlertKeysRef = useRef(new Set());

  // 💡 [추가] CCTV 소스 주소를 관리할 state (초기값은 빈 문자열)
  const [cctvSrc, setCctvSrc] = useState("");

  const navigate = useNavigate();
  
  // 💡 CCTV 전체화면을 위한 ref 생성   
  const cctvContainerRef = useRef(null);

  const MEDIAMTX_IP = import.meta.env.VITE_MEDIAMTX_IP;

  const weather = useMemo(
    () => (Array.isArray(data?.weather) ? data.weather : []),
    [data],
  );

  const hasMqttIndoorData = useMemo(() => {
    const source = activeMac ? telemetryByMac[activeMac] ?? null : latestTelemetry;
    if (!source) return false;
    return [source.temperature, source.humidity, source.pressure, source.tvoc, source.eco2, source.flameValue].some(
      (v) => v != null,
    );
  }, [activeMac, latestTelemetry, telemetryByMac]);

  const fetchLatestAnalysis = useCallback(
    async (mac) => {
      const params = new URLSearchParams();
      if (mac) params.set("mac", mac);
      const query = params.toString();
      const response = await apiFetch(`/api/ai/latest${query ? `?${query}` : ""}`);
      if (!response.ok) {
        throw new Error("latest-failed");
      }
      const payload = await response.json();
      const targetMac = normalizeMac(payload?.macAddress || mac || "");
      if (!targetMac) return;
      const analysis = {
        status: normalizeAnalysisStatus(payload?.status),
        summary: normalizeAnalysisSummary(payload?.summary),
        timestamp: payload?.createdAt ? new Date(payload.createdAt).getTime() : Date.now(),
      };
      setAnalysisByMac((prev) => ({
        ...prev,
        [targetMac]: analysis,
      }));
    },
    [],
  );

  const handleAnalysisRefresh = useCallback(async () => {
    if (!activeMac) return;
    try {
      setAnalysisLoading(true);
      // 1) DB 저장된 최신 결과를 즉시 하단 박스에 표시
      await fetchLatestAnalysis(activeMac);
      // 2) 동시에 최신 비정상/최근 센서값 기준 재분석을 백엔드에 요청
      await apiFetch(`/api/ai/reanalyze?mac=${encodeURIComponent(activeMac)}`, { method: "POST" });
    } catch (e) {
      console.error("AI 새로고침 실패:", e);
    } finally {
      setAnalysisLoading(false);
    }
  }, [activeMac, fetchLatestAnalysis]);

  // 전체화면 토글 함수
  const handleFullscreen = () => {
    const elem = cctvContainerRef.current;
    if (!elem) return;

    if (!document.fullscreenElement) {
      if (elem.requestFullscreen) {
        elem.requestFullscreen();
      } else if (elem.webkitRequestFullscreen) { /* Safari */
        elem.webkitRequestFullscreen();
      } else if (elem.msRequestFullscreen) { /* IE11 */
        elem.msRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  // 💡 [추가] 대시보드 렌더링이 끝난 후 CCTV 연결 시작 (블로킹 방지)
  useEffect(() => {
    if (data) {
      const timer = setTimeout(() => {
        setCctvSrc(`http://${MEDIAMTX_IP}:8889/cam`);
      }, 500); // 0.5초 뒤에 렌더링
      return () => clearTimeout(timer);
    }
  }, [data, MEDIAMTX_IP]);

  useEffect(() => {
    activeMacRef.current = activeMac;
  }, [activeMac]);

  useEffect(() => {
    const savedMac =
      sessionStorage.getItem("iot.selectedDeviceMac") ||
      localStorage.getItem("iot.selectedDeviceMac") ||
      "";
    if (savedMac) {
      setActiveMac(normalizeMac(savedMac));
    }

    const onDeviceSelected = (event) => {
      const selectedMac = normalizeMac(event?.detail?.mac || "");
      setActiveMac(selectedMac);
    };

    window.addEventListener("iot-device-selected", onDeviceSelected);
    return () => window.removeEventListener("iot-device-selected", onDeviceSelected);
  }, []);

  useEffect(() => {
    if (!activeMac) return;
    fetchLatestAnalysis(activeMac).catch(() => {});
  }, [activeMac, fetchLatestAnalysis]);


  useEffect(() => {
    const brokerHost = import.meta.env.VITE_MQTT_BROKER;
    const brokerPort = 9001;
    const clientId = "react_client_" + Math.random().toString(16).substr(2, 8);
    const targetTopic = "gateway/+/telemetry";
    const targetTopic2 = "webbackend/alarm/+";
    const targetTopic3 = "webbackend/analysis/+";

    const client = new Paho.Client(brokerHost, brokerPort, clientId);

    client.onMessageArrived = (message) => {
      try {
        const topic = message.destinationName;
        const payload = JSON.parse(message.payloadString);
        if(topic.includes("telemetry")) {
          const topicParts = String(topic).split("/");
          const macFromTopic = topicParts.length === 3 ? normalizeMac(topicParts[1]) : "";
          const telemetry = {
            ...payload,
            _macFromTopic: macFromTopic,
          };
          setLatestTelemetry(telemetry);
          if (macFromTopic) {
            setTelemetryByMac((prev) => ({
              ...prev,
              [macFromTopic]: telemetry,
            }));
          }
          if (macFromTopic && !activeMacRef.current) {
            setActiveMac(macFromTopic);
          }
        }
        else if(topic.includes("alarm")) {
          const topicParts = String(topic).split("/");
          const alarmMac = topicParts.length === 3 ? normalizeMac(topicParts[2]) : "";
          if (activeMacRef.current && alarmMac && alarmMac !== activeMacRef.current) {
            return;
          }
          if (payload?.category) {
            setAlarmByCategory((prev) => ({
              ...prev,
              [payload.category]: {
                severity: payload?.severity ?? "NORMAL",
                message: payload?.message ?? "",
                timestamp: payload?.timestamp ?? Date.now(),
              },
            }));
          }
        }
        else if(topic.includes("analysis")) {
          const topicParts = String(topic).split("/");
          const analysisMac = topicParts.length === 3 ? normalizeMac(topicParts[2]) : "";
          if (!analysisMac) {
            return;
          }
          const analysis = {
            status: normalizeAnalysisStatus(payload?.status),
            summary: normalizeAnalysisSummary(payload?.summary),
            timestamp: Date.now(),
          };
          setAnalysisByMac((prev) => ({
            ...prev,
            [analysisMac]: analysis,
          }));
          if (!activeMacRef.current) {
            setActiveMac(analysisMac);
          }
          if (activeMacRef.current && analysisMac !== activeMacRef.current) {
            return;
          }
          window.dispatchEvent(
            new CustomEvent("iot-analysis-updated", {
              detail: {
                mac: analysisMac,
                ...analysis,
              },
            }),
          );
        }
      } catch (e) {
        console.error("MQTT 파싱 에러:", e);
      }
    };

    client.connect({
      timeout: 3,
      useSSL: window.location.protocol === "https:",
      onSuccess: () => {
        client.subscribe(targetTopic);
        client.subscribe(targetTopic2);
        client.subscribe(targetTopic3);
      },
      onFailure: (err) => console.error("MQTT 연결 실패:", err.errorMessage)
    });

    return () => {
      if (client.isConnected()) client.disconnect();
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const loadDashboard = async (retry = 0) => {
      try {
        const res = await apiFetch("/api/dashboard");
        if (!res.ok) {
          if (res.status === 401) {
            const meRes = await apiFetch("/api/auth/me").catch(() => null);
            if (meRes?.ok && retry < 2) {
              setTimeout(() => loadDashboard(retry + 1), 500);
              return;
            }
            navigate("/", { replace: true });
            return;
          }
          throw new Error("dashboard-fetch-failed");
        }
        const responseData = await res.json();
        if (!cancelled) {
          setData(responseData);
          setError("");
        }
      } catch {
        if (cancelled) return;
        if (retry < 2) {
          setTimeout(() => loadDashboard(retry + 1), 700);
          return;
        }
        setError("대시보드 정보를 불러오지 못했습니다.");
      }
    };
    loadDashboard();

      // 💡 2. [추가된 부분] 현재 진행 중인 비상 알람 상태 동기화
    if (!activeMac) {
      setAlarmByCategory({});
      return () => {
        cancelled = true;
      };
    }
    apiFetch(`/api/alerts/active/${activeMac}`)
      .then((res) => {
        if (res.ok) return res.json();
        return [];
      })
      .then((activeAlerts) => {
        // DB에서 가져온 활성 알람 리스트를 바탕으로 초기 상태 구성
        const initialAlarms = {};
        activeAlerts.forEach((alert) => {
          initialAlarms[alert.category] = {
            severity: alert.severity,
            message: alert.message,
            timestamp: new Date(alert.createdAt).getTime(),
          };
        });
        
        // 가져온 데이터로 알람 State 초기화!
        setAlarmByCategory(initialAlarms);
      })
      .catch((err) => console.error("활성 알람 로깅 실패:", err));
    return () => {
      cancelled = true;
    };
  }, [navigate, activeMac]);

  useEffect(() => {
    if (activeMac) return;
    setAlarmByCategory({});
  }, [activeMac]);

  useEffect(() => {
    const alerts = Object.entries(alarmByCategory);
    if (alerts.length === 0) return;
    alerts.forEach(([category, alert]) => {
      if (!alert || (alert.severity !== "WARNING" && alert.severity !== "CRITICAL")) return;
      const alertTime = alert.timestamp ? new Date(alert.timestamp).getTime() : Date.now();
      const dedupeKey = `${category}|${alert.severity}|${alert.message || ""}|${alertTime}`;
      if (dispatchedAlertKeysRef.current.has(dedupeKey)) {
        return;
      }
      dispatchedAlertKeysRef.current.add(dedupeKey);
      window.dispatchEvent(
        new CustomEvent("iot-alert-raised", {
          detail: {
            category,
            severity: alert.severity,
            message: alert.message || "",
            timestamp: alertTime,
          },
        }),
      );
    });
  }, [alarmByCategory]);

  if (error) {
    return (
      <div className="h-full bg-slate-100 p-6 tracking-[-0.02em] leading-relaxed">
        <div className={`mx-auto max-w-6xl rounded-[24px] border border-rose-200/70 bg-white p-6 text-rose-600 ${cardShadow}`}>
          {error}
        </div>
      </div>
    );
  }

  if (!data && !hasMqttIndoorData) {
    return (
      <div className="h-full bg-slate-100 p-6 tracking-[-0.02em] leading-relaxed">
        <div className={`mx-auto max-w-6xl rounded-[24px] border border-slate-300/70 bg-white p-6 ${cardShadow}`}>
          <div className="grid gap-4">
            <div className="h-6 w-48 animate-pulse rounded bg-slate-200" />
            <div className="h-24 w-full animate-pulse rounded-[16px] bg-slate-100" />
            <div className="grid grid-cols-2 gap-4">
              <div className="h-28 animate-pulse rounded-[16px] bg-slate-100" />
              <div className="h-28 animate-pulse rounded-[16px] bg-slate-100" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const latest = weather[0] ?? {};
  const dryWarning = Boolean(data?.dryWarning);
  const windWarning = Boolean(data?.windWarning);
  const ta = apiNumber(latest.ta);
  const hm = apiNumber(latest.hm);
  const ws = apiNumber(latest.ws);
  const wd = apiNumber(latest.wd);
  const rn = apiNumber(latest.rn);
  const weatherText = latest.wf || latest.weather || latest.wfKor || "-";
  const windInfo = windDirectionInfo(wd);

  const hasScoreInput = ta != null || hm != null || rn != null || ws != null;
  const estimatedScore = hasScoreInput ? clamp( Math.round( (ta != null ? clamp(((ta + 10) / 50) * 30, 0, 30) : 0) + (hm != null ? clamp((hm / 100) * 25, 0, 25) : 0) + (rn != null ? clamp((1 - Math.min(Math.abs(rn), 20) / 20) * 15, 0, 15) : 0) + (ws != null ? clamp((1 - ws / 15) * 15, 0, 15) : 0) + 15, ), 1, 100, ) : null;

  const indoorTelemetry = activeMac ? telemetryByMac[activeMac] ?? null : null;
  const indoorTemp = indoorTelemetry?.temperature ?? null;
  const indoorHum = indoorTelemetry?.humidity ?? null;
  const indoorPressure = indoorTelemetry?.pressure ?? null;
  const indoorTvoc = indoorTelemetry?.tvoc ?? null;
  const indoorEco2 = indoorTelemetry?.eco2 ?? null;
  const indoorFlame = indoorTelemetry?.flameValue ?? null;
  const tempAlarm = alarmByCategory?.TEMP;
  const humidityAlarm = alarmByCategory?.HUMIDITY;
  const fireAlarm = alarmByCategory?.FIRE;
  const tvocAlarm = alarmByCategory?.TVOC;
  const eco2Alarm = alarmByCategory?.ECO2;
  const activeAnalysis = (() => {
    if (!activeMac) return null;
    if (activeMac && analysisByMac[activeMac]) {
      return analysisByMac[activeMac];
    }
    const analyses = Object.values(analysisByMac);
    if (analyses.length === 0) return null;
    return analyses.reduce((latest, current) => {
      if (!latest) return current;
      const latestTs = Number(latest?.timestamp || 0);
      const currentTs = Number(current?.timestamp || 0);
      return currentTs > latestTs ? current : latest;
    }, null);
  })();
  const aiScoreRaw = activeAnalysis?.status?.score;
  const aiScore = Number.isFinite(Number(aiScoreRaw)) ? clamp(Math.round(Number(aiScoreRaw)), 1, 100) : null;
  const aiSeverityLabel = labelFromAnalysisSeverity(activeAnalysis?.status?.severity);
  const dashboardScore = aiScore != null ? aiScore : estimatedScore;
  const mainLabel = activeMac ? aiSeverityLabel || scoreLabelFromValue(dashboardScore) : "-";
  const analysisView = parseAnalysisSections(activeAnalysis?.summary ?? "");
  const overviewLines = !activeMac
    ? ["선택된 기기가 없습니다."]
    : activeAnalysis
      ? analysisView.overviewLines
      : ["분석 결과 수신 전입니다."];
  const controlLines = !activeMac
    ? ["선택된 기기가 없습니다."]
    : activeAnalysis
      ? analysisView.controlLines
      : ["AI 제어 분석 대기 중입니다."];
  const guideLines = !activeMac
    ? ["선택된 기기가 없습니다."]
    : activeAnalysis
      ? analysisView.guideLines
      : ["권장 행동 지침 대기 중입니다."];

  const metrics = [
    {
      title: "실내 온도",
      value: indoorTemp,
      unit: "°C",
      min: -10,
      max: 40,
      sublabel: indoorTemp == null ? undefined : indoorTemp >= 18 && indoorTemp <= 26 ? "쾌적" : indoorTemp < 18 ? "서늘함" : "더움",
      alertSeverity: tempAlarm?.severity,
      alertMessage: tempAlarm?.severity === "NORMAL" ? "" : tempAlarm?.message,
    },
    {
      title: "실내 습도",
      value: indoorHum,
      unit: "%",
      min: 0,
      max: 100,
      sublabel: indoorHum == null ? undefined : indoorHum < 30 ? "건조" : indoorHum > 60 ? "다습" : "쾌적",
      alertSeverity: humidityAlarm?.severity,
      alertMessage: humidityAlarm?.severity === "NORMAL" ? "" : humidityAlarm?.message,
    },
    {
      title: "실내 기압",
      value: indoorPressure,
      unit: "hPa",
      min: 900,
      max: 1100,
      sublabel: undefined,
    },
    {
      title: "화재 감지",
      value: indoorFlame,
      unit: "",
      min: 0,
      max: 1024,
      sublabel: indoorFlame != null && indoorFlame < 500 ? "화재 의심" : "안전",
      alertSeverity: fireAlarm?.severity,
      alertMessage: fireAlarm?.severity === "NORMAL" ? "" : fireAlarm?.message,
    },
    {
      title: "화학물질 (TVOC)",
      value: indoorTvoc,
      unit: "ppb",
      min: 0,
      max: 1000,
      sublabel: indoorTvoc != null && indoorTvoc > 500 ? "주의" : "안전",
      alertSeverity: tvocAlarm?.severity,
      alertMessage: tvocAlarm?.severity === "NORMAL" ? "" : tvocAlarm?.message,
    },
    {
      title: "이산화탄소 (eCO2)",
      value: indoorEco2,
      unit: "ppm",
      min: 400,
      max: 2000,
      sublabel: indoorEco2 != null && indoorEco2 > 1000 ? "환기 권장" : "양호",
      alertSeverity: eco2Alarm?.severity,
      alertMessage: eco2Alarm?.severity === "NORMAL" ? "" : eco2Alarm?.message,
    },
  ];

  const statusItems = [
    { label: "좋음", icon: Smile, active: mainLabel === "좋음" },
    { label: "보통", icon: Meh, active: mainLabel === "보통" },
    { label: "나쁨", icon: Frown, active: mainLabel === "나쁨" },
    { label: "매우나쁨", icon: AlertTriangle, active: mainLabel === "매우나쁨" },
  ];

  const isAnyCritical = Object.values(alarmByCategory).some(a => a.severity === "CRITICAL");
  const isAnyWarning = Object.values(alarmByCategory).some(a => a.severity === "WARNING");

  return (
    <div
      className="h-full overflow-x-auto p-4 tracking-[-0.02em] leading-relaxed"
      style={{
        backgroundImage:
          "radial-gradient(circle at 20% 0%, rgba(148,163,184,0.16), transparent 36%), radial-gradient(circle at 80% 100%, rgba(100,116,139,0.14), transparent 38%), linear-gradient(180deg, #f8fafc 0%, #eef2f7 100%), repeating-linear-gradient(0deg, rgba(15,23,42,0.012) 0px, rgba(15,23,42,0.012) 1px, transparent 1px, transparent 3px)",
      }}
    >
      <motion.div
        variants={pageStagger}
        initial="hidden"
        animate="show"
        className="mx-auto grid h-full min-h-[calc(100vh-104px)] max-w-[1720px] grid-cols-[280px_minmax(0,_15fr)_minmax(0,_10fr)] grid-rows-[1fr_auto] gap-4"
      >
        {/* Left panel */}
          <motion.section
            variants={riseIn}
            whileHover={{ scale: 1.01 }}
            transition={{ type: "spring", stiffness: 180, damping: 18 }}
            className={`row-span-2 flex h-full min-h-0 flex-col overflow-hidden rounded-[24px] border border-[#aaaaaa] bg-[#b8b8b8] p-5 text-slate-800 ${cardShadow}`}
          >
          <p className="mt-2 text-center text-[20px] font-black tracking-[-0.02em]">실내환경점수</p>

          <div className="mx-auto mt-4 flex h-[188px] w-[188px] shrink-0 items-center justify-center rounded-full border-[12px] border-white shadow-inner">
            <div className="text-center px-2">
              <p className="text-xs font-semibold text-slate-700">점수</p>
              <p className="mt-1 text-5xl font-extrabold leading-none text-slate-900">
                {!activeMac || dashboardScore == null ? "-" : dashboardScore}
              </p>
              <p className="mt-2 text-2xl font-bold text-slate-800">{mainLabel}</p>
            </div>
          </div>

          <div className="mt-8 2xl:mt-16 grid grid-cols-4 gap-1 2xl:gap-3 text-center">
            {statusItems.map((item) => (
              <div key={item.label} className="flex flex-col items-center gap-1">
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-full border-2 ${
                    item.active
                      ? "border-white bg-white text-slate-700 shadow-md"
                      : "border-slate-500/40 bg-white/50 text-slate-700"
                  }`}
                >
                  <item.icon className="h-5 w-5" strokeWidth={item.active ? 2.5 : 2} />
                </div>
                <p className={`text-[10px] font-semibold ${item.active ? "text-slate-800" : "text-slate-700"}`}>
                  {item.label}
                </p>
              </div>
            ))}
          </div>
          </motion.section>

          {/* Middle: 6 semi gauges */}
          <motion.section
            variants={riseIn}
            className={`flex h-full min-h-0 flex-col rounded-[24px] border border-slate-200/70 bg-white/90 p-5 ${cardShadow}`}
          >
          <div
            className="grid min-h-0 flex-1 grid-cols-2 gap-4"
            style={{ gridTemplateRows: "repeat(3, minmax(0, 1fr))" }}
          >
            {metrics.map((m) => (
              <div key={m.title} className="flex h-full min-h-0 w-full">
                <SemiGaugeCard {...m} />
              </div>
            ))}
          </div>
          </motion.section>

          {/* Right */}
          <motion.section variants={riseIn} className="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)] gap-4">
            <div className={`rounded-[24px] border border-slate-200/70 bg-white/95 p-3.5 ${cardShadow}`}>
            <div className="flex items-start justify-between">
              <p className="text-[14px] font-black text-slate-800 tracking-[-0.02em]">실외 날씨정보</p>
              <div className="text-right">
                <p className="flex items-center justify-end gap-1 text-[12px] font-normal text-slate-500 tracking-[-0.02em]">
                  <MapPin className="h-3.5 w-3.5" strokeWidth={1.5} />
                  서울특별시
                </p>
              </div>
            </div>
            <div className="mt-2 flex items-center gap-3">
              <div className="grid min-h-[132px] w-full grid-cols-2 grid-rows-[auto_auto] rounded-xl border border-slate-200 bg-slate-100/40">
                <div className="flex items-start justify-start gap-3 px-3 py-3">
                  <div className="mt-3 flex items-center justify-center rounded-lg bg-slate-100/80 p-1.5">
                    <CloudSun className="h-12 w-12 shrink-0 text-slate-500" strokeWidth={1.5} />
                  </div>
                  <div className="min-w-0 flex-1 rounded-lg bg-white/80 px-2.5 py-2.5 text-slate-700">
                    <p className="mt-0.5 text-lg font-extrabold leading-none">{ta == null ? "-" : `${ta}°C`}</p>
                    <div className="mt-2 grid grid-cols-[auto_1fr] gap-x-2 gap-y-0.5 text-[11px]">
                      <p className="font-semibold text-slate-500">습도</p>
                      <p className="font-semibold">{hm == null ? "-" : `${hm}%`}</p>
                      <p className="font-semibold text-slate-500">강수</p>
                      <p className="font-semibold">{rn == null ? "-" : `${rn} mm`}</p>
                    </div>
                  </div>
                </div>

                <div className="border-l border-slate-200 bg-white/70 px-3 py-2">
                  <div className="flex h-full min-h-[92px] items-center rounded-lg border border-slate-200 bg-white px-2">
                    <div className="grid w-full grid-cols-2 items-center divide-x divide-slate-200">
                      <div className="flex items-center justify-center">
                        <CompassRose angle={windInfo.angle} sizeClass="h-12 w-12" />
                      </div>
                      <div className="flex flex-col items-center justify-center text-center">
                        <p className="text-[11px] font-semibold text-slate-500">풍향</p>
                        <p className="text-sm font-extrabold text-slate-800">{windInfo.label}</p>
                        <p className="text-[11px] text-slate-500">{wd == null ? "-" : `${wd}° (${windInfo.short})`}</p>
                        <p className="mt-0.5 text-[11px] text-slate-500">풍속 {ws == null ? "-" : `${ws} m/s`}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="col-span-2 border-t border-slate-200/80 px-3 py-1 text-center text-[11px]">
                  <p className={`font-semibold ${dryWarning ? "text-rose-600" : "text-emerald-700"}`}>
                    건조주의보 {dryWarning ? "발령" : "미발령"}
                  </p>
                  <p className={`mt-1 font-semibold ${windWarning ? "text-rose-600" : "text-emerald-700"}`}>
                    강풍주의보 {windWarning ? "발령" : "미발령"}
                  </p>
                </div>
              </div>
            </div>
            </div>

            {/* 💡 실외 날씨정보칸 아랫칸 (CCTV 영역) */}
            <motion.div
              whileHover={{ scale: 1.01 }}
              transition={{ type: "spring", stiffness: 220, damping: 20 }}
              className={`flex h-full min-h-0 flex-col overflow-hidden rounded-[24px] border border-slate-200/70 bg-white/95 p-5 ${cardShadow} ${cardHover}`}
            >
              <div className="mb-3 flex items-center justify-between">
                <p className="text-[14px] font-black text-slate-800 tracking-[-0.02em]">실시간 CCTV</p>
                
                <div className="flex items-center gap-3">
                  {/* LIVE 깜빡임 뱃지 */}
                  <div className="flex items-center gap-2 rounded-full bg-rose-50 px-2 py-0.5">
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75"></span>
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-500"></span>
                    </span>
                    <span className="text-[10px] font-bold tracking-wider text-rose-600">LIVE</span>
                  </div>
                  
                  {/* 💡 전체화면 버튼 */}
                  <button
                    onClick={handleFullscreen}
                    className="flex h-6 w-6 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 focus:outline-none"
                    title="전체화면"
                  >
                    <Maximize2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              {/* 💡 영상 플레이어 영역 */}
              <div 
                ref={cctvContainerRef} 
                className="relative min-h-0 flex-1 w-full overflow-hidden rounded-xl bg-slate-900 shadow-inner group"
              >
                {cctvSrc ? (
                  <iframe
                    src={cctvSrc}
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    scrolling="no"
                    allowFullScreen
                    title="CCTV Stream"
                    className="absolute inset-0 h-full w-full border-none object-contain bg-black"
                  ></iframe>
                ) : (
                  // 영상 연결 대기 중일 때 보여줄 로딩 화면
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black">
                    <span className="relative flex h-4 w-4 mb-3">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-slate-400 opacity-75"></span>
                      <span className="relative inline-flex h-4 w-4 rounded-full bg-slate-500"></span>
                    </span>
                    <p className="text-sm font-semibold text-slate-400 animate-pulse">CCTV 연결 중...</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.section>

          {/* 가장 아랫단 빈 박스는 그대로 유지 */}
          <motion.section variants={riseIn} className="col-start-2 col-end-4 mt-2 flex w-full">
            <motion.div
              whileHover={{ scale: 1.01, y: -2 }}
              transition={{ type: "spring", stiffness: 180, damping: 20 }}
              className={`flex w-full min-w-0 rounded-[24px] border border-slate-200/70 bg-white/95 p-4 ${cardShadow} ${cardHover}`}
            >
              <div className="relative w-full h-[214px] rounded-[18px] border border-slate-200 bg-slate-50 p-2.5 overflow-hidden">
                  <div className="absolute right-2.5 top-2.5 z-10 flex items-center justify-end">
                    <button
                      type="button"
                      onClick={handleAnalysisRefresh}
                      disabled={!activeMac || analysisLoading}
                      className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-60 hover:bg-slate-50"
                    >
                      <RotateCcw className={`h-2.5 w-2.5 ${analysisLoading ? "animate-spin" : ""}`} />
                      {analysisLoading ? "갱신 중..." : "AI 새로고침"}
                    </button>
                  </div>
                  <div className="grid h-full grid-cols-1 gap-2.5 pt-8 xl:grid-cols-3">
                    <div className="flex h-full min-h-0 flex-col rounded-xl border border-slate-200 bg-white p-2.5 overflow-hidden">
                      <div className="flex items-center gap-2 text-amber-600">
                        <Thermometer className="h-4 w-4" />
                        <p className="text-[16px] font-bold">종합 분석</p>
                      </div>
                      <ul className="mt-1.5 min-h-0 flex-1 list-disc space-y-0.5 overflow-y-auto pr-1 pl-5 text-[14px] font-medium leading-relaxed text-slate-700">
                        {overviewLines.map((item, idx) => (
                          <li key={`overview-${idx}-${item}`}>{item}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="flex h-full min-h-0 flex-col rounded-xl border border-slate-200 bg-white p-2.5 overflow-hidden">
                      <div className="flex items-center gap-2 text-sky-600">
                        <Droplets className="h-4 w-4" />
                        <p className="text-[16px] font-bold">AI 제어</p>
                      </div>
                      <ul className="mt-1.5 min-h-0 flex-1 list-disc space-y-0.5 overflow-y-auto pr-1 pl-5 text-[14px] font-medium leading-relaxed text-slate-700">
                        {controlLines.map((item, idx) => (
                          <li key={`control-${idx}-${item}`}>{item}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="flex h-full min-h-0 flex-col rounded-xl border border-indigo-200 bg-indigo-50 p-2.5 overflow-hidden">
                      <div className="flex items-center gap-2 text-indigo-700">
                        <Lightbulb className="h-4 w-4" />
                        <p className="text-[16px] font-bold">권장 행동 지침</p>
                      </div>
                      <ul className="mt-1.5 min-h-0 flex-1 list-disc space-y-0.5 overflow-y-auto pr-1 pl-5 text-[14px] font-medium leading-relaxed text-indigo-800">
                        {guideLines.map((item, idx) => (
                          <li key={`guide-${idx}-${item}`}>{item}</li>
                        ))}
                      </ul>
                    </div>

                  </div>
              </div>
            </motion.div>
          </motion.section>
      </motion.div>
    </div>
  );
}

export default Weather;
