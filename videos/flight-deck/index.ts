import type { AnimatedScene } from '../../src/kit/types';
import { ColdOpen } from './scenes/ColdOpen';
import { HowItWorks } from './scenes/HowItWorks';
import { Outro } from './scenes/Outro';

export { spec } from './script';

export const components: Record<string, AnimatedScene> = { ColdOpen, HowItWorks, Outro };
