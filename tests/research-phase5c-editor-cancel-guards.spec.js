const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const app = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');

// Test the production return-handler source, retaining Phase 4C's isolated
// level of evidence. This does not substitute for authenticated Vue E2E.
test('cancelled return preserves dirty Library editor and reader identity', async ({page}) => {
  const start = app.indexOf('const _returnNewsEditorToReaderNow = () =>');
  const end = app.indexOf('const openAssignRotationFromUnit', start);
  expect(start).toBeGreaterThanOrEqual(0);
  expect(end).toBeGreaterThan(start);
  const source = app.slice(start, end);
  const state = await page.evaluate(source => {
    const newsModal = { show:true, stage:'compose', saveState:'Unsaved changes', mode:'edit', form:{id:42} };
    const newsPublishReview = {value:true}, newsEditorDetailsOpen={value:true};
    const newsPosts = {value:[{id:42,title:'Saved'}]};
    const newsDrawer = {show:true,post:{id:42,title:'Currently reading'}};
    let confirmation=null, opened=0;
    const showConfirmation = opts => {confirmation=opts;};
    const openNewsDrawer = () => {opened++;};
    const _newsEditorHasMeaningfulContent = () => true;
    const handler = new Function(
      'newsModal','newsPublishReview','newsEditorDetailsOpen','newsPosts',
      'newsDrawer','showConfirmation','openNewsDrawer','_newsEditorHasMeaningfulContent',
      source+'; return closeNewsEditorToReader;'
    )(newsModal,newsPublishReview,newsEditorDetailsOpen,newsPosts,newsDrawer,
      showConfirmation,openNewsDrawer,_newsEditorHasMeaningfulContent);
    handler();
    // Simulate dismissing the confirmation without invoking its onConfirm.
    const offered = confirmation?.confirmButtonText === 'Discard changes';
    confirmation = null;
    return {
      offered,modalOpen:newsModal.show,stage:newsModal.stage,
      saveState:newsModal.saveState,readerTitle:newsDrawer.post.title,
      detailsOpen:newsEditorDetailsOpen.value,publishReview:newsPublishReview.value,
      opened
    };
  }, source);
  expect(state).toEqual({
    offered:true,modalOpen:true,stage:'compose',
    saveState:'Unsaved changes',readerTitle:'Currently reading',
    detailsOpen:true,publishReview:true,opened:0
  });
});

test('meaningful unsaved new Library record requires confirmation before leaving', async ({page}) => {
  const start = app.indexOf('const _returnNewsEditorToReaderNow = () =>');
  const end = app.indexOf('const openAssignRotationFromUnit', start);
  expect(start).toBeGreaterThanOrEqual(0);
  expect(end).toBeGreaterThan(start);
  const source = app.slice(start,end);
  const state = await page.evaluate(source => {
    const newsModal = {show:true,stage:'compose',saveState:'',mode:'add',form:{id:null,title:'Draft'}};
    const newsPublishReview={value:false},newsEditorDetailsOpen={value:true};
    const newsPosts={value:[]};
    const newsDrawer={show:true,post:{id:17,title:'Original reader'}};
    let confirmation=null, opened=0;
    const showConfirmation=opts=>{confirmation=opts};
    const openNewsDrawer=()=>{opened++};
    const _newsEditorHasMeaningfulContent=()=>true;
    const handler=new Function('newsModal','newsPublishReview','newsEditorDetailsOpen',
      'newsPosts','newsDrawer','showConfirmation','openNewsDrawer',
      '_newsEditorHasMeaningfulContent',
      source+'; return closeNewsEditorToReader;'
    )(newsModal,newsPublishReview,newsEditorDetailsOpen,newsPosts,newsDrawer,
      showConfirmation,openNewsDrawer,_newsEditorHasMeaningfulContent);
    handler();
    return {prompted:!!confirmation,editorOpen:newsModal.show,
      originalRecord:newsDrawer.post.id,opened};
  },source);
  expect(state).toEqual({prompted:true,editorOpen:true,originalRecord:17,opened:0});
});
