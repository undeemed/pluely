// get nested value from object
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

// fetch models from provider API
export async function fetchModels(
  provider: any,
  apiKey: string
): Promise<string[]> {
  // if provider doesn't support model fetching, return empty array
  if (!provider.models) {
    throw new Error("Provider does not support model fetching");
  }

  let url = `${provider.baseUrl}${provider.models.endpoint}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  // handle authentication based on provider type
  if (provider.authType === "bearer") {
    headers["Authorization"] = `Bearer ${apiKey}`;
  } else if (provider.authType === "x-api-key") {
    headers["x-api-key"] = apiKey;
  } else {
    // for gemini, append query param
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

  // extract models array using the response path
  const modelsArray = getNestedValue(data, provider.models.responsePath) || [];

  if (!Array.isArray(modelsArray)) {
    throw new Error("Invalid response format: models data is not an array");
  }

  // extract model IDs using the specified ID key
  return modelsArray
    .map((model: any) => model[provider.models.idKey])
    .filter((id: string) => id && typeof id === "string")
    .sort();
}

// stream completion from API
export const streamCompletion = async (
  provider: any,
  model: string,
  apiKey: string,
  payload: any,
  onChunk: (chunk: string) => void,
  onError: (error: string) => void,
  abortController: AbortController
) => {
  try {
    let url = `${provider.baseUrl}${provider.chatEndpoint}`;

    // handle gemini model interpolation
    if (provider.id === "gemini") {
      url = url.replace("${model}", model);
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    // handle authentication
    if (provider.authType === "bearer") {
      headers["Authorization"] = `Bearer ${apiKey}`;
    } else if (provider.authType === "x-api-key") {
      headers["x-api-key"] = apiKey;
    } else if (provider.authType === "x-goog-api-key") {
      headers["x-goog-api-key"] = apiKey;
    } else if (provider.authType === "query" && provider.authParam) {
      url += `?${provider.authParam}=${apiKey}`;
    }

    // prepare request body
    const requestBody = {
      model,
      ...payload,
    };

    // special handling for claude
    if (provider.id === "claude") {
      requestBody.max_tokens = 4096;
      requestBody["anthropic-version"] = "2023-06-01";
    }

    if (provider.id !== "gemini") {
      requestBody.stream = true;
    }

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(requestBody),
      signal: abortController.signal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `API Error: ${response.status} ${response.statusText}\n${errorText}`
      );
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error("No response body reader available");
    }

    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (line.trim() === "") continue;
        if (line.startsWith("data: ")) {
          const data = line.slice(6);
          if (data === "[DONE]") continue;

          try {
            const parsed = JSON.parse(data);
            let content = "";

            // extract content based on provider
            if (provider.id === "openai" || provider.id === "grok") {
              content = parsed.choices?.[0]?.delta?.content || "";
            } else if (provider.id === "claude") {
              if (parsed.type === "content_block_delta") {
                content = parsed.delta?.text || "";
              }
            } else if (provider.id === "gemini") {
              content = parsed.candidates?.[0]?.content?.parts?.[0]?.text || "";
            }

            if (content) {
              onChunk(content);
            }
          } catch (e) {
            console.warn("Failed to parse streaming chunk:", e);
          }
        }
      }
    }
  } catch (error: unknown) {
    if (error instanceof Error && error.name === "AbortError") {
      return; // user cancelled, don't show error
    }
    onError(error instanceof Error ? error.message : "An error occurred");
  }
};
