import { useState } from "react";
import { Mic, Camera } from "lucide-react";

interface InputBarProps {
  onSubmit: (text: string) => void;
}

export default function InputBar({ onSubmit }: InputBarProps) {
  const [value, setValue] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
    setValue("");
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-center gap-2 px-4 py-3 border-t border-[var(--border-color)] bg-[var(--cream)]"
    >
      <input
        type="text"
        placeholder="What did you eat?"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="flex-1 h-[44px] px-3 rounded-lg bg-[var(--beige)] text-[17px] text-[var(--ink)] placeholder:text-[var(--ink-muted)]/50 outline-none border-none"
      />
      <button
        type="button"
        disabled
        className="flex items-center justify-center w-[44px] h-[44px] rounded-full text-[var(--ink-muted)] opacity-40"
        aria-label="Voice input"
      >
        <Mic size={22} />
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
  );
}
