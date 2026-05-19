// Instagram Focus - content script
// Goals:
//  1. If user lands on /reels, /reel/:id, or /explore -> show a block overlay and bounce to /
//  2. Continuously hide reels/explore links and any "Reels" sections inserted into the feed
//  3. Don't touch DMs (/direct/...), home feed (/), profiles, or post permalinks (/p/...)

(function () {
  "use strict";

  const BLOCKED_PATTERNS = [
    /^\/reels(\/|$)/i,        // /reels, /reels/, /reels/audio/...
    /^\/reel\//i,             // /reel/<id>/
    /^\/explore(\/|$)/i       // /explore, /explore/tags/...
  ];

  function isBlockedPath(pathname) {
    return BLOCKED_PATTERNS.some((re) => re.test(pathname));
  }

  function showOverlay() {
    if (document.getElementById("instagram-focus-overlay")) return;
    document.documentElement.classList.add("if-blocked");

    const overlay = document.createElement("div");
    overlay.id = "instagram-focus-overlay";
    overlay.innerHTML = `
      <h1>Stay focused.</h1>
      <p>Reels and Explore are blocked by Instagram Focus. Head back to your feed or messages.</p>
      <div class="if-actions">
        <a class="if-btn" href="/" data-if-nav="home">Go to Feed</a>
        <a class="if-btn secondary" href="/direct/inbox/" data-if-nav="dm">Open Messages</a>
      </div>
    `;
    // Wait for body to exist (we run at document_start)
    const insert = () => {
      if (document.body) {
        document.body.appendChild(overlay);
      } else {
        requestAnimationFrame(insert);
      }
    };
    insert();
  }

  function hideOverlay() {
    document.documentElement.classList.remove("if-blocked");
    const el = document.getElementById("instagram-focus-overlay");
    if (el) el.remove();
  }

  function enforce() {
    if (isBlockedPath(location.pathname)) {
      showOverlay();
      // Replace history entry so the user doesn't hit Back into the blocked page.
      try {
        history.replaceState({}, "", "/");
      } catch (_) {}
      // Soft-navigate to home after a short tick so Instagram's SPA renders the feed.
      setTimeout(() => {
        if (location.pathname === "/" || location.pathname === "") {
          hideOverlay();
        } else {
          location.replace("/");
        }
      }, 50);
    } else {
      hideOverlay();
    }
  }

  // Intercept SPA route changes (Instagram uses pushState heavily).
  const origPush = history.pushState;
  const origReplace = history.replaceState;
  history.pushState = function () {
    const ret = origPush.apply(this, arguments);
    queueMicrotask(enforce);
    return ret;
  };
  history.replaceState = function () {
    const ret = origReplace.apply(this, arguments);
    queueMicrotask(enforce);
    return ret;
  };
  window.addEventListener("popstate", enforce);
  window.addEventListener("hashchange", enforce);

  // Intercept clicks on links to /reels or /explore before IG's router handles them.
  document.addEventListener(
    "click",
    (e) => {
      const a = e.target && e.target.closest && e.target.closest("a[href]");
      if (!a) return;
      let url;
      try {
        url = new URL(a.href, location.origin);
      } catch (_) {
        return;
      }
      if (url.origin !== location.origin) return;
      if (isBlockedPath(url.pathname)) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        // Stay where we are, or bounce home if we're already on a blocked page.
        if (isBlockedPath(location.pathname)) {
          location.replace("/");
        }
      }
    },
    true // capture phase so we run before IG's listeners
  );

  // Mutation observer: strip Reels sections that get injected into the feed.
  // CSS does most of the work; this is a backup for sections IG renders without
  // a stable href descendant.
  const reelsHeadingRe = /\bReels?\b/i;
  function scrubFeedReelsSections(root) {
    if (!root || !root.querySelectorAll) return;
    // Headers labelled "Reels" inside the home feed
    const candidates = root.querySelectorAll('h2, h3, span, div[role="heading"]');
    candidates.forEach((node) => {
      const txt = (node.textContent || "").trim();
      if (txt && txt.length < 12 && reelsHeadingRe.test(txt) && txt.toLowerCase() === "reels") {
        // Walk up to the nearest section/article container and hide it
        const container = node.closest("section, article, div[role='presentation']");
        if (container && !container.dataset.ifHidden) {
          container.dataset.ifHidden = "1";
          container.style.display = "none";
        }
      }
    });
  }

  const mo = new MutationObserver((mutations) => {
    for (const m of mutations) {
      m.addedNodes && m.addedNodes.forEach((n) => {
        if (n.nodeType === 1) scrubFeedReelsSections(n);
      });
    }
  });

  function startObserver() {
    if (!document.body) return requestAnimationFrame(startObserver);
    mo.observe(document.body, { childList: true, subtree: true });
    scrubFeedReelsSections(document.body);
  }

  // Kick things off
  enforce();
  startObserver();
})();
