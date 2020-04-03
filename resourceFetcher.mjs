import request from "request-promise-native";

export class ResourceFetcher {
  constructor(options) {
    options = options || {};
    this.maxErrorCount = options.maxErrorCount || 5;
    this.rowsPerRequest = options.rowsPerRequest || 1000;
    this.baseURL = options.baseURL || "https://www.europeandataportal.eu/data";
    this.errorCount = 0;
  }

  fetch(format) {
    format = format.toLowerCase();
    const options = {
      url: `${this.baseURL}/search/search`,
      json: true,
      qs: {
        sort: "id",
        filter: "dataset",
        includes: "distributions",
        limit: this.rowsPerRequest,
        facets: JSON.stringify({ format: [format] }),
        page: 0
      }
    };

    return new Promise((resolve, reject) => {
      const urls = [];

      const logRequest = function(options) {
        var url = options.url;
        if (options.qs) {
          url += `?${Object.keys(options.qs)
            .map(
              key =>
                `${encodeURIComponent(key)}=${encodeURIComponent(
                  options.qs[key]
                )}`
            )
            .join("&")}`;
        }
        console.debug("Requesting", url);
      };

      const onResponse = body => {
        urls.push(...this.processResponse(body.result.results, format));
        if (body.result.count > (options.qs.page + 1) * options.qs.limit) {
          options.qs.page++;
          logRequest(options);
          request(options).then(onResponse, decideOnFailure);
        } else {
          resolve(urls);
        }
      };

      const decideOnFailure = err => {
        if (++this.errorCount >= this.maxErrorCount) {
          console.warn(`Too many errors: ${this.errorCount}`);
          reject(err);
        } else {
          console.info(`Error count: ${this.errorCount} - Continuing`);
          logRequest(options);
          request(options).then(onResponse, decideOnFailure);
        }
      };
      logRequest(options);
      request(options).then(onResponse, decideOnFailure);
    });
  }

  processResponse(results, format) {
    const urls = [];
    if (results) {
      for (let p of results) {
        if (p.distributions) {
          for (let distribution of p.distributions) {
            if (
              !distribution.format ||
              format !== distribution.format.id.toLowerCase() ||
              (!distribution.download_urls && !distribution.access_url)
            ) {
              continue;
            }
            if (distribution.download_urls && distribution.download_urls[0]) {
              urls.push(distribution.download_urls[0]);
            } else if (distribution.access_url) {
              urls.push(distribution.access_url);
            }
          }
        }
      }
    }
    return urls;
  }
}
