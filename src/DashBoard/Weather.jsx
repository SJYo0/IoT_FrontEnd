import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch, readApiMessage } from "../Auth/api";

function Weather() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
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

  const logout = async () => {
    try {
      const response = await apiFetch("/api/auth/logout", {
        method: "POST",
      });

      if (!response.ok) {
        setError(await readApiMessage(response, "로그아웃에 실패했습니다."));
        return;
      }
    } catch {
      setError("로그아웃에 실패했습니다.");
      return;
    }

    navigate("/", { replace: true });
  };

  if (error) return <p>{error}</p>;
  if (!data) return <p>불러오는 중...</p>;

  return (
    <div>
      <h1>날씨 정보</h1>

      {weather.length > 0 ? (
        <div>
          <p>시간: {weather[0].tm}</p>
          <p>풍향: {weather[0].wd}</p>
          <p>풍속: {weather[0].ws} m/s</p>
          <p>기온: {weather[0].ta} °C</p>
          <p>습도: {weather[0].hm} %</p>
          <p>강수량: {weather[0].rn} mm</p>
        </div>
      ) : (
        <p>표시할 날씨 데이터가 없습니다.</p>
      )}

      <div style={{ marginTop: "20px" }}>
        <p>강풍주의보: {data.windWarning ? "발령" : "미발령"}</p>
        <p>건조주의보: {data.dryWarning ? "발령" : "미발령"}</p>
      </div>

      <button style={{ marginTop: "20px" }} onClick={logout}>
        로그아웃
      </button>
    </div>
  );
}

export default Weather;