(function (root) {
  'use strict';
  const normalize = text => String(text).normalize('NFKC').replace(/\s+/g, ' ').trim();
  function validate(today, reveal, now = Date.now()) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(today?.date) || reveal?.date !== today.date ||
        !Number.isFinite(Date.parse(today.resetsAt)) || Date.parse(today.resetsAt) <= now ||
        !Array.isArray(today.prompts) || today.prompts.length !== 7 || !Array.isArray(reveal.prompts)) {
      throw new Error('Puzzle data is stale or unavailable.');
    }
    const ids = new Set(), texts = new Set();
    const prompts = today.prompts.map(prompt => {
      if (typeof prompt.id !== 'string' || !prompt.id || typeof prompt.text !== 'string' ||
          !normalize(prompt.text) || ids.has(prompt.id) || texts.has(normalize(prompt.text))) {
        throw new Error('Puzzle questions could not be verified.');
      }
      ids.add(prompt.id); texts.add(normalize(prompt.text));
      const matches = reveal.prompts.filter(item => item?.id === prompt.id);
      const sheet = matches[0];
      if (matches.length !== 1 || normalize(sheet?.text) !== normalize(prompt.text) || !Array.isArray(sheet?.answers)) {
        throw new Error('Answer sheet does not match this puzzle.');
      }
      const answers = sheet.answers.filter(a => typeof a?.answer === 'string' && a.answer.trim() &&
        ((a.tier === 'krillion' && a.score === 100) || (a.tier === 'deepcut' && a.score === 85)));
      answers.sort((a, b) => b.score - a.score || a.answer.length - b.answer.length || a.answer.localeCompare(b.answer, 'en'));
      return { id: prompt.id, text: normalize(prompt.text), best: answers[0] || null };
    });
    return { date: today.date, expires: Date.parse(today.resetsAt), prompts };
  }
  function find(puzzle, text, now = Date.now()) {
    return puzzle && now < puzzle.expires ? puzzle.prompts.find(p => p.text === normalize(text)) || null : null;
  }
  function canFill({ enabled, seconds, value, touched, filled, manual = false }) {
    return enabled && Number.isFinite(seconds) && seconds > 1 && !value.trim() && (manual || (!touched && !filled));
  }
  const api = { normalize, validate, find, canFill };
  if (typeof module !== 'undefined') module.exports = api;
  else root.KrillionHelperCore = api;
})(globalThis);
