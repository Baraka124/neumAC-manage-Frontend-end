const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const app = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
const start = app.indexOf('const openNewsDrawer = (post, sourceRect = null) =>');
const end = app.indexOf('const exploreNewsLine = (lineId) =>', start);

async function runReaderSequence(page, removeOrigin) {
  await page.setContent(`
    <main class="news-view">
      <input class="library-search" aria-label="Search Research Library">
      <div class="news-v25-search"><input aria-label="Library filters"></div>
      <nav class="news-v25-tabs"><button type="button">All</button></nav>
      <article class="knowledge-card" data-news-record-id="A" tabindex="0">Record A</article>
      <article class="knowledge-card" data-news-record-id="B" tabindex="0">Record B</article>
    </main>
    <section class="nrd-drawer" tabindex="-1"><div class="nrd-v27-scroll"></div></section>`);
  return page.evaluate(({source, removeOrigin}) => {
    const A = {id:'A',title:'Origin publication'}, B = {id:'B',title:'Connected publication'};
    const newsDrawer = {show:false,post:null,returnFocusId:null,returnWindowY:0,returnContentY:0,
      sourceRect:null,manageOpen:false,detailsOpen:false,publicPreview:false,connectionMode:''};
    const newsReturnFocusId = {value:null};
    const newsReadingProgress = {value:0};
    const newsReaderCompact = {value:false};
    const scroller = document.querySelector('.news-view');
    scroller.scrollTop = 125;
    const render = () => {
      for (const card of document.querySelectorAll('.knowledge-card')) {
        card.classList.toggle('is-return-focus',card.dataset.newsRecordId === newsReturnFocusId.value);
      }
    };
    const Vue = {nextTick(fn){render(); if(fn)fn();}};
    const getNewsScroller = () => scroller;
    const uiAfterPaint = fn => {render();fn();};
    const uiFocusWithoutScroll = el => el?.focus({preventScroll:true});
    const closeNewsPeek = () => {};
    const closeNewsActionMenu = () => {};
    const build = new Function('newsDrawer','getNewsScroller','closeNewsPeek',
      'closeNewsActionMenu','newsReadingProgress','newsReaderCompact','uiAfterPaint',
      'uiFocusWithoutScroll','Vue','newsReturnFocusId', source +
      '; return {openNewsDrawer,closeNewsDrawer}');
    const {openNewsDrawer,closeNewsDrawer} = build(newsDrawer,getNewsScroller,
      closeNewsPeek,closeNewsActionMenu,newsReadingProgress,newsReaderCompact,
      uiAfterPaint,uiFocusWithoutScroll,Vue,newsReturnFocusId);

    openNewsDrawer(A,null);
    const captured = newsDrawer.returnFocusId;
    openNewsDrawer(B,null);
    const preserved = newsDrawer.returnFocusId;
    const selectedBeforeClose = newsDrawer.post?.id;
    if (removeOrigin) document.querySelector('[data-news-record-id="A"]').remove();
    closeNewsDrawer();
    const focused = document.activeElement;
    return {
      captured, preserved, selectedBeforeClose,
      closed:newsDrawer.show === false,
      originCleared:newsDrawer.returnFocusId === null,
      highlighted:newsReturnFocusId.value,
      focusedRecord:focused?.dataset?.record || null,
      fallbackFocused:focused?.matches('.news-v25-search input') || false
    };
  }, {source:app.slice(start,end),removeOrigin});
}

test('reader returns focus to originating Library record after following a connection', async ({page}) => {
  expect(start).toBeGreaterThanOrEqual(0);
  expect(end).toBeGreaterThan(start);
  const result = await runReaderSequence(page,false);
  expect(result).toEqual({
    captured:'A',preserved:'A',selectedBeforeClose:'B',
    closed:true,originCleared:true,highlighted:'A',
    focusedRecord:'A',fallbackFocused:false
  });
});

test('reader returns keyboard focus to Library controls if origin no longer exists in filtered results', async ({page}) => {
  expect(start).toBeGreaterThanOrEqual(0);
  expect(end).toBeGreaterThan(start);
  const result = await runReaderSequence(page,true);
  expect(result).toEqual({
    captured:'A',preserved:'A',selectedBeforeClose:'B',
    closed:true,originCleared:true,highlighted:'A',
    focusedRecord:null,fallbackFocused:true
  });
});

// Source-backed browser DOM tests; the authenticated Vue/API release gate remains open.
