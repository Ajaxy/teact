// Runs before every browser test file. It must not import Teact: `move-fallback.test.tsx` removes
// `Element.prototype.moveBefore` before teact-dom.ts is evaluated.
import { installFrameQueue } from '../utils/frames';

installFrameQueue();
