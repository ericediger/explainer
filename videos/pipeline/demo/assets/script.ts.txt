import type { VideoSpec } from '../../src/spec';

/**
 * Storyboard for the week-prep explainer. Edit the narration here and re-run
 * `npm run build`; narration, footage pacing and captions all follow.
 */
export const spec: VideoSpec = {
  id: 'week-prep',
  name: 'Week Prep',
  fps: 30,
  width: 1920,
  height: 1080,
  repoUrl: 'github.com/ericediger/week-prep',
  demoUrl: 'ericediger.github.io/week-prep/demo.html',
  appFolder: '../WEEK PREP/week-prep',
  record: {
    appDir: '../week-prep',
    page: 'demo.html',
    viewport: { width: 1600, height: 900 },
  },
  voice: { say: 'Samantha', rate: 172, elevenlabs: 'UgBBYS2sOqTuMpoF3BR0' },
  poster: { atSec: 41 },
  music: { file: 'music/ready-to-move.wav', volume: 0.22, duckTo: 0.07, fadeOutSec: 3 },
  scenes: [
    {
      id: 'cold-open',
      kind: 'animated',
      component: 'ColdOpen',
      title: 'The problem',
      narration:
        'Every week arrives the same way. Meeting notes, email threads, a screenshot somebody sent at eleven at night, a PDF nobody read. The action items are in there somewhere. Finding them is the job before the job.',
      leadInSec: 0.8,
      tailSec: 1.2,
    },
    {
      id: 'how-it-works',
      kind: 'animated',
      component: 'HowItWorks',
      title: 'How it works',
      narration:
        'Week Prep is one HTML file. You drop the week’s raw material into a folder, open the file in Chrome, and click Ingest. Claude reads everything, pulls out the items that are actually yours, tags them, and writes a plain JSON file right back into that folder.',
      spoken:
        'Week Prep is one H T M L file. You drop the week’s raw material into a folder, open the file in Chrome, and click Ingest. Claude reads everything, pulls out the items that are actually yours, tags them, and writes a plain JSON file right back into that folder.',
      tailSec: 1.0,
    },
    {
      id: 'home',
      kind: 'footage',
      route: '',
      title: 'The week at a glance',
      subtitle: 'Home',
      narration:
        'Here is the result. The week at a glance: what’s open, what’s high priority, what’s due in the next seven days. Earlier weeks sit underneath as cards.',
    },
    {
      id: 'week-view',
      kind: 'footage',
      route: 'week/WO-260803',
      title: 'Every item, with its context',
      subtitle: 'Week view',
      narration:
        'Every item carries a priority, a plan day, a theme, and a project. Expand one and you get the context: which meeting it came from, and why it landed on your list.',
    },
    {
      id: 'carry-over',
      kind: 'footage',
      route: 'week/WO-260803',
      title: 'Unfinished work rolls forward',
      subtitle: 'Carry-over',
      narration:
        'Unfinished work doesn’t vanish on Friday. Anything still open rolls into next week automatically, with a badge that shows where it came from and how long it has been waiting.',
    },
    {
      id: 'project',
      kind: 'footage',
      route: 'project/ACME-RENEWAL',
      title: 'Projects across weeks',
      subtitle: 'Project view',
      narration:
        'Projects pull their items together across weeks. One button packages everything that’s open into a brief you can paste into any AI chat.',
    },
    {
      id: 'assistant',
      kind: 'footage',
      route: 'week/WO-260803',
      title: 'An assistant that proposes, never imposes',
      subtitle: 'Assistant',
      narration:
        'There’s a built-in assistant that sees the whole week. It can propose changes: plan days, priorities, new items, subtasks. But every proposal is a card. Nothing touches your list until you click Apply.',
      note: 'Demo page has no API key: the assistant reply shown here is pre-scripted. The cards and Apply flow are the real app code.',
      tailSec: 2.8,
    },
    {
      id: 'polish',
      kind: 'footage',
      route: 'week/WO-260803',
      title: 'Dark mode, search, and plain files',
      subtitle: 'Everyday use',
      narration:
        'Dark mode, search, sortable columns. And it all saves back to a JSON file in your folder, so it syncs wherever your folder syncs.',
    },
    {
      id: 'outro',
      kind: 'animated',
      component: 'Outro',
      title: '',
      narration:
        'One HTML file. Your files stay in your folder. The only network call goes to Claude, and only when you ask. Week Prep. Open source, on GitHub.',
      spoken:
        'One H T M L file. Your files stay in your folder. The only network call goes to Claude, and only when you ask. Week Prep. Open source, on GitHub.',
      leadInSec: 0.8,
      tailSec: 2.5,
    },
  ],
};
