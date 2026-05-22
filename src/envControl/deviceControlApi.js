import { apiFetch } from "../Auth/api";

export const SELECTED_DEVICE_MAC_KEY = "iot.selectedDeviceMac";

export const DEFAULT_DEVICE_CONTROL_STATE = {
  windowNorth: false,
  windowSouth: false,
  windowEast: false,
  windowWest: false,
  aircon: false,
  heater: false,
  humidifier: false,
  dehumidifier: false,
  airCleaner: false,
  sprinkler: false,
  fireAlarm: false,
};

function toBoolean(value, fallback = false) {
  return typeof value === "boolean" ? value : fallback;
}

function normalizeState(payload) {
  return {
    windowNorth: toBoolean(payload?.windowNorth, DEFAULT_DEVICE_CONTROL_STATE.windowNorth),
    windowSouth: toBoolean(payload?.windowSouth, DEFAULT_DEVICE_CONTROL_STATE.windowSouth),
    windowEast: toBoolean(payload?.windowEast, DEFAULT_DEVICE_CONTROL_STATE.windowEast),
    windowWest: toBoolean(payload?.windowWest, DEFAULT_DEVICE_CONTROL_STATE.windowWest),
    aircon: toBoolean(payload?.aircon, DEFAULT_DEVICE_CONTROL_STATE.aircon),
    heater: toBoolean(payload?.heater, DEFAULT_DEVICE_CONTROL_STATE.heater),
    humidifier: toBoolean(payload?.humidifier, DEFAULT_DEVICE_CONTROL_STATE.humidifier),
    dehumidifier: toBoolean(payload?.dehumidifier, DEFAULT_DEVICE_CONTROL_STATE.dehumidifier),
    airCleaner: toBoolean(payload?.airCleaner, DEFAULT_DEVICE_CONTROL_STATE.airCleaner),
    sprinkler: toBoolean(payload?.sprinkler, DEFAULT_DEVICE_CONTROL_STATE.sprinkler),
    fireAlarm: toBoolean(payload?.fireAlarm, DEFAULT_DEVICE_CONTROL_STATE.fireAlarm),
  };
}

export function getSelectedDeviceMac() {
  const savedMac =
    sessionStorage.getItem(SELECTED_DEVICE_MAC_KEY) ||
    localStorage.getItem(SELECTED_DEVICE_MAC_KEY) ||
    "";
  return String(savedMac || "").trim();
}

export async function fetchDeviceControlState(kind, mac) {
  const normalizedMac = String(mac || "").trim();
  if (!normalizedMac) {
    return { ...DEFAULT_DEVICE_CONTROL_STATE };
  }

  const response = await apiFetch(`/api/control/${kind}?mac=${encodeURIComponent(normalizedMac)}`);
  if (!response.ok) {
    throw new Error("장치 제어 상태를 불러오지 못했습니다.");
  }

  const payload = await response.json();
  return normalizeState(payload);
}

export async function saveDeviceControlState(kind, mac, state) {
  const normalizedMac = String(mac || "").trim();
  if (!normalizedMac) {
    return { ...DEFAULT_DEVICE_CONTROL_STATE };
  }

  const response = await apiFetch(`/api/control/${kind}?mac=${encodeURIComponent(normalizedMac)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(state),
  });
  if (!response.ok) {
    throw new Error("장치 제어 상태를 저장하지 못했습니다.");
  }
  const payload = await response.json();
  return normalizeState(payload);
}
