(() => {
  const colors = { light: "#f3f6fa", dark: "#10141e", aurora: "#091e29", disco: "#20102e", inferno: "#1c0c0a" };
  let theme = "aurora";
  try {
    theme = localStorage.getItem("theme") ?? theme;
  } catch {
  }
  if (!Object.hasOwn(colors, theme)) theme = "aurora";
  document.documentElement.setAttribute("data-theme", theme);
  document.documentElement.setAttribute("data-bs-theme", theme === "light" ? "light" : "dark");
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", colors[theme]);
  window.addEventListener("error", function(e) {
    if (["ResizeObserver loop completed with undelivered notifications.", "ResizeObserver loop limit exceeded"].includes(e.message)) {
      e.stopImmediatePropagation();
      e.preventDefault();
    }
  });
})();
