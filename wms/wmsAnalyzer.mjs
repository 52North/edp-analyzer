import { Analyzer } from "../analyzer.mjs";
import xml2js from "xml2js";
import contentType from "content-type";

export class WMSAnalyzer extends Analyzer {
  constructor(options) {
    super(options);
    options = options || {};
  }

  async analyze(url) {
    try {
      url = this.addURLParameters(this.checkURL(url)).toString();
    } catch (err) {
      return `HTTP: ${err.message}`;
    }

    let response = null;
    try {
      response = await this.request(url, "application/xml, text/xml");
    } catch (err) {
      return `HTTP: ${err.message}`;
    }
    let xml = null;
    try {
      xml = await this.parseXML(response);
    } catch (err) {
      return `XML: ${err.message}`;
    }
    return "ok";
  }

  async parseXML(response) {
    this.checkContentLength(response);
    try {
      return await xml2js.parseStringPromise(response.body);
    } catch (err) {
      let ct = null;
      try {
        ct = contentType.parse(response);
      } catch (ignored) {}

      if (ct && !/(application|text)\/(.+\+)?xml/i.test(ct.type)) {
        throw new Error(`invalid: ${ct.type}`);
      } else {
        throw new Error("invalid");
      }
    }
  }

  addURLParameters(url) {
    let serviceFound = false;
    let requestFound = false;
    const param = url.searchParams;
    for (let [key, value] of param.entries()) {
      switch (key.toLowerCase()) {
        case "service":
          param.set(key, "WMS");
          serviceFound = true;
          break;
        case "request":
          param.set(key, "GetCapabilities");
          requestFound = true;
          break;
      }
    }
    if (!serviceFound) {
      param.set("service", "WMS");
    }
    if (!requestFound) {
      param.set("request", "GetCapabilities");
    }
    url.search = param.toString();
    return url;
  }
}
