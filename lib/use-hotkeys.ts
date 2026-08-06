import { useEffect, useRef, useState } from "react";

/**
 * Keyboard shortcuts, keyed by combination.
 *
 * Combinations are `+`-separated, e.g. `mod+z`, `mod+shift+z`. `mod` resolves to
 * Cmd on Apple platforms and Ctrl elsewhere, which is the only correct way to
 * spell an editing shortcut cross-platform. Modifiers must match exactly, so
 * `mod+z` does not also fire for `mod+shift+z`.
 *
 * Small on purpose: three bindings do not justify a dependency, but they do
 * need the edge cases below.
 */
export type HotkeyMap = Record<string, (event: KeyboardEvent) => void>;

const isApplePlatform = () =>
  typeof navigator !== "undefined" &&
  /mac|iphone|ipad|ipod/i.test(navigator.platform || navigator.userAgent);

/**
 * A shortcut must never steal a keystroke meant for text. Covers native fields
 * and anything a rich-text editor has made editable.
 */
const isTextEntry = (target: EventTarget | null) => {
  if (!(target instanceof HTMLElement)) {
    return false;
  }
  if (target.isContentEditable) {
    return true;
  }
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
};

interface ParsedHotkey {
  key: string;
  mod: boolean;
  shift: boolean;
  alt: boolean;
}

const parse = (combination: string): ParsedHotkey => {
  const parts = combination.toLowerCase().split("+");
  return {
    key: parts.at(-1) ?? "",
    mod: parts.includes("mod"),
    shift: parts.includes("shift"),
    alt: parts.includes("alt"),
  };
};

/** The fields of a KeyboardEvent this matcher actually reads. */
export interface HotkeyEventLike {
  key: string;
  metaKey: boolean;
  ctrlKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
}

/**
 * Exact-match a combination against an event. Every modifier is compared, not
 * just the ones named, so `mod+z` does not also fire for `mod+shift+z`.
 */
export const matchesHotkey = (
  combination: string,
  event: HotkeyEventLike,
  apple: boolean
): boolean => {
  const wanted = parse(combination);
  const pressedMod = apple ? event.metaKey : event.ctrlKey;
  return (
    wanted.key === event.key.toLowerCase() &&
    wanted.mod === pressedMod &&
    wanted.shift === event.shiftKey &&
    wanted.alt === event.altKey
  );
};

export function useHotkeys(map: HotkeyMap, enabled = true) {
  // Held in a ref so callers do not have to memoise their handlers to avoid
  // re-binding the listener on every render.
  const mapRef = useRef(map);
  mapRef.current = map;

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const apple = isApplePlatform();

    const onKeyDown = (event: KeyboardEvent) => {
      // Mid-composition keystrokes belong to the IME, not to us.
      if (event.isComposing || isTextEntry(event.target)) {
        return;
      }

      for (const [combination, handler] of Object.entries(mapRef.current)) {
        if (matchesHotkey(combination, event, apple)) {
          // Undo in particular has a browser default worth suppressing.
          event.preventDefault();
          handler(event);
          return;
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [enabled]);
}

/** `⌘⇧Z` on Apple platforms, `Ctrl+Shift+Z` elsewhere. */
export const formatHotkey = (combination: string, apple: boolean) =>
  combination
    .split("+")
    .map((part) => {
      if (part === "mod") {
        return apple ? "⌘" : "Ctrl+";
      }
      if (part === "shift") {
        return apple ? "⇧" : "Shift+";
      }
      if (part === "alt") {
        return apple ? "⌥" : "Alt+";
      }
      return part.toUpperCase();
    })
    .join("");

/** ARIA's own shortcut grammar, e.g. `Meta+Z`, `Control+Shift+Z`. */
const ariaFormat = (combination: string, apple: boolean) =>
  combination
    .split("+")
    .map((part) => {
      if (part === "mod") {
        return apple ? "Meta" : "Control";
      }
      return part.charAt(0).toUpperCase() + part.slice(1);
    })
    .join("+");

/**
 * A shortcut's display label (`⌘Z`) and its `aria-keyshortcuts` value
 * (`Meta+Z`).
 *
 * Both are resolved after mount rather than during render: the server has no
 * navigator, so formatting inline would hydrate the Windows spelling into the
 * Apple one and mismatch on a Mac.
 */
export function useHotkeyLabel(combination: string) {
  const [resolved, setResolved] = useState(() => ({
    label: formatHotkey(combination, false),
    aria: ariaFormat(combination, false),
  }));

  useEffect(() => {
    const apple = isApplePlatform();
    setResolved({
      label: formatHotkey(combination, apple),
      aria: ariaFormat(combination, apple),
    });
  }, [combination]);

  return resolved;
}
