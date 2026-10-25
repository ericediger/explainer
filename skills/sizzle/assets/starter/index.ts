import type { AnimatedScene } from '@explainer/src/kit/types';
import { ColdOpen } from './scenes/ColdOpen';
import { Outro } from './scenes/Outro';
import { Title } from './scenes/Title';

export { spec } from './script';

// Every `component` named by an animated scene in script.ts must be registered here.
// ColdOpen leads with the problem, Title with the name: keep the opener you use and delete the other.
export const components: Record<string, AnimatedScene> = { ColdOpen, Title, Outro };
