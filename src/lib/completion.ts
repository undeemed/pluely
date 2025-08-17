import { AttachedFile } from "../types";

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
  systemPrompt?: string
) => {
  const messages: any[] = [];

  // add system message if provided
  if (systemPrompt) {
    if (provider.id === "gemini") {
      // gemini doesn't have system role, we'll prepend to user message
    } else {
      messages.push({
        role: "system",
        content: systemPrompt,
      });
    }
  }

  // format user message based on provider
  if (provider.id === "openai" || provider.id === "grok") {
    if (images.length === 0) {
      messages.push({
        role: "user",
        content:
          systemPrompt && provider.id === "gemini"
            ? `${systemPrompt}\n\n${text}`
            : text,
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
    const parts: any[] = [
      { text: systemPrompt ? `${systemPrompt}\n\n${text}` : text },
    ];

    images.forEach((image) => {
      parts.push({
        inline_data: {
          mime_type: image.type,
          data: image.base64,
        },
      });
    });

    return {
      contents: [
        {
          role: "user",
          parts,
        },
      ],
    };
  }

  return { messages };
};
