import { CreateMLCEngine, type MLCEngine } from "@mlc-ai/web-llm";

let engine: MLCEngine | null = null;

self.onmessage = async (e: MessageEvent) => {
  const { type, ...data } = e.data;

  if (type === "init") {
    try {
      engine = await CreateMLCEngine(data.modelId, {
        initProgressCallback: (report: { progress: number; text: string }) => {
          self.postMessage({
            type: "progress",
            progress: Math.round(report.progress * 100),
            text: report.text,
          });
        },
      });
      self.postMessage({ type: "ready" });
    } catch (err) {
      self.postMessage({
        type: "error",
        error: err instanceof Error ? err.message : "Failed to initialize model",
      });
    }
  }

  if (type === "chat") {
    if (!engine) {
      self.postMessage({ type: "error", error: "Model not loaded" });
      return;
    }

    try {
      const stream = await engine.chat.completions.create({
        messages: data.messages,
        stream: true,
        temperature: 0.3,
        max_tokens: 1024,
      });

      let full = "";
      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta?.content || "";
        if (delta) {
          full += delta;
          self.postMessage({ type: "chunk", content: delta });
        }
      }
      self.postMessage({ type: "done", content: full });
    } catch (err) {
      self.postMessage({
        type: "error",
        error: err instanceof Error ? err.message : "Generation failed",
      });
    }
  }
};
