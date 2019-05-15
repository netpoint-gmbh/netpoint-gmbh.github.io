import {MDCSwitch}from'https://unpkg.com/@material/switch@2.0.0/index.js?module';import {MDCTopAppBar}from'https://unpkg.com/@material/top-app-bar@2.0.0/index.js?module';import'https://unpkg.com/stacktrace-js@2.0.0/dist/stacktrace.min.js';var candidateSelectors = [
  'input',
  'select',
  'textarea',
  'a[href]',
  'button',
  '[tabindex]',
  'audio[controls]',
  'video[controls]',
  '[contenteditable]:not([contenteditable="false"])',
];
var candidateSelector = candidateSelectors.join(',');

var matches = typeof Element === 'undefined'
  ? function () {}
  : Element.prototype.matches || Element.prototype.msMatchesSelector || Element.prototype.webkitMatchesSelector;

function tabbable(el, options) {
  options = options || {};

  var regularTabbables = [];
  var orderedTabbables = [];

  var candidates = el.querySelectorAll(candidateSelector);

  if (options.includeContainer) {
    if (matches.call(el, candidateSelector)) {
      candidates = Array.prototype.slice.apply(candidates);
      candidates.unshift(el);
    }
  }

  var i, candidate, candidateTabindex;
  for (i = 0; i < candidates.length; i++) {
    candidate = candidates[i];

    if (!isNodeMatchingSelectorTabbable(candidate)) continue;

    candidateTabindex = getTabindex(candidate);
    if (candidateTabindex === 0) {
      regularTabbables.push(candidate);
    } else {
      orderedTabbables.push({
        documentOrder: i,
        tabIndex: candidateTabindex,
        node: candidate,
      });
    }
  }

  var tabbableNodes = orderedTabbables
    .sort(sortOrderedTabbables)
    .map(function(a) { return a.node })
    .concat(regularTabbables);

  return tabbableNodes;
}

tabbable.isTabbable = isTabbable;
tabbable.isFocusable = isFocusable;

function isNodeMatchingSelectorTabbable(node) {
  if (
    !isNodeMatchingSelectorFocusable(node)
    || isNonTabbableRadio(node)
    || getTabindex(node) < 0
  ) {
    return false;
  }
  return true;
}

function isTabbable(node) {
  if (!node) throw new Error('No node provided');
  if (matches.call(node, candidateSelector) === false) return false;
  return isNodeMatchingSelectorTabbable(node);
}

function isNodeMatchingSelectorFocusable(node) {
  if (
    node.disabled
    || isHiddenInput(node)
    || isHidden(node)
  ) {
    return false;
  }
  return true;
}

var focusableCandidateSelector = candidateSelectors.concat('iframe').join(',');
function isFocusable(node) {
  if (!node) throw new Error('No node provided');
  if (matches.call(node, focusableCandidateSelector) === false) return false;
  return isNodeMatchingSelectorFocusable(node);
}

function getTabindex(node) {
  var tabindexAttr = parseInt(node.getAttribute('tabindex'), 10);
  if (!isNaN(tabindexAttr)) return tabindexAttr;
  // Browsers do not return `tabIndex` correctly for contentEditable nodes;
  // so if they don't have a tabindex attribute specifically set, assume it's 0.
  if (isContentEditable(node)) return 0;
  return node.tabIndex;
}

function sortOrderedTabbables(a, b) {
  return a.tabIndex === b.tabIndex ? a.documentOrder - b.documentOrder : a.tabIndex - b.tabIndex;
}

function isContentEditable(node) {
  return node.contentEditable === 'true';
}

function isInput(node) {
  return node.tagName === 'INPUT';
}

function isHiddenInput(node) {
  return isInput(node) && node.type === 'hidden';
}

function isRadio(node) {
  return isInput(node) && node.type === 'radio';
}

function isNonTabbableRadio(node) {
  return isRadio(node) && !isTabbableRadio(node);
}

function getCheckedRadio(nodes) {
  for (var i = 0; i < nodes.length; i++) {
    if (nodes[i].checked) {
      return nodes[i];
    }
  }
}

function isTabbableRadio(node) {
  if (!node.name) return true;
  // This won't account for the edge case where you have radio groups with the same
  // in separate forms on the same page.
  var radioSet = node.ownerDocument.querySelectorAll('input[type="radio"][name="' + node.name + '"]');
  var checked = getCheckedRadio(radioSet);
  return !checked || checked === node;
}

function isHidden(node) {
  // offsetParent being null will allow detecting cases where an element is invisible or inside an invisible element,
  // as long as the element does not use position: fixed. For them, their visibility has to be checked directly as well.
  return node.offsetParent === null || getComputedStyle(node).visibility === 'hidden';
}

var tabbable_1 = tabbable;var immutable = extend;

var hasOwnProperty = Object.prototype.hasOwnProperty;

function extend() {
    var target = {};

    for (var i = 0; i < arguments.length; i++) {
        var source = arguments[i];

        for (var key in source) {
            if (hasOwnProperty.call(source, key)) {
                target[key] = source[key];
            }
        }
    }

    return target
}var activeFocusTraps = (function() {
  var trapQueue = [];
  return {
    activateTrap: function(trap) {
      if (trapQueue.length > 0) {
        var activeTrap = trapQueue[trapQueue.length - 1];
        if (activeTrap !== trap) {
          activeTrap.pause();
        }
      }

      var trapIndex = trapQueue.indexOf(trap);
      if (trapIndex === -1) {
        trapQueue.push(trap);
      } else {
        // move this existing trap to the front of the queue
        trapQueue.splice(trapIndex, 1);
        trapQueue.push(trap);
      }
    },

    deactivateTrap: function(trap) {
      var trapIndex = trapQueue.indexOf(trap);
      if (trapIndex !== -1) {
        trapQueue.splice(trapIndex, 1);
      }

      if (trapQueue.length > 0) {
        trapQueue[trapQueue.length - 1].unpause();
      }
    }
  };
})();

function focusTrap(element, userOptions) {
  var doc = document;
  var container =
    typeof element === 'string' ? doc.querySelector(element) : element;

  var config = immutable(
    {
      returnFocusOnDeactivate: true,
      escapeDeactivates: true
    },
    userOptions
  );

  var state = {
    firstTabbableNode: null,
    lastTabbableNode: null,
    nodeFocusedBeforeActivation: null,
    mostRecentlyFocusedNode: null,
    active: false,
    paused: false
  };

  var trap = {
    activate: activate,
    deactivate: deactivate,
    pause: pause,
    unpause: unpause
  };

  return trap;

  function activate(activateOptions) {
    if (state.active) return;

    updateTabbableNodes();

    state.active = true;
    state.paused = false;
    state.nodeFocusedBeforeActivation = doc.activeElement;

    var onActivate =
      activateOptions && activateOptions.onActivate
        ? activateOptions.onActivate
        : config.onActivate;
    if (onActivate) {
      onActivate();
    }

    addListeners();
    return trap;
  }

  function deactivate(deactivateOptions) {
    if (!state.active) return;

    removeListeners();
    state.active = false;
    state.paused = false;

    activeFocusTraps.deactivateTrap(trap);

    var onDeactivate =
      deactivateOptions && deactivateOptions.onDeactivate !== undefined
        ? deactivateOptions.onDeactivate
        : config.onDeactivate;
    if (onDeactivate) {
      onDeactivate();
    }

    var returnFocus =
      deactivateOptions && deactivateOptions.returnFocus !== undefined
        ? deactivateOptions.returnFocus
        : config.returnFocusOnDeactivate;
    if (returnFocus) {
      delay(function() {
        tryFocus(state.nodeFocusedBeforeActivation);
      });
    }

    return trap;
  }

  function pause() {
    if (state.paused || !state.active) return;
    state.paused = true;
    removeListeners();
  }

  function unpause() {
    if (!state.paused || !state.active) return;
    state.paused = false;
    updateTabbableNodes();
    addListeners();
  }

  function addListeners() {
    if (!state.active) return;

    // There can be only one listening focus trap at a time
    activeFocusTraps.activateTrap(trap);

    // Delay ensures that the focused element doesn't capture the event
    // that caused the focus trap activation.
    delay(function() {
      tryFocus(getInitialFocusNode());
    });
    doc.addEventListener('focusin', checkFocusIn, true);
    doc.addEventListener('mousedown', checkPointerDown, {
      capture: true,
      passive: false
    });
    doc.addEventListener('touchstart', checkPointerDown, {
      capture: true,
      passive: false
    });
    doc.addEventListener('click', checkClick, {
      capture: true,
      passive: false
    });
    doc.addEventListener('keydown', checkKey, {
      capture: true,
      passive: false
    });

    return trap;
  }

  function removeListeners() {
    if (!state.active) return;

    doc.removeEventListener('focusin', checkFocusIn, true);
    doc.removeEventListener('mousedown', checkPointerDown, true);
    doc.removeEventListener('touchstart', checkPointerDown, true);
    doc.removeEventListener('click', checkClick, true);
    doc.removeEventListener('keydown', checkKey, true);

    return trap;
  }

  function getNodeForOption(optionName) {
    var optionValue = config[optionName];
    var node = optionValue;
    if (!optionValue) {
      return null;
    }
    if (typeof optionValue === 'string') {
      node = doc.querySelector(optionValue);
      if (!node) {
        throw new Error('`' + optionName + '` refers to no known node');
      }
    }
    if (typeof optionValue === 'function') {
      node = optionValue();
      if (!node) {
        throw new Error('`' + optionName + '` did not return a node');
      }
    }
    return node;
  }

  function getInitialFocusNode() {
    var node;
    if (getNodeForOption('initialFocus') !== null) {
      node = getNodeForOption('initialFocus');
    } else if (container.contains(doc.activeElement)) {
      node = doc.activeElement;
    } else {
      node = state.firstTabbableNode || getNodeForOption('fallbackFocus');
    }

    if (!node) {
      throw new Error(
        "You can't have a focus-trap without at least one focusable element"
      );
    }

    return node;
  }

  // This needs to be done on mousedown and touchstart instead of click
  // so that it precedes the focus event.
  function checkPointerDown(e) {
    if (container.contains(e.target)) return;
    if (config.clickOutsideDeactivates) {
      deactivate({
        returnFocus: !tabbable_1.isFocusable(e.target)
      });
    } else {
      e.preventDefault();
    }
  }

  // In case focus escapes the trap for some strange reason, pull it back in.
  function checkFocusIn(e) {
    // In Firefox when you Tab out of an iframe the Document is briefly focused.
    if (container.contains(e.target) || e.target instanceof Document) {
      return;
    }
    e.stopImmediatePropagation();
    tryFocus(state.mostRecentlyFocusedNode || getInitialFocusNode());
  }

  function checkKey(e) {
    if (config.escapeDeactivates !== false && isEscapeEvent(e)) {
      e.preventDefault();
      deactivate();
      return;
    }
    if (isTabEvent(e)) {
      checkTab(e);
      return;
    }
  }

  // Hijack Tab events on the first and last focusable nodes of the trap,
  // in order to prevent focus from escaping. If it escapes for even a
  // moment it can end up scrolling the page and causing confusion so we
  // kind of need to capture the action at the keydown phase.
  function checkTab(e) {
    updateTabbableNodes();
    if (e.shiftKey && e.target === state.firstTabbableNode) {
      e.preventDefault();
      tryFocus(state.lastTabbableNode);
      return;
    }
    if (!e.shiftKey && e.target === state.lastTabbableNode) {
      e.preventDefault();
      tryFocus(state.firstTabbableNode);
      return;
    }
  }

  function checkClick(e) {
    if (config.clickOutsideDeactivates) return;
    if (container.contains(e.target)) return;
    e.preventDefault();
    e.stopImmediatePropagation();
  }

  function updateTabbableNodes() {
    var tabbableNodes = tabbable_1(container);
    state.firstTabbableNode = tabbableNodes[0] || getInitialFocusNode();
    state.lastTabbableNode =
      tabbableNodes[tabbableNodes.length - 1] || getInitialFocusNode();
  }

  function tryFocus(node) {
    if (node === doc.activeElement) return;
    if (!node || !node.focus) {
      tryFocus(getInitialFocusNode());
      return;
    }

    node.focus();
    state.mostRecentlyFocusedNode = node;
    if (isSelectableInput(node)) {
      node.select();
    }
  }
}

function isSelectableInput(node) {
  return (
    node.tagName &&
    node.tagName.toLowerCase() === 'input' &&
    typeof node.select === 'function'
  );
}

function isEscapeEvent(e) {
  return e.key === 'Escape' || e.key === 'Esc' || e.keyCode === 27;
}

function isTabEvent(e) {
  return e.key === 'Tab' || e.keyCode === 9;
}

function delay(fn) {
  return setTimeout(fn, 0);
}

var focusTrap_1 = focusTrap;/**
 * @license
 * Copyright 2016 Google Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */
function createFocusTrapInstance(surfaceEl, focusTrapFactory) {
    if (focusTrapFactory === void 0) { focusTrapFactory = focusTrap_1; }
    return focusTrapFactory(surfaceEl, {
        clickOutsideDeactivates: true,
        escapeDeactivates: false,
        initialFocus: undefined,
        returnFocusOnDeactivate: false,
    });
}/*! *****************************************************************************
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the Apache License, Version 2.0 (the "License"); you may not use
this file except in compliance with the License. You may obtain a copy of the
License at http://www.apache.org/licenses/LICENSE-2.0

THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
MERCHANTABLITY OR NON-INFRINGEMENT.

See the Apache Version 2.0 License for specific language governing permissions
and limitations under the License.
***************************************************************************** */
/* global Reflect, Promise */

var extendStatics = function(d, b) {
    extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return extendStatics(d, b);
};

function __extends(d, b) {
    extendStatics(d, b);
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
}

var __assign = function() {
    __assign = Object.assign || function __assign(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};

function __read(o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
}

function __spread() {
    for (var ar = [], i = 0; i < arguments.length; i++)
        ar = ar.concat(__read(arguments[i]));
    return ar;
}/**
 * @license
 * Copyright 2016 Google Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */
var MDCFoundation = /** @class */ (function () {
    function MDCFoundation(adapter) {
        if (adapter === void 0) { adapter = {}; }
        this.adapter_ = adapter;
    }
    Object.defineProperty(MDCFoundation, "cssClasses", {
        get: function () {
            // Classes extending MDCFoundation should implement this method to return an object which exports every
            // CSS class the foundation class needs as a property. e.g. {ACTIVE: 'mdc-component--active'}
            return {};
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MDCFoundation, "strings", {
        get: function () {
            // Classes extending MDCFoundation should implement this method to return an object which exports all
            // semantic strings as constants. e.g. {ARIA_ROLE: 'tablist'}
            return {};
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MDCFoundation, "numbers", {
        get: function () {
            // Classes extending MDCFoundation should implement this method to return an object which exports all
            // of its semantic numbers as constants. e.g. {ANIMATION_DELAY_MS: 350}
            return {};
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MDCFoundation, "defaultAdapter", {
        get: function () {
            // Classes extending MDCFoundation may choose to implement this getter in order to provide a convenient
            // way of viewing the necessary methods of an adapter. In the future, this could also be used for adapter
            // validation.
            return {};
        },
        enumerable: true,
        configurable: true
    });
    MDCFoundation.prototype.init = function () {
        // Subclasses should override this method to perform initialization routines (registering events, etc.)
    };
    MDCFoundation.prototype.destroy = function () {
        // Subclasses should override this method to perform de-initialization routines (de-registering events, etc.)
    };
    return MDCFoundation;
}());/**
 * @license
 * Copyright 2016 Google Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */
var MDCComponent = /** @class */ (function () {
    function MDCComponent(root, foundation) {
        var args = [];
        for (var _i = 2; _i < arguments.length; _i++) {
            args[_i - 2] = arguments[_i];
        }
        this.root_ = root;
        this.initialize.apply(this, __spread(args));
        // Note that we initialize foundation here and not within the constructor's default param so that
        // this.root_ is defined and can be used within the foundation class.
        this.foundation_ = foundation === undefined ? this.getDefaultFoundation() : foundation;
        this.foundation_.init();
        this.initialSyncWithDOM();
    }
    MDCComponent.attachTo = function (root) {
        // Subclasses which extend MDCBase should provide an attachTo() method that takes a root element and
        // returns an instantiated component with its root set to that element. Also note that in the cases of
        // subclasses, an explicit foundation class will not have to be passed in; it will simply be initialized
        // from getDefaultFoundation().
        return new MDCComponent(root, new MDCFoundation({}));
    };
    /* istanbul ignore next: method param only exists for typing purposes; it does not need to be unit tested */
    MDCComponent.prototype.initialize = function () {
        var _args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            _args[_i] = arguments[_i];
        }
        // Subclasses can override this to do any additional setup work that would be considered part of a
        // "constructor". Essentially, it is a hook into the parent constructor before the foundation is
        // initialized. Any additional arguments besides root and foundation will be passed in here.
    };
    MDCComponent.prototype.getDefaultFoundation = function () {
        // Subclasses must override this method to return a properly configured foundation class for the
        // component.
        throw new Error('Subclasses must override getDefaultFoundation to return a properly configured ' +
            'foundation class');
    };
    MDCComponent.prototype.initialSyncWithDOM = function () {
        // Subclasses should override this method if they need to perform work to synchronize with a host DOM
        // object. An example of this would be a form control wrapper that needs to synchronize its internal state
        // to some property or attribute of the host DOM. Please note: this is *not* the place to perform DOM
        // reads/writes that would cause layout / paint, as this is called synchronously from within the constructor.
    };
    MDCComponent.prototype.destroy = function () {
        // Subclasses may implement this method to release any resources / deregister any listeners they have
        // attached. An example of this might be deregistering a resize event from the window object.
        this.foundation_.destroy();
    };
    MDCComponent.prototype.listen = function (evtType, handler) {
        this.root_.addEventListener(evtType, handler);
    };
    MDCComponent.prototype.unlisten = function (evtType, handler) {
        this.root_.removeEventListener(evtType, handler);
    };
    /**
     * Fires a cross-browser-compatible custom event from the component root of the given type, with the given data.
     */
    MDCComponent.prototype.emit = function (evtType, evtData, shouldBubble) {
        if (shouldBubble === void 0) { shouldBubble = false; }
        var evt;
        if (typeof CustomEvent === 'function') {
            evt = new CustomEvent(evtType, {
                bubbles: shouldBubble,
                detail: evtData,
            });
        }
        else {
            evt = document.createEvent('CustomEvent');
            evt.initCustomEvent(evtType, shouldBubble, false, evtData);
        }
        this.root_.dispatchEvent(evt);
    };
    return MDCComponent;
}());/**
 * @license
 * Copyright 2018 Google Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */
/**
 * @fileoverview A "ponyfill" is a polyfill that doesn't modify the global prototype chain.
 * This makes ponyfills safer than traditional polyfills, especially for libraries like MDC.
 */
function closest(element, selector) {
    if (element.closest) {
        return element.closest(selector);
    }
    var el = element;
    while (el) {
        if (matches$1(el, selector)) {
            return el;
        }
        el = el.parentElement;
    }
    return null;
}
function matches$1(element, selector) {
    var nativeMatches = element.matches
        || element.webkitMatchesSelector
        || element.msMatchesSelector;
    return nativeMatches.call(element, selector);
}/**
 * @license
 * Copyright 2018 Google Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */
var cssClasses = {
    LIST_ITEM_ACTIVATED_CLASS: 'mdc-list-item--activated',
    LIST_ITEM_CLASS: 'mdc-list-item',
    LIST_ITEM_DISABLED_CLASS: 'mdc-list-item--disabled',
    LIST_ITEM_SELECTED_CLASS: 'mdc-list-item--selected',
    ROOT: 'mdc-list',
};
var strings = {
    ACTION_EVENT: 'MDCList:action',
    ARIA_CHECKED: 'aria-checked',
    ARIA_CHECKED_CHECKBOX_SELECTOR: '[role="checkbox"][aria-checked="true"]',
    ARIA_CHECKED_RADIO_SELECTOR: '[role="radio"][aria-checked="true"]',
    ARIA_CURRENT: 'aria-current',
    ARIA_ORIENTATION: 'aria-orientation',
    ARIA_ORIENTATION_HORIZONTAL: 'horizontal',
    ARIA_ROLE_CHECKBOX_SELECTOR: '[role="checkbox"]',
    ARIA_SELECTED: 'aria-selected',
    CHECKBOX_RADIO_SELECTOR: 'input[type="checkbox"]:not(:disabled), input[type="radio"]:not(:disabled)',
    CHECKBOX_SELECTOR: 'input[type="checkbox"]:not(:disabled)',
    CHILD_ELEMENTS_TO_TOGGLE_TABINDEX: "\n    ." + cssClasses.LIST_ITEM_CLASS + " button:not(:disabled),\n    ." + cssClasses.LIST_ITEM_CLASS + " a\n  ",
    FOCUSABLE_CHILD_ELEMENTS: "\n    ." + cssClasses.LIST_ITEM_CLASS + " button:not(:disabled),\n    ." + cssClasses.LIST_ITEM_CLASS + " a,\n    ." + cssClasses.LIST_ITEM_CLASS + " input[type=\"radio\"]:not(:disabled),\n    ." + cssClasses.LIST_ITEM_CLASS + " input[type=\"checkbox\"]:not(:disabled)\n  ",
    RADIO_SELECTOR: 'input[type="radio"]:not(:disabled)',
};
var numbers = {
    UNSET_INDEX: -1,
};/**
 * @license
 * Copyright 2018 Google Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */
var ELEMENTS_KEY_ALLOWED_IN = ['input', 'button', 'textarea', 'select'];
function isNumberArray(selectedIndex) {
    return selectedIndex instanceof Array;
}
var MDCListFoundation = /** @class */ (function (_super) {
    __extends(MDCListFoundation, _super);
    function MDCListFoundation(adapter) {
        var _this = _super.call(this, __assign({}, MDCListFoundation.defaultAdapter, adapter)) || this;
        _this.wrapFocus_ = false;
        _this.isVertical_ = true;
        _this.isSingleSelectionList_ = false;
        _this.selectedIndex_ = numbers.UNSET_INDEX;
        _this.focusedItemIndex_ = numbers.UNSET_INDEX;
        _this.useActivatedClass_ = false;
        _this.ariaCurrentAttrValue_ = null;
        _this.isCheckboxList_ = false;
        _this.isRadioList_ = false;
        return _this;
    }
    Object.defineProperty(MDCListFoundation, "strings", {
        get: function () {
            return strings;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MDCListFoundation, "cssClasses", {
        get: function () {
            return cssClasses;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MDCListFoundation, "numbers", {
        get: function () {
            return numbers;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MDCListFoundation, "defaultAdapter", {
        get: function () {
            return {
                addClassForElementIndex: function () { return undefined; },
                focusItemAtIndex: function () { return undefined; },
                getAttributeForElementIndex: function () { return null; },
                getFocusedElementIndex: function () { return 0; },
                getListItemCount: function () { return 0; },
                hasCheckboxAtIndex: function () { return false; },
                hasRadioAtIndex: function () { return false; },
                isCheckboxCheckedAtIndex: function () { return false; },
                isFocusInsideList: function () { return false; },
                isRootFocused: function () { return false; },
                notifyAction: function () { return undefined; },
                removeClassForElementIndex: function () { return undefined; },
                setAttributeForElementIndex: function () { return undefined; },
                setCheckedCheckboxOrRadioAtIndex: function () { return undefined; },
                setTabIndexForListItemChildren: function () { return undefined; },
            };
        },
        enumerable: true,
        configurable: true
    });
    MDCListFoundation.prototype.layout = function () {
        if (this.adapter_.getListItemCount() === 0) {
            return;
        }
        if (this.adapter_.hasCheckboxAtIndex(0)) {
            this.isCheckboxList_ = true;
        }
        else if (this.adapter_.hasRadioAtIndex(0)) {
            this.isRadioList_ = true;
        }
    };
    /**
     * Sets the private wrapFocus_ variable.
     */
    MDCListFoundation.prototype.setWrapFocus = function (value) {
        this.wrapFocus_ = value;
    };
    /**
     * Sets the isVertical_ private variable.
     */
    MDCListFoundation.prototype.setVerticalOrientation = function (value) {
        this.isVertical_ = value;
    };
    /**
     * Sets the isSingleSelectionList_ private variable.
     */
    MDCListFoundation.prototype.setSingleSelection = function (value) {
        this.isSingleSelectionList_ = value;
    };
    /**
     * Sets the useActivatedClass_ private variable.
     */
    MDCListFoundation.prototype.setUseActivatedClass = function (useActivated) {
        this.useActivatedClass_ = useActivated;
    };
    MDCListFoundation.prototype.getSelectedIndex = function () {
        return this.selectedIndex_;
    };
    MDCListFoundation.prototype.setSelectedIndex = function (index) {
        if (!this.isIndexValid_(index)) {
            return;
        }
        if (this.isCheckboxList_) {
            this.setCheckboxAtIndex_(index);
        }
        else if (this.isRadioList_) {
            this.setRadioAtIndex_(index);
        }
        else {
            this.setSingleSelectionAtIndex_(index);
        }
    };
    /**
     * Focus in handler for the list items.
     */
    MDCListFoundation.prototype.handleFocusIn = function (_, listItemIndex) {
        if (listItemIndex >= 0) {
            this.adapter_.setTabIndexForListItemChildren(listItemIndex, '0');
        }
    };
    /**
     * Focus out handler for the list items.
     */
    MDCListFoundation.prototype.handleFocusOut = function (_, listItemIndex) {
        var _this = this;
        if (listItemIndex >= 0) {
            this.adapter_.setTabIndexForListItemChildren(listItemIndex, '-1');
        }
        /**
         * Between Focusout & Focusin some browsers do not have focus on any element. Setting a delay to wait till the focus
         * is moved to next element.
         */
        setTimeout(function () {
            if (!_this.adapter_.isFocusInsideList()) {
                _this.setTabindexToFirstSelectedItem_();
            }
        }, 0);
    };
    /**
     * Key handler for the list.
     */
    MDCListFoundation.prototype.handleKeydown = function (evt, isRootListItem, listItemIndex) {
        var isArrowLeft = evt.key === 'ArrowLeft' || evt.keyCode === 37;
        var isArrowUp = evt.key === 'ArrowUp' || evt.keyCode === 38;
        var isArrowRight = evt.key === 'ArrowRight' || evt.keyCode === 39;
        var isArrowDown = evt.key === 'ArrowDown' || evt.keyCode === 40;
        var isHome = evt.key === 'Home' || evt.keyCode === 36;
        var isEnd = evt.key === 'End' || evt.keyCode === 35;
        var isEnter = evt.key === 'Enter' || evt.keyCode === 13;
        var isSpace = evt.key === 'Space' || evt.keyCode === 32;
        if (this.adapter_.isRootFocused()) {
            if (isArrowUp || isEnd) {
                evt.preventDefault();
                this.focusLastElement();
            }
            else if (isArrowDown || isHome) {
                evt.preventDefault();
                this.focusFirstElement();
            }
            return;
        }
        var currentIndex = this.adapter_.getFocusedElementIndex();
        if (currentIndex === -1) {
            currentIndex = listItemIndex;
            if (currentIndex < 0) {
                // If this event doesn't have a mdc-list-item ancestor from the
                // current list (not from a sublist), return early.
                return;
            }
        }
        var nextIndex;
        if ((this.isVertical_ && isArrowDown) || (!this.isVertical_ && isArrowRight)) {
            this.preventDefaultEvent_(evt);
            nextIndex = this.focusNextElement(currentIndex);
        }
        else if ((this.isVertical_ && isArrowUp) || (!this.isVertical_ && isArrowLeft)) {
            this.preventDefaultEvent_(evt);
            nextIndex = this.focusPrevElement(currentIndex);
        }
        else if (isHome) {
            this.preventDefaultEvent_(evt);
            nextIndex = this.focusFirstElement();
        }
        else if (isEnd) {
            this.preventDefaultEvent_(evt);
            nextIndex = this.focusLastElement();
        }
        else if (isEnter || isSpace) {
            if (isRootListItem) {
                // Return early if enter key is pressed on anchor element which triggers synthetic MouseEvent event.
                var target = evt.target;
                if (target && target.tagName === 'A' && isEnter) {
                    return;
                }
                this.preventDefaultEvent_(evt);
                if (this.isSelectableList_()) {
                    this.setSelectedIndexOnAction_(currentIndex);
                }
                this.adapter_.notifyAction(currentIndex);
            }
        }
        this.focusedItemIndex_ = currentIndex;
        if (nextIndex !== undefined) {
            this.setTabindexAtIndex_(nextIndex);
            this.focusedItemIndex_ = nextIndex;
        }
    };
    /**
     * Click handler for the list.
     */
    MDCListFoundation.prototype.handleClick = function (index, toggleCheckbox) {
        if (index === numbers.UNSET_INDEX) {
            return;
        }
        if (this.isSelectableList_()) {
            this.setSelectedIndexOnAction_(index, toggleCheckbox);
        }
        this.adapter_.notifyAction(index);
        this.setTabindexAtIndex_(index);
        this.focusedItemIndex_ = index;
    };
    /**
     * Focuses the next element on the list.
     */
    MDCListFoundation.prototype.focusNextElement = function (index) {
        var count = this.adapter_.getListItemCount();
        var nextIndex = index + 1;
        if (nextIndex >= count) {
            if (this.wrapFocus_) {
                nextIndex = 0;
            }
            else {
                // Return early because last item is already focused.
                return index;
            }
        }
        this.adapter_.focusItemAtIndex(nextIndex);
        return nextIndex;
    };
    /**
     * Focuses the previous element on the list.
     */
    MDCListFoundation.prototype.focusPrevElement = function (index) {
        var prevIndex = index - 1;
        if (prevIndex < 0) {
            if (this.wrapFocus_) {
                prevIndex = this.adapter_.getListItemCount() - 1;
            }
            else {
                // Return early because first item is already focused.
                return index;
            }
        }
        this.adapter_.focusItemAtIndex(prevIndex);
        return prevIndex;
    };
    MDCListFoundation.prototype.focusFirstElement = function () {
        this.adapter_.focusItemAtIndex(0);
        return 0;
    };
    MDCListFoundation.prototype.focusLastElement = function () {
        var lastIndex = this.adapter_.getListItemCount() - 1;
        this.adapter_.focusItemAtIndex(lastIndex);
        return lastIndex;
    };
    /**
     * Ensures that preventDefault is only called if the containing element doesn't
     * consume the event, and it will cause an unintended scroll.
     */
    MDCListFoundation.prototype.preventDefaultEvent_ = function (evt) {
        var target = evt.target;
        var tagName = ("" + target.tagName).toLowerCase();
        if (ELEMENTS_KEY_ALLOWED_IN.indexOf(tagName) === -1) {
            evt.preventDefault();
        }
    };
    MDCListFoundation.prototype.setSingleSelectionAtIndex_ = function (index) {
        if (this.selectedIndex_ === index) {
            return;
        }
        var selectedClassName = cssClasses.LIST_ITEM_SELECTED_CLASS;
        if (this.useActivatedClass_) {
            selectedClassName = cssClasses.LIST_ITEM_ACTIVATED_CLASS;
        }
        if (this.selectedIndex_ !== numbers.UNSET_INDEX) {
            this.adapter_.removeClassForElementIndex(this.selectedIndex_, selectedClassName);
        }
        this.adapter_.addClassForElementIndex(index, selectedClassName);
        this.setAriaForSingleSelectionAtIndex_(index);
        this.selectedIndex_ = index;
    };
    /**
     * Sets aria attribute for single selection at given index.
     */
    MDCListFoundation.prototype.setAriaForSingleSelectionAtIndex_ = function (index) {
        // Detect the presence of aria-current and get the value only during list initialization when it is in unset state.
        if (this.selectedIndex_ === numbers.UNSET_INDEX) {
            this.ariaCurrentAttrValue_ =
                this.adapter_.getAttributeForElementIndex(index, strings.ARIA_CURRENT);
        }
        var isAriaCurrent = this.ariaCurrentAttrValue_ !== null;
        var ariaAttribute = isAriaCurrent ? strings.ARIA_CURRENT : strings.ARIA_SELECTED;
        if (this.selectedIndex_ !== numbers.UNSET_INDEX) {
            this.adapter_.setAttributeForElementIndex(this.selectedIndex_, ariaAttribute, 'false');
        }
        var ariaAttributeValue = isAriaCurrent ? this.ariaCurrentAttrValue_ : 'true';
        this.adapter_.setAttributeForElementIndex(index, ariaAttribute, ariaAttributeValue);
    };
    /**
     * Toggles radio at give index. Radio doesn't change the checked state if it is already checked.
     */
    MDCListFoundation.prototype.setRadioAtIndex_ = function (index) {
        this.adapter_.setCheckedCheckboxOrRadioAtIndex(index, true);
        if (this.selectedIndex_ !== numbers.UNSET_INDEX) {
            this.adapter_.setAttributeForElementIndex(this.selectedIndex_, strings.ARIA_CHECKED, 'false');
        }
        this.adapter_.setAttributeForElementIndex(index, strings.ARIA_CHECKED, 'true');
        this.selectedIndex_ = index;
    };
    MDCListFoundation.prototype.setCheckboxAtIndex_ = function (index) {
        for (var i = 0; i < this.adapter_.getListItemCount(); i++) {
            var isChecked = false;
            if (index.indexOf(i) >= 0) {
                isChecked = true;
            }
            this.adapter_.setCheckedCheckboxOrRadioAtIndex(i, isChecked);
            this.adapter_.setAttributeForElementIndex(i, strings.ARIA_CHECKED, isChecked ? 'true' : 'false');
        }
        this.selectedIndex_ = index;
    };
    MDCListFoundation.prototype.setTabindexAtIndex_ = function (index) {
        if (this.focusedItemIndex_ === numbers.UNSET_INDEX && index !== 0) {
            // If no list item was selected set first list item's tabindex to -1.
            // Generally, tabindex is set to 0 on first list item of list that has no preselected items.
            this.adapter_.setAttributeForElementIndex(0, 'tabindex', '-1');
        }
        else if (this.focusedItemIndex_ >= 0 && this.focusedItemIndex_ !== index) {
            this.adapter_.setAttributeForElementIndex(this.focusedItemIndex_, 'tabindex', '-1');
        }
        this.adapter_.setAttributeForElementIndex(index, 'tabindex', '0');
    };
    /**
     * @return Return true if it is single selectin list, checkbox list or radio list.
     */
    MDCListFoundation.prototype.isSelectableList_ = function () {
        return this.isSingleSelectionList_ || this.isCheckboxList_ || this.isRadioList_;
    };
    MDCListFoundation.prototype.setTabindexToFirstSelectedItem_ = function () {
        var targetIndex = 0;
        if (this.isSelectableList_()) {
            if (typeof this.selectedIndex_ === 'number' && this.selectedIndex_ !== numbers.UNSET_INDEX) {
                targetIndex = this.selectedIndex_;
            }
            else if (isNumberArray(this.selectedIndex_) && this.selectedIndex_.length > 0) {
                targetIndex = this.selectedIndex_.reduce(function (currentIndex, minIndex) { return Math.min(currentIndex, minIndex); });
            }
        }
        this.setTabindexAtIndex_(targetIndex);
    };
    MDCListFoundation.prototype.isIndexValid_ = function (index) {
        var _this = this;
        if (index instanceof Array) {
            if (!this.isCheckboxList_) {
                throw new Error('MDCListFoundation: Array of index is only supported for checkbox based list');
            }
            if (index.length === 0) {
                return true;
            }
            else {
                return index.some(function (i) { return _this.isIndexInRange_(i); });
            }
        }
        else if (typeof index === 'number') {
            if (this.isCheckboxList_) {
                throw new Error('MDCListFoundation: Expected array of index for checkbox based list but got number: ' + index);
            }
            return this.isIndexInRange_(index);
        }
        else {
            return false;
        }
    };
    MDCListFoundation.prototype.isIndexInRange_ = function (index) {
        var listSize = this.adapter_.getListItemCount();
        return index >= 0 && index < listSize;
    };
    MDCListFoundation.prototype.setSelectedIndexOnAction_ = function (index, toggleCheckbox) {
        if (toggleCheckbox === void 0) { toggleCheckbox = true; }
        if (this.isCheckboxList_) {
            this.toggleCheckboxAtIndex_(index, toggleCheckbox);
        }
        else {
            this.setSelectedIndex(index);
        }
    };
    MDCListFoundation.prototype.toggleCheckboxAtIndex_ = function (index, toggleCheckbox) {
        var isChecked = this.adapter_.isCheckboxCheckedAtIndex(index);
        if (toggleCheckbox) {
            isChecked = !isChecked;
            this.adapter_.setCheckedCheckboxOrRadioAtIndex(index, isChecked);
        }
        this.adapter_.setAttributeForElementIndex(index, strings.ARIA_CHECKED, isChecked ? 'true' : 'false');
        // If none of the checkbox items are selected and selectedIndex is not initialized then provide a default value.
        var selectedIndexes = this.selectedIndex_ === numbers.UNSET_INDEX ? [] : this.selectedIndex_.slice();
        if (isChecked) {
            selectedIndexes.push(index);
        }
        else {
            selectedIndexes = selectedIndexes.filter(function (i) { return i !== index; });
        }
        this.selectedIndex_ = selectedIndexes;
    };
    return MDCListFoundation;
}(MDCFoundation));/**
 * @license
 * Copyright 2018 Google Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */
var MDCList = /** @class */ (function (_super) {
    __extends(MDCList, _super);
    function MDCList() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Object.defineProperty(MDCList.prototype, "vertical", {
        set: function (value) {
            this.foundation_.setVerticalOrientation(value);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MDCList.prototype, "listElements", {
        get: function () {
            return [].slice.call(this.root_.querySelectorAll("." + cssClasses.LIST_ITEM_CLASS));
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MDCList.prototype, "wrapFocus", {
        set: function (value) {
            this.foundation_.setWrapFocus(value);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MDCList.prototype, "singleSelection", {
        set: function (isSingleSelectionList) {
            this.foundation_.setSingleSelection(isSingleSelectionList);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MDCList.prototype, "selectedIndex", {
        get: function () {
            return this.foundation_.getSelectedIndex();
        },
        set: function (index) {
            this.foundation_.setSelectedIndex(index);
        },
        enumerable: true,
        configurable: true
    });
    MDCList.attachTo = function (root) {
        return new MDCList(root);
    };
    MDCList.prototype.initialSyncWithDOM = function () {
        this.handleClick_ = this.handleClickEvent_.bind(this);
        this.handleKeydown_ = this.handleKeydownEvent_.bind(this);
        this.focusInEventListener_ = this.handleFocusInEvent_.bind(this);
        this.focusOutEventListener_ = this.handleFocusOutEvent_.bind(this);
        this.listen('keydown', this.handleKeydown_);
        this.listen('click', this.handleClick_);
        this.listen('focusin', this.focusInEventListener_);
        this.listen('focusout', this.focusOutEventListener_);
        this.layout();
        this.initializeListType();
    };
    MDCList.prototype.destroy = function () {
        this.unlisten('keydown', this.handleKeydown_);
        this.unlisten('click', this.handleClick_);
        this.unlisten('focusin', this.focusInEventListener_);
        this.unlisten('focusout', this.focusOutEventListener_);
    };
    MDCList.prototype.layout = function () {
        var direction = this.root_.getAttribute(strings.ARIA_ORIENTATION);
        this.vertical = direction !== strings.ARIA_ORIENTATION_HORIZONTAL;
        // List items need to have at least tabindex=-1 to be focusable.
        [].slice.call(this.root_.querySelectorAll('.mdc-list-item:not([tabindex])'))
            .forEach(function (el) {
            el.setAttribute('tabindex', '-1');
        });
        // Child button/a elements are not tabbable until the list item is focused.
        [].slice.call(this.root_.querySelectorAll(strings.FOCUSABLE_CHILD_ELEMENTS))
            .forEach(function (el) { return el.setAttribute('tabindex', '-1'); });
        this.foundation_.layout();
    };
    /**
     * Initialize selectedIndex value based on pre-selected checkbox list items, single selection or radio.
     */
    MDCList.prototype.initializeListType = function () {
        var _this = this;
        var checkboxListItems = this.root_.querySelectorAll(strings.ARIA_ROLE_CHECKBOX_SELECTOR);
        var singleSelectedListItem = this.root_.querySelector("\n      ." + cssClasses.LIST_ITEM_ACTIVATED_CLASS + ",\n      ." + cssClasses.LIST_ITEM_SELECTED_CLASS + "\n    ");
        var radioSelectedListItem = this.root_.querySelector(strings.ARIA_CHECKED_RADIO_SELECTOR);
        if (checkboxListItems.length) {
            var preselectedItems = this.root_.querySelectorAll(strings.ARIA_CHECKED_CHECKBOX_SELECTOR);
            this.selectedIndex =
                [].map.call(preselectedItems, function (listItem) { return _this.listElements.indexOf(listItem); });
        }
        else if (singleSelectedListItem) {
            if (singleSelectedListItem.classList.contains(cssClasses.LIST_ITEM_ACTIVATED_CLASS)) {
                this.foundation_.setUseActivatedClass(true);
            }
            this.singleSelection = true;
            this.selectedIndex = this.listElements.indexOf(singleSelectedListItem);
        }
        else if (radioSelectedListItem) {
            this.selectedIndex = this.listElements.indexOf(radioSelectedListItem);
        }
    };
    MDCList.prototype.getDefaultFoundation = function () {
        var _this = this;
        // DO NOT INLINE this variable. For backward compatibility, foundations take a Partial<MDCFooAdapter>.
        // To ensure we don't accidentally omit any methods, we need a separate, strongly typed adapter variable.
        var adapter = {
            addClassForElementIndex: function (index, className) {
                var element = _this.listElements[index];
                if (element) {
                    element.classList.add(className);
                }
            },
            focusItemAtIndex: function (index) {
                var element = _this.listElements[index];
                if (element) {
                    element.focus();
                }
            },
            getAttributeForElementIndex: function (index, attr) { return _this.listElements[index].getAttribute(attr); },
            getFocusedElementIndex: function () { return _this.listElements.indexOf(document.activeElement); },
            getListItemCount: function () { return _this.listElements.length; },
            hasCheckboxAtIndex: function (index) {
                var listItem = _this.listElements[index];
                return !!listItem.querySelector(strings.CHECKBOX_SELECTOR);
            },
            hasRadioAtIndex: function (index) {
                var listItem = _this.listElements[index];
                return !!listItem.querySelector(strings.RADIO_SELECTOR);
            },
            isCheckboxCheckedAtIndex: function (index) {
                var listItem = _this.listElements[index];
                var toggleEl = listItem.querySelector(strings.CHECKBOX_SELECTOR);
                return toggleEl.checked;
            },
            isFocusInsideList: function () {
                return _this.root_.contains(document.activeElement);
            },
            isRootFocused: function () { return document.activeElement === _this.root_; },
            notifyAction: function (index) {
                _this.emit(strings.ACTION_EVENT, { index: index }, /** shouldBubble */ true);
            },
            removeClassForElementIndex: function (index, className) {
                var element = _this.listElements[index];
                if (element) {
                    element.classList.remove(className);
                }
            },
            setAttributeForElementIndex: function (index, attr, value) {
                var element = _this.listElements[index];
                if (element) {
                    element.setAttribute(attr, value);
                }
            },
            setCheckedCheckboxOrRadioAtIndex: function (index, isChecked) {
                var listItem = _this.listElements[index];
                var toggleEl = listItem.querySelector(strings.CHECKBOX_RADIO_SELECTOR);
                toggleEl.checked = isChecked;
                var event = document.createEvent('Event');
                event.initEvent('change', true, true);
                toggleEl.dispatchEvent(event);
            },
            setTabIndexForListItemChildren: function (listItemIndex, tabIndexValue) {
                var element = _this.listElements[listItemIndex];
                var listItemChildren = [].slice.call(element.querySelectorAll(strings.CHILD_ELEMENTS_TO_TOGGLE_TABINDEX));
                listItemChildren.forEach(function (el) { return el.setAttribute('tabindex', tabIndexValue); });
            },
        };
        return new MDCListFoundation(adapter);
    };
    /**
     * Used to figure out which list item this event is targetting. Or returns -1 if
     * there is no list item
     */
    MDCList.prototype.getListItemIndex_ = function (evt) {
        var eventTarget = evt.target;
        var nearestParent = closest(eventTarget, "." + cssClasses.LIST_ITEM_CLASS + ", ." + cssClasses.ROOT);
        // Get the index of the element if it is a list item.
        if (nearestParent && matches$1(nearestParent, "." + cssClasses.LIST_ITEM_CLASS)) {
            return this.listElements.indexOf(nearestParent);
        }
        return -1;
    };
    /**
     * Used to figure out which element was clicked before sending the event to the foundation.
     */
    MDCList.prototype.handleFocusInEvent_ = function (evt) {
        var index = this.getListItemIndex_(evt);
        this.foundation_.handleFocusIn(evt, index);
    };
    /**
     * Used to figure out which element was clicked before sending the event to the foundation.
     */
    MDCList.prototype.handleFocusOutEvent_ = function (evt) {
        var index = this.getListItemIndex_(evt);
        this.foundation_.handleFocusOut(evt, index);
    };
    /**
     * Used to figure out which element was focused when keydown event occurred before sending the event to the
     * foundation.
     */
    MDCList.prototype.handleKeydownEvent_ = function (evt) {
        var index = this.getListItemIndex_(evt);
        var target = evt.target;
        this.foundation_.handleKeydown(evt, target.classList.contains(cssClasses.LIST_ITEM_CLASS), index);
    };
    /**
     * Used to figure out which element was clicked before sending the event to the foundation.
     */
    MDCList.prototype.handleClickEvent_ = function (evt) {
        var index = this.getListItemIndex_(evt);
        var target = evt.target;
        // Toggle the checkbox only if it's not the target of the event, or the checkbox will have 2 change events.
        var toggleCheckbox = !matches$1(target, strings.CHECKBOX_RADIO_SELECTOR);
        this.foundation_.handleClick(index, toggleCheckbox);
    };
    return MDCList;
}(MDCComponent));/**
 * @license
 * Copyright 2016 Google Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */
var cssClasses$1 = {
    ANIMATE: 'mdc-drawer--animate',
    CLOSING: 'mdc-drawer--closing',
    DISMISSIBLE: 'mdc-drawer--dismissible',
    MODAL: 'mdc-drawer--modal',
    OPEN: 'mdc-drawer--open',
    OPENING: 'mdc-drawer--opening',
    ROOT: 'mdc-drawer',
};
var strings$1 = {
    APP_CONTENT_SELECTOR: '.mdc-drawer-app-content',
    CLOSE_EVENT: 'MDCDrawer:closed',
    OPEN_EVENT: 'MDCDrawer:opened',
    SCRIM_SELECTOR: '.mdc-drawer-scrim',
};/**
 * @license
 * Copyright 2018 Google Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */
var MDCDismissibleDrawerFoundation = /** @class */ (function (_super) {
    __extends(MDCDismissibleDrawerFoundation, _super);
    function MDCDismissibleDrawerFoundation(adapter) {
        var _this = _super.call(this, __assign({}, MDCDismissibleDrawerFoundation.defaultAdapter, adapter)) || this;
        _this.animationFrame_ = 0;
        _this.animationTimer_ = 0;
        return _this;
    }
    Object.defineProperty(MDCDismissibleDrawerFoundation, "strings", {
        get: function () {
            return strings$1;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MDCDismissibleDrawerFoundation, "cssClasses", {
        get: function () {
            return cssClasses$1;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MDCDismissibleDrawerFoundation, "defaultAdapter", {
        get: function () {
            // tslint:disable:object-literal-sort-keys Methods should be in the same order as the adapter interface.
            return {
                addClass: function () { return undefined; },
                removeClass: function () { return undefined; },
                hasClass: function () { return false; },
                elementHasClass: function () { return false; },
                notifyClose: function () { return undefined; },
                notifyOpen: function () { return undefined; },
                saveFocus: function () { return undefined; },
                restoreFocus: function () { return undefined; },
                focusActiveNavigationItem: function () { return undefined; },
                trapFocus: function () { return undefined; },
                releaseFocus: function () { return undefined; },
            };
            // tslint:enable:object-literal-sort-keys
        },
        enumerable: true,
        configurable: true
    });
    MDCDismissibleDrawerFoundation.prototype.destroy = function () {
        if (this.animationFrame_) {
            cancelAnimationFrame(this.animationFrame_);
        }
        if (this.animationTimer_) {
            clearTimeout(this.animationTimer_);
        }
    };
    MDCDismissibleDrawerFoundation.prototype.open = function () {
        var _this = this;
        if (this.isOpen() || this.isOpening() || this.isClosing()) {
            return;
        }
        this.adapter_.addClass(cssClasses$1.OPEN);
        this.adapter_.addClass(cssClasses$1.ANIMATE);
        // Wait a frame once display is no longer "none", to establish basis for animation
        this.runNextAnimationFrame_(function () {
            _this.adapter_.addClass(cssClasses$1.OPENING);
        });
        this.adapter_.saveFocus();
    };
    MDCDismissibleDrawerFoundation.prototype.close = function () {
        if (!this.isOpen() || this.isOpening() || this.isClosing()) {
            return;
        }
        this.adapter_.addClass(cssClasses$1.CLOSING);
    };
    /**
     * @return true if drawer is in open state.
     */
    MDCDismissibleDrawerFoundation.prototype.isOpen = function () {
        return this.adapter_.hasClass(cssClasses$1.OPEN);
    };
    /**
     * @return true if drawer is animating open.
     */
    MDCDismissibleDrawerFoundation.prototype.isOpening = function () {
        return this.adapter_.hasClass(cssClasses$1.OPENING) || this.adapter_.hasClass(cssClasses$1.ANIMATE);
    };
    /**
     * @return true if drawer is animating closed.
     */
    MDCDismissibleDrawerFoundation.prototype.isClosing = function () {
        return this.adapter_.hasClass(cssClasses$1.CLOSING);
    };
    /**
     * Keydown handler to close drawer when key is escape.
     */
    MDCDismissibleDrawerFoundation.prototype.handleKeydown = function (evt) {
        var keyCode = evt.keyCode, key = evt.key;
        var isEscape = key === 'Escape' || keyCode === 27;
        if (isEscape) {
            this.close();
        }
    };
    /**
     * Handles a transition end event on the root element.
     */
    MDCDismissibleDrawerFoundation.prototype.handleTransitionEnd = function (evt) {
        var OPENING = cssClasses$1.OPENING, CLOSING = cssClasses$1.CLOSING, OPEN = cssClasses$1.OPEN, ANIMATE = cssClasses$1.ANIMATE, ROOT = cssClasses$1.ROOT;
        // In Edge, transitionend on ripple pseudo-elements yields a target without classList, so check for Element first.
        var isRootElement = this.isElement_(evt.target) && this.adapter_.elementHasClass(evt.target, ROOT);
        if (!isRootElement) {
            return;
        }
        if (this.isClosing()) {
            this.adapter_.removeClass(OPEN);
            this.closed_();
            this.adapter_.restoreFocus();
            this.adapter_.notifyClose();
        }
        else {
            this.adapter_.focusActiveNavigationItem();
            this.opened_();
            this.adapter_.notifyOpen();
        }
        this.adapter_.removeClass(ANIMATE);
        this.adapter_.removeClass(OPENING);
        this.adapter_.removeClass(CLOSING);
    };
    /**
     * Extension point for when drawer finishes open animation.
     */
    MDCDismissibleDrawerFoundation.prototype.opened_ = function () { }; // tslint:disable-line:no-empty
    /**
     * Extension point for when drawer finishes close animation.
     */
    MDCDismissibleDrawerFoundation.prototype.closed_ = function () { }; // tslint:disable-line:no-empty
    /**
     * Runs the given logic on the next animation frame, using setTimeout to factor in Firefox reflow behavior.
     */
    MDCDismissibleDrawerFoundation.prototype.runNextAnimationFrame_ = function (callback) {
        var _this = this;
        cancelAnimationFrame(this.animationFrame_);
        this.animationFrame_ = requestAnimationFrame(function () {
            _this.animationFrame_ = 0;
            clearTimeout(_this.animationTimer_);
            _this.animationTimer_ = setTimeout(callback, 0);
        });
    };
    MDCDismissibleDrawerFoundation.prototype.isElement_ = function (element) {
        // In Edge, transitionend on ripple pseudo-elements yields a target without classList.
        return Boolean(element.classList);
    };
    return MDCDismissibleDrawerFoundation;
}(MDCFoundation));/**
 * @license
 * Copyright 2018 Google Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */
/* istanbul ignore next: subclass is not a branch statement */
var MDCModalDrawerFoundation = /** @class */ (function (_super) {
    __extends(MDCModalDrawerFoundation, _super);
    function MDCModalDrawerFoundation() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    /**
     * Handles click event on scrim.
     */
    MDCModalDrawerFoundation.prototype.handleScrimClick = function () {
        this.close();
    };
    /**
     * Called when drawer finishes open animation.
     */
    MDCModalDrawerFoundation.prototype.opened_ = function () {
        this.adapter_.trapFocus();
    };
    /**
     * Called when drawer finishes close animation.
     */
    MDCModalDrawerFoundation.prototype.closed_ = function () {
        this.adapter_.releaseFocus();
    };
    return MDCModalDrawerFoundation;
}(MDCDismissibleDrawerFoundation));/**
 * @license
 * Copyright 2016 Google Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */
var cssClasses$2 = MDCDismissibleDrawerFoundation.cssClasses, strings$2 = MDCDismissibleDrawerFoundation.strings;
var MDCDrawer = /** @class */ (function (_super) {
    __extends(MDCDrawer, _super);
    function MDCDrawer() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    MDCDrawer.attachTo = function (root) {
        return new MDCDrawer(root);
    };
    Object.defineProperty(MDCDrawer.prototype, "open", {
        /**
         * Returns true if drawer is in the open position.
         */
        get: function () {
            return this.foundation_.isOpen();
        },
        /**
         * Toggles the drawer open and closed.
         */
        set: function (isOpen) {
            if (isOpen) {
                this.foundation_.open();
            }
            else {
                this.foundation_.close();
            }
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MDCDrawer.prototype, "list", {
        get: function () {
            return this.list_;
        },
        enumerable: true,
        configurable: true
    });
    MDCDrawer.prototype.initialize = function (focusTrapFactory, listFactory) {
        if (focusTrapFactory === void 0) { focusTrapFactory = focusTrap_1; }
        if (listFactory === void 0) { listFactory = function (el) { return new MDCList(el); }; }
        var listEl = this.root_.querySelector("." + MDCListFoundation.cssClasses.ROOT);
        if (listEl) {
            this.list_ = listFactory(listEl);
            this.list_.wrapFocus = true;
        }
        this.focusTrapFactory_ = focusTrapFactory;
    };
    MDCDrawer.prototype.initialSyncWithDOM = function () {
        var _this = this;
        var MODAL = cssClasses$2.MODAL;
        var SCRIM_SELECTOR = strings$2.SCRIM_SELECTOR;
        this.scrim_ = this.root_.parentNode.querySelector(SCRIM_SELECTOR);
        if (this.scrim_ && this.root_.classList.contains(MODAL)) {
            this.handleScrimClick_ = function () { return _this.foundation_.handleScrimClick(); };
            this.scrim_.addEventListener('click', this.handleScrimClick_);
            this.focusTrap_ = createFocusTrapInstance(this.root_, this.focusTrapFactory_);
        }
        this.handleKeydown_ = function (evt) { return _this.foundation_.handleKeydown(evt); };
        this.handleTransitionEnd_ = function (evt) { return _this.foundation_.handleTransitionEnd(evt); };
        this.listen('keydown', this.handleKeydown_);
        this.listen('transitionend', this.handleTransitionEnd_);
    };
    MDCDrawer.prototype.destroy = function () {
        this.unlisten('keydown', this.handleKeydown_);
        this.unlisten('transitionend', this.handleTransitionEnd_);
        if (this.list_) {
            this.list_.destroy();
        }
        var MODAL = cssClasses$2.MODAL;
        if (this.scrim_ && this.handleScrimClick_ && this.root_.classList.contains(MODAL)) {
            this.scrim_.removeEventListener('click', this.handleScrimClick_);
            // Ensure drawer is closed to hide scrim and release focus
            this.open = false;
        }
    };
    MDCDrawer.prototype.getDefaultFoundation = function () {
        var _this = this;
        // DO NOT INLINE this variable. For backward compatibility, foundations take a Partial<MDCFooAdapter>.
        // To ensure we don't accidentally omit any methods, we need a separate, strongly typed adapter variable.
        // tslint:disable:object-literal-sort-keys Methods should be in the same order as the adapter interface.
        var adapter = {
            addClass: function (className) { return _this.root_.classList.add(className); },
            removeClass: function (className) { return _this.root_.classList.remove(className); },
            hasClass: function (className) { return _this.root_.classList.contains(className); },
            elementHasClass: function (element, className) { return element.classList.contains(className); },
            saveFocus: function () { return _this.previousFocus_ = document.activeElement; },
            restoreFocus: function () {
                var previousFocus = _this.previousFocus_;
                if (previousFocus && previousFocus.focus && _this.root_.contains(document.activeElement)) {
                    previousFocus.focus();
                }
            },
            focusActiveNavigationItem: function () {
                var activeNavItemEl = _this.root_.querySelector("." + MDCListFoundation.cssClasses.LIST_ITEM_ACTIVATED_CLASS);
                if (activeNavItemEl) {
                    activeNavItemEl.focus();
                }
            },
            notifyClose: function () { return _this.emit(strings$2.CLOSE_EVENT, {}, true /* shouldBubble */); },
            notifyOpen: function () { return _this.emit(strings$2.OPEN_EVENT, {}, true /* shouldBubble */); },
            trapFocus: function () { return _this.focusTrap_.activate(); },
            releaseFocus: function () { return _this.focusTrap_.deactivate(); },
        };
        // tslint:enable:object-literal-sort-keys
        var DISMISSIBLE = cssClasses$2.DISMISSIBLE, MODAL = cssClasses$2.MODAL;
        if (this.root_.classList.contains(DISMISSIBLE)) {
            return new MDCDismissibleDrawerFoundation(adapter);
        }
        else if (this.root_.classList.contains(MODAL)) {
            return new MDCModalDrawerFoundation(adapter);
        }
        else {
            throw new Error("MDCDrawer: Failed to instantiate component. Supported variants are " + DISMISSIBLE + " and " + MODAL + ".");
        }
    };
    return MDCDrawer;
}(MDCComponent));/**
 * @license
 * Copyright 2019 Google Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */Mocha.prototype.reporterOptions = function (reporterOptions) {
    this.options.reporterOptions = reporterOptions;
};
const DefaultOptions = {
    title: "document.title",
    titlePath: "window.location",
    showHooksDefault: true,
    rootSuiteTitle: "Isolated Tests",
    indentSuites: "tablet-up",
    codeBackground: "surface",
    codeDefaultText: "on-surface",
    diffFormat: "side-by-side"
};
class Mochaterial extends Mocha.reporters.Base {
    constructor(runner, options) {
        super(runner, options);
        this.stats = this.stats;
        this.suiteCount = 0;
        this.currentFilter = "passed";
        this.setOverflowItemsThrottled = this.throttle(this.setOverflowItems, 200);
        this.cycleThrottled = this.throttle(this.cycle, 500);
        this.closeDialListener = (e) => this.closeDial(e);
        this.overflowListener = (e) => this.toggleOverflow(e);
        this.expandableListener = (e) => this.toggleExpandable(e);
        this.resizeListener = () => this.setOverflowItemsThrottled();
        this.cycleListener = () => this.cycleThrottled();
        this.cycleTypeListener = (e) => this.toggleSpeedDial(e);
        this.cycleFailedListener = () => this.setCycleType("failed");
        this.cyclePendingListener = () => this.setCycleType("pending");
        this.cycleBlockedListener = () => this.setCycleType("blocked");
        this.cyclePassedListener = () => this.setCycleType("passed");
        this.togglePassedListener = () => this.toggleBody("hide-passed");
        this.toggleFailedListener = () => this.toggleBody("hide-failed");
        this.togglePendingListener = () => this.toggleBody("hide-pending");
        this.toggleBlockedListener = () => this.toggleBody("hide-blocked");
        this.toggleDurationListener = () => this.toggleBody("hide-duration");
        this.toggleHooksListener = () => this.toggleBody("hide-hooks");
        this.toggleSuitesListener = () => this.toggleBody("hide-suites");
        this.toggleTestsListener = () => this.toggleExpandables();
        this.hljs = function (event) {
            const result = self.hljs.highlight(event.data.language, event.data.content, false);
            self.postMessage({ elementId: event.data.elementId, language: event.data.language, content: result.value });
        };
        this.diff2html = function (event) {
            let diffHtml;
            if (event.data.actual == event.data.expected) {
                diffHtml = '<div class="diff-identical">Actual and Expected values match, both contain:\n    ' + event.data.actual + '</div>';
            }
            else {
                const raw = {
                    'side-by-side-file-diff': '<div class="d2h-side-by-side d2h-left scrollbar"><table class="d2h-diff-table"><tbody class="d2h-diff-tbody">{{{diffs.left}}}</tbody></table></div><div class="d2h-side-by-side d2h-right scrollbar"><table class="d2h-diff-table"><tbody class="d2h-diff-tbody">{{{diffs.right}}}</tbody></table></div>',
                    'line-by-line-file-diff': '<div class="d2h-line-by-line"><table class="d2h-diff-table"><tbody class="d2h-diff-tbody">{{{diffs}}}</tbody></table></div>',
                    'generic-line': '<tr class="{{type}}"><td class="{{lineClass}}">{{{lineNumber}}}</td><td class="{{type}}"><div class="{{contentClass}} {{type}}">{{#prefix}}<span class="d2h-code-line-prefix">{{{prefix}}}</span>{{/prefix}}{{#content}}<span class="d2h-code-line-ctn">{{{content}}}</span>{{/content}}</div></td></tr>'
                };
                diffHtml = self.Diff2Html.getPrettyHtml(self.Diff.createPatch('string', event.data.actual, event.data.expected), { inputFormat: 'diff', showFiles: false, matching: 'words', outputFormat: event.data.diffFormat, rawTemplates: raw });
            }
            self.postMessage({ elementId: event.data.elementId, content: diffHtml });
        };
        this.highlighter = this.createWorker(this.hljs, new Array('https://unpkg.com/@netpoint-gmbh/mochaterial/workers/highlight.pack.js'));
        this.comparer = this.createWorker(this.diff2html, new Array('https://unpkg.com/diff@4.0.1/dist/diff.min.js', 'https://unpkg.com/diff2html@2.7.0/dist/diff2html.min.js'));
        this.options = Object.assign({}, DefaultOptions, (options && options.reporterOptions));
        document.body.classList.add("mochaterial");
        if (!this.options.showHooksDefault) {
            document.body.classList.add("hide-hooks");
        }
        this.makeNav();
        this.makeHeader();
        this.makeMain();
        this.makeFooter();
        runner.on('suite', (suite) => this.runSuite(suite));
        runner.on('suite end', (suite) => this.runSuiteEnd(suite));
        runner.on('pending', (test) => this.runPending(test));
        runner.on('pass', (test) => this.runPass(test));
        runner.on('hook end', (hook) => this.runHook(hook));
        runner.on('fail', (item) => this.runFail(item));
        runner.on('start', () => this.start());
        runner.on('end', () => this.finish());
        this.stats.blocked = 0;
        this.stats.hookFailures = 0;
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.has('grep')) {
            this.grep = new RegExp(urlParams.get('grep'));
        }
        this.codeStyle = (this.options.codeBackground == "surface") ? "surface " : "";
        this.codeStyle += (this.options.codeDefaultText == "on-surface") ? "on-surface" : "";
        this.highlighter.onmessage = function (event) {
            document.getElementById(event.data.elementId).innerHTML = event.data.content;
        };
        this.comparer.onmessage = function (event) {
            const diff = document.getElementById(event.data.elementId);
            diff.innerHTML = event.data.content;
            const sides = diff.querySelectorAll(".d2h-side-by-side");
            sides.forEach((scrolling) => {
                scrolling.addEventListener('scroll', () => {
                    sides.forEach((side) => { side.scrollLeft = scrolling.scrollLeft; });
                });
            });
        };
    }
    createWorker(fn, imports) {
        let blobContent = [];
        if (imports) {
            const importScripts = "importScripts('" + imports.join("', '") + "');\n";
            blobContent.push(importScripts);
        }
        blobContent.push("onmessage = " + fn.toString());
        const blob = new Blob(blobContent, { "type": 'application/javascript' });
        const url = window.URL.createObjectURL(blob);
        return new Worker(url);
    }
    get(elementId) {
        return document.getElementById(elementId);
    }
    idOfSuiteElement(item) {
        switch (item) {
            case "container":
                return (this.root || this.parent.root) ? "report" : this.parent.id;
            case "suite":
                return this.id;
            case "item":
                return this.id + "-item" + this.items;
            case "code":
            case "diff":
            case "stack":
                return this.id + "-item" + this.items + "-" + item;
            default:
                return this.id + "-" + item;
        }
    }
    getSuiteElement(item) {
        return document.getElementById(this.idOf(item));
    }
    toggleBody(token) {
        document.body.classList.toggle(token);
    }
    toggleSpeedDial(e) {
        e.stopPropagation();
        const dial = e.currentTarget.parentElement;
        this.swapStyle(dial, "mdc-speed-dial--open", "mdc-speed-dial--closed") ||
            this.swapStyle(dial, "mdc-speed-dial--closed", "mdc-speed-dial--open") ||
            dial.classList.add("mdc-speed-dial--open");
        if (dial.classList.contains("mdc-speed-dial--open")) {
            window.addEventListener('click', this.closeDialListener, false);
        }
    }
    closeDial(e) {
        const items = document.querySelector(".mdc-speed-dial-items");
        if (!items.contains(e.target)) {
            const dial = document.querySelector(".mdc-speed-dial");
            this.swapStyle(dial, "mdc-speed-dial--open", "mdc-speed-dial--closed");
            window.removeEventListener('click', this.closeDialListener, false);
        }
    }
    toggleOverflow(e) {
        const overflow = e.currentTarget.parentElement;
        this.swapStyle(overflow, "mdc-top-app-bar__action-overflow--open", "mdc-top-app-bar__action-overflow--closed") ||
            this.swapStyle(overflow, "mdc-top-app-bar__action-overflow--closed", "mdc-top-app-bar__action-overflow--open") ||
            overflow.classList.add("mdc-top-app-bar__action-overflow--open");
    }
    setCycleType(state) {
        const button = this.get("cycle");
        const icon = button.querySelector(".mdc-fab__icon");
        button.classList.remove(...["passed", "failed", "pending", "blocked"].filter(remove => remove != state));
        button.classList.add(state);
        icon.classList.remove(...["passed", "failed", "pending", "blocked"].filter(remove => remove != state));
        icon.classList.add(state);
        this.currentFilter = state;
    }
    toggleExpandables() {
        const expandables = [...this.get("report").querySelectorAll(".item")];
        if (expandables.length > 0) {
            if (expandables[0].classList.contains("collapsed")) {
                expandables.forEach((expandable) => { this.expandIfCollapsed(expandable, false, false); });
            }
            else {
                expandables.forEach((expandable) => { this.collapseIfExpanded(expandable, false); });
            }
        }
    }
    toggleExpandable(e) {
        const expandable = e.currentTarget.parentElement;
        if (this.expandIfCollapsed(expandable)) {
            this.currentItem = expandable;
        }
        else {
            this.collapseIfExpanded(expandable);
        }
    }
    collapseIfExpanded(item, animate = true) {
        const to = (animate) ? "collapsing" : "collapsed";
        return this.swapStyle(item, "expanded", to);
    }
    expandIfCollapsed(item, animate = true, thenCenter = true) {
        const to = (animate) ? "expanding" : "expanded";
        return this.swapStyle(item, "collapsed", to, thenCenter);
    }
    swapStyle(item, from, to, thenCenter = false) {
        if (item.classList.contains(from)) {
            item.classList.remove(from);
            item.classList.add(to);
            if (thenCenter) {
                this.toCenter(item);
            }
            return true;
        }
        return false;
    }
    toCenter(item) {
        item.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    clearHidden(filter) {
        const hidden = "hide-" + filter;
        document.body.classList.remove(hidden);
    }
    cycle() {
        const expandables = [...this.get("report").querySelectorAll(".item")];
        const filtered = (this.currentFilter) ? expandables.filter(e => e.classList.contains(this.currentFilter)) : expandables;
        if (filtered.length > 0) {
            this.clearHidden(this.currentFilter);
            if (!this.currentItem) {
                this.currentItem = filtered[0];
                this.toCenter(this.currentItem);
                this.expandIfCollapsed(this.currentItem);
            }
            else {
                this.collapseIfExpanded(this.currentItem, false);
                const i = expandables.indexOf(this.currentItem);
                const next = expandables.findIndex((next, index) => (next.classList.contains(this.currentFilter) && index > i));
                this.currentItem = (next != -1) ? expandables[next] : filtered[0];
                this.toCenter(this.currentItem);
                this.expandIfCollapsed(this.currentItem);
            }
        }
    }
    throttle(func, wait, immediate = true) {
        let timeout;
        return function () {
            var context = this, args = arguments;
            var later = function () {
                timeout = null;
                if (!immediate)
                    func.apply(context, args);
            };
            var callNow = immediate && !timeout;
            if (!timeout)
                timeout = setTimeout(later, wait);
            if (callNow)
                func.apply(context, args);
        };
    }
    afterAnimation(e) {
        const expandable = e.currentTarget.parentElement;
        const anim = e.animationName;
        if (anim == "collapse") {
            expandable.classList.add("collapsed");
            expandable.classList.remove("collapsing");
        }
        else if (anim == "expand") {
            expandable.classList.add("expanded");
            expandable.classList.remove("expanding");
        }
    }
    start() {
        this.runner.suite.title = this.options.rootSuiteTitle;
    }
    finish() {
        const bufferBar = this.get("bar-buffer");
        setTimeout(function () {
            bufferBar.classList.add("done");
        }, 1000);
    }
    makeHeader() {
        if (this.options.title == "document.title") {
            this.options.title = (document.title) ? document.title : "Mochaterial";
        }
        if (this.options.titlePath == "window.location") {
            this.options.titlePath = window.location.href.split('?')[0].split('#')[0];
        }
        const markup = `<header id="${"mocha-header"}" class="mdc-top-app-bar mdc-top-app-bar--fixed">
  <div class="mdc-top-app-bar__row">
    <section class="mdc-top-app-bar__section mdc-top-app-bar__section--align-start">
      <a href="#" class="material-icons mdc-top-app-bar__navigation-icon">menu</a>
      <a class="mdc-top-app-bar__title" href="${this.options.titlePath}">${this.options.title}</a>
    </section>
    <section id="${"toolbar"}" class="mdc-top-app-bar__section mdc-top-app-bar__section--align-end" role="toolbar">
      <div id="${"overflow-container"}" class="mdc-top-app-bar__action-overflow">
        <button id="${"overflow-button"}" class="mdc-top-app-bar__action-item">
          <i class="material-icons">more_vert</i>
        </button>
        <div id="${"overflow-items"}" class="mdc-top-app-bar__action-overflow-items">
          <button id="${"toggle-suites"}" class="mdc-top-app-bar__action-item">
            <span id="${"suites"}" class="mocha-stat suites icon">0</span>
          </button>
          <button id="${"toggle-tests"}" class="mdc-top-app-bar__action-item">
            <span id="${"tests"}" class="mocha-stat tests icon">0</span>
          </button>
          <button id="${"toggle-passed"}" class="mdc-top-app-bar__action-item">
            <span id="${"passed"}" class="mocha-stat passed icon">0</span>
          </button>
          <button id="${"toggle-failed"}" class="mdc-top-app-bar__action-item">
            <span id="${"failed"}" class="mocha-stat failed icon">0</span>
          </button>
          <button id="${"toggle-pending"}" class="mdc-top-app-bar__action-item">
            <span id="${"pending"}" class="mocha-stat pending icon">0</span>
          </button>
          <button id="${"toggle-blocked"}" class="mdc-top-app-bar__action-item">
            <span id="${"blocked"}" class="mocha-stat blocked icon">0</span>
          </button>
        </div>
      </div>
    </section>
  </div>
  <div class="mdc-linear-progress mdc-linear-progress--reversed" role="progressbar">
    <div id="${"bar-buffer"}" class="mdc-linear-progress__buffering-dots"></div>
    <div id="${"bar-passed"}" class="mdc-linear-progress__bar passed"><span class="mdc-linear-progress__bar-inner"></span></div>
    <div id="${"bar-pending"}" class="mdc-linear-progress__bar pending"><span class="mdc-linear-progress__bar-inner"></span></div>
    <div id="${"bar-blocked"}" class="mdc-linear-progress__bar blocked"><span class="mdc-linear-progress__bar-inner"></span></div>
    <div id="${"bar-failed"}" class="mdc-linear-progress__bar failed"><span class="mdc-linear-progress__bar-inner"></span></div>
  </div>
</header>`;
        this.after(this.get("scrim"), markup);
        this.setOverflowItems();
        this.get("overflow-button").addEventListener('click', this.overflowListener, false);
        this.get("toggle-passed").addEventListener('click', this.togglePassedListener, false);
        this.get("toggle-failed").addEventListener('click', this.toggleFailedListener, false);
        this.get("toggle-pending").addEventListener('click', this.togglePendingListener, false);
        this.get("toggle-blocked").addEventListener('click', this.toggleBlockedListener, false);
        this.get("toggle-suites").addEventListener('click', this.toggleSuitesListener, false);
        this.get("toggle-tests").addEventListener('click', this.toggleTestsListener, false);
        window.addEventListener('resize', this.resizeListener, false);
    }
    makeMain() {
        const markup = `<main id="${"mocha-main"}" class="mdc-drawer-app-content mdc-top-app-bar--fixed-adjust mdc-bottom-app-bar--fixed-adjust scrollbar" role="main">
  <article id="${"report"}" class="${this.options.indentSuites}"></article>
</main>`;
        this.after(this.get("mocha-header"), markup);
        const drawer = MDCDrawer.attachTo(this.get("mocha-nav"));
        const topAppBar = MDCTopAppBar.attachTo(this.get("mocha-header"));
        topAppBar.setScrollTarget(this.get("mocha-main"));
        topAppBar.listen('MDCTopAppBar:nav', () => {
            drawer.open = !drawer.open;
        });
    }
    makeFooter() {
        const markup = `<footer class="mdc-bottom-app-bar">
  <div class="mdc-bottom-app-bar__fab">
    <button id="${"cycle"}" class="mdc-bottom-app-bar__fab--center-cut mdc-fab passed" aria-label="Change next passed item">
      <span class="mdc-fab__icon passed icon"></span>
    </button>
    <div class="mdc-speed-dial mdc-speed-dial-upwards">
      <button id="${"cycle-type"}" class="mdc-fab mdc-fab--mini dial" aria-label="Open cycle type items">
        <span class="mdc-fab__icon icon dial"></span>
      </button>
      <div class="mdc-speed-dial-items">
        <button id="${"cycle-passed"}" class="mdc-fab mdc-fab--mini passed" aria-label="Change cycler to passed">
          <span class="mdc-fab__icon passed icon"></span>
        </button>
        <button id="${"cycle-pending"}" class="mdc-fab mdc-fab--mini pending" aria-label="Change cycler to pending">
          <span class="mdc-fab__icon pending icon"></span>
        </button>
        <button id="${"cycle-blocked"}" class="mdc-fab mdc-fab--mini blocked" aria-label="Change cycler to blocked">
          <span class="mdc-fab__icon blocked icon"></span>
        </button>
        <button id="${"cycle-failed"}" class="mdc-fab mdc-fab--mini failed" aria-label="Change cycler to failed">
          <span class="mdc-fab__icon failed icon"></span>
        </button>
      </div>
    </div>
  </div>
  <div class="mdc-bottom-app-bar__fab--center-cut"></div>
  <div class="mdc-bottom-app-bar__row">
    <section class="mdc-bottom-app-bar__section mdc-bottom-app-bar__section--align-start">
      <buttion id="${"toggle-duration"}" class="mdc-bottom-app-bar__action-item duration" aria-label="Total Duration" alt="Total Duration"><span id="${"duration"}" class="mocha-stat duration icon">0</span></button>
    </section>
    <section class="mdc-bottom-app-bar__section mdc-bottom-app-bar__section--align-end">
      <span class="mdc-bottom-app-bar__action-item">
        <a href="https://www.netpoint.de/en/competence/mochaterial" target="_blank" rel="noopener" class="copy">
          <div class="card">
            <div class="front">
              <span class="powered">powered by</span><br><span class="np"></span>
            </div>
            <div class="back"></div>
          </div>
        </a>
      </span>
    </section>
  </div>
</footer>`;
        this.after(this.get("mocha-main"), markup);
        this.get("toggle-duration").addEventListener('click', this.toggleDurationListener, false);
        this.get("cycle").addEventListener('click', this.cycleListener, false);
        this.get("cycle-type").addEventListener('click', this.cycleTypeListener, false);
        this.get("cycle-failed").addEventListener('click', this.cycleFailedListener, false);
        this.get("cycle-passed").addEventListener('click', this.cyclePassedListener, false);
        this.get("cycle-pending").addEventListener('click', this.cyclePendingListener, false);
        this.get("cycle-blocked").addEventListener('click', this.cycleBlockedListener, false);
    }
    makeNav() {
        const markup = `<nav id="${"mocha-nav"}" class="mdc-drawer mdc-drawer--modal mdc-drawer--fixed-adjust">
  <div class="mdc-drawer__header">
    <div id="${"hook-switch"}" class="mdc-switch ${(this.options.showHooksDefault) ? "mdc-switch--checked" : ""}">
      <div class="mdc-switch__track"></div>
      <div class="mdc-switch__thumb-underlay">
        <div class="mdc-switch__thumb">
          <input type="checkbox" id="${"toggle-hooks"}" class="mdc-switch__native-control" role="switch" ${(this.options.showHooksDefault) ? "checked" : ""}>
        </div>
      </div>
    </div>
    <label for="${"toggle-hooks"}">show passing hooks</label>
  </div>
  <hr class="mdc-list-divider">
  <div class="mdc-drawer__content scrollbar">
    <div id="${"nav-suites"}" class="mdc-list mdc-list--dense"></div>
  </div>
</nav>
<div id="${"scrim"}" class="mdc-drawer-scrim"></div>`;
        this.prepend(document.body, markup);
        new MDCSwitch(this.get("hook-switch"));
        this.get("toggle-hooks").addEventListener('change', this.toggleHooksListener, false);
    }
    setOverflowItems() {
        if (!this.overflowButtons) {
            this.overflowButtons = [
                this.get("toggle-suites"),
                this.get("toggle-tests"),
                this.get("toggle-passed"),
                this.get("toggle-failed"),
                this.get("toggle-pending"),
                this.get("toggle-blocked")
            ];
        }
        this.overflowButtons.forEach((button) => {
            button.style.display = "none";
        });
        const toolbar = this.get("toolbar");
        const overflowContainer = this.get("overflow-container");
        const overflowItems = this.get("overflow-items");
        const width = toolbar.clientWidth;
        const canFit = (width / 48 >> 0);
        if (canFit >= this.overflowButtons.length) {
            overflowContainer.style.display = "none";
            this.overflowButtons.forEach((button) => {
                toolbar.appendChild(button);
            });
        }
        else {
            for (let i = 0; i < this.overflowButtons.length; i++) {
                if (i < canFit - 1) {
                    toolbar.appendChild(this.overflowButtons[i]);
                }
                else if (i == canFit - 1 || canFit == 0) {
                    overflowContainer.style.display = "flex";
                    toolbar.appendChild(overflowContainer);
                    overflowItems.appendChild(this.overflowButtons[i]);
                }
                else {
                    overflowItems.appendChild(this.overflowButtons[i]);
                }
            }
        }
        this.overflowButtons.forEach((button) => {
            button.style.display = "flex";
        });
    }
    updateSuite(suite, tokens) {
        if (suite.stats.tests > 0) {
            if (suite.root) {
                suite.get("header").classList.add("has-tests");
                suite.get("link").classList.add("has-tests");
            }
            this.buildSuiteSummary(suite);
            const countTests = suite.get("tests");
            countTests.innerText = suite.stats.tests.toString();
            countTests.title = `${this.countText(suite.stats.tests, "test")} included`;
            const countPassed = suite.get("passed");
            countPassed.innerText = suite.stats.passed.toString();
            countPassed.title = `${this.countText(suite.stats.passed, "test")} passed`;
            const countFailed = suite.get("failed");
            const hookFail = (suite.stats.hookFailures > 0) ? ` and ${this.countText(suite.stats.hookFailures, "hook")}` : "";
            const failedTitle = `${this.countText(suite.stats.testFailures, "test")}${hookFail} failed`;
            countFailed.innerText = (suite.stats.testFailures + suite.stats.hookFailures).toString();
            countFailed.title = failedTitle;
            const countPending = suite.get("pending");
            countPending.innerText = suite.stats.pending.toString();
            countPending.title = `${this.countText(suite.stats.pending, "test")} pending`;
            const countBlocked = suite.get("blocked");
            countBlocked.innerText = suite.stats.blocked.toString();
            countBlocked.title = `${this.countText(suite.stats.blocked, "test")} blocked`;
        }
        suite.get("duration").innerText = suite.stats.duration.toString() + "ms";
        if (tokens) {
            tokens.forEach((token) => { this.addToken(suite, token); });
        }
        this.buildRunables(suite);
        this.updateStats();
    }
    ;
    addToken(suite, token) {
        const suiteElement = suite.get("suite");
        if (!suiteElement.classList.contains(token)) {
            suiteElement.classList.add(token);
            suite.get("link").classList.add(token);
            if (suite.parent && !suite.parent.root) {
                this.addToken(suite.parent, token);
            }
        }
    }
    updateStats() {
        var ms = Math.abs(new Date().getTime() - this.stats.start.getTime());
        this.get("duration").innerText = (ms / 1000).toFixed(2) + "s";
        this.get("suites").innerText = this.suiteCount.toString();
        this.get("toggle-suites").title = `${this.countText(this.suiteCount, "suite")} included`;
        this.get("tests").innerText = this.runner.total.toString();
        this.get("toggle-tests").title = `${this.countText(this.runner.total, "test")} included`;
        const testFailures = (this.stats.failures - this.stats.hookFailures);
        const passPercent = Math.round(this.stats.passes / this.runner.total * 100);
        const failPercent = Math.round(testFailures / this.runner.total * 100);
        const pendingPercent = Math.round(this.stats.pending / this.runner.total * 100);
        const blockedPercent = Math.round(this.stats.blocked / this.runner.total * 100);
        const barTotal = this.runner.total + this.stats.hookFailures;
        const scale = .001;
        const passBarPercent = (this.stats.passes / barTotal * 100 + scale) + "%";
        const failBarPercent = (this.stats.failures / barTotal * 100 + scale) + "%";
        const pendingBarPercent = (this.stats.pending / barTotal * 100 + scale) + "%";
        const blockedBarPercent = (this.stats.blocked / barTotal * 100 + scale) + "%";
        const passedTitle = `${this.countText(this.stats.passes, "test")} (${passPercent}%) passed`;
        this.get("toggle-passed").title = passedTitle;
        this.get("passed").innerText = this.stats.passes;
        const barPassed = this.get("bar-passed");
        barPassed.style.width = passBarPercent;
        barPassed.title = passedTitle;
        const hookFail = (this.stats.hookFailures > 0) ? ` and ${this.countText(this.stats.hookFailures, "hook")}` : "";
        const failedTitle = `${this.countText(testFailures, "test")} (${failPercent}%)${hookFail} failed`;
        this.get("toggle-failed").title = failedTitle;
        this.get("failed").innerText = this.stats.failures;
        const barFailed = this.get("bar-failed");
        barFailed.style.width = failBarPercent;
        barFailed.title = failedTitle;
        const pendingTitle = `${this.countText(this.stats.pending, "test")} (${pendingPercent}%) pending`;
        this.get("toggle-pending").title = pendingTitle;
        this.get("pending").innerText = this.stats.pending;
        const barPending = this.get("bar-pending");
        barPending.style.width = pendingBarPercent;
        barPending.style.left = passBarPercent;
        barPending.title = pendingTitle;
        const blockedTitle = `${this.countText(this.stats.blocked, "test")} (${blockedPercent}%) blocked`;
        const barBlocked = this.get("bar-blocked");
        this.get("toggle-blocked").title = blockedTitle;
        this.get("blocked").innerText = this.stats.blocked;
        barBlocked.style.width = blockedBarPercent;
        barBlocked.style.right = failBarPercent;
        barBlocked.title = blockedTitle;
    }
    countText(count, itemType) {
        const s = (count != 1) ? "s" : "";
        return `${count} ${itemType}${s}`;
    }
    runSuite(suite) {
        if (!suite.root) {
            this.suiteCount++;
        }
        suite.id = (suite.root) ? "root" : `suite${this.suiteCount}`;
        suite.idOf = this.idOfSuiteElement;
        suite.get = this.getSuiteElement;
        suite.items = 0;
        suite.stats = {
            tests: 0,
            passed: 0,
            pending: 0,
            testFailures: 0,
            hookFailures: 0,
            blocked: 0,
            duration: 0
        };
        this.makeSuite(suite);
        this.makeSuiteNav(suite);
    }
    makeSuite(suite) {
        const markup = `<div id="${suite.id}" class="suite mdc-list mdc-list--dense">
  <div id="${suite.idOf("header")}" class="suite-header">
    <span class="mdc-list-item__text">${suite.title}</span>
    ${this.meta()}
    <span id="${suite.idOf("duration")}" class="mdc-list-item__meta mdc-list-item__text suite-stat duration icon">0ms</span>
    ${this.replay(suite)}
  </div>
</div>`;
        this.append(suite.get("container"), markup);
        this.buildRunables(suite);
    }
    makeSuiteNav(suite) {
        const markup = `<div id="${suite.idOf("link")}" class="suite-nav mdc-list mdc-list--dense">
  <a class="mdc-list-item nav-link" href="#${suite.id}">
    <i class="material-icons" aria-hidden="true">chevron_right</i>
    <span class="mdc-list-item__text">${suite.title}</span>
  </a>
</div>`;
        const container = (suite.root || suite.parent.root) ? this.get("nav-suites") : suite.parent.get("link");
        this.append(container, markup);
    }
    buildSuiteSummary(suite) {
        if (!suite.get("summary")) {
            const markup = `<section id="${suite.idOf("summary")}" class="suite-summary">
  <span id="${suite.idOf("tests")}" class="suite-stat tests icon">0</span>
  <span id="${suite.idOf("passed")}" class="suite-stat passed icon">0</span>
  <span id="${suite.idOf("failed")}" class="suite-stat failed icon">0</span>
  <span id="${suite.idOf("pending")}" class="suite-stat pending icon">0</span>
  <span id="${suite.idOf("blocked")}" class="suite-stat blocked icon">0</span>
</section>`;
            this.after(suite.get("header"), markup);
        }
    }
    buildRunables(suite) {
        if (!suite.get("items")) {
            const markup = `<ul id="${suite.idOf("items")}" class="mdc-list mocha-list-items"></ul>`;
            this.append(document.getElementById(suite.id), markup);
        }
    }
    runSuiteEnd(suite) {
        let blocked = suite.tests.filter(test => !test.state && !test.pending);
        if (this.grep) {
            blocked = blocked.filter(test => this.grep.test(test.fullTitle()));
        }
        blocked.forEach(test => {
            this.runBlocked(test);
        });
        if (suite.get("items")) {
            this.updateSuite(suite);
        }
        else {
            suite.get("duration").innerText = suite.stats.duration.toString() + "ms";
        }
    }
    runHook(hook) {
        this.setHookInfo(hook);
        hook.suite.items++;
        hook.state = "passed";
        const duration = this.duration(hook);
        this.updateSuite(hook.suite, ["has-hook"]);
        const description = this.itemDescription(hook.hookType, hook.title, duration.status);
        this.makeItem(hook, "passed", description, duration);
    }
    runBlocked(test) {
        this.stats.blocked++;
        test.parent.items++;
        test.parent.stats.tests++;
        test.parent.stats.blocked++;
        this.updateSuite(test.parent, ["has-blocked"]);
        const description = this.itemDescription("Test", test.title, "was blocked by previous error");
        this.makeItem(test, "blocked", description);
        const failHook = test.parent.get("suite").querySelector(`li.hook.failed[for="${this.quot(test.title)}"]`);
        if (failHook) {
            failHook.after(test.parent.get("item"));
        }
        if (this.currentFilter != "failed" && this.currentFilter != "blocked") {
            this.setCycleType("blocked");
        }
    }
    runPending(test) {
        test.parent.items++;
        test.parent.stats.tests++;
        test.parent.stats.pending++;
        this.updateSuite(test.parent, ["has-pending"]);
        test.body = (test.body != "") ? test.body : "/* Pending test code unavailable */";
        const description = this.itemDescription("Test", test.title, "is pending");
        this.makeItem(test, "pending", description);
        if (this.currentFilter == "passed") {
            this.setCycleType("pending");
        }
    }
    runPass(test) {
        test.parent.items++;
        test.parent.stats.tests++;
        test.parent.stats.passed++;
        const duration = this.duration(test);
        this.updateSuite(test.parent, ["has-passed"]);
        const description = this.itemDescription("Test", test.title, duration.status);
        this.makeItem(test, "passed", description, duration);
    }
    failTest(test) {
        test.parent.items++;
        test.parent.stats.tests++;
        test.parent.stats.testFailures++;
        const duration = this.duration(test);
        this.updateSuite(test.parent, ["has-failed"]);
        const description = this.itemDescription("Test", test.title, duration.status);
        this.makeItem(test, "failed", description, duration);
        if (this.currentFilter != "failed") {
            this.setCycleType("failed");
        }
    }
    setHookInfo(hook) {
        const suite = hook.parent;
        if (suite._beforeAll.includes(hook)) {
            hook.suite = hook.parent;
            hook.title = hook.title.replace('"before all" hook: ', '');
            hook.hookType = "Before all";
        }
        if (suite._beforeEach.includes(hook)) {
            hook.suite = hook.ctx.currentTest.parent;
            hook.title = hook.title.replace('"before each" hook: ', '');
            hook.hookType = "Before each";
        }
        if (suite._afterAll.includes(hook)) {
            hook.suite = hook.parent;
            hook.title = hook.title.replace('"after all" hook: ', '');
            hook.hookType = "After all";
        }
        if (suite._afterEach.includes(hook)) {
            hook.suite = hook.ctx.currentTest.parent;
            hook.title = hook.title.replace('"after each" hook: ', '');
            hook.hookType = "After each";
        }
    }
    failHook(hook) {
        this.setHookInfo(hook);
        this.stats.hookFailures++;
        hook.suite.items++;
        hook.suite.stats.hookFailures++;
        this.updateSuite(hook.suite, ["has-failed"]);
        const duration = this.duration(hook);
        const description = this.itemDescription(hook.hookType, hook.title, duration.status);
        this.makeItem(hook, "failed", description, duration);
        this.runBlockedSuites(hook, hook.parent);
        if (this.currentFilter != "failed") {
            this.setCycleType("failed");
        }
    }
    allChildSuites(directChildren) {
        let all = [];
        directChildren.forEach((a) => {
            all.push(a);
            if (Array.isArray(a.suites)) {
                all = all.concat(this.allChildSuites(a.suites));
            }
        });
        return all;
    }
    runBlockedSuites(hook, suite) {
        const check = (hook.hookType == "Before all" || hook.hookType == "After each") ? suite : hook.suite;
        let blocked = this.allChildSuites(check.suites).filter(s => !s.get);
        if (this.grep) {
            blocked = blocked.filter(suite => this.grep.test(suite.fullTitle()));
        }
        blocked.forEach((s) => {
            this.runSuite(s);
            this.runSuiteEnd(s);
        });
    }
    runFail(item) {
        if (item.type == "test") {
            this.failTest(item);
        }
        else {
            this.failHook(item);
        }
    }
    makeItem(item, state, description, duration) {
        const error = item.err;
        let target = "";
        let suite;
        if (item.type == "hook") {
            suite = item.suite;
            if (item.ctx.currentTest) {
                target = ` for="${this.quot(item.ctx.currentTest.title)}"`;
            }
        }
        else {
            suite = item.parent;
            target = ` test="${this.quot(item.title)}"`;
        }
        const markup = `<li id="${suite.idOf("item")}" class="item ${item.type} ${state} collapsed"${target}>
  <div class="mdc-list-item expandable-trigger" title="${description}">
    ${this.itemText(item, state)}
    ${this.meta()}
    ${duration ? this.itemDuration(duration) : ''}
    ${this.replay(item)}
  </div>
  ${error ? this.failMessage(error.toString()) : ''}
  ${error ? this.stackTrace(suite.idOf("stack")) : ''}
  ${error && error.actual && error.expected ? this.compare(suite.idOf("diff")) : ''}
  ${this.code(suite.idOf("code"), item.body)}
</li>`;
        this.append(suite.get("items"), markup);
        this.wireExpandable(suite.get("item"));
        this.highlightCode(suite.get("code"), "javascript");
        if (error) {
            this.fillStack(suite.get("stack"), error);
            if (error.actual && error.expected) {
                this.compareDiff(suite.get("diff"), error);
            }
        }
    }
    wireExpandable(element) {
        element.querySelector('.expandable-trigger').addEventListener('click', this.expandableListener, false);
        element.querySelectorAll('.expandable-target').forEach(target => {
            this.PrefixedEvent(target, "AnimationEnd", this.afterAnimation);
        });
    }
    highlightCode(code, language) {
        const data = {
            elementId: code.id,
            language: language,
            content: code.textContent,
        };
        this.highlighter.postMessage(data);
    }
    compareDiff(code, error) {
        const data = {
            elementId: code.id,
            actual: error.actual,
            expected: error.expected,
            diffFormat: this.options.diffFormat,
            content: code.textContent,
        };
        this.comparer.postMessage(data);
    }
    itemDescription(itemType, title, status) {
        return `${itemType} \`${this.quot(title)}´ ${status}`;
    }
    suiteDuration(suite, duration) {
        suite.stats.duration += duration;
        if (suite.parent && !suite.parent.root) {
            this.suiteDuration(suite.parent, duration);
        }
    }
    duration(item) {
        const durationMissing = (typeof item.duration == 'undefined');
        if (!durationMissing) {
            this.suiteDuration(item.parent, item.duration);
        }
        let d = {
            time: (durationMissing) ? "???" : item.duration.toString() + "ms",
            status: "",
            style: "item-duration "
        };
        if (durationMissing) {
            d.style += "mocha-timeout";
            d.status = item.state + " with no timing given";
        }
        else if (item.duration >= item.timeout()) {
            d.style += "mocha-timeout";
            d.status = "timed out after " + d.time;
        }
        else if (item.duration > item.slow()) {
            d.style += "mocha-slow";
            d.status = item.state + " slowly in " + d.time;
        }
        else if (item.duration > item.slow() * .5) {
            d.style += "mocha-medium";
            const moderately = (item.duration > item.slow() * .75) ? " moderately slowly in " : " moderately quickly in ";
            d.status = item.state + moderately + d.time;
        }
        else {
            d.style += "mocha-fast";
            d.status = item.state + " quickly in " + d.time;
        }
        return d;
    }
    meta() {
        return `<span class="mdc-list-item__meta"></span>`;
    }
    replay(target) {
        const title = `Replay ${(target instanceof Mocha.Suite) ? "suite" : "test"} \`${this.quot(target.title)}´`;
        return `<a class="replay icon" href="${this.makeUrl(target.fullTitle())}" title="${title}"></a>`;
    }
    failMessage(message) {
        const markup = `<div class="expandable-target-reversed">
  <span class="mdc-list-item__text mocha-exception"><i class="icon exception" aria-hidden="true"></i>${Mocha.utils.escape(message)}</span>
</div>`;
        return markup;
    }
    code(id, body) {
        const markup = `<div class="expandable-target">
  <i class="icon code" aria-hidden="true"></i>
  <pre><code id="${id}" class="hljs scrollbar language-javascript ${this.codeStyle}">${Mocha.utils.clean(body)}</code></pre>
</div>`;
        return markup;
    }
    fillStack(element, error) {
        this.formatStack(error).then((stack) => {
            element.textContent = `${error.toString()} ${stack} `;
            this.highlightCode(element, "stacktracejs");
        });
    }
    stackTrace(id) {
        const markup = `<div class="expandable-target">
  <i class="icon stack" aria-hidden="true"></i>
  <pre><code id="${id}" class="hljs scrollbar stack ${this.codeStyle}"></code></pre>
</div>`;
        return markup;
    }
    compare(id) {
        const markup = `<div class="expandable-target">
  <i class="icon compare" aria-hidden="true"></i>
  <pre class="diff"><code id="${id}" class="hljs scrollbar language-diff ${this.codeStyle}"></code></pre>
</div>`;
        return markup;
    }
    itemText(item, state) {
        const itemType = (item.type == "hook") ? item.hookType.replace(" ", "-").toLowerCase() : "test";
        return `<span class="mdc-list-item__text ${itemType}-title ${state} icon">${item.title}</span>`;
    }
    itemDuration(duration) {
        return `<span class="${duration.style} icon">${duration.time}</span>`;
    }
    append(container, markup) {
        const item = document.createElement("div");
        container.appendChild(item);
        item.outerHTML = markup;
    }
    after(container, markup) {
        const item = document.createElement("div");
        container.after(item);
        item.outerHTML = markup;
    }
    prepend(container, markup) {
        const item = document.createElement("div");
        container.prepend(item);
        item.outerHTML = markup;
    }
    formatStack(error) {
        if (!error.stack) {
            return new Promise((resolve) => { resolve(""); });
        }
        else {
            const indexOfMessage = error.stack.indexOf(error.message);
            if (indexOfMessage != -1) {
                error.stack = error.stack.substr(error.message.length + indexOfMessage);
            }
            if (error.stack == "") {
                return new Promise((resolve) => { resolve(""); });
            }
            else {
                return StackTrace.fromError(error).then((stackframes) => {
                    var stringifiedStack = stackframes.map(function (sf) {
                        var functionName = sf.getFunctionName() || 'anonymous';
                        var args = '(' + (sf.getArgs() || []).join(',') + ')';
                        var fileName = sf.getFileName() ? (' @ ' + sf.getFileName()) : '';
                        var lineNumber = !isNaN(sf.getLineNumber()) ? (':' + sf.getLineNumber()) : '';
                        var columnNumber = !isNaN(sf.getColumnNumber()) ? (':' + sf.getColumnNumber()) : '';
                        return functionName + args + fileName + lineNumber + columnNumber;
                    }).join('\n   ');
                    return '\n   ' + stringifiedStack;
                });
            }
        }
    }
    quot(str) {
        return str.replace(/"/g, '&quot;');
    }
    PrefixedEvent(element, type, callback) {
        const prefix = ["webkit", "moz", "MS", "o", ""];
        for (let p = 0; p < prefix.length; p++) {
            if (!prefix[p])
                type = type.toLowerCase();
            element.addEventListener(prefix[p] + type, callback, false);
        }
    }
    makeUrl(s) {
        var search = window.location.search;
        if (search) {
            search = search.replace(/[?&]grep=[^&\s]*/g, '').replace(/^&/, '?');
        }
        return (window.location.pathname +
            (search ? search + '&' : '?') +
            'grep=' +
            encodeURIComponent(this.escapeRe(s)));
    }
    escapeRe(str) {
        var matchOperatorsRe = /[|\\{}()[\]^$+*?.]/g;
        if (typeof str !== 'string') {
            throw new TypeError('Expected a string');
        }
        return str.replace(matchOperatorsRe, '\\$&');
    }
}export{Mochaterial};