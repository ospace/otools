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
