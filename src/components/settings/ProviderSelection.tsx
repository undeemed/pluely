import {
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components";
import { providers } from "@/config";

interface ProviderSelectionProps {
  value: string;
  onChange: (value: string) => void;
}

export const ProviderSelection = ({
  value,
  onChange,
}: ProviderSelectionProps) => {
  return (
    <div className="space-y-2">
      <div>
        <Label className="text-sm font-semibold">AI Provider</Label>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Select your preferred AI service provider to get started.
        </p>
      </div>

      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-full h-11 border-1 border-input/50 focus:border-primary/50 transition-colors">
          <SelectValue placeholder="Choose your AI provider" />
        </SelectTrigger>
        <SelectContent>
          {providers.map((provider) => (
            <SelectItem
              key={provider.id}
              value={provider.id}
              className="cursor-pointer hover:bg-accent/50"
            >
              <span className="font-medium">{provider.name}</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
