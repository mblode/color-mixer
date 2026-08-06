import { describe, expect, it } from "vitest";

import {
  formatHotkey,
  type HotkeyEventLike,
  matchesHotkey,
} from "./use-hotkeys";

const press = (overrides: Partial<HotkeyEventLike> = {}): HotkeyEventLike => ({
  key: "z",
  metaKey: false,
  ctrlKey: false,
  shiftKey: false,
  altKey: false,
  ...overrides,
});

describe("matchesHotkey", () => {
  it("maps mod to Cmd on Apple platforms and Ctrl elsewhere", () => {
    expect(matchesHotkey("mod+z", press({ metaKey: true }), true)).toBe(true);
    expect(matchesHotkey("mod+z", press({ ctrlKey: true }), true)).toBe(false);

    expect(matchesHotkey("mod+z", press({ ctrlKey: true }), false)).toBe(true);
    expect(matchesHotkey("mod+z", press({ metaKey: true }), false)).toBe(false);
  });

  it("compares every modifier, so mod+z ignores mod+shift+z", () => {
    const withShift = press({ metaKey: true, shiftKey: true });

    expect(matchesHotkey("mod+z", withShift, true)).toBe(false);
    expect(matchesHotkey("mod+shift+z", withShift, true)).toBe(true);
  });

  it("does not fire a bare key when a modifier is held", () => {
    expect(matchesHotkey("z", press(), true)).toBe(true);
    expect(matchesHotkey("z", press({ metaKey: true }), true)).toBe(false);
    expect(matchesHotkey("z", press({ altKey: true }), true)).toBe(false);
  });

  it("is case-insensitive, since shift uppercases event.key", () => {
    const shifted = press({ key: "Z", metaKey: true, shiftKey: true });

    expect(matchesHotkey("mod+shift+z", shifted, true)).toBe(true);
  });

  it("distinguishes redo's two conventional bindings", () => {
    const modY = press({ key: "y", metaKey: true });

    expect(matchesHotkey("mod+y", modY, true)).toBe(true);
    expect(matchesHotkey("mod+z", modY, true)).toBe(false);
  });
});

describe("formatHotkey", () => {
  it("uses glyphs on Apple platforms", () => {
    expect(formatHotkey("mod+z", true)).toBe("⌘Z");
    expect(formatHotkey("mod+shift+z", true)).toBe("⌘⇧Z");
  });

  it("spells modifiers out elsewhere", () => {
    expect(formatHotkey("mod+z", false)).toBe("Ctrl+Z");
    expect(formatHotkey("mod+shift+z", false)).toBe("Ctrl+Shift+Z");
  });
});
