const STORAGE_KEY = "shobdo.openrouterApiKey";
const MODEL_KEY = "shobdo.openrouterModel";

let current = "";
let currentModel = "";
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

export function subscribeApiKey(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getApiKey() {
  return current;
}

export function getServerApiKey() {
  return "";
}

export function setApiKey(next: string) {
  current = next;
  if (typeof window !== "undefined") {
    const trimmed = next.trim();
    if (trimmed) localStorage.setItem(STORAGE_KEY, trimmed);
    else localStorage.removeItem(STORAGE_KEY);
  }
  emit();
}

export function getStoredModel() {
  return currentModel;
}

export function setStoredModel(next: string) {
  currentModel = next;
  if (typeof window !== "undefined") {
    const trimmed = next.trim();
    if (trimmed) localStorage.setItem(MODEL_KEY, trimmed);
    else localStorage.removeItem(MODEL_KEY);
  }
  emit();
}

export function loadApiKey() {
  if (typeof window === "undefined") return;
  const saved = localStorage.getItem(STORAGE_KEY) ?? "";
  const savedModel = localStorage.getItem(MODEL_KEY) ?? "";
  let changed = false;
  if (saved !== current) {
    current = saved;
    changed = true;
  }
  if (savedModel !== currentModel) {
    currentModel = savedModel;
    changed = true;
  }
  if (changed) emit();
}
