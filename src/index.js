import {
  mixin,
  assign,
  str2dom,
  cached,
  once,
  now,
  tick,
  ajax,
  ajaxJson,
  newFunction,
  extend,
  extendDefault,
  watch,
  arrayIndex,
  readFileString,
  readFileArray,
  readUrl,
  randomRange,
  round,
  toArray,
} from "./utils";
import {
  decodeHTML,
  formatNumber,
  formatBytes,
  toQueryString,
  parseQueryString,
  camelize,
  hyphenate,
  capitalize,
  sprint,
  replaceAll,
  isNumber,
  isEmail,
} from "./string";
import { bindOf } from "./binder";
import {
  convertToFormData,
  findParent,
  findAllByTag,
  findAllByClass,
  findAll,
  find,
  dom2str,
  tag2dom,
  redirectForm,
  on,
  off,
  getForm,
  setForm,
  watchAttribute,
  watchDom,
} from "./dom";
import assert from "./assert";

window.o = (function () {
  // const w = window;
  const d = document;
  const tickData = {};

  return {
    assert: assert,
    getById: d.getElementById.bind(d),
    find: find,
    findAll: findAll,
    findAllByClass: findAllByClass,
    findAllByTag: findAllByTag,
    findParent: findParent,
    toArray: toArray,
    assign: assign,
    tag2dom: tag2dom,
    str2dom: str2dom,
    dom2str: dom2str,
    on: on,
    off: off,
    redirectForm: redirectForm,
    arrayIndex: arrayIndex,
    ajax: ajax,
    toQueryString: toQueryString,
    parseQueryString: parseQueryString,
    getJson: function (url, data) {
      return ajaxJson({ url: url, method: "GET" }, data);
    },
    postJson: function (url, data) {
      return ajaxJson({ url: url, method: "POST" }, data);
    },
    putJson: function (url, data) {
      return ajaxJson({ url: url, method: "PUT" }, data);
    },
    deleteJson: function (url, data) {
      return ajaxJson({ url: url, method: "DELETE" }, data);
    },
    postForm: function (url, formData) {
      formData = this.convertToFormData(formData);
      return ajax(
        { url: url + "?" + toQueryString(null, true), method: "POST" },
        formData
      ).then(function (res) {
        return res.json();
      });
    },
    postMultipart: function (url, formData) {
      //TODO xhr.upload.onprogress 추가
      formData = this.convertToFormData(formData);
      return this.ajax(
        {
          url: url,
          method: "POST",
          headers: { "Content-Type": "multipart/form-data" },
        },
        formData
      );
    },
    convertToFormData: function (data) {
      if (!data || ~data.toString().lastIndexOf("FormData")) {
        return data;
      }

      var ret = new FormData();
      for (var key in data) {
        convertToFormData(ret, key, data[key]);
      }
      return ret;
    },
    readFileString: readFileString,
    readFileArray: readFileArray,
    readUrl: readUrl,
    decodeHTML: decodeHTML,
    formatNumber: formatNumber,
    formatBytes: formatBytes,
    isNumber: isNumber,
    isEmail: isEmail,
    sprint: sprint,
    randomRange: randomRange,
    round: round,
    replaceAll: replaceAll,
    /*
        sub는 base를 상속하도록 연결함. sub 생성자에서 base을 생성자를 명시적으로 호출 필요.
        권장하는 방식으로 OOP에서도 부모 생성자를 명시적으로 호출이 필요함.
        function P(opts) {}
        function C(opts) {
            P.call(this, opts);
        }
        extend(C, P);
       */
    extend: extend,
    extendDefault: extendDefault,
    mixin: mixin,
    cached: cached,
    once: once,
    camelize: camelize,
    hyphenate: hyphenate,
    capitalize: capitalize,
    watch: watch,
    getForm: getForm,
    setForm: setForm,
    evalInContext: function (str, ctx) {
      return newFunction(str).call(ctx);
    },
    now: now,
    tick: tick,
    getTick: function (id) {
      return tickData[id];
    },
    resetTick: function (id) {
      delete tickData[id];
    },
    watchAttribute: watchAttribute,
    watchDom: watchDom,
    bindOf: bindOf,
  };
})();
