(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else if(typeof exports === 'object')
		exports["o"] = factory();
	else
		root["o"] = factory();
})(self, function() {
return /******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	// The require scope
/******/ 	var __webpack_require__ = {};
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
// ESM COMPAT FLAG
__webpack_require__.r(__webpack_exports__);

// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  "ajax": () => (/* reexport */ ajax),
  "ajaxJson": () => (/* reexport */ ajaxJson),
  "appendFormData": () => (/* reexport */ appendFormData),
  "arrayIndex": () => (/* reexport */ arrayIndex),
  "assign": () => (/* reexport */ utils_assign),
  "bindOf": () => (/* reexport */ bindOf),
  "bindTouch": () => (/* reexport */ bindTouch),
  "cached": () => (/* reexport */ cached),
  "camelize": () => (/* reexport */ camelize),
  "capitalize": () => (/* reexport */ capitalize),
  "convertToFormData": () => (/* binding */ convertToFormData),
  "createTag": () => (/* reexport */ createTag),
  "decodeHTML": () => (/* reexport */ decodeHTML),
  "deleteJson": () => (/* binding */ deleteJson),
  "dom2str": () => (/* reexport */ dom2str),
  "evalInContext": () => (/* binding */ evalInContext),
  "extend": () => (/* reexport */ extend),
  "extendDefault": () => (/* reexport */ extendDefault),
  "find": () => (/* reexport */ find),
  "findAll": () => (/* reexport */ findAll),
  "findAllByClass": () => (/* reexport */ findAllByClass),
  "findAllByTag": () => (/* reexport */ findAllByTag),
  "findParent": () => (/* reexport */ findParent),
  "formatBytes": () => (/* reexport */ formatBytes),
  "formatNumber": () => (/* reexport */ formatNumber),
  "getById": () => (/* binding */ getById),
  "getForm": () => (/* reexport */ getForm),
  "getJson": () => (/* binding */ getJson),
  "getTick": () => (/* binding */ getTick),
  "hyphenate": () => (/* reexport */ hyphenate),
  "isEmail": () => (/* reexport */ isEmail),
  "isNumber": () => (/* reexport */ isNumber),
  "mixin": () => (/* reexport */ mixin),
  "mixinObject": () => (/* reexport */ mixinObject),
  "newFunction": () => (/* reexport */ newFunction),
  "now": () => (/* reexport */ now),
  "off": () => (/* reexport */ off),
  "on": () => (/* reexport */ on),
  "once": () => (/* reexport */ once),
  "parseQueryString": () => (/* reexport */ parseQueryString),
  "pixelOf": () => (/* reexport */ pixelOf),
  "postForm": () => (/* binding */ postForm),
  "postJson": () => (/* binding */ postJson),
  "postMultipart": () => (/* binding */ postMultipart),
  "putJson": () => (/* binding */ putJson),
  "randomRange": () => (/* reexport */ randomRange),
  "readFileArray": () => (/* reexport */ readFileArray),
  "readFileString": () => (/* reexport */ readFileString),
  "readUrl": () => (/* reexport */ readUrl),
  "redirectForm": () => (/* reexport */ redirectForm),
  "replaceAll": () => (/* reexport */ replaceAll),
  "resetTick": () => (/* binding */ resetTick),
  "round": () => (/* reexport */ round),
  "setForm": () => (/* reexport */ setForm),
  "sprint": () => (/* reexport */ sprint),
  "str2dom": () => (/* reexport */ str2dom),
  "tag2dom": () => (/* reexport */ tag2dom),
  "tick": () => (/* reexport */ tick),
  "toArray": () => (/* reexport */ toArray),
  "toQueryString": () => (/* reexport */ toQueryString),
  "truncatePx": () => (/* reexport */ truncatePx),
  "unbindTouch": () => (/* reexport */ unbindTouch),
  "watch": () => (/* reexport */ watch),
  "watchAttribute": () => (/* reexport */ watchAttribute),
  "watchDom": () => (/* reexport */ watchDom),
  "wrapper": () => (/* reexport */ wrapper)
});

;// CONCATENATED MODULE: ./src/assert.js
function assert_assert(condition, message) {
  if (!condition) {
    throw Error(message || "assertion failed");
  }
}

assert_assert["function"] = function (obj, name) {
  if (!("function" === typeof obj)) {
    throw TypeError("".concat(name || "it", " must be a function"));
  }
};

assert_assert.string = function (obj, name) {
  if (!("string" === typeof obj)) {
    throw TypeError("".concat(name || "it", " must be a string"));
  }
};
;// CONCATENATED MODULE: ./src/next.js


function Next(handler) {
  assert_assert["function"](handler, "handler");
  this.fulfillHandlers = [];
  this.rejectHandlers = [];
  this.hasResponse = false;
  this.occureError = false;

  try {
    handler(this.onFullfill.bind(this), this.onReject.bind(this));
  } catch (ex) {
    this.onReject(ex);
  }
}
mixin(Next, {
  onFullfill: function onFullfill(response) {
    if (this.hasResponse || this.occureError) return;
    this.hasResponse = true;
    this.response = response;
    this.callFullfillHandler(response);
  },
  callFullfillHandler: function callFullfillHandler(response) {
    try {
      var res = response;
      this.fulfillHandlers.forEach(function (each, idx) {
        res = each(res);
      });
    } catch (ex) {
      this.onReject(ex);
    }
  },
  then: function then(handler) {
    this.fulfillHandlers.push(handler);

    if (this.hasResponse) {
      var response = this.response;
      this.response = null;
      this.callFullfillHandler(response);
    }

    return this;
  },
  onReject: function onReject(error) {
    if (this.occureError) return;
    this.occureError = true;
    this.error = error;
    this.callRejectHandlers(error);
  },
  callRejectHandlers: function callRejectHandlers(error) {
    var err = error;
    this.rejectHandlers.forEach(function (each, idx) {
      err = each(err);
    });
  },
  "catch": function _catch(handler) {
    this.rejectHandlers.push(handler);

    if (this.occureError) {
      var error = this.error;
      this.error = null;
      this.callRejectHandlers(error);
    }

    return this;
  }
});
;// CONCATENATED MODULE: ./src/string.js

function decodeHTML(str) {
  return str && str.replace(/%lt;/g, "<").replace(/&gt;/g, ">");
}
function formatNumber(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
var units = ["B", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
function formatBytes(value, digits) {
  if (!value) return "0 B";
  var exp = Math.floor(Math.log(value) / Math.log(1024));
  return (value / Math.pow(1024, exp)).toFixed(digits).concat(" ").concat(units[exp]);
}
function toQueryString(obj, enableT) {
  var data = [];

  for (var key in obj) {
    data.push(key.concat("=").concat(encodeURIComponent(obj[key])));
  }

  if (enableT) data.push("t=".concat(new Date().getTime()));
  return data.join("&");
}
function parseQueryString(str) {
  var ret = {};
  var tokens = str.split("&");

  for (var i = 0; i < tokens.length; ++i) {
    var items = tokens[i].split("=");
    ret[item[0]] = item[1] && decodeURIComponent(item[1]);
  }

  return ret;
}
var camelizeRE = /-(\w)/g;
var camelize = cached(function (str) {
  return str && str.replace(camelizeRE, function (_, c) {
    return c ? c.toUpperCase() : "";
  });
});
var hyphenateRE = /\B([A-Z])/g;
var hyphenate = cached(function (str) {
  return str && str.replace(hyphenateRE, "-$1").toLowerCase();
});
var capitalize = cached(function (str) {
  return str && str.charAt(0).toUpperCase().concat(str.slice(1));
});
function sprint(fmt) {
  var args = arguments;
  return fmt.replace(/{(\d+)}/g, function (match, value) {
    return void 0 !== args[value] ? args[value] : match;
  });
}
function replaceAll(str, context) {
  if ("string" === typeof contenxt) {
    return str.replace(context);
  }

  if (content instanceof Object) {
    return str.replace(/\{(\w+)\}/g, function (match, key) {
      return context.hasOwnProperty(key) ? context[key] : match;
    });
  }
}
var reNumber = /^[0-9]+$/;
function isNumber(str) {
  return reNumber.test(str);
}
var reEmail = /^([0-9a-zA-Z_\.-]+)@([0-9a-zA-Z_-]+)(\.[0-9a-zA-Z_-]+){1,2}$/;
function isEmail(str) {
  return reEmail.test(str);
}
function pixelOf(el, str) {
  el.innerHTML = str;
  return el.offsetWidth;
}
function truncatePx(str, px, opts) {
  var span = document.createElement("span");
  document.body.appendChild(span);

  try {
    opts = opts || {};
    span.className = null;

    if ("string" === typeof opts) {
      span.className = opts;
    } else {
      Object.assign(span.style, opts);
    }

    span.style.visibility = "hidden";
    span.style.padding = "0px";
    var p = str.length;

    while (0 < p && px < pixelOf(span, str)) {
      str = str.substring(0, --p) + "…";
    }
  } finally {
    document.body.removeChild(span);
  }

  return str;
}
;// CONCATENATED MODULE: ./src/utils.js
function _readOnlyError(name) { throw new TypeError("\"" + name + "\" is read-only"); }



var w = window;
var utils_MutationObserver = w.MutationObserver || w.WebKitMutationObserver;
function wrapper(source, attr, fn) {
  source["_" + attr] = source[attr];
  source[attr] = fn;
}
function cached(fn) {
  var cache = Object.create(null);
  return function cachedFn(arg) {
    var hit = cache[arg];
    return hit || (cache[arg] = fn(arg));
  };
}
function mixin(target) {
  for (var i = 1; i < arguments.length; ++i) {
    var arg = arguments[i];

    if (arg instanceof Function) {
      arg.call(target);
    } else {
      utils_assign(target.prototype, arg);
    }
  }

  return target;
}
function utils_assign(target, source, deep) {
  var target_ = target || {};

  for (var key in source) {
    var src = source[key];
    target_[key] = deep && src instanceof Object ? utils_assign(target_[key], src) : src;
  }

  return target_;
}
function str2dom(text) {
  var res = new DOMParser().parseFromString(text, "text/xml");
  return res.firstChild;
}
var now = w.performance && w.performance.timing && w.performance.timing.navigationStart && w.performance.now ? function () {
  return w.performance.timing.navigationStart + w.performance.now();
} : function () {
  return new Date().getTime();
};
function tick(id) {
  var t = now();
  tickData[id] = tickData[id] || [];
  tickData[id].push(t);
}
function ajax(opts, data) {
  opts = utils_assign({
    method: "GET",
    responseType: "",
    headers: {}
  }, opts, true);
  data = data || opts.data;
  return new Next(function (resolve, reject) {
    try {
      var xhr = new XMLHttpRequest();
      opts.responseType && (xhr.responseType = opts.responseType);

      xhr.onreadystatechange = function () {
        if (xhr.readyState === XMLHttpRequest.DONE) {
          var res = new HttpResponse(xhr);
          mixinHttpResponse.call(res);
          resolve(res);
        }
      };

      xhr.open(opts.method, opts.url, true);

      for (var key in opts.headers) {
        xhr.setRequestHeader(key, opts.headers[key]);
      }

      xhr.send(data);
    } catch (ex) {
      reject(ex);
    }
  });
}

function mixinHttpResponse() {
  var text = this.bodyText;
  this.json = cached(function () {
    return JSON.parse(text);
  });
  this.xml = cached(function () {
    return str2dom(text);
  });
}

function HttpResponse(xhr) {
  this.status = xhr.status;
  this.statusText = xhr.statusText;
  this.body = xhr.response;
  this.bodyText = xhr.responseText;
  var headers = this.headers = {};
  xhr.getAllResponseHeaders().split("\r\n").forEach(function (each) {
    var p = each.indexOf(":");
    ~p && (headers[each.substring(0, p).trim()] = each.substring(p + 1).trim());
  });
}

function ajaxJson(opts, data) {
  opts = utils_assign({
    method: "GET"
  }, opts, true);
  opts.url = opts.url + "?" + toQueryString(queryData, true);
  opts.headers = utils_assign(opts.headers || {}, {
    "Content-Type": "application/json;charset=UTF-8"
  });
  var queryData = null;

  if (data && ("GET" === opts.method || "DELETE" === opts.method)) {
    queryData = data;
    data = null;
  }

  return ajax(opts, data && JSON.stringify(data)).then(function (res) {
    return res.json();
  });
}
function newFunction(str) {
  return new Function("with(this){return " + str + "}");
}
function extend(sub, base) {
  sub.prototype = Object.assign(Object.create(base.prototype), sub.prototype);
  sub.prototype.constructor = sub;
  sub.base = base;
  return sub;
}
function extendDefault(sub, base) {
  sub.prototype = Object.assign(new base(), sub.prototype);
  sub.prototype.constructor = sub;
  sub.base = base;
  return sub;
}
function watch(obj, key, callback) {
  assert["function"](callback, "callback");
  var value = obj[key];
  Object.defineProperty(obj, key, {
    set: function set(val) {
      val, _readOnlyError("value");
      callback(val);
    },
    get: function get() {
      return value;
    }
  });
}
function arrayIndex(array, compare) {
  if ("string" === typeof compare) {
    var keyword = compare;

    compare = function compare(val) {
      return val === keyword;
    };
  } else {
    assert["function"](compare, "compare");
  }

  for (var i = 0; i < array.length; ++i) {
    if (compare(array[i])) return i;
  }

  return -1;
}
function readFileString(file) {
  readFileCB(file, function (reader, file) {
    return reader.readAsBinaryString(file);
  });
}
function readFileArray(file) {
  readFileCB(file, function (reader, file) {
    return reader.readAsArrayBuffer(file);
  });
}

function readFileCB(file, readCb) {
  console.assert("function" === typeof readCb, "invalid type of readCb");
  return new Promise(function (resolve, reject) {
    var reader = new FileReader();

    reader.onload = function (ev) {
      resolve(ev.target.result);
    };

    reader.onerror = function (err) {
      reject(err);
    };

    readCb(reader, file);
  });
}

function once(fn) {
  var called = false;
  return function () {
    if (called) return;
    fn.apply(fn, arguments);
  };
}
function readUrl(url) {
  return new Promise(function (resolve, reject) {
    var xhr = new XMLHttpRequest();
    xhr.responseType = "arraybuffer";

    xhr.onreadystatechange = function () {
      if (XMLHttpRequest.DONE !== xhr.readyState) {
        return;
      }

      if (200 === xhr.status) {
        resolve(xhr.response);
      } else {
        reject(xhr);
      }
    };

    xhr.open("GET", url, true);
    xhr.send();
  });
}
function randomRange(min, max) {
  return min + Math.floor(Math.random() * (max - min + 1));
}
function round(value, decimal) {
  var fix = Math.pow(10, decimal);
  return Math.round(value * fix) / fix;
}
function toArray(obj) {
  return Array.prototype.slice.call(obj);
} // 싱글터치(멀티터치/터치스크롤 미지원) 이벤트를 마우스 이벤트로 바인딩해서 처리

function onTouchstart(ev) {
  ev.preventDefault();
  var target = ev.target,
      touches = ev.touches;
  var _touches$ = touches[0],
      clientX = _touches$.clientX,
      clientY = _touches$.clientY;
  target.dispatchEvent(new MouseEvent("mousedown", {
    clientX: clientX,
    clientY: clientY
  }));
}

function onTouchmove(_ref) {
  var target = _ref.target,
      touches = _ref.touches;
  var _touches$2 = touches[0],
      clientX = _touches$2.clientX,
      clientY = _touches$2.clientY;
  target.dispatchEvent(new MouseEvent("mousemove", {
    clientX: clientX,
    clientY: clientY
  }));
}

function onTouchup(_ref2) {
  var target = _ref2.target;
  target.dispatchEvent(new MouseEvent("mouseup"));
}

function bindTouch(el) {
  if (!el) return;
  console.assert(!!el.addEventListener, "el must be addEventListener");
  el.addEventListener("touchstart", onTouchstart);
  el.addEventListener("touchmove", onTouchmove);
  el.addEventListener("touchend", onTouchup);
}
function unbindTouch(el) {
  if (!el) return;
  console.assert(!!el.removeEventListener, "el must be removeEventListener");
  el.removeEventListener("touchstart", onTouchstart);
  el.removeEventListener("touchmove", onTouchmove);
  el.removeEventListener("touchend", onTouchup);
}
;// CONCATENATED MODULE: ./src/binder.js


var binder_w = window;
function bindOf(obj, elem) {
  if (!(obj && elem)) return;
  elem.addEventListener("change", function (ev) {
    ev.target._o_handler && ev.target._o_handler();
  });
  iterateNode(elem, function (node) {
    if (1 === node.nodeType) {
      if (node.hasAttribute("o-model")) {
        if (!!~"INPUT SELECT TEXTAREA".indexOf(node.tagName)) {
          onInputNode(obj, node);
        }
      } else if (node.hasAttribute("o-for")) {
        onForNode(obj, node);
        return false;
      }

      onDatasetNode(obj, node);
    } else if (3 === node.nodeType) {
      onTextNode(obj, node);
    }
  });
}

function onTextNode(obj, node) {
  node.textContent && doTextReplacer(obj, node.textContent, function (get) {
    var el = node;
    return function () {
      el.textContent = get();
    };
  });
}

function onDatasetNode(obj, node) {
  var dataset = node.dataset;
  Object.keys(dataset).forEach(function (key) {
    doTextReplacer(obj, dataset[key], function (get) {
      return function () {
        dataset[key] = get();
      };
    });
  });
}

function iterateNode(node, visitor) {
  assert_assert["function"](visitor, "visitor");
  if (!node) return;
  var visited = now();
  var waits = [node.firstChild];
  var el;

  while (0 < waits.length) {
    while (el = waits[waits.length - 1]) {
      if (el._o_visited === visited) {
        throw Error("loopping in the dom tree: " + el.localname + "(" + el.className + ")");
      }

      el._o_visited === visited;
      waits[waits.length - 1] = el.nextSibling;
      if (false === visitor(el)) break;
      el.firstChild && waits.push(el.firstChild);
    }

    waits.pop();
  }
}

function onInputNode(obj, node) {
  var model = popAttribute(node, "o-model");
  var type = node.type && node.type.toLowerCase();

  function createHandler() {
    var parsedObj = parseObjectKey(obj, model);
    var bindings = binder(parsedObj.source, parsedObj.prop);
    var el = node;
    var action = {};

    if ("radio" === type) {
      action.set = function (val) {
        el.checked = el.value === parsedObj.filter(val).toString();
      };
    } else if ("checkbox" === type) {
      if (Array.isArray(parsedObj.get())) {
        action.checkbox = el;

        action.set = function (val) {
          el.checked = val && ~parsedObj.filter(val).indexOf(el.value);
        };

        action.get = function () {
          return bindings.reduce(function (a, b) {
            b.checkbox && b.checkbox.checked && a.push(b.checkbox.value);
            return a;
          }, []);
        };
      } else {
        action.set = function (val) {
          el.checked = "true" === parsedObj.filter(val).toString();
        };

        action.get = function () {
          return el.checked;
        };
      }
    } else if ("SELECT" === node.nodeName && node.multiple) {
      if (!Array.isArray(parsedObj.get())) {
        throw TypeError('"' + parsedObject.prop + '" must be array to use a multiple select.');
      }

      action.set = function (val) {
        var value = parsedObj.filter(val);
        Array.prototype.forEach.call(el.options, function (it) {
          it.selected = !!~value.indexOf(it.value);
        });
      };

      action.get = function () {
        return Array.prototype.reduce.call(el.options, function (a, it) {
          it.selected && a.push(it.value);
          return a;
        }, []);
      };
    }

    action.set = action.set || function (val) {
      el.value = parsedObj.filter(val);
    };

    action.get = action.get || function () {
      return el.value;
    };

    bindings.push(action);
    action.set(parsedObj.get());
    return function () {
      parsedObj.set(action.get());
    };
  }

  node._o_handler = createHandler();
}

function onForNode(obj, node) {
  var valFor = popAttribute(node, "o-for");
  var valKey = popAttribute(node, "o-key");
  if (!valKey) throw TypeError("key is not exist or empty. requied it.");
  var parent = node.parentElement;
  var template = node;
  parent.removeChild(node);
  var props = valFor.split(".");
  var source = obj;

  for (var i = 0; i < props.length; ++i) {
    source = source[props[i]];
  }

  if (!(source instanceof Array)) {
    throw TypeError('"' + valFor + '" is invalid type. expected array type.');
  }

  var binding = binder(source);
  binder_wrapper(source, "push", function (val) {
    var key = val[valKey];
    if (!key) throw TypeError("key is not exist in array.");
    appendItem(val);

    source._push(val);
  });
  binder_wrapper(source, "pop", function () {
    deleteItem(source[source.length - 1]);

    source._pop();
  });
  binder_wrapper(source, "splice", function (start, deleteCount) {
    if (0 > start) start = Math.max(source.length + start, 0);
    var n = Math.min(start + (deleteCount || source.length), source.length);

    for (var _i = start; _i < n; ++_i) {
      deleteItem(source[_i]);
    }

    source._splice(start, deleteCount);
  });
  binder_wrapper(source, "sort", function () {
    source._sort.apply(source, arguments);

    while (parent.firstChild) {
      parent.removeChild(parent.firstChild);
    }

    parent.append.apply(parent, source.map(function (each) {
      return binding[each[valKey]];
    }));
  });

  function appendItem(item) {
    var clone = template.cloneNode(true);
    parent.appendChild(clone);
    binding[item[valKey]] = clone;
    bindOf(item, clone);
  }

  function deleteItem(item) {
    var key = item[valKey];
    var bindedNode = binding[key];
    bindedNode && parent.removeChild(bindedNode);
    delete binding[key];
  }

  source.forEach(function (item) {
    appendItem(item);
  });
}

function binder(obj, prop) {
  obj._o_ || Object.defineProperty(obj, "_o_", {
    value: {},
    writable: true
  });
  var bindings = obj._o_[prop];

  if (!bindings) {
    var value = obj[prop];
    obj._o_[prop] = bindings = [];

    if (value instanceof Function) {
      throw TypeError('"' + value.name + '" is invalid type, expected value type');
    }

    prop && Object.defineProperty(obj, prop, {
      get: function get() {
        return value;
      },
      set: function set(newValue) {
        if (value === newValue) return;
        value = newValue;
        bindings.forEach(function (it) {
          it.set(value);
        });
      },
      enumerable: true
    });
  }

  return bindings;
}

function binder_wrapper(source, attr, fn) {
  source["_" + attr] = source[attr];
  source[attr] = fn;
}

var preRe = /{{([\w\d\s$_|\.]+?)}}/g;
var postRe = /{{([\w\d$_]+?)}}/g;

function doTextReplacer(obj, text, factorySet) {
  var mappings = [];
  var nomarizedText = text.replace(preRe, function (m, k) {
    var parsedObj = parseObjectKey(obj, k);
    mappings.push(parsedObj);
    return "{{" + parsedObj.prop + "}}";
  });
  mappings.forEach(function (it) {
    var txt = nomarizedText;

    function get() {
      return txt.replace(postRe, function (m, k) {
        return it.source.hasOwnProperty(k) ? it.filter(it.source[k]) : void 0;
      });
    }

    var action = {
      set: factorySet(get)
    };
    binder(it.source, it.prop).push(action);
    action.set();
  });
}

function popAttribute(node, attName) {
  var ret = node.getAttribute(attName);
  node.removeAttribute(attName);
  return ret;
}

function parseObjectKey(obj, prop) {
  var filters = prop.split("|").map(function (a) {
    return a.trim();
  });
  var attr = filters.shift();
  var attrs = attr.split(".");
  filters.forEach(function (each) {
    assert_assert["function"](binder_w[each], each);
  });
  var source = obj;

  for (var i = 0; i < attrs.length - 1; ++i) {
    source = source[attrs[i]];
  }

  if (void 0 === source) throw TypeError('"' + prop + '" is invalid property.');
  return {
    source: source,
    prop: attrs[attrs.length - 1],
    filter: filters.reduce.bind(filters, function (a, f) {
      return binder_w[f](a);
    }),
    get: function get() {
      return this.source[this.prop];
    },
    set: function set(val) {
      return this.source[this.prop] = val;
    }
  };
}
;// CONCATENATED MODULE: ./src/dom.js
function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }


function appendFormData(formData, key, value) {
  if (Array.isArray(value)) {
    for (var i = 0; i < value.length; ++i) {
      appendFormData(formData, key + "[" + i + "]", value[i]);
    }
  } else if ("object" === _typeof(value)) {
    for (var k in value) {
      appendFormData(formData, key + "." + k, value[k]);
    }
  } else {
    formData.append(key, value);
  }
}
function mixinObject() {
  this.on = this.addEventListener;
  this.off = this.removeEventListener;
  return this;
}
function watchAttribute(dom, name, callback) {
  assert["function"](callback, "callback");

  if (!dom) {
    return;
  }

  var observer = new MutationObserver(function (targets) {
    for (var i = 0; i < targets.length; ++i) {
      var target = targets[i];

      if ("attributes" === target.type && name === target.attributeName) {
        callback(target.target);
        break;
      }
    }
  });
  observer.observe(dom, {
    attributes: true
  });
}
function watchDom(dom, callback) {
  assert["function"](callback, "callback");
  if (!dom) return;
  var observer = new MutationObserver(function (objects) {
    for (var i = 0; i < objects.length; ++i) {
      var obj = objects[i];
      callback(obj.addedNodes);
    }
  }); // childList:true로 변경사항 감지.
  // 자식 변경은 감지못함(subtree:true로 설정해야 가능)

  observer.observe(dom, {
    childList: true
  });
}
function find(selector, el) {
  return (el || d).querySelector(selector);
}
function findAll(selector, el) {
  return this.toArray((el || d).querySelectorAll(selector));
}
function findAllByClass(className, el) {
  return this.toArray((el || d).getElementsByClassName(className));
}
function findAllByTag(tagName, el) {
  return this.toArray((el || d).getElementsByTagName(tagName));
}
function findParent(el, compare) {
  if (!(el && compare)) {
    return undefined;
  }

  if ("string" === typeof compare) {
    var nodeName = compare.toUpperCase();

    compare = function compare(node) {
      return node.nodeName === nodeName;
    };
  }

  do {
    if (compare(el)) return el;
    el = el.parentElement || el.parentNode;
  } while (el && 1 === el.nodeType);

  return null;
}
function dom2str(el) {
  // TODO outerHTML
  var div = d.createElement("div");
  div.appendChild(el.parentElement ? el.cloneNode(true) : el);
  return div.innerHTML;
}
function tag2dom(tagName, attributes) {
  var obj = utils_assign(d.createElement(tagName), attributes);
  mixinObject.call(obj);
  return obj;
}
function redirectForm(url, data) {
  var form = createTag("form", {
    method: "post",
    action: url
  });

  for (var key in data) {
    form.append(createTag("input", {
      type: "hidden",
      name: key,
      value: data[key]
    }));
  }

  d.body.append(form);
  form.submit();
}
function on(elem, type, selector, listener, options) {
  if (!(elem && type)) return;

  if (selector instanceof Function) {
    options = listener;
    listener = selector;
    selector = null;
  }

  if (!(listener instanceof Function)) {
    throw TypeError("listener must be function");
  }

  elem.addEventListener(type, selector ? function (ev) {
    ev.target.matches(selector) && listener.call(ev.target, ev);
  } : function (ev) {
    listener.call(ev.target, ev);
  }, options);
}
function off(elem, type, listener, options) {
  if (!(elem && type)) return;

  if (!(listener instanceof Function)) {
    throw TypeError("listener must be function");
  }

  elem.removeEventListener(elem, type, listener, options);
}
function getForm(elem) {
  var ret = {};
  elem && elem.querySelectorAll("input,select,textarea").forEach(function (each) {
    var name = each.name && each.name.trim();
    if (!name) return;

    switch (each.tagName) {
      case "INPUT":
      case "TEXTAREA":
        switch (each.type) {
          case "checkbox":
          case "radio":
            each.checked && (ret[name] = each.value);
            break;

          case "file":
            each.files.length && (ret[name] = each.files);
            break;

          case "button":
          case "submit":
          case "reset":
            break;

          default:
            each.value && (ret[name] = each.value);
            break;
        }

        break;

      case "SELECT":
        var val = each.querySelector("option:checked").value;
        val && (ret[name] = val);
        break;
    }
  });
  return ret;
}
function setForm(elem, obj) {
  elem && elem.querySelectorAll("input,select,textarea").forEach(function (node) {
    var name = node.name && node.name.trim();
    if (!name) return;

    switch (node.tagName) {
      case "INPUT":
      case "TEXTAREA":
        switch (node.type) {
          case "checkbox":
          case "radio":
            node.checked = node.value === obj[name].toString();
            break;

          case "button":
          case "submit":
          case "reset":
          case "file":
            break;

          default:
            node.value = obj[name];
            break;
        }

        break;

      case "SELECT":
        Array.prototype.forEach(node.options, function (opt) {
          opt.checked = opt.value === obj[name];
        });
        break;
    }
  });
}
function createTag(name, attributes) {
  var obj = utils_assign(document.createElement(name), attributes);
  EventMixin.call(obj);
  return obj;
}
;// CONCATENATED MODULE: ./src/index.js
// import {
//   mixin,
//   assign,
// } from "./utils";
// import {
//   appendFormData,
//   findParent,
//   findAllByTag,
// } from "./dom";








var src_d = document;
var getById = src_d.getElementById.bind(src_d);
function getJson(url, data) {
  return ajaxJson({
    url: url,
    method: "GET"
  }, data);
}
function postJson(url, data) {
  return ajaxJson({
    url: url,
    method: "POST"
  }, data);
}
function putJson(url, data) {
  return ajaxJson({
    url: url,
    method: "PUT"
  }, data);
}
function deleteJson(url, data) {
  return ajaxJson({
    url: url,
    method: "DELETE"
  }, data);
}
function postForm(url, formData) {
  formData = convertToFormData(formData);
  return ajax({
    url: url + "?" + toQueryString(null, true),
    method: "POST"
  }, formData).then(function (res) {
    return res.json();
  });
}
function postMultipart(url, formData) {
  //TODO xhr.upload.onprogress 추가
  formData = convertToFormData(formData);
  return ajax({
    url: url,
    method: "POST",
    headers: {
      "Content-Type": "multipart/form-data"
    }
  }, formData);
}
function convertToFormData(data) {
  if (!data || ~data.toString().lastIndexOf("FormData")) {
    return data;
  }

  var ret = new FormData();

  for (var key in data) {
    appendFormData(ret, key, data[key]);
  }

  return ret;
}
function evalInContext(str, ctx) {
  return newFunction(str).call(ctx);
}
var src_tickData = {};
function getTick(id) {
  return src_tickData[id];
}
function resetTick(id) {
  delete src_tickData[id];
} // export const {
//   decodeHTML,
//   formatNumber,
//   formatBytes,
// } = str;
//   /*
//         sub는 base를 상속하도록 연결함. sub 생성자에서 base을 생성자를 명시적으로 호출 필요.
//         권장하는 방식으로 OOP에서도 부모 생성자를 명시적으로 호출이 필요함.
//         function P(opts) {}
//         function C(opts) {
//             P.call(this, opts);
//         }
//         extend(C, P);
//        */
/******/ 	return __webpack_exports__;
/******/ })()
;
});