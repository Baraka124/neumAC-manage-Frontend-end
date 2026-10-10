const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const app = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');

test('Library command palette restores focus after dismissal', async ({ page }) => {
  // Exercise the actual handler source with Vue-like reactive objects. No
  // authentication/data is mocked and this is not a full mounted-app test.
  const start = app.indexOf('let newsCommandReturnFocus = null');
  const end = app.indexOf('const newsCommandResults = computed(', start);
  expect(start).toBeGreaterThan(-1);
  expect(end).toBeGreaterThan(start);
  const handlers = app.slice(start, end);
  await page.setContent('<button id="opener">Open Library commands</button><div class="news-v28-command"><input aria-label="Library command search"></div>');
  await page.locator('#opener').focus();
  const outcome = await page.evaluate(async source => {
    const newsCommand = { show:false, query:'', selected:0 };
    const Vue = { nextTick: callback => Promise.resolve().then(callback) };\n    const newsModal = {show:false}, newsDrawer={show:false};
    const run = new Function('newsCommand', 'Vue', 'newsModal', 'newsDrawer', source + ';return {openNewsCommand,closeNewsCommand}');
    const { openNewsCommand, closeNewsCommand } = run(newsCommand, Vue, newsModal, newsDrawer);
    openNewsCommand();
    await Promise.resolve();
    const opened = document.activeElement?.matches('.news-v28-command input') && newsCommand.show;
    closeNewsCommand();
    await Promise.resolve();
    return { opened, restored:document.activeElement?.id === 'opener', closed:!newsCommand.show };
  }, handlers);
  expect(outcome).toEqual({ opened:true, restored:true, closed:true });
});
