import { useRef, useState } from "react";
import { Mic, Camera, Square } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useVoiceRecorder } from "../hooks/useVoiceRecorder";

interface InputBarProps {
  onSubmit: (text: string) => void;
  onVoiceResult?: (text: string) => void;
  onPhoto?: (file: File) => void;
}

export default function InputBar({ onSubmit, onVoiceResult, onPhoto }: InputBarProps) {
  const [value, setValue] = useState("");
  const [actionSheetOpen, setActionSheetOpen] = useState(false);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const libraryInputRef = useRef<HTMLInputElement>(null);

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

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file && onPhoto) onPhoto(file);
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
          onClick={() => setActionSheetOpen(true)}
          disabled={busy}
          className="flex items-center justify-center w-[44px] h-[44px] rounded-full text-[var(--ink-muted)] disabled:opacity-40"
          aria-label="Photo input"
        >
          <Camera size={22} />
        </button>
      </form>

      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFile}
        className="hidden"
      />
      <input
        ref={libraryInputRef}
        type="file"
        accept="image/*"
        onChange={handleFile}
        className="hidden"
      />

      <Dialog open={actionSheetOpen} onOpenChange={setActionSheetOpen}>
        <DialogContent className="max-w-[340px]">
          <DialogHeader>
            <DialogTitle className="text-[17px] font-semibold">Add a photo</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => {
                setActionSheetOpen(false);
                cameraInputRef.current?.click();
              }}
              className="w-full h-[50px] rounded-lg text-[17px] font-medium text-[var(--ink)] bg-[var(--beige)] active:opacity-90"
            >
              Take Photo
            </button>
            <button
              type="button"
              onClick={() => {
                setActionSheetOpen(false);
                libraryInputRef.current?.click();
              }}
              className="w-full h-[50px] rounded-lg text-[17px] font-medium text-[var(--ink)] bg-[var(--beige)] active:opacity-90"
            >
              Choose from Library
            </button>
            <button
              type="button"
              onClick={() => setActionSheetOpen(false)}
              className="w-full h-[44px] rounded-lg text-[15px] text-[var(--ink-muted)]"
            >
              Cancel
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
