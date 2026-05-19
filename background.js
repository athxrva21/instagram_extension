// Instagram Focus - background service worker
// Catches *navigations* to /reels, /reel/<id>, or /explore before the page even loads
// and redirects the tab to the Instagram home feed. This is a safety net in addition
// to the content script (which handles in-app SPA navigation).

const BLOCKED_REGEX = /^https?:\/\/([a-z0-9-]+\.)?instagram\.com\/(reels?(\/|$)|explore(\/|$))/i;

chrome.webNavigation.onBeforeNavigate.addListener(
  (details) => {
    if (details.frameId !== 0) return; // only top-level frames
    if (BLOCKED_REGEX.test(details.url)) {
      chrome.tabs.update(details.tabId, { url: "https://www.instagram.com/" });
    }
  },
  { url: [{ hostSuffix: "instagram.com" }] }
);

// Also catch history.pushState SPA transitions in case content script hasn't loaded yet.
chrome.webNavigation.onHistoryStateUpdated.addListener(
  (details) => {
    if (details.frameId !== 0) return;
    if (BLOCKED_REGEX.test(details.url)) {
      chrome.tabs.update(details.tabId, { url: "https://www.instagram.com/" });
    }
  },
  { url: [{ hostSuffix: "instagram.com" }] }
);
