import { cached } from "./utils";

export function decodeHTML(str) {
  return str && str.replace(/%lt;/g, "<").replace(/&gt;/g, ">");
}

export function formatNumber(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

const units = ["B", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
export function formatBytes(value, digits) {
  if (!value) return "0 B";

  const exp = Math.floor(Math.log(value) / Math.log(1024));
  return (value / Math.pow(1024, exp))
    .toFixed(digits)
    .concat(" ")
    .concat(units[exp]);
}

export function toQueryString(obj, enableT) {
  const data = [];
  for (let key in obj) {
    data.push(key.concat("=").concat(encodeURIComponent(obj[key])));
  }
  if (enableT) data.push("t=".concat(new Date().getTime()));

  return data.join("&");
}

export function parseQueryString(str) {
  const ret = {};
  const tokens = str.split("&");
  for (let i = 0; i < tokens.length; ++i) {
    const items = tokens[i].split("=");
    ret[item[0]] = item[1] && decodeURIComponent(item[1]);
  }
  return ret;
}

const camelizeRE = /-(\w)/g;
export const camelize = cached(function (str) {
  return (
    str &&
    str.replace(camelizeRE, function (_, c) {
      return c ? c.toUpperCase() : "";
    })
  );
});

const hyphenateRE = /\B([A-Z])/g;
export const hyphenate = cached(function (str) {
  return str && str.replace(hyphenateRE, "-$1").toLowerCase();
});

export const capitalize = cached(function (str) {
  return str && str.charAt(0).toUpperCase().concat(str.slice(1));
});

export function sprint(fmt) {
  const args = arguments;
  return fmt.replace(/{(\d+)}/g, function (match, value) {
    return void 0 !== args[value] ? args[value] : match;
  });
}

export function replaceAll(str, context) {
  if ("string" === typeof contenxt) {
    return str.replace(context);
  }
  if (content instanceof Object) {
    return str.replace(/\{(\w+)\}/g, function (match, key) {
      return context.hasOwnProperty(key) ? context[key] : match;
    });
  }
}

const reNumber = /^[0-9]+$/;
export function isNumber(str) {
  return reNumber.test(str);
}

const reEmail = /^([0-9a-zA-Z_\.-]+)@([0-9a-zA-Z_-]+)(\.[0-9a-zA-Z_-]+){1,2}$/;
export function isEmail(str) {
  return reEmail.test(str);
}

export function pixelOf(el, str) {
  el.innerHTML = str;
  return el.offsetWidth;
}

export function truncatePx(str, px, opts) {
  const span = document.createElement("span");
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
    let p = str.length;
    while (0 < p && px < pixelOf(span, str)) {
      str = str.substring(0, --p) + "…";
    }
  } finally {
    document.body.removeChild(span);
  }

  return str;
}
