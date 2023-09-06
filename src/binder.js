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

function Directive() {
  this.cmds = new Map();
  this.shorts = {};
}

extend(Directive, null, {
  on(cmd, hook) {
    let cmdId = `o-${cmd}`;
    let short = hook.short;
    if (short) {
      if (1 === short.length) {
        if (this.shorts[short]) {
          let shortCmdId = this.shorts[short];
          console.warn(`short "${short}" already registried by ${shortCmdId}`);
        } else {
          this.shorts[short] = `${cmdId}:`;
        }
      } else {
        console.warn(`registry of short failed, only allow a char: ${cmdId}`);
      }
    }
    if (hook.priority && 99 < hook.priority) {
      hook.priority = 99;
      console.warn(`max priority is 99: ${cmdId}`);
    }
    this.cmds.set(cmdId, hook);
  },
  get(cmd) {
    return this.cmds.get(cmd);
  },
  convShort(name) {
    let keyword = this.shorts[name.charAt(0)];
    return keyword ? keyword + name.substr(1) : name;
  },
  comparePriority(l, r) {
    let ret = 0;
    if (isKeyword(l)) {
      if (isKeyword(r)) {
        const pL = this.get(l.split(":")[0]).priority || 99;
        const pR = this.get(r.split(":")[0]).priority || 99;
        ret = pL - pR;
      } else {
        ret = -1;
      }
    } else if (isKeyword(r)) {
      ret = 1;
    }
    return ret;
  },
});

const directive = new Directive();

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
      fire.call(this, key_, val, 3);
    });
    fire = this.fire;

    this.render(elem, obj);

    return obj;
  },
  render(elem, obj, ctx) {
    const errs = [];
    iterateNode(elem, (node) => {
      if (1 === node.nodeType) {
        this.bindElementNode(node, obj, ctx, errs);
      } else if (3 === node.nodeType) {
        this.bindTextNode(node, obj, ctx, errs);
      }
    });
    errs.forEach((e) => console.warn("ERROR:", e));
  },
  bindElementNode(elem, obj, ctx, errs) {
    let queue = [];
    let attrNames = elem
      .getAttributeNames()
      .map((it) => [it, directive.convShort(it)]);
    attrNames.sort((l, r) => directive.comparePriority(l[1], r[1]));
    for (const attr of attrNames) {
      const [attrName, name] = attr;
      const attrValue = elem.getAttribute(attrName);
      if (isKeyword(name)) {
        elem.removeAttribute(attrName);
        const [cmd, option] = name.split(":");
        queue.push([
          cmd,
          { el: elem, option, value: attrValue, queue, binder: this, ctx },
        ]);

        while (queue.length) {
          const [cmdId, info] = queue.shift();
          if (cmdId) {
            const cmd = directive.get(cmdId);
            if (!cmd) {
              return console.warn(`not supported directive: ${cmdId}`);
            }
            if (true === cmd.binded(elem, obj, info)) return;
          } else {
            const { option, ctx, value } = info;
            this.bindNodeAttr(elem, option, obj, value, ctx, errs);
          }
        }
      } else {
        this.bindNodeAttr(elem, attrName, obj, attrValue, ctx, errs);
      }
    }
  },
  bindTextNode(elem, obj, ctx, errs) {
    const mapping = parseContent(elem.textContent);
    if (!mapping) return;
    const setter = (val) => (elem.textContent = val);
    this.buildMapping(mapping, elem, obj, ctx, setter, errs);
  },
  bindNodeAttr(elem, attName, obj, value, ctx, errs) {
    const mapping = parseContent(value);
    if (!mapping) return;

    const useProp = isUseProp(elem, attName);
    const setter = useProp
      ? (val) => (elem[attName] = val)
      : (val) => elem.setAttribute(attName, val);
    this.buildMapping(mapping, elem, obj, ctx, setter, errs);
  },
  buildMapping(mapping, elem, obj, ctx, setter, errs) {
    const args = ctx && ctx.args;
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
      const events = mapping.events
        .concat((ctx && ctx.events) || [])
        .map((it) => createEvent(it));
      events.forEach((it) => this.$on(it, mapping.action));
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

  let events = mappings.map((it) => it.events).flat();
  events = events.map((it) => it && it.trim());
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
  events = events
    .filter((it) => it && !it.startsWith(".") && !~excepts.indexOf(it))
    .map((it) => it.trim());

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

function isKeyword(str) {
  return str && str.startsWith("o-");
}

const useValueElements = ["input", "textarea", "option", "select", "progress"];
function isUseProp(el, attrName) {
  const tagName = el.nodeName.toLowerCase();
  return (
    (~useValueElements.indexOf(tagName) &&
      attrName === "value" &&
      "button" !== el.getAttribute("type")?.toLowerCase()) ||
    "disabled" === attrName ||
    ("option" === tagName && "selected" === attrName) ||
    ("input" === tagName && "checked" === attrName) ||
    ("muted" === tagName && "video" === attrName)
  );
}

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
  short: "@",
  binded(el, obj, { option, value, ctx }) {
    const args = ctx && ctx.args;
    let params = args ? Object.keys(args) : [];
    let vals = args ? Object.values(args) : [];
    params.push("$event");

    const handler = createFunction(params, value).bind(obj, ...vals);
    el.addEventListener(option, handler);
  },
});

directive.on("bind", {
  short: "$",
  binded(el, obj, { option, value, binder, ctx }) {
    let mapping = parseText(value, true);
    if (!mapping) return;
    const useProp = isUseProp(el, option);
    const setter = useProp
      ? (val) => (el[option] = val)
      : (val) => el.setAttribute(option, val);

    binder.buildMapping(mapping, el, obj, ctx, setter);
  },
});

directive.on("if", {
  priority: 1,
  binded(el, obj, opts) {
    const parent = el.parentElement;
    let content = el;
    let sibling = content.nextSibling;

    parent.removeChild(content);

    const { value, binder, ctx } = opts;
    let mapping = parseText(value);
    if (!mapping) return;

    let isRendered = false;
    binder.buildMapping(mapping, el, obj, ctx, (val) => {
      if (val) {
        if (!isRendered) {
          binder.render(content, obj, ctx);
          isRendered = true;
        }
        parent.insertBefore(content, sibling);
      } else {
        if (document.body.contains(content)) {
          parent.removeChild(content);
        }
      }
    });
    return true;
  },
});

const reFor = /([$\w][$\w\d]*)\s+(in|of)\s+(.*)/;
directive.on("for", {
  priority: 2,
  binded(el, obj, { value, binder }) {
    if (!value) return;
    const parent = el.parentElement;
    let sibling = el.nextSibling;
    const template = el;
    parent.removeChild(el);

    const items = value.match(reFor);
    if (!items) {
      return console.warn(`o-for: "${value}" is invalid expression`);
    }

    let [_, param, type, target] = items;

    let mapping = parseText(target);
    if (!mapping) return;

    let data = null;
    let elements = [];

    function appendItemAt(idx) {
      const clone = template.cloneNode(true);
      const get = "in" === type ? () => idx : () => data[idx];
      const args = {};
      Object.defineProperty(args, param, { get, enumerable: true });

      const events = [createEvent(mapping.events[0], idx)];
      binder.render(clone, obj, { args, events });
      elements.push(clone);

      parent.insertBefore(clone, sibling);
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

    function refresh() {
      if (elements.length) {
        elements.forEach((it) => parent.removeChild(it));
        elements = [];
      }
      data = binder.buildMapping(mapping, el, obj).get();
      for (let i in data) {
        appendItemAt(i);
      }
    }
    refresh();

    const event = mapping.events[0];
    binder.$on(createEvent(event), ({ prop, type, value }, e) => {
      if (event === prop) {
        refresh();
      } else {
        bus.fire(type, { prop });
      }
    });

    return true;
  },
});

export function bindOf(elem, obj) {
  if (!(obj && elem)) return obj;

  const ob = new OBinder();

  return ob.bind(elem, obj);
}
