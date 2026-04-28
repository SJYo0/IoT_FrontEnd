import { AlertTriangle, CloudSun, Frown, MapPin, Meh, Smile } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch, readApiMessage } from "../Auth/api";

// 💡 1. MQTT 라이브러리 임포트
import Paho from "paho-mqtt";

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

/** 백엔드 값이 없거나 숫자가 아니면 null (가짜 기본값 사용 안 함) */
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

/** Polar coords: angleDeg 180 = left, 0 = right (semicircle opening downward, arc above) */
function polar(cx, cy, r, angleDeg) {
  const rad = (angleDeg * Math.PI) / 180;
  return [cx + r * Math.cos(rad), cy - r * Math.sin(rad)];
}

/** Arc path along outer radius from startAngle to endAngle (degrees) */
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

function SemiGaugeCard({ title, value, unit, min, max, sublabel }) {
  const missing = value == null;
  const percent = missing ? 0 : clamp(((value - min) / (max - min)) * 100, 0, 100);
  const needleAngle = 180 - (percent / 100) * 180;
  const cx = 84;
  const cy = 66;
  const rOuter = 54;
  const rInner = 38;

  const [nx, ny] = polar(cx, cy, rInner - 8, needleAngle);

  // 💡 화재 의심 시 카드 배경색 변경 로직 추가
  const isDanger = title === "화염 감지" && value != null && value < 500;

  return (
    <div className="flex h-full min-h-[168px] w-full min-w-0 flex-col rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
      <p className="text-base font-bold text-slate-800">{title}</p>
      <div className="mt-2 flex min-h-0 flex-1 items-center justify-between gap-3">
        <div className="flex flex-col justify-center">
          <p className="text-xs font-medium text-slate-500">점수</p>
          <p className="text-2xl font-extrabold leading-tight text-slate-800">
            {missing ? (
              "-"
            ) : (
              <>
                {typeof value === "number" && !Number.isInteger(value) ? value.toFixed(1) : value}
                <span className="ml-1 text-sm font-bold text-slate-500">{unit}</span>
              </>
            )}
          </p>
          {!missing && sublabel && <p className="mt-1 text-xs font-semibold text-slate-500">{sublabel}</p>}
        </div>
        <div className="relative h-[100px] w-[150px] shrink-0">
          <svg className="h-full w-full overflow-visible" viewBox="0 0 168 88">
            {GAUGE_SEGMENTS.map((seg) => (
              <path
                key={`${seg.from}-${seg.to}`}
                d={arcPath(cx, cy, rOuter, seg.from, seg.to)}
                fill="none"
                stroke={seg.color}
                strokeWidth="12"
                strokeLinecap="butt"
                className={missing ? "opacity-30" : ""}
              />
            ))}
            {!missing && (
              <line
                x1={cx}
                y1={cy}
                x2={nx}
                y2={ny}
                stroke="#334155"
                strokeWidth="3"
                strokeLinecap="round"
              />
            )}
            <circle cx={cx} cy={cy} r="6" fill="#fff" stroke="#334155" strokeWidth="2" />
            <text x={cx} y={cy + 26} textAnchor="middle" className="fill-slate-600 text-[13px] font-bold">
              {missing ? "-" : `${Math.round(percent)}%`}
            </text>
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

  // 💡 2. 실시간 센서 데이터를 담을 상태 추가
  const [mqttData, setMqttData] = useState(null);

  const navigate = useNavigate();

  const weather = useMemo(
    () => (Array.isArray(data?.weather) ? data.weather : []),
    [data],
  );

  // 💡 3. MQTT 웹소켓 연결 useEffect
  useEffect(() => {
    const brokerHost = "localhost"; // 배포 시 서버 IP로 변경 필요
    const brokerPort = 9001;
    const clientId = "react_client_" + Math.random().toString(16).substr(2, 8);
    const targetTopic = "gateway/+/telemetry";

    const client = new Paho.Client(brokerHost, brokerPort, clientId);

    client.onMessageArrived = (message) => {
      try {
        const payload = JSON.parse(message.payloadString);
        // 상태를 업데이트하면 리액트가 알아서 화면의 해당 부분만 다시 그립니다.
        setMqttData(payload); 
      } catch (e) {
        console.error("MQTT 파싱 에러:", e);
      }
    };

    client.connect({
      timeout: 3,
      onSuccess: () => {
        console.log("🟢 MQTT 웹소켓 연결 성공!");
        client.subscribe(targetTopic);
      },
      onFailure: (err) => {
        console.error("🔴 MQTT 연결 실패:", err.errorMessage);
      }
    });

    return () => {
      if (client.isConnected()) {
        client.disconnect();
      }
    };
  }, []);

  useEffect(() => {
    apiFetch("/api/dashboard")
      .then((res) => {
        if (!res.ok) {
          if (res.status === 401) {
            navigate("/", { replace: true });
            throw new Error("로그인이 필요합니다.");
          }
          throw new Error("대시보드 정보를 불러오지 못했습니다.");
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

  if (error) {
    return (
      <div className="h-full bg-sky-50 p-6">
        <div className="mx-auto max-w-6xl rounded-2xl border border-rose-200 bg-white p-6 text-rose-600">
          {error}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="h-full bg-sky-50 p-6">
        <div className="mx-auto max-w-6xl rounded-2xl border border-sky-200 bg-white p-6 text-slate-600">
          불러오는 중...
        </div>
      </div>
    );
  }

  const latest = weather[0] ?? {};
  const ta = apiNumber(latest.ta);
  const hm = apiNumber(latest.hm);
  const ws = apiNumber(latest.ws);
  const wd = apiNumber(latest.wd);
  const rn = apiNumber(latest.rn);

  const hasScoreInput = ta != null || hm != null || rn != null || ws != null;
  const dashboardScore = hasScoreInput
    ? clamp(
        Math.round(
          (ta != null ? clamp(((ta + 10) / 50) * 30, 0, 30) : 0) +
            (hm != null ? clamp((hm / 100) * 25, 0, 25) : 0) +
            (rn != null ? clamp((1 - Math.min(Math.abs(rn), 20) / 20) * 15, 0, 15) : 0) +
            (ws != null ? clamp((1 - ws / 15) * 15, 0, 15) : 0) +
            15,
        ),
        1,
        100,
      )
    : null;
  const mainLabel = scoreLabelFromValue(dashboardScore);

  const indoorTemp = mqttData?.temperature ?? null;
  const indoorHum = mqttData?.humidity ?? null;
  const indoorPressure = mqttData?.pressure ?? null;
  const indoorTvoc = mqttData?.tvoc ?? null;
  const indoorEco2 = mqttData?.eco2 ?? null;
  const indoorFlame = mqttData?.flameValue ?? null;

  const metrics = [
    {
      title: "실내 온도",
      value: indoorTemp,
      unit: "°C",
      min: -10,
      max: 40,
      sublabel: indoorTemp == null ? undefined : indoorTemp >= 18 && indoorTemp <= 26 ? "쾌적" : indoorTemp < 18 ? "서늘함" : "더움",
    },
    {
      title: "실내 습도",
      value: indoorHum,
      unit: "%",
      min: 0,
      max: 100,
      sublabel: indoorHum == null ? undefined : indoorHum < 30 ? "건조" : indoorHum > 60 ? "다습" : "쾌적",
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
      title: "이산화탄소 (eCO2)",
      value: indoorEco2,
      unit: "ppm",
      min: 400,
      max: 2000,
      sublabel: indoorEco2 != null && indoorEco2 > 1000 ? "환기 권장" : "양호",
    },
    {
      title: "화학물질 (TVOC)",
      value: indoorTvoc,
      unit: "ppb",
      min: 0,
      max: 1000,
      sublabel: indoorTvoc != null && indoorTvoc > 500 ? "주의" : "안전",
    },
    {
      title: "화염 감지",
      value: indoorFlame,
      unit: "",
      min: 0,
      max: 1024,
      sublabel: indoorFlame != null && indoorFlame < 500 ? "🔥 화재 의심" : "안전",
    },
  ];

  const bars = [47, 47, 65, 55, 75, 90, 93];
  const weekLabels = ["4/4", "4/5", "4/6", "4/7", "4/8", "4/9", "4/10"];
  const pm10 = apiNumber(latest.pm10);
  const pm25 = apiNumber(latest.pm25);
  const co2Outdoor = apiNumber(latest.co2);
  const currentDate = now.toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" });
  const currentTime = now.toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const statusItems = [
    { label: "좋음", icon: Smile, active: dashboardScore != null && mainLabel === "좋음" },
    { label: "보통", icon: Meh, active: dashboardScore != null && mainLabel === "보통" },
    { label: "나쁨", icon: Frown, active: dashboardScore != null && mainLabel === "나쁨" },
    {
      label: "매우나쁨",
      icon: AlertTriangle,
      active: dashboardScore != null && mainLabel === "매우나쁨",
    },
  ];

  return (
    <div className="min-h-screen overflow-x-auto bg-sky-50 p-3">
      <div className="mx-auto grid min-h-[calc(100vh-24px)] max-w-[1720px] grid-cols-[300px_1fr_340px] items-stretch gap-3">
        {/* Left panel */}
        <section className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl bg-gradient-to-b from-[#9cccf0] to-[#5fa3e0] p-4 text-white shadow-md">
          <div className="flex justify-end text-sm font-semibold leading-tight">
            <p className="whitespace-nowrap text-right tabular-nums opacity-95">
              {currentDate}{" "}
              <span className="font-normal opacity-90">{currentTime}</span>
            </p>
          </div>
          <p className="mt-4 text-center text-xl font-bold">센서</p>

          <div className="mx-auto mt-4 flex h-[200px] w-[200px] shrink-0 items-center justify-center rounded-full border-[14px] border-white shadow-inner">
            <div className="text-center px-2">
              <p className="text-xs font-semibold text-white/95">점수</p>
              <p className="mt-1 text-5xl font-extrabold leading-none text-white">
                {dashboardScore == null ? "-" : dashboardScore}
              </p>
              <p className="mt-2 text-2xl font-bold text-white">{mainLabel}</p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-4 gap-1 text-center">
            {statusItems.map((item) => (
              <div key={item.label} className="flex flex-col items-center gap-1">
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-full border-2 ${
                    item.active ? "border-white bg-white text-sky-600 shadow-md" : "border-white/40 bg-white/10 text-white/80"
                  }`}
                >
                  <item.icon className="h-5 w-5" strokeWidth={item.active ? 2.5 : 2} />
                </div>
                <p className={`text-[10px] font-semibold ${item.active ? "text-white" : "text-white/70"}`}>
                  {item.label}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Middle: 7 semi gauges — stretch to fill column height */}
        <section className="flex h-full min-h-0 flex-col rounded-2xl border border-sky-100 bg-white p-4 shadow-sm">
          <div
            className="grid min-h-0 flex-1 grid-cols-2 gap-4"
            style={{ gridTemplateRows: "repeat(3, minmax(0, 1fr)) minmax(0, 1fr)" }}
          >
            {metrics.map((m) => (
              <div key={m.title} className="flex h-full min-h-0 w-full">
                <SemiGaugeCard {...m} />
              </div>
            ))}
            <div className="col-span-2 flex h-full min-h-0 w-full">
              <div className="flex h-full min-h-[168px] w-full min-w-0 flex-col justify-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
                <p className="text-base font-bold text-slate-800">주의보 감지</p>
                <div className="grid grid-cols-2 gap-3">
                  <div
                    className={`rounded-xl border-2 px-3 py-4 text-center ${
                      data.windWarning
                        ? "border-rose-300 bg-rose-50"
                        : "border-emerald-200 bg-emerald-50/80"
                    }`}
                  >
                    <p className="text-xs font-semibold text-slate-600">강풍주의보</p>
                    <p
                      className={`mt-2 text-lg font-extrabold ${
                        data.windWarning ? "text-rose-600" : "text-emerald-700"
                      }`}
                    >
                      {data.windWarning ? "감지" : "미감지"}
                    </p>
                  </div>
                  <div
                    className={`rounded-xl border-2 px-3 py-4 text-center ${
                      data.dryWarning
                        ? "border-amber-300 bg-amber-50"
                        : "border-emerald-200 bg-emerald-50/80"
                    }`}
                  >
                    <p className="text-xs font-semibold text-slate-600">건조주의보</p>
                    <p
                      className={`mt-2 text-lg font-extrabold ${
                        data.dryWarning ? "text-amber-700" : "text-emerald-700"
                      }`}
                    >
                      {data.dryWarning ? "감지" : "미감지"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Right */}
        <section className="grid h-full min-h-0 grid-rows-[auto_auto_1fr] gap-3">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between">
              <p className="text-sm font-bold text-slate-800">실외 날씨정보</p>
              <div className="text-right">
                <p className="flex items-center justify-end gap-1 text-xs font-semibold text-slate-500">
                  <MapPin className="h-3.5 w-3.5" />
                  서울특별시
                </p>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-3">
              <CloudSun className="h-14 w-14 shrink-0 text-amber-400" />
              <div>
                <p className="text-4xl font-extrabold text-sky-600">
                  {ta == null ? "-" : `${ta}°C`}
                </p>
                <p className="text-sm font-semibold text-slate-600">구름많고 해</p>
                <p className="text-xs text-slate-500">습도 {hm == null ? "-" : `${hm}%`}</p>
              </div>
            </div>
            <ul className="mt-3 space-y-1 border-t border-slate-100 pt-2 text-xs text-slate-600">
              <li>미세먼지 {pm10 == null ? "-" : `${formatDashNumber(pm10)} µg/m³`}</li>
              <li>초미세먼지 {pm25 == null ? "-" : `${formatDashNumber(pm25)} µg/m³`}</li>
              <li>이산화탄소 {co2Outdoor == null ? "-" : `${formatDashNumber(co2Outdoor, 3)} ppm`}</li>
            </ul>
          </div>

          <div className="rounded-2xl border border-sky-100 bg-sky-100/60 p-4 shadow-sm">
            <p className="text-sm font-bold text-sky-800">IoT 프로젝트</p>
            <p className="mt-1 text-xs text-slate-600">
              센서·날씨 데이터를 실시간으로 모니터링하고 환경을 관리하세요.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
            <p className="mb-2 text-sm font-bold text-slate-800">주간 점수 차트</p>
            <div className="mb-2 flex justify-between text-[10px] text-slate-400">
              <span>0</span>
              <span>50</span>
              <span>100</span>
            </div>
            <div className="space-y-2.5">
              {bars.map((bar, index) => (
                <div key={weekLabels[index]} className="grid grid-cols-[36px_1fr_28px] items-center gap-2">
                  <span className="text-[11px] font-medium text-slate-500">{weekLabels[index]}</span>
                  <div className="h-2.5 rounded-full bg-slate-100">
                    <div className="h-2.5 rounded-full bg-sky-400" style={{ width: `${bar}%` }} />
                  </div>
                  <span className="text-right text-[11px] font-bold text-slate-700">{bar}</span>
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
