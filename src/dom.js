import { assign, now } from "./utils";
import assert from "./assert";

export function appendFormData(formData, key, value) {
  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; ++i) {
      appendFormData(formData, key + "[" + i + "]", value[i]);
    }
  } else if ("object" === typeof value) {
    for (let k in value) {
      appendFormData(formData, key + "." + k, value[k]);
    }
  } else {
    formData.append(key, value);
  }
}

export function mixinObject() {
  this.on = this.addEventListener;
  this.off = this.removeEventListener;
  return this;
}

export function watchAttribute(dom, name, callback) {
  assert.function(callback, "callback");

  if (!dom) {
    return;
  }
  const observer = new MutationObserver(function (targets) {
    for (let i = 0; i < targets.length; ++i) {
      const target = targets[i];
      if ("attributes" === target.type && name === target.attributeName) {
        callback(target.target);
        break;
      }
    }
  });
  observer.observe(dom, { attributes: true });
}

export function watchDom(dom, callback) {
  assert.function(callback, "callback");

  if (!dom) return;
  const observer = new MutationObserver(function (objects) {
    for (let i = 0; i < objects.length; ++i) {
      const obj = objects[i];
      callback(obj.addedNodes);
    }
  });
  // childList:true로 변경사항 감지.
  // 자식 변경은 감지못함(subtree:true로 설정해야 가능)
  observer.observe(dom, { childList: true });
}

export function find(selector, el) {
  return (el || d).querySelector(selector);
}
export function findAll(selector, el) {
  return this.toArray((el || d).querySelectorAll(selector));
}
export function findAllByClass(className, el) {
  return this.toArray((el || d).getElementsByClassName(className));
}
export function findAllByTag(tagName, el) {
  return this.toArray((el || d).getElementsByTagName(tagName));
}
export function findParent(el, compare) {
  if (!(el && compare)) {
    return undefined;
  }
  if ("string" === typeof compare) {
    const nodeName = compare.toUpperCase();
    compare = function (node) {
      return node.nodeName === nodeName;
    };
  }

  do {
    if (compare(el)) return el;
    el = el.parentElement || el.parentNode;
  } while (el && 1 === el.nodeType);
  return null;
}

export function dom2str(el) {
  // TODO outerHTML
  const div = d.createElement("div");
  div.appendChild(el.parentElement ? el.cloneNode(true) : el);
  return div.innerHTML;
}

export function tag2dom(tagName, attributes) {
  const obj = assign(d.createElement(tagName), attributes);
  mixinObject.call(obj);
  return obj;
}

export function redirectForm(url, data) {
  const form = createTag("form", { method: "post", action: url });
  for (let key in data) {
    form.append(
      createTag("input", {
        type: "hidden",
        name: key,
        value: data[key],
      })
    );
  }
  d.body.append(form);
  form.submit();
}

export function on(elem, type, selector, listener, options) {
  if (!(elem && type)) return;
  if (selector instanceof Function) {
    options = listener;
    listener = selector;
    selector = null;
  }
  if (!(listener instanceof Function)) {
    throw TypeError("listener must be function");
  }
  elem.addEventListener(
    type,
    selector
      ? function (ev) {
          ev.target.matches(selector) && listener.call(ev.target, ev);
        }
      : function (ev) {
          listener.call(ev.target, ev);
        },
    options
  );
}

export function off(elem, type, listener, options) {
  if (!(elem && type)) return;
  if (!(listener instanceof Function)) {
    throw TypeError("listener must be function");
  }
  elem.removeEventListener(elem, type, listener, options);
}

export function getForm(elem) {
  const ret = {};
  elem &&
    elem.querySelectorAll("input,select,textarea").forEach(function (each) {
      let name = each.name && each.name.trim();
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
          let val = each.querySelector("option:checked").value;
          val && (ret[name] = val);
          break;
      }
    });

  return ret;
}

export function setForm(elem, obj) {
  elem &&
    elem.querySelectorAll("input,select,textarea").forEach(function (node) {
      let name = node.name && node.name.trim();
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

export function createTag(name, attributes) {
  const obj = assign(document.createElement(name), attributes);
  EventMixin.call(obj);
  return obj;
}

function EventMixin() {
  this.on = this.addEventListener;
  this.off = this.removeEventListener;
}

export function Resizable(el) {
  this.el = el;
  this.style = Object.assign(el.style, {
    position: "absolute",
    "pointer-events": "none",
  });
}

Object.assign(Resizable.prototype, {
  move(x, y) {
    this.style.top = y + "px";
    this.style.left = x + "px";
    return this;
  },
  resize(w, h) {
    this.style.width = w + "px";
    this.style.height = h + "px";
    return this;
  },
  scale(val) {
    const { width, height } = this.el.getBoundingClientRect();
    this.resize(width * val, height * val);
    return this;
  },
});

export function dispatchMouse(target) {
  [
    ["touchstart", "mousedown"],
    ["touchmove", "mousemove"],
    ["touchend", "mouseup"],
  ].forEach((it) => {
    target.addEventListener(it[0], function (ev) {
      "touchstart" === it[0] && ev.preventDefault();
      const touch = ev.touches ? ev.touches[0] : null;
      ev.target.dispatchEvent(new MouseEvent(it[1], touch));
    });
  });
}

export function activeHide() {
  const hiddenElements = new Set();
  const observer = new MutationObserver(function (ev) {
    ev.forEach(({ target }) => {
      if (target.classList && target.classList.contains("hide")) {
        target.style.display = "none";
        hiddenElements.add(target);
      } else {
        if (hiddenElements.has(target)) {
          hiddenElements.delete(target);
          target.style.display = null;
        }
      }
    });
  });
  observer.observe(document.body, {
    attributes: true,
    attributeFilter: ["class"],
    childList: false,
    characterData: false,
    subtree: true,
  });
}

export function iterateNode(node, visitor) {
  assert.function(visitor, "visitor");

  if (!node) return;

  const visited = now();
  const waits = [node];
  let el;
  while (0 < waits.length) {
    el = waits.shift();
    if (!document.body.contains(el)) continue;
    if (false === visitor(el)) return;
    for (el = el.firstChild; el; el = el.nextSibling) {
      if (el._o_visited === visited) {
        throw Error(
          "loopping in the dom tree: " + el.localname + "(" + el.className + ")"
        );
      }
      waits.push(el);
      el._o_visited === visited;
    }
  }
}
