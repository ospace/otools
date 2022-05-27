// import {
//   mixin,
//   assign,
// } from "./utils";

// import {
//   appendFormData,
//   findParent,
//   findAllByTag,
// } from "./dom";

// export const {
//   decodeHTML,
//   formatNumber,
//   formatBytes,
// } = str;

export * from "./utils";
export * from "./string";
export * from "./binder";
export * from "./dom";
export * from "./assert";

import { newFunction, ajax, ajaxJson } from "./utils";
import { toQueryString } from "./string";
import { appendFormData } from "./dom";

const d = document;

export const getById = d.getElementById.bind(d);

export function getJson(url, data) {
  return ajaxJson({ url: url, method: "GET" }, data);
}

export function postJson(url, data) {
  return ajaxJson({ url: url, method: "POST" }, data);
}

export function putJson(url, data) {
  return ajaxJson({ url: url, method: "PUT" }, data);
}

export function deleteJson(url, data) {
  return ajaxJson({ url: url, method: "DELETE" }, data);
}

export function postForm(url, formData) {
  formData = convertToFormData(formData);
  return ajax(
    { url: url + "?" + toQueryString(null, true), method: "POST" },
    formData
  ).then(function (res) {
    return res.json();
  });
}

export function postMultipart(url, formData) {
  //TODO xhr.upload.onprogress 추가
  formData = convertToFormData(formData);
  return ajax(
    {
      url: url,
      method: "POST",
      headers: { "Content-Type": "multipart/form-data" },
    },
    formData
  );
}

export function convertToFormData(data) {
  if (!data || ~data.toString().lastIndexOf("FormData")) {
    return data;
  }

  var ret = new FormData();
  for (var key in data) {
    appendFormData(ret, key, data[key]);
  }
  return ret;
}

export function evalInContext(str, ctx) {
  return newFunction(str).call(ctx);
}

const tickData = {};
export function getTick(id) {
  return tickData[id];
}

export function resetTick(id) {
  delete tickData[id];
}
