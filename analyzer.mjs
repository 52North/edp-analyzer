import { EventEmitter } from "events";

export class Analyzer extends EventEmitter {
  constructor(options) {
    super();
  }
  analyze(url) {
    return Promise.resolve("ok");
  }
}
