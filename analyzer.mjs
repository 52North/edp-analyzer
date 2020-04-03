import { EventEmitter } from "events";
import request from "request-promise-native";
import statusTexts from "./statusTexts.mjs";

export class Analyzer extends EventEmitter {
  constructor(options) {
    super();
    options = options || {};
    this.rp = request.defaults({
      followRedirect: true,
      gzip: true,
      pool: { maxSockets: 3 },
      strictSSL: true,
      timeout: options.timeout || 60 * 1000,
      resolveWithFullResponse: true,
      //agentOptions: {
      //  ciphers: "ALL",
      //  secureProtocol: 'TLS_method'
      //}
    });
  }

  analyze(url) {
    return Promise.resolve("ok");
  }

  checkURL(url) {
    try {
      const u = new URL(url);
      if (u.hostname === "localhost") {
        throw new Error("localhost");
      }
      return u;
    } catch (err) {
      throw new Error("invalid url");
    }
  }

  checkContentLength(response) {
    let size = -1;
    if (response["content-length"]) {
      size = parseInt(response["content-length"]);
    } else if (response.body) {
      size = Buffer.byteLength(response.body, "utf8");
    }
    if (size <= 0) {
      throw new Error("no body");
    }
    if (size > 100 * 1024 * 1024) {
      throw new Error(`too big: ${Math.floor(size / 1024 / 1024)}MB`);
    }
  }

  handleError(err) {
    if (err.statusCode) {
      return err;
    } else if (err.cause) {
      if (err.cause.code) {
        throw new Error(err.cause.code);
      } else {
        throw err.cause;
      }
    } else {
      throw err;
    }
  }

  async request(url, contentType) {
    let response = null;
    try {
      response = await this.rp({
        uri: url,
        headers: { Accept: contentType }
      });
    } catch (err) {
      response = this.handleError(err);
    }
    if (response.statusCode < 200 || response.statusCode >= 300) {
      if (response.statusCode === 406) {
        try {
          response = await this.rp({
            uri: url,
            headers: { Accept: "*/*" }
          });
        } catch (err) {
          response = this.handleError(err);
        }
      }
      if (response.statusCode < 200 || response.statusCode >= 300) {
        const message =
          response.statusMessage || statusTexts[response.statusCode] || '???';
        throw new Error(`${response.statusCode} ${message}`);
      }
    }
    return response;
  }
}
