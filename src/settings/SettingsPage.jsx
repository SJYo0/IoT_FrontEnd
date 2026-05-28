import { Sun, Wind, Droplets, Flame, Save } from "lucide-react";
import { useEffect, useState } from "react";
import {
  DEFAULT_DEVICE_CONTROL_STATE,
  fetchDeviceControlState,
  getSelectedDeviceMac,
  saveDeviceControlState,
} from "../envControl/deviceControlApi";

const SECTION_DATA = [
  {
    title: "창문 (방위별) 유무 및 제어 권한",
    icon: Sun,
    accent: "text-amber-500",
    items: [
      { key: "windowNorth", title: "북향 창문" },
      { key: "windowSouth", title: "남향 창문" },
      { key: "windowEast", title: "동향 창문" },
      { key: "windowWest", title: "서향 창문" },
    ],
  },
  {
    title: "냉난방 기기 연동",
    icon: Wind,
    accent: "text-sky-500",
    items: [
      { key: "aircon", title: "에어컨 (냉방)", desc: "스마트 에어컨 온도 자동 조절 허용" },
      { key: "heater", title: "히터/보일러 (난방)", desc: "스마트 보일러기기 온도 자동 조절 허용" },
    ],
  },
  {
    title: "공기질 및 습도 제어 기기",
    icon: Droplets,
    accent: "text-emerald-500",
    items: [
      { key: "humidifier", title: "가습기" },
      { key: "dehumidifier", title: "제습기" },
      { key: "airCleaner", title: "공기청정기" },
    ],
  },
  {
    title: "안전 및 소방 시스템",
    icon: Flame,
    accent: "text-rose-500",
    items: [
      { key: "sprinkler", title: "스프링클러 시스템", desc: "비상 시 자동 가동 및 상태 모니터링" },
      { key: "fireAlarm", title: "화재 경보기", desc: "연기/열 감지기 상태 모니터링" },
    ],
  },
];

function ToggleCard({ title, desc, checked, onChange, disabled = false }) {
  return (
    <div className="flex min-h-[72px] items-center justify-between rounded-2xl border border-indigo-200/70 bg-white px-5 py-4">
      <div className="pr-4">
        <p className="text-[20px] font-semibold tracking-[-0.01em] text-slate-800">{title}</p>
        {desc && <p className="mt-1 text-[15px] font-medium text-slate-500">{desc}</p>}
      </div>
      <button
        type="button"
        onClick={disabled ? undefined : onChange}
        disabled={disabled}
        className={`relative inline-flex h-8 w-14 shrink-0 items-center rounded-full p-1 transition-colors ${
          checked ? "bg-indigo-600" : "bg-slate-200"
        } ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
        aria-pressed={checked}
      >
        <span
          className={`h-6 w-6 rounded-full bg-white shadow-sm transition-transform ${
            checked ? "translate-x-6" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}

function SettingsPage() {
  const [toggles, setToggles] = useState(DEFAULT_DEVICE_CONTROL_STATE);
  const [selectedMac, setSelectedMac] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveButtonState, setSaveButtonState] = useState("idle");

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
        if (active) setToggles(DEFAULT_DEVICE_CONTROL_STATE);
        return;
      }
      try {
        const loaded = await fetchDeviceControlState("environment", selectedMac);
        if (active) setToggles(loaded);
      } catch {
        if (active) setToggles(DEFAULT_DEVICE_CONTROL_STATE);
      }
    };

    loadState();
    return () => {
      active = false;
    };
  }, [selectedMac]);

  const toggleItem = (key) => {
    if (!selectedMac) return;
    setToggles((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const saveSettings = async () => {
    if (!selectedMac || isSaving) return;
    setIsSaving(true);
    setSaveButtonState("saving");
    try {
      const saved = await saveDeviceControlState("environment", selectedMac, toggles);
      setToggles(saved);
      setSaveButtonState("success");
    } catch {
      // keep optimistic local state and allow retry
      setSaveButtonState("idle");
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    if (saveButtonState !== "success") return undefined;
    const timer = window.setTimeout(() => setSaveButtonState("idle"), 2200);
    return () => window.clearTimeout(timer);
  }, [saveButtonState]);

  return (
    <div className="min-h-full bg-[#eef1f6] px-8 py-8">
      <div className="mx-auto max-w-[1320px]">
        <h2 className="text-[38px] font-extrabold tracking-[-0.02em] text-slate-900">환경 제어 설정</h2>
        <p className="mt-2 text-[16px] font-medium text-slate-500">
          AI가 제어할 수 있는 실내 환경 요소를 설정합니다.
        </p>

        <div className="mt-7 space-y-5 pb-8">
          {SECTION_DATA.map((section) => {
            const SectionIcon = section.icon;
            return (
              <section
                key={section.title}
                className="rounded-[22px] border border-slate-200/80 bg-white px-6 py-6 shadow-[0_1px_4px_rgba(15,23,42,0.06)]"
              >
                <div className="mb-5 flex items-center gap-3 border-b border-slate-200 pb-4">
                  <SectionIcon className={`h-5 w-5 ${section.accent}`} />
                  <h3 className="text-[27px] font-bold tracking-[-0.02em] text-slate-900">{section.title}</h3>
                </div>

                <div className={`grid gap-4 ${section.items.length === 4 ? "grid-cols-1 xl:grid-cols-4" : "grid-cols-1 xl:grid-cols-2"}`}>
                  {section.items.map((item) => (
                    <ToggleCard
                      key={item.key}
                      title={item.title}
                      desc={item.desc}
                      checked={Boolean(toggles[item.key])}
                      disabled={!selectedMac}
                      onChange={() => toggleItem(item.key)}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>

        <div className="sticky bottom-6 mt-2 flex justify-end">
          <button
            type="button"
            onClick={saveSettings}
            disabled={!selectedMac || isSaving}
            className={`inline-flex items-center gap-2 rounded-2xl px-9 py-4 text-[22px] font-bold text-white shadow-[0_8px_20px_rgba(79,70,229,0.35)] transition ${
              isSaving
                ? "cursor-not-allowed bg-indigo-600/80"
                : saveButtonState === "success"
                  ? "bg-emerald-600 hover:bg-emerald-700"
                  : "bg-indigo-600 hover:bg-indigo-700"
            }`}
          >
            {saveButtonState === "saving" ? null : <Save className="h-5 w-5" />}
            {saveButtonState === "success" ? "저장 완료" : "설정 저장하기"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default SettingsPage;
