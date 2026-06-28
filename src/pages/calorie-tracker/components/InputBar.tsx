import { useState } from "react";
import { Mic, Camera, Square } from "lucide-react";
import { useVoiceRecorder } from "../hooks/useVoiceRecorder";

interface InputBarProps {
  onSubmit: (text: string) => void;
  onVoiceResult?: (text: string) => void;
}

export default function InputBar({ onSubmit, onVoiceResult }: InputBarProps) {
  const [value, setValue] = useState("");

  const { recording, transcribing, recordingSeconds, error, toggleRecording } =
    useVoiceRecorder({
      onResult: (text) => {
        if (onVoiceResult) onVoiceResult(text);
      },
    });

  const busy = recording || transcribing;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
    setValue("");
  }

  return (
    <div className="border-t border-[var(--border-color)] bg-[var(--cream)]">
      {/* Recording / transcribing indicator */}
      {(recording || transcribing || error) && (
        <div className="flex items-center gap-2 px-4 py-2 text-[13px]">
          {recording && (
            <>
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-red-600">Recording... {recordingSeconds}s</span>
            </>
          )}
          {transcribing && (
            <span className="text-[var(--ink-muted)] animate-pulse">Transcribing...</span>
          )}
          {error && !recording && !transcribing && (
            <span className="text-red-500">{error}</span>
          )}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 px-4 py-3"
      >
        <input
          type="text"
          placeholder="What did you eat?"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={busy}
          className="flex-1 h-[44px] px-3 rounded-lg bg-[var(--beige)] text-[17px] text-[var(--ink)] placeholder:text-[var(--ink-muted)]/50 outline-none border-none disabled:opacity-50"
        />
        <button
          type="button"
          onClick={toggleRecording}
          disabled={transcribing}
          className={`flex items-center justify-center w-[44px] h-[44px] rounded-full transition-colors ${
            recording
              ? "bg-red-500 text-white"
              : "text-[var(--ink-muted)]"
          }`}
          aria-label={recording ? "Stop recording" : "Voice input"}
        >
          {transcribing ? (
            <span className="text-[11px] text-[var(--ink-muted)]">...</span>
          ) : recording ? (
            <Square size={18} />
          ) : (
            <Mic size={22} />
          )}
        </button>
        <button
          type="button"
          disabled
          className="flex items-center justify-center w-[44px] h-[44px] rounded-full text-[var(--ink-muted)] opacity-40"
          aria-label="Photo input"
        >
          <Camera size={22} />
        </button>
      </form>
    </div>
  );
}
