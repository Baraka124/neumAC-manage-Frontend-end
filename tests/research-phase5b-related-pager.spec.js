const { test, expect } = require('@playwright/test');
const fs = require('fs'), path = require('path');
const app = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');

test('pager does not offer an unrelated Next when a connected record is outside current filtered view', async ({ page }) => {
  const start = app.indexOf('const newsDrawerPrev = computed(');
  const end = app.indexOf('const parseResearchBody', start);
  expect(start).toBeGreaterThan(-1);
  expect(end).toBeGreaterThan(start);
  const source = app.slice(start, end);
  const result = await page.evaluate(source => {
    const newsDrawer = { post:{ id:'related', title:'Related publication' } };
    const newsOps = { filteredNews:{value:[{id:'A',title:'First'}, {id:'B',title:'Second'}]} };
    const computed = fn => ({get value(){return fn()}});
    const build = new Function('computed','newsDrawer','newsOps',source+';return {newsDrawerPrev,newsDrawerNext}');
    const {newsDrawerPrev,newsDrawerNext} = build(computed,newsDrawer,newsOps);
    const pair = () => ({prev:newsDrawerPrev.value?.id ?? null,next:newsDrawerNext.value?.id ?? null});
    const outside = pair();
    newsDrawer.post = newsOps.filteredNews.value[0];
    const first = pair();
    newsDrawer.post = newsOps.filteredNews.value[1];
    const last = pair();
    newsOps.filteredNews.value = [];
    const empty = pair();
    return {outside,first,last,empty};
  },source);
  expect(result).toEqual({
    outside:{prev:null,next:null},
    first:{prev:null,next:'B'},
    last:{prev:'A',next:null},
    empty:{prev:null,next:null}
  });
});
