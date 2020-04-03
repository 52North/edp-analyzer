import request from "request-promise-native";
import statusTexts from "statusTexts";
import { Analyzer } from "analyzer";
import contentType from "content-type";
import { GeoJSONExtentChecker } from "geojsonExtentChecker";
import { GeoJSONSyntaxChecker } from "geojsonSyntaxChecker";

export class GeoJSONAnalyzer extends Analyzer {
  constructor(options) {
    super(options);
    options = options || {};
    this.extentChecker = new GeoJSONExtentChecker();
    this.syntaxChecker = new GeoJSONSyntaxChecker();
    this.rp = request.defaults({
      headers: { Accept: "application/json" },
      followRedirect: true,
      gzip: true,
      pool: { maxSockets: 3 },
      strictSSL: true,
      timeout: options.timeout || 60 * 1000,
      resolveWithFullResponse: true
    });
  }
  async analyze(url) {
    let response = null;
    try {
      response = await this.requestJSON(url);
    } catch (err) {
      return `HTTP: ${err.message}`;
    }
    let json = null;
    try {
      json = this.parseJSON(response);
    } catch (err) {
      return `JSON: ${err.message}`;
    }
    try {
      this.syntaxChecker.check(json);
    } catch (err) {
      return `GeoJSON: ${err.message}`;
    }
    try {
      this.extentChecker.validate(json);
    } catch (err) {
      return `GeoJSON: CRS: ${err.message}`;
    }

    return "ok";
  }

  async requestJSON(url) {
    let response = null;
    try {
      response = await this.rp(url);
    } catch (err) {
      if (!err.statusCode) throw err;
      response = err;
    }
    if (response.statusCode < 200 || response.statusCode >= 300) {
      const message =
        response.statusMessage || statusTexts[response.statusCode];
      throw new Error(`${response.statusCode} ${message}`);
    }
    return response;
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
  parseJSON(response) {
    this.checkContentLength(response);
    try {
      return JSON.parse(response.body);
    } catch (err) {
      let ct = null;
      try {
        ct = contentType.parse(response);
      } catch (ignored) {}

      if (ct && !/application\/(.+\+)?json/i.test(ct.type)) {
        throw new Error(`invalid: ${ct.type}`);
      } else {
        throw new Error("invalid");
      }
    }
  }
}
