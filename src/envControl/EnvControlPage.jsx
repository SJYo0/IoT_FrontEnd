import {
  Bell,
  Droplets,
  Flame,
  Snowflake,
  Sprout,
  Wind,
  Waves,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  DEFAULT_DEVICE_CONTROL_STATE,
  fetchDeviceControlState,
  getSelectedDeviceMac,
  saveDeviceControlState,
} from "./deviceControlApi";

const DEVICE_CONTROL_KEYS = [
  "windowNorth",
  "windowSouth",
  "windowEast",
  "windowWest",
  "aircon",
  "heater",
  "humidifier",
  "dehumidifier",
  "airCleaner",
  "sprinkler",
  "fireAlarm",
];

function isSameState(a, b) {
  return DEVICE_CONTROL_KEYS.every((key) => Boolean(a?.[key]) === Boolean(b?.[key]));
}

function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full p-1 transition-colors ${
        checked ? "bg-sky-500" : "bg-slate-200"
      }`}
      aria-pressed={checked}
    >
      <span
        className={`h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}

function EnvControlPage() {
  const [state, setState] = useState(DEFAULT_DEVICE_CONTROL_STATE);
  const [savedState, setSavedState] = useState(DEFAULT_DEVICE_CONTROL_STATE);
  const [selectedMac, setSelectedMac] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    const applySelectedMac = (mac) => {
      const normalized = String(mac || "").trim();
      setSelectedMac(normalized);
    };

    applySelectedMac(getSelectedDeviceMac());

    const onDeviceSelected = (event) => {
      applySelectedMac(event?.detail?.mac || "");
    };

    window.addEventListener("iot-device-selected", onDeviceSelected);
    return () => window.removeEventListener("iot-device-selected", onDeviceSelected);
  }, []);

  useEffect(() => {
    let active = true;
    const loadState = async () => {
      if (!selectedMac) {
        if (active) {
          setState(DEFAULT_DEVICE_CONTROL_STATE);
          setSavedState(DEFAULT_DEVICE_CONTROL_STATE);
          setSaveMessage("");
        }
        return;
      }
      try {
        const loaded = await fetchDeviceControlState("environment", selectedMac);
        if (active) {
          setState(loaded);
          setSavedState(loaded);
          setSaveMessage("");
        }
      } catch {
        if (active) {
          setState(DEFAULT_DEVICE_CONTROL_STATE);
          setSavedState(DEFAULT_DEVICE_CONTROL_STATE);
          setSaveMessage("환경 설정을 불러오지 못했습니다.");
        }
      }
    };

    loadState();
    return () => {
      active = false;
    };
  }, [selectedMac]);

  const toggle = (key) => {
    setSaveMessage("");
    setState((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const hasChanges = !isSameState(state, savedState);

  useEffect(() => {
    if (!notice) {
      return undefined;
    }
    const timer = window.setTimeout(() => setNotice(null), 2500);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const handleSave = async () => {
    if (isSaving) {
      return;
    }
    if (!selectedMac) {
      setSaveMessage("선택된 디바이스가 없습니다.");
      setNotice({ type: "error", text: "선택된 디바이스가 없습니다." });
      return;
    }
    if (!hasChanges) {
      setSaveMessage("변경사항이 없습니다.");
      setNotice({ type: "error", text: "변경사항이 없습니다." });
      return;
    }
    setIsSaving(true);
    setSaveMessage("");
    try {
      const saved = await saveDeviceControlState("environment", selectedMac, state);
      setState(saved);
      setSavedState(saved);
      setSaveMessage("저장이 완료됐습니다.");
      setNotice({ type: "success", text: "저장이 완료됐습니다." });
    } catch {
      setSaveMessage("환경 설정 저장에 실패했습니다.");
      setNotice({ type: "error", text: "저장에 실패했습니다. 잠시 후 다시 시도해주세요." });
    } finally {
      setIsSaving(false);
    }
  };

  const deviceChips = [
    { key: "aircon", label: "에어컨", icon: Snowflake, activeClass: "bg-cyan-500" },
    { key: "heater", label: "난방기", icon: Flame, activeClass: "bg-cyan-500" },
    { key: "humidifier", label: "가습기", icon: Droplets, activeClass: "bg-cyan-500" },
    { key: "dehumidifier", label: "제습기", icon: Waves, activeClass: "bg-cyan-500" },
    { key: "airCleaner", label: "공기청정기", icon: Wind, activeClass: "bg-emerald-500" },
    { key: "sprinkler", label: "스프링클러", icon: Droplets, activeClass: "bg-cyan-500" },
    { key: "fireAlarm", label: "화재 경보기", icon: Bell, activeClass: "bg-cyan-500" },
  ];
  const topRowChips = deviceChips.slice(0, 5);
  const bottomRowChips = deviceChips.slice(5);

  return (
    <div className="h-full bg-[#eef1f5] px-6 py-6">
      <div className="mx-auto max-w-[1320px]">
        <h2 className="text-[38px] font-extrabold tracking-[-0.02em] text-slate-900">환경 제어 인터페이스</h2>
        <p className="mt-1 text-[16px] font-medium text-slate-500">
          기기가 설치된 공간의 상태를 확인하고 가전 및 창문을 직접 제어합니다.
        </p>

        <div className="mt-6 grid grid-cols-[minmax(0,1fr)_340px] gap-5">
          <section className="rounded-[22px] border border-slate-200 bg-white p-6 shadow-[0_1px_4px_rgba(15,23,42,0.06)]">
            <div className="mb-4 flex items-center justify-between">
              <div className="inline-flex items-center gap-2">
                <Sprout className="h-5 w-5 text-indigo-500" />
                <h3 className="text-[28px] font-bold tracking-[-0.02em] text-slate-900">공간 시각화</h3>
              </div>
              <div className="inline-flex items-center gap-4 text-[12px] font-semibold text-slate-600">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  동작중/열림
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
                  정지/닫힘
                </span>
              </div>
            </div>

            <div className="rounded-[18px] border border-slate-200 bg-[#f6f8fb] p-8">
              <div className="relative mx-auto mt-1 max-w-[760px]">
                <button
                  type="button"
                  onClick={() => toggle("windowNorth")}
                  className={`absolute left-1/2 top-[-16px] z-20 h-8 w-[146px] -translate-x-1/2 rounded-xl border-2 transition ${
                    state.windowNorth ? "border-sky-300 bg-sky-100" : "border-slate-300 bg-slate-200"
                  }`}
                  title={`북쪽 창문 ${state.windowNorth ? "열림" : "닫힘"}`}
                />
                <div
                  className={`absolute left-1/2 top-[-8px] z-20 h-2 w-[62px] -translate-x-1/2 rounded-full transition ${
                    state.windowNorth ? "bg-sky-400/90" : "bg-slate-400/70"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => toggle("windowWest")}
                  className={`absolute left-[-69px] top-1/2 z-20 h-8 w-[146px] -translate-y-1/2 -rotate-90 rounded-xl border-2 transition ${
                    state.windowWest ? "border-sky-300 bg-sky-100" : "border-slate-300 bg-slate-200"
                  }`}
                  title={`서쪽 창문 ${state.windowWest ? "열림" : "닫힘"}`}
                />
                <div
                  className={`pointer-events-none absolute left-[-22px] top-1/2 z-20 h-2 w-[62px] -translate-y-1/2 -rotate-90 rounded-full transition ${
                    state.windowWest ? "bg-sky-400/90" : "bg-slate-400/70"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => toggle("windowEast")}
                  className={`absolute right-[-69px] top-1/2 z-20 h-8 w-[146px] -translate-y-1/2 -rotate-90 rounded-xl border-2 transition ${
                    state.windowEast ? "border-sky-300 bg-sky-100" : "border-slate-300 bg-slate-200"
                  }`}
                  title={`동쪽 창문 ${state.windowEast ? "열림" : "닫힘"}`}
                />
                <div
                  className={`pointer-events-none absolute right-[-22px] top-1/2 z-20 h-2 w-[62px] -translate-y-1/2 -rotate-90 rounded-full transition ${
                    state.windowEast ? "bg-sky-400/90" : "bg-slate-400/70"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => toggle("windowSouth")}
                  className={`absolute bottom-[-16px] left-1/2 z-20 h-8 w-[146px] -translate-x-1/2 rounded-xl border-2 transition ${
                    state.windowSouth ? "border-cyan-300 bg-cyan-100" : "border-slate-300 bg-slate-200"
                  }`}
                  title={`남쪽 창문 ${state.windowSouth ? "열림" : "닫힘"}`}
                />
                <div
                  className={`absolute bottom-[-8px] left-1/2 z-20 h-2 w-[62px] -translate-x-1/2 rounded-full transition ${
                    state.windowSouth ? "bg-cyan-300/90" : "bg-slate-400/70"
                  }`}
                />

                <div className="rounded-[16px] border-[6px] border-slate-700 bg-slate-100 px-8 pb-10 pt-8 shadow-inner">
                  <p className="text-[35px] font-black tracking-[0.08em] text-slate-300">MEETING ROOM</p>

                  <div className="mt-6 grid grid-cols-5 gap-3">
                    {topRowChips.map((chip) => {
                      const ChipIcon = chip.icon;
                      const active = Boolean(state[chip.key]);
                      return (
                        <button
                          key={chip.key}
                          type="button"
                          onClick={() => toggle(chip.key)}
                          className={`h-[98px] rounded-xl border px-3 text-center transition ${
                            active
                              ? `border-transparent ${chip.activeClass} text-white shadow`
                              : "border-slate-200 bg-white text-slate-600"
                          }`}
                        >
                          <ChipIcon className="mx-auto h-6 w-6" />
                          <p className="mt-2 text-[22px] font-bold tracking-[-0.03em]">{chip.label}</p>
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-5 flex justify-center gap-4">
                    {bottomRowChips.map((chip) => {
                      const ChipIcon = chip.icon;
                      const active = Boolean(state[chip.key]);
                      return (
                        <button
                          key={chip.key}
                          type="button"
                          onClick={() => toggle(chip.key)}
                          className={`h-[98px] w-[150px] rounded-xl border px-3 text-center transition ${
                            active
                              ? `border-transparent ${chip.activeClass} text-white shadow`
                              : "border-slate-200 bg-white text-slate-600"
                          }`}
                        >
                          <ChipIcon className="mx-auto h-6 w-6" />
                          <p className="mt-2 text-[22px] font-bold tracking-[-0.03em]">{chip.label}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </section>

          <aside className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-[0_1px_4px_rgba(15,23,42,0.06)]">
            <h3 className="text-[26px] font-bold tracking-[-0.02em] text-slate-900">기기 수동 제어</h3>

            <div className="mt-5 max-h-[640px] space-y-7 overflow-y-auto pr-1">
              <section>
                <p className="mb-3 text-[14px] font-semibold text-slate-500">창문 개폐</p>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-6">
                  <div className="relative mx-auto h-[300px] w-[258px]">
                    <div className="absolute left-1/2 top-[74px] h-[148px] w-[1px] -translate-x-1/2 bg-slate-200" />
                    <div className="absolute left-[55px] top-1/2 h-[1px] w-[148px] -translate-y-1/2 bg-slate-200" />

                    <div className="absolute left-1/2 top-0 w-[100px] -translate-x-1/2">
                      <div className="rounded-2xl border border-slate-200 bg-white px-2 py-2 text-center shadow-sm">
                        <p className="text-[12px] font-semibold text-slate-700">북쪽 창문</p>
                        <div className="mt-1.5 flex justify-center">
                          <Toggle checked={state.windowNorth} onChange={() => toggle("windowNorth")} />
                        </div>
                        <p className={`mt-1 text-[12px] font-semibold ${state.windowNorth ? "text-sky-600" : "text-slate-400"}`}>
                          {state.windowNorth ? "열림" : "닫힘"}
                        </p>
                      </div>
                    </div>

                    <div className="absolute left-0 top-1/2 w-[100px] -translate-y-1/2">
                      <div className="rounded-2xl border border-slate-200 bg-white px-2 py-2 text-center shadow-sm">
                        <p className="text-[12px] font-semibold text-slate-700">서쪽 창문</p>
                        <div className="mt-1.5 flex justify-center">
                          <Toggle checked={state.windowWest} onChange={() => toggle("windowWest")} />
                        </div>
                        <p className={`mt-1 text-[12px] font-semibold ${state.windowWest ? "text-sky-600" : "text-slate-400"}`}>
                          {state.windowWest ? "열림" : "닫힘"}
                        </p>
                      </div>
                    </div>

                    <div className="absolute right-0 top-1/2 w-[100px] -translate-y-1/2">
                      <div className="rounded-2xl border border-slate-200 bg-white px-2 py-2 text-center shadow-sm">
                        <p className="text-[12px] font-semibold text-slate-700">동쪽 창문</p>
                        <div className="mt-1.5 flex justify-center">
                          <Toggle checked={state.windowEast} onChange={() => toggle("windowEast")} />
                        </div>
                        <p className={`mt-1 text-[12px] font-semibold ${state.windowEast ? "text-sky-600" : "text-slate-400"}`}>
                          {state.windowEast ? "열림" : "닫힘"}
                        </p>
                      </div>
                    </div>

                    <div className="absolute left-1/2 bottom-0 w-[100px] -translate-x-1/2">
                      <div className="rounded-2xl border border-slate-200 bg-white px-2 py-2 text-center shadow-sm">
                        <p className="text-[12px] font-semibold text-slate-700">남쪽 창문</p>
                        <div className="mt-1.5 flex justify-center">
                          <Toggle checked={state.windowSouth} onChange={() => toggle("windowSouth")} />
                        </div>
                        <p className={`mt-1 text-[12px] font-semibold ${state.windowSouth ? "text-sky-600" : "text-slate-400"}`}>
                          {state.windowSouth ? "열림" : "닫힘"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <section>
                <p className="mb-3 text-[14px] font-semibold text-slate-500">환경 가전</p>
                <div className="space-y-3">
                  {[
                    { key: "aircon", label: "에어컨", icon: Snowflake },
                    { key: "heater", label: "난방기", icon: Flame },
                    { key: "humidifier", label: "가습기", icon: Droplets },
                    { key: "dehumidifier", label: "제습기", icon: Waves },
                    { key: "airCleaner", label: "공기청정기", icon: Wind },
                    { key: "sprinkler", label: "스프링클러", icon: Droplets },
                    { key: "fireAlarm", label: "화재 경보기", icon: Bell },
                  ].map((item) => {
                    const ItemIcon = item.icon;
                    return (
                      <div key={item.key} className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                        <div className="inline-flex items-center gap-2 text-slate-700">
                          <ItemIcon className="h-4 w-4" />
                          <span className="text-[14px] font-semibold">{item.label}</span>
                        </div>
                        <Toggle checked={state[item.key]} onChange={() => toggle(item.key)} />
                      </div>
                    );
                  })}
                </div>
              </section>
            </div>

            <div className="mt-5 border-t border-slate-200 pt-4">
              {notice ? (
                <div
                  className={`mb-3 rounded-lg px-3 py-2 text-center text-[13px] font-semibold ${
                    notice.type === "success"
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-rose-50 text-rose-700"
                  }`}
                >
                  {notice.text}
                </div>
              ) : null}
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className={`w-full rounded-xl px-4 py-3 text-[15px] font-semibold transition ${
                  isSaving
                    ? "cursor-not-allowed bg-slate-200 text-slate-400"
                    : "bg-sky-500 text-white hover:bg-sky-600"
                }`}
              >
                {isSaving ? "저장 중..." : "설정 저장하기"}
              </button>
              <p className="mt-2 min-h-[20px] text-center text-[12px] font-medium text-slate-500">
                {!selectedMac
                  ? "선택된 디바이스가 없습니다."
                  : saveMessage || (hasChanges ? "변경사항이 있습니다. 저장해주세요." : "저장된 설정입니다.")}
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

export default EnvControlPage;
