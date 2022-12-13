import {VirtualChain, VirtualChainOptions} from "./interface";
import {hasElementChanged, isComponentElement, VirtualElement, VirtualElementComponent} from "../../teact/teact";
import {updateComponent} from "../../teact/teact-dom";

export class CheckShouldUpdateVirtual extends VirtualChain {
  check(argOptions:VirtualChainOptions){
    const {$new,$current,options} = argOptions
    const {skipComponentUpdate} = options;
    const isCurrentComponent = $current && isComponentElement($current);
    const isNewComponent = $new && isComponentElement($new as unknown as VirtualElement);

    const shouldUpdateComponent = !skipComponentUpdate
      && isCurrentComponent && isNewComponent
      && !hasElementChanged($current!, $new as unknown as VirtualElement);

    if(shouldUpdateComponent) {
      argOptions.$new = updateComponent(
        $current as VirtualElementComponent,
        $new as unknown as VirtualElementComponent
      ) as unknown as typeof $new;
    }

    return super.check(argOptions);
  }
}
