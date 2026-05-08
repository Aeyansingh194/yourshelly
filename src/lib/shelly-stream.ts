export type ShellyMessage = {
  role: "user" | "assistant";
  content: string;
};

export class ShellyStreamError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "ShellyStreamError";
    this.status = status;
  }
}

const processSseBuffer = (textBuffer: string, onDelta: (chunk: string) => void) => {
  let buffer = textBuffer;
  let streamDone = false;
  let newlineIndex: number;

  while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
    let line = buffer.slice(0, newlineIndex);
    buffer = buffer.slice(newlineIndex + 1);

    if (line.endsWith("\r")) line = line.slice(0, -1);
    if (!line.trim() || line.startsWith(":")) continue;
    if (!line.startsWith("data: ")) continue;

    const jsonStr = line.slice(6).trim();
    if (jsonStr === "[DONE]") {
      streamDone = true;
      break;
    }

    try {
      const parsed = JSON.parse(jsonStr);
      const content = parsed.choices?.[0]?.delta?.content;

      if (typeof content === "string" && content.length > 0) {
        onDelta(content);
      }
    } catch {
      buffer = `${line}\n${buffer}`;
      break;
    }
  }

  return { buffer, streamDone };
};

export const streamShellyResponse = async ({
  messages,
  onDelta,
  signal,
  languageHint,
}: {
  messages: ShellyMessage[];
  onDelta: (chunk: string) => void;
  signal?: AbortSignal;
  languageHint?: string;
}) => {
  const apiBaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  if (!apiBaseUrl || !publishableKey) {
    throw new ShellyStreamError("Chat is not configured correctly.");
  }

  const response = await fetch(`${apiBaseUrl}/functions/v1/panda-chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: publishableKey,
      Authorization: `Bearer ${publishableKey}`,
    },
    body: JSON.stringify({ messages, languageHint }),
    signal,
  });

  if (response.status === 429) {
    throw new ShellyStreamError("Too many requests. Please wait a moment and try again.", 429);
  }

  if (response.status === 402) {
    throw new ShellyStreamError("Workspace credits are required to continue.", 402);
  }

  if (!response.ok || !response.body) {
    const detail = await response.text().catch(() => "");
    throw new ShellyStreamError(detail || "Failed to start the chat stream.", response.status);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let textBuffer = "";
  let streamDone = false;

  while (!streamDone) {
    const { done, value } = await reader.read();
    if (done) break;

    textBuffer += decoder.decode(value, { stream: true });
    const processed = processSseBuffer(textBuffer, onDelta);
    textBuffer = processed.buffer;
    streamDone = processed.streamDone;
  }

  if (textBuffer.trim()) {
    processSseBuffer(`${textBuffer}\n`, onDelta);
  }
};