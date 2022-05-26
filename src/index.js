import {
  mixin,
  assign,
  str2dom,
  cached,
  once,
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
  bindTouch,
  unbindTouch,
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
  truncatePx,
} from "./string";
import { bindOf } from "./binder";
import {
  appendFormData,
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

const d = document;

const getById = d.getElementById.bind(d);

const getJson = function (url, data) {
  return ajaxJson({ url: url, method: "GET" }, data);
};

const postJson = function (url, data) {
  return ajaxJson({ url: url, method: "POST" }, data);
};

const putJson = function (url, data) {
  return ajaxJson({ url: url, method: "PUT" }, data);
};

const deleteJson = function (url, data) {
  return ajaxJson({ url: url, method: "DELETE" }, data);
};

const postForm = function (url, formData) {
  formData = convertToFormData(formData);
  return ajax(
    { url: url + "?" + toQueryString(null, true), method: "POST" },
    formData
  ).then(function (res) {
    return res.json();
  });
};

const postMultipart = function (url, formData) {
  //TODO xhr.upload.onprogress 추가
  formData = convertToFormData(formData);
  return this.ajax(
    {
      url: url,
      method: "POST",
      headers: { "Content-Type": "multipart/form-data" },
    },
    formData
  );
};

const convertToFormData = function (data) {
  if (!data || ~data.toString().lastIndexOf("FormData")) {
    return data;
  }

  var ret = new FormData();
  for (var key in data) {
    appendFormData(ret, key, data[key]);
  }
  return ret;
};

const evalInContext = function (str, ctx) {
  return newFunction(str).call(ctx);
};

const tickData = {};
const getTick = function (id) {
  return tickData[id];
};

const resetTick = function (id) {
  delete tickData[id];
};

export {
  assert,
  getById,
  find,
  findAll,
  findAllByClass,
  findAllByTag,
  findParent,
  toArray,
  assign,
  tag2dom,
  str2dom,
  dom2str,
  on,
  off,
  redirectForm,
  arrayIndex,
  ajax,
  toQueryString,
  parseQueryString,
  getJson,
  postJson,
  putJson,
  deleteJson,
  postForm,
  postMultipart,
  convertToFormData,
  readFileString,
  readFileArray,
  readUrl,
  decodeHTML,
  formatNumber,
  formatBytes,
  isNumber,
  isEmail,
  sprint,
  randomRange,
  round,
  replaceAll,
  /*
        sub는 base를 상속하도록 연결함. sub 생성자에서 base을 생성자를 명시적으로 호출 필요.
        권장하는 방식으로 OOP에서도 부모 생성자를 명시적으로 호출이 필요함.
        function P(opts) {}
        function C(opts) {
            P.call(this, opts);
        }
        extend(C, P);
       */
  extend,
  extendDefault,
  mixin,
  cached,
  once,
  camelize,
  hyphenate,
  capitalize,
  watch,
  getForm,
  setForm,
  evalInContext,
  tick,
  getTick,
  resetTick,
  watchAttribute,
  watchDom,
  bindOf,
  truncatePx,
  bindTouch,
  unbindTouch,
};
//})();
