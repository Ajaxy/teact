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


    if (shouldCreateComponent) {
      if ((isNewComponent || isNewFragment)) {
        if (isNewComponent) {
          argOptions.$new = initComponent(parentEl!, $new as unknown as VirtualElementComponent, $parent, index) as unknown as typeof $new;
        }

        mountChildren(parentEl!, $new as unknown as VirtualElementComponent | VirtualElementFragment, {nextSibling, fragment});
      } else {
        const node = createNode($newAsReal);
        $newAsReal.target = node;
        insertBefore((fragment || parentEl) as HTMLElement | DocumentFragment, node, nextSibling);
      }
    } else if (shouldReRenderComponent) {
      remount(parentEl as HTMLElement, $current!, undefined);
    } else if ($current && $new) {
      if (hasElementChanged($current, $new as unknown as VirtualElement)) {
        if (!nextSibling) {
          argOptions.options.nextSibling = getNextSibling($current);
        }

        if (isNewComponent || isNewFragment) {
          if (isNewComponent) {
            argOptions.$new = initComponent(parentEl as HTMLDivElement, $new as unknown as VirtualElementComponent, $parent, index) as unknown as typeof $new;
          }

          remount(parentEl as HTMLDivElement, $current, undefined);
          mountChildren(parentEl as HTMLDivElement, $new as unknown as VirtualElementComponent | VirtualElementFragment, {nextSibling, fragment});
        } else {
          const node = createNode($newAsReal);
          $newAsReal.target = node;
          remount(parentEl as HTMLDivElement, $current, node, nextSibling);
        }
      } else {
        const isComponent = isCurrentComponent && isNewComponent;
        const isFragment = isCurrentFragment && isNewFragment;

        if (isComponent || isFragment) {
          (argOptions.$new as unknown as VirtualElementComponent | VirtualElementFragment).children = renderChildren(
            $current as VirtualElementParent,
            $new as unknown as VirtualElementComponent | VirtualElementFragment,
            parentEl as HTMLElement,
            nextSibling,
          );
        } else {
          const $currentAsReal = $current as VirtualElementReal;
          const currentTarget = $currentAsReal.target!;

          $newAsReal.target = currentTarget;
          $currentAsReal.target = undefined; // Help GC

          if (isTagElement($current)) {
            const $newAsTag = $new as unknown as VirtualElementTag;

            $newAsTag.props.ref = $current.props.ref;

            if (nextSibling) {
              insertBefore(parentEl as HTMLElement, currentTarget, nextSibling);
            }

            updateAttributes($current, $newAsTag, currentTarget as HTMLElement);

            $newAsTag.children = renderChildren(
              $current,
              $newAsTag,
              currentTarget as HTMLElement,
            );
          }
        }
      }
    }

    return super.check(argOptions);
  }
}
