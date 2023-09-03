import {
  extend,
  proxyObj,
  EventBus,
  createFn,
  iterateObj,
  isFunction,
  defineHiddenProperty,
  mapRegex,
  noop,
} from "./utils";
import { iterateNode } from "./dom";
import { partitioning } from "./data";

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
  bind(elem, obj) {
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

    let fire = noop;

    obj = proxyObj(obj, (key, val) => {
      // const { type } = val;
      const key_ = this.findEvent(key);
      // fire.call(this, key_, val, 3);
      fire.call(this, key_, val, 1);
    });
    fire = this.fire;

    this.render(elem, obj);

    return obj;
  },
  render(elem, obj, args, ctx) {
    const errs = [];
    iterateNode(elem, (node) => {
      if (1 === node.nodeType) {
        this.bindElementNode(node, obj, args, ctx, errs);
      } else if (3 === node.nodeType) {
        this.bindTextNode(node, obj, args, ctx, errs);
      }
    });
    errs.forEach((e) => console.warn("ERROR:", e));
  },
  bindElementNode(elem, obj, args, ctx, errs) {
    let queue = [];
    let { true: keywords, false: attrs } = partitioning(
      elem.getAttributeNames(),
      (it) => it.startsWith("o-")
    );
    if (keywords) {
      for (const attrName of keywords) {
        const attrValue = elem.getAttribute(attrName);
        const name = SHORT_WORDS.getWord(attrName);
        elem.removeAttribute(attrName);
        const [cmd, option] = name.split(":");
        queue.push([
          cmd,
          { el: elem, option, value: attrValue, queue, binder: this, args },
        ]);

        while (queue.length) {
          const [cmdId, info] = queue.shift();
          if (cmdId) {
            const cmd = directive.get(cmdId);
            if (!cmd) {
              return console.warn(`not supported directive: ${cmdId}`);
            }
            cmd.binded(elem, obj, info);
          } else {
            const { option, args, value } = info;
            this.bindNodeAttr(elem, option, obj, args, value, ctx, errs);
          }
        }
      }
    } else {
      attrs &&
        attrs.forEach((attrName) => {
          const attrValue = elem.getAttribute(attrName);
          this.bindNodeAttr(elem, attrName, obj, args, attrValue, ctx, errs);
        });
    }
  },
  bindTextNode(elem, obj, args, ctx, errs) {
    const mapping = parseContent(elem.textContent);
    if (!mapping) return;
    const setter = (val) => (elem.textContent = val);
    this.buildMapping(mapping, elem, obj, args, setter, ctx, errs);
  },
  bindNodeAttr(elem, attName, obj, args, value, ctx, errs) {
    const mapping = parseContent(value);
    if (!mapping) return;

    const useProp = isUseProp(elem, attName);
    const setter = useProp
      ? (val) => (elem[attName] = val)
      : (val) => elem.setAttribute(attName, val);
    this.buildMapping(mapping, elem, obj, args, setter, ctx, errs);
  },
  buildMapping(mapping, elem, obj, args, setter, ctx, errs) {
    const params = args ? Object.keys(args) : [];
    const vals = args ? Object.values(args) : [];
    const expr = mapping.expr;
    mapping.get = createFunction(params, expr).bind(obj, ...vals);
    if ("function" === typeof setter) {
      mapping.action = () => {
        try {
          this.metaObj.el = elem;
          setter(mapping.get());
          this.metaObj.el = null;
        } catch (e) {
          errs && errs.push([mapping.expr, e]);
        }
      };
      mapping.events.forEach((it) => this.$on(createEvent(it), mapping.action));
      if (ctx && ctx.event) {
        let ev = ctx.event;
        this.$on(createEvent(ctx.event), mapping.action);
      }
      mapping.action();
    }

    return mapping;
  },
  $on(event, handler) {
    this.on(this.findEvent(event), handler);
  },
  $off(event, handler) {
    this.off(this.findEvent(event), handler);
  },
  findEvent(event) {
    event = createEvent(event);
    return this.objKeys.find((it) => event.startsWith(it));
  },
});

function parseContent(value, isReturn = true) {
  if (!value) return null;

  const preRe = /{{([\w\W]+?)}}/g;
  const mappings = [];
  let id = 0;
  const templateText = value.replace(preRe, (m, k) => {
    mappings.push(parseText(k, false));
    return "${v[" + id++ + "]}";
  });

  if (!mappings.length) return null;

  const events = mappings.map((it) => it.events).flat();
  let expr = `((v) => \`${templateText}\`)([${mappings
    .map((it) => `(${it.expr})`)
    .join(",")}])`;

  expr = isReturn ? `return ${expr}` : expr;

  return { events, expr };
}

function parseText(value, isReturn = true) {
  if (!value) return null;

  const reId =
    /(?:\.?[$\w][$\w\d]*\s*|\[\s*(?:\d*|('|")(?:\\\1|.)*?\1)\s*\])*/g;
  const reStr = /('|")((?:\\\1|.)*?)\1/g;

  const filters = value.split(/\b\s*\|(?!\|)\s*/g).map((a) => a.trim());
  let expr = filters.shift();

  let events = mapRegex(reId, expr, (it) => it[0]);
  const excepts = mapRegex(reStr, expr, (it) => it[2]);
  events = events.filter(
    (it) => it && !it.startsWith(".") && !~excepts.indexOf(it)
  );

  expr = filters.reduce((pre, it) => {
    if ("function" !== typeof window[it])
      throw Error(`${it} is not function!!!`);
    return `${it}(${pre})`;
  }, expr);

  expr = isReturn ? `return ${expr}` : expr;

  return { events, expr };
}

function createEvent(...args) {
  let ret = args.join(".");
  if ("." === ret.charAt(0)) {
    if ("." !== ret.charAt(ret.length - 1)) {
      ret = `${ret}.`;
    }
  } else {
    if ("." === ret.charAt(ret.length - 1)) {
      ret = `.${ret}`;
    } else {
      ret = `.${ret}.`;
    }
  }
  return ret;
}

createEvent("a");

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

function createFunction(args, stmt) {
  const body = `with(this){${stmt ? stmt : args}}`;
  return stmt ? createFn(...args, body) : createFn(body);
}

const metaModel = {
  "input:text": function (el, opts) {
    // const {option, value, queue, binder} = opts;
    let option = "value";
    let value = `{{${opts.value}}}`;
    opts.queue.push([null, Object.assign({}, opts, { option, value })]);
    option = "input";
    value = `${opts.value}=$event.target.value`;
    opts.queue.push(["o-on", Object.assign({}, opts, { option, value })]);
  },
  "input:radio": function (el, opts) {
    let option = "checked";
    let value = `$el.value?$el.value===String(${opts.value}):${opts.value}`;
    opts.queue.push(["o-bind", Object.assign({}, opts, { option, value })]);
    option = "input";
    value = `
      let res=$event.target.value?($event.target.checked?$event.target.value:''): $event.target.checked;
      ${opts.value}='true'===res?true:('false'===res?false:res);`;
    opts.queue.push(["o-on", Object.assign({}, opts, { option, value })]);
  },
  "input:checkbox": function (el, opts) {
    let option = "checked";
    let value = `$el.value?(Array.isArray(${opts.value}) ? !!~${opts.value}.indexOf($el.value) : $el.value===String(${opts.value})):${opts.value}`;
    opts.queue.push(["o-bind", Object.assign({}, opts, { option, value })]);

    option = "input";
    value = `if(Array.isArray(${opts.value})) {
      let idx = ${opts.value}.indexOf($event.target.value);
      if ($event.target.checked) {
        ~idx || ${opts.value}.push($event.target.value);
      } else {
        ~idx && ${opts.value}.splice(idx, 1);
      }
    } else {
      ${opts.value}=$event.target.value?($event.target.checked?$event.target.value:''):$event.target.checked; 
    }`;
    opts.queue.push(["o-on", Object.assign({}, opts, { option, value })]);
  },
  "select:": function (el, opts) {
    const isMultiple = el.multiple;
    let value, option;
    if (isMultiple) {
      option = "";
      value = `Array.prototype.forEach.call($el.options, (it)=> it.selected = !!~${opts.value}.indexOf(it.value))`;
      opts.queue.push(["o-bind", Object.assign({}, opts, { option, value })]);

      option = "change";
      value = `${opts.value} = Array.prototype.filter.call($event.target.options, (it)=>it.value && it.selected).map(it=>it.value)`;
      opts.queue.push(["o-on", Object.assign({}, opts, { option, value })]);
    } else {
      option = "selectedIndex";
      value = `Array.prototype.findIndex.call($el.options, (it)=>it.value===String(${opts.value}))`;
      opts.queue.push(["o-bind", Object.assign({}, opts, { option, value })]);
      option = "change";
      value = `${opts.value} = $event.target.options[$event.target.selectedIndex].value`;
      opts.queue.push(["o-on", Object.assign({}, opts, { option, value })]);
    }
  },
};

directive.on("model", {
  binded(el, obj, opts) {
    opts.option = opts.option || "value";

    const type = el.getAttribute("type");
    const id = `${el.nodeName.toLowerCase()}:${type ? type.toLowerCase() : ""}`;
    const handler = metaModel[id];

    if (handler) {
      handler(el, opts);
    } else {
      console.warn(`o-model not supported node: ${id}`);
    }
  },
});

directive.on("on", {
  binded(el, obj, { option, value, args }) {
    let params = args ? Object.keys(args) : [];
    let vals = args ? Object.values(args) : [];
    params.push("$event");

    const handler = createFunction(params, value).bind(obj, ...vals);
    el.addEventListener(option, handler);
  },
});

directive.on("bind", {
  binded(el, obj, { option, value, binder, args }) {
    let mapping = parseText(value, true);
    if (!mapping) return;
    binder.buildMapping(mapping, el, obj, args, (val) => {
      if (option) el[option] = val;
    });
  },
});

directive.on("if", {
  binded(el, obj, opts) {
    const parent = el.parentElement;
    let content = el;
    let sibling = content.nextSibling;
    parent.removeChild(content);

    const { value, binder, args } = opts;
    let mapping = parseText(value);
    if (!mapping) return;

    let isRendered = false;
    binder.buildMapping(mapping, el, obj, args, (val) => {
      if (val) {
        parent.insertBefore(content, sibling);
        if (!isRendered) {
          binder.render(content, obj, args);
          isRendered = true;
        }
      } else {
        if (document.body.contains(content)) {
          parent.removeChild(content);
        }
      }
    });
  },
});

const reFor = /([$\w][$\w\d]*)\s+(in|of)\s+(.*)/;
directive.on("for", {
  binded(el, obj, { value, binder }) {
    const parent = el.parentElement;
    const template = el;
    parent.removeChild(el);

    // const items = reFor.match(value);

    const items = value.match(reFor);
    if (!items) {
      return console.warn(`o-for: "${value}" is invalid expression`);
    }

    let [_, param, type, target] = items;

    let mapping = parseText(target);
    if (!mapping) return;

    const data = binder.buildMapping(mapping, el, obj).get();
    const elements = [];

    function appendItemAt(idx) {
      const clone = template.cloneNode(true);
      parent.appendChild(clone);
      const obj2 = Object.assign({}, obj);
      const get = "in" === type ? () => idx : () => data[idx];
      Object.defineProperty(obj2, param, { get, configurable: true });

      const event = createEvent(mapping.events[0], idx);
      // binder.render(clone, obj2, { [param]: item }, { event });
      binder.render(clone, obj2, null, { event });
      elements.push(clone);
    }

    function removeItemAt(idx) {
      let item = elements.splice(idx, 1)[0];
      item && parent.removeChild(item);
    }

    let bus = new EventBus()
      .on("d", ({ prop }) => removeItemAt(prop))
      .on("c", ({ prop }) => appendItemAt(prop))
      .on("u", ({ prop }) => {
        binder.fire(`.${mapping.events[0]}.${prop}.`, {}, 2);
      });

    for (let i in data) {
      appendItemAt(i);

      //       const idx = String(i);
      //       binder.$on(createEvent(mapping.events[0], i), ({ prop, type, value }) => {
      //         if (idx === prop) {
      //           bus.fire(type, { prop });
      //         }
      //       });
    }

    binder.$on(createEvent(mapping.events[0]), ({ prop, type, value }) => {
      bus.fire(type, { prop });
    });
  },
});

export function bindOf(elem, obj) {
  if (!(obj && elem)) return obj;

  const ob = new OBinder();

  return ob.bind(elem, obj);
}
