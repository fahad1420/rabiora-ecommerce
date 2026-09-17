import { useEffect, useRef } from "react";
import { useLocation } from "wouter";

const SCROLL_STORAGE_KEY = "rabiora_scroll_positions_v1";

function getStoredPositions(): Record<string, { x: number; y: number }> {
  try {
    const raw = sessionStorage.getItem(SCROLL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveStoredPosition(key: string, x: number, y: number) {
  if (!key) return;
  try {
    const positions = getStoredPositions();
    positions[key] = { x, y };
    sessionStorage.setItem(SCROLL_STORAGE_KEY, JSON.stringify(positions));
  } catch {}
}

let isPopNavigation = false;
let currentKey = "";

if (typeof window !== "undefined") {
  // Prevent browser default jump
  if ("scrollRestoration" in window.history) {
    window.history.scrollRestoration = "manual";
  }

  // Ensure the initial history entry has a unique key
  if (!window.history.state || !window.history.state.__rk) {
    const initialKey = "rk_" + Math.random().toString(36).substring(2, 9) + "_" + Date.now();
    currentKey = initialKey;
    try {
      window.history.replaceState({ ...window.history.state, __rk: initialKey }, "");
    } catch {}
  } else {
    currentKey = window.history.state.__rk;
  }

  // Intercept pushState (forward navigation)
  const originalPushState = window.history.pushState;
  window.history.pushState = function (state, unused, url) {
    // 1. Prevent duplicate pushes for identical target URL
    const targetUrlStr = url ? String(url) : "";
    const currentPath = window.location.pathname + window.location.search;
    const currentFull = currentPath + window.location.hash;

    if (
      targetUrlStr &&
      (targetUrlStr === currentFull ||
        targetUrlStr === currentPath ||
        targetUrlStr === window.location.href)
    ) {
      // Duplicate push to same route -> do not push duplicate entry
      return;
    }

    // 2. Save scroll position of outgoing page under current history key & path
    if (currentKey) {
      saveStoredPosition(currentKey, window.scrollX, window.scrollY);
    }
    const currentPathKey = "path_" + currentPath;
    saveStoredPosition(currentPathKey, window.scrollX, window.scrollY);

    // 3. Generate new unique key for incoming page
    const newKey = "rk_" + Math.random().toString(36).substring(2, 9) + "_" + Date.now();
    currentKey = newKey;
    isPopNavigation = false;

    const nextState =
      typeof state === "object" && state !== null ? { ...state, __rk: newKey } : { __rk: newKey };

    return originalPushState.call(this, nextState, unused, url);
  };

  // Intercept replaceState
  const originalReplaceState = window.history.replaceState;
  window.history.replaceState = function (state, unused, url) {
    const keyToKeep = window.history.state?.__rk || currentKey || ("rk_" + Date.now());
    currentKey = keyToKeep;
    const nextState =
      typeof state === "object" && state !== null ? { ...state, __rk: keyToKeep } : { __rk: keyToKeep };
    return originalReplaceState.call(this, nextState, unused, url);
  };

  // Listen to popstate (Browser Back & Forward)
  window.addEventListener("popstate", (event) => {
    isPopNavigation = true;
    if (event.state && event.state.__rk) {
      currentKey = event.state.__rk;
    } else {
      currentKey = "path_" + window.location.pathname + window.location.search;
    }
  });

  // Continuously record scroll coordinates as the user browses
  window.addEventListener(
    "scroll",
    () => {
      const activeKey = window.history.state?.__rk || currentKey;
      if (activeKey) {
        saveStoredPosition(activeKey, window.scrollX, window.scrollY);
      }
      const pathKey = "path_" + window.location.pathname + window.location.search;
      saveStoredPosition(pathKey, window.scrollX, window.scrollY);
    },
    { passive: true }
  );
}

export function ScrollRestoration() {
  const [location] = useLocation();
  const prevLocationRef = useRef(location);

  useEffect(() => {
    const isPop = isPopNavigation;
    isPopNavigation = false;

    // If navigating with a hash (e.g. #products, #flash-sale), allow hash scroll handler
    if (window.location.hash) {
      prevLocationRef.current = location;
      return;
    }

    if (isPop) {
      // BROWSER BACK / FORWARD NAVIGATION: Restore exact previous scroll position
      const positions = getStoredPositions();
      const activeKey = window.history.state?.__rk || currentKey;
      const pathKey = "path_" + window.location.pathname + window.location.search;
      const saved = (activeKey ? positions[activeKey] : null) || positions[pathKey];

      if (saved && typeof saved.y === "number") {
        const targetY = saved.y;
        const targetX = saved.x || 0;

        const restore = () => {
          window.scrollTo({ top: targetY, left: targetX, behavior: "instant" });
          document.documentElement.scrollTop = targetY;
          document.body.scrollTop = targetY;
        };

        restore();
        // Multiple animation frames guarantee restoration after dynamic layout paints
        requestAnimationFrame(() => {
          restore();
          requestAnimationFrame(restore);
        });
      }
    } else {
      // NEW FORWARD ROUTE NAVIGATION: Start cleanly at the TOP of the new page
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }

    prevLocationRef.current = location;
  }, [location]);

  return null;
}
