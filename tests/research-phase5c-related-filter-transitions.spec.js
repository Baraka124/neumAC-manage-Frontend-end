const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const app = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
const start = app.indexOf('const newsDrawerPrev = computed(');
const end = app.indexOf('const parseResearchBody', start);

// Run the application's own computed pager handlers, not rewritten equivalents.
// Still an isolated logic regression: authenticated reader navigation is a separate gate.
test('connected record pager follows current filter without switching to unrelated records', async ({ page }) => {
  expect(start).toBeGreaterThan(-1);
  expect(end).toBeGreaterThan(start);
  const source = app.slice(start, end);
  const transitions = await page.evaluate(source => {
    const A = {id:'A'}, B = {id:'B'}, C = {id:'C'}, related = {id:'related'};
    const newsDrawer = {post:A};
    const newsOps = {filteredNews:{value:[A,B,C]}};
    const computed = fn => ({get value(){return fn()}});
    const build = new Function('computed','newsDrawer','newsOps',
      source + ';return {newsDrawerPrev,newsDrawerNext}');
    const {newsDrawerPrev,newsDrawerNext} = build(computed,newsDrawer,newsOps);
    const snapshot = label => ({
      label, selected:newsDrawer.post?.id ?? null,
      prev:newsDrawerPrev.value?.id ?? null,
      next:newsDrawerNext.value?.id ?? null
    });
    const states = [snapshot('first')];
    newsDrawer.post = B;
    states.push(snapshot('middle'));
    newsOps.filteredNews.value = [C,B,A];
    states.push(snapshot('reordered'));
    newsDrawer.post = related;
    states.push(snapshot('outside-filter'));
    newsOps.filteredNews.value = [];
    states.push(snapshot('empty-filter'));
    newsOps.filteredNews.value = [A,B,C];
    newsDrawer.post = null;
    states.push(snapshot('closed'));
    return states;
  }, source);
  expect(transitions).toEqual([
    {label:'first',selected:'A',prev:null,next:'B'},
    {label:'middle',selected:'B',prev:'A',next:'C'},
    {label:'reordered',selected:'B',prev:'C',next:'A'},
    {label:'outside-filter',selected:'related',prev:null,next:null},
    {label:'empty-filter',selected:'related',prev:null,next:null},
    {label:'closed',selected:null,prev:null,next:null}
  ]);
});
