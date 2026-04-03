export interface ModelConfig {
  id: string;
  name: string;
  size: string;
}

export const AI_MODELS: ModelConfig[] = [
  {
    id: "Qwen2.5-0.5B-Instruct-q4f16_1-MLC",
    name: "Qwen 2.5 0.5B",
    size: "~350MB",
  },
  {
    id: "Qwen2.5-1.5B-Instruct-q4f16_1-MLC",
    name: "Qwen 2.5 1.5B",
    size: "~1GB",
  },
  {
    id: "Phi-3.5-mini-instruct-q4f16_1-MLC",
    name: "Phi 3.5 Mini",
    size: "~2.2GB",
  },
];

export const DEFAULT_MODEL = AI_MODELS[0];
