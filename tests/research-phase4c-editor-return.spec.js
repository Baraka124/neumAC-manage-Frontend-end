const { test, expect } = require('@playwright/test');
const fs = require('fs'), path = require('path');
const app = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');

test('Library return to reader protects unsaved edits and resumes on confirmation', async ({ page }) => {
  const start = app.indexOf('const _returnNewsEditorToReaderNow = () =>');
  const end = app.indexOf('const openAssignRotationFromUnit', start);
  expect(start).toBeGreaterThan(-1);
  expect(end).toBeGreaterThan(start);
  const source = app.slice(start, end);
  await page.goto('/');
  const result = await page.evaluate(source => {
    const newsModal = { show:true, stage:'compose', saveState:'Unsaved changes', mode:'edit', form:{ id:42 } };
    const newsPublishReview = {value:true}, newsEditorDetailsOpen={value:true};
    const newsPosts={value:[{id:42,title:'Persisted publication'}]};
    const newsDrawer={show:true,post:{id:42,title:'Previously loaded'}};
    let confirmation=null;
    const showConfirmation = options => { confirmation=options };
    const openNewsDrawer = () => { throw Error('Existing reader must be reused') };
    const _newsEditorHasMeaningfulContent=()=>false;
    const fn=new Function('newsModal','newsPublishReview','newsEditorDetailsOpen','newsPosts','newsDrawer','showConfirmation','openNewsDrawer','_newsEditorHasMeaningfulContent',source+'; return closeNewsEditorToReader');
    const go=fn(newsModal,newsPublishReview,newsEditorDetailsOpen,newsPosts,newsDrawer,showConfirmation,openNewsDrawer,_newsEditorHasMeaningfulContent);
    go();
    const guarded=!!confirmation && newsModal.show && newsDrawer.post.title==='Previously loaded';
    confirmation.onConfirm();
    const confirmed=!newsModal.show && !newsPublishReview.value && !newsEditorDetailsOpen.value && newsDrawer.post.title==='Persisted publication';
    newsModal.show=true; newsModal.saveState=''; confirmation=null; go();
    const clean=!newsModal.show && !confirmation;
    return {guarded,confirmed,clean};
  }, source);
  expect(result).toEqual({guarded:true,confirmed:true,clean:true});
});
