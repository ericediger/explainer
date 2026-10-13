// Disposable demo service for the INVEST-IGATOR explainer. Runs an arm64-installed copy of the app (./.app) on a
// throwaway database with fictional companies, a scripted stand-in for the OpenAI provider and fake price feeds.
// Never touches the production data folder and makes no network calls.
//
//   node videos/invest-igator/demo/server.mjs          → http://127.0.0.1:5198, prints "Demo ready" when seeded
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Store } from './.app/server/store.js';
import { ResearchService } from './.app/server/research.js';
import { WorkflowService } from './.app/server/workflow.js';
import { FeedService } from './.app/server/feeds/index.js';
import { createApp } from './.app/server/app.js';
import { COMPANIES, SECTOR, snapshot, report, discovery, comparison, intake, closeFor } from './data.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.DEMO_PORT || 5198);
const dir = mkdtempSync(join(tmpdir(), 'invest-igator-demo-'));
const store = new Store(join(dir, 'research.sqlite'), join(dir, 'backups'));

// Fake feeds: Tiingo answers with the fictional close for any symbol; SEC EDGAR lists no filer, so financials come from the scripted research.
writeFileSync(join(dir, 'tiingo-api-key'), 'DEMOTIINGOTOKEN000000000000000000000\n', { mode: 0o600 });
writeFileSync(join(dir, 'edgar-contact'), 'Demo Owner demo@example.com\n', { mode: 0o600 });
const reply = (status, body) => ({ status, ok: status >= 200 && status < 300, statusText: '', text: async () => body });
const fetcher = async (url) => {
  const u = new URL(url);
  if (u.hostname === 'api.tiingo.com') {
    const m = u.pathname.match(/^\/tiingo\/daily\/([^/]+)\/prices$/);
    if (!m) return reply(200, JSON.stringify({ ticker: 'X', name: 'Demo', exchangeCode: 'NYSE' }));
    const symbol = decodeURIComponent(m[1]), close = closeFor(symbol), end = new Date(u.searchParams.get('endDate') + 'T00:00:00Z');
    const bars = [1, 0].map((n) => { const day = new Date(end.getTime() - n * 86400000).toISOString().slice(0, 10); return { date: day + 'T00:00:00.000Z', close: close - n * 0.6, high: close, low: close - 1, open: close - 0.5, volume: 1000, adjClose: close - n * 0.6, adjVolume: 1000, divCash: 0, splitFactor: 1 }; });
    return reply(200, JSON.stringify(bars));
  }
  if (u.hostname === 'www.sec.gov' || u.hostname === 'data.sec.gov') {
    if (u.pathname === '/files/company_tickers.json') return reply(200, '{}');
    return reply(404, 'Not found');
  }
  return reply(404, 'Not found');
};
const feeds = new FeedService(store, { dataDir: dir, version: 'demo', fetcher, schedule: false });

// Scripted provider. Delays are per call so the on-screen progress is visible but short.
let calls = 0;
const provider = {
  model: 'scripted-demo', configured: () => true,
  async request(input) {
    const slow = input.schemaName === 'intake_resolution' || (!input.schema && /Owner entries/.test(input.input || '') ) ? 1400 : 350;
    await new Promise((r) => setTimeout(r, slow));
    calls++;
    if (input.signal?.aborted) throw new Error('Cancelled');
    let text, annotations = [];
    // Snapshot prompts carry `Company: {...}`; review prompts carry the whole run context as JSON with a `company` object.
    const companyOf = () => { const m = input.input.match(/Company: (\{.*?\})\n/s); if (m) return JSON.parse(m[1]); const t = input.input.match(/"company":\{[^}]*?"ticker":"([A-Z0-9.-]+)"[^}]*?"name":"([^"]+)"/) || input.input.match(/"ticker":"([A-Z0-9.-]+)","name":"([^"]+)"/); return t ? { ticker: t[1], name: t[2] } : {}; };
    if (input.schema) {
      if (input.schemaName === 'sector_discovery') text = JSON.stringify(discovery(JSON.parse(input.input.match(/Owner-named companies: (\[.*?\])\n/s)?.[1] || '[]')));
      else if (input.schemaName === 'financial_snapshot') { const c = companyOf(), asOf = input.input.match(/As of: (\d{4}-\d{2}-\d{2})/)[1]; text = JSON.stringify(snapshot(c.ticker, asOf, c.name, c.exchange || 'NYSE')); }
      else if (input.schemaName === 'sector_comparison') text = JSON.stringify(comparison(input.input));
      else if (input.schemaName === 'intake_resolution') text = JSON.stringify(intake(JSON.parse(input.input.match(/Owner entries: (\[.*?\])\n/s)[1])));
      else if (input.schemaName === 'forward_eps') text = JSON.stringify({ value: null, period: null, periodEndDate: null, basis: null, currency: null, shareBasis: null, kind: 'Analyst estimate', sourceId: null, publicationDate: null, estimateAsOfDate: null, explanation: 'Demo.', sourceExcerpt: null, missingFields: ['value'] });
      else text = JSON.stringify(report(companyOf().ticker));
    } else {
      const c = companyOf();
      const t = c.ticker || 'the company';
      text = `Fictional demo research for ${t}: the latest annual report, the Q2 2026 earnings release and a sector note were reviewed. [Annual report](https://example.com/${t}/10-K) [Q2 2026 earnings release](https://example.com/${t}/q2-2026) [Sector note](https://example.com/sector/power-cooling-2026)`;
      annotations = [
        { type: 'url_citation', url: `https://example.com/${t}/10-K`, title: `${c.name || t} annual report (fictional)` },
        { type: 'url_citation', url: `https://example.com/${t}/q2-2026`, title: `${c.name || t} Q2 2026 earnings release (fictional)` },
        { type: 'url_citation', url: 'https://example.com/sector/power-cooling-2026', title: 'Data-center power and cooling sector note (fictional)' },
      ];
    }
    return { id: `demo-${calls}`, model: this.model, status: 'completed', usage: { input_tokens: 1200, output_tokens: 400 }, output: [{ type: 'message', content: [{ type: 'output_text', text, annotations }] }] };
  },
};

// Replace the stock seed workspace with the fictional companies through the app's own restore path.
const stamp = new Date().toISOString();
const workspace = { schemaVersion: 1, companies: [], evidence: [], snapshots: [], scenarios: [], decisions: [] };
for (const c of COMPANIES) {
  const id = crypto.randomUUID();
  workspace.companies.push({ id, ticker: c.ticker, name: c.name, role: c.role, exchange: c.exchange, currency: c.currency, status: 'Researching', thesis: '', risks: '', disconfirming: '', reviewDate: null, reviewTrigger: '', revision: 1, archivedAt: null, createdAt: stamp, updatedAt: stamp, history: [] });
  workspace.evidence.push({ id: crypto.randomUUID(), companyId: id, note: 'Added from a planning note. Fictional demo company.', source: { title: 'Planning note', url: null, publicationDate: null }, asOfDate: null, author: 'Owner', supersedesId: null, enteredAt: stamp });
}
const envelope = { format: 'investment-research', schemaVersion: 1, exportedAt: stamp, workspace };
const preview = store.preview(envelope);
store.restore(store.read().revision, envelope, preview.digest, 'REPLACE WORKSPACE');

const research = new ResearchService(store, provider, { concurrency: 2, feeds });
const root = `http://127.0.0.1:${port}`;
const workflow = new WorkflowService(store, research, { feeds });
const app = createApp(store, { origin: root, research, workflow, feeds });
const server = app.listen(port, '127.0.0.1', async () => {
  // Pre-run the sector analysis so Home and the dashboard are populated when the recorder arrives.
  const a = research.createAnalysis({ sector: SECTOR, seedCompanies: COMPANIES.map((c) => c.ticker), criteria: 'Primary US listings; suppliers with hyperscale customers.', maxCompanies: 5 });
  const started = Date.now();
  while (Date.now() - started < 120000) {
    const s = research.readAnalysis(a.id);
    if (['completed', 'failed', 'cancelled'].includes(s.status)) { console.log(`Analysis ${s.status}: ${s.stage}`); if (s.status !== 'completed') console.log(JSON.stringify(s.runs, null, 1)); break; }
    await new Promise((r) => setTimeout(r, 500));
  }
  // One company the owner already holds in the demo story.
  const vltn = store.read().workspace.companies.find((c) => c.ticker === 'VLTN');
  workflow.setDisposition({ companyId: vltn.id, disposition: 'Invested', invested: { date: '2026-09-15', price: 58.4, currency: 'USD', quantity: 120, amount: 7008, note: 'Entered after the September investor update; the thesis is the refresh cycle on the installed base.' } });
  console.log(`Demo ready ${root} (data in ${dir})`);
});
process.on('SIGTERM', () => { research.close(); feeds.close(); server.close(() => { store.close(); process.exit(0); }); });
process.on('SIGINT', () => process.emit('SIGTERM'));
