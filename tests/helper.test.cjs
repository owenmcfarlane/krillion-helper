const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { JSDOM } = require('jsdom');
const core = require('../extension/core.js');
const today = { date: '2026-10-21', resetsAt: '2099-10-22T04:00:00Z', prompts: Array.from({ length: 7 }, (_, i) => ({ id: `p${i + 1}`, text: `Question ${i + 1}?` })) };
const reveal = { date: today.date, prompts: today.prompts.map(p => ({ ...p, answers: [{ answer: 'Deep answer', tier: 'deepcut', score: 85 }, { answer: 'Top answer', tier: 'krillion', score: 100 }] })) };
const clone = x => structuredClone(x);
test('selects verified top tier and falls back only to Deep Cut', () => {
  assert.equal(core.validate(today, reveal).prompts[0].best.answer, 'Top answer');
  const r = clone(reveal); r.prompts[0].answers.pop();
  assert.equal(core.validate(today, r).prompts[0].best.tier, 'deepcut');
  r.prompts[0].answers[0].score = 60;
  assert.equal(core.validate(today, r).prompts[0].best, null);
});
test('rejects mismatched dates, prompts, duplicate IDs, malformed and expired data', () => {
  for (const change of [r => r.date = '2026-10-20', r => r.prompts[0].text = 'Wrong', r => r.prompts.push(r.prompts[0]), r => r.prompts[0].answers = null]) {
    const r = clone(reveal); change(r); assert.throws(() => core.validate(today, r));
  }
  assert.throws(() => core.validate({ ...today, resetsAt: '2020-01-01' }, reveal));
  assert.equal(core.find(core.validate(today, reveal), 'Unknown'), null);
  assert.equal(core.find(core.validate(today, reveal), 'Question 1?', Date.parse(today.resetsAt)), null);
});
test('fill guard preserves edits, avoids last-second and repeated fills', () => {
  const valid = { enabled: true, seconds: 25, value: '', touched: false, filled: false };
  assert.equal(core.canFill(valid), true);
  for (const patch of [{ enabled: false }, { seconds: 0 }, { seconds: 1 }, { seconds: NaN }, { value: 'mine' }, { touched: true }, { filled: true }]) assert.equal(core.canFill({ ...valid, ...patch }), false);
  assert.equal(core.canFill({ ...valid, filled: true, manual: true }), true);
});
const settle = () => new Promise(resolve => setTimeout(resolve, 25));
async function harness({ deferred = false, value = '', seconds = 25, pathname = '/', bookmarklet = false } = {}) {
  const dom = new JSDOM(`<body><div class="ds-card"><div class="prompt">Question 1?</div></div><form class="ds-dock"><input class="ds-input"><span class="ds-time-digits">${seconds}</span></form></body>`, { url: 'https://krillion.io' + pathname, runScripts: 'outside-only', pretendToBeVisual: true });
  const w = dom.window;
  w.HTMLElement.prototype.getClientRects = () => [1];
  w.matchMedia = () => ({ matches: false });
  w.chrome = { storage: { local: { get: async () => ({ enabled: true }), set: async () => {} }, onChanged: { addListener() {} } } };
  let release;
  const gate = new Promise(resolve => { release = resolve; });
  const requests = [];
  w.fetch = async (url, options) => {
    requests.push({ url, options });
    if (deferred && url.includes('reveal')) await gate;
    return { ok: true, json: async () => clone(url.includes('reveal') ? reveal : today) };
  };
  const input = w.document.querySelector('input'); input.value = value;
  let submits = 0, observed = '';
  w.document.querySelector('form').addEventListener('submit', e => { e.preventDefault(); submits++; });
  input.addEventListener('input', () => { observed = input.value; });
  if (bookmarklet) w.eval(fs.readFileSync('bookmarklet.js', 'utf8'));
  else for (const name of ['core.js', 'content.js']) w.eval(fs.readFileSync(`extension/${name}`, 'utf8'));
  await settle();
  return { dom, w, input, requests, release, get submits() { return submits; }, get observed() { return observed; } };
}
test('DOM integration fills through input event once, preserves editing, advances rounds without submitting', async () => {
  const h = await harness();
  try {
    assert.equal(h.input.value, 'Top answer'); assert.equal(h.observed, 'Top answer'); assert.equal(h.submits, 0);
    h.input.value = ''; h.w.document.querySelector('.ds-time-digits').textContent = '23'; await settle();
    assert.equal(h.input.value, '');
    h.w.document.querySelector('.prompt').textContent = 'Question 2?'; await settle();
    assert.equal(h.input.value, 'Top answer');
    assert.equal(h.requests.length, 2);
    assert.ok(h.requests.every(r => !r.options.method || r.options.method === 'GET'));
  } finally { h.dom.window.close(); }
});
test('bookmarklet fills without submitting, preserves later edits, and can stop cleanly', async () => {
  const h = await harness({ bookmarklet: true });
  try {
    await new Promise(resolve => setTimeout(resolve, 150));
    assert.equal(h.input.value, 'Top answer'); assert.equal(h.submits, 0);
    h.input.value = '';
    await new Promise(resolve => setTimeout(resolve, 150));
    assert.equal(h.input.value, '');
    h.w.krillionStop();
    assert.equal(h.w.krillionStop, undefined);
    h.w.document.querySelector('.prompt').textContent = 'Question 2?';
    await new Promise(resolve => setTimeout(resolve, 150));
    assert.equal(h.input.value, '');
  } finally { h.dom.window.close(); }
});
test('preserves an existing answer and does not fill expired rounds or unsupported modes', async () => {
  for (const config of [{ value: 'My answer' }, { seconds: 0 }, { pathname: '/party' }]) {
    const h = await harness(config);
    try { assert.equal(h.input.value, config.value || ''); if (config.pathname) assert.equal(h.requests.length, 0); }
    finally { h.dom.window.close(); }
  }
});
test('delayed lookup uses the current round and ignores results after navigating away', async () => {
  const h = await harness({ deferred: true });
  try {
    h.w.document.querySelector('.prompt').textContent = 'Unknown question';
    h.release(); await settle(); assert.equal(h.input.value, '');
  } finally { h.dom.window.close(); }
  const h2 = await harness({ deferred: true });
  try {
    h2.w.history.pushState({}, '', '/unlimited/classic'); h2.release(); await settle();
    assert.equal(h2.input.value, '');
  } finally { h2.dom.window.close(); }
});
