#!/usr/bin/env -S node --experimental-modules

import { ResourceFetcher } from "./resourceFetcher.mjs";
import { WMSAnalyzer } from "./wmsAnalyzer.mjs";
import { GeoJSONAnalyzer } from "./geojsonAnalyzer.mjs";

async function main() {
  const fetcher = new ResourceFetcher();

  const analyzers = {
    WMS: new WMSAnalyzer(),
    GeoJSON: new GeoJSONAnalyzer()
  };
  const results = {};

  for (let format of Object.keys(analyzers)) {
    const urls = await fetcher.fetch(format);
    await Promise.all(
      urls.map(async url => {
        const result = await analyzers[format].analyze(url);
        console.log(`${url}: ${result}`);
        results[format] = results[format] || {};
        if (!results[format][result]) {
          results[format][result] = 1;
        } else {
          results[format][result]++;
        }
      })
    );
  }
  return results;
}

main()
  .then(results => console.log(results))
  .catch(err => console.error(err));
