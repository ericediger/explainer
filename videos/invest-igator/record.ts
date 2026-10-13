/**
 * Recorder choreography for the INVEST-IGATOR explainer: one action per footage scene, keyed by scene id.
 * Times are seconds since the page was ready; narration starts at the scene's leadInSec (0.6 s) in the final cut.
 * The page is the demo server (videos/invest-igator/demo/server.mjs) on http://127.0.0.1:5198.
 */
import type { SceneAction } from '../../scripts/lib/recorder';

const ROW = (ticker: string) => `.home-row[data-ticker="${ticker}"]`;

export const actions: Record<string, SceneAction> = {
  home: async (r) => {
    await r.p.waitForSelector(ROW('VLTN'));
    await r.until(0.4);
    await r.zoomUnion(['#home-tabs', ROW('VLTN')], 30);
    await r.until(2.4);
    await r.zoomUnion([ROW('VLTN'), ROW('CLRA')], 26);
    await r.moveTo(`${ROW('VLTN')} .home-disposition`, { at: [0.5, 0.5] });
    await r.until(5.0);
    await r.zoom(ROW('CLRA'), 30);
    await r.moveTo(`${ROW('CLRA')} .row-sector`, { at: [0.3, 0.5] });
    await r.until(6.6);
    await r.moveTo(`${ROW('CLRA')} .home-disposition small`, { at: [0.5, 0.5] });
    await r.until(8.6);
    await r.moveTo(`${ROW('CLRA')} .row-why`, { at: [0.25, 0.5] });
    await r.until(10.6);
    await r.spot(`${ROW('CLRA')} .row-next`, 8);
    await r.moveTo(`${ROW('CLRA')} .row-next`, { at: [0.2, 0.5] });
    await r.until(13.6);
    await r.unspot();
    r.zoomReset();
  },

  intake: async (r) => {
    await r.p.waitForSelector('#intake-entries');
    await r.until(0.3);
    await r.zoom('.intake-panel', 28);
    await r.click('#intake-entries');
    await r.type('#intake-entries', 'Helios Transformers, Nordlicht Energie', { cps: 26 });
    await r.until(2.6);
    await r.click('#intake-submit');
    await r.p.waitForSelector('.intake-run', { timeout: 10000 });
    await r.until(3.4);
    await r.zoomUnion(['.intake-row', '.intake-run'], 28);
    await r.p.waitForSelector('.intake-entries .badge.consider', { timeout: 15000 });
    await r.until(7.2);
    await r.spot('.intake-entries li:nth-child(1)', 6);
    await r.moveTo('.intake-entries li:nth-child(1) a', { at: [0.5, 0.5] });
    await r.until(10.6);
    await r.unspot();
    await r.spot('.intake-entries li:nth-child(2)', 6);
    await r.moveTo('.intake-entries li:nth-child(2) button[data-candidate="0"]', { at: [0.5, 0.5] });
    await r.until(13.4);
    await r.click('.intake-entries li:nth-child(2) button[data-candidate="0"]');
    await r.until(14.6);
    await r.unspot();
    r.zoomReset();
  },

  details: async (r) => {
    await r.p.waitForSelector(ROW('GRDX'));
    await r.until(0.3);
    await r.scrollTo(ROW('GRDX'), 'start');
    await r.zoom(ROW('GRDX'), 24);
    await r.until(1.2);
    await r.click(`${ROW('GRDX')} .row-details > summary`);
    await r.wait(0.3);
    await r.scrollTo(`${ROW('GRDX')} .row-details`, 'center');
    await r.zoom(`${ROW('GRDX')} .row-body`, 24);
    await r.until(3.0);
    await r.spot(`${ROW('GRDX')} .figure-grid`, 8);
    await r.moveTo(`${ROW('GRDX')} .figure-grid div:nth-child(1)`, { at: [0.3, 0.5] });
    await r.until(5.4);
    await r.moveTo(`${ROW('GRDX')} .figure-grid div:nth-child(3)`, { at: [0.3, 0.5] });
    await r.until(8.0);
    await r.unspot();
    await r.spot(`${ROW('GRDX')} .row-body h4`, 8);
    await r.moveTo(`${ROW('GRDX')} .row-body h4`, { at: [0.3, 0.5] });
    await r.until(9.8);
    await r.unspot();
    await r.spot(`${ROW('GRDX')} .row-triggers`, 8);
    await r.moveTo(`${ROW('GRDX')} .row-triggers h4`, { at: [0.3, 0.5] });
    await r.until(13.2);
    await r.unspot();
    await r.until(16.0);
    r.zoomReset();
  },

  assessment: async (r) => {
    await r.p.waitForSelector(ROW('GRDX'));
    await r.until(0.3);
    await r.scrollTo(ROW('GRDX'), 'start');
    await r.click(`${ROW('GRDX')} .row-details > summary`);
    await r.wait(0.3);
    await r.zoom(`${ROW('GRDX')} .row-body`, 24);
    await r.until(1.4);
    await r.click(`${ROW('GRDX')} button[data-run]`);
    await r.p.waitForSelector('#research-panel .ai-verdict', { timeout: 10000 });
    await r.wait(0.4);
    await r.zoom('#research-panel', 0);
    await r.until(3.2);
    await r.spot('#research-panel .ai-verdict', 6);
    await r.moveTo('#research-panel .ai-verdict h2', { at: [0.5, 0.5] });
    await r.until(6.2);
    await r.unspot();
    await r.eval(`document.querySelectorAll('#research-panel details[open]').forEach(d=>{if(!/challenges/.test(d.querySelector('summary').textContent))d.removeAttribute('open');})`);
    await r.eval(`(()=>{const d=[...document.querySelectorAll('#research-panel details')].find(x=>/challenges/.test(x.querySelector('summary').textContent));if(d){d.open=true;d.scrollIntoView({block:'center',behavior:'smooth'});}})()`);
    await r.wait(0.5);
    await r.eval(`(()=>{const d=[...document.querySelectorAll('#research-panel details')].find(x=>/challenges/.test(x.querySelector('summary').textContent));if(d)d.id='demo-bear';})()`);
    await r.spot('#demo-bear', 6);
    await r.moveTo('#demo-bear .ai-cite', { at: [0.5, 0.5] });
    await r.until(9.4);
    await r.unspot();
    await r.eval(`(()=>{const d=[...document.querySelectorAll('#research-panel details')].find(x=>/^Sources/.test(x.querySelector('summary').textContent));if(d){d.id='demo-sources';d.open=true;d.scrollIntoView({block:'center',behavior:'smooth'});}})()`);
    await r.wait(0.5);
    await r.spot('#demo-sources', 6);
    await r.moveTo('#demo-sources .ai-sources li:nth-child(1)', { at: [0.4, 0.5] });
    await r.until(13.6);
    await r.unspot();
    await r.until(15.4);
    r.zoomReset();
  },

  decide: async (r) => {
    await r.p.waitForSelector(ROW('CLRA'));
    await r.until(0.3);
    await r.scrollTo(ROW('CLRA'), 'start');
    await r.click(`${ROW('CLRA')} .row-details > summary`);
    await r.wait(0.3);
    await r.scrollTo(`${ROW('CLRA')} .disp-label`, 'center');
    await r.zoomUnion([`${ROW('CLRA')} .row-head`, `${ROW('CLRA')} .disp-label`], 24);
    await r.until(2.0);
    await r.spot(`${ROW('CLRA')} .disp-label`, 8);
    await r.moveTo(`${ROW('CLRA')} .disp-select`, { at: [0.5, 0.5] });
    await r.until(5.6);
    await r.unspot();
    await r.until(8.6);
    await r.p.selectOption(`${ROW('CLRA')} .disp-select`, 'Invested');
    await r.p.waitForSelector(`${ROW('CLRA')} .invested-form`);
    await r.wait(0.2);
    await r.scrollTo(`${ROW('CLRA')} .invested-form`, 'center');
    await r.zoom(`${ROW('CLRA')} .invested-form`, 20);
    await r.until(10.2);
    await r.click(`${ROW('CLRA')} .invested-form input[name=price]`);
    await r.type(`${ROW('CLRA')} .invested-form input[name=price]`, '61.75', { cps: 9 });
    await r.until(12.6);
    await r.click(`${ROW('CLRA')} .invested-form button[type=submit]`);
    await r.p.waitForSelector(`${ROW('CLRA')} .badge.invested`, { timeout: 10000 });
    await r.wait(0.3);
    await r.scrollTo('.home-section', 'start');
    await r.zoom('.home-section', 20);
    await r.spot(`${ROW('CLRA')} .home-disposition`, 8);
    await r.moveTo(`${ROW('CLRA')} .home-disposition`, { at: [0.5, 0.5] });
    await r.until(16.4);
    await r.unspot();
    r.zoomReset();
  },

  sector: async (r) => {
    await r.p.waitForSelector('.analysis-row a.company-name');
    await r.until(0.5);
    await r.click('.analysis-row a.company-name');
    await r.p.waitForSelector('.an-summary');
    await r.wait(0.3);
    await r.zoomUnion(['.page-head', '.an-summary'], 26);
    await r.moveTo('.an-summary > div:nth-child(1)', { at: [0.5, 0.5] });
    await r.until(3.0);
    await r.moveTo('.an-summary > div:nth-child(3)', { at: [0.5, 0.5] });
    await r.until(5.2);
    await r.scrollTo('.an-ranking', 'start');
    await r.zoomUnion(['.an-ranking > li:nth-child(1)', '.an-ranking > li:nth-child(2)'], 22);
    await r.moveTo('.an-ranking > li:nth-child(1) .an-rank-head', { at: [0.3, 0.5] });
    await r.until(9.6);
    await r.scrollTo('#an-chart', 'center');
    await r.zoomUnion(['.an-valuation-head', '#an-chart'], 24);
    await r.moveTo('#an-chart', { at: [0.4, 0.3] });
    await r.until(13.8);
    r.zoomReset();
  },
};
