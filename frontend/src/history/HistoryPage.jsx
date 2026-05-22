import { useEffect, useMemo, useState } from "react";
import { Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../Auth/api";

const PERIODS = [
  { key: "daily", labelKo: "일별", labelEn: "Daily" },
  { key: "weekly", labelKo: "주별", labelEn: "Weekly" },
  { key: "monthly", labelKo: "월별", labelEn: "Monthly" },
];

const DEVICES_STORAGE_KEY = "iot.connectedDevices";
const SELECTED_DEVICE_KEY = "iot.selectedDeviceId";

function parseStorageArray(raw) {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function getSelectedMac() {
  const selectedId =
    sessionStorage.getItem(SELECTED_DEVICE_KEY) || localStorage.getItem(SELECTED_DEVICE_KEY) || "";
  const devices =
    parseStorageArray(sessionStorage.getItem(DEVICES_STORAGE_KEY)).length > 0
      ? parseStorageArray(sessionStorage.getItem(DEVICES_STORAGE_KEY))
      : parseStorageArray(localStorage.getItem(DEVICES_STORAGE_KEY));
  const selected = devices.find((device) => device.id === selectedId) || devices[0];
  const mac = selected?.mac || "";
  if (mac === "00:00:00:00:00:00") return "";
  return mac;
}

function buildSeries(points, key) {
  return points.map((point) => (point[key] == null ? null : Number(point[key])));
}

function makePath(values, min, max, width, height, leftPad, rightPad) {
  const step = values.length > 1 ? (width - leftPad - rightPad) / (values.length - 1) : 0;
  const safeRange = Math.max(max - min, 1);
  let path = "";
  values.forEach((value, index) => {
    if (value == null) return;
    const x = leftPad + step * index;
    const y = 16 + ((max - value) / safeRange) * (height - 48);
    path += path ? ` L ${x} ${y}` : `M ${x} ${y}`;
  });
  return path;
}

function roundSafe(value) {
  if (value == null || Number.isNaN(Number(value))) return "-";
  const num = Number(value);
  return Number.isInteger(num) ? String(num) : num.toFixed(1);
}

function formatDateLabel(dateString) {
  if (!dateString) return "-";
  const [y, m, d] = String(dateString).split("-");
  if (!y || !m || !d) return dateString;
  return `${Number(m)}월 ${Number(d)}일`;
}

function toDateInputValue(date) {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

function mondayOfWeek(dateText) {
  const base = dateText ? new Date(`${dateText}T00:00:00`) : new Date();
  const day = base.getDay(); // 0: Sun ... 6: Sat
  const diff = day === 0 ? -6 : 1 - day;
  base.setDate(base.getDate() + diff);
  return toDateInputValue(base);
}

function addDays(dateText, days) {
  const base = new Date(`${dateText}T00:00:00`);
  base.setDate(base.getDate() + days);
  return toDateInputValue(base);
}

function HistoryPage() {
  const navigate = useNavigate();
  const [period, setPeriod] = useState("daily");
  const [viewMode, setViewMode] = useState("indoor");
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [baseDate, setBaseDate] = useState("");
  const [rangeStartDate, setRangeStartDate] = useState("");
  const [rangeEndDate, setRangeEndDate] = useState("");
  const [reloadSeq, setReloadSeq] = useState(0);
  const [selectedDate, setSelectedDate] = useState(() => toDateInputValue(new Date()));
  const [weeklyStartDate, setWeeklyStartDate] = useState(() => mondayOfWeek(toDateInputValue(new Date())));
  const [weeklyEndDate, setWeeklyEndDate] = useState(() => addDays(mondayOfWeek(toDateInputValue(new Date())), 7));
  const [selectedMonth, setSelectedMonth] = useState(() => toDateInputValue(new Date()).slice(0, 7));

  useEffect(() => {
    let active = true;
    const mac = getSelectedMac();
    const query = new URLSearchParams({ period });
    if (mac) query.set("mac", mac);
    if (period === "daily" && selectedDate) query.set("date", selectedDate);
    if (period === "weekly") {
      if (weeklyStartDate) query.set("startDate", weeklyStartDate);
      if (weeklyEndDate) query.set("endDate", weeklyEndDate);
    }
    if (period === "monthly" && selectedMonth) {
      query.set("month", selectedMonth);
    }

    setLoading(true);
    setError("");

    apiFetch(`/api/history?${query.toString()}`)
      .then(async (response) => {
        if (!response.ok) {
          if (response.status === 401) {
            const meRes = await apiFetch("/api/auth/me").catch(() => null);
            if (meRes?.ok) {
              throw new Error("retryable-auth");
            }
            navigate("/", { replace: true });
            throw new Error("unauthorized-redirect");
          }
          throw new Error();
        }
        return response.json();
      })
      .then(async (data) => {
        const points = Array.isArray(data?.points) ? data.points : [];
        if (mac && points.length === 0) {
          const fallbackQuery = new URLSearchParams({ period });
          if (period === "daily" && selectedDate) fallbackQuery.set("date", selectedDate);
          if (period === "weekly") {
            if (weeklyStartDate) fallbackQuery.set("startDate", weeklyStartDate);
            if (weeklyEndDate) fallbackQuery.set("endDate", weeklyEndDate);
          }
          if (period === "monthly" && selectedMonth) fallbackQuery.set("month", selectedMonth);
          const fallback = await apiFetch(`/api/history?${fallbackQuery.toString()}`);
          if (fallback.ok) return fallback.json();
        }
        return data;
      })
      .then((data) => {
        if (!active) return;
        const points = Array.isArray(data?.points) ? data.points : [];
        setHistory(points);
        setBaseDate(data?.baseDate || "");
        setRangeStartDate(data?.rangeStartDate || "");
        setRangeEndDate(data?.rangeEndDate || "");
      })
      .catch((e) => {
        if (!active) return;
        if (String(e?.message || "") === "unauthorized-redirect") return;
        if (String(e?.message || "") === "retryable-auth") {
          setTimeout(() => {
            if (!active) return;
            setReloadSeq((prev) => prev + 1);
          }, 500);
          return;
        }
        setError("히스토리 데이터를 불러오지 못했습니다.");
      })
      .finally(() => active && setLoading(false));

    return () => {
      active = false;
    };
  }, [period, navigate, reloadSeq, selectedDate, weeklyStartDate, weeklyEndDate, selectedMonth]);

  const labels = useMemo(() => history.map((point) => point.label), [history]);
  const indoorTemp = useMemo(() => buildSeries(history, "indoorTemp"), [history]);
  const outdoorTemp = useMemo(() => buildSeries(history, "outdoorTemp"), [history]);
  const indoorHumidity = useMemo(() => buildSeries(history, "indoorHumidity"), [history]);
  const outdoorHumidity = useMemo(
    () =>
      history.map((point) => {
        const v = point?.outdoorHumidity ?? point?.hm;
        return v == null ? null : Number(v);
      }),
    [history],
  );

  const temps = (viewMode === "indoor" ? indoorTemp : outdoorTemp).filter((v) => v != null);
  const hums = (viewMode === "indoor" ? indoorHumidity : outdoorHumidity).filter((v) => v != null);
  const tempMin = temps.length ? Math.floor(Math.min(...temps) - 2) : 0;
  const tempMax = temps.length ? Math.ceil(Math.max(...temps) + 2) : 40;
  const humMin = hums.length ? Math.floor(Math.min(...hums) - 5) : 0;
  const humMax = hums.length ? Math.ceil(Math.max(...hums) + 5) : 100;

  const chartWidth = 980;
  const chartHeight = 220;
  const leftPad = 56;
  const rightPad = 56;

  const indoorTempPath = makePath(indoorTemp, tempMin, tempMax, chartWidth, chartHeight, leftPad, rightPad);
  const outdoorTempPath = makePath(outdoorTemp, tempMin, tempMax, chartWidth, chartHeight, leftPad, rightPad);
  const indoorHumidityPath = makePath(indoorHumidity, humMin, humMax, chartWidth, chartHeight, leftPad, rightPad);
  const outdoorHumidityPath = makePath(outdoorHumidity, humMin, humMax, chartWidth, chartHeight, leftPad, rightPad);

  const handleWeeklyStartDateChange = (value) => {
    if (!value) return;
    const monday = mondayOfWeek(value);
    setWeeklyStartDate(monday);
    setWeeklyEndDate(addDays(monday, 7));
  };

  return (
    <div className="h-full bg-slate-100 p-6">
      <div className="mx-auto max-w-[1400px]">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="text-[40px] font-black tracking-[-0.02em] text-slate-800">데이터 히스토리</h2>
            <p className="mt-1 text-sm font-medium text-slate-500">DB에 저장된 과거 센서 및 날씨 데이터를 조회합니다.</p>
          </div>
          <div className="mt-6">
            <div className="flex items-center gap-2">
              <div className="rounded-xl border border-slate-200 bg-white p-1.5">
                <label className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600">
                  <Calendar className="h-4 w-4" />
                  {period === "weekly" ? (
                    <>
                      <span>기간</span>
                      <input
                        type="date"
                        value={weeklyStartDate}
                        onChange={(e) => handleWeeklyStartDateChange(e.target.value)}
                        className="rounded-md border border-slate-200 px-2 py-1 text-sm text-slate-700 outline-none focus:border-indigo-400"
                      />
                      <span>~</span>
                      <input
                        type="date"
                        value={weeklyEndDate}
                        readOnly
                        disabled
                        className="rounded-md border border-slate-200 px-2 py-1 text-sm text-slate-700 outline-none focus:border-indigo-400"
                      />
                    </>
                  ) : period === "monthly" ? (
                    <>
                      <span>월</span>
                      <input
                        type="month"
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className="rounded-md border border-slate-200 px-2 py-1 text-sm text-slate-700 outline-none focus:border-indigo-400"
                      />
                    </>
                  ) : (
                    <>
                      <span>날짜</span>
                      <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="rounded-md border border-slate-200 px-2 py-1 text-sm text-slate-700 outline-none focus:border-indigo-400"
                      />
                    </>
                  )}
                </label>
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-1.5">
                <button
                  type="button"
                  onClick={() => setViewMode("indoor")}
                  className={`rounded-lg px-4 py-2 text-sm font-semibold ${
                    viewMode === "indoor" ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  실내
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("outdoor")}
                  className={`rounded-lg px-4 py-2 text-sm font-semibold ${
                    viewMode === "outdoor" ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  실외
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-4 pt-2">
            <div className="flex items-center gap-2 overflow-x-auto whitespace-nowrap">
              {PERIODS.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setPeriod(item.key)}
                  className={`rounded-t-lg px-4 py-2 text-sm font-semibold whitespace-nowrap ${
                    period === item.key
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                  }`}
                >
                  {item.labelKo} ({item.labelEn})
                </button>
              ))}
            </div>
          </div>

          <div className="px-4 pb-5 pt-4">
            <div className="mb-3">
              <h3 className="text-[34px] font-black text-slate-800">온도 및 습도 변화 추이</h3>
              {(period === "weekly" || period === "monthly") && (
                <p className="mt-1 text-sm font-semibold text-slate-500">
                  {formatDateLabel(rangeStartDate)} ~ {formatDateLabel(rangeEndDate)}
                </p>
              )}
            </div>

            {loading ? (
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-8 text-center text-slate-500">데이터를 불러오는 중...</div>
            ) : error ? (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-8 text-center text-rose-600">{error}</div>
            ) : (
              <div className="overflow-x-auto">
                <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="h-[220px] min-w-[980px] w-full">
                  <line x1={leftPad} y1={16} x2={leftPad} y2={chartHeight - 32} stroke="#d1d5db" />
                  <line
                    x1={leftPad}
                    y1={chartHeight - 32}
                    x2={chartWidth - rightPad}
                    y2={chartHeight - 32}
                    stroke="#d1d5db"
                  />
                  {viewMode === "indoor" && indoorTempPath && (
                    <path d={indoorTempPath} fill="none" stroke="#f59e0b" strokeWidth="3" />
                  )}
                  {viewMode === "outdoor" && outdoorTempPath && (
                    <path d={outdoorTempPath} fill="none" stroke="#64748b" strokeWidth="3" />
                  )}
                  {viewMode === "indoor" && indoorHumidityPath && (
                    <path d={indoorHumidityPath} fill="none" stroke="#2563eb" strokeWidth="3" />
                  )}
                  {viewMode === "outdoor" && outdoorHumidityPath && (
                    <path d={outdoorHumidityPath} fill="none" stroke="#0ea5e9" strokeWidth="3" />
                  )}
                  {labels.map((label, index) => {
                    const step = labels.length > 1 ? (chartWidth - leftPad - rightPad) / (labels.length - 1) : 0;
                    const x = leftPad + step * index;
                    return (
                      <text
                        key={label + index}
                        x={x}
                        y={chartHeight - 10}
                        textAnchor="middle"
                        className="fill-slate-400 text-[12px]"
                      >
                        {label}
                      </text>
                    );
                  })}
                </svg>

                <div className="mt-2 flex items-center justify-center gap-6 text-sm font-semibold">
                  {viewMode === "indoor" ? (
                    <>
                      <span className="inline-flex items-center gap-1 text-amber-500">
                        <span className="h-3 w-3 rounded-full bg-amber-500" />
                        실내 온도 (°C)
                      </span>
                      <span className="inline-flex items-center gap-1 text-blue-600">
                        <span className="h-3 w-3 rounded-full bg-blue-600" />
                        실내 습도 (%)
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="inline-flex items-center gap-1 text-slate-500">
                        <span className="h-3 w-3 rounded-full bg-slate-500" />
                        실외 기온 (°C)
                      </span>
                      <span className="inline-flex items-center gap-1 text-sky-600">
                        <span className="h-3 w-3 rounded-full bg-sky-600" />
                        실외 습도 (%)
                      </span>
                    </>
                  )}
                </div>
              </div>
            )}

            <h3 className="mt-8 text-[34px] font-black text-slate-800">데이터 표</h3>
            <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  {viewMode === "indoor" ? (
                    <tr>
                      <th className="px-5 py-3 font-bold">시간</th>
                      <th className="px-5 py-3 font-bold">실내 온도 (°C)</th>
                      <th className="px-5 py-3 font-bold">실내 습도 (%)</th>
                      <th className="px-5 py-3 font-bold">기압 (hPa)</th>
                      <th className="px-5 py-3 font-bold">유해 화학물질 (TVOC)</th>
                      <th className="px-5 py-3 font-bold">이산화탄소 (eCO2)</th>
                      <th className="px-5 py-3 font-bold">화염세기</th>
                    </tr>
                  ) : (
                    <tr>
                      <th className="px-5 py-3 font-bold">시간</th>
                      <th className="px-5 py-3 font-bold">기온 (°C)</th>
                      <th className="px-5 py-3 font-bold">풍향 (deg)</th>
                      <th className="px-5 py-3 font-bold">풍속 (m/s)</th>
                      <th className="px-5 py-3 font-bold">습도 (%)</th>
                      <th className="px-5 py-3 font-bold">강수량 (mm)</th>
                    </tr>
                  )}
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {history.length === 0 ? (
                    <tr>
                      <td colSpan={viewMode === "indoor" ? 7 : 6} className="px-5 py-8 text-center text-slate-500">
                        표시할 데이터가 없습니다.
                      </td>
                    </tr>
                  ) : (
                    history.map((point, index) =>
                      viewMode === "indoor" ? (
                        <tr key={point.label + index}>
                          <td className="px-5 py-3 font-semibold text-slate-700">{point.label}</td>
                          <td className="px-5 py-3 font-semibold text-amber-600">{roundSafe(point.indoorTemp)}</td>
                          <td className="px-5 py-3 font-semibold text-blue-600">{roundSafe(point.indoorHumidity)}</td>
                          <td className="px-5 py-3 font-semibold text-slate-600">{roundSafe(point.indoorPressure ?? point.pressure)}</td>
                          <td className="px-5 py-3 font-semibold text-violet-600">{roundSafe(point.indoorTvoc ?? point.tvoc)}</td>
                          <td className="px-5 py-3 font-semibold text-emerald-600">{roundSafe(point.indoorEco2 ?? point.eco2)}</td>
                          <td className="px-5 py-3 font-semibold text-rose-600">{roundSafe(point.indoorFlame ?? point.flameValue)}</td>
                        </tr>
                      ) : (
                        <tr key={point.label + index}>
                          <td className="px-5 py-3 font-semibold text-slate-700">{point.label}</td>
                          <td className="px-5 py-3 font-semibold text-slate-600">{roundSafe(point.outdoorTemp ?? point.ta)}</td>
                          <td className="px-5 py-3 font-semibold text-slate-600">{roundSafe(point.wd)}</td>
                          <td className="px-5 py-3 font-semibold text-slate-600">{roundSafe(point.ws)}</td>
                          <td className="px-5 py-3 font-semibold text-sky-600">{roundSafe(point.outdoorHumidity ?? point.hm)}</td>
                          <td className="px-5 py-3 font-semibold text-emerald-600">{roundSafe(point.rn)}</td>
                        </tr>
                      ),
                    )
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HistoryPage;
