import {VirtualChain, VirtualChainOptions} from "./interface";

export class CheckShouldCancelReRenderVirtual extends VirtualChain {
  check(argOptions : VirtualChainOptions){
    const {$new,$current} = argOptions
    const cancelReRender = $current === $new
    console.log("Cancel ? " , $new,$current)
    if(cancelReRender) {
      return argOptions
    }

    return super.check(argOptions);
  }
}
