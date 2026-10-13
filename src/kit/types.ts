import type React from 'react';
import type { VideoSpec } from '../spec';
import type { TimelineScene } from '../timeline';

export type AnimatedSceneProps = { scene: TimelineScene; spec: VideoSpec };
export type AnimatedScene = React.FC<AnimatedSceneProps>;
