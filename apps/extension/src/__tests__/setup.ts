// jsdom doesn't implement innerText (it requires layout info jsdom doesn't
// compute) — the parsers under src/lib/parsers read innerText throughout,
// so fall back to textContent for tests, which is an adequate stand-in
// since fixture markup has no CSS-hidden text to worry about.
Object.defineProperty(HTMLElement.prototype, 'innerText', {
  get(this: HTMLElement) {
    return this.textContent ?? '';
  },
  configurable: true,
});
