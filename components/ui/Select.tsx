"use client";

import { useEffect, useId, useRef, useState } from "react";

export type SelectOption = { value: string; label: string };

// Accessible custom select (APG listbox pattern): keyboard nav, click-outside
// close, type-ahead-free but Arrow/Home/End/Enter/Space/Escape/Tab handled.
export default function Select({
  id,
  name,
  value,
  onChange,
  options,
  placeholder = "Pilih…",
  ariaLabel,
}: {
  id?: string;
  name?: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  ariaLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const autoId = useId();
  const buttonId = id ?? autoId;
  const listId = `${buttonId}-listbox`;

  const selected = options.find((o) => o.value === value);

  function close() {
    setOpen(false);
    setActiveIndex(-1);
  }

  function select(option: SelectOption) {
    onChange(option.value);
    close();
  }

  function onKeyDown(e: React.KeyboardEvent) {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setOpen(true);
        setActiveIndex((i) => Math.min(i + 1, options.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setOpen(true);
        setActiveIndex((i) => Math.max(i - 1, 0));
        break;
      case "Home":
        e.preventDefault();
        setActiveIndex(0);
        break;
      case "End":
        e.preventDefault();
        setActiveIndex(options.length - 1);
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        if (open && activeIndex >= 0) select(options[activeIndex]);
        else setOpen(true);
        break;
      case "Escape":
        close();
        break;
      case "Tab":
        close();
        break;
    }
  }

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) close();
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  useEffect(() => {
    if (open && activeIndex >= 0 && listRef.current) {
      const el = listRef.current.children[activeIndex] as HTMLElement | undefined;
      el?.scrollIntoView({ block: "nearest" });
    }
  }, [open, activeIndex]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        id={buttonId}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={ariaLabel}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={onKeyDown}
        className="flex h-11 w-full items-center justify-between rounded-card border border-cloud bg-white px-3 text-left text-base focus:border-navy focus:outline-none md:h-10 md:text-sm"
      >
        <span className={selected ? "text-navy" : "text-muted"}>
          {selected ? selected.label : placeholder}
        </span>
        <svg
          aria-hidden
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          className="shrink-0 text-muted"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && (
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          aria-labelledby={buttonId}
          tabIndex={-1}
          className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-card border border-cloud bg-white py-1 shadow-lg"
        >
          {options.map((option, i) => (
            <li
              key={option.value}
              role="option"
              aria-selected={option.value === value}
              id={`${listId}-${i}`}
              onPointerDown={(e) => e.preventDefault()}
              onClick={() => select(option)}
              onMouseEnter={() => setActiveIndex(i)}
              className={`cursor-pointer px-3 py-2 text-base md:text-sm ${
                option.value === value
                  ? "bg-gold/25 font-medium text-navy"
                  : i === activeIndex
                    ? "bg-surface text-navy"
                    : "text-navy hover:bg-surface"
              }`}
            >
              {option.label}
            </li>
          ))}
        </ul>
      )}

      {name && <input type="hidden" name={name} value={value} />}
    </div>
  );
}
