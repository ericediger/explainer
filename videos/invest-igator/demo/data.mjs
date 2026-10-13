// FICTIONAL sample data for the INVEST-IGATOR explainer. None of these companies exist; every figure is invented
// for the demo and the "research" replies are scripted stand-ins for the OpenAI provider. The on-screen note says so.

export const SECTOR = 'Data-center power and cooling';

// Companies in the workspace before the video starts (restored into a disposable database).
export const COMPANIES = [
  { ticker: 'GRDX', name: 'Gridworks Electric', role: 'Medium-voltage switchgear and power distribution for hyperscale data centers', exchange: 'NYSE', currency: 'USD', close: 148.2, rating: 'Consider' },
  { ticker: 'CLRA', name: 'Coolara Systems', role: 'Direct-to-chip liquid cooling and coolant distribution units for AI racks', exchange: 'Nasdaq', currency: 'USD', close: 61.75, rating: 'Watch' },
  { ticker: 'VLTN', name: 'Voltane Power', role: 'Uninterruptible power supplies, battery cabinets and backup generation', exchange: 'NYSE', currency: 'USD', close: 64.1, rating: 'Watch' },
  { ticker: 'NTLK', name: 'Netlink Fabrics', role: 'High-speed optical interconnects and data-center switching', exchange: 'Nasdaq', currency: 'USD', close: 212.3, rating: 'Research further' },
  { ticker: 'SBST', name: 'Substation Partners', role: 'Grid connections, substations and electrical construction', exchange: 'NYSE', currency: 'USD', close: 38.9, rating: 'Pass' },
];

const F = {
  GRDX: { shares: 182000000, revenue: 6400000000, ebitda: 1410000000, ebit: 1180000000, netIncome: 860000000, eps: 4.72, ocf: 1250000000, capex: 310000000, debt: 2100000000, cash: 940000000, growth: 24, epsGrowth: 31, fwdEps: 5.9, target: 172, backlog: 9800000000, hist: [4100000000, 5150000000] },
  CLRA: { shares: 96000000, revenue: 1250000000, ebitda: 215000000, ebit: 160000000, netIncome: 112000000, eps: 1.17, ocf: 190000000, capex: 95000000, debt: 180000000, cash: 420000000, growth: 58, epsGrowth: 74, fwdEps: 1.95, target: 74, backlog: 2100000000, hist: [520000000, 790000000] },
  VLTN: { shares: 240000000, revenue: 7900000000, ebitda: 1520000000, ebit: 1210000000, netIncome: 790000000, eps: 3.29, ocf: 1380000000, capex: 420000000, debt: 3400000000, cash: 1100000000, growth: 17, epsGrowth: 22, fwdEps: 3.95, target: 71, backlog: 7200000000, hist: [5900000000, 6750000000] },
  NTLK: { shares: 310000000, revenue: 8600000000, ebitda: 3400000000, ebit: 3150000000, netIncome: 2600000000, eps: 8.39, ocf: 3100000000, capex: 180000000, debt: 0, cash: 7400000000, growth: 29, epsGrowth: 36, fwdEps: 10.4, target: 236, backlog: null, hist: [5800000000, 6660000000] },
  SBST: { shares: 150000000, revenue: 4300000000, ebitda: 330000000, ebit: 215000000, netIncome: 125000000, eps: 0.83, ocf: 210000000, capex: 140000000, debt: 1900000000, cash: 150000000, growth: 6, epsGrowth: -12, fwdEps: 0.95, target: 36, backlog: 5100000000, hist: [3900000000, 4050000000] },
  HLTR: { shares: 64000000, revenue: 980000000, ebitda: 170000000, ebit: 135000000, netIncome: 96000000, eps: 1.5, ocf: 150000000, capex: 60000000, debt: 240000000, cash: 130000000, growth: 21, epsGrowth: 27, fwdEps: 1.9, target: 52, backlog: 1600000000, hist: [690000000, 810000000] },
  NRDL: { shares: 48000000, revenue: 720000000, ebitda: 98000000, ebit: 71000000, netIncome: 49000000, eps: 1.02, ocf: 84000000, capex: 41000000, debt: 160000000, cash: 90000000, growth: 14, epsGrowth: 18, fwdEps: 1.25, target: 31, backlog: 900000000, hist: [560000000, 630000000] },
};
const CLOSE = { GRDX: 148.2, CLRA: 61.75, VLTN: 64.1, NTLK: 212.3, SBST: 38.9, HLTR: 44.6, NRDL: 26.4 };
export const closeFor = (ticker) => CLOSE[ticker] ?? 50;

const daysAgo = (asOf, n) => new Date(Date.parse(asOf) - n * 86400000).toISOString().slice(0, 10);

export function snapshot(ticker, asOf, name, exchange) {
  const f = F[ticker] || F.NRDL;
  return {
    identity: { name, ticker, exchange, listingCountry: 'US', quoteCurrency: 'USD', reportingCurrency: 'USD', fiscalYearEnd: 'December', securityType: 'Common', sourceIds: ['S2'] },
    price: { value: closeFor(ticker), currency: 'USD', asOfDate: daysAgo(asOf, 1), asOfTime: '16:00 ET', sourceId: 'S1' },
    shares: { basicOutstanding: f.shares, dilutedOutstanding: null, asOfDate: daysAgo(asOf, 40), basis: 'Cover page shares outstanding', sourceId: 'S2' },
    marketCap: { value: null, currency: null, asOfDate: null, sourceId: null },
    enterpriseValue: { value: null, currency: null, asOfDate: null, sourceId: null },
    financials: { periodLabel: 'TTM to Q2 2026', periodType: 'TTM', periodEndDate: '2026-06-30', basis: 'US GAAP', currency: 'USD', revenue: f.revenue, ebitda: f.ebitda, ebit: f.ebit, netIncome: f.netIncome, dilutedEPS: f.eps, operatingCashFlow: f.ocf, capitalExpenditure: f.capex, freeCashFlow: null, totalDebt: f.debt, cashAndEquivalents: f.cash, sourceIds: ['S2'] },
    growth: { revenueGrowthPct: f.growth, epsGrowthPct: f.epsGrowth, periodLabel: 'Q2 2026 YoY', sourceIds: ['S2'] },
    history: [
      { periodLabel: 'FY2024', periodEndDate: '2024-12-31', revenue: f.hist[0], ebitda: null, netIncome: null, freeCashFlow: null, sourceIds: ['S2'] },
      { periodLabel: 'FY2025', periodEndDate: '2025-12-31', revenue: f.hist[1], ebitda: null, netIncome: null, freeCashFlow: null, sourceIds: ['S2'] },
    ],
    consensus: { forwardEPS: f.fwdEps, forwardEPSPeriod: 'FY2027', forwardRevenue: null, forwardRevenuePeriod: null, targetPrice: f.target, currency: 'USD', asOfDate: daysAgo(asOf, 3), sourceId: 'S1' },
    operatingMetrics: f.backlog ? [{ name: 'Backlog', value: f.backlog, unit: 'USD', periodLabel: 'Q2 2026', sourceId: 'S2' }] : [],
    notes: 'Fictional demo figures.',
    missing: [],
  };
}

const p = (text, sourceIds = ['S1']) => ({ text, sourceIds });

const REPORTS = {
  GRDX: {
    recommendation: 'Consider', confidence: 'Moderate',
    summary: 'Gridworks sells the switchgear every new data center hall needs, and its backlog has grown faster than revenue for six quarters. At a dated price and an app-computed forward multiple, the case is supportable.',
    rationale: 'Backlog of 9.8 billion against 6.4 billion trailing revenue gives visibility into 2027, and the company has priced the last three orders above its historical margin.',
    business: 'Medium-voltage switchgear is a specified, inspected product with long qualification cycles; Gridworks is one of three qualified vendors at the two largest hyperscalers.',
    financial: 'Revenue grew 24 percent year on year with EBITDA margins expanding to 22 percent; net debt is below one turn of EBITDA.',
    valuation: 'The app-computed forward P/E and EV/EBITDA are above the sector median; the premium rests on backlog conversion.',
    bull: ['Hyperscale capex plans for 2027 were raised again in the latest earnings calls.'],
    bear: ['A pause in AI build-outs would hit switchgear orders before it hit the operators.', 'Copper and steel costs are only partly passed through on fixed-price contracts.'],
    catalysts: ['Q3 results on 2026-11-04 with an updated backlog figure.'],
    missing: ['Segment margin for the data-center business is not broken out in filings.'],
    invalidation: ['Backlog falling for two consecutive quarters.', 'A qualified fourth vendor winning share at a top-two hyperscaler.'],
    next: ['Compare contract terms with the two qualified competitors.'],
  },
  CLRA: {
    recommendation: 'Watch', confidence: 'Moderate',
    summary: 'Coolara is growing fastest in the group as racks move to liquid cooling, but its position depends on two chip vendors specifying its coolant distribution units.',
    rationale: 'Revenue grew 58 percent and the company turned free-cash-flow positive, but customer concentration and a high multiple keep this at Watch until the FY2027 guide is known.',
    business: 'Direct-to-chip cooling is becoming standard for AI racks; Coolara has reference designs with two accelerator vendors but faces larger thermal-management incumbents.',
    financial: 'Margins are expanding from a low base; cash of 420 million exceeds debt.',
    valuation: 'The app-computed forward P/E is the highest in the set.',
    bull: ['Reference-design wins extend to a third accelerator vendor.'],
    bear: ['Two customers account for more than half of revenue.', 'Incumbents are bundling cooling with power-distribution products at lower margins.'],
    catalysts: ['FY2027 guidance expected in December 2026.'],
    missing: ['Gross margin by product line is not disclosed.', 'Warranty reserve trends are not reported quarterly.'],
    invalidation: ['Loss of either anchor customer.'],
    next: ['Read the customer-concentration disclosure in the next 10-Q.'],
  },
  VLTN: {
    recommendation: 'Watch', confidence: 'High',
    summary: 'Voltane is the steadiest business in the set: backup power is specified in every build, growth is in the high teens and margins are stable, but the price already reflects that.',
    rationale: 'A seven-billion backlog and stable margins support the business; the app-computed multiple sits at the sector median with less growth than peers.',
    business: 'UPS and battery cabinets are replaced on a cycle, giving a service and refresh base.',
    financial: 'Revenue up 17 percent; net debt at 1.5 turns of EBITDA after the battery-plant build.',
    valuation: 'Priced in line with peers on EV/EBITDA.',
    bull: ['Service revenue is growing faster than equipment.'],
    bear: ['Lithium battery pricing has compressed cabinet margins before.', 'Chinese competitors are entering the European UPS market.'],
    catalysts: ['Investor day on 2026-11-18.'],
    missing: ['Service attach rate is disclosed only annually.'],
    invalidation: ['Backlog conversion slipping below 80 percent of plan.'],
    next: ['Model the refresh cycle against the installed base.'],
  },
  NTLK: {
    recommendation: 'Research further', confidence: 'Low',
    summary: 'Netlink grows quickly with very high margins, but how much of its optical business overlaps with its largest customer’s own designs is unclear from the filings found.',
    rationale: 'The evidence gathered does not settle whether the largest customer is insourcing interconnects; the multiple only makes sense if it is not.',
    business: 'Data-center switching with a growing optical-interconnect line.',
    financial: 'Net cash of 7.4 billion; 40 percent EBITDA margin.',
    valuation: 'The app-computed forward P/E is above twenty times.',
    bull: ['Share gains at second-tier cloud providers.'],
    bear: ['The largest customer has announced in-house optical modules.'],
    catalysts: ['Customer-concentration disclosure in the 10-K.'],
    missing: ['Revenue by product line.', 'Any statement on the in-house program’s timeline.'],
    invalidation: ['Largest customer below 25 percent of revenue through insourcing.'],
    next: ['Read the largest customer’s capex commentary for optical modules.', 'Find the product-line split in investor presentations.'],
  },
  SBST: {
    recommendation: 'Pass', confidence: 'Moderate',
    summary: 'Substation Partners builds the grid connections, but on fixed-price contracts with thin margins; earnings fell while revenue grew.',
    rationale: 'Revenue grew 6 percent and EPS fell 12 percent; net debt is above five turns of EBITDA, and the backlog carries the same contract terms.',
    business: 'Substation construction is labor-intensive with little pricing power against utilities.',
    financial: 'EBITDA margin of 8 percent and rising interest cost.',
    valuation: 'The multiple is low for a reason; the balance sheet is the risk.',
    bull: ['Utility capex plans are at record levels.'],
    bear: ['Three fixed-price projects took charges in the last four quarters.', 'Covenant headroom is below one turn.'],
    catalysts: ['Refinancing of the 2027 term loan.'],
    missing: ['Project-level margin disclosure.'],
    invalidation: ['A covenant waiver or an equity raise.'],
    next: ['Only revisit after the refinancing terms are public.'],
  },
  HLTR: {
    recommendation: 'Watch', confidence: 'Moderate',
    summary: 'Helios makes the dry-type transformers that sit between the grid and the data-center hall; lead times are over a year and the company is adding a second plant.',
    rationale: 'Revenue grew 21 percent with expanding margins, and a 1.6 billion backlog is more than one and a half years of revenue.',
    business: 'Transformer supply is constrained industry-wide; Helios is a qualified vendor at two hyperscalers.',
    financial: 'Net debt is below one turn of EBITDA; the plant expansion is funded from cash flow.',
    valuation: 'The app-computed forward P/E is at the sector median.',
    bull: ['Lead times keep pricing firm through 2027.'],
    bear: ['Grain-oriented steel supply is concentrated in two mills.'],
    catalysts: ['Second plant commissioning in Q1 2027.'],
    missing: ['Hyperscale share of backlog is not disclosed.'],
    invalidation: ['Lead times normalising below six months.'],
    next: ['Confirm the steel supply contract terms.'],
  },
  NRDL: {
    recommendation: 'Watch', confidence: 'Low',
    summary: 'Nordlicht Energie sells busway and power-distribution units in Europe; growth is steady and the balance sheet is clean, but coverage of the data-center segment is thin.',
    rationale: 'Revenue grew 14 percent; the company does not disclose the data-center share of sales.',
    business: 'Busway systems for industrial and data-center customers in Germany and the Nordics.',
    financial: 'Net debt below one turn; margins stable.',
    valuation: 'The app-computed multiples are at a discount to US peers.',
    bull: ['European data-center build-outs are accelerating.'],
    bear: ['Industrial customers are two-thirds of revenue and cyclical.'],
    catalysts: ['Capital markets day in January 2027.'],
    missing: ['Data-center share of revenue.'],
    invalidation: ['Industrial downturn without data-center offset.'],
    next: ['Find the segment split in the annual report.'],
  },
};

export function report(ticker) {
  const r = REPORTS[ticker] || REPORTS.NRDL;
  return {
    summary: p(r.summary), recommendation: r.recommendation, rationale: p(r.rationale), evidenceConfidence: r.confidence,
    businessQuality: p(r.business), financialAssessment: p(r.financial, ['S2']), valuationAssessment: p(r.valuation, []),
    bullCase: r.bull.map((t) => p(t)), bearCase: r.bear.map((t) => p(t, ['S3'])), catalysts: r.catalysts.map((t) => p(t)), changes: [],
    assumptions: ['Fictional demo data; no real company is described.'], missingEvidence: r.missing, invalidationTriggers: r.invalidation, nextSteps: r.next,
  };
}

export const discovery = (seeds) => ({
  sectorDefinition: 'Listed suppliers of electrical power distribution, backup power, cooling and interconnect for hyperscale and enterprise data centers.',
  candidates: COMPANIES.map((c, i) => ({ name: c.name, ticker: c.ticker, exchange: c.exchange, listingCountry: 'US', quoteCurrency: 'USD', securityType: 'Common', relevance: c.role, approximateMarketCap: null, marketCapCurrency: null, isSeed: seeds.includes(c.ticker), confidence: i < 4 ? 'High' : 'Moderate', sourceIds: ['S1'] })),
  excluded: [{ name: 'Powerline Infrastructure ETF', reason: 'Fund, not a company.' }, { name: 'Borealis Cooling GmbH', reason: 'Private company; no current listing.' }],
  notes: 'Fictional demo discovery.',
});

export function comparison(input) {
  const companies = JSON.parse(input.match(/Companies: (\[.*\])\nSource registry/s)[1]);
  const registry = JSON.parse(input.split('Source registry: ')[1]);
  const ids = [registry[0].id];
  const order = ['GRDX', 'CLRA', 'VLTN', 'NTLK', 'SBST'];
  const sorted = [...companies].sort((a, b) => order.indexOf(a.ticker) - order.indexOf(b.ticker));
  const why = {
    GRDX: 'Backlog visibility into 2027 and a qualified-vendor position; the premium multiple is the risk.',
    CLRA: 'Fastest growth in the set and a clean balance sheet, held back by customer concentration.',
    VLTN: 'The most predictable earnings; priced accordingly.',
    NTLK: 'Best margins, but the insourcing question is unresolved.',
    SBST: 'Thin margins, falling EPS and a stretched balance sheet.',
  };
  const versus = {
    GRDX: 'Highest backlog cover in the set and the only Consider rating; trades at the second-highest forward multiple.',
    CLRA: 'Fastest revenue growth and the cleanest balance sheet; the most concentrated customer base.',
    VLTN: 'Lowest forward multiple of the suppliers, with the slowest growth.',
    NTLK: 'Best margins and net cash, but the one company whose largest customer may be insourcing.',
    SBST: 'Highest leverage and the only falling EPS; the cheapest on EV/EBITDA for that reason.',
  };
  return {
    sectorSummary: { text: 'Power distribution and cooling suppliers are capacity-constrained through 2027; the ranking favours qualified vendors with backlog visibility over construction contractors on fixed-price work.', sourceIds: ids },
    ranking: sorted.map((c, i) => ({ ticker: c.ticker, rank: i + 1, rating: REPORTS[c.ticker]?.recommendation || 'Watch', thesis: { text: why[c.ticker] || 'Fictional demo thesis.', sourceIds: ids }, keyEvidence: [{ text: REPORTS[c.ticker]?.rationale || 'Fictional demo evidence.', sourceIds: ids }], valuation: { text: REPORTS[c.ticker]?.valuation || '', sourceIds: [] }, relativeAttractiveness: { text: versus[c.ticker] || 'Fictional demo comparison.', sourceIds: [] }, catalysts: REPORTS[c.ticker]?.catalysts || [], risks: REPORTS[c.ticker]?.bear || [], invalidation: REPORTS[c.ticker]?.invalidation || [], confidence: REPORTS[c.ticker]?.confidence || 'Low', dataLimitations: REPORTS[c.ticker]?.missing || [] })),
    preferredRationale: { text: 'Gridworks ranks first on backlog conversion and vendor qualification; Coolara second on growth with a concentration caveat.', sourceIds: ids },
    sectorRisks: ['A pause in AI capital expenditure would reach the suppliers before the operators.'],
    assumptions: ['Fictional demo data.'],
    caveats: ['Rankings compare company merits only, not personal suitability.'],
  };
}

const cand = (name, ticker, exchange, country, currency, description) => ({ name, ticker, exchange, listingCountry: country, quoteCurrency: currency, securityType: 'Common', description, confidence: 'High', sourceIds: ['S1'] });

export const intake = (queries) => ({
  entries: queries.map((query) => {
    if (/nordlicht/i.test(query)) return { query, status: 'ambiguous', candidates: [cand('Nordlicht Energie AG', 'NRDL', 'XETRA', 'DE', 'EUR', 'Busway and power-distribution units for industrial and data-center customers.'), cand('Nordlicht Energie Services ASA', 'NRDS', 'Oslo Børs', 'NO', 'NOK', 'Electrical installation and maintenance services; a separately listed subsidiary.')], notes: 'Two listed companies carry this name: the German parent and its Norwegian services subsidiary.' };
    if (/helios/i.test(query)) return { query, status: 'resolved', candidates: [cand('Helios Transformers Inc.', 'HLTR', 'NYSE', 'US', 'USD', 'Dry-type transformers and switchgear for data centers and utilities.')], notes: '' };
    return { query, status: 'unresolved', candidates: [], notes: 'No current listing could be verified.' };
  }),
});
