(() => {
  'use strict';
  const core = globalThis.KrillionHelperCore;
  const extensionAPI = globalThis.browser || globalThis.chrome;
  if (document.getElementById('krillion-daily-helper')) return;
  let enabled = false, loaded = false, puzzle = null, loading = false, error = '', generation = 0;
  let controller = null, round = null, scheduled = false, wasDaily = false;
  const rounds = new Map();
  const editedPrompts = new Set();
  const host = document.createElement('div');
  host.id = 'krillion-daily-helper';
  const shadow = host.attachShadow({ mode: 'open' });
  shadow.innerHTML = `<style>
    :host{all:initial;position:fixed;z-index:2147483647;top:12px;right:12px;font:14px/1.45 system-ui,sans-serif;color:#eaf7ff}
    section{box-sizing:border-box;width:290px;max-width:calc(100vw - 24px);padding:16px;background:#102234;border:1px solid #3d647c;border-radius:14px;box-shadow:0 8px 32px #0006}
    header{display:flex;align-items:center;justify-content:space-between;gap:12px} strong{font-size:14px} label{white-space:nowrap;font-size:12px}input{accent-color:#70e3c5}
    #status{color:#b4cbd9;font-size:12px;margin:12px 0 6px}#answer{font-size:20px;font-weight:700;overflow-wrap:anywhere}#tier{color:#70e3c5;font-size:12px;margin:4px 0 12px}
    button{font:inherit;cursor:pointer;background:#70e3c5;color:#102234;border:0;border-radius:7px;padding:7px 12px}button:disabled{opacity:.45;cursor:default}#retry{background:#28475d;color:#fff;margin-left:6px}
    small{display:block;color:#b4cbd9;font-size:11px;margin-top:12px}button:focus-visible,input:focus-visible{outline:2px solid white;outline-offset:3px}
    :host([hidden]){display:none!important}#collapse{padding:2px 7px;background:#28475d;color:white}section.compact>:not(header){display:none}section.compact{width:auto}header strong{font-size:12px}
    @media(max-width:600px){:host{top:max(8px,env(safe-area-inset-top));right:8px}section{width:260px;padding:10px}#answer{font-size:17px}}
  </style><section aria-label="Krillion Daily Helper"><header><strong>Krillion Daily Helper</strong><label><input id="enabled" type="checkbox"> Enabled</label></header><div id="status" role="status"></div><div id="answer"></div><div id="tier"></div><button id="fill" disabled>Fill answer</button><button id="retry" hidden>Retry</button><small>You can edit before submitting. Krillion submits filled answers when its timer expires.</small></section>`;
  document.documentElement.append(host);
  const ui = Object.fromEntries(['enabled','status','answer','tier','fill','retry'].map(id => [id, shadow.getElementById(id)]));
  const collapse = document.createElement('button');
  collapse.id = 'collapse';
  const panel = shadow.querySelector('section');
  let compact = matchMedia('(max-width:600px)').matches;
  const updateCompact = () => {
    panel.classList.toggle('compact', compact);
    collapse.textContent = compact ? '+' : '−';
    collapse.setAttribute('aria-label', compact ? 'Expand helper' : 'Collapse helper');
    collapse.setAttribute('aria-expanded', String(!compact));
  };
  collapse.addEventListener('click', () => { compact = !compact; updateCompact(); });
  shadow.querySelector('header').append(collapse);
  updateCompact();
  const daily = () => location.pathname === '/' && !location.search && !location.hash;
  const visible = el => !!el && el.getClientRects().length > 0 && getComputedStyle(el).visibility !== 'hidden';
  const setText = (el, text) => { if (el.textContent !== text) el.textContent = text; };
  async function load() {
    if (!daily() || !enabled || loading) return;
    const token = ++generation;
    loading = true; error = ''; puzzle = null;
    controller = new AbortController();
    const signal = controller.signal;
    const requestController = controller;
    const timeout = setTimeout(() => requestController.abort(), 5000);
    tick();
    try {
      const read = async url => {
        const response = await fetch(url, { signal, cache: 'no-store', credentials: 'omit' });
        if (!response.ok) throw new Error('Answer data is unavailable.');
        return response.json();
      };
      const today = await read('/api/today');
      if (!/^\d{4}-\d{2}-\d{2}$/.test(today?.date)) throw new Error('Invalid puzzle date.');
      const reveal = await read('/api/reveal?date=' + encodeURIComponent(today.date));
      const result = core.validate(today, reveal);
      if (token === generation && daily() && enabled) puzzle = result;
    } catch (err) {
      if (token === generation) error = signal.aborted ? 'Answer lookup timed out. Retry when ready.' : err.message;
    } finally {
      clearTimeout(timeout);
      if (token === generation) { loading = false; controller = null; tick(); }
    }
  }
  function cancel() {
    generation++; controller?.abort(); controller = null; loading = false; puzzle = null;
  }
  function inspect() {
    const input = document.querySelector('form.ds-dock input.ds-input');
    const cards = [...document.querySelectorAll('.ds-card .prompt')].filter(visible);
    const timer = document.querySelector('.ds-dock .ds-time-digits');
    if (!visible(input) || input.disabled || input.readOnly || cards.length !== 1 || !visible(timer)) return null;
    const prompt = core.find(puzzle, cards[0].textContent);
    if (!prompt) return null;
    const key = `${puzzle.date}:${prompt.id}`;
    if (!rounds.has(key)) rounds.set(key, { touched: false, filled: false });
    const state = rounds.get(key);
    if (editedPrompts.has(prompt.text)) state.touched = true;
    return { input, prompt, key, state, seconds: /^\d+$/.test(timer.textContent.trim()) ? Number(timer.textContent.trim()) : NaN };
  }
  function fill(manual = false) {
    if (!daily() || !puzzle || Date.now() >= puzzle.expires) return;
    const current = inspect();
    if (!current?.prompt.best || !core.canFill({ enabled, seconds: current.seconds, value: current.input.value, ...current.state, manual })) return;
    current.state.filled = true;
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(current.input, current.prompt.best.answer);
    current.input.dispatchEvent(new Event('input', { bubbles: true }));
    tick();
  }
  function tick() {
    if (!globalThis.document?.body) return;
    host.hidden = !daily();
    if (!daily()) {
      if (wasDaily) cancel();
      wasDaily = false; return;
    }
    if (!wasDaily) { wasDaily = true; if (loaded && enabled) void load(); }
    if (puzzle && Date.now() >= puzzle.expires) { cancel(); error = 'Puzzle expired. Reload the game for the new daily dive.'; }
    round = inspect();
    ui.enabled.checked = enabled;
    ui.retry.hidden = !enabled || !error;
    ui.fill.disabled = !round?.prompt.best || !core.canFill({ enabled, seconds: round?.seconds, value: round?.input.value || '', ...round?.state, manual: true });
    const best = enabled ? round?.prompt.best : null;
    setText(ui.answer, best?.answer || '');
    setText(ui.tier, best ? (best.tier === 'krillion' ? 'One in a Krillion · 100 points' : 'Deep Cut · 85 points') : '');
    let status = !loaded ? 'Loading settings…' : !enabled ? 'Paused' : loading ? 'Loading verified answers…' : error || (round ? !best ? 'No verified top-tier answer.' : round.state.filled ? 'Filled — you can edit the answer.' : round.input.value || round.state.touched ? 'Your input is preserved.' : 'Verified answer ready.' : puzzle ? 'Ready — waiting for a daily question.' : 'Waiting for answer data.');
    if (enabled && puzzle && !round && document.querySelector('form.ds-dock input.ds-input')) status = 'Question not verified — autofill paused.';
    setText(ui.status, status);
    if (round?.prompt.best && core.canFill({ enabled, seconds: round.seconds, value: round.input.value, ...round.state })) fill();
  }
  function schedule() {
    if (scheduled) return;
    scheduled = true;
    queueMicrotask(() => { scheduled = false; tick(); });
  }
  document.addEventListener('input', event => {
    if (event.isTrusted && event.target.matches?.('form.ds-dock input.ds-input')) {
      const current = inspect();
      if (current) current.state.touched = true;
      // Keep edits made before answer data arrives too.
      const question = document.querySelector('.ds-card .prompt');
      if (question) editedPrompts.add(core.normalize(question.textContent));
      schedule();
    }
  }, true);
  ui.fill.addEventListener('click', () => fill(true));
  ui.retry.addEventListener('click', () => { if (!loading) void load(); });
  ui.enabled.addEventListener('change', () => {
    enabled = ui.enabled.checked;
    extensionAPI.storage.local.set({ enabled }).catch(() => {});
    if (enabled) void load(); else cancel();
    tick();
  });
  extensionAPI.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes.enabled && enabled !== changes.enabled.newValue) {
      enabled = changes.enabled.newValue !== false;
      if (enabled) void load(); else cancel();
      tick();
    }
  });
  new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true, characterData: true });
  setInterval(schedule, 250);
  extensionAPI.storage.local.get({ enabled: true }).then(settings => {
    enabled = settings.enabled !== false; loaded = true; tick();
    if (enabled && !loading && !puzzle) void load();
  }).catch(() => { loaded = true; error = 'Could not load extension settings. Reload this tab.'; tick(); });
})();
