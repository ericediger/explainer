import type { AnimatedScene } from '@explainer/src/kit/types';
import { Outro } from './scenes/Outro';
import { Title } from './scenes/Title';

export { spec } from './script';

// Every `component` named by an animated scene in script.ts must be registered here.
export const components: Record<string, AnimatedScene> = { Title, Outro };
