/**
 * Recorder choreography for the week-prep explainer: one action per footage scene, keyed by scene id.
 * Times are seconds since the page was ready; narration starts at the scene's leadInSec in the final cut.
 * The SceneRecorder gives you: until(t), moveTo(sel), click(sel), type(sel, text), press(key), scrollTo(sel),
 * spot(sel)/unspot() (dim everything but one element), zoom(sel)/zoomUnion(sels)/zoomReset() (camera cues), eval(js).
 */
import type { SceneAction } from '../../scripts/lib/recorder';

/**
 * Scene choreography. Times are seconds since the page was ready; narration
 * starts at +0.6s (the scene's leadInSec) in the final cut.
 */
export const actions: Record<string, SceneAction> = {
  home: async (r) => {
    await r.until(0.4);
    await r.zoom('.hero', 36);
    await r.until(1.6);
    await r.spot('.tiles', 10);
    await r.moveTo('.tile.hi', { at: [0.5, 0.45] });
    await r.until(4.0);
    await r.moveTo('.tile.soon', { at: [0.5, 0.45] });
    await r.until(5.6);
    await r.unspot();
    r.zoomReset();
    await r.until(6.8);
    await r.zoomUnion(['.secLbl', '.wcard'], 40);
    await r.moveTo('.wcard', { at: [0.5, 0.4] });
    await r.until(9.6);
    r.zoomReset();
  },

  'week-view': async (r) => {
    await r.until(0.5);
    await r.zoomUnion(['tr.main:nth-child(1)', 'tr.main:nth-child(3)'], 28);
    await r.until(1.4);
    await r.moveTo('select.prio[data-id="d1"]');
    await r.until(2.6);
    await r.moveTo('select.plan[data-id="d1"]');
    await r.until(3.8);
    await r.moveTo('tr.main:nth-child(1) .tpcell', { at: [0.5, 0.3] });
    await r.until(5.2);
    await r.click('.exp[data-id="d3"]');
    await r.scrollTo('tr.detailrow');
    await r.zoomUnion(['.exp[data-id="d3"]', 'tr.detailrow'], 26);
    await r.spot('tr.detailrow .ctxwrap', 6);
    await r.moveTo('tr.detailrow .srcline', { at: [0.2, 0.5] });
    await r.until(10.5);
    await r.unspot();
  },

  'carry-over': async (r) => {
    await r.until(0.5);
    await r.zoom('tr.main:has(.carry)', 60);
    await r.until(1.3);
    await r.spot('tr.main:has(.carry) .carry', 6);
    await r.moveTo('tr.main:has(.carry) .carry', { at: [0.5, 0.5] });
    await r.until(5.4);
    await r.unspot();
    await r.click('.exp[data-id="d5"]');
    await r.scrollTo('tr.detailrow');
    await r.zoomUnion(['.exp[data-id="d5"]', 'tr.detailrow'], 26);
    await r.spot('tr.detailrow .srcline', 6);
    await r.moveTo('tr.detailrow .srcline', { at: [0.35, 0.5] });
    await r.until(10.8);
    await r.unspot();
  },

  project: async (r) => {
    await r.until(0.4);
    await r.zoom('.phead', 30);
    await r.until(2.4);
    await r.zoomUnion(['table thead', '#ptb'], 30);
    await r.moveTo('#ptb tr:nth-child(1) td:nth-child(4)', { at: [0.5, 0.5] });
    await r.until(4.6);
    await r.spot('#briefBtn', 8);
    await r.until(5.4);
    await r.click('#briefBtn');
    await r.zoom('.llmbar', 30);
    await r.until(8.0);
    await r.unspot();
  },

  assistant: async (r) => {
    // The demo page has no API key: stand in for the model with a scripted reply.
    // Everything else (drawer, proposal cards, Apply) is the real app code.
    await r.eval(STUB_ASSISTANT);
    await r.until(0.3);
    await r.click('#agentBtn');
    await r.wait(0.3);
    await r.zoom('#drawer', 8);
    await r.until(1.2);
    await r.type('#dinput', 'What should I tackle first on Monday?', { cps: 22 });
    await r.until(3.6);
    await r.click('#dsend');
    await r.p.waitForSelector('.prop.pending', { timeout: 8000 });
    await r.until(5.4);
    await r.spot('.prop.pending', 6);
    await r.until(8.4);
    await r.moveTo('.prop.pending button[data-act="apply"]');
    await r.until(11.3);
    await r.click('.prop.pending button[data-act="apply"]');
    await r.wait(0.3);
    await r.spot('.prop.pending', 6);
    await r.until(12.4);
    await r.click('.prop.pending button[data-act="apply"]');
    await r.unspot();
    await r.until(13.6);
    await r.zoomUnion(['tr.main:nth-child(1)', 'tr.main:nth-child(4)'], 30);
    await r.moveTo('select.plan[data-id="d3"]');
    await r.spot('select.plan[data-id="d3"]', 6);
  },

  polish: async (r) => {
    await r.until(0.6);
    await r.click('#themeBtn');
    await r.until(2.6);
    await r.zoom('.controls', 24);
    await r.type('#search', 'acme', { cps: 9 });
    await r.until(5.0);
    await r.zoomUnion(['.controls', 'tr.main:nth-child(1)'], 30);
    await r.until(6.4);
    await r.click('#search');
    await r.press('Meta+A');
    await r.press('Backspace');
    await r.until(7.4);
    r.zoomReset();
  },
};

/** Replaces the API call with a two-turn scripted reply and neutralises the folder-backed chat storage. */
const STUB_ASSISTANT = `
  apiKey = () => 'demo';
  loadAgentChat = async (week) => { agent.week = week; agent.messages = []; agent.decisions = {}; agent.descs = {}; agent.pending = null; };
  saveAgentChat = async () => {};
  anthropic = async (body) => {
    await new Promise(r => setTimeout(r, 900));
    const turns = body.messages.filter(m => m.role === 'assistant').length;
    if (turns === 0) return {
      stop_reason: 'tool_use',
      content: [
        { type: 'text', text: "Monday is light on meetings, so I'd front-load the two things other people are waiting on:\\n\\n1. **Chase legal on the Acme redlines** — already planned for Monday, and the Aug 14 deadline leaves no slack.\\n2. **Onboarding copy feedback for Priya** — pulling it from Tuesday to Monday unblocks her a day earlier.\\n\\nI'd also make the IT dependency on the vendor questionnaire visible. Proposed changes:" },
        { type: 'tool_use', id: 'tu_1', name: 'update_item', input: { id: 'd3', changes: { plan: 'Mon' } } },
        { type: 'tool_use', id: 'tu_2', name: 'add_subtask', input: { id: 'd5', text: 'Ping IT for the two outstanding answers' } }
      ]
    };
    return { stop_reason: 'end_turn', content: [{ type: 'text', text: "Done. Onboarding feedback is now on Monday, and the questionnaire has a subtask for the IT follow-up. Everything else is unchanged." }] };
  };
`;
