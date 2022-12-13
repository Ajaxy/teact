import {VirtualElement, VirtualElementParent} from "../../teact/teact";

export interface VirtualChainOptions<T = unknown> {
  parentEl: HTMLElement | undefined,
  $current: VirtualElement | undefined,
  $new: T|undefined,
  $parent: VirtualElementParent | any,
  index: number,
  options: {
    skipComponentUpdate?: boolean;
    nextSibling?: ChildNode;
    fragment?: DocumentFragment;
  }
}

export class VirtualChain<U = any> {
  private nextChecker?: VirtualChain<U>;

  constructor(
  ) {}

  setNextChecker(nextChecker: VirtualChain<U>) {
    this.nextChecker = nextChecker;
    return this;
  }
  protected check(args : VirtualChainOptions<U>) : VirtualChainOptions<U>{
    if (!this.nextChecker) {
      return args
    }
    return this.nextChecker.check(args)
  }
}
