void (async () => {
  if (location.origin !== 'https://krillion.io' || location.pathname !== '/' || location.search) return alert('Open the daily dive at https://krillion.io/ first.');
  if (document.getElementById('krillion-daily-helper')) return alert('Your extension is already running.');
  if (window.krillionStop) return window.krillionStop();
  const badge = document.createElement('button');
  badge.textContent = 'Krillion: loading…';
  badge.style.cssText = 'position:fixed;top:8px;right:8px;z-index:2147483647;background:#102234;color:#70e3c5;padding:10px;border:1px solid;border-radius:9px;font:13px system-ui';
  document.documentElement.append(badge);
  const abort = new AbortController();
  let timer, stopped = false;
  const seen = new Set(), edited = new Set();
  const norm = s => String(s).normalize('NFKC').replace(/\s+/g, ' ').trim();
  const question = () => norm(document.querySelector('.ds-card .prompt')?.textContent || '');
  const edit = e => { if (e.isTrusted && e.target.matches?.('.ds-input')) edited.add(question()); };
  document.addEventListener('input', edit, true);
  const stop = () => {
    stopped = true; abort.abort(); clearInterval(timer); badge.remove();
    document.removeEventListener('input', edit, true); delete window.krillionStop;
  };
  window.krillionStop = stop;
  badge.onclick = stop;
  const timeout = setTimeout(() => abort.abort(), 5000);
  try {
    const get = async url => {
      const r = await fetch(url, { signal: abort.signal, credentials: 'omit', cache: 'no-store' });
      if (!r.ok) throw Error('Answer data unavailable');
      return r.json();
    };
    const t = await get('/api/today');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(t.date)) throw Error('Invalid puzzle');
    const r = await get('/api/reveal?date=' + t.date);
    const expires = Date.parse(t.resetsAt);
    if (r.date !== t.date || !(expires > Date.now()) || t.prompts?.length !== 7 || !Array.isArray(r.prompts)) throw Error('Stale answer data');
    const answers = new Map();
    for (const p of t.prompts) {
      const matches = r.prompts.filter(x => x.id === p.id && norm(x.text) === norm(p.text));
      if (matches.length !== 1 || !Array.isArray(matches[0].answers) || answers.has(norm(p.text))) throw Error('Mismatched answers');
      const a = matches[0].answers.filter(x => typeof x.answer === 'string' && x.answer.trim() && ((x.tier === 'krillion' && x.score === 100) || (x.tier === 'deepcut' && x.score === 85))).sort((a, b) => b.score - a.score)[0];
      answers.set(norm(p.text), a);
    }
    clearTimeout(timeout);
    if (stopped) return;
    badge.textContent = 'Krillion ready · tap to stop';
    timer = setInterval(() => {
      if (location.pathname !== '/' || location.search || Date.now() >= expires) return stop();
      const q = question(), a = answers.get(q), input = document.querySelector('form.ds-dock input.ds-input');
      const seconds = Number(document.querySelector('.ds-time-digits')?.textContent);
      if (!a || !input || !input.getClientRects().length || input.disabled || input.readOnly || input.value.trim() || !(seconds > 1) || seen.has(q) || edited.has(q)) return;
      seen.add(q);
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, a.answer);
      input.dispatchEvent(new Event('input', { bubbles: true }));
      badge.textContent = a.score + ' points filled · tap to stop';
    }, 100);
  } catch (e) {
    if (!stopped) { stop(); alert('Krillion helper: ' + e.message + '. Tap the bookmark to retry.'); }
  } finally { clearTimeout(timeout); }
})();
