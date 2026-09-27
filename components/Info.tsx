"use client";

/** Small "i" badge. Hover or focus to reveal the full description. */
export default function Info({ text }: { text: string }) {
  return (
    <span className="group relative ml-1.5 inline-flex align-middle" tabIndex={0}>
      <span
        aria-hidden
        className="flex h-4 w-4 cursor-help items-center justify-center rounded-full border border-slate-600 text-[10px] leading-none text-slate-400"
      >
        i
      </span>
      <span className="pointer-events-none absolute left-1/2 top-6 z-20 w-60 -translate-x-1/2 rounded-lg border border-edge bg-ink p-3 text-xs font-normal normal-case leading-relaxed text-slate-300 opacity-0 shadow-xl transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
        {text}
      </span>
    </span>
  );
}
