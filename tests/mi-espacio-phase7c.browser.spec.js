'use strict';
// Phase 7C: actual Chromium rendering of the real Mi Espacio Vue component.
// Synthetic, permission-scoped API responses; no production staff records or credentials.
const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const vue = fs.readFileSync(require.resolve('vue/dist/vue.global.prod.js'), 'utf8');

async function mountPersonalSpace(page, { linked = true } = {}) {
  await page.setContent('<!doctype html><html lang="es"><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;background:#fbfcfb;font-family:Arial,sans-serif"><main id="app"></main></body></html>');
  await page.addStyleTag({ content: read('mi-espacio/mi-espacio.css') });
  await page.addScriptTag({ content: vue });
  await page.addScriptTag({ content: read('mi-espacio/mi-espacio-data.js') });
  await page.addScriptTag({ content: read('mi-espacio/mi-espacio.js') });
  await page.evaluate(({ linked }) => {
    const context = {
      id: 'visual-person', account_status: 'active', full_name: 'Dra. Persona de Prueba',
      email: 'visual@example.invalid', medical_staff_id: linked ? 'medical-visual' : null,
      linked_staff: linked ? {
        id: 'medical-visual', full_name: 'Dra. Persona de Prueba',
        specialization: 'Neumología · Investigación clínica',
        professional_email: 'visual@example.invalid'
      } : null
    };
    const activity = {
      agenda: {
        guardias: [
          { id: 'duty-1', date: '2026-10-18', shift: 'on_call_present', role: 'primary' },
          { id: 'duty-2', date: '2026-10-25', shift: 'on_call_home', role: 'backup' }
        ],
        rotations: [], absences: []
      },
      research: {
        lines: [{ id: 'line-1', line_number: 4,
          name: 'Investigación traslacional en enfermedades respiratorias complejas y biomarcadores de caracterización longitudinal',
          role: 'member' }],
        studies: [{ id: 'study-1',
          title: 'Estudio observacional multicéntrico sobre caracterización fenotípica y validación de biomarcadores respiratorios',
          protocol_id: 'PROTO-2026-EXTENDED', role: 'PI', status: 'active' }],
        projects: [{ id: 'project-1',
          title: 'Plataforma interdisciplinar para análisis longitudinal de datos clínicos y sistemas de apoyo a la investigación',
          stage: 'pilot', category: 'Innovación clínica', role: 'lead' }]
      },
      publications: { available: true, items: [
        { id: 'pub-1',
          title: 'Longitudinal respiratory outcomes across heterogeneous clinical cohorts: methodological considerations for multicentre observational research and translational validation',
          byline: 'García M, López A, Fernández M, Rodríguez P, Sánchez T, Martínez C, Gómez R, Pérez S, Alvarez D, et al.',
          author_order: 4, corresponding: false },
        { id: 'pub-2', title: 'Respiratory clinical research in real-world cohorts',
          byline: 'Persona de Prueba P, et al.', author_order: 1, corresponding: true }
      ] }
    };
    const request = (endpoint) => {
      if (endpoint === '/api/auth/me') return Promise.resolve(context);
      if (endpoint === '/api/me/context') return Promise.resolve(activity);
      if (endpoint === '/api/me/discrepancies') return Promise.resolve([]);
      if (endpoint === '/api/news?type=publication') return Promise.resolve([]);
      throw new Error('Unexpected synthetic test endpoint: ' + endpoint);
    };
    window.__miVisualErrors = [];
    window.addEventListener('error', event => window.__miVisualErrors.push(event.message));
    const view = window.NeumMiEspacio.createView({ Vue: window.Vue, API: { request } });
    const app = window.Vue.createApp(view, {
      active: true, user: { id: 'visual-person', admin_level: 0 },
      canOpenView: viewId => viewId === 'oncall_schedule'
    });
    app.config.errorHandler = error => window.__miVisualErrors.push(String(error));
    app.mount('#app');
    window.__miVisualApp = app;
  }, { linked });
  if (linked) {
    await expect(page.locator('.me-portfolio .me-portfolio-entry').first()).toBeVisible();
    await expect(page.locator('.me-publications .me-publication-entry')).toHaveCount(2);
  } else {
    await expect(page.getByText('Vinculación pendiente')).toBeVisible();
  }
}

async function assertNoHorizontalClipping(page) {
  const result = await page.evaluate(() => {
    const visible = el => {
      const style = getComputedStyle(el);
      return style.display !== 'none' && style.visibility !== 'hidden' && el.getBoundingClientRect().width > 0;
    };
    const selectors = [
      '.mi-espacio', '.mi-espacio-head', '.mi-espacio-person', '.me-agenda-layout',
      '.me-duty-workspace', '.me-portfolio', '.me-publications',
      '.me-portfolio-entry', '.me-inline-detail', '.me-report-form'
    ];
    const failures = [];
    for (const selector of selectors) {
      for (const el of document.querySelectorAll(selector)) {
        if (!visible(el)) continue;
        const r = el.getBoundingClientRect();
        if (r.left < -2 || r.right > innerWidth + 2) {
          failures.push({ selector, left: Math.round(r.left), right: Math.round(r.right) });
        }
      }
    }
    return { viewport: innerWidth, width: document.documentElement.scrollWidth, failures };
  });
  expect(result.failures, JSON.stringify(result)).toEqual([]);
  expect(result.width, JSON.stringify(result)).toBeLessThanOrEqual(result.viewport + 2);
}

for (const viewport of [
  { width: 390, height: 844, label: 'phone' },
  { width: 768, height: 900, label: 'tablet' },
  { width: 1366, height: 900, label: 'desktop' }
]) {
  test('Mi Espacio real render and inline journey at ' + viewport.label, async ({ page }, testInfo) => {
    test.setTimeout(45000);
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await mountPersonalSpace(page);

    await expect(page.locator('.mi-espacio-person-main h3')).toContainText('Persona de Prueba');
    await expect(page.locator('.me-agenda-secondary .me-card')).toHaveCount(0);
    await assertNoHorizontalClipping(page);
    await testInfo.attach('overview-' + viewport.label + '.png', {
      body: await page.screenshot({ fullPage: true }), contentType: 'image/png'
    });

    const research = page.locator('.me-portfolio .me-portfolio-entry').first();
    await research.scrollIntoViewIfNeeded();
    const scrollBefore = await page.evaluate(() => window.scrollY);
    await research.click();
    await expect(research).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('.me-portfolio .me-inline-detail')).toBeVisible();
    expect(await page.locator('.me-portfolio .me-inline-detail h4, .me-portfolio .me-inline-detail h5').count()).toBe(0);
    expect(Math.abs((await page.evaluate(() => window.scrollY)) - scrollBefore)).toBeLessThanOrEqual(72);
    await assertNoHorizontalClipping(page);
    await page.keyboard.press('Escape');
    await expect(research).toHaveAttribute('aria-expanded', 'false');
    await expect(research).toBeFocused();

    await page.locator('.me-portfolio-group').nth(1).click();
    const study = page.locator('.me-portfolio .me-portfolio-entry').first();
    await study.click();
    await expect(page.locator('.me-portfolio .me-inline-detail')).toContainText('PROTO-2026-EXTENDED');
    await study.click();
    await expect(study).toHaveAttribute('aria-expanded', 'false');

    const publication = page.locator('.me-publications .me-publication-entry').first();
    await publication.click();
    await expect(publication).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('.me-publications .me-inline-detail')).toContainText('Posición de autoría');
    await assertNoHorizontalClipping(page);
    await testInfo.attach('expanded-publication-' + viewport.label + '.png', {
      body: await page.screenshot({ fullPage: true }), contentType: 'image/png'
    });
    await publication.click();
    await expect(publication).toHaveAttribute('aria-expanded', 'false');

    await page.getByRole('button', { name: 'Reivindicar una publicación' }).click();
    await expect(page.locator('#me-report-subject')).toBeFocused();
    await expect(page.locator('#me-report-subject')).toHaveValue('publication');
    await assertNoHorizontalClipping(page);

    await page.locator('.me-duty-open').click();
    await expect(page.locator('.me-duty-heading')).toHaveText('Mis guardias');
    await expect(page.locator('.me-duty-row')).toHaveCount(2);
    const duty = page.locator('.me-duty-row').first();
    await duty.click();
    await expect(duty).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('.me-duty-detail')).toContainText('Guardia presencial');
    await expect(page.locator('.me-duty-list')).toBeVisible();
    await assertNoHorizontalClipping(page);
    await testInfo.attach('expanded-duty-' + viewport.label + '.png', {
      body: await page.screenshot({ fullPage: true }), contentType: 'image/png'
    });
    await duty.press('Escape');
    await expect(duty).toHaveAttribute('aria-expanded', 'false');
    await page.locator('.me-duty-back').click();
    await expect(page.locator('.me-agenda-feature')).toBeVisible();
    await expect(page.locator('.me-publications')).toBeVisible();
    expect(errors).toEqual([]);
    expect(await page.evaluate(() => window.__miVisualErrors)).toEqual([]);
  });
}

test('unlinked identity never renders another person’s private activity', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await mountPersonalSpace(page, { linked: false });
  await expect(page.locator('.me-portfolio')).toHaveCount(0);
  await expect(page.locator('.me-duty-next')).toHaveCount(0);
  await expect(page.locator('.mi-espacio-person')).toBeVisible();
});
