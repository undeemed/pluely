import { SettingsState } from "./types";

// Local storage key
const STORAGE_KEY = "settings";

const defaultSettings: SettingsState = {
  selectedProvider: "",
  apiKey: "",
  isApiKeySubmitted: false,
  selectedModel: "",
  customModel: "",
  systemPrompt:
    "You are a helpful AI assistant. Be concise, accurate, and friendly in your responses",
  availableModels: [],
  isLoadingModels: false,
  modelsFetchError: null,
};

export const loadSettingsFromStorage = (): SettingsState => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
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
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error("Failed to save settings to localStorage:", error);
  }
};

// Utility function to get nested object values safely
const getNestedValue = (obj: any, path: string): any => {
  return path.split(".").reduce((current, key) => {
    if (key.includes("[") && key.includes("]")) {
      const arrayKey = key.substring(0, key.indexOf("["));
      const index = parseInt(
        key.substring(key.indexOf("[") + 1, key.indexOf("]"))
      );
      return current?.[arrayKey]?.[index];
    }
    return current?.[key];
  }, obj);
};

export async function fetchModels(
  provider: any,
  apiKey: string
): Promise<string[]> {
  // If provider doesn't support model fetching, return empty array
  if (!provider.models) {
    throw new Error("Provider does not support model fetching");
  }

  let url = `${provider.baseUrl}${provider.models.endpoint}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  // Handle authentication based on provider type
  if (provider.authType === "bearer") {
    headers["Authorization"] = `Bearer ${apiKey}`;
  } else if (provider.authType === "x-api-key") {
    headers["x-api-key"] = apiKey;
  } else if (provider.authType === "query" && provider.authParam) {
    // For Gemini, append query param
    url += `?${provider.authParam}=${apiKey}`;
  }

  const response = await fetch(url, {
    method: provider.models.method || "GET",
    headers,
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch models: ${response.status} ${response.statusText}`
    );
  }

  const data = await response.json();

  // Extract models array using the response path
  const modelsArray = getNestedValue(data, provider.models.responsePath) || [];

  if (!Array.isArray(modelsArray)) {
    throw new Error("Invalid response format: models data is not an array");
  }

  // Extract model IDs using the specified ID key
  return modelsArray
    .map((model: any) => model[provider.models.idKey])
    .filter((id: string) => id && typeof id === "string")
    .sort();
}
