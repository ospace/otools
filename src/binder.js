import { now } from "./utils";
import assert from "./assert";

const w = window;

export function bindOf(obj, elem) {
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
  node.textContent &&
    doTextReplacer(obj, node.textContent, function (get) {
      const el = node;
      return function () {
        el.textContent = get();
      };
    });
}

function onDatasetNode(obj, node) {
  const dataset = node.dataset;
  Object.keys(dataset).forEach(function (key) {
    doTextReplacer(obj, dataset[key], function (get) {
      return function () {
        dataset[key] = get();
      };
    });
  });
}

function iterateNode(node, visitor) {
  assert.function(visitor, "visitor");

  if (!node) return;

  const visited = now();
  const waits = [node.firstChild];
  let el;
  while (0 < waits.length) {
    while ((el = waits[waits.length - 1])) {
      if (el._o_visited === visited) {
        throw Error(
          "loopping in the dom tree: " + el.localname + "(" + el.className + ")"
        );
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
  const model = popAttribute(node, "o-model");
  const type = node.type && node.type.toLowerCase();

  function createHandler() {
    const parsedObj = parseObjectKey(obj, model);
    const bindings = binder(parsedObj.source, parsedObj.prop);
    const el = node;
    const action = {};

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
        throw TypeError(
          '"' + parsedObject.prop + '" must be array to use a multiple select.'
        );
      }

      action.set = function (val) {
        let value = parsedObj.filter(val);
        Array.prototype.forEach.call(el.options, function (it) {
          it.selected = !!~value.indexOf(it.value);
        });
      };
      action.get = function () {
        return Array.prototype.reduce.call(
          el.options,
          function (a, it) {
            it.selected && a.push(it.value);
            return a;
          },
          []
        );
      };
    }

    action.set =
      action.set ||
      function (val) {
        el.value = parsedObj.filter(val);
      };
    action.get =
      action.get ||
      function () {
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
  const valFor = popAttribute(node, "o-for");
  const valKey = popAttribute(node, "o-key");

  if (!valKey) throw TypeError("key is not exist or empty. requied it.");

  const parent = node.parentElement;
  const template = node;
  parent.removeChild(node);

  const props = valFor.split(".");
  let source = obj;
  for (let i = 0; i < props.length; ++i) {
    source = source[props[i]];
  }

  if (!(source instanceof Array)) {
    throw TypeError('"' + valFor + '" is invalid type. expected array type.');
  }

  const binding = binder(source);
  wrapper(source, "push", function (val) {
    const key = val[valKey];
    if (!key) throw TypeError("key is not exist in array.");
    appendItem(val);
    source._push(val);
  });

  wrapper(source, "pop", function () {
    deleteItem(source[source.length - 1]);
    source._pop();
  });

  wrapper(source, "splice", function (start, deleteCount) {
    if (0 > start) start = Math.max(source.length + start, 0);
    const n = Math.min(start + (deleteCount || source.length), source.length);
    for (let i = start; i < n; ++i) {
      deleteItem(source[i]);
    }
    source._splice(start, deleteCount);
  });

  wrapper(source, "sort", function () {
    source._sort.apply(source, arguments);
    while (parent.firstChild) {
      parent.removeChild(parent.firstChild);
    }
    parent.append.apply(
      parent,
      source.map(function (each) {
        return binding[each[valKey]];
      })
    );
  });

  function appendItem(item) {
    const clone = template.cloneNode(true);
    parent.appendChild(clone);
    binding[item[valKey]] = clone;
    bindOf(item, clone);
  }

  function deleteItem(item) {
    const key = item[valKey];
    const bindedNode = binding[key];
    bindedNode && parent.removeChild(bindedNode);
    delete binding[key];
  }

  source.forEach(function (item) {
    appendItem(item);
  });
}

function binder(obj, prop) {
  obj._o_ || Object.defineProperty(obj, "_o_", { value: {}, writable: true });
  let bindings = obj._o_[prop];
  if (!bindings) {
    let value = obj[prop];
    obj._o_[prop] = bindings = [];
    if (value instanceof Function) {
      throw TypeError(
        '"' + value.name + '" is invalid type, expected value type'
      );
    }
    prop &&
      Object.defineProperty(obj, prop, {
        get: function () {
          return value;
        },
        set: function (newValue) {
          if (value === newValue) return;
          value = newValue;
          bindings.forEach(function (it) {
            it.set(value);
          });
        },
        enumerable: true,
      });
  }
  return bindings;
}

function wrapper(source, attr, fn) {
  source["_" + attr] = source[attr];
  source[attr] = fn;
}

const preRe = /{{([\w\d\s$_|\.]+?)}}/g;
const postRe = /{{([\w\d$_]+?)}}/g;
function doTextReplacer(obj, text, factorySet) {
  const mappings = [];
  const nomarizedText = text.replace(preRe, function (m, k) {
    const parsedObj = parseObjectKey(obj, k);
    mappings.push(parsedObj);
    return "{{" + parsedObj.prop + "}}";
  });

  mappings.forEach(function (it) {
    const txt = nomarizedText;
    function get() {
      return txt.replace(postRe, function (m, k) {
        return it.source.hasOwnProperty(k) ? it.filter(it.source[k]) : void 0;
      });
    }

    const action = { set: factorySet(get) };
    binder(it.source, it.prop).push(action);
    action.set();
  });
}

function popAttribute(node, attName) {
  const ret = node.getAttribute(attName);
  node.removeAttribute(attName);
  return ret;
}

function parseObjectKey(obj, prop) {
  const filters = prop.split("|").map(function (a) {
    return a.trim();
  });
  const attr = filters.shift();
  const attrs = attr.split(".");

  filters.forEach(function (each) {
    assert.function(w[each], each);
  });

  let source = obj;
  for (let i = 0; i < attrs.length - 1; ++i) {
    source = source[attrs[i]];
  }

  if (void 0 === source) throw TypeError('"' + prop + '" is invalid property.');

  return {
    source: source,
    prop: attrs[attrs.length - 1],
    filter: filters.reduce.bind(filters, function (a, f) {
      return w[f](a);
    }),
    get: function () {
      return this.source[this.prop];
    },
    set: function (val) {
      return (this.source[this.prop] = val);
    },
  };
}
