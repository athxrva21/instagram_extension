# Instagram Focus

A Chrome extension that blocks Instagram **Reels** and the **Explore** page so you can still use the parts of Instagram you actually want: your home feed, direct messages, profiles of people you follow, and normal interactions (like, comment, share, save).

## What it does

- Blocks any URL under `/reels/`, `/reel/<id>/`, or `/explore/` and bounces you to your home feed.
- Hides the **Reels** and **Explore** items in the Instagram sidebar / bottom nav so you don't see them.
- Strips the "Reels" carousels that Instagram injects into the home feed.
- Leaves DMs (`/direct/...`), home feed (`/`), profiles, and individual post permalinks (`/p/...`) completely untouched.
- Works on `instagram.com` for anyone who installs the extension - no per-user configuration.

## Install (Chrome / Edge / Brave)

1. Download or clone this folder to your computer.
2. Open `chrome://extensions` in your browser.
3. Toggle **Developer mode** on (top-right).
4. Click **Load unpacked** and select the `insta_extension` folder.
5. Open instagram.com - Reels and Explore are now blocked.

To share it with someone else, just send them the folder and have them follow the same steps.

## Files

- `manifest.json` - Manifest V3 config (permissions, content scripts, background worker).
- `content.js` - Runs on instagram.com. Hides Reels UI, intercepts in-app navigation, shows a block overlay.
- `styles.css` - Hides Reels/Explore links and sections via CSS selectors.
- `background.js` - Service worker. Catches top-level navigations to blocked URLs and redirects.
- `popup.html` - The little status panel that opens when you click the toolbar icon.
- `icons/` - Toolbar icons (16, 48, 128 px).

## Notes / known limits

- Instagram is a single-page app and ships UI changes often. The selectors used here target stable `href` patterns (e.g. `a[href="/reels/"]`) rather than auto-generated class names, so they should hold up. If a future redesign breaks something, the fix is usually a one-line CSS selector update.
- This extension only modifies what you see in the browser. Your account, your feed algorithm, and Instagram's servers are untouched.
- No data is collected. No network calls are made by the extension.
