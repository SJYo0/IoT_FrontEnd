import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch, readApiMessage } from "../Auth/api";

function Weather() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [now, setNow] = useState(() => new Date());
  const navigate = useNavigate();

  const weather = useMemo(() => {
    if (!Array.isArray(data?.weather)) {
      return [];
    }
    return data.weather;
  }, [data]);

  useEffect(() => {
    apiFetch("/api/weather")
      .then((res) => {
        if (!res.ok) {
          if (res.status === 401) {
            navigate("/", { replace: true });
            throw new Error("로그인이 필요합니다.");
          }

          throw new Error("날씨 정보를 불러오지 못했습니다.");
        }
        return res.json();
      })
      .then((data) => {
        setData(data);
      })
      .catch(() => {
        setError("날씨 정보를 불러오지 못했습니다.");
      });
  }, [navigate]);

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTimestamp = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hour = String(date.getHours()).padStart(2, "0");
    const minute = String(date.getMinutes()).padStart(2, "0");
    const second = String(date.getSeconds()).padStart(2, "0");
    return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
  };

  const formatObservedTime = (tm) => {
    if (tm == null) {
      return "-";
    }

    const raw = String(tm).replace(/\D/g, "");
    if (raw.length < 12) {
      return String(tm);
    }

    const year = raw.slice(0, 4);
    const month = raw.slice(4, 6);
    const day = raw.slice(6, 8);
    const hour = raw.slice(8, 10);
    const minute = raw.slice(10, 12);
    const second = raw.length >= 14 ? raw.slice(12, 14) : "00";

    return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
  };

  if (error) {
    return (
      <div className="h-full bg-gray-100 p-8">
        <div className="mx-auto max-w-5xl rounded-2xl border border-red-200 bg-white p-6 text-red-600 shadow-sm">
          {error}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="h-full bg-gray-100 p-8">
        <div className="mx-auto max-w-5xl rounded-2xl border border-gray-200 bg-white p-6 text-gray-700 shadow-sm">
          불러오는 중...
        </div>
      </div>
    );
  }

  const latest = weather[0];
  const metrics = [
    { label: "관측시간", value: formatObservedTime(latest?.tm) },
    { label: "풍향", value: latest?.wd ?? "-" },
    { label: "풍속", value: latest?.ws != null ? `${latest.ws} m/s` : "-" },
    { label: "기온", value: latest?.ta != null ? `${latest.ta} °C` : "-" },
    { label: "습도", value: latest?.hm != null ? `${latest.hm} %` : "-" },
    { label: "강수량", value: latest?.rn != null ? `${latest.rn} mm` : "-" },
  ];
  const warnings = [
    { label: "강풍주의보", active: data.windWarning },
    { label: "건조주의보", active: data.dryWarning },
  ];
  const currentTime = formatTimestamp(now);

  return (
    <div className="h-full w-full bg-slate-100 p-4 sm:p-5">
      <div className="relative h-full w-full">
        <div className="grid h-full grid-cols-1 grid-rows-4 gap-4 lg:grid-cols-2 lg:grid-rows-2">
          <section className="flex min-h-0 flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">센서값</h2>
            <div className="mt-4 min-h-0 flex-1 rounded-xl border border-slate-200 bg-slate-50" />
          </section>

          <section className="flex min-h-0 flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">CCTV</h2>
            <div className="mt-4 min-h-0 flex-1 rounded-xl border border-slate-200 bg-slate-50" />
          </section>

          <section className="flex min-h-0 flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">날씨정보</h2>
              <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
                현재 {currentTime}
              </span>
            </div>
            <div className="mt-4 min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
              {weather.length > 0 ? (
                <div className="grid grid-cols-2 gap-3">
                  {metrics.map((item) => (
                    <div
                      key={item.label}
                      className="rounded-xl border border-slate-200 bg-slate-50 p-3 shadow-sm"
                    >
                      <p className="text-xs font-semibold tracking-wide text-slate-500">
                        {item.label}
                      </p>
                      <p className="mt-1 text-base font-bold text-slate-900">
                        {item.value}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-slate-700">
                  표시할 날씨 데이터가 없습니다.
                </div>
              )}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {warnings.map((warning) => (
                  <div
                    key={warning.label}
                    className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm"
                  >
                    <p className="text-sm font-semibold text-slate-600">{warning.label}</p>
                    <p
                      className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-sm font-bold ${
                        warning.active
                          ? "bg-rose-50 text-rose-700"
                          : "bg-emerald-50 text-emerald-700"
                      }`}
                    >
                      {warning.active ? "발령" : "미발령"}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="flex min-h-0 flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">평가</h2>
            <div className="mt-4 min-h-0 flex-1 rounded-xl border border-slate-200 bg-slate-50" />
          </section>
        </div>
      </div>
    </div>
  );
}

export default Weather;