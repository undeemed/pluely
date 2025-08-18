import { AttachedFile, ChatMessage } from "../types";

// convert file to base64
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data:image/jpeg;base64, prefix
      const base64 = result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = reject;
  });
};

// format message for different providers
export const formatMessageForProvider = (
  provider: any,
  text: string,
  images: AttachedFile[],
  systemPrompt?: string,
  conversationHistory?: ChatMessage[]
) => {
  const messages: any[] = [];

  // add system message if provided
  if (systemPrompt && provider.id !== "gemini") {
    messages.push({
      role: "system",
      content: systemPrompt,
    });
  }

  // add conversation history
  if (conversationHistory && conversationHistory.length > 0) {
    conversationHistory.forEach((msg) => {
      if (msg.role === "system" && provider.id === "gemini") {
        // Skip system messages for Gemini as they're handled differently
        return;
      }

      if (provider.id === "openai" || provider.id === "grok") {
        // Since we don't store images in history, just add text content
        messages.push({ role: msg.role, content: msg.content });
      } else if (provider.id === "claude") {
        // Since we don't store images in history, just add text content
        messages.push({ role: msg.role, content: msg.content });
      }
    });
  }

  // format current user message based on provider
  if (provider.id === "openai" || provider.id === "grok") {
    if (images.length === 0) {
      const content =
        systemPrompt && provider.id === "gemini"
          ? `${systemPrompt}\n\n${text}`
          : text;
      messages.push({
        role: "user",
        content,
      });
    } else {
      const content: any[] = [
        {
          type: "text",
          text:
            systemPrompt && provider.id === "gemini"
              ? `${systemPrompt}\n\n${text}`
              : text,
        },
      ];

      images.forEach((image) => {
        content.push({
          type: "image_url",
          image_url: {
            url: `data:${image.type};base64,${image.base64}`,
          },
        });
      });

      messages.push({
        role: "user",
        content,
      });
    }
  } else if (provider.id === "claude") {
    if (images.length === 0) {
      messages.push({
        role: "user",
        content: text,
      });
    } else {
      const content: any[] = [{ type: "text", text }];

      images.forEach((image) => {
        content.push({
          type: "image",
          source: {
            type: "base64",
            media_type: image.type,
            data: image.base64,
          },
        });
      });

      messages.push({
        role: "user",
        content,
      });
    }
  } else if (provider.id === "gemini") {
    // For Gemini, we need to handle conversation history differently
    const contents: any[] = [];

    // Add conversation history as separate contents
    if (conversationHistory && conversationHistory.length > 0) {
      conversationHistory.forEach((msg) => {
        if (msg.role === "system") return; // Skip system messages

        const parts: any[] = [{ text: msg.content }];
        // Since we don't store images in history, just add text content

        contents.push({
          role: msg.role === "assistant" ? "model" : "user",
          parts,
        });
      });
    }

    // Add current message
    const currentParts: any[] = [
      { text: systemPrompt ? `${systemPrompt}\n\n${text}` : text },
    ];

    images.forEach((image) => {
      currentParts.push({
        inline_data: {
          mime_type: image.type,
          data: image.base64,
        },
      });
    });

    contents.push({
      role: "user",
      parts: currentParts,
    });

    return { contents };
  }

  return { messages };
};
