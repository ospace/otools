import assert from "./assert";

export function forEachRange(...args) {
  const len = args.length;
  assert(
    2 === len || 3 === len,
    `must be count of arguments is 2 or 3, but ${len}`
  );
  if (2 === len) {
    args.unshift(0);
  }

  loopRange.apply(this, args);
}

function loopRange(l, r, handler) {
  for (let i = l; i <= r; ++i) handler(i);
}

export function* range(begin, end, step = 1) {
  if (0 === step) throw new Error("step must not be ZERO");
  for (let i = begin; i <= end; i += step) yield i;
}

export function* map(iterator, callback) {
  for (let i of iterator) yield callback(i);
}

export function reduce(iterator, callback, init) {
  for (let i of iterator) {
    init = callback(init, i);
  }
  return init;
}

export function* filter(iterator, callback) {
  for (let i of iterator) {
    if (callback(i)) yield i;
  }
}

export function* groupBySize(iterator, size) {
  let g = [];
  for (let i of iterator) {
    g.push(i);
    if (size === g.length) {
      yield g;
      g = [];
    }
  }
  if (g.length) yield g;
}

export function partitioning(iterator, classCond) {
  assert.function(classCond, "classCond");
  let ret = {};
  for (let i of iterator) {
    let className = classCond(i);
    (ret[className] || (ret[className] = [])).push(i);
  }
  return ret;
}
