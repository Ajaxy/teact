/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/config.ts":
/*!***********************!*\
  !*** ./src/config.ts ***!
  \***********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "DEBUG": () => (/* binding */ DEBUG),
/* harmony export */   "DEBUG_MORE": () => (/* binding */ DEBUG_MORE)
/* harmony export */ });
var DEBUG = true;
var DEBUG_MORE = false;

/***/ }),

/***/ "./src/teact/dom-events.ts":
/*!*********************************!*\
  !*** ./src/teact/dom-events.ts ***!
  \*********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "addEventListener": () => (/* binding */ addEventListener),
/* harmony export */   "removeAllDelegatedListeners": () => (/* binding */ removeAllDelegatedListeners),
/* harmony export */   "removeEventListener": () => (/* binding */ removeEventListener)
/* harmony export */ });
/* harmony import */ var _config__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../config */ "./src/config.ts");

var NON_BUBBLEABLE_EVENTS = new Set(['scroll', 'mouseenter', 'mouseleave', 'load']);
var documentEventCounters = {};
var delegationRegistryByEventType = {};
var delegatedEventTypesByElement = new Map();
function addEventListener(element, propName, handler) {
  var asCapture = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;
  var eventType = resolveEventType(propName, element);

  if (canUseEventDelegation(eventType, element, asCapture)) {
    addDelegatedListener(eventType, element, handler);
  } else {
    element.addEventListener(eventType, handler, asCapture);
  }
}
function removeEventListener(element, propName, handler) {
  var asCapture = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;
  var eventType = resolveEventType(propName, element);

  if (canUseEventDelegation(eventType, element, asCapture)) {
    removeDelegatedListener(eventType, element);
  } else {
    element.removeEventListener(eventType, handler, asCapture);
  }
}

function resolveEventType(propName, element) {
  var eventType = propName.replace(/^on/, '').replace(/Capture$/, '').toLowerCase();

  if (eventType === 'change' && element.tagName !== 'SELECT') {
    // React behavior repeated here.
    // https://stackoverflow.com/questions/38256332/in-react-whats-the-difference-between-onchange-and-oninput
    return 'input';
  }

  if (eventType === 'doubleclick') {
    return 'dblclick';
  } // Replace focus/blur by their "bubbleable" versions


  if (eventType === 'focus') {
    return 'focusin';
  }

  if (eventType === 'blur') {
    return 'focusout';
  }

  return eventType;
}

function canUseEventDelegation(realEventType, element, asCapture) {
  return !asCapture && !NON_BUBBLEABLE_EVENTS.has(realEventType) && element.tagName !== 'VIDEO' && element.tagName !== 'IFRAME';
}

function addDelegatedListener(eventType, element, handler) {
  if (!documentEventCounters[eventType]) {
    documentEventCounters[eventType] = 0;
    document.addEventListener(eventType, handleEvent);
  }

  resolveDelegationRegistry(eventType).set(element, handler);
  resolveDelegatedEventTypes(element).add(eventType);
  documentEventCounters[eventType]++;
}

function removeDelegatedListener(eventType, element) {
  documentEventCounters[eventType]--;

  if (!documentEventCounters[eventType]) {
    // Synchronous deletion on 0 will cause perf degradation in the case of 1 element
    // which is not a real case, so it's ok to do it this way
    document.removeEventListener(eventType, handleEvent);
  }

  delegationRegistryByEventType[eventType]["delete"](element);
  delegatedEventTypesByElement.get(element)["delete"](eventType);
}

function removeAllDelegatedListeners(element) {
  var eventTypes = delegatedEventTypesByElement.get(element);

  if (!eventTypes) {
    return;
  }

  eventTypes.forEach(function (eventType) {
    return removeDelegatedListener(eventType, element);
  });
  delegatedEventTypesByElement["delete"](element);
}

function handleEvent(realEvent) {
  var events = delegationRegistryByEventType[realEvent.type];

  if (events) {
    var furtherCallsPrevented = false;
    var current = realEvent.target;

    var stopPropagation = function stopPropagation() {
      furtherCallsPrevented = true;
    };

    var preventDefault = function preventDefault() {
      realEvent.preventDefault();
    }; // Proxy is a simplest way to provide an access to the event property


    var event = new Proxy(realEvent, {
      get: function get(target, p) {
        if (p === 'currentTarget') {
          return current;
        }

        if (p === 'stopPropagation' || p === 'stopImmediatePropagation') {
          return stopPropagation;
        }

        if (p === 'preventDefault') {
          // "this" is changed to proxy and one can't call methods via it
          return preventDefault;
        }

        return Reflect.get(target, p);
      }
    }); // This can also be limited by teact root

    while (current && current !== document.body) {
      var handler = events.get(current);

      if (handler) {
        handler(event);

        if (furtherCallsPrevented) {
          return;
        }
      }

      current = current.parentNode;
    }
  }
}

function resolveDelegationRegistry(eventType) {
  if (!delegationRegistryByEventType[eventType]) {
    delegationRegistryByEventType[eventType] = new Map();
  }

  return delegationRegistryByEventType[eventType];
}

function resolveDelegatedEventTypes(element) {
  var existing = delegatedEventTypesByElement.get(element);

  if (existing) {
    return existing;
  }

  var newSet = new Set();
  delegatedEventTypesByElement.set(element, newSet);
  return newSet;
}

if (_config__WEBPACK_IMPORTED_MODULE_0__.DEBUG) {
  document.addEventListener('dblclick', function () {
    var documentListenersCount = Object.keys(documentEventCounters).length;
    var delegatedHandlersCount1 = Object.values(documentEventCounters).reduce(function (acc, counter) {
      return acc + counter;
    }, 0);
    var delegationRegistriesCount = Object.keys(delegationRegistryByEventType).length;
    var delegatedHandlersCount2 = Object.values(delegationRegistryByEventType).reduce(function (acc, delegationRegistry) {
      return acc + delegationRegistry.size;
    }, 0);
    var delegationElementsCount = delegatedEventTypesByElement.size;
    var delegatedEventTypesCount = Array.from(delegatedEventTypesByElement.values()).reduce(function (acc, eventTypes) {
      return acc + eventTypes.size;
    }, 0); // eslint-disable-next-line no-console

    console.warn('DELEGATED EVENTS STATS', {
      delegatedHandlersCount1: delegatedHandlersCount1,
      delegatedHandlersCount2: delegatedHandlersCount2,
      delegatedEventTypesCount: delegatedEventTypesCount,
      delegationRegistriesCount: delegationRegistriesCount,
      delegationElementsCount: delegationElementsCount,
      documentListenersCount: documentListenersCount
    });
  });
}

/***/ }),

/***/ "./src/teact/teact-dom.ts":
/*!********************************!*\
  !*** ./src/teact/teact-dom.ts ***!
  \********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__),
/* harmony export */   "unmountRealTree": () => (/* binding */ unmountRealTree)
/* harmony export */ });
/* harmony import */ var _teact__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./teact */ "./src/teact/teact.ts");
/* harmony import */ var _util_generateIdFor__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../util/generateIdFor */ "./src/util/generateIdFor.ts");
/* harmony import */ var _config__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../config */ "./src/config.ts");
/* harmony import */ var _dom_events__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./dom-events */ "./src/teact/dom-events.ts");
/* harmony import */ var _util_iteratees__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../util/iteratees */ "./src/util/iteratees.ts");
function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function _iterableToArrayLimit(arr, i) { var _i = arr == null ? null : typeof Symbol !== "undefined" && arr[Symbol.iterator] || arr["@@iterator"]; if (_i == null) return; var _arr = []; var _n = true; var _d = false; var _s, _e; try { for (_i = _i.call(arr); !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }






var FILTERED_ATTRIBUTES = new Set(['key', 'ref', 'teactFastList', 'teactOrderKey']);
var HTML_ATTRIBUTES = new Set(['dir', 'role', 'form']);
var CONTROLLABLE_TAGS = ['INPUT', 'TEXTAREA', 'SELECT'];
var MAPPED_ATTRIBUTES = {
  autoPlay: 'autoplay',
  autoComplete: 'autocomplete'
};
var INDEX_KEY_PREFIX = '__indexKey#';
var headsByElement = {};

function render($element, parentEl) {
  var headId = parentEl.getAttribute('data-teact-head-id');

  if (!headId) {
    headId = (0,_util_generateIdFor__WEBPACK_IMPORTED_MODULE_1__["default"])(headsByElement);
    headsByElement[headId] = {
      children: []
    };
    parentEl.setAttribute('data-teact-head-id', headId);
  }

  var $head = headsByElement[headId];
  var $newElement = renderWithVirtual(parentEl, $head.children[0], $element, $head, 0);
  $head.children = $newElement ? [$newElement] : [];
  return undefined;
}

function renderWithVirtual(parentEl, $current, $new, $parent, index) {
  var options = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : {};
  var skipComponentUpdate = options.skipComponentUpdate,
      fragment = options.fragment;
  var nextSibling = options.nextSibling;
  var isCurrentComponent = $current && (0,_teact__WEBPACK_IMPORTED_MODULE_0__.isComponentElement)($current);
  var isNewComponent = $new && (0,_teact__WEBPACK_IMPORTED_MODULE_0__.isComponentElement)($new);
  var $newAsReal = $new;
  var isCurrentFragment = $current && !isCurrentComponent && (0,_teact__WEBPACK_IMPORTED_MODULE_0__.isFragmentElement)($current);
  var isNewFragment = $new && !isNewComponent && (0,_teact__WEBPACK_IMPORTED_MODULE_0__.isFragmentElement)($new);

  if (!skipComponentUpdate && isCurrentComponent && isNewComponent && !(0,_teact__WEBPACK_IMPORTED_MODULE_0__.hasElementChanged)($current, $new)) {
    $new = updateComponent($current, $new);
  } // Parent element may have changed, so we need to update the listener closure.


  if (!skipComponentUpdate && isNewComponent && $new.componentInstance.isMounted) {
    setupComponentUpdateListener(parentEl, $new, $parent, index);
  }

  if ($current === $new) {
    return $new;
  }

  if (_config__WEBPACK_IMPORTED_MODULE_2__.DEBUG && $new) {
    var newTarget = 'target' in $new && $new.target;

    if (newTarget && (!$current || 'target' in $current && newTarget !== $current.target)) {
      throw new Error('[Teact] Cached virtual element was moved within tree');
    }
  }

  if (!$current && $new) {
    if (isNewComponent || isNewFragment) {
      if (isNewComponent) {
        $new = initComponent(parentEl, $new, $parent, index);
      }

      mountChildren(parentEl, $new, {
        nextSibling: nextSibling,
        fragment: fragment
      });
    } else {
      var node = createNode($newAsReal);
      $newAsReal.target = node;
      insertBefore(fragment || parentEl, node, nextSibling);
    }
  } else if ($current && !$new) {
    remount(parentEl, $current, undefined);
  } else if ($current && $new) {
    if ((0,_teact__WEBPACK_IMPORTED_MODULE_0__.hasElementChanged)($current, $new)) {
      if (!nextSibling) {
        nextSibling = getNextSibling($current);
      }

      if (isNewComponent || isNewFragment) {
        if (isNewComponent) {
          $new = initComponent(parentEl, $new, $parent, index);
        }

        remount(parentEl, $current, undefined);
        mountChildren(parentEl, $new, {
          nextSibling: nextSibling,
          fragment: fragment
        });
      } else {
        var _node = createNode($newAsReal);

        $newAsReal.target = _node;
        remount(parentEl, $current, _node, nextSibling);
      }
    } else {
      var isComponent = isCurrentComponent && isNewComponent;
      var isFragment = isCurrentFragment && isNewFragment;

      if (isComponent || isFragment) {
        $new.children = renderChildren($current, $new, parentEl, nextSibling);
      } else {
        var $currentAsReal = $current;
        var currentTarget = $currentAsReal.target;
        $newAsReal.target = currentTarget;
        $currentAsReal.target = undefined; // Help GC

        var isTag = (0,_teact__WEBPACK_IMPORTED_MODULE_0__.isTagElement)($current);

        if (isTag) {
          var $newAsTag = $new;
          $newAsTag.props.ref = $current.props.ref;

          if (nextSibling) {
            insertBefore(parentEl, currentTarget, nextSibling);
          }

          updateAttributes($current, $newAsTag, currentTarget);
          $newAsTag.children = renderChildren($current, $newAsTag, currentTarget);
        }
      }
    }
  }

  return $new;
}

function initComponent(parentEl, $element, $parent, index) {
  var _$element = $element,
      componentInstance = _$element.componentInstance;

  if (!componentInstance.isMounted) {
    $element = (0,_teact__WEBPACK_IMPORTED_MODULE_0__.mountComponent)(componentInstance);
    setupComponentUpdateListener(parentEl, $element, $parent, index);
    var $firstChild = $element.children[0];

    if ((0,_teact__WEBPACK_IMPORTED_MODULE_0__.isComponentElement)($firstChild)) {
      $element.children = [initComponent(parentEl, $firstChild, $element, 0)];
    }

    componentInstance.isMounted = true;
  }

  return $element;
}

function updateComponent($current, $new) {
  $current.componentInstance.props = $new.componentInstance.props;
  return (0,_teact__WEBPACK_IMPORTED_MODULE_0__.renderComponent)($current.componentInstance);
}

function setupComponentUpdateListener(parentEl, $element, $parent, index) {
  var componentInstance = $element.componentInstance;

  componentInstance.onUpdate = function () {
    $parent.children[index] = renderWithVirtual(parentEl, $parent.children[index], componentInstance.$element, $parent, index, {
      skipComponentUpdate: true
    });
  };
}

function mountChildren(parentEl, $element, options) {
  $element.children = $element.children.map(function ($child, i) {
    return renderWithVirtual(parentEl, undefined, $child, $element, i, options);
  });
}

function unmountChildren(parentEl, $element) {
  $element.children.forEach(function ($child) {
    renderWithVirtual(parentEl, $child, undefined, $element, -1);
  });
}

function createNode($element) {
  if ((0,_teact__WEBPACK_IMPORTED_MODULE_0__.isEmptyElement)($element)) {
    return document.createTextNode('');
  }

  if ((0,_teact__WEBPACK_IMPORTED_MODULE_0__.isTextElement)($element)) {
    return document.createTextNode($element.value);
  }

  var tag = $element.tag,
      props = $element.props,
      _$element$children = $element.children,
      children = _$element$children === void 0 ? [] : _$element$children;
  var element = document.createElement(tag);

  if (_typeof(props.ref) === 'object') {
    props.ref.current = element;
  }

  processControlled(tag, props);
  Object.entries(props).forEach(function (_ref) {
    var _ref2 = _slicedToArray(_ref, 2),
        key = _ref2[0],
        value = _ref2[1];

    if (props[key] !== undefined) {
      setAttribute(element, key, value);
    }
  });
  processUncontrolledOnMount(element, props);
  $element.children = children.map(function ($child, i) {
    return renderWithVirtual(element, undefined, $child, $element, i);
  });
  return element;
}

function remount(parentEl, $current, node, componentNextSibling) {
  var isComponent = (0,_teact__WEBPACK_IMPORTED_MODULE_0__.isComponentElement)($current);
  var isFragment = !isComponent && (0,_teact__WEBPACK_IMPORTED_MODULE_0__.isFragmentElement)($current);

  if (isComponent || isFragment) {
    if (isComponent) {
      (0,_teact__WEBPACK_IMPORTED_MODULE_0__.unmountComponent)($current.componentInstance);
    }

    unmountChildren(parentEl, $current);

    if (node) {
      insertBefore(parentEl, node, componentNextSibling);
    }
  } else {
    if (node) {
      parentEl.replaceChild(node, $current.target);
    } else {
      parentEl.removeChild($current.target);
    }

    unmountRealTree($current);
  }
}

function unmountRealTree($element) {
  if ((0,_teact__WEBPACK_IMPORTED_MODULE_0__.isComponentElement)($element)) {
    (0,_teact__WEBPACK_IMPORTED_MODULE_0__.unmountComponent)($element.componentInstance);
  } else {
    if ((0,_teact__WEBPACK_IMPORTED_MODULE_0__.isTagElement)($element)) {
      if ($element.target) {
        var _$element$props$ref;

        (0,_dom_events__WEBPACK_IMPORTED_MODULE_3__.removeAllDelegatedListeners)($element.target);

        if (((_$element$props$ref = $element.props.ref) === null || _$element$props$ref === void 0 ? void 0 : _$element$props$ref.current) === $element.target) {
          $element.props.ref.current = undefined;
        }
      }
    }

    if ($element.target) {
      $element.target = undefined; // Help GC
    }

    if (!(0,_teact__WEBPACK_IMPORTED_MODULE_0__.isParentElement)($element)) {
      return;
    }
  }

  $element.children.forEach(unmountRealTree);
}

function insertBefore(parentEl, node, nextSibling) {
  if (nextSibling) {
    parentEl.insertBefore(node, nextSibling);
  } else {
    parentEl.appendChild(node);
  }
}

function getNextSibling($current) {
  if ((0,_teact__WEBPACK_IMPORTED_MODULE_0__.isComponentElement)($current) || (0,_teact__WEBPACK_IMPORTED_MODULE_0__.isFragmentElement)($current)) {
    var lastChild = $current.children[$current.children.length - 1];
    return getNextSibling(lastChild);
  }

  var target = $current.target;
  var nextSibling = target.nextSibling;
  return nextSibling || undefined;
}

function renderChildren($current, $new, currentEl, nextSibling) {
  if (_config__WEBPACK_IMPORTED_MODULE_2__.DEBUG) {
    DEBUG_checkKeyUniqueness($new.children);
  }

  if ('props' in $new && $new.props.teactFastList) {
    return renderFastListChildren($current, $new, currentEl);
  }

  var currentChildrenLength = $current.children.length;
  var newChildrenLength = $new.children.length;
  var maxLength = Math.max(currentChildrenLength, newChildrenLength);
  var newChildren = [];
  var fragment = newChildrenLength > currentChildrenLength ? document.createDocumentFragment() : undefined;
  var lastCurrentChild = $current.children[currentChildrenLength - 1];
  var fragmentNextSibling = nextSibling || (newChildrenLength > currentChildrenLength && lastCurrentChild ? getNextSibling(lastCurrentChild) : undefined);

  for (var i = 0; i < maxLength; i++) {
    var $newChild = renderWithVirtual(currentEl, $current.children[i], $new.children[i], $new, i, i >= currentChildrenLength ? {
      fragment: fragment
    } : {
      nextSibling: nextSibling
    });

    if ($newChild) {
      newChildren.push($newChild);
    }
  }

  if (fragment) {
    insertBefore(currentEl, fragment, fragmentNextSibling);
  }

  return newChildren;
} // This function allows to prepend/append a bunch of new DOM nodes to the top/bottom of preserved ones.
// It also allows to selectively move particular preserved nodes within their DOM list.


function renderFastListChildren($current, $new, currentEl) {
  var newKeys = new Set($new.children.map(function ($newChild) {
    var key = 'props' in $newChild ? $newChild.props.key : undefined;

    if (_config__WEBPACK_IMPORTED_MODULE_2__.DEBUG && (0,_teact__WEBPACK_IMPORTED_MODULE_0__.isParentElement)($newChild)) {
      // eslint-disable-next-line no-null/no-null
      if (key === undefined || key === null) {
        // eslint-disable-next-line no-console
        console.warn('Missing `key` in `teactFastList`');
      }

      if ((0,_teact__WEBPACK_IMPORTED_MODULE_0__.isFragmentElement)($newChild)) {
        throw new Error('[Teact] Fragment can not be child of container with `teactFastList`');
      }
    }

    return key;
  })); // Build a collection of old children that also remain in the new list

  var currentRemainingIndex = 0;
  var remainingByKey = $current.children.reduce(function (acc, $currentChild, i) {
    var key = 'props' in $currentChild ? $currentChild.props.key : undefined; // eslint-disable-next-line no-null/no-null

    var isKeyPresent = key !== undefined && key !== null; // First we process removed children

    if (isKeyPresent && !newKeys.has(key)) {
      renderWithVirtual(currentEl, $currentChild, undefined, $new, -1);
      return acc;
    } else if (!isKeyPresent) {
      var $newChild = $new.children[i];
      var newChildKey = $newChild && 'props' in $newChild ? $newChild.props.key : undefined; // If a non-key element remains at the same index we preserve it with a virtual `key`

      if ($newChild && !newChildKey) {
        key = "".concat(INDEX_KEY_PREFIX).concat(i); // Otherwise, we just remove it
      } else {
        renderWithVirtual(currentEl, $currentChild, undefined, $new, -1);
        return acc;
      }
    } // Then we build up info about remaining children


    acc[key] = {
      $element: $currentChild,
      index: currentRemainingIndex++,
      orderKey: 'props' in $currentChild ? $currentChild.props.teactOrderKey : undefined
    };
    return acc;
  }, {});
  var newChildren = [];
  var fragmentElements;
  var fragmentIndex;
  var currentPreservedIndex = 0;
  $new.children.forEach(function ($newChild, i) {
    var key = 'props' in $newChild ? $newChild.props.key : "".concat(INDEX_KEY_PREFIX).concat(i);
    var currentChildInfo = remainingByKey[key];

    if (!currentChildInfo) {
      if (!fragmentElements) {
        fragmentElements = [];
        fragmentIndex = i;
      }

      fragmentElements.push($newChild);
      return;
    } // This prepends new children to the top


    if (fragmentElements) {
      newChildren = newChildren.concat(renderFragment(fragmentElements, fragmentIndex, currentEl, $new));
      fragmentElements = undefined;
      fragmentIndex = undefined;
    } // Now we check if a preserved node was moved within preserved list


    var newOrderKey = 'props' in $newChild ? $newChild.props.teactOrderKey : undefined; // That is indicated by a changed `teactOrderKey` value

    var shouldMoveNode = currentChildInfo.index !== currentPreservedIndex && currentChildInfo.orderKey !== newOrderKey;
    var isMovingDown = shouldMoveNode && currentPreservedIndex > currentChildInfo.index;

    if (!shouldMoveNode || isMovingDown) {
      currentPreservedIndex++;
    }

    newChildren.push(renderWithVirtual(currentEl, currentChildInfo.$element, $newChild, $new, i, {
      // `+ 1` is needed because before moving down the node still takes place above
      nextSibling: shouldMoveNode ? currentEl.childNodes[isMovingDown ? i + 1 : i] : undefined
    }));
  }); // This appends new children to the bottom

  if (fragmentElements) {
    newChildren = newChildren.concat(renderFragment(fragmentElements, fragmentIndex, currentEl, $new));
  }

  return newChildren;
}

function renderFragment(elements, fragmentIndex, parentEl, $parent) {
  var nextSibling = parentEl.childNodes[fragmentIndex];

  if (elements.length === 1) {
    return [renderWithVirtual(parentEl, undefined, elements[0], $parent, fragmentIndex, {
      nextSibling: nextSibling
    })];
  }

  var fragment = document.createDocumentFragment();
  var newChildren = elements.map(function ($element, i) {
    return renderWithVirtual(parentEl, undefined, $element, $parent, fragmentIndex + i, {
      fragment: fragment
    });
  });
  insertBefore(parentEl, fragment, nextSibling);
  return newChildren;
}

function processControlled(tag, props) {
  var isValueControlled = props.value !== undefined;
  var isCheckedControlled = props.checked !== undefined;
  var isControlled = (isValueControlled || isCheckedControlled) && CONTROLLABLE_TAGS.includes(tag.toUpperCase());

  if (!isControlled) {
    return;
  }

  var value = props.value,
      checked = props.checked,
      onInput = props.onInput,
      onChange = props.onChange;
  props.onChange = undefined;

  props.onInput = function (e) {
    onInput === null || onInput === void 0 ? void 0 : onInput(e);
    onChange === null || onChange === void 0 ? void 0 : onChange(e);

    if (value !== undefined) {
      e.currentTarget.value = value;
    }

    if (checked !== undefined) {
      e.currentTarget.checked = checked;
    }
  };
}

function processUncontrolledOnMount(element, props) {
  if (!CONTROLLABLE_TAGS.includes(element.tagName)) {
    return;
  }

  if (props.defaultValue) {
    setAttribute(element, 'value', props.defaultValue);
  }

  if (props.defaultChecked) {
    setAttribute(element, 'checked', props.defaultChecked);
  }
}

function updateAttributes($current, $new, element) {
  processControlled(element.tagName, $new.props);
  var currentEntries = Object.entries($current.props);
  var newEntries = Object.entries($new.props);
  currentEntries.forEach(function (_ref3) {
    var _ref4 = _slicedToArray(_ref3, 2),
        key = _ref4[0],
        currentValue = _ref4[1];

    var newValue = $new.props[key];

    if (currentValue !== undefined && (newValue === undefined || currentValue !== newValue && key.startsWith('on'))) {
      removeAttribute(element, key, currentValue);
    }
  });
  newEntries.forEach(function (_ref5) {
    var _ref6 = _slicedToArray(_ref5, 2),
        key = _ref6[0],
        newValue = _ref6[1];

    var currentValue = $current.props[key];

    if (newValue !== undefined && newValue !== currentValue) {
      setAttribute(element, key, newValue);
    }
  });
}

function setAttribute(element, key, value) {
  // An optimization attempt
  if (key === 'className') {
    element.className = value; // An optimization attempt
  } else if (key === 'value') {
    if (element.value !== value) {
      element.value = value;
    }
  } else if (key === 'style') {
    element.style.cssText = value;
  } else if (key === 'dangerouslySetInnerHTML') {
    // eslint-disable-next-line no-underscore-dangle
    element.innerHTML = value.__html;
  } else if (key.startsWith('on')) {
    (0,_dom_events__WEBPACK_IMPORTED_MODULE_3__.addEventListener)(element, key, value, key.endsWith('Capture'));
  } else if (key.startsWith('data-') || key.startsWith('aria-') || HTML_ATTRIBUTES.has(key)) {
    element.setAttribute(key, value);
  } else if (!FILTERED_ATTRIBUTES.has(key)) {
    element[MAPPED_ATTRIBUTES[key] || key] = value;
  }
}

function removeAttribute(element, key, value) {
  if (key === 'className') {
    element.className = '';
  } else if (key === 'value') {
    element.value = '';
  } else if (key === 'style') {
    element.style.cssText = '';
  } else if (key === 'dangerouslySetInnerHTML') {
    element.innerHTML = '';
  } else if (key.startsWith('on')) {
    (0,_dom_events__WEBPACK_IMPORTED_MODULE_3__.removeEventListener)(element, key, value, key.endsWith('Capture'));
  } else if (key.startsWith('data-') || key.startsWith('aria-') || HTML_ATTRIBUTES.has(key)) {
    element.removeAttribute(key);
  } else if (!FILTERED_ATTRIBUTES.has(key)) {
    delete element[MAPPED_ATTRIBUTES[key] || key];
  }
} // eslint-disable-next-line @typescript-eslint/naming-convention


function DEBUG_checkKeyUniqueness(children) {
  var firstChild = children[0];

  if (firstChild && 'props' in firstChild && firstChild.props.key !== undefined) {
    var keys = children.reduce(function (acc, child) {
      if ('props' in child && child.props.key) {
        acc.push(child.props.key);
      }

      return acc;
    }, []);

    if (keys.length !== (0,_util_iteratees__WEBPACK_IMPORTED_MODULE_4__.unique)(keys).length) {
      throw new Error('[Teact] Children keys are not unique');
    }
  }
}

var TeactDOM = {
  render: render
};
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (TeactDOM);

/***/ }),

/***/ "./src/teact/teact.ts":
/*!****************************!*\
  !*** ./src/teact/teact.ts ***!
  \****************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "VirtualElementTypesEnum": () => (/* binding */ VirtualElementTypesEnum),
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__),
/* harmony export */   "hasElementChanged": () => (/* binding */ hasElementChanged),
/* harmony export */   "isComponentElement": () => (/* binding */ isComponentElement),
/* harmony export */   "isEmptyElement": () => (/* binding */ isEmptyElement),
/* harmony export */   "isFragmentElement": () => (/* binding */ isFragmentElement),
/* harmony export */   "isParentElement": () => (/* binding */ isParentElement),
/* harmony export */   "isTagElement": () => (/* binding */ isTagElement),
/* harmony export */   "isTextElement": () => (/* binding */ isTextElement),
/* harmony export */   "memo": () => (/* binding */ memo),
/* harmony export */   "mountComponent": () => (/* binding */ mountComponent),
/* harmony export */   "renderComponent": () => (/* binding */ renderComponent),
/* harmony export */   "unmountComponent": () => (/* binding */ unmountComponent),
/* harmony export */   "useCallback": () => (/* binding */ useCallback),
/* harmony export */   "useEffect": () => (/* binding */ useEffect),
/* harmony export */   "useLayoutEffect": () => (/* binding */ useLayoutEffect),
/* harmony export */   "useMemo": () => (/* binding */ useMemo),
/* harmony export */   "useRef": () => (/* binding */ useRef),
/* harmony export */   "useState": () => (/* binding */ useState)
/* harmony export */ });
/* harmony import */ var _config__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../config */ "./src/config.ts");
/* harmony import */ var _util_schedulers__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../util/schedulers */ "./src/util/schedulers.ts");
/* harmony import */ var _util_iteratees__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../util/iteratees */ "./src/util/iteratees.ts");
/* harmony import */ var _util_arePropsShallowEqual__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../util/arePropsShallowEqual */ "./src/util/arePropsShallowEqual.ts");
/* harmony import */ var _util_handleError__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../util/handleError */ "./src/util/handleError.ts");
function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { _defineProperty(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function _iterableToArrayLimit(arr, i) { var _i = arr == null ? null : typeof Symbol !== "undefined" && arr[Symbol.iterator] || arr["@@iterator"]; if (_i == null) return; var _arr = []; var _n = true; var _d = false; var _s, _e; try { for (_i = _i.call(arr); !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }






var VirtualElementTypesEnum;

(function (VirtualElementTypesEnum) {
  VirtualElementTypesEnum[VirtualElementTypesEnum["Empty"] = 0] = "Empty";
  VirtualElementTypesEnum[VirtualElementTypesEnum["Text"] = 1] = "Text";
  VirtualElementTypesEnum[VirtualElementTypesEnum["Tag"] = 2] = "Tag";
  VirtualElementTypesEnum[VirtualElementTypesEnum["Component"] = 3] = "Component";
  VirtualElementTypesEnum[VirtualElementTypesEnum["Fragment"] = 4] = "Fragment";
})(VirtualElementTypesEnum || (VirtualElementTypesEnum = {}));

var Fragment = Symbol('Fragment');
var DEBUG_RENDER_THRESHOLD = 7;
var DEBUG_EFFECT_THRESHOLD = 7;
var DEBUG_SILENT_RENDERS_FOR = new Set(['TeactMemoWrapper', 'TeactNContainer', 'Button', 'ListItem', 'MenuItem']);
var renderingInstance;
function isEmptyElement($element) {
  return $element.type === VirtualElementTypesEnum.Empty;
}
function isTextElement($element) {
  return $element.type === VirtualElementTypesEnum.Text;
}
function isTagElement($element) {
  return $element.type === VirtualElementTypesEnum.Tag;
}
function isComponentElement($element) {
  return $element.type === VirtualElementTypesEnum.Component;
}
function isFragmentElement($element) {
  return $element.type === VirtualElementTypesEnum.Fragment;
}
function isParentElement($element) {
  return isTagElement($element) || isComponentElement($element) || isFragmentElement($element);
}

function createElement(source, props) {
  for (var _len = arguments.length, children = new Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
    children[_key - 2] = arguments[_key];
  }

  children = children.flat();

  if (source === Fragment) {
    return buildFragmentElement(children);
  } else if (typeof source === 'function') {
    return createComponentInstance(source, props || {}, children);
  } else {
    return buildTagElement(source, props || {}, children);
  }
}

function buildFragmentElement(children) {
  return {
    type: VirtualElementTypesEnum.Fragment,
    children: dropEmptyTail(children, true).map(buildChildElement)
  };
}

function createComponentInstance(Component, props, children) {
  var parsedChildren;

  if (children.length === 0) {
    parsedChildren = undefined;
  } else if (children.length === 1) {
    var _children = _slicedToArray(children, 1);

    parsedChildren = _children[0];
  } else {
    parsedChildren = children;
  }

  var componentInstance = {
    $element: {},
    Component: Component,
    name: Component.name,
    props: _objectSpread(_objectSpread({}, props), parsedChildren && {
      children: parsedChildren
    }),
    isMounted: false,
    hooks: {
      state: {
        cursor: 0,
        byCursor: []
      },
      effects: {
        cursor: 0,
        byCursor: []
      },
      memos: {
        cursor: 0,
        byCursor: []
      },
      refs: {
        cursor: 0,
        byCursor: []
      }
    }
  };
  componentInstance.$element = buildComponentElement(componentInstance);
  return componentInstance.$element;
}

function buildComponentElement(componentInstance) {
  var children = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];
  return {
    type: VirtualElementTypesEnum.Component,
    componentInstance: componentInstance,
    props: componentInstance.props,
    children: dropEmptyTail(children, true).map(buildChildElement)
  };
}

function buildTagElement(tag, props, children) {
  return {
    type: VirtualElementTypesEnum.Tag,
    tag: tag,
    props: props,
    children: dropEmptyTail(children).map(buildChildElement)
  };
} // We only need placeholders in the middle of collection (to ensure other elements order).


function dropEmptyTail(children) {
  var noEmpty = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
  var i = children.length - 1;

  for (; i >= 0; i--) {
    if (!isEmptyPlaceholder(children[i])) {
      break;
    }
  }

  if (i === children.length - 1) {
    return children;
  }

  if (i === -1 && noEmpty) {
    return children.slice(0, 1);
  }

  return children.slice(0, i + 1);
}

function isEmptyPlaceholder(child) {
  // eslint-disable-next-line no-null/no-null
  return child === false || child === null || child === undefined;
}

function buildChildElement(child) {
  if (isEmptyPlaceholder(child)) {
    return buildEmptyElement();
  } else if (isParentElement(child)) {
    return child;
  } else {
    return buildTextElement(child);
  }
}

function buildTextElement(value) {
  return {
    type: VirtualElementTypesEnum.Text,
    value: String(value)
  };
}

function buildEmptyElement() {
  return {
    type: VirtualElementTypesEnum.Empty
  };
} // eslint-disable-next-line @typescript-eslint/naming-convention


var DEBUG_components = {};
document.addEventListener('dblclick', function () {
  // eslint-disable-next-line no-console
  console.warn('COMPONENTS', (0,_util_iteratees__WEBPACK_IMPORTED_MODULE_2__.orderBy)(Object.values(DEBUG_components), 'renderCount', 'desc'));
});
function renderComponent(componentInstance) {
  renderingInstance = componentInstance;
  componentInstance.hooks.state.cursor = 0;
  componentInstance.hooks.effects.cursor = 0;
  componentInstance.hooks.memos.cursor = 0;
  componentInstance.hooks.refs.cursor = 0;
  var Component = componentInstance.Component,
      props = componentInstance.props;
  var newRenderedValue;

  try {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    var DEBUG_startAt;

    if (_config__WEBPACK_IMPORTED_MODULE_0__.DEBUG) {
      var componentName = componentInstance.name;

      if (!DEBUG_components[componentName]) {
        DEBUG_components[componentName] = {
          componentName: componentName,
          renderCount: 0,
          renderTimes: []
        };
      }

      if (_config__WEBPACK_IMPORTED_MODULE_0__.DEBUG_MORE) {
        if (!DEBUG_SILENT_RENDERS_FOR.has(componentName)) {
          // eslint-disable-next-line no-console
          console.log("[Teact] Render ".concat(componentName));
        }
      }

      DEBUG_startAt = performance.now();
    }

    newRenderedValue = Component(props);

    if (_config__WEBPACK_IMPORTED_MODULE_0__.DEBUG) {
      var duration = performance.now() - DEBUG_startAt;
      var _componentName = componentInstance.name;

      if (duration > DEBUG_RENDER_THRESHOLD) {
        // eslint-disable-next-line no-console
        console.warn("[Teact] Slow component render: ".concat(_componentName, ", ").concat(Math.round(duration), " ms"));
      }

      DEBUG_components[_componentName].renderTimes.push(duration);

      DEBUG_components[_componentName].renderCount++;
    }
  } catch (err) {
    (0,_util_handleError__WEBPACK_IMPORTED_MODULE_4__.handleError)(err);
    newRenderedValue = componentInstance.renderedValue;
  }

  if (componentInstance.isMounted && newRenderedValue === componentInstance.renderedValue) {
    return componentInstance.$element;
  }

  componentInstance.renderedValue = newRenderedValue;
  var children = Array.isArray(newRenderedValue) ? newRenderedValue : [newRenderedValue];
  componentInstance.$element = buildComponentElement(componentInstance, children);
  return componentInstance.$element;
}
function hasElementChanged($old, $new) {
  if (_typeof($old) !== _typeof($new)) {
    return true;
  } else if ($old.type !== $new.type) {
    return true;
  } else if (isTextElement($old) && isTextElement($new)) {
    return $old.value !== $new.value;
  } else if (isTagElement($old) && isTagElement($new)) {
    return $old.tag !== $new.tag || $old.props.key !== $new.props.key;
  } else if (isComponentElement($old) && isComponentElement($new)) {
    return $old.componentInstance.Component !== $new.componentInstance.Component || $old.props.key !== $new.props.key;
  }

  return false;
}
function mountComponent(componentInstance) {
  renderComponent(componentInstance);
  componentInstance.isMounted = true;
  return componentInstance.$element;
}
function unmountComponent(componentInstance) {
  if (!componentInstance.isMounted) {
    return;
  }

  componentInstance.hooks.effects.byCursor.forEach(function (effect) {
    if (effect.cleanup) {
      try {
        effect.cleanup();
      } catch (err) {
        (0,_util_handleError__WEBPACK_IMPORTED_MODULE_4__.handleError)(err);
      } finally {
        effect.cleanup = undefined;
      }
    }
  });
  componentInstance.isMounted = false;
  helpGc(componentInstance);
} // We need to remove all references to DOM objects. We also clean all other references, just in case

function helpGc(componentInstance) {
  componentInstance.hooks.effects.byCursor.forEach(function (hook) {
    hook.cleanup = undefined;
    hook.effect = undefined;
    hook.dependencies = undefined;
  });
  componentInstance.hooks.state.byCursor.forEach(function (hook) {
    hook.value = undefined;
    hook.nextValue = undefined;
    hook.setter = undefined;
  });
  componentInstance.hooks.memos.byCursor.forEach(function (hook) {
    hook.value = undefined;
    hook.dependencies = undefined;
  });
  componentInstance.hooks.refs.byCursor.forEach(function (hook) {
    hook.current = undefined;
  });
  componentInstance.hooks = undefined;
  componentInstance.$element = undefined;
  componentInstance.renderedValue = undefined;
  componentInstance.Component = undefined;
  componentInstance.props = undefined;
  componentInstance.forceUpdate = undefined;
  componentInstance.onUpdate = undefined;
}

function prepareComponentForFrame(componentInstance) {
  if (!componentInstance.isMounted) {
    return;
  }

  componentInstance.hooks.state.byCursor.forEach(function (hook) {
    hook.value = hook.nextValue;
  });
  componentInstance.prepareForFrame = (0,_util_schedulers__WEBPACK_IMPORTED_MODULE_1__.throttleWithPrimaryRaf)(function () {
    return prepareComponentForFrame(componentInstance);
  });
  componentInstance.forceUpdate = (0,_util_schedulers__WEBPACK_IMPORTED_MODULE_1__.throttleWithRaf)(function () {
    return forceUpdateComponent(componentInstance);
  });
}

function forceUpdateComponent(componentInstance) {
  if (!componentInstance.isMounted || !componentInstance.onUpdate) {
    return;
  }

  var currentElement = componentInstance.$element;
  renderComponent(componentInstance);

  if (componentInstance.$element !== currentElement) {
    componentInstance.onUpdate();
  }
}

function useState(initial, debugKey) {
  var _renderingInstance$ho = renderingInstance.hooks.state,
      cursor = _renderingInstance$ho.cursor,
      byCursor = _renderingInstance$ho.byCursor;

  if (byCursor[cursor] === undefined) {
    byCursor[cursor] = {
      value: initial,
      nextValue: initial,
      setter: function (componentInstance) {
        return function (newValue) {
          if (byCursor[cursor].nextValue !== newValue) {
            byCursor[cursor].nextValue = typeof newValue === 'function' ? newValue(byCursor[cursor].value) : newValue;

            if (!componentInstance.prepareForFrame || !componentInstance.forceUpdate) {
              componentInstance.prepareForFrame = (0,_util_schedulers__WEBPACK_IMPORTED_MODULE_1__.throttleWithPrimaryRaf)(function () {
                return prepareComponentForFrame(componentInstance);
              });
              componentInstance.forceUpdate = (0,_util_schedulers__WEBPACK_IMPORTED_MODULE_1__.throttleWithRaf)(function () {
                return forceUpdateComponent(componentInstance);
              });
            }

            componentInstance.prepareForFrame();
            componentInstance.forceUpdate();

            if (_config__WEBPACK_IMPORTED_MODULE_0__.DEBUG_MORE) {
              if (componentInstance.name !== 'TeactNContainer') {
                // eslint-disable-next-line no-console
                console.log('[Teact.useState]', componentInstance.name, // `componentInstance.Component` may be set to `null` by GC helper
                componentInstance.Component && componentInstance.Component.DEBUG_contentComponentName ? "> ".concat(componentInstance.Component.DEBUG_contentComponentName) : '', debugKey ? "State update for ".concat(debugKey, ", next value: ") : "State update at cursor #".concat(cursor, ", next value: "), byCursor[cursor].nextValue);
              }
            }
          }
        };
      }(renderingInstance)
    };
  }

  renderingInstance.hooks.state.cursor++;
  return [byCursor[cursor].value, byCursor[cursor].setter];
}

function useLayoutEffectBase(schedulerFn, primarySchedulerFn, effect, dependencies, debugKey) {
  var _byCursor$cursor;

  var _renderingInstance$ho2 = renderingInstance.hooks.effects,
      cursor = _renderingInstance$ho2.cursor,
      byCursor = _renderingInstance$ho2.byCursor;
  var componentInstance = renderingInstance;

  function execCleanup() {
    if (!componentInstance.isMounted) {
      return;
    }

    var cleanup = byCursor[cursor].cleanup;

    if (!cleanup) {
      return;
    }

    try {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      var DEBUG_startAt;

      if (_config__WEBPACK_IMPORTED_MODULE_0__.DEBUG) {
        DEBUG_startAt = performance.now();
      }

      cleanup();

      if (_config__WEBPACK_IMPORTED_MODULE_0__.DEBUG) {
        var duration = performance.now() - DEBUG_startAt;
        var componentName = componentInstance.name;

        if (duration > DEBUG_EFFECT_THRESHOLD) {
          // eslint-disable-next-line no-console
          console.warn("[Teact] Slow cleanup at effect cursor #".concat(cursor, ": ").concat(componentName, ", ").concat(Math.round(duration), " ms"));
        }
      }
    } catch (err) {
      (0,_util_handleError__WEBPACK_IMPORTED_MODULE_4__.handleError)(err);
    } finally {
      byCursor[cursor].cleanup = undefined;
    }
  }

  function exec() {
    if (!componentInstance.isMounted) {
      return;
    }

    execCleanup(); // eslint-disable-next-line @typescript-eslint/naming-convention

    var DEBUG_startAt;

    if (_config__WEBPACK_IMPORTED_MODULE_0__.DEBUG) {
      DEBUG_startAt = performance.now();
    }

    var result = effect();

    if (typeof result === 'function') {
      byCursor[cursor].cleanup = result;
    }

    if (_config__WEBPACK_IMPORTED_MODULE_0__.DEBUG) {
      var duration = performance.now() - DEBUG_startAt;
      var componentName = componentInstance.name;

      if (duration > DEBUG_EFFECT_THRESHOLD) {
        // eslint-disable-next-line no-console
        console.warn("[Teact] Slow effect at cursor #".concat(cursor, ": ").concat(componentName, ", ").concat(Math.round(duration), " ms"));
      }
    }
  }

  if (byCursor[cursor] !== undefined && dependencies && byCursor[cursor].dependencies) {
    if (dependencies.some(function (dependency, i) {
      return dependency !== byCursor[cursor].dependencies[i];
    })) {
      if (debugKey) {
        var causedBy = dependencies.reduce(function (res, newValue, i) {
          var prevValue = byCursor[cursor].dependencies[i];

          if (newValue !== prevValue) {
            res.push("".concat(i, ": ").concat(prevValue, " => ").concat(newValue));
          }

          return res;
        }, []); // eslint-disable-next-line no-console

        console.log("[Teact] Effect \"".concat(debugKey, "\" caused by dependencies."), causedBy.join(', '));
      }

      primarySchedulerFn(execCleanup);
      schedulerFn(exec);
    }
  } else {
    if (debugKey) {
      // eslint-disable-next-line no-console
      console.log("[Teact] Effect \"".concat(debugKey, "\" caused by missing dependencies."));
    }

    primarySchedulerFn(execCleanup);
    schedulerFn(exec);
  }

  byCursor[cursor] = {
    effect: effect,
    dependencies: dependencies,
    cleanup: (_byCursor$cursor = byCursor[cursor]) === null || _byCursor$cursor === void 0 ? void 0 : _byCursor$cursor.cleanup
  };
  renderingInstance.hooks.effects.cursor++;
}

function useEffect(effect, dependencies, debugKey) {
  return useLayoutEffectBase(_util_schedulers__WEBPACK_IMPORTED_MODULE_1__.fastRaf, _util_schedulers__WEBPACK_IMPORTED_MODULE_1__.fastRafPrimary, effect, dependencies, debugKey);
}
function useLayoutEffect(effect, dependencies, debugKey) {
  return useLayoutEffectBase(_util_schedulers__WEBPACK_IMPORTED_MODULE_1__.onTickEnd, _util_schedulers__WEBPACK_IMPORTED_MODULE_1__.onTickEndPrimary, effect, dependencies, debugKey);
}
function useMemo(resolver, dependencies, debugKey) {
  var _renderingInstance$ho3 = renderingInstance.hooks.memos,
      cursor = _renderingInstance$ho3.cursor,
      byCursor = _renderingInstance$ho3.byCursor;

  var _ref = byCursor[cursor] || {},
      value = _ref.value;

  if (byCursor[cursor] === undefined || dependencies.some(function (dependency, i) {
    return dependency !== byCursor[cursor].dependencies[i];
  })) {
    if (_config__WEBPACK_IMPORTED_MODULE_0__.DEBUG && debugKey) {
      // eslint-disable-next-line no-console
      console.log("[Teact.useMemo] ".concat(renderingInstance.name, " (").concat(debugKey, "): Update is caused by:"), byCursor[cursor] ? (0,_util_arePropsShallowEqual__WEBPACK_IMPORTED_MODULE_3__.getUnequalProps)(dependencies, byCursor[cursor].dependencies).join(', ') : '[first render]');
    }

    value = resolver();
  }

  byCursor[cursor] = {
    value: value,
    dependencies: dependencies
  };
  renderingInstance.hooks.memos.cursor++;
  return value;
}
function useCallback(newCallback, dependencies, debugKey) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(function () {
    return newCallback;
  }, dependencies, debugKey);
}
// React way (empty is `null`)
// eslint-disable-next-line no-null/no-null
function useRef(initial) {
  var _renderingInstance$ho4 = renderingInstance.hooks.refs,
      cursor = _renderingInstance$ho4.cursor,
      byCursor = _renderingInstance$ho4.byCursor;

  if (!byCursor[cursor]) {
    byCursor[cursor] = {
      current: initial
    };
  }

  renderingInstance.hooks.refs.cursor++;
  return byCursor[cursor];
}
function memo(Component, debugKey) {
  return function TeactMemoWrapper(props) {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    return useMemo(function () {
      return createElement(Component, props);
    }, Object.values(props), debugKey);
  };
}
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = ({
  createElement: createElement,
  Fragment: Fragment
});

/***/ }),

/***/ "./src/util/arePropsShallowEqual.ts":
/*!******************************************!*\
  !*** ./src/util/arePropsShallowEqual.ts ***!
  \******************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ arePropsShallowEqual),
/* harmony export */   "getUnequalProps": () => (/* binding */ getUnequalProps)
/* harmony export */ });
function arePropsShallowEqual(currentProps, newProps) {
  if (currentProps === newProps) {
    return true;
  }

  var currentKeys = Object.keys(currentProps);
  var currentKeysLength = currentKeys.length;
  var newKeysLength = Object.keys(newProps).length;

  if (currentKeysLength !== newKeysLength) {
    return false;
  }

  if (currentKeysLength === 0) {
    return true;
  }

  for (var i = 0; i < currentKeysLength; i++) {
    var prop = currentKeys[i];

    if (currentProps[prop] !== newProps[prop]) {
      return false;
    }
  }

  return true;
}
function getUnequalProps(currentProps, newProps) {
  var currentKeys = Object.keys(currentProps);
  var currentKeysLength = currentKeys.length;
  var newKeysLength = Object.keys(newProps).length;

  if (currentKeysLength !== newKeysLength) {
    return ['%LENGTH%'];
  }

  return currentKeys.reduce(function (res, prop) {
    if (currentProps[prop] !== newProps[prop]) {
      res.push("".concat(prop, ": ").concat(currentProps[prop], " => ").concat(newProps[prop]));
    }

    return res;
  }, []);
}

/***/ }),

/***/ "./src/util/generateIdFor.ts":
/*!***********************************!*\
  !*** ./src/util/generateIdFor.ts ***!
  \***********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (function (store) {
  var id;

  do {
    id = String(Math.random()).replace('0.', 'id');
  } while (store.hasOwnProperty(id));

  return id;
});

/***/ }),

/***/ "./src/util/handleError.ts":
/*!*********************************!*\
  !*** ./src/util/handleError.ts ***!
  \*********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "handleError": () => (/* binding */ handleError)
/* harmony export */ });
window.addEventListener('error', handleErrorEvent);
window.addEventListener('unhandledrejection', handleErrorEvent);

function handleErrorEvent(e) {
  e.preventDefault();
  handleError(e instanceof ErrorEvent ? e.error : e.reason);
}

function handleError(err) {
  // eslint-disable-next-line no-console
  console.error(err);
}

/***/ }),

/***/ "./src/util/iteratees.ts":
/*!*******************************!*\
  !*** ./src/util/iteratees.ts ***!
  \*******************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "orderBy": () => (/* binding */ orderBy),
/* harmony export */   "unique": () => (/* binding */ unique)
/* harmony export */ });
function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function _iterableToArrayLimit(arr, i) { var _i = arr == null ? null : typeof Symbol !== "undefined" && arr[Symbol.iterator] || arr["@@iterator"]; if (_i == null) return; var _arr = []; var _n = true; var _d = false; var _s, _e; try { for (_i = _i.call(arr); !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

function orderBy(collection, orderRule) {
  var mode = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 'asc';

  function compareValues(a, b, currentOrderRule, isAsc) {
    var aValue = (typeof currentOrderRule === 'function' ? currentOrderRule(a) : a[currentOrderRule]) || 0;
    var bValue = (typeof currentOrderRule === 'function' ? currentOrderRule(b) : b[currentOrderRule]) || 0;
    return isAsc ? aValue - bValue : bValue - aValue;
  }

  if (Array.isArray(orderRule)) {
    var _ref = Array.isArray(mode) ? mode : [mode, mode],
        _ref2 = _slicedToArray(_ref, 2),
        mode1 = _ref2[0],
        mode2 = _ref2[1];

    var _orderRule = _slicedToArray(orderRule, 2),
        orderRule1 = _orderRule[0],
        orderRule2 = _orderRule[1];

    var isAsc1 = mode1 === 'asc';
    var isAsc2 = mode2 === 'asc';
    return collection.sort(function (a, b) {
      return compareValues(a, b, orderRule1, isAsc1) || compareValues(a, b, orderRule2, isAsc2);
    });
  }

  var isAsc = mode === 'asc';
  return collection.sort(function (a, b) {
    return compareValues(a, b, orderRule, isAsc);
  });
}
function unique(array) {
  return Array.from(new Set(array));
}

/***/ }),

/***/ "./src/util/schedulers.ts":
/*!********************************!*\
  !*** ./src/util/schedulers.ts ***!
  \********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "fastRaf": () => (/* binding */ fastRaf),
/* harmony export */   "fastRafPrimary": () => (/* binding */ fastRafPrimary),
/* harmony export */   "onBeforeUnload": () => (/* binding */ onBeforeUnload),
/* harmony export */   "onTickEnd": () => (/* binding */ onTickEnd),
/* harmony export */   "onTickEndPrimary": () => (/* binding */ onTickEndPrimary),
/* harmony export */   "throttleWith": () => (/* binding */ throttleWith),
/* harmony export */   "throttleWithPrimaryRaf": () => (/* binding */ throttleWithPrimaryRaf),
/* harmony export */   "throttleWithRaf": () => (/* binding */ throttleWithRaf),
/* harmony export */   "throttleWithTickEnd": () => (/* binding */ throttleWithTickEnd)
/* harmony export */ });
function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _iterableToArray(iter) { if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null) return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) return _arrayLikeToArray(arr); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function throttleWithRaf(fn) {
  return throttleWith(fastRaf, fn);
}
function throttleWithPrimaryRaf(fn) {
  return throttleWith(fastRafPrimary, fn);
}
function throttleWithTickEnd(fn) {
  return throttleWith(onTickEnd, fn);
}
function throttleWith(schedulerFn, fn) {
  var waiting = false;
  var args;
  return function () {
    for (var _len = arguments.length, _args = new Array(_len), _key = 0; _key < _len; _key++) {
      _args[_key] = arguments[_key];
    }

    args = _args;

    if (!waiting) {
      waiting = true;
      schedulerFn(function () {
        waiting = false;
        fn.apply(void 0, _toConsumableArray(args));
      });
    }
  };
}
var fastRafCallbacks;
var fastRafPrimaryCallbacks; // May result in an immediate execution if called from another `requestAnimationFrame` callback

function fastRaf(callback) {
  var isPrimary = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

  if (!fastRafCallbacks) {
    fastRafCallbacks = isPrimary ? [] : [callback];
    fastRafPrimaryCallbacks = isPrimary ? [callback] : [];
    requestAnimationFrame(function () {
      var currentCallbacks = fastRafCallbacks;
      var currentPrimaryCallbacks = fastRafPrimaryCallbacks;
      fastRafCallbacks = undefined;
      fastRafPrimaryCallbacks = undefined;
      currentPrimaryCallbacks.forEach(function (cb) {
        return cb();
      });
      currentCallbacks.forEach(function (cb) {
        return cb();
      });
    });
  } else if (isPrimary) {
    fastRafPrimaryCallbacks.push(callback);
  } else {
    fastRafCallbacks.push(callback);
  }
}
function fastRafPrimary(callback) {
  fastRaf(callback, true);
}
var onTickEndCallbacks;
var onTickEndPrimaryCallbacks;
function onTickEnd(callback) {
  var isPrimary = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

  if (!onTickEndCallbacks) {
    onTickEndCallbacks = isPrimary ? [] : [callback];
    onTickEndPrimaryCallbacks = isPrimary ? [callback] : [];
    Promise.resolve().then(function () {
      var currentCallbacks = onTickEndCallbacks;
      var currentPrimaryCallbacks = onTickEndPrimaryCallbacks;
      onTickEndCallbacks = undefined;
      onTickEndPrimaryCallbacks = undefined;
      currentPrimaryCallbacks.forEach(function (cb) {
        return cb();
      });
      currentCallbacks.forEach(function (cb) {
        return cb();
      });
    });
  } else if (isPrimary) {
    onTickEndPrimaryCallbacks.push(callback);
  } else {
    onTickEndCallbacks.push(callback);
  }
}
function onTickEndPrimary(callback) {
  onTickEnd(callback, true);
}
var beforeUnloadCallbacks;
function onBeforeUnload(callback) {
  var isLast = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

  if (!beforeUnloadCallbacks) {
    beforeUnloadCallbacks = []; // eslint-disable-next-line no-restricted-globals

    self.addEventListener('beforeunload', function () {
      beforeUnloadCallbacks.forEach(function (cb) {
        return cb();
      });
    });
  }

  if (isLast) {
    beforeUnloadCallbacks.push(callback);
  } else {
    beforeUnloadCallbacks.unshift(callback);
  }

  return function () {
    beforeUnloadCallbacks = beforeUnloadCallbacks.filter(function (cb) {
      return cb !== callback;
    });
  };
}

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be isolated against other modules in the chunk.
(() => {
/*!************************!*\
  !*** ./demo/index.tsx ***!
  \************************/
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _src_teact_teact__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../src/teact/teact */ "./src/teact/teact.ts");
/* harmony import */ var _src_teact_teact_dom__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../src/teact/teact-dom */ "./src/teact/teact-dom.ts");
function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function _iterableToArrayLimit(arr, i) { var _i = arr == null ? null : typeof Symbol !== "undefined" && arr[Symbol.iterator] || arr["@@iterator"]; if (_i == null) return; var _arr = []; var _n = true; var _d = false; var _s, _e; try { for (_i = _i.call(arr); !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }



_src_teact_teact_dom__WEBPACK_IMPORTED_MODULE_1__["default"].render( /*#__PURE__*/_src_teact_teact__WEBPACK_IMPORTED_MODULE_0__["default"].createElement(App, null), document.getElementById('root'));

function App() {
  return /*#__PURE__*/_src_teact_teact__WEBPACK_IMPORTED_MODULE_0__["default"].createElement("div", null, /*#__PURE__*/_src_teact_teact__WEBPACK_IMPORTED_MODULE_0__["default"].createElement("h2", null, "Hello Teact!"), /*#__PURE__*/_src_teact_teact__WEBPACK_IMPORTED_MODULE_0__["default"].createElement(Child, null), /*#__PURE__*/_src_teact_teact__WEBPACK_IMPORTED_MODULE_0__["default"].createElement(Checkbox, null));
}

function Child() {
  return /*#__PURE__*/_src_teact_teact__WEBPACK_IMPORTED_MODULE_0__["default"].createElement("div", null, "This is your first component.");
}

function Checkbox() {
  var _useState = (0,_src_teact_teact__WEBPACK_IMPORTED_MODULE_0__.useState)(true),
      _useState2 = _slicedToArray(_useState, 2),
      isChecked = _useState2[0],
      setIsChecked = _useState2[1];

  function handleCheck() {
    setIsChecked(function (current) {
      return !current;
    });
  }

  return /*#__PURE__*/_src_teact_teact__WEBPACK_IMPORTED_MODULE_0__["default"].createElement("label", null, /*#__PURE__*/_src_teact_teact__WEBPACK_IMPORTED_MODULE_0__["default"].createElement("input", {
    type: "checkbox",
    checked: isChecked,
    onChange: handleCheck
  }), "This is a controlled form element.");
}
})();

/******/ })()
;
//# sourceMappingURL=main.16c32c1ba43ea117e20c.js.map