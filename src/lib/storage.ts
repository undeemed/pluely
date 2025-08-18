import { SettingsState } from "@/types";
import { STORAGE_KEYS, DEFAULT_SYSTEM_PROMPT } from "@/config";

const defaultSettings: SettingsState = {
  selectedProvider: "",
  apiKey: "",
  isApiKeySubmitted: false,
  selectedModel: "",
  customModel: "",
  systemPrompt: DEFAULT_SYSTEM_PROMPT,
  availableModels: [],
  isLoadingModels: false,
  modelsFetchError: null,
  openAiApiKey: "",
  isOpenAiApiKeySubmitted: false,
};

export const loadSettingsFromStorage = (): SettingsState => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (stored) {
      return { ...defaultSettings, ...JSON.parse(stored) };
    }
  } catch (error) {
    console.error("Failed to load settings from localStorage:", error);
  }
  return defaultSettings;
};

export const saveSettingsToStorage = (settings: SettingsState) => {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (error) {
    console.error("Failed to save settings to localStorage:", error);
  }
};

export const getSettings = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};
