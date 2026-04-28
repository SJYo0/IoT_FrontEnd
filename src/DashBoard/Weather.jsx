import { AlertTriangle, CloudSun, Frown, MapPin, Meh, Smile, BellRing } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../Auth/api";
import Paho from "paho-mqtt";

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

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

function SemiGaugeCard({ title, value, unit, min, max, sublabel, alert }) {
  const missing = value == null;
  const percent = missing ? 0 : clamp(((value - min) / (max - min)) * 100, 0, 100);
  const cx = 84;
  const cy = 66;
  const rOuter = 54;
  const rInner = 38;
  const needleLength = rInner - 8;

  const isCritical = alert?.severity === "CRITICAL";
  const isWarning = alert?.severity === "WARNING";

  let cardClass = "flex h-full w-full min-w-0 flex-col rounded-2xl border p-4 2xl:p-6 transition-colors duration-300 ";
  if (isCritical) {
    cardClass += "bg-rose-50 border-rose-500 shadow-md";
  } else if (isWarning) {
    cardClass += "bg-amber-50 border-amber-400 shadow-sm";
  } else {
    cardClass += "bg-white border-slate-200/80 shadow-sm";
  }

  let textColor = isCritical ? "text-rose-700" : isWarning ? "text-amber-700" : "text-slate-800";
  let sublabelColor = isCritical ? "text-rose-600 font-bold" : isWarning ? "text-amber-600 font-bold" : "text-slate-500";

  return (
    <div className={cardClass}>
      <p className="text-base 2xl:text-xl font-bold text-slate-800 z-10">{title}</p>
      <div className="mt-2 2xl:mt-4 flex min-h-0 flex-1 items-center justify-between gap-3">
        <div className="flex flex-col justify-center z-10 relative">
          <p className="text-xs 2xl:text-sm font-medium text-slate-500">측정값</p>
          <p className={`text-2xl 2xl:text-4xl font-extrabold leading-tight ${textColor}`}>
            {missing ? "-" : (
              <>
                {typeof value === "number" && !Number.isInteger(value) ? value.toFixed(1) : value}
                <span className="ml-1 text-sm 2xl:text-xl font-bold opacity-70">{unit}</span>
              </>
            )}
          </p>
          {!missing && (
            <p className={`mt-1 text-xs 2xl:text-sm max-w-[120px] 2xl:max-w-[180px] break-keep ${sublabelColor}`}>
              {alert ? alert.message : sublabel}
            </p>
          )}
        </div>
        {/* 💡 고정 픽셀(150px)을 버리고 박스 크기의 45%를 차지하도록 비율로 변경 (모니터가 커지면 그래프도 커짐) */}
        <div className="relative flex h-full w-[45%] shrink-0 items-center justify-end z-10">
          <svg className="h-full w-full overflow-visible drop-shadow-sm" viewBox="0 0 168 88" preserveAspectRatio="xMidYMid meet">
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
    </div>
  );
}

function scoreLabelFromValue(score) {
  if (score == null) return "-";
  if (score >= 80) return "좋음";
  if (score >= 60) return "보통";
  if (score >= 40) return "나쁨";
  return "매우나쁨";
}

function Weather() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [now, setNow] = useState(() => new Date());

  const [mqttData, setMqttData] = useState(null);
  const [activeAlerts, setActiveAlerts] = useState({});
  const navigate = useNavigate();

  const weather = useMemo(() => (Array.isArray(data?.weather) ? data.weather : []), [data]);

  useEffect(() => {
    const brokerHost = "localhost";
    const brokerPort = 9001;
    const clientId = "react_client_" + Math.random().toString(16).substr(2, 8);
    
    const client = new Paho.Client(brokerHost, brokerPort, clientId);

    client.onMessageArrived = (message) => {
      try {
        const topic = message.destinationName;
        const payload = JSON.parse(message.payloadString);

        if (topic.includes("/telemetry")) {
          setMqttData(payload);
        } else if (topic.includes("/alarm/")) {
          if (payload.severity === "NORMAL") {
            setActiveAlerts((prev) => {
              const nextAlerts = { ...prev };
              delete nextAlerts[payload.category];
              return nextAlerts;
            });
          } else {
            setActiveAlerts((prev) => ({
              ...prev,
              [payload.category]: payload
            }));
          }
        }
      } catch (e) {
        console.error("MQTT 파싱 에러:", e);
      }
    };

    client.connect({
      timeout: 3,
      onSuccess: () => {
        client.subscribe("gateway/+/telemetry");
        client.subscribe("webbackend/alarm/+"); 
      },
      onFailure: (err) => console.error("MQTT 연결 실패:", err.errorMessage)
    });

    return () => {
      if (client.isConnected()) client.disconnect();
    };
  }, []);

  useEffect(() => {
    apiFetch("/api/dashboard")
      .then((res) => {
        if (!res.ok) {
          if (res.status === 401) { navigate("/", { replace: true }); throw new Error("로그인 필요"); }
          throw new Error("정보를 불러오지 못했습니다.");
        }
        return res.json();
      })
      .then((responseData) => setData(responseData))
      .catch(() => setError("대시보드 정보를 불러오지 못했습니다."));
  }, [navigate]);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (error) return <div className="p-6 h-screen flex items-center justify-center bg-sky-50 text-rose-500 font-bold">{error}</div>;
  if (!data) return <div className="p-6 h-screen flex items-center justify-center bg-sky-50 text-slate-500 font-bold">불러오는 중...</div>;

  const latest = weather[0] ?? {};
  const ta = apiNumber(latest.ta);
  const hm = apiNumber(latest.hm);
  const ws = apiNumber(latest.ws);
  const wd = apiNumber(latest.wd);
  const rn = apiNumber(latest.rn);

  const hasScoreInput = ta != null || hm != null || rn != null || ws != null;
  const dashboardScore = hasScoreInput ? clamp( Math.round( (ta != null ? clamp(((ta + 10) / 50) * 30, 0, 30) : 0) + (hm != null ? clamp((hm / 100) * 25, 0, 25) : 0) + (rn != null ? clamp((1 - Math.min(Math.abs(rn), 20) / 20) * 15, 0, 15) : 0) + (ws != null ? clamp((1 - ws / 15) * 15, 0, 15) : 0) + 15, ), 1, 100, ) : null;
  const mainLabel = scoreLabelFromValue(dashboardScore);

  const indoorTemp = mqttData?.temperature ?? null;
  const indoorHum = mqttData?.humidity ?? null;
  const indoorPressure = mqttData?.pressure ?? null;
  const indoorTvoc = mqttData?.tvoc ?? null;
  const indoorEco2 = mqttData?.eco2 ?? null;
  const indoorFlame = mqttData?.flameValue ?? null;

  const metrics = [
    { title: "실내 온도", value: indoorTemp, unit: "°C", min: -10, max: 40, sublabel: indoorTemp == null ? undefined : indoorTemp >= 18 && indoorTemp <= 26 ? "쾌적" : indoorTemp < 18 ? "서늘함" : "더움", alert: activeAlerts["TEMP"] },
    { title: "실내 습도", value: indoorHum, unit: "%", min: 0, max: 100, sublabel: indoorHum == null ? undefined : indoorHum < 30 ? "건조" : indoorHum > 60 ? "다습" : "쾌적", alert: activeAlerts["HUMIDITY"] },
    { title: "실내 기압", value: indoorPressure, unit: "hPa", min: 900, max: 1100, sublabel: "정상 범위", alert: null },
    { title: "이산화탄소 (eCO2)", value: indoorEco2, unit: "ppm", min: 400, max: 2000, sublabel: indoorEco2 != null && indoorEco2 > 1000 ? "환기 권장" : "양호", alert: activeAlerts["ECO2"] },
    { title: "화학물질 (TVOC)", value: indoorTvoc, unit: "ppb", min: 0, max: 1000, sublabel: indoorTvoc != null && indoorTvoc > 500 ? "주의" : "안전", alert: activeAlerts["TVOC"] },
    { title: "화염 감지", value: indoorFlame, unit: "", min: 0, max: 1024, sublabel: indoorFlame != null && indoorFlame < 500 ? "화재 의심" : "안전", alert: activeAlerts["FIRE"] },
  ];

  const bars = [47, 47, 65, 55, 75, 90, 93];
  const weekLabels = ["4/4", "4/5", "4/6", "4/7", "4/8", "4/9", "4/10"];
  const pm10 = apiNumber(latest.pm10);
  const pm25 = apiNumber(latest.pm25);
  const co2Outdoor = apiNumber(latest.co2);
  const currentDate = now.toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" });
  const currentTime = now.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });

  const statusItems = [
    { label: "좋음", icon: Smile, active: dashboardScore != null && mainLabel === "좋음" },
    { label: "보통", icon: Meh, active: dashboardScore != null && mainLabel === "보통" },
    { label: "나쁨", icon: Frown, active: dashboardScore != null && mainLabel === "나쁨" },
    { label: "매우나쁨", icon: AlertTriangle, active: dashboardScore != null && mainLabel === "매우나쁨" },
  ];

  const isAnyCritical = Object.values(activeAlerts).some(a => a.severity === "CRITICAL");
  const isAnyWarning = Object.values(activeAlerts).some(a => a.severity === "WARNING");

  return (
    <div className={`h-screen w-screen overflow-hidden p-3 2xl:p-6 transition-colors duration-500 ${isAnyCritical ? 'bg-rose-900/10' : 'bg-sky-50'}`}>
      
      {(isAnyCritical || isAnyWarning) && (
        <div className={`absolute top-4 2xl:top-8 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 px-6 py-3 2xl:px-10 2xl:py-5 rounded-full shadow-lg ${isAnyCritical ? 'bg-rose-600 text-white border border-rose-400' : 'bg-amber-500 text-white'}`}>
          <BellRing className="w-6 h-6 2xl:w-8 2xl:h-8" />
          <span className="font-extrabold text-lg 2xl:text-2xl tracking-tight">
            {Object.values(activeAlerts)[0]?.message}
          </span>
        </div>
      )}

      {/* 💡 화면이 커지면 중앙 영역이 너무 뚱뚱해지는 것을 막기 위해 비율(fr) 기반 그리드로 변경했습니다. */}
      <div className={`grid h-full w-full grid-cols-[1.2fr_4fr_1.3fr] gap-3 2xl:gap-6`}>
        
        {/* Left panel */}
        {/* 💡 억지로 늘어나지 않고 상단부터 쌓이도록 justify-center 등 분산 속성을 모두 제거했습니다. */}
        <section className="flex flex-col rounded-2xl bg-gradient-to-b from-[#9cccf0] to-[#5fa3e0] p-4 2xl:p-8 text-white shadow-md z-10 relative overflow-hidden">
          <div className="flex justify-end text-sm 2xl:text-base font-semibold leading-tight">
            <p className="whitespace-nowrap text-right tabular-nums opacity-95">{currentDate} <span className="font-normal opacity-90">{currentTime}</span></p>
          </div>
          <p className="mt-4 2xl:mt-8 text-center text-xl 2xl:text-3xl font-bold">센서</p>
          
          <div className="mx-auto mt-6 2xl:mt-12 flex aspect-square w-[65%] 2xl:w-[55%] shrink-0 items-center justify-center rounded-full border-[14px] 2xl:border-[20px] border-white shadow-inner bg-sky-400/20">
            <div className="text-center px-2">
              <p className="text-xs 2xl:text-base font-semibold text-white/95">점수</p>
              <p className="mt-1 text-5xl 2xl:text-7xl font-extrabold leading-none text-white">{dashboardScore == null ? "-" : dashboardScore}</p>
              <p className="mt-2 text-xl 2xl:text-3xl font-bold text-white">{mainLabel}</p>
            </div>
          </div>

          <div className="mt-8 2xl:mt-16 grid grid-cols-4 gap-1 2xl:gap-3 text-center">
            {statusItems.map((item) => (
              <div key={item.label} className="flex flex-col items-center gap-1 2xl:gap-2">
                <div className={`flex h-10 w-10 2xl:h-14 2xl:w-14 items-center justify-center rounded-full border-2 2xl:border-4 ${item.active ? "border-white bg-white text-sky-600 shadow-md" : "border-white/40 bg-white/10 text-white/80"}`}>
                  <item.icon className="h-5 w-5 2xl:h-7 2xl:w-7" strokeWidth={item.active ? 2.5 : 2} />
                </div>
                <p className={`text-[10px] 2xl:text-sm font-semibold ${item.active ? "text-white" : "text-white/70"}`}>{item.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Middle panel */}
        <section className="flex h-full min-h-0 flex-col rounded-2xl border border-sky-100 bg-white/90 p-4 2xl:p-6 shadow-sm gap-3 2xl:gap-6">
          <div className="grid min-h-0 flex-1 grid-cols-2 gap-3 2xl:gap-6" style={{ gridTemplateRows: "repeat(3, minmax(0, 1fr))" }}>
            {metrics.map((m) => (
              <div key={m.title} className="flex h-full min-h-0 w-full">
                <SemiGaugeCard {...m} />
              </div>
            ))}
          </div>
          
          {/* 💡 주의보 감지 패널의 높이를 날씬하게 줄였습니다. (py-3 -> py-2, flex-1 제거) */}
          <div className="flex w-full flex-col justify-center gap-2 2xl:gap-4 rounded-2xl border border-slate-200/80 bg-white p-3 2xl:p-5 shadow-sm shrink-0">
            <p className="text-sm 2xl:text-xl font-bold text-slate-800">주의보 감지</p>
            <div className="grid grid-cols-2 gap-3 2xl:gap-6">
              <div className={`flex flex-col justify-center rounded-xl border-2 px-3 py-2 2xl:py-4 text-center ${data?.windWarning ? "border-rose-300 bg-rose-50" : "border-emerald-200 bg-emerald-50/80"}`}>
                <p className="text-xs 2xl:text-base font-semibold text-slate-600">강풍주의보</p>
                <p className={`mt-1 text-base 2xl:text-2xl font-extrabold ${data?.windWarning ? "text-rose-600" : "text-emerald-700"}`}>{data?.windWarning ? "감지" : "미감지"}</p>
              </div>
              <div className={`flex flex-col justify-center rounded-xl border-2 px-3 py-2 2xl:py-4 text-center ${data?.dryWarning ? "border-amber-300 bg-amber-50" : "border-emerald-200 bg-emerald-50/80"}`}>
                <p className="text-xs 2xl:text-base font-semibold text-slate-600">건조주의보</p>
                <p className={`mt-1 text-base 2xl:text-2xl font-extrabold ${data?.dryWarning ? "text-amber-700" : "text-emerald-700"}`}>{data?.dryWarning ? "감지" : "미감지"}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Right panel */}
        {/* 💡 억지로 간격을 띄우는 flex-1과 justify-between을 날리고, 모든 박스가 위로 찰싹 달라붙게 처리했습니다. */}
        <section className="flex flex-col gap-3 2xl:gap-6">
          <div className="flex flex-col rounded-2xl border border-slate-200/80 bg-white/90 p-4 2xl:p-6 shadow-sm">
            <div className="flex items-start justify-between">
              <p className="text-sm 2xl:text-xl font-bold text-slate-800">실외 날씨정보</p>
              <div className="text-right">
                <p className="flex items-center justify-end gap-1 text-xs 2xl:text-sm font-semibold text-slate-500"><MapPin className="h-3.5 w-3.5 2xl:h-5 2xl:w-5" /> 서울특별시</p>
              </div>
            </div>
            <div className="mt-3 2xl:mt-6 flex items-center gap-3 2xl:gap-6">
              <CloudSun className="h-12 w-12 2xl:h-20 2xl:w-20 shrink-0 text-amber-400" />
              <div>
                <p className="text-3xl 2xl:text-5xl font-extrabold text-sky-600">{ta == null ? "-" : `${ta}°C`}</p>
                <p className="text-sm 2xl:text-lg font-semibold text-slate-600">구름많고 해</p>
                <p className="text-xs 2xl:text-base text-slate-500">습도 {hm == null ? "-" : `${hm}%`}</p>
              </div>
            </div>
            <ul className="mt-4 2xl:mt-6 pt-3 2xl:pt-4 space-y-1 2xl:space-y-2 border-t border-slate-100 text-xs 2xl:text-base text-slate-600">
              <li>미세먼지 {pm10 == null ? "-" : `${formatDashNumber(pm10)} µg/m³`}</li>
              <li>초미세먼지 {pm25 == null ? "-" : `${formatDashNumber(pm25)} µg/m³`}</li>
              <li>이산화탄소 {co2Outdoor == null ? "-" : `${formatDashNumber(co2Outdoor, 3)} ppm`}</li>
            </ul>
          </div>
          
          <div className="rounded-2xl border border-sky-100 bg-sky-100/60 p-4 2xl:p-6 shadow-sm">
            <p className="text-sm 2xl:text-xl font-bold text-sky-800">IoT 프로젝트</p>
            <p className="mt-1 2xl:mt-2 text-xs 2xl:text-base text-slate-600 leading-tight">센서·날씨 데이터를 실시간으로 모니터링하고 환경을 관리하세요.</p>
          </div>
          
          <div className="flex flex-col rounded-2xl border border-slate-200/80 bg-white/90 p-4 2xl:p-6 shadow-sm">
            <p className="mb-2 2xl:mb-4 text-sm 2xl:text-xl font-bold text-slate-800">주간 점수 차트</p>
            <div className="mb-2 2xl:mb-4 flex justify-between text-[10px] 2xl:text-sm text-slate-400">
              <span>0</span><span>50</span><span>100</span>
            </div>
            <div className="flex flex-col gap-2 2xl:gap-4 py-1">
              {bars.map((bar, index) => (
                <div key={weekLabels[index]} className="grid grid-cols-[36px_1fr_28px] 2xl:grid-cols-[48px_1fr_40px] items-center gap-2 2xl:gap-4">
                  <span className="text-[10px] 2xl:text-sm font-medium text-slate-500">{weekLabels[index]}</span>
                  <div className="h-2.5 2xl:h-4 rounded-full bg-slate-100">
                    <div className="h-2.5 2xl:h-4 rounded-full bg-sky-400" style={{ width: `${bar}%` }} />
                  </div>
                  <span className="text-right text-[10px] 2xl:text-sm font-bold text-slate-700">{bar}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default Weather;