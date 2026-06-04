// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { createHud } from "../src/ui/hud";

describe("hud", () => {
  it("shows the remaining count and hides it when disabled", () => {
    const root = document.createElement("div");
    const hud = createHud(root, { onHint: () => {}, onToggleCount: () => {}, onLevel: () => {} });
    hud.setCount(3, true);
    expect(root.querySelector("[data-count]")!.textContent).toContain("3");
    hud.setCount(3, false);
    expect((root.querySelector("[data-count]") as HTMLElement).style.display).toBe("none");
  });

  it("fires onHint when the hint button is clicked", () => {
    const root = document.createElement("div");
    const onHint = vi.fn();
    createHud(root, { onHint, onToggleCount: () => {}, onLevel: () => {} });
    (root.querySelector("[data-hint]") as HTMLButtonElement).click();
    expect(onHint).toHaveBeenCalledOnce();
  });
});
