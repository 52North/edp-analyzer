import { Analyzer } from "../analyzer.mjs";
import contentType from "content-type";
import { GeoJSONExtentChecker } from "./geojsonExtentChecker.mjs";
import { GeoJSONSyntaxChecker } from "./geojsonSyntaxChecker.mjs";

export class GeoJSONAnalyzer extends Analyzer {
  constructor(options) {
    super(options);
    options = options || {};
    this.extentChecker = new GeoJSONExtentChecker();
    this.syntaxChecker = new GeoJSONSyntaxChecker(); 
  }

  async analyze(url) {
    try {
      this.checkURL(url);
    } catch (err) {
      return `HTTP: ${err.message}`;
    }
    let response = null;
    try {
      response = await this.request(url, "application/json");
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
