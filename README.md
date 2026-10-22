# Krillion Daily Helper

Automatically fills a verified **One in a Krillion (100 points)** answer, or a **Deep Cut (85 points)** fallback, in the [Krillion daily dive](https://krillion.io/). No paid AI service or API key.

**It fills the answer; it does not press Submit. Krillion itself submits a filled answer when the timer expires.** You can edit or clear the answer first.

## Choose your setup

| Where you play | What to use | What you need |
| --- | --- | --- |
| **iPhone, right now** | **[Safari bookmarklet: start here](docs/iphone.md)** | Only your phone; no app install or computer |
| Chrome on a computer | [Chrome extension](#chrome-on-a-computer) | Download this repository or the extension ZIP |
| Safari on iPhone, installed extension | [Safari app](#installed-safari-extension-on-iphone) | Mac, Xcode, iOS 17+, and Apple development signing |

**Chrome on iPhone cannot load the desktop extension.** Use the Safari bookmarklet for the phone-only setup. It runs on the game page when you tap a saved bookmark. It is not a bookmark that opens another website.

## iPhone quick start — no computer

### Set it up once

1. Open the **[phone setup guide](docs/iphone.md)** and copy the entire code block, starting with `javascript:`.
2. In **Safari**, open **https://krillion.io/**.
3. Tap **Share → Add Bookmark to…** (or **Add to Bookmarks**, depending on your Safari layout).
4. Name it **Krillion Helper** and save it in **Favourites** so it is easy to find.
5. Open your saved bookmarks, tap **Edit**, then select **Krillion Helper**. Replace its **address/URL**, not its name, with the copied code. Save.

### Every time you play

1. Keep **krillion.io** open in the current Safari tab.
2. Tap Safari’s **address bar** and type **Krillion Helper**.
3. Tap the **saved bookmark** suggestion. Do not choose a web search result or press Go to search. Alternatively, open Safari’s Bookmarks list and tap the saved **Krillion Helper** entry.
4. The Krillion page should stay open and show **Krillion ready · tap to stop**.
5. Tap **Begin Descent**. A verified answer should fill automatically when each question appears.
6. Tap **Dive** to submit, or edit the answer first.

**“Add to Bookmarks” saves a bookmark. It does not run one.** To run the helper, select the bookmark you already saved.

Tap the helper’s small badge to stop it. Run the bookmark again after refreshing or reopening the game. Wait until it says **ready** before starting the timer.

See the **[full phone guide with copyable code and troubleshooting](docs/iphone.md)**.

## Chrome on a computer

1. Download **[Krillion-Chrome.zip](Krillion-Chrome.zip?raw=true)** and unzip it. Or select **Code → Download ZIP** on this repository and unzip the project.
2. Open `chrome://extensions` in Chrome.
3. Turn on **Developer mode**.
4. Click **Load unpacked**. For the Chrome-only ZIP, select the extracted folder containing `manifest.json`. For the full project, select its **extension** folder.
5. Open or reload **https://krillion.io/**.
6. Wait for **Ready — waiting for a daily question**, then start the dive. Answers fill automatically.

Use **Enabled** to pause the helper, **+/−** to expand or collapse its panel, and **Fill answer** to explicitly refill an empty answer box. It preserves existing text and your edits. After updating files, click Reload on the extension card and reload the game page.

## Installed Safari extension on iPhone

This is optional. **The bookmarklet above is the option that works without connecting your phone to a Mac.**

1. Download this whole repository to a Mac and unzip it.
2. Open `safari/Krillion Daily Helper/Krillion Daily Helper.xcodeproj` in Xcode.
3. Connect and unlock the iPhone. Accept **Trust This Computer** and enable **Developer Mode** if Xcode asks.
4. Under **Signing & Capabilities**, select your Apple development team for **both** targets: the app and the extension. Leave automatic signing enabled.
5. Choose the **Krillion Daily Helper** scheme and your iPhone as the destination, then press **Run**. Open the installed app once.
6. On the phone, go to **Settings → Apps → Safari → Extensions → Krillion Daily Helper** and enable it. On iOS 17, Safari is directly under Settings.
7. Open **https://krillion.io/** in Safari, allow the extension on that website, and reload the page.
8. Tap **+** on the helper panel to confirm it is ready, then begin playing. The installed extension starts automatically on the daily page; no bookmark is needed.

Requires iOS 17 or later. The panel starts collapsed on a phone; autofill continues while collapsed. Keep `safari` and `extension` in their existing relative locations: Xcode references the shared extension files. Rebuild the app after changing those files.

The app is not on the App Store. A successful simulator build does not establish that signing or installation on your phone has completed.

Apple references: [Safari extensions on iPhone](https://support.apple.com/guide/iphone/iphab0432bf6/ios), [Safari web extensions](https://developer.apple.com/documentation/safariservices/safari-web-extensions), [Run an app on a device](https://help.apple.com/xcode/mac/current/en.lproj/dev5a825a1ca.html).

## Troubleshooting

| What you see | What to do |
| --- | --- |
| Tapping the bookmark just reloads Krillion | Its saved URL is still a website address. Edit it and replace the entire URL with the code beginning `javascript:`. |
| Safari searches for the code | Paste it into the bookmark’s saved URL field, not the search bar. |
| You only see “Add to Bookmarks” | You are in the save/share menu. Close it; use the saved Bookmarks list, or search the bookmark’s name in the address bar and choose the bookmark result. |
| Nothing happens | Confirm you copied the complete code, are using Safari, and are on `https://krillion.io/`. Use the actual Safari app, not an in-app browser or a home-screen web app. |
| Loading fails or times out | Check your connection. In the extension, tap Retry. For the bookmarklet, tap the saved bookmark again after dismissing the error. |
| It says the extension is already running | Use the installed extension; do not also run the bookmarklet. |
| An answer is not filled | The helper only supports the daily dive. It also leaves existing text, edited fields, unverified questions, and almost-expired rounds alone. |
| The helper disappeared after reloading | Bookmarklets run only for the current page load. Tap your saved bookmark again. |
| A new day starts while the page is open | Reload the game, then restart the bookmarklet if using it. |

## Verification

- Seven automated tests passed for answer selection, data validation, input preservation, timing guards, navigation, and bookmarklet stop behavior.
- Chrome extension loaded in an isolated Chromium profile and filled the first live daily answer with **25 seconds** displayed.
- Bookmarklet ran as a `javascript:` URL in mobile WebKit and filled the first live daily answer with **25 seconds** displayed.
- Scoring requests were blocked during those browser checks. No score was submitted to establish these results.
- iOS simulator app build passed. Physical iPhone installation and use have not been verified.

These are checks of the current site, not a guarantee that every future puzzle or site revision will work.

## Behavior and limits

- Daily dive only, at the root URL without query parameters or a fragment. Other game modes stay untouched.
- Reads the page's question, active answer input, and countdown. No screenshots, microphone, camera, browsing history, or access to other websites.
- Retrieves `/api/today` and `/api/reveal?date=…` using read-only requests without account credentials. Only the on/off preference is stored; answer data remains in tab memory.
- Checks matching puzzle dates, prompt IDs, text, tiers, and scores. Unknown or mismatched questions are never guessed.
- Uses a five-second timeout across both requests. A failed lookup shows Retry; no automatic request loop. Network delays can prevent an answer from arriving in time.
- Autofill happens once per question while the field is empty and more than one displayed second remains. Existing text and manual edits are preserved.
- Data expires at the game's supplied reset time. Reload the game for a new daily dive. Navigation and disabling discard pending results.
- This depends on the game's current public data and page structure. Site changes may require an extension update.

## Development and checks

```sh
npm ci
npm test
```

Tests cover selection and fallback, malformed/stale data, preserved edits, repeated fills, expired timers, round transitions, delayed responses, unsupported modes, and absence of submissions.

Build the iOS simulator app without signing:

```sh
xcodebuild -project 'safari/Krillion Daily Helper/Krillion Daily Helper.xcodeproj' \
  -scheme 'Krillion Daily Helper' -configuration Debug -sdk iphonesimulator \
  -derivedDataPath output/ios-build CODE_SIGNING_ALLOWED=NO build
```

Runtime source is in `extension/`; the app container is in `safari/`; tests are in `tests/`. Node dependencies are for tests only and are not packaged with the extension.

This is an independent helper, not an official Krillion product.
