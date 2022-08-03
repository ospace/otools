export function assert(condition, message) {
  if (!condition) {
    throw Error(message || "assertion failed");
  }
}

assert.function = function (obj, name) {
  if (!("function" === typeof obj)) {
    throw TypeError(`${name || "it"} must be a function`);
  }
};

assert.string = function (obj, name) {
  if (!("string" === typeof obj)) {
    throw TypeError(`${name || "it"} must be a string`);
  }
};

export default assert;
