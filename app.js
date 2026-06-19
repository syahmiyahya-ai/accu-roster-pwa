(function () {
  const FALLBACK_TARGET_URL = "https://script.google.com/macros/s/AKfycbxKcVJoG6pj09QZrxcoLazOVnB2wf965h28x695Cr2miwhsoNZOQ-iqtqwx5cyWQ8nL/exec";
  const CONFIG = window.ACCU_PWA_CONFIG || {};
  const STORAGE_KEY = "accuRosterTargetUrl";
  const frame = document.getElementById("rosterFrame");
  const setupPanel = document.getElementById("setupPanel");
  const emptyState = document.getElementById("emptyState");
  const offlineState = document.getElementById("offlineState");
  const launchState = document.getElementById("launchState");
  const launchButton = document.getElementById("launchButton");
  const form = document.getElementById("targetForm");
  const input = document.getElementById("targetUrl");
  const formMessage = document.getElementById("formMessage");
  const reloadButton = document.getElementById("reloadButton");
  const openExternal = document.getElementById("openExternal");
  const installButton = document.getElementById("installButton");
  let deferredInstallPrompt = null;
  let currentTarget = "";

  function queryTarget() {
    const params = new URLSearchParams(window.location.search);
    return params.get("target") || "";
  }

  function storedTarget() {
    try {
      return localStorage.getItem(STORAGE_KEY) || "";
    } catch (err) {
      return "";
    }
  }

  function saveTarget(url) {
    try {
      localStorage.setItem(STORAGE_KEY, url);
    } catch (err) {
      // The PWA can still run with the current in-memory URL.
    }
  }

  function validateUrl(value) {
    const trimmed = String(value || "").trim();
    if (!trimmed) return "";
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "https:" && parsed.hostname !== "localhost" && parsed.hostname !== "127.0.0.1") {
      throw new Error("Use an HTTPS roster web app URL.");
    }
    return parsed.toString();
  }

  function withDefaultPage(url) {
    const parsed = new URL(url);
    if (CONFIG.defaultPage && !parsed.searchParams.has("page")) {
      parsed.searchParams.set("page", CONFIG.defaultPage);
    }
    return parsed.toString();
  }

  function setMessage(text, isError) {
    formMessage.textContent = text || "";
    formMessage.classList.toggle("error", Boolean(isError));
  }

  function showSetup(show) {
    setupPanel.hidden = !show;
  }

  function shouldOpenRosterImmediately() {
    const params = new URLSearchParams(window.location.search);
    return params.get("open") === "1" ||
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true;
  }

  function loadTarget(url) {
    currentTarget = withDefaultPage(url);
    openExternal.href = currentTarget;
    launchButton.href = currentTarget;
    input.value = url;
    emptyState.hidden = true;
    offlineState.hidden = true;
    if (frame) frame.hidden = true;
    showSetup(false);
    if (shouldOpenRosterImmediately()) {
      window.location.replace(currentTarget);
    } else {
      launchState.hidden = false;
    }
  }

  function initializeTarget() {
    const candidates = [
      queryTarget(),
      CONFIG.defaultTargetUrl,
      FALLBACK_TARGET_URL,
      storedTarget()
    ];

    for (const candidate of candidates) {
      try {
        const url = validateUrl(candidate);
        if (url) {
          saveTarget(url);
          loadTarget(url);
          return;
        }
      } catch (err) {
        setMessage(err.message || String(err), true);
      }
    }

    showSetup(true);
    emptyState.hidden = false;
    openExternal.removeAttribute("href");
  }

  form.addEventListener("submit", event => {
    event.preventDefault();
    try {
      const url = validateUrl(input.value);
      saveTarget(url);
      setMessage("Saved.", false);
      loadTarget(url);
    } catch (err) {
      setMessage(err.message || String(err), true);
    }
  });

  reloadButton.addEventListener("click", () => {
    if (currentTarget) {
      offlineState.hidden = true;
      window.location.href = currentTarget;
    } else {
      showSetup(true);
      input.focus();
    }
  });

  frame.addEventListener("load", () => {
    offlineState.hidden = true;
  });

  window.addEventListener("beforeinstallprompt", event => {
    event.preventDefault();
    deferredInstallPrompt = event;
    installButton.classList.remove("hidden");
  });

  installButton.addEventListener("click", async () => {
    if (!deferredInstallPrompt) return;
    installButton.classList.add("hidden");
    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
  });

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("./sw.js").catch(() => {
        setMessage("Install support is unavailable on this host.", true);
      });
    });
  }

  initializeTarget();
})();
