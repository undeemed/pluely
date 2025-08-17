import { MicIcon, PaperclipIcon, Loader2, XIcon } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
  Button,
  ScrollArea,
  Input,
} from "@/components";
import { useCompletion } from "./useCompletion";
import { useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export const Completion = () => {
  const {
    input,
    setInput,
    response,
    isLoading,
    error,
    attachedFiles,
    addFile,
    removeFile,
    clearFiles,
    submit,
    cancel,
    reset,
  } = useCompletion();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach((file) => {
      if (file.type.startsWith("image/")) {
        addFile(file);
      }
    });
    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!isLoading && input.trim()) {
        submit();
      }
    }
  };

  const isPopoverOpen = isLoading || response !== "" || error !== null;

  return (
    <>
      <Button size="icon" disabled>
        <MicIcon className="h-4 w-4" />
      </Button>

      <div className="relative flex-1">
        <Popover
          open={isPopoverOpen}
          onOpenChange={(open) => {
            if (!open && !isLoading) {
              reset();
            }
          }}
        >
          <PopoverTrigger asChild>
            <div className="relative">
              <Input
                placeholder="Ask me anything..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isLoading}
                className="pr-12"
              />
              {isLoading && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              )}
            </div>
          </PopoverTrigger>

          {/* Response Panel */}
          <PopoverContent
            align="center"
            side="bottom"
            className="w-screen p-0 border shadow-lg overflow-hidden"
            sideOffset={8}
          >
            <div className="flex items-center justify-between p-4 border-b bg-muted/30">
              <h3 className="font-semibold text-sm">AI Response</h3>
              <div className="flex items-center gap-2">
                {isLoading && (
                  <Button size="sm" variant="outline" onClick={cancel}>
                    <XIcon className="h-3 w-3 mr-1" />
                    Cancel
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={reset}
                  disabled={isLoading}
                >
                  <XIcon className="h-3 w-3" />
                </Button>
              </div>
            </div>

            <ScrollArea className="h-[calc(100vh-8rem)]">
              <div className="p-4">
                {error && (
                  <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded text-sm text-destructive">
                    <strong>Error:</strong> {error}
                  </div>
                )}

                {response && (
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {response}
                  </ReactMarkdown>
                )}

                {isLoading && !response && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Generating response...</span>
                  </div>
                )}
              </div>
            </ScrollArea>
          </PopoverContent>
        </Popover>
      </div>

      <div className="relative">
        <Button
          size="icon"
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading}
          className="cursor-pointer"
        >
          <PaperclipIcon className="h-4 w-4" />
        </Button>

        {/* File count badge */}
        {attachedFiles.length > 0 && (
          <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground rounded-full h-5 w-5 flex border border-white/50 items-center justify-center text-xs font-medium">
            {attachedFiles.length}
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>
    </>
  );
};
