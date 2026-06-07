export interface HudCallbacks {
  onHint: () => void;
  onToggleCount: () => void;
}

export interface Hud {
  setCount: (n: number, show: boolean) => void;
}

export function createHud(root: HTMLElement, cb: HudCallbacks): Hud {
  const count = document.createElement("div");
  count.dataset.count = "";
  count.style.cssText = "position:fixed;top:16px;left:16px;font:600 18px system-ui;color:#cdd6f4;";

  const hint = document.createElement("button");
  hint.dataset.hint = "";
  hint.textContent = "Hint";
  hint.style.cssText = "position:fixed;bottom:16px;right:16px;padding:10px 16px;border-radius:10px;border:0;background:#313244;color:#cdd6f4;font:600 15px system-ui;";
  hint.addEventListener("click", cb.onHint);

  const toggle = document.createElement("button");
  toggle.textContent = "Count";
  toggle.style.cssText = "position:fixed;bottom:16px;left:16px;padding:10px 16px;border-radius:10px;border:0;background:#313244;color:#cdd6f4;font:600 15px system-ui;";
  toggle.addEventListener("click", cb.onToggleCount);

  root.append(count, hint, toggle);

  return {
    setCount(n: number, show: boolean) {
      count.style.display = show ? "block" : "none";
      count.textContent = `${n} left`;
    },
  };
}
