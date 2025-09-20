import { useState, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { 
  getHotkeySettings, 
  updateHotkey,
  resetHotkeysToDefaults,
  HotkeySettings as HotkeySettingsType
} from "@/lib/storage";

export const useHotkeys = () => {
  const [hotkeys, setHotkeys] = useState<HotkeySettingsType>(getHotkeySettings());
  const [isUpdating, setIsUpdating] = useState(false);

  // Load hotkeys from storage on mount
  useEffect(() => {
    const storedHotkeys = getHotkeySettings();
    setHotkeys(storedHotkeys);
  }, []);

  // Update hotkey in storage and backend
  const updateHotkeySetting = useCallback(async (key: keyof HotkeySettingsType, value: string) => {
    setIsUpdating(true);
    try {
      // Update local storage
      const newHotkeys = updateHotkey(key, value);
      setHotkeys(newHotkeys);

      // Update backend shortcuts
      await invoke("update_shortcuts", { shortcuts: newHotkeys });
    } catch (error) {
      console.error("Failed to update hotkey:", error);
      // Revert local changes on error
      const originalHotkeys = getHotkeySettings();
      setHotkeys(originalHotkeys);
      throw error;
    } finally {
      setIsUpdating(false);
    }
  }, []);

  // Reset all hotkeys to defaults
  const resetHotkeys = useCallback(async () => {
    setIsUpdating(true);
    try {
      const defaultHotkeys = resetHotkeysToDefaults();
      setHotkeys(defaultHotkeys);

      // Update backend shortcuts
      await invoke("update_shortcuts", { shortcuts: defaultHotkeys });
    } catch (error) {
      console.error("Failed to reset hotkeys:", error);
      throw error;
    } finally {
      setIsUpdating(false);
    }
  }, []);

  // Check if shortcuts are registered
  const checkShortcutsRegistered = useCallback(async (): Promise<boolean> => {
    try {
      return await invoke<boolean>("check_shortcuts_registered");
    } catch (error) {
      console.error("Failed to check shortcuts:", error);
      return false;
    }
  }, []);

  return {
    hotkeys,
    updateHotkeySetting,
    resetHotkeys,
    checkShortcutsRegistered,
    isUpdating,
  };
};
