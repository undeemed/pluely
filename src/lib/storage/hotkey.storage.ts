import { STORAGE_KEYS } from "@/config";

export interface HotkeySettings {
  toggle: string;
  audio: string;
  screenshot: string;
  systemAudio: string;
}

export const DEFAULT_HOTKEY_SETTINGS: HotkeySettings = {
  toggle: "cmd+backslash", // Will be converted to platform-specific defaults
  audio: "cmd+shift+a",
  screenshot: "cmd+shift+s", 
  systemAudio: "cmd+shift+m",
};

/**
 * Get platform-specific default hotkey settings
 */
export const getPlatformDefaultHotkeys = (): HotkeySettings => {
  const platform = navigator.platform.toLowerCase();
  if (platform.includes("mac")) {
    return {
      toggle: "cmd+backslash",
      audio: "cmd+shift+a",
      screenshot: "cmd+shift+s",
      systemAudio: "cmd+shift+m",
    };
  } else {
    return {
      toggle: "ctrl+backslash",
      audio: "ctrl+shift+a",
      screenshot: "ctrl+shift+s",
      systemAudio: "ctrl+shift+m",
    };
  }
};

/**
 * Get hotkey settings from localStorage
 */
export const getHotkeySettings = (): HotkeySettings => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.HOTKEY_SETTINGS);
    if (stored) {
      return JSON.parse(stored);
    }
    return getPlatformDefaultHotkeys();
  } catch (error) {
    console.error("Failed to get hotkey settings:", error);
    return getPlatformDefaultHotkeys();
  }
};

/**
 * Save hotkey settings to localStorage
 */
export const setHotkeySettings = (settings: HotkeySettings): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.HOTKEY_SETTINGS, JSON.stringify(settings));
  } catch (error) {
    console.error("Failed to save hotkey settings:", error);
  }
};

/**
 * Update a specific hotkey
 */
export const updateHotkey = (
  key: keyof HotkeySettings,
  value: string
): HotkeySettings => {
  const currentSettings = getHotkeySettings();
  const newSettings = { ...currentSettings, [key]: value };
  setHotkeySettings(newSettings);
  return newSettings;
};

/**
 * Reset hotkeys to platform defaults
 */
export const resetHotkeysToDefaults = (): HotkeySettings => {
  const defaultSettings = getPlatformDefaultHotkeys();
  setHotkeySettings(defaultSettings);
  return defaultSettings;
};

/**
 * Validate hotkey format
 */
export const validateHotkey = (hotkey: string): boolean => {
  // Basic validation for common hotkey patterns
  const validPattern = /^(cmd|ctrl|alt|shift|meta)(\+[a-z0-9]+)*$/i;
  return validPattern.test(hotkey);
};

/**
 * Check for hotkey conflicts
 */
export const checkHotkeyConflicts = (
  hotkey: string, 
  currentHotkeys: HotkeySettings, 
  excludeKey?: keyof HotkeySettings
): { hasConflict: boolean; conflictingKey?: keyof HotkeySettings } => {
  for (const [key, value] of Object.entries(currentHotkeys)) {
    if (excludeKey && key === excludeKey) continue;
    if (value.toLowerCase() === hotkey.toLowerCase()) {
      return { hasConflict: true, conflictingKey: key as keyof HotkeySettings };
    }
  }
  return { hasConflict: false };
};

/**
 * Get conflict message
 */
export const getConflictMessage = (conflictingKey: keyof HotkeySettings): string => {
  const keyNames = {
    toggle: "Toggle Window",
    audio: "Voice Input", 
    screenshot: "Screenshot",
    systemAudio: "System Audio"
  };
  return `This hotkey is already used by ${keyNames[conflictingKey]}`;
};

/**
 * Format hotkey for display
 */
export const formatHotkeyForDisplay = (hotkey: string): string => {
  return hotkey
    .replace(/cmd/gi, "⌘")
    .replace(/ctrl/gi, "Ctrl")
    .replace(/alt/gi, "Alt")
    .replace(/shift/gi, "Shift")
    .replace(/meta/gi, "Meta")
    .replace(/\+/g, " + ")
    .replace(/backslash/gi, "\\")
    .replace(/space/gi, "Space")
    .replace(/enter/gi, "Enter")
    .replace(/tab/gi, "Tab")
    .replace(/escape/gi, "Esc");
};
