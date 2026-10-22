# Use Krillion Helper on your iPhone now

**Use Safari. No computer, Xcode, account, subscription, or app installation is needed.**

A bookmarklet is a saved bookmark whose address is a little program. Tapping it runs that program on the page you already have open. In this case, keep Krillion open and tap the helper bookmark.

## 1. Copy the helper code

Copy **all** of the following code. Use the copy button on the code block if GitHub shows one. The first characters must be `javascript:`. Do not include the surrounding backticks.

```javascript
javascript:(async()=>{if("https://krillion.io"!==location.origin||"/"!==location.pathname||location.search)return alert("Open the daily dive at https://krillion.io/ first.");if(document.getElementById("krillion-daily-helper"))return alert("Your extension is already running.");if(window.krillionStop)return window.krillionStop();const t=document.createElement("button");t.textContent="Krillion: loading…",t.style.cssText="position:fixed;top:8px;right:8px;z-index:2147483647;background:#102234;color:#70e3c5;padding:10px;border:1px solid;border-radius:9px;font:13px system-ui",document.documentElement.append(t);const e=new AbortController;let r,o=!1;const n=new Set,i=new Set,a=t=>String(t).normalize("NFKC").replace(/\s+/g," ").trim(),s=()=>a(document.querySelector(".ds-card .prompt")?.textContent||""),l=t=>{t.isTrusted&&t.target.matches?.(".ds-input")&&i.add(s())};document.addEventListener("input",l,!0);const d=()=>{o=!0,e.abort(),clearInterval(r),t.remove(),document.removeEventListener("input",l,!0),delete window.krillionStop};window.krillionStop=d,t.onclick=d;const c=setTimeout(()=>e.abort(),5e3);try{const l=async t=>{const r=await fetch(t,{signal:e.signal,credentials:"omit",cache:"no-store"});if(!r.ok)throw Error("Answer data unavailable");return r.json()},p=await l("/api/today");if(!/^\d{4}-\d{2}-\d{2}$/.test(p.date))throw Error("Invalid puzzle");const u=await l("/api/reveal?date="+p.date),m=Date.parse(p.resetsAt);if(!(u.date===p.date&&m>Date.now()&&7===p.prompts?.length&&Array.isArray(u.prompts)))throw Error("Stale answer data");const w=new Map;for(const t of p.prompts){const e=u.prompts.filter(e=>e.id===t.id&&a(e.text)===a(t.text));if(1!==e.length||!Array.isArray(e[0].answers)||w.has(a(t.text)))throw Error("Mismatched answers");const r=e[0].answers.filter(t=>"string"==typeof t.answer&&t.answer.trim()&&("krillion"===t.tier&&100===t.score||"deepcut"===t.tier&&85===t.score)).sort((t,e)=>e.score-t.score)[0];w.set(a(t.text),r)}if(clearTimeout(c),o)return;t.textContent="Krillion ready · tap to stop",r=setInterval(()=>{if("/"!==location.pathname||location.search||Date.now()>=m)return d();const e=s(),r=w.get(e),o=document.querySelector("form.ds-dock input.ds-input"),a=Number(document.querySelector(".ds-time-digits")?.textContent);r&&o&&o.getClientRects().length&&!o.disabled&&!o.readOnly&&!o.value.trim()&&a>1&&!n.has(e)&&!i.has(e)&&(n.add(e),Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,"value").set.call(o,r.answer),o.dispatchEvent(new Event("input",{bubbles:!0})),t.textContent=r.score+" points filled · tap to stop")},100)}catch(t){o||(d(),alert("Krillion helper: "+t.message+". Tap the bookmark to retry."))}finally{clearTimeout(c)}})();
```

You can also open the [plain-text code](../Krillion-Phone-Bookmarklet.txt), choose **Raw**, then Select All and Copy the text.

## 2. Save a bookmark

1. Open **https://krillion.io/** in **Safari**.
2. Tap **Share**, then **Add Bookmark to…** or **Add to Bookmarks**.
3. Name it **Krillion Helper**.
4. Save it in **Favourites** and tap **Save**.

This saves a normal bookmark first. The next step turns it into the helper.

## 3. Change the bookmark’s address

1. Open Safari’s **Bookmarks** list (the book icon; it may be inside Safari’s toolbar menu depending on your layout).
2. Open the folder where you saved **Krillion Helper**.
3. Tap **Edit**, then tap **Krillion Helper**. Touching and holding the saved entry and choosing **Edit** is another option when offered.
4. Keep the name **Krillion Helper**.
5. Delete the entire address, which currently starts with `https://krillion.io`.
6. Paste the code into that **address/URL field**. It should now start with **`javascript:`**.
7. Save your changes with **Done**.

Do not paste the code into Safari’s search bar or into the bookmark’s name.

## 4. Run it on the game page

1. Return to **https://krillion.io/** in the same Safari tab. Do not begin the round yet.
2. Tap Safari’s **address bar** and type **Krillion Helper**.
3. Tap the saved **Krillion Helper bookmark** in the suggestions. Do not choose a search result or press Go to search.
4. If it is not suggested, open Safari’s **Bookmarks/Favourites list** and tap the saved **Krillion Helper** entry instead.
5. Safari should stay on Krillion. A small badge should say **Krillion ready · tap to stop**.
6. Now tap **Begin Descent**. Each verified top-tier answer fills automatically.
7. Tap **Dive** to submit it, or edit the answer before submitting.

**The share menu’s “Add to Bookmarks” button saves bookmarks; it does not run your saved bookmark.** Close that menu and select the saved entry instead.

## Next time and stopping

- Tap the saved bookmark again whenever you reopen or reload Krillion.
- Tap the small helper badge to stop the helper.
- Running the bookmark a second time while it is active also stops it.
- It only fills the answer field. **Krillion itself submits whatever is in that field when the timer expires.**
- It targets One in a Krillion first, then Deep Cut. It does not guess when it cannot verify an answer.
- Daily dive only. Do not run it alongside the installed extension.

## If something is wrong

**It just reloads the game:** the bookmark still has a normal website URL. Repeat step 3 and check that its address starts with `javascript:`.

**It opens Google or another search page:** you searched instead of selecting a saved bookmark, or pasted the code into the address/search bar. Edit the saved bookmark’s URL instead.

**It says loading or shows an error:** check your connection. After an error, tap the bookmark again to retry before beginning the round.

**Nothing happens at all:** make sure you are in Safari itself, have the full code saved, and are on the daily page at `https://krillion.io/`. The current code was tested in mobile WebKit, but has not yet been tested on your physical iPhone.

[Back to the main instructions](../README.md)
