import {VirtualChain, VirtualChainOptions} from "./interface";
import {
  hasElementChanged,
  isComponentElement,
  isFragmentElement, isTagElement,
  VirtualElement,
  VirtualElementComponent, VirtualElementFragment, VirtualElementParent, VirtualElementReal, VirtualElementTag
} from "../../teact/teact";
import {
  createNode,
  getNextSibling,
  initComponent,
  insertBefore,
  mountChildren,
  remount,
  renderChildren, updateAttributes
} from "../../teact/teact-dom";

export class CheckShouldCreateComponent extends VirtualChain {
  check(argOptions : VirtualChainOptions) {
    let {$new, options, parentEl, $parent, index, $current} = argOptions
    let {fragment, nextSibling} = options
    const [shouldCreateComponent, shouldReRenderComponent] = [(!$current && $new), ($current && !$new)];
    const isNewComponent = $new && isComponentElement($new as unknown as VirtualElement);
    const isNewFragment = $new && !isNewComponent && isFragmentElement($new as unknown as VirtualElement);
    const isCurrentComponent = $current && isComponentElement($current);
    const isCurrentFragment = $current && !isCurrentComponent && isFragmentElement($current);
    const $newAsReal = $new as unknown as VirtualElementReal;

    // 1 => 1:1 => 1:2 => 1:3 =>

    if (shouldCreateComponent) {
      console.log("[#debug create-component]","1")
      if ((isNewComponent || isNewFragment)) {
        console.log("[#debug create-component]","1:1")
        if (isNewComponent) {
          console.log("[#debug create-component]","1:2")
          argOptions.$new = initComponent(parentEl!, $new as unknown as VirtualElementComponent, $parent, index) as unknown as typeof $new;
        }

        console.log("[#debug create-component]","1:3")
        mountChildren(argOptions.parentEl!, argOptions.$new as unknown as VirtualElementComponent | VirtualElementFragment, {nextSibling : argOptions.options.nextSibling, fragment : argOptions.options.fragment});
      } else {
        console.log("[#debug create-component]","1:4")
        const node = createNode($newAsReal);
        $newAsReal.target = node;
        insertBefore((fragment || parentEl) as HTMLElement | DocumentFragment, node, nextSibling);
      }
    } else if (shouldReRenderComponent) {
      console.log("[#debug create-component]","2")
      remount(parentEl as HTMLElement, $current!, undefined);
    } else if ($current && $new) {
      console.log("[#debug create-component]","3")
      if (hasElementChanged($current, $new as unknown as VirtualElement)) {
        console.log("[#debug create-component]","3:1")
        if (!nextSibling) {
          console.log("[#debug create-component]","3:2")
          argOptions.options.nextSibling = getNextSibling($current);
        }

        console.log("[#debug create-component]","3:4")
        if (isNewComponent || isNewFragment) {
          console.log("[#debug create-component]","3:5")
          if (isNewComponent) {
            console.log("[#debug create-component]","3:6")
            argOptions.$new = initComponent(parentEl as HTMLDivElement, $new as unknown as VirtualElementComponent, $parent, index) as unknown as typeof $new;
          }

          console.log("[#debug create-component]","3:7")
          remount(parentEl as HTMLDivElement, $current, undefined);
          mountChildren(parentEl as HTMLDivElement, $new as unknown as VirtualElementComponent | VirtualElementFragment, {nextSibling, fragment});
        } else {
          console.log("[#debug create-component]","3:8")
          const node = createNode($newAsReal);
          $newAsReal.target = node;
          remount(parentEl as HTMLDivElement, $current, node, nextSibling);
        }
      } else {
        console.log("[#debug create-component]","4")
        const isComponent = isCurrentComponent && isNewComponent;
        const isFragment = isCurrentFragment && isNewFragment;

        if (isComponent || isFragment) {
          console.log("[#debug create-component]","4:1");
          (argOptions.$new as unknown as VirtualElementComponent | VirtualElementFragment).children = renderChildren(
            $current as VirtualElementParent,
            $new as unknown as VirtualElementComponent | VirtualElementFragment,
            parentEl as HTMLElement,
            nextSibling,
          );
        } else {
          console.log("[#debug create-component]","4:2");
          const $currentAsReal = $current as VirtualElementReal;
          const currentTarget = $currentAsReal.target!;

          $newAsReal.target = currentTarget;
          $currentAsReal.target = undefined; // Help GC

          if (isTagElement($current)) {
            console.log("[#debug create-component]","4:3");
            const $newAsTag = $new as unknown as VirtualElementTag;

            $newAsTag.props.ref = $current.props.ref;

            if (nextSibling) {
              console.log("[#debug create-component]","4:4");
              insertBefore(parentEl as HTMLElement, currentTarget, nextSibling);
            }

            updateAttributes($current, $newAsTag, currentTarget as HTMLElement);
            $newAsTag.children = renderChildren(
              $current,
              $newAsTag,
              currentTarget as HTMLElement,
            );

            console.log("[#debug create-component]","4:5");
          }
        }
      }
    }

    return super.check(argOptions);
  }
}
