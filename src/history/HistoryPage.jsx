import { useEffect, useMemo, useState } from "react";
import { Calendar, Download } from "lucide-react";
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

function HistoryPage() {
  const [period, setPeriod] = useState("daily");
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [baseDate, setBaseDate] = useState("");

  useEffect(() => {
    let active = true;
    const mac = getSelectedMac();
    const query = new URLSearchParams({ period });
    if (mac) query.set("mac", mac);

    setLoading(true);
    setError("");

    apiFetch(`/api/history?${query.toString()}`)
      .then(async (response) => {
        if (!response.ok) throw new Error();
        return response.json();
      })
      .then(async (data) => {
        const points = Array.isArray(data?.points) ? data.points : [];
        if (mac && points.length === 0) {
          const fallback = await apiFetch(`/api/history?period=${period}`);
          if (fallback.ok) return fallback.json();
        }
        return data;
      })
      .then((data) => {
        if (!active) return;
        setHistory(Array.isArray(data?.points) ? data.points : []);
        setBaseDate(data?.baseDate || "");
      })
      .catch(() => active && setError("히스토리 데이터를 불러오지 못했습니다."))
      .finally(() => active && setLoading(false));

    return () => {
      active = false;
    };
  }, [period]);

  const labels = useMemo(() => history.map((point) => point.label), [history]);
  const indoorTemp = useMemo(() => buildSeries(history, "indoorTemp"), [history]);
  const outdoorTemp = useMemo(() => buildSeries(history, "outdoorTemp"), [history]);
  const indoorHumidity = useMemo(() => buildSeries(history, "indoorHumidity"), [history]);

  const temps = [...indoorTemp, ...outdoorTemp].filter((v) => v != null);
  const hums = indoorHumidity.filter((v) => v != null);
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
  const humidityPath = makePath(indoorHumidity, humMin, humMax, chartWidth, chartHeight, leftPad, rightPad);

  const downloadCsv = () => {
    if (!history.length) return;
    const rows = [["시간", "실내 온도 (°C)", "실외 온도 (°C)", "실내 습도 (%)"]];
    history.forEach((point) => rows.push([point.label, point.indoorTemp ?? "", point.outdoorTemp ?? "", point.indoorHumidity ?? ""]));
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `history-${period}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-full bg-slate-100 p-6">
      <div className="mx-auto max-w-[1400px]">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="text-[40px] font-black tracking-[-0.02em] text-slate-800">데이터 히스토리</h2>
            <p className="mt-1 text-sm font-medium text-slate-500">DB에 저장된 과거 센서 및 날씨 데이터를 조회합니다.</p>
          </div>
          <button
            type="button"
            onClick={downloadCsv}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            <Download className="h-4 w-4" />
            CSV 다운로드
          </button>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-4 pt-2">
            <div className="flex items-center gap-2">
              {PERIODS.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setPeriod(item.key)}
                  className={`rounded-t-lg px-4 py-2 text-sm font-semibold ${
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
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-[34px] font-black text-slate-800">온도 및 습도 변화 추이</h3>
              <div className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-600">
                <Calendar className="h-4 w-4" />
                {baseDate || "-"}
              </div>
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
                  {indoorTempPath && <path d={indoorTempPath} fill="none" stroke="#f59e0b" strokeWidth="3" />}
                  {outdoorTempPath && <path d={outdoorTempPath} fill="none" stroke="#94a3b8" strokeWidth="3" />}
                  {humidityPath && <path d={humidityPath} fill="none" stroke="#2563eb" strokeWidth="3" />}
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
                  <span className="inline-flex items-center gap-1 text-amber-500">
                    <span className="h-3 w-3 rounded-full bg-amber-500" />
                    실내 온도 (°C)
                  </span>
                  <span className="inline-flex items-center gap-1 text-slate-400">
                    <span className="h-3 w-3 rounded-full bg-slate-400" />
                    실외 온도 (°C)
                  </span>
                  <span className="inline-flex items-center gap-1 text-blue-600">
                    <span className="h-3 w-3 rounded-full bg-blue-600" />
                    실내 습도 (%)
                  </span>
                </div>
              </div>
            )}

            <h3 className="mt-8 text-[34px] font-black text-slate-800">데이터 표</h3>
            <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-5 py-3 font-bold">시간</th>
                    <th className="px-5 py-3 font-bold">실내 온도 (°C)</th>
                    <th className="px-5 py-3 font-bold">실외 온도 (°C)</th>
                    <th className="px-5 py-3 font-bold">실내 습도 (%)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {history.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-5 py-8 text-center text-slate-500">
                        표시할 데이터가 없습니다.
                      </td>
                    </tr>
                  ) : (
                    history.map((point, index) => (
                      <tr key={point.label + index}>
                        <td className="px-5 py-3 font-semibold text-slate-700">{point.label}</td>
                        <td className="px-5 py-3 font-semibold text-amber-600">{roundSafe(point.indoorTemp)}</td>
                        <td className="px-5 py-3 font-semibold text-slate-500">{roundSafe(point.outdoorTemp)}</td>
                        <td className="px-5 py-3 font-semibold text-blue-600">{roundSafe(point.indoorHumidity)}</td>
                      </tr>
                    ))
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
