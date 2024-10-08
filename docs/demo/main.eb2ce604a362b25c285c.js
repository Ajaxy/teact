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
/* harmony export */   DEBUG: () => (/* binding */ DEBUG),
/* harmony export */   DEBUG_MORE: () => (/* binding */ DEBUG_MORE)
/* harmony export */ });
var DEBUG = false;
var DEBUG_MORE = false;

/***/ }),

/***/ "./src/lib/fasterdom/fasterdom.ts":
/*!****************************************!*\
  !*** ./src/lib/fasterdom/fasterdom.ts ***!
  \****************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   disableStrict: () => (/* reexport safe */ _stricterdom__WEBPACK_IMPORTED_MODULE_2__.disableStrict),
/* harmony export */   enableStrict: () => (/* reexport safe */ _stricterdom__WEBPACK_IMPORTED_MODULE_2__.enableStrict),
/* harmony export */   forceMeasure: () => (/* reexport safe */ _stricterdom__WEBPACK_IMPORTED_MODULE_2__.forceMeasure),
/* harmony export */   getPhase: () => (/* reexport safe */ _stricterdom__WEBPACK_IMPORTED_MODULE_2__.getPhase),
/* harmony export */   requestForcedReflow: () => (/* binding */ requestForcedReflow),
/* harmony export */   requestMeasure: () => (/* binding */ requestMeasure),
/* harmony export */   requestMutation: () => (/* binding */ requestMutation),
/* harmony export */   requestNextMutation: () => (/* binding */ requestNextMutation),
/* harmony export */   setHandler: () => (/* reexport safe */ _stricterdom__WEBPACK_IMPORTED_MODULE_2__.setHandler),
/* harmony export */   setPhase: () => (/* reexport safe */ _stricterdom__WEBPACK_IMPORTED_MODULE_2__.setPhase)
/* harmony export */ });
/* harmony import */ var _util_schedulers__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../util/schedulers */ "./src/util/schedulers.ts");
/* harmony import */ var _util_safeExec__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../util/safeExec */ "./src/util/safeExec.ts");
/* harmony import */ var _stricterdom__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./stricterdom */ "./src/lib/fasterdom/stricterdom.ts");
function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }




var pendingMeasureTasks = [];
var pendingMutationTasks = [];
var pendingForceReflowTasks = [];
var runUpdatePassOnRaf = throttleWithRafFallback(function () {
  var currentMeasureTasks = pendingMeasureTasks;
  pendingMeasureTasks = [];
  currentMeasureTasks.forEach(function (task) {
    (0,_util_safeExec__WEBPACK_IMPORTED_MODULE_1__["default"])(task);
  }); // We use promises to provide correct order for Mutation Observer callback microtasks

  Promise.resolve().then(function () {
    (0,_stricterdom__WEBPACK_IMPORTED_MODULE_2__.setPhase)('mutate');
    var currentMutationTasks = pendingMutationTasks;
    pendingMutationTasks = [];
    currentMutationTasks.forEach(function (task) {
      (0,_util_safeExec__WEBPACK_IMPORTED_MODULE_1__["default"])(task);
    });
  }).then(function () {
    (0,_stricterdom__WEBPACK_IMPORTED_MODULE_2__.setPhase)('measure');
    var pendingForceReflowMutationTasks = []; // Will include tasks created during the loop

    var _iterator = _createForOfIteratorHelper(pendingForceReflowTasks),
        _step;

    try {
      var _loop = function _loop() {
        var task = _step.value;
        (0,_util_safeExec__WEBPACK_IMPORTED_MODULE_1__["default"])(function () {
          var mutationTask = task();

          if (mutationTask) {
            pendingForceReflowMutationTasks.push(mutationTask);
          }
        });
      };

      for (_iterator.s(); !(_step = _iterator.n()).done;) {
        _loop();
      }
    } catch (err) {
      _iterator.e(err);
    } finally {
      _iterator.f();
    }

    pendingForceReflowTasks = [];
    return pendingForceReflowMutationTasks;
  }).then(function (pendingForceReflowMutationTasks) {
    (0,_stricterdom__WEBPACK_IMPORTED_MODULE_2__.setPhase)('mutate'); // Will include tasks created during the loop

    var _iterator2 = _createForOfIteratorHelper(pendingForceReflowMutationTasks),
        _step2;

    try {
      for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
        var task = _step2.value;
        (0,_util_safeExec__WEBPACK_IMPORTED_MODULE_1__["default"])(task);
      }
    } catch (err) {
      _iterator2.e(err);
    } finally {
      _iterator2.f();
    }
  }).then(function () {
    (0,_stricterdom__WEBPACK_IMPORTED_MODULE_2__.setPhase)('measure');
  });
});
function requestMeasure(cb) {
  pendingMeasureTasks.push(cb);
  runUpdatePassOnRaf();
}
function requestMutation(cb) {
  pendingMutationTasks.push(cb);
  runUpdatePassOnRaf();
}
function requestNextMutation(cb) {
  requestMeasure(function () {
    requestMutation(cb);
  });
}
function requestForcedReflow(cb) {
  pendingForceReflowTasks.push(cb);
  runUpdatePassOnRaf();
}

function throttleWithRafFallback(fn) {
  return (0,_util_schedulers__WEBPACK_IMPORTED_MODULE_0__.throttleWith)(function (throttledFn) {
    (0,_util_schedulers__WEBPACK_IMPORTED_MODULE_0__.fastRaf)(throttledFn, true);
  }, fn);
}



/***/ }),

/***/ "./src/lib/fasterdom/layoutCauses.ts":
/*!*******************************************!*\
  !*** ./src/lib/fasterdom/layoutCauses.ts ***!
  \*******************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
// https://gist.github.com/paulirish/5d52fb081b3570c81e3a
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = ({
  Element: {
    props: ['clientLeft', 'clientTop', 'clientWidth', 'clientHeight', 'scrollWidth', 'scrollHeight', 'scrollLeft', 'scrollTop'],
    methods: ['getClientRects', 'getBoundingClientRect', 'scrollBy', 'scrollTo', 'scrollIntoView', 'scrollIntoViewIfNeeded']
  },
  HTMLElement: {
    props: ['offsetLeft', 'offsetTop', 'offsetWidth', 'offsetHeight', 'offsetParent', 'innerText'],
    methods: ['focus']
  },
  window: {
    props: ['scrollX', 'scrollY', 'innerHeight', 'innerWidth'],
    methods: ['getComputedStyle']
  },
  VisualViewport: {
    props: ['height', 'width', 'offsetTop', 'offsetLeft']
  },
  Document: {
    props: ['scrollingElement'],
    methods: ['elementFromPoint']
  },
  HTMLInputElement: {
    methods: ['select']
  },
  MouseEvent: {
    props: ['layerX', 'layerY', 'offsetX', 'offsetY']
  },
  Range: {
    methods: ['getClientRects', 'getBoundingClientRect']
  }
});

/***/ }),

/***/ "./src/lib/fasterdom/stricterdom.ts":
/*!******************************************!*\
  !*** ./src/lib/fasterdom/stricterdom.ts ***!
  \******************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   disableStrict: () => (/* binding */ disableStrict),
/* harmony export */   enableStrict: () => (/* binding */ enableStrict),
/* harmony export */   forceMeasure: () => (/* binding */ forceMeasure),
/* harmony export */   getPhase: () => (/* binding */ getPhase),
/* harmony export */   setHandler: () => (/* binding */ setHandler),
/* harmony export */   setPhase: () => (/* binding */ setPhase)
/* harmony export */ });
/* harmony import */ var _layoutCauses__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./layoutCauses */ "./src/lib/fasterdom/layoutCauses.ts");
function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function _iterableToArrayLimit(arr, i) { var _i = arr == null ? null : typeof Symbol !== "undefined" && arr[Symbol.iterator] || arr["@@iterator"]; if (_i == null) return; var _arr = []; var _n = true; var _d = false; var _s, _e; try { for (_i = _i.call(arr); !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }


// eslint-disable-next-line no-console
var DEFAULT_ERROR_HANDLER = console.error;
var onError = DEFAULT_ERROR_HANDLER;
var nativeMethods = new Map();
var phase = 'measure';
var isStrict = false;
var observer;
function setPhase(newPhase) {
  phase = newPhase;
}
function getPhase() {
  return phase;
}
function enableStrict() {
  if (isStrict) return;
  isStrict = true;
  setupLayoutDetectors();
  setupMutationObserver();
}
function disableStrict() {
  if (!isStrict) return;
  clearMutationObserver();
  clearLayoutDetectors();
  isStrict = false;
}
function forceMeasure(cb) {
  if (phase !== 'mutate') {
    throw new Error('The current phase is \'measure\'');
  }

  phase = 'measure';
  var result = cb();
  phase = 'mutate';
  return result;
}
function setHandler(handler) {
  onError = handler || DEFAULT_ERROR_HANDLER;
}

function setupLayoutDetectors() {
  Object.entries(_layoutCauses__WEBPACK_IMPORTED_MODULE_0__["default"]).forEach(function (_ref) {
    var _ref2 = _slicedToArray(_ref, 2),
        name = _ref2[0],
        causes = _ref2[1];

    var entity = window[name];
    if (!entity) return;
    var prototype = _typeof(entity) === 'object' ? entity : entity.prototype;

    if ('props' in causes) {
      causes.props.forEach(function (prop) {
        var _Object$getOwnPropert;

        var nativeGetter = (_Object$getOwnPropert = Object.getOwnPropertyDescriptor(prototype, prop)) === null || _Object$getOwnPropert === void 0 ? void 0 : _Object$getOwnPropert.get;

        if (!nativeGetter) {
          return;
        }

        nativeMethods.set("".concat(name, "#").concat(prop), nativeGetter);
        Object.defineProperty(prototype, prop, {
          get: function get() {
            onMeasure(prop);
            return nativeGetter.call(this);
          }
        });
      });
    }

    if ('methods' in causes) {
      causes.methods.forEach(function (method) {
        var nativeMethod = prototype[method];
        nativeMethods.set("".concat(name, "#").concat(method), nativeMethod); // eslint-disable-next-line func-names

        prototype[method] = function () {
          onMeasure(method);

          for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
            args[_key] = arguments[_key];
          }

          return nativeMethod.apply(this, args);
        };
      });
    }
  });
}

function clearLayoutDetectors() {
  Object.entries(_layoutCauses__WEBPACK_IMPORTED_MODULE_0__["default"]).forEach(function (_ref3) {
    var _ref4 = _slicedToArray(_ref3, 2),
        name = _ref4[0],
        causes = _ref4[1];

    var entity = window[name];
    if (!entity) return;
    var prototype = _typeof(entity) === 'object' ? entity : entity.prototype;

    if ('props' in causes) {
      causes.props.forEach(function (prop) {
        var nativeGetter = nativeMethods.get("".concat(name, "#").concat(prop));

        if (!nativeGetter) {
          return;
        }

        Object.defineProperty(prototype, prop, {
          get: nativeGetter
        });
      });
    }

    if ('methods' in causes) {
      causes.methods.forEach(function (method) {
        prototype[method] = nativeMethods.get("".concat(name, "#").concat(method));
      });
    }
  });
  nativeMethods.clear();
}

function setupMutationObserver() {
  observer = new MutationObserver(function (mutations) {
    if (phase !== 'mutate') {
      mutations.forEach(function (_ref5) {
        var target = _ref5.target,
            type = _ref5.type,
            attributeName = _ref5.attributeName;

        if (!document.contains(target)) {
          return;
        }

        if (type === 'childList' && target instanceof HTMLElement && target.contentEditable) {
          return;
        }

        if (attributeName !== null && attributeName !== void 0 && attributeName.startsWith('data-')) {
          return;
        } // eslint-disable-next-line no-console


        onError(new Error("Unexpected mutation detected: `".concat(type === 'attributes' ? attributeName : type, "`")));
      });
    }
  });
  observer.observe(document.body, {
    childList: true,
    attributes: true,
    subtree: true,
    characterData: false
  });
}

function clearMutationObserver() {
  var _observer;

  (_observer = observer) === null || _observer === void 0 ? void 0 : _observer.disconnect();
  observer = undefined;
}

function onMeasure(propName) {
  if (phase !== 'measure') {
    onError(new Error("Unexpected measurement detected: `".concat(propName, "`")));
  }
}

/***/ }),

/***/ "./src/teact/dom-events.ts":
/*!*********************************!*\
  !*** ./src/teact/dom-events.ts ***!
  \*********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   addEventListener: () => (/* binding */ addEventListener),
/* harmony export */   removeAllDelegatedListeners: () => (/* binding */ removeAllDelegatedListeners),
/* harmony export */   removeEventListener: () => (/* binding */ removeEventListener)
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
/* harmony export */   addExtraClass: () => (/* binding */ addExtraClass),
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__),
/* harmony export */   removeExtraClass: () => (/* binding */ removeExtraClass),
/* harmony export */   setExtraStyles: () => (/* binding */ setExtraStyles),
/* harmony export */   toggleExtraClass: () => (/* binding */ toggleExtraClass)
/* harmony export */ });
/* harmony import */ var _config__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../config */ "./src/config.ts");
/* harmony import */ var _util_iteratees__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../util/iteratees */ "./src/util/iteratees.ts");
/* harmony import */ var _dom_events__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./dom-events */ "./src/teact/dom-events.ts");
/* harmony import */ var _teact__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./teact */ "./src/teact/teact.ts");
function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _iterableToArrayLimit(arr, i) { var _i = arr == null ? null : typeof Symbol !== "undefined" && arr[Symbol.iterator] || arr["@@iterator"]; if (_i == null) return; var _arr = []; var _n = true; var _d = false; var _s, _e; try { for (_i = _i.call(arr); !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }

function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e2) { throw _e2; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e3) { didErr = true; err = _e3; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }





var FILTERED_ATTRIBUTES = new Set(['key', 'ref', 'teactFastList', 'teactOrderKey']);
var HTML_ATTRIBUTES = new Set(['dir', 'role', 'form']);
var CONTROLLABLE_TAGS = ['INPUT', 'TEXTAREA', 'SELECT'];
var MAPPED_ATTRIBUTES = {
  autoPlay: 'autoplay',
  autoComplete: 'autocomplete'
};
var INDEX_KEY_PREFIX = '__indexKey#';
var headsByElement = new WeakMap();
var extraClasses = new WeakMap();
var extraStyles = new WeakMap();

function render($element, parentEl) {
  if (!headsByElement.has(parentEl)) {
    headsByElement.set(parentEl, {
      children: []
    });
  }

  var runImmediateEffects = (0,_teact__WEBPACK_IMPORTED_MODULE_3__.captureImmediateEffects)();
  var $head = headsByElement.get(parentEl);
  var $renderedChild = renderWithVirtual(parentEl, $head.children[0], $element, $head, {}, 0);
  runImmediateEffects === null || runImmediateEffects === void 0 ? void 0 : runImmediateEffects();
  $head.children = $renderedChild ? [$renderedChild] : [];
  return undefined;
}

function renderWithVirtual(parentEl, $current, $new, $parent, currentContext, index) {
  var _$new, _$new2, _$new3;

  var options = arguments.length > 6 && arguments[6] !== undefined ? arguments[6] : {};
  var skipComponentUpdate = options.skipComponentUpdate,
      fragment = options.fragment;
  var nextSibling = options.nextSibling,
      isSvg = options.isSvg;
  var isCurrentComponent = ($current === null || $current === void 0 ? void 0 : $current.type) === _teact__WEBPACK_IMPORTED_MODULE_3__.VirtualType.Component;
  var isNewComponent = ((_$new = $new) === null || _$new === void 0 ? void 0 : _$new.type) === _teact__WEBPACK_IMPORTED_MODULE_3__.VirtualType.Component;
  var $newAsReal = $new;
  var isCurrentFragment = !isCurrentComponent && ($current === null || $current === void 0 ? void 0 : $current.type) === _teact__WEBPACK_IMPORTED_MODULE_3__.VirtualType.Fragment;
  var isNewFragment = !isNewComponent && ((_$new2 = $new) === null || _$new2 === void 0 ? void 0 : _$new2.type) === _teact__WEBPACK_IMPORTED_MODULE_3__.VirtualType.Fragment;

  if (!isSvg && ((_$new3 = $new) === null || _$new3 === void 0 ? void 0 : _$new3.type) === _teact__WEBPACK_IMPORTED_MODULE_3__.VirtualType.Tag && $new.tag === 'svg') {
    isSvg = true;
  }

  if (!skipComponentUpdate && isCurrentComponent && isNewComponent && !(0,_teact__WEBPACK_IMPORTED_MODULE_3__.hasElementChanged)($current, $new)) {
    $new = updateComponent($current, $new);
  } // Parent element may have changed, so we need to update the listener closure.


  if (!skipComponentUpdate && isNewComponent && $new.componentInstance.mountState === _teact__WEBPACK_IMPORTED_MODULE_3__.MountState.Mounted) {
    setupComponentUpdateListener(parentEl, $new, $parent, currentContext, index);
  }

  if ($current === $new) {
    return $new;
  }

  if (_config__WEBPACK_IMPORTED_MODULE_0__.DEBUG && $new) {
    var newTarget = 'target' in $new && $new.target;

    if (newTarget && (!$current || 'target' in $current && newTarget !== $current.target)) {
      throw new Error('[Teact] Cached virtual element was moved within tree');
    }
  }

  if (!$current && $new) {
    if (isNewComponent || isNewFragment) {
      if (isNewComponent) {
        var _componentInstance$co;

        $new = initComponent(parentEl, $new, $parent, currentContext, index);
        currentContext = (_componentInstance$co = $new.componentInstance.context) !== null && _componentInstance$co !== void 0 ? _componentInstance$co : currentContext;
      }

      mountChildren(parentEl, $new, currentContext, {
        nextSibling: nextSibling,
        fragment: fragment,
        isSvg: isSvg
      });
    } else {
      var canSetTextContent = !fragment && !nextSibling && $newAsReal.type === _teact__WEBPACK_IMPORTED_MODULE_3__.VirtualType.Text && $parent.children.length === 1 && !parentEl.firstChild;

      if (canSetTextContent) {
        parentEl.textContent = $newAsReal.value;
        $newAsReal.target = parentEl.firstChild;
      } else {
        var node = createNode($newAsReal, currentContext, isSvg);
        $newAsReal.target = node;
        insertBefore(fragment || parentEl, node, nextSibling);

        if ($newAsReal.type === _teact__WEBPACK_IMPORTED_MODULE_3__.VirtualType.Tag) {
          setElementRef($newAsReal, node);
        }
      }
    }
  } else if ($current && !$new) {
    remount(parentEl, $current, currentContext, undefined);
  } else if ($current && $new) {
    if ((0,_teact__WEBPACK_IMPORTED_MODULE_3__.hasElementChanged)($current, $new)) {
      if (!nextSibling) {
        nextSibling = getNextSibling($current);
      }

      if (isNewComponent || isNewFragment) {
        if (isNewComponent) {
          var _componentInstance$co2;

          $new = initComponent(parentEl, $new, $parent, currentContext, index);
          currentContext = (_componentInstance$co2 = $new.componentInstance.context) !== null && _componentInstance$co2 !== void 0 ? _componentInstance$co2 : currentContext;
        }

        remount(parentEl, $current, currentContext, undefined);
        mountChildren(parentEl, $new, currentContext, {
          nextSibling: nextSibling,
          fragment: fragment,
          isSvg: isSvg
        });
      } else {
        var _node = createNode($newAsReal, currentContext, isSvg);

        $newAsReal.target = _node;
        remount(parentEl, $current, currentContext, _node, nextSibling);

        if ($newAsReal.type === _teact__WEBPACK_IMPORTED_MODULE_3__.VirtualType.Tag) {
          setElementRef($newAsReal, _node);
        }
      }
    } else {
      var isComponent = isCurrentComponent && isNewComponent;
      var isFragment = isCurrentFragment && isNewFragment;

      if (isComponent || isFragment) {
        renderChildren($current, $new, currentContext, parentEl, nextSibling, options.forceMoveToEnd);
      } else {
        var $currentAsReal = $current;
        var currentTarget = $currentAsReal.target;
        $newAsReal.target = currentTarget;
        $currentAsReal.target = undefined; // Help GC

        var isTag = $current.type === _teact__WEBPACK_IMPORTED_MODULE_3__.VirtualType.Tag;

        if (isTag) {
          var $newAsTag = $new;
          setElementRef($current, undefined);
          setElementRef($newAsTag, currentTarget);

          if (nextSibling || options.forceMoveToEnd) {
            insertBefore(parentEl, currentTarget, nextSibling);
          }

          updateAttributes($current, $newAsTag, currentTarget, isSvg);
          renderChildren($current, $newAsTag, currentContext, currentTarget, undefined, undefined, isSvg);
        }
      }
    }
  }

  return $new;
}

function initComponent(parentEl, $element, $parent, currentContext, index) {
  var _$element = $element,
      componentInstance = _$element.componentInstance;
  $element.componentInstance.context = currentContext;

  if (componentInstance.mountState === _teact__WEBPACK_IMPORTED_MODULE_3__.MountState.New) {
    $element = (0,_teact__WEBPACK_IMPORTED_MODULE_3__.mountComponent)(componentInstance);
    setupComponentUpdateListener(parentEl, $element, $parent, currentContext, index);
  }

  return $element;
}

function updateComponent($current, $new) {
  $current.componentInstance.props = $new.componentInstance.props;
  return (0,_teact__WEBPACK_IMPORTED_MODULE_3__.renderComponent)($current.componentInstance);
}

function setupComponentUpdateListener(parentEl, $element, $parent, currentContext, index) {
  var componentInstance = $element.componentInstance;

  componentInstance.onUpdate = function () {
    $parent.children[index] = renderWithVirtual(parentEl, $parent.children[index], componentInstance.$element, $parent, currentContext, index, {
      skipComponentUpdate: true
    });
  };
}

function mountChildren(parentEl, $element, currentContext, options) {
  var children = $element.children;

  for (var i = 0, l = children.length; i < l; i++) {
    var $child = children[i];
    var $renderedChild = renderWithVirtual(parentEl, undefined, $child, $element, currentContext, i, options);

    if ($renderedChild !== $child) {
      children[i] = $renderedChild;
    }
  }
}

function unmountChildren(parentEl, $element, currentContext) {
  var _iterator = _createForOfIteratorHelper($element.children),
      _step;

  try {
    for (_iterator.s(); !(_step = _iterator.n()).done;) {
      var $child = _step.value;
      renderWithVirtual(parentEl, $child, undefined, $element, currentContext, -1);
    }
  } catch (err) {
    _iterator.e(err);
  } finally {
    _iterator.f();
  }
}

function createNode($element, currentContext, isSvg) {
  if ($element.type === _teact__WEBPACK_IMPORTED_MODULE_3__.VirtualType.Empty) {
    return document.createTextNode('');
  }

  if ($element.type === _teact__WEBPACK_IMPORTED_MODULE_3__.VirtualType.Text) {
    return document.createTextNode($element.value);
  }

  var tag = $element.tag,
      props = $element.props,
      children = $element.children;
  var element = isSvg ? document.createElementNS('http://www.w3.org/2000/svg', tag) : document.createElement(tag);
  processControlled(tag, props); // eslint-disable-next-line no-restricted-syntax

  for (var key in props) {
    if (!props.hasOwnProperty(key)) continue;

    if (props[key] !== undefined) {
      setAttribute(element, key, props[key], isSvg);
    }
  }

  processUncontrolledOnMount(element, props);

  for (var i = 0, l = children.length; i < l; i++) {
    var $child = children[i];
    var $renderedChild = renderWithVirtual(element, undefined, $child, $element, currentContext, i, {
      isSvg: isSvg
    });

    if ($renderedChild !== $child) {
      children[i] = $renderedChild;
    }
  }

  return element;
}

function remount(parentEl, $current, currentContext, node, componentNextSibling) {
  var isComponent = $current.type === _teact__WEBPACK_IMPORTED_MODULE_3__.VirtualType.Component;
  var isFragment = !isComponent && $current.type === _teact__WEBPACK_IMPORTED_MODULE_3__.VirtualType.Fragment;

  if (isComponent || isFragment) {
    if (isComponent) {
      (0,_teact__WEBPACK_IMPORTED_MODULE_3__.unmountComponent)($current.componentInstance);
    }

    unmountChildren(parentEl, $current, currentContext);

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
  if ($element.type === _teact__WEBPACK_IMPORTED_MODULE_3__.VirtualType.Component) {
    (0,_teact__WEBPACK_IMPORTED_MODULE_3__.unmountComponent)($element.componentInstance);
  } else if ($element.type !== _teact__WEBPACK_IMPORTED_MODULE_3__.VirtualType.Fragment) {
    if ($element.type === _teact__WEBPACK_IMPORTED_MODULE_3__.VirtualType.Tag) {
      extraClasses["delete"]($element.target);
      setElementRef($element, undefined);
      (0,_dom_events__WEBPACK_IMPORTED_MODULE_2__.removeAllDelegatedListeners)($element.target);
    }

    $element.target = undefined; // Help GC

    if ($element.type !== _teact__WEBPACK_IMPORTED_MODULE_3__.VirtualType.Tag) {
      return;
    }
  }

  var _iterator2 = _createForOfIteratorHelper($element.children),
      _step2;

  try {
    for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
      var $child = _step2.value;
      unmountRealTree($child);
    }
  } catch (err) {
    _iterator2.e(err);
  } finally {
    _iterator2.f();
  }
}

function insertBefore(parentEl, node, nextSibling) {
  if (nextSibling) {
    parentEl.insertBefore(node, nextSibling);
  } else {
    parentEl.appendChild(node);
  }
}

function getNextSibling($current) {
  if ($current.type === _teact__WEBPACK_IMPORTED_MODULE_3__.VirtualType.Component || $current.type === _teact__WEBPACK_IMPORTED_MODULE_3__.VirtualType.Fragment) {
    var lastChild = $current.children[$current.children.length - 1];
    return getNextSibling(lastChild);
  }

  return $current.target.nextSibling || undefined;
}

function renderChildren($current, $new, currentContext, currentEl, nextSibling) {
  var forceMoveToEnd = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : false;
  var isSvg = arguments.length > 6 ? arguments[6] : undefined;

  if (_config__WEBPACK_IMPORTED_MODULE_0__.DEBUG) {
    DEBUG_checkKeyUniqueness($new.children);
  }

  if ('props' in $new && $new.props.teactFastList) {
    renderFastListChildren($current, $new, currentContext, currentEl);
    return;
  }

  var currentChildren = $current.children;
  var newChildren = $new.children;
  var currentChildrenLength = currentChildren.length;
  var newChildrenLength = newChildren.length;
  var maxLength = Math.max(currentChildrenLength, newChildrenLength);
  var fragment = newChildrenLength > currentChildrenLength ? document.createDocumentFragment() : undefined;
  var lastCurrentChild = $current.children[currentChildrenLength - 1];
  var fragmentNextSibling = fragment && (nextSibling || (lastCurrentChild ? getNextSibling(lastCurrentChild) : undefined));

  for (var i = 0; i < maxLength; i++) {
    var $renderedChild = renderWithVirtual(currentEl, currentChildren[i], newChildren[i], $new, currentContext, i, i >= currentChildrenLength ? {
      fragment: fragment,
      isSvg: isSvg
    } : {
      nextSibling: nextSibling,
      forceMoveToEnd: forceMoveToEnd,
      isSvg: isSvg
    });

    if ($renderedChild && $renderedChild !== newChildren[i]) {
      newChildren[i] = $renderedChild;
    }
  }

  if (fragment) {
    insertBefore(currentEl, fragment, fragmentNextSibling);
  }
} // This function allows to prepend/append a bunch of new DOM nodes to the top/bottom of preserved ones.
// It also allows to selectively move particular preserved nodes within their DOM list.


function renderFastListChildren($current, $new, currentContext, currentEl) {
  var currentChildren = $current.children;
  var newChildren = $new.children;
  var newKeys = new Set();

  var _iterator3 = _createForOfIteratorHelper(newChildren),
      _step3;

  try {
    for (_iterator3.s(); !(_step3 = _iterator3.n()).done;) {
      var _$newChild2 = _step3.value;

      var _key2 = 'props' in _$newChild2 ? _$newChild2.props.key : undefined;

      if (_config__WEBPACK_IMPORTED_MODULE_0__.DEBUG && (0,_teact__WEBPACK_IMPORTED_MODULE_3__.isParentElement)(_$newChild2)) {
        // eslint-disable-next-line no-null/no-null
        if (_key2 === undefined || _key2 === null) {
          // eslint-disable-next-line no-console
          console.warn('Missing `key` in `teactFastList`');
        }

        if (_$newChild2.type === _teact__WEBPACK_IMPORTED_MODULE_3__.VirtualType.Fragment) {
          throw new Error('[Teact] Fragment can not be child of container with `teactFastList`');
        }
      }

      newKeys.add(_key2);
    } // Build a collection of old children that also remain in the new list

  } catch (err) {
    _iterator3.e(err);
  } finally {
    _iterator3.f();
  }

  var currentRemainingIndex = 0;
  var remainingByKey = {};

  for (var i = 0, l = currentChildren.length; i < l; i++) {
    var $currentChild = currentChildren[i];
    var key = 'props' in $currentChild ? $currentChild.props.key : undefined; // eslint-disable-next-line no-null/no-null

    var isKeyPresent = key !== undefined && key !== null; // First we process removed children

    if (isKeyPresent && !newKeys.has(key)) {
      renderWithVirtual(currentEl, $currentChild, undefined, $new, currentContext, -1);
      continue;
    } else if (!isKeyPresent) {
      var $newChild = newChildren[i];
      var newChildKey = $newChild && 'props' in $newChild ? $newChild.props.key : undefined; // If a non-key element remains at the same index we preserve it with a virtual `key`

      if ($newChild && !newChildKey) {
        key = "".concat(INDEX_KEY_PREFIX).concat(i); // Otherwise, we just remove it
      } else {
        renderWithVirtual(currentEl, $currentChild, undefined, $new, currentContext, -1);
        continue;
      }
    } // Then we build up info about remaining children


    remainingByKey[key] = {
      $element: $currentChild,
      index: currentRemainingIndex++,
      orderKey: 'props' in $currentChild ? $currentChild.props.teactOrderKey : undefined
    };
  }

  var fragmentIndex;
  var fragmentSize;
  var currentPreservedIndex = 0;

  for (var _i = 0, _l = newChildren.length; _i < _l; _i++) {
    var _$newChild = newChildren[_i];

    var _key = 'props' in _$newChild ? _$newChild.props.key : "".concat(INDEX_KEY_PREFIX).concat(_i);

    var currentChildInfo = remainingByKey[_key];

    if (!currentChildInfo) {
      if (fragmentSize === undefined) {
        fragmentIndex = _i;
        fragmentSize = 0;
      }

      fragmentSize++;
      continue;
    } // This prepends new children to the top


    if (fragmentSize) {
      renderFragment(fragmentIndex, fragmentSize, currentEl, $new, currentContext);
      fragmentSize = undefined;
      fragmentIndex = undefined;
    } // Now we check if a preserved node was moved within preserved list


    var newOrderKey = 'props' in _$newChild ? _$newChild.props.teactOrderKey : undefined; // That is indicated by a changed `teactOrderKey` value

    var shouldMoveNode = currentChildInfo.index !== currentPreservedIndex && (!newOrderKey || currentChildInfo.orderKey !== newOrderKey);
    var isMovingDown = shouldMoveNode && currentPreservedIndex > currentChildInfo.index;

    if (!shouldMoveNode || isMovingDown) {
      currentPreservedIndex++;
    }

    var nextSibling = currentEl.childNodes[isMovingDown ? _i + 1 : _i];
    var options = shouldMoveNode ? nextSibling ? {
      nextSibling: nextSibling
    } : {
      forceMoveToEnd: true
    } : undefined;
    var $renderedChild = renderWithVirtual(currentEl, currentChildInfo.$element, _$newChild, $new, currentContext, _i, options);

    if ($renderedChild !== _$newChild) {
      newChildren[_i] = $renderedChild;
    }
  } // This appends new children to the bottom


  if (fragmentSize) {
    renderFragment(fragmentIndex, fragmentSize, currentEl, $new, currentContext);
  }
}

function renderFragment(fragmentIndex, fragmentSize, parentEl, $parent, currentContext) {
  var nextSibling = parentEl.childNodes[fragmentIndex];

  if (fragmentSize === 1) {
    var $child = $parent.children[fragmentIndex];
    var $renderedChild = renderWithVirtual(parentEl, undefined, $child, $parent, currentContext, fragmentIndex, {
      nextSibling: nextSibling
    });

    if ($renderedChild !== $child) {
      $parent.children[fragmentIndex] = $renderedChild;
    }

    return;
  }

  var fragment = document.createDocumentFragment();

  for (var i = fragmentIndex; i < fragmentIndex + fragmentSize; i++) {
    var _$child = $parent.children[i];

    var _$renderedChild = renderWithVirtual(parentEl, undefined, _$child, $parent, currentContext, i, {
      fragment: fragment
    });

    if (_$renderedChild !== _$child) {
      $parent.children[i] = _$renderedChild;
    }
  }

  insertBefore(parentEl, fragment, nextSibling);
}

function setElementRef($element, element) {
  var ref = $element.props.ref;

  if (_typeof(ref) === 'object') {
    ref.current = element;
  } else if (typeof ref === 'function') {
    ref(element);
  }
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

    if (value !== undefined && value !== e.currentTarget.value) {
      var _e$currentTarget = e.currentTarget,
          selectionStart = _e$currentTarget.selectionStart,
          selectionEnd = _e$currentTarget.selectionEnd;
      var isCaretAtEnd = selectionStart === selectionEnd && selectionEnd === e.currentTarget.value.length;
      e.currentTarget.value = value;

      if (typeof selectionStart === 'number' && typeof selectionEnd === 'number') {
        e.currentTarget.setSelectionRange(selectionStart, selectionEnd);
        var selectionState = {
          selectionStart: selectionStart,
          selectionEnd: selectionEnd,
          isCaretAtEnd: isCaretAtEnd
        }; // eslint-disable-next-line no-underscore-dangle

        e.currentTarget.dataset.__teactSelectionState = JSON.stringify(selectionState);
      }
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

function updateAttributes($current, $new, element, isSvg) {
  processControlled(element.tagName, $new.props);
  var currentEntries = Object.entries($current.props);
  var newEntries = Object.entries($new.props);

  for (var _i2 = 0, _currentEntries = currentEntries; _i2 < _currentEntries.length; _i2++) {
    var _currentEntries$_i = _slicedToArray(_currentEntries[_i2], 2),
        key = _currentEntries$_i[0],
        currentValue = _currentEntries$_i[1];

    var newValue = $new.props[key];

    if (currentValue !== undefined && (newValue === undefined || currentValue !== newValue && key.startsWith('on'))) {
      removeAttribute(element, key, currentValue);
    }
  }

  for (var _i3 = 0, _newEntries = newEntries; _i3 < _newEntries.length; _i3++) {
    var _newEntries$_i = _slicedToArray(_newEntries[_i3], 2),
        _key3 = _newEntries$_i[0],
        _newValue = _newEntries$_i[1];

    var _currentValue = $current.props[_key3];

    if (_newValue !== undefined && _newValue !== _currentValue) {
      setAttribute(element, _key3, _newValue, isSvg);
    }
  }
}

function setAttribute(element, key, value, isSvg) {
  if (key === 'className') {
    updateClassName(element, value, isSvg);
  } else if (key === 'value') {
    var inputEl = element;

    if (inputEl.value !== value) {
      inputEl.value = value; // eslint-disable-next-line no-underscore-dangle

      var selectionStateJson = inputEl.dataset.__teactSelectionState;

      if (selectionStateJson) {
        var _ref = JSON.parse(selectionStateJson),
            selectionStart = _ref.selectionStart,
            selectionEnd = _ref.selectionEnd,
            isCaretAtEnd = _ref.isCaretAtEnd;

        if (isCaretAtEnd) {
          var length = inputEl.value.length;
          inputEl.setSelectionRange(length, length);
        } else if (typeof selectionStart === 'number' && typeof selectionEnd === 'number') {
          inputEl.setSelectionRange(selectionStart, selectionEnd);
        }
      }
    }
  } else if (key === 'style') {
    updateStyle(element, value);
  } else if (key === 'dangerouslySetInnerHTML') {
    // eslint-disable-next-line no-underscore-dangle
    element.innerHTML = value.__html;
  } else if (key.startsWith('on')) {
    (0,_dom_events__WEBPACK_IMPORTED_MODULE_2__.addEventListener)(element, key, value, key.endsWith('Capture'));
  } else if (isSvg || key.startsWith('data-') || key.startsWith('aria-') || HTML_ATTRIBUTES.has(key)) {
    element.setAttribute(key, value);
  } else if (!FILTERED_ATTRIBUTES.has(key)) {
    element[MAPPED_ATTRIBUTES[key] || key] = value;
  }
}

function removeAttribute(element, key, value) {
  if (key === 'className') {
    updateClassName(element, '');
  } else if (key === 'value') {
    element.value = '';
  } else if (key === 'style') {
    updateStyle(element, '');
  } else if (key === 'dangerouslySetInnerHTML') {
    element.innerHTML = '';
  } else if (key.startsWith('on')) {
    (0,_dom_events__WEBPACK_IMPORTED_MODULE_2__.removeEventListener)(element, key, value, key.endsWith('Capture'));
  } else if (!FILTERED_ATTRIBUTES.has(key)) {
    element.removeAttribute(key);
  }
}

function updateClassName(element, value, isSvg) {
  if (isSvg) {
    element.setAttribute('class', value);
    return;
  }

  var htmlElement = element;
  var extra = extraClasses.get(element);

  if (!extra) {
    htmlElement.className = value;
    return;
  }

  var extraArray = Array.from(extra);

  if (value) {
    extraArray.push(value);
  }

  htmlElement.className = extraArray.join(' ');
}

function updateStyle(element, value) {
  element.style.cssText = value;
  var extraObject = extraStyles.get(element);

  if (extraObject) {
    applyExtraStyles(element);
  }
}

function addExtraClass(element, className) {
  var forceSingle = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;

  if (!forceSingle) {
    var classNames = className.split(' ');

    if (classNames.length > 1) {
      var _iterator4 = _createForOfIteratorHelper(classNames),
          _step4;

      try {
        for (_iterator4.s(); !(_step4 = _iterator4.n()).done;) {
          var cn = _step4.value;
          addExtraClass(element, cn, true);
        }
      } catch (err) {
        _iterator4.e(err);
      } finally {
        _iterator4.f();
      }

      return;
    }
  }

  element.classList.add(className);
  var classList = extraClasses.get(element);

  if (classList) {
    classList.add(className);
  } else {
    extraClasses.set(element, new Set([className]));
  }
}
function removeExtraClass(element, className) {
  var forceSingle = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;

  if (!forceSingle) {
    var classNames = className.split(' ');

    if (classNames.length > 1) {
      var _iterator5 = _createForOfIteratorHelper(classNames),
          _step5;

      try {
        for (_iterator5.s(); !(_step5 = _iterator5.n()).done;) {
          var cn = _step5.value;
          removeExtraClass(element, cn, true);
        }
      } catch (err) {
        _iterator5.e(err);
      } finally {
        _iterator5.f();
      }

      return;
    }
  }

  element.classList.remove(className);
  var classList = extraClasses.get(element);

  if (classList) {
    classList["delete"](className);

    if (!classList.size) {
      extraClasses["delete"](element);
    }
  }
}
function toggleExtraClass(element, className, force) {
  var forceSingle = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;

  if (!forceSingle) {
    var classNames = className.split(' ');

    if (classNames.length > 1) {
      var _iterator6 = _createForOfIteratorHelper(classNames),
          _step6;

      try {
        for (_iterator6.s(); !(_step6 = _iterator6.n()).done;) {
          var cn = _step6.value;
          toggleExtraClass(element, cn, force, true);
        }
      } catch (err) {
        _iterator6.e(err);
      } finally {
        _iterator6.f();
      }

      return;
    }
  }

  element.classList.toggle(className, force);

  if (element.classList.contains(className)) {
    addExtraClass(element, className);
  } else {
    removeExtraClass(element, className);
  }
}
function setExtraStyles(element, styles) {
  extraStyles.set(element, styles);
  applyExtraStyles(element);
}

function applyExtraStyles(element) {
  var standardStyles = Object.entries(extraStyles.get(element)).reduce(function (acc, _ref2) {
    var _ref3 = _slicedToArray(_ref2, 2),
        prop = _ref3[0],
        value = _ref3[1];

    if (prop.startsWith('--')) {
      element.style.setProperty(prop, value);
    } else {
      acc[prop] = value;
    }

    return acc;
  }, {});
  Object.assign(element.style, standardStyles);
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

    if (keys.length !== (0,_util_iteratees__WEBPACK_IMPORTED_MODULE_1__.unique)(keys).length) {
      // eslint-disable-next-line no-console
      console.warn('[Teact] Duplicated keys:', keys.filter(function (e, i, a) {
        return a.indexOf(e) !== i;
      }), children);
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
/* harmony export */   DEBUG_resolveComponentName: () => (/* binding */ DEBUG_resolveComponentName),
/* harmony export */   MountState: () => (/* binding */ MountState),
/* harmony export */   VirtualType: () => (/* binding */ VirtualType),
/* harmony export */   captureImmediateEffects: () => (/* binding */ captureImmediateEffects),
/* harmony export */   createContext: () => (/* binding */ createContext),
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__),
/* harmony export */   hasElementChanged: () => (/* binding */ hasElementChanged),
/* harmony export */   isParentElement: () => (/* binding */ isParentElement),
/* harmony export */   memo: () => (/* binding */ memo),
/* harmony export */   mountComponent: () => (/* binding */ mountComponent),
/* harmony export */   renderComponent: () => (/* binding */ renderComponent),
/* harmony export */   unmountComponent: () => (/* binding */ unmountComponent),
/* harmony export */   useCallback: () => (/* binding */ useCallback),
/* harmony export */   useContextSignal: () => (/* binding */ useContextSignal),
/* harmony export */   useEffect: () => (/* binding */ useEffect),
/* harmony export */   useLayoutEffect: () => (/* binding */ useLayoutEffect),
/* harmony export */   useMemo: () => (/* binding */ useMemo),
/* harmony export */   useRef: () => (/* binding */ useRef),
/* harmony export */   useSignal: () => (/* binding */ useSignal),
/* harmony export */   useState: () => (/* binding */ useState)
/* harmony export */ });
/* harmony import */ var _config__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../config */ "./src/config.ts");
/* harmony import */ var _util_arePropsShallowEqual__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../util/arePropsShallowEqual */ "./src/util/arePropsShallowEqual.ts");
/* harmony import */ var _util_debugOverlay__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../util/debugOverlay */ "./src/util/debugOverlay.ts");
/* harmony import */ var _util_iteratees__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../util/iteratees */ "./src/util/iteratees.ts");
/* harmony import */ var _util_safeExec__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../util/safeExec */ "./src/util/safeExec.ts");
/* harmony import */ var _util_schedulers__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../util/schedulers */ "./src/util/schedulers.ts");
/* harmony import */ var _util_signals__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ../util/signals */ "./src/util/signals.ts");
/* harmony import */ var _lib_fasterdom_fasterdom__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ../lib/fasterdom/fasterdom */ "./src/lib/fasterdom/fasterdom.ts");
var _excluded = ["avgRenderTime"];

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _iterableToArrayLimit(arr, i) { var _i = arr == null ? null : typeof Symbol !== "undefined" && arr[Symbol.iterator] || arr["@@iterator"]; if (_i == null) return; var _arr = []; var _n = true; var _d = false; var _s, _e; try { for (_i = _i.call(arr); !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e2) { throw _e2; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e3) { didErr = true; err = _e3; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }

function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { _defineProperty(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _objectWithoutProperties(source, excluded) { if (source == null) return {}; var target = _objectWithoutPropertiesLoose(source, excluded); var key, i; if (Object.getOwnPropertySymbols) { var sourceSymbolKeys = Object.getOwnPropertySymbols(source); for (i = 0; i < sourceSymbolKeys.length; i++) { key = sourceSymbolKeys[i]; if (excluded.indexOf(key) >= 0) continue; if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue; target[key] = source[key]; } } return target; }

function _objectWithoutPropertiesLoose(source, excluded) { if (source == null) return {}; var target = {}; var sourceKeys = Object.keys(source); var key, i; for (i = 0; i < sourceKeys.length; i++) { key = sourceKeys[i]; if (excluded.indexOf(key) >= 0) continue; target[key] = source[key]; } return target; }

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _iterableToArray(iter) { if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null) return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) return _arrayLikeToArray(arr); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }









var VirtualType;

(function (VirtualType) {
  VirtualType[VirtualType["Empty"] = 0] = "Empty";
  VirtualType[VirtualType["Text"] = 1] = "Text";
  VirtualType[VirtualType["Tag"] = 2] = "Tag";
  VirtualType[VirtualType["Component"] = 3] = "Component";
  VirtualType[VirtualType["Fragment"] = 4] = "Fragment";
})(VirtualType || (VirtualType = {}));

var MountState;

(function (MountState) {
  MountState[MountState["New"] = 0] = "New";
  MountState[MountState["Mounted"] = 1] = "Mounted";
  MountState[MountState["Unmounted"] = 2] = "Unmounted";
})(MountState || (MountState = {}));

var Fragment = Symbol('Fragment');
var DEBUG_RENDER_THRESHOLD = 7;
var DEBUG_EFFECT_THRESHOLD = 7;
var DEBUG_SILENT_RENDERS_FOR = new Set(['TeactMemoWrapper', 'TeactNContainer', 'Button', 'ListItem', 'MenuItem']);
var contextCounter = 0;
var lastComponentId = 0;
var renderingInstance;
function isParentElement($element) {
  return $element.type === VirtualType.Tag || $element.type === VirtualType.Component || $element.type === VirtualType.Fragment;
}

function createElement(source, props) {
  for (var _len = arguments.length, children = new Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
    children[_key - 2] = arguments[_key];
  }

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
    type: VirtualType.Fragment,
    children: buildChildren(children, true)
  };
}

function createComponentInstance(Component, props, children) {
  if (children !== null && children !== void 0 && children.length) {
    props.children = children.length === 1 ? children[0] : children;
  }

  var componentInstance = {
    id: -1,
    $element: undefined,
    Component: Component,
    name: Component.name,
    props: props,
    mountState: MountState.New
  };
  componentInstance.$element = buildComponentElement(componentInstance);
  return componentInstance.$element;
}

function buildComponentElement(componentInstance, children) {
  return {
    type: VirtualType.Component,
    componentInstance: componentInstance,
    props: componentInstance.props,
    children: children ? buildChildren(children, true) : []
  };
}

function buildTagElement(tag, props, children) {
  return {
    type: VirtualType.Tag,
    tag: tag,
    props: props,
    children: buildChildren(children)
  };
}

function buildChildren(children) {
  var noEmpty = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
  var cleanChildren = dropEmptyTail(children, noEmpty);
  var newChildren = [];

  for (var i = 0, l = cleanChildren.length; i < l; i++) {
    var child = cleanChildren[i];

    if (Array.isArray(child)) {
      newChildren.push.apply(newChildren, _toConsumableArray(buildChildren(child, noEmpty)));
    } else {
      newChildren.push(buildChildElement(child));
    }
  }

  return newChildren;
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
  return !child && child !== 0;
}

function buildChildElement(child) {
  if (isEmptyPlaceholder(child)) {
    return {
      type: VirtualType.Empty
    };
  } else if (isParentElement(child)) {
    return child;
  } else {
    return {
      type: VirtualType.Text,
      value: String(child)
    };
  }
} // eslint-disable-next-line @typescript-eslint/naming-convention


var DEBUG_components = {
  TOTAL: {
    name: 'TOTAL',
    renders: 0
  }
}; // eslint-disable-next-line @typescript-eslint/naming-convention

var DEBUG_memos = {};
var DEBUG_MEMOS_CALLS_THRESHOLD = 20;
document.addEventListener('dblclick', function () {
  // eslint-disable-next-line no-console
  console.warn('COMPONENTS', (0,_util_iteratees__WEBPACK_IMPORTED_MODULE_3__.orderBy)(Object.values(DEBUG_components).map(function (_ref) {
    var avgRenderTime = _ref.avgRenderTime,
        state = _objectWithoutProperties(_ref, _excluded);

    return _objectSpread(_objectSpread({}, state), avgRenderTime !== undefined && {
      avgRenderTime: Number(avgRenderTime.toFixed(2))
    });
  }), 'renders', 'desc')); // eslint-disable-next-line no-console

  console.warn('MEMOS', (0,_util_iteratees__WEBPACK_IMPORTED_MODULE_3__.orderBy)(Object.values(DEBUG_memos).filter(function (_ref2) {
    var calls = _ref2.calls;
    return calls >= DEBUG_MEMOS_CALLS_THRESHOLD;
  }).map(function (state) {
    return _objectSpread(_objectSpread({}, state), {}, {
      hitRate: Number(state.hitRate.toFixed(2))
    });
  }), 'hitRate', 'asc'));
});
var instancesPendingUpdate = new Set();
var idsToExcludeFromUpdate = new Set();
var pendingEffects = new Map();
var pendingCleanups = new Map();
var pendingLayoutEffects = new Map();
var pendingLayoutCleanups = new Map();
var areImmediateEffectsCaptured = false;
/*
  Order:
  - component effect cleanups
  - component effects
  - measure tasks
  - mutation tasks
  - component updates
  - component layout effect cleanups
  - component layout effects
  - forced layout measure tasks
  - forced layout mutation tasks
 */

var runUpdatePassOnRaf = (0,_util_schedulers__WEBPACK_IMPORTED_MODULE_5__.throttleWith)(_lib_fasterdom_fasterdom__WEBPACK_IMPORTED_MODULE_7__.requestMeasure, function () {
  var runImmediateEffects = captureImmediateEffects();
  idsToExcludeFromUpdate = new Set();
  var instancesToUpdate = Array.from(instancesPendingUpdate).sort(function (a, b) {
    return a.id - b.id;
  });
  instancesPendingUpdate = new Set();
  var currentCleanups = pendingCleanups;
  pendingCleanups = new Map();
  currentCleanups.forEach(function (cb) {
    return cb();
  });
  var currentEffects = pendingEffects;
  pendingEffects = new Map();
  currentEffects.forEach(function (cb) {
    return cb();
  });
  (0,_lib_fasterdom_fasterdom__WEBPACK_IMPORTED_MODULE_7__.requestMutation)(function () {
    instancesToUpdate.forEach(prepareComponentForFrame);
    instancesToUpdate.forEach(function (instance) {
      if (idsToExcludeFromUpdate.has(instance.id)) {
        return;
      }

      forceUpdateComponent(instance);
    });
    runImmediateEffects === null || runImmediateEffects === void 0 ? void 0 : runImmediateEffects();
  });
});
function captureImmediateEffects() {
  if (areImmediateEffectsCaptured) {
    return undefined;
  }

  areImmediateEffectsCaptured = true;
  return runCapturedImmediateEffects;
}

function runCapturedImmediateEffects() {
  var currentLayoutCleanups = pendingLayoutCleanups;
  pendingLayoutCleanups = new Map();
  currentLayoutCleanups.forEach(function (cb) {
    return cb();
  });
  var currentLayoutEffects = pendingLayoutEffects;
  pendingLayoutEffects = new Map();
  currentLayoutEffects.forEach(function (cb) {
    return cb();
  });
  areImmediateEffectsCaptured = false;
}

function renderComponent(componentInstance) {
  idsToExcludeFromUpdate.add(componentInstance.id);
  var Component = componentInstance.Component,
      props = componentInstance.props;
  var newRenderedValue;
  (0,_util_safeExec__WEBPACK_IMPORTED_MODULE_4__["default"])(function () {
    renderingInstance = componentInstance;

    if (componentInstance.hooks) {
      if (componentInstance.hooks.state) {
        componentInstance.hooks.state.cursor = 0;
      }

      if (componentInstance.hooks.effects) {
        componentInstance.hooks.effects.cursor = 0;
      }

      if (componentInstance.hooks.memos) {
        componentInstance.hooks.memos.cursor = 0;
      }

      if (componentInstance.hooks.refs) {
        componentInstance.hooks.refs.cursor = 0;
      }
    } // eslint-disable-next-line @typescript-eslint/naming-convention


    var DEBUG_startAt;

    if (_config__WEBPACK_IMPORTED_MODULE_0__.DEBUG) {
      var componentName = DEBUG_resolveComponentName(Component);

      if (!DEBUG_components[componentName]) {
        DEBUG_components[componentName] = {
          name: componentName,
          renders: 0,
          avgRenderTime: 0
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

      var _componentName = DEBUG_resolveComponentName(Component);

      if (duration > DEBUG_RENDER_THRESHOLD) {
        // eslint-disable-next-line no-console
        console.warn("[Teact] Slow component render: ".concat(_componentName, ", ").concat(Math.round(duration), " ms"));
      }

      var _DEBUG_components$_co = DEBUG_components[_componentName],
          renders = _DEBUG_components$_co.renders,
          avgRenderTime = _DEBUG_components$_co.avgRenderTime;
      DEBUG_components[_componentName].avgRenderTime = (avgRenderTime * renders + duration) / (renders + 1);
      DEBUG_components[_componentName].renders++;
      DEBUG_components.TOTAL.renders++;

      if (_config__WEBPACK_IMPORTED_MODULE_0__.DEBUG_MORE) {
        (0,_util_debugOverlay__WEBPACK_IMPORTED_MODULE_2__.incrementOverlayCounter)("".concat(_componentName, " renders"));
        (0,_util_debugOverlay__WEBPACK_IMPORTED_MODULE_2__.incrementOverlayCounter)("".concat(_componentName, " duration"), duration);
      }
    }
  }, function () {
    // eslint-disable-next-line no-console
    console.error("[Teact] Error while rendering component ".concat(componentInstance.name));
    newRenderedValue = componentInstance.renderedValue;
  });

  if (componentInstance.mountState === MountState.Mounted && newRenderedValue === componentInstance.renderedValue) {
    return componentInstance.$element;
  }

  componentInstance.renderedValue = newRenderedValue;
  var children = Array.isArray(newRenderedValue) ? newRenderedValue : [newRenderedValue];

  if (componentInstance.mountState === MountState.New) {
    componentInstance.$element.children = buildChildren(children, true);
  } else {
    componentInstance.$element = buildComponentElement(componentInstance, children);
  }

  return componentInstance.$element;
}
function hasElementChanged($old, $new) {
  if (_typeof($old) !== _typeof($new)) {
    return true;
  } else if ($old.type !== $new.type) {
    return true;
  } else if ($old.type === VirtualType.Text && $new.type === VirtualType.Text) {
    return $old.value !== $new.value;
  } else if ($old.type === VirtualType.Tag && $new.type === VirtualType.Tag) {
    return $old.tag !== $new.tag || $old.props.key !== $new.props.key;
  } else if ($old.type === VirtualType.Component && $new.type === VirtualType.Component) {
    return $old.componentInstance.Component !== $new.componentInstance.Component || $old.props.key !== $new.props.key;
  }

  return false;
}
function mountComponent(componentInstance) {
  componentInstance.id = ++lastComponentId;
  renderComponent(componentInstance);
  componentInstance.mountState = MountState.Mounted;
  return componentInstance.$element;
}
function unmountComponent(componentInstance) {
  var _componentInstance$ho;

  if (componentInstance.mountState !== MountState.Mounted) {
    return;
  }

  idsToExcludeFromUpdate.add(componentInstance.id);

  if ((_componentInstance$ho = componentInstance.hooks) !== null && _componentInstance$ho !== void 0 && _componentInstance$ho.effects) {
    var _iterator = _createForOfIteratorHelper(componentInstance.hooks.effects.byCursor),
        _step;

    try {
      for (_iterator.s(); !(_step = _iterator.n()).done;) {
        var _effect$releaseSignal;

        var effect = _step.value;

        if (effect.cleanup) {
          (0,_util_safeExec__WEBPACK_IMPORTED_MODULE_4__["default"])(effect.cleanup);
        }

        effect.cleanup = undefined;
        (_effect$releaseSignal = effect.releaseSignals) === null || _effect$releaseSignal === void 0 ? void 0 : _effect$releaseSignal.call(effect);
      }
    } catch (err) {
      _iterator.e(err);
    } finally {
      _iterator.f();
    }
  }

  componentInstance.mountState = MountState.Unmounted;
  helpGc(componentInstance);
} // We need to remove all references to DOM objects. We also clean all other references, just in case

function helpGc(componentInstance) {
  var _ref3 = componentInstance.hooks || {},
      effects = _ref3.effects,
      state = _ref3.state,
      memos = _ref3.memos,
      refs = _ref3.refs;

  if (effects) {
    var _iterator2 = _createForOfIteratorHelper(effects.byCursor),
        _step2;

    try {
      for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
        var hook = _step2.value;
        hook.schedule = undefined;
        hook.cleanup = undefined;
        hook.releaseSignals = undefined;
        hook.dependencies = undefined;
      }
    } catch (err) {
      _iterator2.e(err);
    } finally {
      _iterator2.f();
    }
  }

  if (state) {
    var _iterator3 = _createForOfIteratorHelper(state.byCursor),
        _step3;

    try {
      for (_iterator3.s(); !(_step3 = _iterator3.n()).done;) {
        var _hook = _step3.value;
        _hook.value = undefined;
        _hook.nextValue = undefined;
        _hook.setter = undefined;
      }
    } catch (err) {
      _iterator3.e(err);
    } finally {
      _iterator3.f();
    }
  }

  if (memos) {
    var _iterator4 = _createForOfIteratorHelper(memos.byCursor),
        _step4;

    try {
      for (_iterator4.s(); !(_step4 = _iterator4.n()).done;) {
        var _hook2 = _step4.value;
        _hook2.value = undefined;
        _hook2.dependencies = undefined;
      }
    } catch (err) {
      _iterator4.e(err);
    } finally {
      _iterator4.f();
    }
  }

  if (refs) {
    var _iterator5 = _createForOfIteratorHelper(refs.byCursor),
        _step5;

    try {
      for (_iterator5.s(); !(_step5 = _iterator5.n()).done;) {
        var _hook3 = _step5.value;
        _hook3.current = undefined;
      }
    } catch (err) {
      _iterator5.e(err);
    } finally {
      _iterator5.f();
    }
  }

  componentInstance.hooks = undefined;
  componentInstance.$element = undefined;
  componentInstance.renderedValue = undefined;
  componentInstance.Component = undefined;
  componentInstance.props = undefined;
  componentInstance.onUpdate = undefined;
}

function prepareComponentForFrame(componentInstance) {
  var _componentInstance$ho2;

  if (componentInstance.mountState !== MountState.Mounted) {
    return;
  }

  if ((_componentInstance$ho2 = componentInstance.hooks) !== null && _componentInstance$ho2 !== void 0 && _componentInstance$ho2.state) {
    var _iterator6 = _createForOfIteratorHelper(componentInstance.hooks.state.byCursor),
        _step6;

    try {
      for (_iterator6.s(); !(_step6 = _iterator6.n()).done;) {
        var hook = _step6.value;
        hook.value = hook.nextValue;
      }
    } catch (err) {
      _iterator6.e(err);
    } finally {
      _iterator6.f();
    }
  }
}

function forceUpdateComponent(componentInstance) {
  if (componentInstance.mountState !== MountState.Mounted || !componentInstance.onUpdate) {
    return;
  }

  var currentElement = componentInstance.$element;
  renderComponent(componentInstance);

  if (componentInstance.$element !== currentElement) {
    componentInstance.onUpdate();
  }
}

function useState(initial, debugKey) {
  if (!renderingInstance.hooks) {
    renderingInstance.hooks = {};
  }

  if (!renderingInstance.hooks.state) {
    renderingInstance.hooks.state = {
      cursor: 0,
      byCursor: []
    };
  }

  var _renderingInstance$ho = renderingInstance.hooks.state,
      cursor = _renderingInstance$ho.cursor,
      byCursor = _renderingInstance$ho.byCursor;
  var componentInstance = renderingInstance;

  if (byCursor[cursor] === undefined) {
    byCursor[cursor] = {
      value: initial,
      nextValue: initial,
      setter: function setter(newValue) {
        if (componentInstance.mountState === MountState.Unmounted) {
          return;
        }

        if (typeof newValue === 'function') {
          newValue = newValue(byCursor[cursor].nextValue);
        }

        if (byCursor[cursor].nextValue === newValue) {
          return;
        }

        byCursor[cursor].nextValue = newValue;
        instancesPendingUpdate.add(componentInstance);
        runUpdatePassOnRaf();

        if (_config__WEBPACK_IMPORTED_MODULE_0__.DEBUG_MORE) {
          // eslint-disable-next-line no-console
          console.log('[Teact.useState]', DEBUG_resolveComponentName(componentInstance.Component), "State update at cursor #".concat(cursor).concat(debugKey ? " (".concat(debugKey, ")") : '', ", next value: "), byCursor[cursor].nextValue);
        }
      }
    };
  }

  renderingInstance.hooks.state.cursor++;
  return [byCursor[cursor].value, byCursor[cursor].setter];
}

function useEffectBase(isLayout, effect, dependencies, debugKey) {
  var _byCursor$cursor;

  if (!renderingInstance.hooks) {
    renderingInstance.hooks = {};
  }

  if (!renderingInstance.hooks.effects) {
    renderingInstance.hooks.effects = {
      cursor: 0,
      byCursor: []
    };
  }

  var _renderingInstance$ho2 = renderingInstance.hooks.effects,
      cursor = _renderingInstance$ho2.cursor,
      byCursor = _renderingInstance$ho2.byCursor;
  var componentInstance = renderingInstance;

  var runEffectCleanup = function runEffectCleanup() {
    return (0,_util_safeExec__WEBPACK_IMPORTED_MODULE_4__["default"])(function () {
      var cleanup = byCursor[cursor].cleanup;

      if (!cleanup) {
        return;
      } // eslint-disable-next-line @typescript-eslint/naming-convention


      var DEBUG_startAt;

      if (_config__WEBPACK_IMPORTED_MODULE_0__.DEBUG) {
        DEBUG_startAt = performance.now();
      }

      cleanup();

      if (_config__WEBPACK_IMPORTED_MODULE_0__.DEBUG) {
        var duration = performance.now() - DEBUG_startAt;
        var componentName = DEBUG_resolveComponentName(componentInstance.Component);

        if (duration > DEBUG_EFFECT_THRESHOLD) {
          // eslint-disable-next-line no-console
          console.warn("[Teact] Slow cleanup at effect cursor #".concat(cursor, ": ").concat(componentName, ", ").concat(Math.round(duration), " ms"));
        }
      }
    }, function () {
      // eslint-disable-next-line no-console
      console.error("[Teact] Error in effect cleanup at cursor #".concat(cursor, " in ").concat(componentInstance.name));
    }, function () {
      byCursor[cursor].cleanup = undefined;
    });
  };

  var runEffect = function runEffect() {
    return (0,_util_safeExec__WEBPACK_IMPORTED_MODULE_4__["default"])(function () {
      if (componentInstance.mountState === MountState.Unmounted) {
        return;
      } // eslint-disable-next-line @typescript-eslint/naming-convention


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
        var componentName = DEBUG_resolveComponentName(componentInstance.Component);

        if (duration > DEBUG_EFFECT_THRESHOLD) {
          // eslint-disable-next-line no-console
          console.warn("[Teact] Slow effect at cursor #".concat(cursor, ": ").concat(componentName, ", ").concat(Math.round(duration), " ms"));
        }
      }
    }, function () {
      // eslint-disable-next-line no-console
      console.error("[Teact] Error in effect at cursor #".concat(cursor, " in ").concat(componentInstance.name));
    });
  };

  function schedule() {
    var effectId = "".concat(componentInstance.id, "_").concat(cursor);

    if (isLayout) {
      pendingLayoutCleanups.set(effectId, runEffectCleanup);
      pendingLayoutEffects.set(effectId, runEffect);
    } else {
      pendingCleanups.set(effectId, runEffectCleanup);
      pendingEffects.set(effectId, runEffect);
    }

    runUpdatePassOnRaf();
  }

  if (dependencies && (_byCursor$cursor = byCursor[cursor]) !== null && _byCursor$cursor !== void 0 && _byCursor$cursor.dependencies) {
    if (dependencies.some(function (dependency, i) {
      return dependency !== byCursor[cursor].dependencies[i];
    })) {
      if (_config__WEBPACK_IMPORTED_MODULE_0__.DEBUG && debugKey) {
        var causedBy = dependencies.reduce(function (res, newValue, i) {
          var prevValue = byCursor[cursor].dependencies[i];

          if (newValue !== prevValue) {
            res.push("".concat(i, ": ").concat(prevValue, " => ").concat(newValue));
          }

          return res;
        }, []); // eslint-disable-next-line no-console

        console.log("[Teact] Effect \"".concat(debugKey, "\" caused by dependencies."), causedBy.join(', '));
      }

      schedule();
    }
  } else {
    if (debugKey) {
      // eslint-disable-next-line no-console
      console.log("[Teact] Effect \"".concat(debugKey, "\" caused by missing dependencies."));
    }

    schedule();
  }

  var isFirstRun = !byCursor[cursor];
  byCursor[cursor] = _objectSpread(_objectSpread({}, byCursor[cursor]), {}, {
    dependencies: dependencies,
    schedule: schedule
  });

  function setupSignals() {
    var cleanups = dependencies === null || dependencies === void 0 ? void 0 : dependencies.filter(_util_signals__WEBPACK_IMPORTED_MODULE_6__.isSignal).map(function (signal, i) {
      return signal.subscribe(function () {
        if (debugKey) {
          // eslint-disable-next-line no-console
          console.log("[Teact] Effect \"".concat(debugKey, "\" caused by signal #").concat(i, " new value:"), signal());
        }

        byCursor[cursor].schedule();
      });
    });

    if (!(cleanups !== null && cleanups !== void 0 && cleanups.length)) {
      return undefined;
    }

    return function () {
      var _iterator7 = _createForOfIteratorHelper(cleanups),
          _step7;

      try {
        for (_iterator7.s(); !(_step7 = _iterator7.n()).done;) {
          var cleanup = _step7.value;
          cleanup();
        }
      } catch (err) {
        _iterator7.e(err);
      } finally {
        _iterator7.f();
      }
    };
  }

  if (isFirstRun) {
    byCursor[cursor].releaseSignals = setupSignals();
  }

  renderingInstance.hooks.effects.cursor++;
}

function useEffect(effect, dependencies, debugKey) {
  return useEffectBase(false, effect, dependencies, debugKey);
}
function useLayoutEffect(effect, dependencies, debugKey) {
  return useEffectBase(true, effect, dependencies, debugKey);
}
function useMemo(resolver, dependencies, debugKey, debugHitRateKey) {
  if (!renderingInstance.hooks) {
    renderingInstance.hooks = {};
  }

  if (!renderingInstance.hooks.memos) {
    renderingInstance.hooks.memos = {
      cursor: 0,
      byCursor: []
    };
  }

  var _renderingInstance$ho3 = renderingInstance.hooks.memos,
      cursor = _renderingInstance$ho3.cursor,
      byCursor = _renderingInstance$ho3.byCursor;

  var _ref4 = byCursor[cursor] || {},
      value = _ref4.value; // eslint-disable-next-line @typescript-eslint/naming-convention


  var DEBUG_state;

  if (_config__WEBPACK_IMPORTED_MODULE_0__.DEBUG && debugHitRateKey) {
    var instanceKey = "".concat(debugHitRateKey, "#").concat(renderingInstance.id);
    DEBUG_state = DEBUG_memos[instanceKey];

    if (!DEBUG_state) {
      DEBUG_state = {
        key: instanceKey,
        calls: 0,
        misses: 0,
        hitRate: 0
      };
      DEBUG_memos[instanceKey] = DEBUG_state;
    }

    DEBUG_state.calls++;
    DEBUG_state.hitRate = (DEBUG_state.calls - DEBUG_state.misses) / DEBUG_state.calls;
  }

  if (byCursor[cursor] === undefined || dependencies.length !== byCursor[cursor].dependencies.length || dependencies.some(function (dependency, i) {
    return dependency !== byCursor[cursor].dependencies[i];
  })) {
    if (_config__WEBPACK_IMPORTED_MODULE_0__.DEBUG) {
      if (debugKey) {
        var msg = "[Teact.useMemo] ".concat(renderingInstance.name, " (").concat(debugKey, "): Update is caused by:");

        if (!byCursor[cursor]) {
          // eslint-disable-next-line no-console
          console.log("".concat(msg, " [first render]"));
        } else {
          (0,_util_arePropsShallowEqual__WEBPACK_IMPORTED_MODULE_1__.logUnequalProps)(byCursor[cursor].dependencies, dependencies, msg, debugKey);
        }
      }

      if (DEBUG_state) {
        DEBUG_state.misses++;
        DEBUG_state.hitRate = (DEBUG_state.calls - DEBUG_state.misses) / DEBUG_state.calls;

        if (DEBUG_state.calls % 10 === 0 && DEBUG_state.calls >= DEBUG_MEMOS_CALLS_THRESHOLD && DEBUG_state.hitRate < 0.25) {
          // eslint-disable-next-line no-console
          console.warn( // eslint-disable-next-line max-len
          "[Teact] ".concat(DEBUG_state.key, ": Hit rate is ").concat(DEBUG_state.hitRate.toFixed(2), " for ").concat(DEBUG_state.calls, " calls"));
        }
      }
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
  // eslint-disable-next-line react-hooks-static-deps/exhaustive-deps
  return useMemo(function () {
    return newCallback;
  }, dependencies, debugKey);
}
// React way (empty is `null`)
// eslint-disable-next-line no-null/no-null
function useRef(initial) {
  if (!renderingInstance.hooks) {
    renderingInstance.hooks = {};
  }

  if (!renderingInstance.hooks.refs) {
    renderingInstance.hooks.refs = {
      cursor: 0,
      byCursor: []
    };
  }

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
function createContext(defaultValue) {
  var contextId = String(contextCounter++);

  function TeactContextProvider(props) {
    var _props$value;

    var _useSignal = useSignal((_props$value = props.value) !== null && _props$value !== void 0 ? _props$value : defaultValue),
        _useSignal2 = _slicedToArray(_useSignal, 2),
        getValue = _useSignal2[0],
        setValue = _useSignal2[1]; // Create a new object to avoid mutations in the parent context


    renderingInstance.context = _objectSpread({}, renderingInstance.context);
    renderingInstance.context[contextId] = getValue;
    setValue(props.value);
    return props.children;
  }

  TeactContextProvider.DEBUG_contentComponentName = contextId;
  var context = {
    defaultValue: defaultValue,
    contextId: contextId,
    Provider: TeactContextProvider
  };
  return context;
}
function useContextSignal(context) {
  var _renderingInstance$co;

  var _useSignal3 = useSignal(context.defaultValue),
      _useSignal4 = _slicedToArray(_useSignal3, 1),
      getDefaultValue = _useSignal4[0];

  return ((_renderingInstance$co = renderingInstance.context) === null || _renderingInstance$co === void 0 ? void 0 : _renderingInstance$co[context.contextId]) || getDefaultValue;
}
function useSignal(initial) {
  var _signalRef$current;

  var signalRef = useRef();
  (_signalRef$current = signalRef.current) !== null && _signalRef$current !== void 0 ? _signalRef$current : signalRef.current = (0,_util_signals__WEBPACK_IMPORTED_MODULE_6__.createSignal)(initial);
  return signalRef.current;
}
function memo(Component, debugKey) {
  function TeactMemoWrapper(props) {
    return useMemo(function () {
      return createElement(Component, props);
    }, // eslint-disable-next-line react-hooks-static-deps/exhaustive-deps
    Object.values(props), debugKey, _config__WEBPACK_IMPORTED_MODULE_0__.DEBUG_MORE ? DEBUG_resolveComponentName(renderingInstance.Component) : undefined);
  }

  TeactMemoWrapper.DEBUG_contentComponentName = DEBUG_resolveComponentName(Component);
  return TeactMemoWrapper;
} // eslint-disable-next-line @typescript-eslint/naming-convention

function DEBUG_resolveComponentName(Component) {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  var name = Component.name,
      DEBUG_contentComponentName = Component.DEBUG_contentComponentName;

  if (name === 'TeactNContainer') {
    return "container>".concat(DEBUG_contentComponentName);
  }

  if (name === 'TeactMemoWrapper') {
    return "memo>".concat(DEBUG_contentComponentName);
  }

  if (name === 'TeactContextProvider') {
    return "context>id".concat(DEBUG_contentComponentName);
  }

  return name + (DEBUG_contentComponentName ? ">".concat(DEBUG_contentComponentName) : '');
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
/* harmony export */   logUnequalProps: () => (/* binding */ logUnequalProps)
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
function logUnequalProps(currentProps, newProps, msg) {
  var debugKey = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : '';
  var currentKeys = Object.keys(currentProps);
  var currentKeysLength = currentKeys.length;
  var newKeysLength = Object.keys(newProps).length;

  if (currentKeysLength !== newKeysLength) {
    // eslint-disable-next-line no-console
    console.log("".concat(msg, " LENGTH"));
    return;
  } // eslint-disable-next-line no-console


  console.log(msg);
  currentKeys.forEach(function (res, prop) {
    if (currentProps[prop] !== newProps[prop]) {
      // eslint-disable-next-line no-console
      console.log(debugKey, prop, ':', currentProps[prop], '=>', newProps[prop]);
    }
  });
}

/***/ }),

/***/ "./src/util/callbacks.ts":
/*!*******************************!*\
  !*** ./src/util/callbacks.ts ***!
  \*******************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   createCallbackManager: () => (/* binding */ createCallbackManager)
/* harmony export */ });
function createCallbackManager() {
  var callbacks = new Set();

  function addCallback(cb) {
    callbacks.add(cb);
    return function () {
      removeCallback(cb);
    };
  }

  function removeCallback(cb) {
    callbacks["delete"](cb);
  }

  function runCallbacks() {
    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    callbacks.forEach(function (callback) {
      callback.apply(void 0, args);
    });
  }

  function hasCallbacks() {
    return Boolean(callbacks.size);
  }

  return {
    runCallbacks: runCallbacks,
    addCallback: addCallback,
    removeCallback: removeCallback,
    hasCallbacks: hasCallbacks
  };
}

/***/ }),

/***/ "./src/util/debugOverlay.ts":
/*!**********************************!*\
  !*** ./src/util/debugOverlay.ts ***!
  \**********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   debugToOverlay: () => (/* binding */ debugToOverlay),
/* harmony export */   incrementOverlayCounter: () => (/* binding */ incrementOverlayCounter),
/* harmony export */   renderCounters: () => (/* binding */ renderCounters)
/* harmony export */ });
/* harmony import */ var _schedulers__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./schedulers */ "./src/util/schedulers.ts");
function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function _iterableToArrayLimit(arr, i) { var _i = arr == null ? null : typeof Symbol !== "undefined" && arr[Symbol.iterator] || arr["@@iterator"]; if (_i == null) return; var _arr = []; var _n = true; var _d = false; var _s, _e; try { for (_i = _i.call(arr); !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }


var KEYS_TO_IGNORE = new Set(['TeactMemoWrapper renders', 'TeactNContainer renders', 'Button renders']);
var MIN_RENDERS_TO_SHOW = 5;
var MIN_DURATION_TO_SHOW = 2;
var BG_GREEN = ' style="background: lightgreen"';
var counters = {};
var renderCountersThrottled = (0,_schedulers__WEBPACK_IMPORTED_MODULE_0__.throttle)(renderCounters, 500, false);
var loggerEl;
function debugToOverlay(text) {
  if (!loggerEl) {
    setupOverlay();
  }

  var date = new Date();
  var dateFormatted = "".concat(date.toLocaleTimeString(), ".").concat(date.getMilliseconds());
  var wasAtBottom = loggerEl.scrollTop + 10 >= loggerEl.scrollHeight - loggerEl.offsetHeight;
  loggerEl.innerHTML += "".concat(dateFormatted, ": ").concat(text, "<br/>");

  if (wasAtBottom) {
    loggerEl.scrollTop = loggerEl.scrollHeight;
  }
}
function incrementOverlayCounter(key) {
  var value = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 1;
  var now = Date.now();

  if (!counters[key]) {
    counters[key] = {
      value: value,
      lastUpdateAt: now
    };
  } else {
    counters[key].value += value;
    counters[key].lastUpdateAt = now;
  }

  renderCountersThrottled();
}
function renderCounters() {
  if (!loggerEl) {
    setupOverlay();
  }

  var halfSecondAgo = Date.now() - 500;

  var _Object$entries$reduc = Object.entries(counters).reduce(function (acc, _ref) {
    var _ref2 = _slicedToArray(_ref, 2),
        key = _ref2[0],
        value = _ref2[1].value;

    if (KEYS_TO_IGNORE.has(key)) {
      return acc;
    }

    if (key.includes('renders') && value > acc[0]) {
      acc[0] = value;
    }

    if (key.includes('duration') && value > acc[1]) {
      acc[1] = value;
    }

    return acc;
  }, [0, 0]),
      _Object$entries$reduc2 = _slicedToArray(_Object$entries$reduc, 2),
      maxRenders = _Object$entries$reduc2[0],
      maxDuration = _Object$entries$reduc2[1];

  loggerEl.innerHTML = Object.entries(counters).filter(function (_ref3) {
    var _ref4 = _slicedToArray(_ref3, 2),
        key = _ref4[0],
        value = _ref4[1].value;

    return !KEYS_TO_IGNORE.has(key) && (key.includes('renders') && value > MIN_RENDERS_TO_SHOW || key.includes('duration') && value > MIN_DURATION_TO_SHOW);
  }).sort(function (a, b) {
    return b[1].lastUpdateAt - a[1].lastUpdateAt;
  }).map(function (_ref5) {
    var _ref6 = _slicedToArray(_ref5, 2),
        key = _ref6[0],
        _ref6$ = _ref6[1],
        value = _ref6$.value,
        lastUpdateAt = _ref6$.lastUpdateAt;

    return ["<div style=\"background: #ff0000".concat(factorToHex(value / (key.includes('renders') ? maxRenders : maxDuration)), "\">"), "  <span".concat(lastUpdateAt > halfSecondAgo ? BG_GREEN : '', ">").concat(key, ": ").concat(Math.round(value), "</span>"), '</div>'].join('\n');
  }).join('\n');
}

function setupOverlay() {
  loggerEl = document.createElement('div');
  loggerEl.style.cssText = 'position: absolute; left: 0; bottom: 25px; z-index: 9998; width: 260px; height: 200px;' + ' border: 1px solid #555; background: rgba(255, 255, 255, 0.9); overflow: auto; font-size: 10px;';
  document.body.appendChild(loggerEl);
  var clearEl = document.createElement('a');
  clearEl.style.cssText = 'position: absolute; left: 222px; bottom: 198px; z-index: 9999; font-size: 20px; ' + 'cursor: pointer;';
  clearEl.innerText = '🔄';
  clearEl.addEventListener('click', function () {
    counters = {};
    renderCountersThrottled();
  });
  document.body.appendChild(clearEl);
}

function factorToHex(factor) {
  return Math.round(255 * factor).toString(16).padStart(2, '0');
}

/***/ }),

/***/ "./src/util/handleError.ts":
/*!*********************************!*\
  !*** ./src/util/handleError.ts ***!
  \*********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   handleError: () => (/* binding */ handleError)
/* harmony export */ });
window.addEventListener('error', handleErrorEvent);
window.addEventListener('unhandledrejection', handleErrorEvent);

function handleErrorEvent(e) {
  // https://stackoverflow.com/questions/49384120/resizeobserver-loop-limit-exceeded
  if (e instanceof ErrorEvent && e.message === 'ResizeObserver loop limit exceeded') {
    return;
  }

  e.preventDefault();
  handleError(e instanceof ErrorEvent ? e.error || e.message : e.reason);
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
/* harmony export */   orderBy: () => (/* binding */ orderBy),
/* harmony export */   unique: () => (/* binding */ unique)
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

/***/ "./src/util/safeExec.ts":
/*!******************************!*\
  !*** ./src/util/safeExec.ts ***!
  \******************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ safeExec)
/* harmony export */ });
/* harmony import */ var _config__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../config */ "./src/config.ts");
/* harmony import */ var _handleError__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./handleError */ "./src/util/handleError.ts");


var SAFE_EXEC_ENABLED = !_config__WEBPACK_IMPORTED_MODULE_0__.DEBUG_MORE;
function safeExec(cb, rescue, always) {
  if (!SAFE_EXEC_ENABLED) {
    return cb();
  }

  try {
    return cb();
  } catch (err) {
    rescue === null || rescue === void 0 ? void 0 : rescue(err);
    (0,_handleError__WEBPACK_IMPORTED_MODULE_1__.handleError)(err);
    return undefined;
  } finally {
    always === null || always === void 0 ? void 0 : always();
  }
}

/***/ }),

/***/ "./src/util/schedulers.ts":
/*!********************************!*\
  !*** ./src/util/schedulers.ts ***!
  \********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   fastRaf: () => (/* binding */ fastRaf),
/* harmony export */   onBeforeUnload: () => (/* binding */ onBeforeUnload),
/* harmony export */   onIdle: () => (/* binding */ onIdle),
/* harmony export */   onTickEnd: () => (/* binding */ onTickEnd),
/* harmony export */   throttle: () => (/* binding */ throttle),
/* harmony export */   throttleWith: () => (/* binding */ throttleWith),
/* harmony export */   throttleWithTickEnd: () => (/* binding */ throttleWithTickEnd)
/* harmony export */ });
function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _iterableToArray(iter) { if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null) return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) return _arrayLikeToArray(arr); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function throttle(fn, ms) {
  var shouldRunFirst = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;
  var interval;
  var isPending;
  var args;
  return function () {
    isPending = true;

    for (var _len = arguments.length, _args = new Array(_len), _key = 0; _key < _len; _key++) {
      _args[_key] = arguments[_key];
    }

    args = _args;

    if (!interval) {
      if (shouldRunFirst) {
        isPending = false;
        fn.apply(void 0, _toConsumableArray(args));
      } // eslint-disable-next-line no-restricted-globals


      interval = self.setInterval(function () {
        if (!isPending) {
          // eslint-disable-next-line no-restricted-globals
          self.clearInterval(interval);
          interval = undefined;
          return;
        }

        isPending = false;
        fn.apply(void 0, _toConsumableArray(args));
      }, ms);
    }
  };
}
function throttleWithTickEnd(fn) {
  return throttleWith(onTickEnd, fn);
}
function throttleWith(schedulerFn, fn) {
  var waiting = false;
  var args;
  return function () {
    for (var _len2 = arguments.length, _args = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
      _args[_key2] = arguments[_key2];
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
function onIdle(cb, timeout) {
  // eslint-disable-next-line no-restricted-globals
  if (self.requestIdleCallback) {
    // eslint-disable-next-line no-restricted-globals
    self.requestIdleCallback(cb, {
      timeout: timeout
    });
  } else {
    onTickEnd(cb);
  }
}
var FAST_RAF_TIMEOUT_FALLBACK_MS = 300;
var fastRafCallbacks;
var fastRafFallbackCallbacks;
var fastRafFallbackTimeout; // May result in an immediate execution if called from another RAF callback which was scheduled
// (and therefore is executed) earlier than RAF callback scheduled by `fastRaf`

function fastRaf(callback) {
  var withTimeoutFallback = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

  if (!fastRafCallbacks) {
    fastRafCallbacks = new Set([callback]);
    requestAnimationFrame(function () {
      var currentCallbacks = fastRafCallbacks;
      fastRafCallbacks = undefined;
      fastRafFallbackCallbacks = undefined;

      if (fastRafFallbackTimeout) {
        clearTimeout(fastRafFallbackTimeout);
        fastRafFallbackTimeout = undefined;
      }

      currentCallbacks.forEach(function (cb) {
        return cb();
      });
    });
  } else {
    fastRafCallbacks.add(callback);
  }

  if (withTimeoutFallback) {
    if (!fastRafFallbackCallbacks) {
      fastRafFallbackCallbacks = new Set([callback]);
    } else {
      fastRafFallbackCallbacks.add(callback);
    }

    if (!fastRafFallbackTimeout) {
      fastRafFallbackTimeout = window.setTimeout(function () {
        var currentTimeoutCallbacks = fastRafFallbackCallbacks;

        if (fastRafCallbacks) {
          currentTimeoutCallbacks.forEach(fastRafCallbacks["delete"], fastRafCallbacks);
        }

        fastRafFallbackCallbacks = undefined;

        if (fastRafFallbackTimeout) {
          clearTimeout(fastRafFallbackTimeout);
          fastRafFallbackTimeout = undefined;
        }

        currentTimeoutCallbacks.forEach(function (cb) {
          return cb();
        });
      }, FAST_RAF_TIMEOUT_FALLBACK_MS);
    }
  }
}
var onTickEndCallbacks;
function onTickEnd(callback) {
  if (!onTickEndCallbacks) {
    onTickEndCallbacks = [callback];
    Promise.resolve().then(function () {
      var currentCallbacks = onTickEndCallbacks;
      onTickEndCallbacks = undefined;
      currentCallbacks.forEach(function (cb) {
        return cb();
      });
    });
  } else {
    onTickEndCallbacks.push(callback);
  }
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

/***/ }),

/***/ "./src/util/signals.ts":
/*!*****************************!*\
  !*** ./src/util/signals.ts ***!
  \*****************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   cleanupEffect: () => (/* binding */ cleanupEffect),
/* harmony export */   createSignal: () => (/* binding */ createSignal),
/* harmony export */   isSignal: () => (/* binding */ isSignal)
/* harmony export */ });
/* harmony import */ var _callbacks__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./callbacks */ "./src/util/callbacks.ts");
function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }


var SIGNAL_MARK = Symbol('SIGNAL_MARK');
function isSignal(obj) {
  return typeof obj === 'function' && SIGNAL_MARK in obj;
} // A shorthand to unsubscribe effect from all signals

var unsubscribesByEffect = new Map();
var currentEffect;
function createSignal(defaultValue) {
  var _Object$assign;

  var state = {
    value: defaultValue,
    effects: (0,_callbacks__WEBPACK_IMPORTED_MODULE_0__.createCallbackManager)()
  };

  function subscribe(effect) {
    var unsubscribe = state.effects.addCallback(effect);

    if (!unsubscribesByEffect.has(effect)) {
      unsubscribesByEffect.set(effect, new Set([unsubscribe]));
    } else {
      unsubscribesByEffect.get(effect).add(unsubscribe);
    }

    return function () {
      unsubscribe();
      var unsubscribes = unsubscribesByEffect.get(effect);
      unsubscribes["delete"](unsubscribe);

      if (!unsubscribes.size) {
        unsubscribesByEffect["delete"](effect);
      }
    };
  }

  function getter() {
    if (currentEffect) {
      subscribe(currentEffect);
    }

    return state.value;
  }

  function setter(newValue) {
    if (state.value === newValue) {
      return;
    }

    state.value = newValue;
    state.effects.runCallbacks();
  }

  var signal = Object.assign(getter, (_Object$assign = {}, _defineProperty(_Object$assign, SIGNAL_MARK, SIGNAL_MARK), _defineProperty(_Object$assign, "subscribe", subscribe), _Object$assign));
  return [signal, setter];
}
function cleanupEffect(effect) {
  var _unsubscribesByEffect;

  (_unsubscribesByEffect = unsubscribesByEffect.get(effect)) === null || _unsubscribesByEffect === void 0 ? void 0 : _unsubscribesByEffect.forEach(function (unsubscribe) {
    unsubscribe();
  });
  unsubscribesByEffect["delete"](effect);
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
//# sourceMappingURL=main.eb2ce604a362b25c285c.js.map