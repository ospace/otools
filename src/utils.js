import Next from "./next";
import { toQueryString } from "./string";

const w = window;
const MutationObserver = w.MutationObserver || w.WebKitMutationObserver;

export function wrapper(source, attr, fn) {
  source["_" + attr] = source[attr];
  source[attr] = fn;
}

export function cached(fn) {
  const cache = Object.create(null);
  return function cachedFn(arg) {
    const hit = cache[arg];
    return hit || (cache[arg] = fn(arg));
  };
}

export function mixin(target) {
  for (let i = 1; i < arguments.length; ++i) {
    const arg = arguments[i];
    if (arg instanceof Function) {
      arg.call(target);
    } else {
      assign(target.prototype, arg);
    }
  }
  return target;
}

export function assign(target, source, deep) {
  const target_ = target || {};
  for (let key in source) {
    const src = source[key];
    target_[key] =
      deep && src instanceof Object ? assign(target_[key], src) : src;
  }
  return target_;
}

export function str2dom(text) {
  const res = new DOMParser().parseFromString(text, "text/xml");
  return res.firstChild;
}

export const now =
  w.performance &&
  w.performance.timing &&
  w.performance.timing.navigationStart &&
  w.performance.now
    ? function () {
        return w.performance.timing.navigationStart + w.performance.now();
      }
    : function () {
        return new Date().getTime();
      };

export function tick(id) {
  const t = now();
  tickData[id] = tickData[id] || [];
  tickData[id].push(t);
}

export function ajax(opts, data) {
  opts = assign({ method: "GET", responseType: "", headers: {} }, opts, true);
  data = data || opts.data;

  return new Next(function (resolve, reject) {
    try {
      const xhr = new XMLHttpRequest();
      opts.responseType && (xhr.responseType = opts.responseType);

      xhr.onreadystatechange = function () {
        if (xhr.readyState === XMLHttpRequest.DONE) {
          let res = new HttpResponse(xhr);
          mixinHttpResponse.call(res);
          resolve(res);
        }
      };
      xhr.open(opts.method, opts.url, true);
      for (let key in opts.headers) {
        xhr.setRequestHeader(key, opts.headers[key]);
      }
      xhr.send(data);
    } catch (ex) {
      reject(ex);
    }
  });
}

function mixinHttpResponse() {
  const text = this.bodyText;
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
  const headers = (this.headers = {});
  xhr
    .getAllResponseHeaders()
    .split("\r\n")
    .forEach(function (each) {
      const p = each.indexOf(":");
      ~p &&
        (headers[each.substring(0, p).trim()] = each.substring(p + 1).trim());
    });
}

export function ajaxJson(opts, data) {
  opts = assign({ method: "GET" }, opts, true);
  opts.url = opts.url + "?" + toQueryString(queryData, true);
  opts.headers = assign(opts.headers || {}, {
    "Content-Type": "application/json;charset=UTF-8",
  });

  let queryData = null;
  if (data && ("GET" === opts.method || "DELETE" === opts.method)) {
    queryData = data;
    data = null;
  }

  return ajax(opts, data && JSON.stringify(data)).then(function (res) {
    return res.json();
  });
}

export function newFunction(str) {
  return new Function("with(this){return " + str + "}");
}

// sub는 base를 상속하도록 연결함. sub 생성자에서 base을 생성자를 명시적으로 호출 필요.
// 권장하는 방식으로 OOP에서도 부모 생성자를 명시적으로 호출이 필요함.
// function P(opts) {}
// function C(opts) {
//     P.call(this, opts);
// }
// extend(C, P);
export function extend(sub, base) {
  sub.prototype = Object.assign(Object.create(base.prototype), sub.prototype);
  sub.prototype.constructor = sub;
  sub.base = base;
  return sub;
}

export function extendDefault(sub, base) {
  sub.prototype = Object.assign(new base(), sub.prototype);
  sub.prototype.constructor = sub;
  sub.base = base;
  return sub;
}

export function watch(obj, key, callback) {
  assert.function(callback, "callback");

  const value = obj[key];
  Object.defineProperty(obj, key, {
    set: function (val) {
      value = val;
      callback(val);
    },
    get: function () {
      return value;
    },
  });
}

export function arrayIndex(array, compare) {
  if ("string" === typeof compare) {
    const keyword = compare;
    compare = function (val) {
      return val === keyword;
    };
  } else {
    assert.function(compare, "compare");
  }
  for (let i = 0; i < array.length; ++i) {
    if (compare(array[i])) return i;
  }
  return -1;
}

export function readFileString(file) {
  readFileCB(file, function (reader, file) {
    return reader.readAsBinaryString(file);
  });
}

export function readFileArray(file) {
  readFileCB(file, function (reader, file) {
    return reader.readAsArrayBuffer(file);
  });
}

function readFileCB(file, readCb) {
  console.assert("function" === typeof readCb, "invalid type of readCb");
  return new Promise(function (resolve, reject) {
    const reader = new FileReader();
    reader.onload = function (ev) {
      resolve(ev.target.result);
    };
    reader.onerror = function (err) {
      reject(err);
    };
    readCb(reader, file);
  });
}

export function once(fn) {
  const called = false;
  return function () {
    if (called) return;
    fn.apply(fn, arguments);
  };
}

export function readUrl(url) {
  return new Promise(function (resolve, reject) {
    const xhr = new XMLHttpRequest();
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

export function randomRange(min, max) {
  return min + Math.floor(Math.random() * (max - min + 1));
}

export function round(value, decimal) {
  const fix = Math.pow(10, decimal);
  return Math.round(value * fix) / fix;
}

export function toArray(obj) {
  return Array.prototype.slice.call(obj);
}

// 싱글터치(멀티터치/터치스크롤 미지원) 이벤트를 마우스 이벤트로 바인딩해서 처리
function onTouchstart(ev) {
  ev.preventDefault();
  const { target, touches } = ev;
  const { clientX, clientY } = touches[0];

  target.dispatchEvent(new MouseEvent("mousedown", { clientX, clientY }));
}

function onTouchmove({ target, touches }) {
  const { clientX, clientY } = touches[0];
  target.dispatchEvent(new MouseEvent("mousemove", { clientX, clientY }));
}

function onTouchup({ target }) {
  target.dispatchEvent(new MouseEvent("mouseup"));
}

export function bindTouch(el) {
  if (!el) return;
  console.assert(!!el.addEventListener, "el must be addEventListener");
  el.addEventListener("touchstart", onTouchstart);
  el.addEventListener("touchmove", onTouchmove);
  el.addEventListener("touchend", onTouchup);
}

export function unbindTouch(el) {
  if (!el) return;
  console.assert(!!el.removeEventListener, "el must be removeEventListener");
  el.removeEventListener("touchstart", onTouchstart);
  el.removeEventListener("touchmove", onTouchmove);
  el.removeEventListener("touchend", onTouchup);
}

// 안드로이드 offset 위치 변환
export function clientToOffset(target, clientX, clientY) {
  return {
    offsetX: clientX - target.left,
    offsetY: clientY - target.top,
  };
}

export function benchmark(fn, timeoutMsec) {
  const to = Date.now() + (timeoutMsec || 1000);
  let count = 0;
  while (to > Date.now()) {
    let r = fn();
    ++count;
  }
  const end = Date.now();
  const runtime = (end - to) / 1000.0 + 1.0;
  const speed = count / runtime;

  console.log(
    `runtime: ${runtime} sec, count: ${count} ea, speed: ${speed} ea/s`
  );

  return { runtime, count, speed };
}

export function loadImage(src) {
  return new Promise(function (resolve, reject) {
    let image = new Image();
    image.onload = function () {
      resolve(image);
    };
    image.onerror = function () {
      reject({ message: `loading image failed: ${this.src}` });
    };
    image.src = src;
  });
}
