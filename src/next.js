import { mixin } from "./utils";
import assert from "./assert";

export default function Next(handler) {
  assert.function(handler, "handler");

  this.fulfillHandlers = [];
  this.rejectHandlers = [];
  this.hasResponse = false;
  this.occureError = false;
  try {
    handler(this.onFullfill.bind(this), this.onReject.bind(this));
  } catch (ex) {
    this.onReject(ex);
  }
}

mixin(Next, {
  onFullfill: function (response) {
    if (this.hasResponse || this.occureError) return;
    this.hasResponse = true;
    this.response = response;
    this.callFullfillHandler(response);
  },
  callFullfillHandler: function (response) {
    try {
      let res = response;
      this.fulfillHandlers.forEach(function (each, idx) {
        res = each(res);
      });
    } catch (ex) {
      this.onReject(ex);
    }
  },
  then: function (handler) {
    this.fulfillHandlers.push(handler);
    if (this.hasResponse) {
      const response = this.response;
      this.response = null;
      this.callFullfillHandler(response);
    }
    return this;
  },
  onReject: function (error) {
    if (this.occureError) return;
    this.occureError = true;
    this.error = error;
    this.callRejectHandlers(error);
  },
  callRejectHandlers: function (error) {
    let err = error;
    this.rejectHandlers.forEach(function (each, idx) {
      err = each(err);
    });
  },
  catch: function (handler) {
    this.rejectHandlers.push(handler);
    if (this.occureError) {
      const error = this.error;
      this.error = null;
      this.callRejectHandlers(error);
    }
    return this;
  },
});
