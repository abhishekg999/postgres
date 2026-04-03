import { useAIStore } from "@/stores/ai";

export function ModelLoadingBar() {
  const { progress, progressText } = useAIStore();

  return (
    <div className="w-full">
      <div className="w-full h-2 bg-studio-border rounded-full overflow-hidden">
        <div
          className="h-full bg-studio-accent rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="text-2xs text-studio-muted mt-2 truncate text-center">{progressText}</p>
    </div>
  );
}
