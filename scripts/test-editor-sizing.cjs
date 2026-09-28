/* global __dirname */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const ts = require('typescript');
const { chromium } = require(process.argv[2] || 'playwright');

(async () => {
  const source = fs.readFileSync(path.join(__dirname, '../src/components/rich-composer.tsx'), 'utf8');
  const htmlFunction = source.slice(source.indexOf('function editorHtml('), source.indexOf('const styles ='));
  const context = { communityEmojis: [], communityEmojiData: {} };
  vm.createContext(context);
  vm.runInContext(ts.transpile(htmlFunction), context);
  const browser = await chromium.launch({ headless: true, channel: process.env.TEST_BROWSER_CHANNEL || 'chrome' });
  try {
    const page = await browser.newPage({ viewport: { width: 350, height: 130 } });
    await page.addInitScript(() => {
      window.messages = [];
      window.ReactNativeWebView = { postMessage: value => window.messages.push(JSON.parse(value)) };
    });
    // setContent does not run init scripts, so install the WebView bridge first.
    await page.goto('about:blank');
    await page.setContent(context.editorHtml('', 'Reply'));
    await page.locator('#editor').fill(Array.from({ length: 45 }, (_, i) => `Line ${i + 1}`).join('\n'));
    await page.waitForFunction(() => window.messages.some(message => message.height > 1000));
    const height = await page.evaluate(() => window.messages.filter(message => message.height).at(-1).height);
    assert(height > 1000, 'long replies must request a taller native editor');
    await page.setViewportSize({ width: 350, height });
    assert(await page.locator('#editor').evaluate(el => el.getBoundingClientRect().bottom <= innerHeight), 'all lines must fit inside the expanded viewport');
    await page.evaluate(() => window.w2eSet('Short reply'));
    await page.waitForFunction(() => window.messages.filter(message => message.height).at(-1).height < 150);
    assert(await page.locator('#editor').innerText() === 'Short reply', 'reset keeps content intact');

    // The website uses a separate scrolling editor. Verify its existing CSS
    // keeps the caret visible when the 520px maximum is reached.
    const css = fs.readFileSync(path.join(__dirname, '../../app/globals.css'), 'utf8');
    await page.setViewportSize({ width: 390, height: 800 });
    await page.setContent(`<style>${css}</style><div class="comment-composer"><div class="rich-comment-editor"><div class="comment-visual-input" contenteditable="true"><p>Reply</p></div></div></div>`);
    const editor = page.locator('.comment-visual-input');
    await editor.fill(Array.from({ length: 50 }, (_, i) => `Website line ${i + 1}`).join('\n'));
    await editor.press('Control+End');
    await editor.press('Enter');
    await editor.press('X');
    const geometry = await editor.evaluate(el => {
      const selection = getSelection();
      const range = selection.getRangeAt(0).cloneRange();
      range.setStart(range.endContainer, Math.max(0, range.endOffset - 1));
      const caret = range.getBoundingClientRect();
      const box = el.getBoundingClientRect();
      return { visible: caret.top >= box.top && caret.bottom <= box.bottom, scrollable: el.scrollHeight > el.clientHeight, scrollTop: el.scrollTop };
    });
    assert(geometry.scrollable && geometry.scrollTop > 0 && geometry.visible, 'website editor must scroll new typing into view');
    console.log('PASS: app editor grows and shrinks; website editor scrolls the typing caret into view.');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
