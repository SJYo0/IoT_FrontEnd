import { AlertTriangle, CalendarDays, Leaf, Sparkles, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch, readApiMessage } from "../Auth/api";
import { getSelectedDeviceMac } from "../envControl/deviceControlApi";

const APPLIANCES = [
  { key: "air_conditioner", label: "에어컨" },
  { key: "heating", label: "히터" },
  { key: "humidifier", label: "가습기" },
  { key: "dehumidifier", label: "제습기" },
  { key: "air_cleaner", label: "공기청정기" },
];

function toText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function toNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function formatKoreanDate(date) {
  const d = date instanceof Date ? date : new Date(date);
  const weekdays = ["일", "월", "화", "수", "목", "금", "토"];
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 (${weekdays[d.getDay()]})`;
}

function toDateInputValue(date) {
  const d = date instanceof Date ? date : new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function AiReportPage() {
  const navigate = useNavigate();
  const [selectedMac, setSelectedMac] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [report, setReport] = useState(null);
  const [reportCreatedAt, setReportCreatedAt] = useState("");
  const [selectedDate, setSelectedDate] = useState(toDateInputValue(new Date()));

  useEffect(() => {
    const applySelectedMac = (mac) => {
      setSelectedMac(String(mac || "").trim());
    };

    applySelectedMac(getSelectedDeviceMac());
    const onDeviceSelected = (event) => applySelectedMac(event?.detail?.mac || "");
    window.addEventListener("iot-device-selected", onDeviceSelected);
    return () => window.removeEventListener("iot-device-selected", onDeviceSelected);
  }, []);

  useEffect(() => {
    let active = true;
    const loadReport = async () => {
      if (!selectedMac) {
        if (!active) return;
        setLoading(false);
        setError("");
        setReport(null);
        setReportCreatedAt("");
        return;
      }
      setLoading(true);
      setError("");
      try {
        const query = `?mac=${encodeURIComponent(selectedMac)}&date=${encodeURIComponent(selectedDate)}`;
        const reportRes = await apiFetch(`/api/ai/report/daily${query}`);

        if (reportRes.status === 204) {
          if (!active) return;
          setReport(null);
          setReportCreatedAt("");
        } else if (reportRes.ok) {
          const payload = await reportRes.json();
          if (!active) return;
          setReport(payload?.result ?? null);
          setReportCreatedAt(payload?.createdAt ?? "");
        } else {
          if (reportRes.status === 401) {
            throw new Error("로그인이 만료되었습니다. 다시 로그인해주세요.");
          }
          if (reportRes.status === 404) {
            throw new Error("AI 리포트 일별 조회 API가 아직 반영되지 않았습니다. 백엔드를 재시작해주세요.");
          }
          const apiMessage = await readApiMessage(reportRes, "AI 리포트 결과를 불러오지 못했습니다.");
          throw new Error(apiMessage);
        }
      } catch (e) {
        if (!active) return;
        const message = String(e?.message || "AI 리포트를 불러오지 못했습니다.");
        setError(message);
        if (message.includes("로그인이 만료되었습니다")) {
          setTimeout(() => navigate("/", { replace: true }), 800);
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    loadReport();
    return () => {
      active = false;
    };
  }, [selectedMac, selectedDate, navigate]);

  const reportDate = selectedDate || (reportCreatedAt ? toDateInputValue(new Date(reportCreatedAt)) : toDateInputValue(new Date()));
  const totalReport = toText(report?.total_report);
  const alarmNotes = Array.isArray(report?.alarm_key_notes) ? report.alarm_key_notes : [];
  const controlNotes = report?.control_key_notes && typeof report.control_key_notes === "object" ? report.control_key_notes : {};
  const usedEnergy = toNumber(controlNotes.used_energy, 0);
  const controlComment = toText(controlNotes.comment);
  const stats = APPLIANCES.map((item) => {
    const raw = controlNotes?.[item.key] ?? {};
    return {
      ...item,
      count: toNumber(raw?.count, 0),
      runtime: toNumber(raw?.runtime, 0),
    };
  });

  return (
    <div
      className="h-full min-h-[calc(100vh-80px)] overflow-y-auto bg-slate-50 px-8 py-7 antialiased"
      style={{
        fontFamily: '"Pretendard","Noto Sans KR","Apple SD Gothic Neo","Malgun Gothic",-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',
      }}
    >
      <div className="mx-auto max-w-[1360px]">
        <div className="mb-3 flex items-start justify-between">
          <div>
            <h2 className="text-[32px] font-semibold leading-none text-[#0f1f44]">AI 일간 리포트</h2>
            <p className="mt-1 text-[15px] font-medium leading-tight text-[#7f90ad]">
              실내 센서 데이터와 실외 날씨를 종합 분석한 일일 보고서입니다.
            </p>
          </div>
          <div className="mt-1 flex items-center gap-2 rounded-xl border border-[#e4ebff] bg-[#f9fbff] px-3 py-1.5 text-[13px] font-semibold text-[#4b5dff]">
            <CalendarDays className="h-4 w-4 shrink-0" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="rounded-md border border-[#d8e2ff] bg-white px-2 py-1 text-[12px] font-medium text-[#33456d] outline-none focus:border-[#9bb1ff]"
            />
            <span className="text-[12px] text-[#4b5dff]">{formatKoreanDate(reportDate)}</span>
          </div>
        </div>

        {error ? (
          <div className="rounded-xl border border-rose-200 bg-white p-4 text-sm font-medium text-rose-600">{error}</div>
        ) : loading ? (
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="h-32 animate-pulse rounded-lg bg-slate-100" />
          </div>
        ) : (
          <>
            <section
              className={`rounded-[20px] border border-[#2f49f7] bg-gradient-to-b from-[#3d53ff] to-[#2041f3] px-5 py-4 text-white ${
                selectedMac ? "min-h-[210px]" : "min-h-[270px]"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Sparkles className="h-4.5 w-4.5 text-[#ffe15a]" />
                <p className="text-[22px] font-semibold text-white">AI 종합 요약</p>
              </div>
              <p className="mt-2 text-[18px] font-semibold leading-[1.5] whitespace-pre-line text-white">
                "{totalReport || (selectedMac ? "선택한 날짜의 분석 결과가 아직 없습니다." : "선택된 기기가 없습니다.")}"
              </p>
            </section>

            <section className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[1.08fr_1fr]">
              <article className="min-h-[470px] rounded-[20px] border border-[#e8edf8] bg-white px-4 py-4">
                <div className="mb-2.5 flex items-center gap-2 text-[#0f1f44]">
                  <AlertTriangle className="h-5 w-5 text-[#ff3f67]" />
                  <h3 className="text-[27px] font-semibold">주요 알람 특이사항</h3>
                </div>
                <div className="space-y-2.5">
                  {(alarmNotes.length > 0
                    ? alarmNotes
                    : [
                        {
                          title: "알람 정보 없음",
                          content: selectedMac ? "선택한 날짜의 알람 특이사항이 없습니다." : "선택된 기기가 없습니다.",
                        },
                      ]
                  ).map(
                    (item, idx) => {
                      const title = toText(item?.title) || `알람 특이사항 ${idx + 1}`;
                      const content = toText(item?.content) || "세부 내용이 없습니다.";
                      return (
                        <div key={`${title}-${idx}`} className="rounded-lg border border-transparent bg-white px-2.5 py-2">
                          <div className="flex items-start gap-2.5">
                            <span className="mt-2.5 h-2 w-2 shrink-0 rounded-full bg-rose-500" />
                            <div className="min-w-0">
                              <p className="text-[18px] font-semibold text-[#1a2a55]">{title}</p>
                              <p className="mt-0.5 text-[14px] font-medium leading-[1.45] text-[#5e708f]">{content}</p>
                            </div>
                          </div>
                        </div>
                      );
                    },
                  )}
                </div>
              </article>

              <article className="space-y-3">
                <div className="min-h-[300px] rounded-[20px] border border-[#e8edf8] bg-white px-4 py-4">
                  <div className="mb-2.5 flex items-center gap-2">
                    <Leaf className="h-5 w-5 text-emerald-600" />
                    <h3 className="text-[27px] font-semibold text-[#0f1f44]">AI 인프라 제어 효율</h3>
                  </div>
                  <div className="grid grid-cols-5 gap-2.5">
                    {stats.map((item) => (
                      <div key={item.key} className="rounded-xl border border-[#edf2fb] bg-[#fcfdff] px-2 py-2 text-center">
                        <p className="text-[13px] font-semibold text-[#3b4f74]">{item.label}</p>
                        <p className="mt-0.5 text-[20px] font-semibold text-[#111f3f]">{item.count}회</p>
                        <p className="text-[12px] font-medium text-[#7a8dac]">
                          가동시간 {item.runtime}분
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 flex items-center justify-between rounded-xl border border-[#e8eef9] bg-white px-3 py-2">
                    <p className="text-[18px] font-semibold text-[#1b2d54]">총 에너지 사용량 추정</p>
                    <div className="inline-flex items-center gap-2">
                      <p className="text-[30px] font-semibold text-[#101f40]">{usedEnergy.toFixed(1)}</p>
                      <p className="text-[13px] font-medium text-[#778cae]">kWh</p>
                      <TrendingUp className="h-4 w-4 text-rose-500" />
                    </div>
                  </div>
                </div>

                <div className="min-h-[180px] rounded-[20px] border border-[#dfe8ff] bg-[#f4f7ff] px-4 py-4">
                  <div className="mb-2 flex items-center gap-2 text-indigo-700">
                    <Sparkles className="h-4 w-4" />
                    <p className="text-[21px] font-semibold">AI 제어 효율 코멘트</p>
                  </div>
                  <p className="text-[14px] font-medium leading-[1.5] text-[#41567f]">
                    {controlComment ||
                      (selectedMac
                        ? "제어 효율 분석 코멘트가 아직 없습니다. AI 리포트 데이터가 수신되면 자동으로 표시됩니다."
                        : "선택된 기기가 없습니다.")}
                  </p>
                </div>
              </article>
            </section>
          </>
        )}
      </div>
    </div>
  );
}

export default AiReportPage;
