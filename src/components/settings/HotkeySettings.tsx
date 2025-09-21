import { useState, useEffect } from "react";
import { Header, Button, Label } from "@/components";
import { useHotkeys } from "@/hooks";
import { 
  validateHotkey,
  formatHotkeyForDisplay,
  checkHotkeyConflicts,
  getConflictMessage,
  HotkeySettings as HotkeySettingsType
} from "@/lib/storage";
import { RotateCcw } from "lucide-react";

interface HotkeySettingsProps {
  className?: string;
}

interface HotkeyItemProps {
  label: string;
  description: string;
  value: string;
  onChange: (value: string) => void;
  onValidate?: (value: string) => boolean;
  currentHotkeys: HotkeySettingsType;
  currentKey: keyof HotkeySettingsType;
}

const HotkeyItem = ({ label, description, value, onChange, onValidate, currentHotkeys, currentKey }: HotkeyItemProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value);
  const [error, setError] = useState("");
  const [isCapturing, setIsCapturing] = useState(false);

  const handleSave = () => {
    if (onValidate && !onValidate(tempValue)) {
      setError("Invalid hotkey format");
      return;
    }
    
    onChange(tempValue);
    setIsEditing(false);
    setError("");
  };

  const handleCancel = () => {
    setTempValue(value);
    setIsEditing(false);
    setError("");
    setIsCapturing(false);
  };


  const handleKeyCapture = (e: any) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isCapturing) return;

    const keys: string[] = [];
    
    // Check for modifier keys
    if (e.metaKey) keys.push("cmd");
    if (e.ctrlKey) keys.push("ctrl");
    if (e.altKey) keys.push("alt");
    if (e.shiftKey) keys.push("shift");
    
    // Get the main key
    let mainKey = e.key.toLowerCase();
    
    // Handle special keys
    switch (mainKey) {
      case "backslash":
        mainKey = "backslash";
        break;
      case " ":
        mainKey = "space";
        break;
      case "enter":
        mainKey = "enter";
        break;
      case "tab":
        mainKey = "tab";
        break;
      case "escape":
        mainKey = "escape";
        break;
      case "arrowup":
        mainKey = "up";
        break;
      case "arrowdown":
        mainKey = "down";
        break;
      case "arrowleft":
        mainKey = "left";
        break;
      case "arrowright":
        mainKey = "right";
        break;
      default:
        // Only allow single character keys
        if (mainKey.length > 1 && !["backslash", "space", "enter", "tab", "escape", "up", "down", "left", "right"].includes(mainKey)) {
          return;
        }
    }
    
    // Don't allow just modifier keys
    if (keys.length === 0) {
      return;
    }
    
    // Add main key
    keys.push(mainKey);
    
    const newHotkey = keys.join("+");
    
    // Validate the hotkey format
    if (onValidate && !onValidate(newHotkey)) {
      setError("Invalid hotkey combination");
      return;
    }
    
    // Check for conflicts
    const conflict = checkHotkeyConflicts(newHotkey, currentHotkeys, currentKey);
    if (conflict.hasConflict && conflict.conflictingKey) {
      setError(getConflictMessage(conflict.conflictingKey));
      return;
    }
    
    setTempValue(newHotkey);
    setIsCapturing(false);
    setError("");
  };

  const startCapture = () => {
    setIsCapturing(true);
    setTempValue("Press keys...");
    setError("");
  };

  // Global key listener for capturing keys
  useEffect(() => {
    const handleGlobalKeyDown = (e: any) => {
      if (isCapturing) {
        handleKeyCapture(e);
      }
    };

    if (isCapturing) {
      document.addEventListener('keydown', handleGlobalKeyDown, true);
      return () => document.removeEventListener('keydown', handleGlobalKeyDown, true);
    }
  }, [isCapturing]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <Label className="text-sm font-medium">{label}</Label>
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        </div>
        <div className="flex items-center gap-2">
          {isEditing ? (
            <div className="flex items-center gap-2">
              <div 
                className={`w-32 px-2 py-1 text-sm font-mono border rounded cursor-pointer transition-colors ${
                  isCapturing 
                    ? "border-primary bg-primary/10 text-primary" 
                    : "border-input bg-background"
                }`}
                onClick={startCapture}
                onKeyDown={handleKeyCapture}
                tabIndex={0}
              >
                {isCapturing ? "Press keys..." : tempValue}
              </div>
              <Button size="sm" onClick={handleSave} variant="outline" disabled={isCapturing}>
                Save
              </Button>
              <Button size="sm" onClick={handleCancel} variant="ghost">
                Cancel
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="px-2 py-1 bg-muted rounded text-sm font-mono">
                {formatHotkeyForDisplay(value)}
              </div>
              <Button 
                size="sm" 
                onClick={() => {
                  setIsEditing(true);
                  setTempValue(value);
                }} 
                variant="outline"
              >
                Edit
              </Button>
            </div>
          )}
        </div>
      </div>
      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}
    </div>
  );
};

export const HotkeySettings = ({ className }: HotkeySettingsProps) => {
  const { hotkeys, updateHotkeySetting, resetHotkeys, isUpdating } = useHotkeys();
  const [isResetting, setIsResetting] = useState(false);

  const handleHotkeyChange = async (key: keyof HotkeySettingsType, value: string) => {
    try {
      await updateHotkeySetting(key, value);
    } catch (error) {
      console.error("Failed to update hotkey:", error);
    }
  };

  const handleReset = async () => {
    setIsResetting(true);
    try {
      await resetHotkeys();
    } catch (error) {
      console.error("Failed to reset hotkeys:", error);
    } finally {
      setIsResetting(false);
    }
  };

  const hotkeyItems = [
    {
      key: "toggle" as keyof HotkeySettingsType,
      label: "Toggle Window",
      description: "Show/hide the main window",
    },
    {
      key: "audio" as keyof HotkeySettingsType,
      label: "Voice Input",
      description: "Start voice recording",
    },
    {
      key: "screenshot" as keyof HotkeySettingsType,
      label: "Screenshot",
      description: "Capture screenshot",
    },
    {
      key: "systemAudio" as keyof HotkeySettingsType,
      label: "System Audio",
      description: "Toggle system audio capture",
    },
    {
      key: "alwaysOnTop" as keyof HotkeySettingsType,
      label: "Always On Top",
      description: "Toggle always on top mode",
    },
  ];

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <Header
          title="Keyboard Shortcuts"
          description="Customize global hotkeys for quick access"
          isMainTitle
        />
        <Button
          onClick={handleReset}
          disabled={isResetting || isUpdating}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          <RotateCcw className="h-4 w-4" />
          {isResetting ? "Resetting..." : "Reset to Defaults"}
        </Button>
      </div>

      <div className="space-y-4">
        {hotkeyItems.map((item) => (
          <HotkeyItem
            key={item.key}
            label={item.label}
            description={item.description}
            value={hotkeys[item.key]}
            onChange={(value) => handleHotkeyChange(item.key, value)}
            onValidate={validateHotkey}
            currentHotkeys={hotkeys}
            currentKey={item.key}
          />
        ))}
      </div>

    </div>
  );
};
