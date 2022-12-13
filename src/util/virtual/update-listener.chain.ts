import {VirtualChain, VirtualChainOptions} from "./interface";
import {isComponentElement, VirtualElement, VirtualElementComponent} from "../../teact/teact";
import {setupComponentUpdateListener} from "../../teact/teact-dom";

export class CheckShouldUpdateListenerVirtual extends VirtualChain {
  check(argOptions : VirtualChainOptions){
    const {$new,options , parentEl , $parent , index} = argOptions

    const {skipComponentUpdate} = options;
    const isNewComponent = $new && isComponentElement($new as unknown as VirtualElement);

    const shouldUpdateListener = !skipComponentUpdate && isNewComponent && ($new as unknown as VirtualElementComponent).componentInstance.isMounted;

    if(shouldUpdateListener) {
      setupComponentUpdateListener(parentEl!, $new as unknown as VirtualElementComponent, $parent, index);
    }

    return super.check(argOptions);
  }
}
