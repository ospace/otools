import {
  extend,
  proxyObj,
  EventBus,
  createFn,
  iterateObj,
  isFunction,
  defineHiddenProperty,
  mapRegex,
} from "./utils";
import { iterateNode } from "./dom";

const w = window;

const SHORT_WORDS = {
  "@": "o-on:",
  getWord(name) {
    let keyword = SHORT_WORDS[name.charAt(0)];
    return keyword ? keyword + name.substr(1) : name;
  },
};

function OBinder() {
  EventBus.apply(this, arguments);
  this.objKeys = [];
  this.metaObj = {
    el: null,
    on: this.$on.bind(this),
    off: this.$off.bind(this),
    fire: this.fire.bind(this),
  };
}

extend(OBinder, EventBus, {
  bind(obj, elem) {
    iterateObj(obj, (target, key, prefix) =>
      this.objKeys.push(`${prefix}.${key}.`)
    );

    this.objKeys.sort((l, r) => (l < r ? 1 : -1));

    for (let k in this.metaObj) {
      const key = "$" + k;
      if (obj.hasOwnProperty(key)) continue;
      // console.warn(`object has property already: ${key}`);
      let value = this.metaObj[k];
      value = isFunction(value)
        ? { value, writable: false }
        : { get: () => this.metaObj[k] };
      defineHiddenProperty(obj, key, value);
    }

    let fire = () => {};

    obj = proxyObj(obj, (key, val) => {
      // const { type } = val;
      const key_ = this.findEvent(key);
      fire.call(this, key_, val, 2);
    });
    fire = this.fire;

    this.render(obj, elem);

    return obj;
  },
  render(obj, elem) {
    const errs = [];
    iterateNode(elem, (node) => {
      if (1 === node.nodeType) {
        this.bindElementNode(node, obj, errs);
      } else if (3 === node.nodeType) {
        this.bindTextNode(obj, node, errs);
      }
    });
    errs.forEach((e) => console.warn("ERROR:", e));
  },
  bindElementNode(node, obj, errs) {
    let queue = [];
    // for (const attr of node.attributes) {
    for (const attrName of node.getAttributeNames()) {
      console.log(">> node:", node.tagName, attrName, attrValue);
      const attrValue = node.getAttribute(attrName);
      const name = SHORT_WORDS.getWord(attrName);
      if (name.startsWith("o-")) {
        node.removeAttribute(attrName);
        const [cmd, option] = name.split(":");
        queue.push([
          cmd,
          { el: node, option, value: attrValue, queue, binder: this },
        ]);
      } else {
        this.bindNodeAttr(node, name, obj, attrValue, errs);
      }

      while (queue.length) {
        const [cmdId, info] = queue.shift();
        if (cmdId) {
          const cmd = directive.get(cmdId);
          if (!cmd) {
            return console.warn(`not supported directive: ${cmdId}`);
          }
          cmd.binded(node, obj, info);
        } else {
          this.bindNodeAttr(node, info.option, obj, info.value, errs);
        }
      }
    }
  },
  bindNodeAttr(el, attName, obj, value, errs) {
    console.log(">> bindNodeAttr:", attName, value);
    const self = this;
    const useProp = isUseProp(el, attName);
    this.doContentReplacer(
      value,
      function (get) {
        return function () {
          self.metaObj.el = el;
          if (useProp) {
            el[attName] = get.call(obj);
          } else {
            el.setAttribute(attName, get.call(obj));
          }
          self.metaObj.el = null;
        };
      },
      errs
    );
  },
  bindTextNode(obj, node, errs) {
    const self = this;
    node.textContent &&
      this.doContentReplacer(
        node.textContent,
        function (get) {
          return function () {
            self.metaObj.el = node;
            node.textContent = get.call(obj);
            self.metaObj.el = null;
          };
        },
        errs
      );
  },
  doContentReplacer(content, factorySetter, errs) {
    const preRe = /{{([\w\W]+?)}}/g;
    const mappings = [];
    let id = 0;
    const normalizedText = content.replace(preRe, (m, k) => {
      mappings.push(parseContent(k));
      return "${v[" + id++ + "]}";
    });

    if (!mappings.length) return;

    const fnTemplateText = createTemplate(["v"], normalizedText);

    const action = factorySetter(function () {
      try {
        return fnTemplateText(mappings.map((it) => it.get.call(this)));
      } catch (e) {
        errs && errs.push([content, e]);
        return "";
      }
    });
    action();

    mappings.forEach((mapping) =>
      mapping.keys.forEach((it) => this.$on("." + it, () => action()))
    );
  },
  $on(event, handler) {
    this.on(this.findEvent(event), handler);
  },
  $off(event, handler) {
    this.off(this.findEvent(event), handler);
  },
  findEvent(event) {
    event = event.startsWith(".") ? event : "." + event;
    event = event.endsWith(".") ? event : event + ".";
    return this.objKeys.find((it) => event.startsWith(it));
  },
});

function parseContent(value) {
  const reId =
    /(?:\.?[$\w][$\w\d]*\s*|\[\s*(?:\d*|('|")(?:\\\1|.)*?\1)\s*\])*/g;
  const reStr = /('|")((?:\\\1|.)*?)\1/g;

  const filters = value.split(/\b\s*\|(?!\|)\s*/g).map((a) => a.trim());
  const expression = filters.shift();

  let targets = mapRegex(reId, expression, (it) => it[0]);
  const excepts = mapRegex(reStr, expression, (it) => it[2]);
  targets = targets.filter(
    (it) => it && !it.startsWith(".") && !~excepts.indexOf(it)
  );

  const fnExpression = createFunction1(expression);
  const fnFilter = createFunction1(
    ["value"],
    filters.reduce((pre, it) => {
      // assert.function(w[each], each);
      if ("function" !== typeof window[it])
        throw Error(`${it} is not function!!!`);
      return `${it}(${pre})`;
    }, "value")
  );

  const getRaw = () => fnExpression.call(obj);

  return {
    keys: targets,
    get: function () {
      return fnFilter(fnExpression.call(this));
    },
    getRaw: fnExpression,
  };
}

const useValueElements = ["input", "textarea", "option", "select", "progress"];
function isUseProp(el, attrName) {
  const tagName = el.nodeName.toLowerCase();
  return (
    (~useValueElements.indexOf(tagName) &&
      attrName === "value" &&
      "button" !== el.getAttribute("type")?.toLowerCase()) ||
    ("option" === tagName && "selected" === attrName) ||
    ("input" === tagName && "checked" === attrName) ||
    ("muted" === tagName && "video" === attrName)
  );
}

function Directive() {
  this.cmds = new Map();
}

extend(Directive, null, {
  on(cmd, hook) {
    this.cmds.set(`o-${cmd}`, hook);
  },
  get(cmd) {
    return this.cmds.get(cmd);
  },
});

const directive = new Directive();

function createTemplate(args, str) {
  return createFn(...args, `return \`${str}\``);
}

function createFunction0(args, stmt) {
  const body = `with(this){${stmt ? stmt : args}}`;
  return stmt ? createFn(...args, body) : createFn(body);
}

function createFunction1(args, stmt) {
  const body = `with(this){return ${stmt ? stmt : args}}`;
  return stmt ? createFn(...args, body) : createFn(body);
}

const metaModel = {
  "input:text": function (el, option, value, queue, binder) {
    queue.push([null, { option: "value", value: `{{${value}}}`, binder }]);
    let value1 = `${value}=$event.target.value`;
    queue.push(["o-on", { option: "input", value: value1, queue }]);
  },
  "input:radio": function (el, option, value, queue, binder) {
    const value1 = `$el.value?$el.value===String(${value}):${value}`;
    queue.push(["o-bind", { option: "checked", value: value1, binder }]);
    const value2 = `
      let res=$event.target.value?($event.target.checked?$event.target.value:''): $event.target.checked;
      ${value}='true'===res?true:('false'===res?false:res);`;
    queue.push(["o-on", { option: "input", value: value2, queue, binder }]);
  },
  "input:checkbox": function (el, option, value, queue, binder) {
    const value1 = `$el.value?(Array.isArray(${value}) ? !!~${value}.indexOf($el.value) : $el.value===String(${value})):${value}`;
    queue.push(["o-bind", { option: "checked", value: value1, binder }]);

    const value2 = `if(Array.isArray(${value})) {
      let idx = ${value}.indexOf($event.target.value);
      if ($event.target.checked) {
        ~idx || ${value}.push($event.target.value);
      } else {
        ~idx && ${value}.splice(idx, 1);
      }
    } else {
      ${value}=$event.target.value?($event.target.checked?$event.target.value:''):$event.target.checked; 
    }`;
    queue.push(["o-on", { option: "input", value: value2, queue, binder }]);
  },
  "select:": function (el, option, value, queue, binder) {
    const isMultiple = el.multiple;

    if (isMultiple) {
      const value1 = `Array.prototype.forEach.call($el.options, (it)=> it.selected = !!~${value}.indexOf(it.value))`;
      queue.push(["o-bind", { option: "", value: value1, binder }]);

      const value2 = `${value} = Array.prototype.filter.call($event.target.options, (it)=>it.value && it.selected).map(it=>it.value)`;
      queue.push(["o-on", { option: "change", value: value2, binder }]);
    } else {
      const value1 = `Array.prototype.findIndex.call($el.options, (it)=>it.value===String(${value}))`;
      queue.push([
        "o-bind",
        { option: "selectedIndex", value: value1, binder },
      ]);
      const value2 = `${value} = $event.target.options[$event.target.selectedIndex].value`;
      queue.push(["o-on", { option: "change", value: value2, binder }]);
    }
  },
};

directive.on("model", {
  binded(el, obj, { option, value, queue, binder }) {
    option = option || "value";

    const type = el.getAttribute("type");
    const id = `${el.nodeName.toLowerCase()}:${type ? type.toLowerCase() : ""}`;
    const handler = metaModel[id];

    if (handler) {
      handler(el, option, value, queue, binder);
    } else {
      console.warn(`o-model not supported node: ${id}`);
    }
  },
});

directive.on("on", {
  binded(el, obj, { option, value }) {
    const f = createFunction0(["$event"], value);
    el.addEventListener(option, (e) => f.call(obj, e));
  },
});

directive.on("bind", {
  binded(el, obj, { option, value, binder }) {
    let mapping = parseContent(value);
    if (!mapping) return;
    const action = () => {
      binder.metaObj.el = el;
      let val = mapping.get.call(obj);
      binder.metaObj.el = null;
      if (option) el[option] = val;
    };
    mapping.keys.forEach((it) => binder.$on("." + it, action));
    action();
  },
});

directive.on("for", {
  binded(el, obj, { option, value, queue, binder }) {
    const parent = el.parentElement;
    const template = el;
    parent.removeChild(el);

    let mapping = parseContent(value);
    if (!mapping) return;

    let data = mapping.get.call(obj);
    const elements = [];
    function appendItem(idx) {
      const clone = template.cloneNode(true);
      parent.appendChild(clone);
      data[idx] = binder.bind(data[idx], clone);
      elements.push(clone);
    }

    function removeItem(idx) {
      let item = elements.splice(idx, 1)[0];
      item && parent.removeChild(item);
    }

    for (let i = 0; i < data.length; ++i) {
      appendItem(i);
    }

    let bus = new EventBus()
      .on("d", ({ prop }) => removeItem(prop))
      .on("c", ({ prop }) => appendItem(prop))
      .on("u", ({ prop }) => binder.fire(`.${mapping.keys[0]}.${prop}`, {}, 2));

    for (let i = 0; i < data.length; ++i) {
      const idx = String(i);
      binder.$on(`.${mapping.keys[0]}.${idx}`, ({ prop, type, value }) => {
        if (idx === prop) {
          bus.fire(type, { prop });
        }
      });
    }
    binder.$on("." + mapping.keys[0], ({ prop, type, value }) => {
      bus.fire(type, { prop });
    });
  },
});

directive.on("if", {
  binded(el, obj, { option, value, queue, binder }) {
    const parent = el.parentElement;
    let content = el;
    let sibling = content.nextSibling;
    parent.removeChild(content);

    let mapping = parseContent(value);
    if (!mapping) return;

    let isRendered = false;
    function setIf() {
      if (mapping.get.call(obj)) {
        parent.insertBefore(content, sibling);
        if (!isRendered) {
          binder.render(obj, content);
          isRendered = true;
        }
      } else {
        parent.removeChild(content);
      }
    }

    setTimeout(() => setIf(), 0);

    binder.$on("." + mapping.keys[0], (_) => setIf());
  },
});

export function bindOf(obj, elem) {
  if (!(obj && elem)) return obj;

  const ob = new OBinder();

  return ob.bind(obj, elem);
}
