import { createTag } from "./dom";

const css = `
	.o-logger { position:fixed; bottom:20px; left: 0px; width: 100%; z-index:100; /* pointer-events: none; */ }
	.o-logger .body { font-family: sans-serif; font-size: small; height: 100px; background-color: rgba(0,0,0,0.5); overflow: scroll; overflow-x: hidden; padding-bottom: 3px; }
	.o-logger .time { color: white; font-weight: bold; }
	.o-logger .message { color: white; margin: 0 0 0 5px; overflow-wrap: anywhere; }
	.o-logger .cli { position:fixed; bottom:0; left: 0; width: 100%; pointer-events: auto; border-radius: 0px; -webkit-appearance: none; }
	.o-logger .hide { position:fixed; right:0; border: 0px; border-radius: 5px 5px 0px 0px; -webkit-appearance: none; }
	.o-logger .triangle { display: inline-block; width: 0px; height: 0px; border-bottom: 8px solid black; border-left: 5px solid transparent; border-right: 5px solid transparent; transform: rotate(180deg)}
	.o-logger .error { background-color: maroon; }
	.o-logger .warn { background-color: orange; }
	.o-logger .o-row { border: solid lightgray; border-width: 1px 0px 0px; padding-left: 3px; padding-right: 3px; }
`;

let firstConsole = false;
function ConsoleWindow() {
  if (!firstConsole) {
    firstConsole = true;
    let style = document.createElement("style");
    style.setAttribute("type", "text/css");
    style.innerHTML = css;
    document.head.appendChild(style);
  }

  this.history = { cmds: [], idx: 0 };

  this.initLogger();
  this.initCli();

  window.addEventListener("error", (e) =>
    console.error(e.error ? (e.error.stack ? e.error.stack : e.error) : e)
  );
  window.addEventListener("unhandledrejection", (e) =>
    console.error(e.reason ? (e.reason.stack ? e.reason.stack : e.reason) : e)
  );
}

Object.assign(ConsoleWindow.prototype, {
  loggerHeight() {
    return this.logger.clientHeight && this.logger.clientHeight + 20;
  },
  initLogger() {
    const self = this;

    let loggerParent = createTag("div", { className: "o-logger" });
    this.loggerParent = loggerParent;
    document.body.appendChild(loggerParent);

    let logger = createTag("div", { className: "body" });
    this.logger = logger;
    loggerParent.appendChild(logger);

    ["log", "info", "warn", "error"].forEach((it) => {
      console[it] = this.createLogFunction(it);
    });

    const hide = createTag("input", {
      type: "button",
      className: "hide",
      value: "hide",
      onclick: ({ target }) => {
        if ("hide" === target.value) {
          self.hide();
          target.value = "show";
        } else {
          self.show();
          target.value = "hide";
        }
        target.style.bottom = this.loggerHeight() + "px";
      },
    });
    hide.style.bottom = this.loggerHeight() + "px";
    loggerParent.appendChild(hide);

    // hide.click();
  },
  initCli() {
    const self = this;
    let history = this.history;
    const cli = createTag("input", {
      type: "text",
      className: "cli",
      onchange: ({ target }) => {
        history.cmds.push(target.value);
        history.idx = history.cmds.length;
        try {
          console.log(eval(target.value));
        } catch (e) {
          console.error(e.name + ":", e.message);
          console.error(e.stack.toString());
        } finally {
          target.value = "";
          self.goBottom();
        }
      },
      onkeyup: ({ code }) => {
        if (0 < history.idx && "ArrowUp" === code) {
          cli.value = history.cmds[--history.idx];
        }
        if (history.cmds.length - 1 > history.idx && "ArrowDown" === code) {
          cli.value = history.cmds[++history.idx];
        }
      },
    });
    this.cli = cli;
    this.loggerParent.appendChild(cli);
  },
  createLogFunction(type) {
    const self = this;
    const org = console[type];
    return function log(...args) {
      org.apply(console, args);

      const row = createTag("div", { className: "o-row " + type });
      self.logger.appendChild(row);

      const now = new Date();
      now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
      const tm = createTag("span", {
        className: "time",
        innerText: now.toISOString().substring(0, 19),
      });
      row.appendChild(tm);

      const text = args
        .map((it) => {
          if ("object" === typeof it) {
            if (it instanceof HTMLElement) {
              return it.outerHTML;
            }
            if (it instanceof Set) {
              it = [...it];
            }
            return JSON.stringify(it);
          } else {
            return it;
          }
        })
        .join(" ");
      const msg = createTag("span", {
        className: "message",
        innerText: text,
      });
      row.appendChild(msg);

      self.goBottom();
    };
  },
  hide() {
    this.logger.style.display = "none";
    this.cli.style.display = "none";
  },
  show() {
    this.logger.style.display = "block";
    this.cli.style.display = "block";
  },
  goBottom() {
    this.logger.scrollTo(0, this.logger.scrollHeight);
  },
});

export function enableConsole() {
  return new ConsoleWindow();
}
