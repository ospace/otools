import Next from "./next";

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
          const res = new HttpResponse(xhr);
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
  opts.url = opts.url + "?" + this.toQueryString(queryData, true);
  opts.headers = assign(opts.headers || {}, {
    "Content-Type": "application/json;charset=UTF-8",
  });

  const queryData = null;
  if (data && ("GET" === opts.method || "DELETE" === opts.method)) {
    queryData = data;
    data = null;
  }

  return this.ajax(opts, data && JSON.stringify(data)).then(function (res) {
    return res.json();
  });
}

export function newFunction(str) {
  return new Function("with(this){return " + str + "}");
}

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
