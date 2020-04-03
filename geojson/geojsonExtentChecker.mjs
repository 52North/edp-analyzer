const wkidMapping = {
  "4326": 4326,
  "EPSG:4326": 4326,
  "urn:ogc:def:crs:OGC:1.3:CRS84": 4326,
  "urn:ogc:def:crs:OGC::CRS84": 4326,
  "urn:ogc:def:crs:EPSG::4326": 4326,
  "http://www.opengis.net/def/crs/OGC/1.3/CRS84": 4326,
  "3857": 3857,
  "EPSG:3857": 3857,
  "urn:ogc:def:crs:EPSG::3857": 3857,
  "3035": 3035,
  "EPSG:3035": 3035,
  "ETRS-LAEA": 3035,
  "urn:ogc:def:crs:EPSG::3035": 3857
};

const extentRestrictions = {
  4326: {
    xmax: 90.0,
    xmin: -90.0,
    ymax: 180.0,
    ymin: -180.0
  },
  3035: {
    xmax: 6829874.45,
    xmin: 1507846.05,
    ymax: 4662111.45,
    ymin: 1896628.62
  },
  3857: {
    xmax: 20048966.1,
    xmin: -20048966.1,
    ymax: 20026376.39,
    ymin: -20026376.39
  }
};

export class GeoJSONExtentChecker {
  updateBoundingBox(extent, dim, x) {
    if (dim === 0) {
      extent.xmin = Math.min(extent.xmin, x[0]);
      extent.xmax = Math.max(extent.xmax, x[0]);
      extent.ymin = Math.min(extent.ymin, x[1]);
      extent.ymax = Math.max(extent.ymax, x[1]);
    } else {
      for (let y of x) {
        this.updateBoundingBox(extent, dim - 1, y);
      }
    }
  }
  getWKID(crs) {
    if (!crs) {
      return null;
    }
    if (crs.type !== "name") {
      throw new Error("unsupported type");
    }
    if (!crs.properties && !crs.properties.name) {
      throw new Error("invalid");
    }
    const name = crs.properties.name;
    for (let key of Object.keys(wkidMapping)) {
      if (name.indexOf(key) >= 0) {
        return wkidMapping[key];
      }
    }
    throw new Error(`unsupported: ${name}`);
  }
  traverse(extent, x) {
    const wkid = this.getWKID(x.crs);
    if (wkid) {
      if (extent.wkid && extent.wkid !== wkid) {
        throw new Error("mixed");
      }
      extent.wkid = wkid;
    }

    switch (x.type) {
      case "Point":
        this.updateBoundingBox(extent, 0, x.coordinates);
        break;
      case "MultiPoint":
        this.updateBoundingBox(extent, 1, x.coordinates);
        break;
      case "LineString":
        this.updateBoundingBox(extent, 1, x.coordinates);
        break;
      case "MultiLineString":
        this.updateBoundingBox(extent, 2, x.coordinates);
        break;
      case "Polygon":
        this.updateBoundingBox(extent, 2, x.coordinates);
        break;
      case "MultiPolygon":
        this.updateBoundingBox(extent, 3, x.coordinates);
        break;
      case "GeometryCollection":
        for (let geometry of x.geometries) {
          this.traverse(extent, geometry);
        }
        break;
      case "FeatureCollection":
        for (let feature of x.features) {
          this.traverse(extent, feature);
        }
        break;
      case "Feature":
        this.traverse(extent, x.geometry);
        break;
    }
  }
  validate(x) {
    const extent = {
      xmin: Number.POSITIVE_INFINITY,
      ymin: Number.POSITIVE_INFINITY,
      xmax: Number.NEGATIVE_INFINITY,
      ymax: Number.NEGATIVE_INFINITY,
      crs: null
    };
    this.traverse(extent, x);
    this.checkExtent(extent);
  }
  checkExtent(extent) {
    const restriction = extentRestrictions[extent.crs || 4326];
    if (!restriction) throw new Error("unsupported");
    if (
      extent.xmax > restriction.xmax ||
      extent.ymax > restriction.ymax ||
      extent.xmin < restriction.xmin ||
      extent.ymin < restriction.ymin
    ) {
      throw new Error("invalid extent");
    }
  }
}
