import { useState, useCallback, useRef } from "react";
import { providers } from "@/config";
import {
  getSettings,
  fileToBase64,
  formatMessageForProvider,
  streamCompletion,
  transcribeAudio,
} from "@/lib";
import { AttachedFile, CompletionState } from "@/types";
import { useMicVAD } from "@ricky0123/vad-react";

export const useCompletion = () => {
  const [state, setState] = useState<CompletionState>({
    input: "",
    response: "",
    isLoading: false,
    error: null,
    attachedFiles: [],
  });

  const [isTranscribing, setIsTranscribing] = useState(false);

  const vad = useMicVAD({
    userSpeakingThreshold: 0.6,
    onSpeechEnd: async (audio) => {
      console.log("User stopped talking");
      console.log("Audio data:", audio);

      try {
        setIsTranscribing(true);
        const settings = getSettings();

        // Check if we have an OpenAI API key
        if (!settings?.apiKey || !settings?.isApiKeySubmitted) {
          console.warn("No API key configured for transcription");
          return;
        }

        // For now, we'll use the configured API key assuming it's OpenAI
        // In a production app, you might want to have separate API keys for different services
        const transcription = await transcribeAudio(audio, settings.apiKey);

        // Optionally, you could set this as input or append to existing input
        if (transcription) {
          submit(transcription);
        }
      } catch (error) {
        console.error("Failed to transcribe audio:", error);
        setState((prev) => ({
          ...prev,
          error:
            error instanceof Error ? error.message : "Transcription failed",
        }));
      } finally {
        setIsTranscribing(false);
      }
    },
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  const setInput = useCallback((value: string) => {
    setState((prev) => ({ ...prev, input: value }));
  }, []);

  const setResponse = useCallback((value: string) => {
    setState((prev) => ({ ...prev, response: value }));
  }, []);

  const addFile = useCallback(async (file: File) => {
    try {
      const base64 = await fileToBase64(file);
      const attachedFile: AttachedFile = {
        id: Date.now().toString(),
        name: file.name,
        type: file.type,
        base64,
        size: file.size,
      };

      setState((prev) => ({
        ...prev,
        attachedFiles: [...prev.attachedFiles, attachedFile],
      }));
    } catch (error) {
      console.error("Failed to process file:", error);
    }
  }, []);

  const removeFile = useCallback((fileId: string) => {
    setState((prev) => ({
      ...prev,
      attachedFiles: prev.attachedFiles.filter((f) => f.id !== fileId),
    }));
  }, []);

  const clearFiles = useCallback(() => {
    setState((prev) => ({ ...prev, attachedFiles: [] }));
  }, []);

  const submit = useCallback(
    async (speechText?: string) => {
      const input = speechText || state.input;
      const settings = getSettings();
      if (
        !settings?.selectedProvider ||
        !settings?.apiKey ||
        !settings?.isApiKeySubmitted
      ) {
        setState((prev) => ({
          ...prev,
          error: "Please configure your AI provider and API key in settings",
        }));
        return;
      }

      const provider = providers.find(
        (p) => p.id === settings.selectedProvider
      );
      if (!provider) {
        setState((prev) => ({
          ...prev,
          error: "Invalid provider selected",
        }));
        return;
      }

      const model =
        settings.selectedModel || settings.customModel || provider.defaultModel;
      if (!model) {
        setState((prev) => ({
          ...prev,
          error: "Please select a model in settings",
        }));
        return;
      }

      if (!input.trim()) {
        return;
      }

      if (speechText) {
        setState((prev) => ({
          ...prev,
          input: speechText,
        }));
      }

      // Cancel any existing request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();

      setState((prev) => ({
        ...prev,
        isLoading: true,
        error: null,
        response: "",
      }));

      try {
        const payload = formatMessageForProvider(
          provider,
          input,
          state.attachedFiles,
          settings.systemPrompt
        );

        await streamCompletion(
          provider,
          model,
          settings.apiKey,
          payload,
          (chunk) => {
            setState((prev) => ({
              ...prev,
              response: prev.response + chunk,
            }));
          },
          (error) => {
            setState((prev) => ({
              ...prev,
              error,
              isLoading: false,
            }));
          },
          abortControllerRef.current
        );

        setState((prev) => ({ ...prev, isLoading: false }));
      } catch (error) {
        setState((prev) => ({
          ...prev,
          error: error instanceof Error ? error.message : "An error occurred",
          isLoading: false,
        }));
      }
    },
    [state.input, state.attachedFiles, state.isLoading]
  );

  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setState((prev) => ({ ...prev, isLoading: false }));
  }, []);

  const reset = useCallback(() => {
    cancel();
    setState((prev) => ({
      ...prev,
      input: "",
      response: "",
      error: null,
      attachedFiles: [],
    }));
  }, [cancel]);

  return {
    input: state.input,
    setInput,
    response: state.response,
    setResponse,
    isLoading: state.isLoading,
    error: state.error,
    attachedFiles: state.attachedFiles,
    addFile,
    removeFile,
    clearFiles,
    submit,
    cancel,
    reset,
    vad,
    isTranscribing,
  };
};
