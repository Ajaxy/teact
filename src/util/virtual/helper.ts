import {CheckShouldUpdateVirtual} from "./update.chain";
import {VirtualChainOptions} from "./interface";
import {CheckShouldUpdateListenerVirtual} from "./update-listener.chain";
import {CheckShouldCancelReRenderVirtual} from "./cancel-reRender.chain";
import {CheckShouldCreateComponent} from "./create-component.chain";

export class ChainOfRenderVirtual {
  constructor() {}

  render(
    args : VirtualChainOptions
  ) : VirtualChainOptions {
    const result = new CheckShouldUpdateVirtual().setNextChecker(
      new CheckShouldUpdateListenerVirtual().setNextChecker(
        new CheckShouldCancelReRenderVirtual().setNextChecker(
          new CheckShouldCreateComponent()
        )
      )
    ).check(args);

    return result
  }
}
