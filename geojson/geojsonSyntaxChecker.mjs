import { isArray, isObject, isNumber } from "util";

export class GeoJSONSyntaxChecker {
  check(json) {
    if (!json || !isObject(json)) {
      throw new Error("not an object");
    }
    if (!json.type) {
      throw new Error("missing type");
    }
    switch (json.type) {
      case "Feature":
        return this.checkFeature(json);
      case "FeatureCollection":
        return this.checkFeatureCollection(json);
      default:
        return this.checkGeometry(json);
    }
  }

  checkGeometry(json) {
    if (!json || !isObject(json)) {
      throw new Error("not an object");
    }
    if (!json.type) {
      throw new Error("missing type");
    }
    switch (json.type) {
      case "Point":
        return this.checkPoint(json);
      case "MultiPoint":
        return this.checkMultiPoint(json);
      case "LineString":
        return this.checkLineString(json);
      case "MultiLineString":
        return this.checkMultiLineString(json);
      case "Polygon":
        return this.checkPolygon(json);
      case "MultiPolygon":
        return this.checkMultiPolygon(json);
      case "GeometryCollection":
        return this.checkGeometryCollection(json);
      default:
        throw new Error("invalid type");
    }
  }

  checkPoint(json) {
    if (!json || !isObject(json)) {
      throw new Error("not an object");
    }
    if (json.type !== "Point") {
      throw new Error("mismatching type");
    }
    this.checkCoordinate(json.coordinates);
  }

  checkLineString(json) {
    if (!json || !isObject(json)) {
      throw new Error("not an object");
    }
    if (json.type !== "LineString") {
      throw new Error("mismatching type");
    }
    this.checkLineCoordinates(json.coordinates);
  }

  checkPolygon(json) {
    if (!json || !isObject(json)) {
      throw new Error("not an object");
    }
    if (json.type !== "Polygon") {
      throw new Error("mismatching type");
    }
    this.checkPolygonCoordinates(json.coordinates);
  }

  checkMultiPoint(json) {
    if (!json || !isObject(json)) {
      throw new Error("not an object");
    }
    if (json.type !== "MultiPoint") {
      throw new Error("mismatching type");
    }
    this.checkCoordinateList(json.coordinates);
  }
  checkMultiLineString(json) {
    if (!json || !isObject(json)) {
      throw new Error("not an object");
    }
    if (json.type !== "MultiLineString") {
      throw new Error("mismatching type");
    }
    if (!isArray(json.coordinates)) {
      throw new Error("invalid geometry");
    }
    for (let line of json.coordinates) {
      this.checkLineCoordinates(line);
    }
  }

  checkMultiPolygon(json) {
    if (!json || !isObject(json)) {
      throw new Error("not an object");
    }
    if (json.type !== "MultiPolygon") {
      throw new Error("mismatching type");
    }
    if (!isArray(json.coordinates)) {
      throw new Error("invalid geometry");
    }
    for (let polygon of json.coordinates) {
      this.checkPolygonCoordinates(polygon);
    }
  }

  checkLineCoordinates(json) {
    this.checkCoordinateList(json);
    if (json.length < 2) {
      throw new Error("invalid geometry");
    }
  }

  checkPolygonCoordinates(json) {
    if (!isArray(json)) {
      throw new Error("invalid geometry");
    }

    for (let ring of json) {
      this.checkLinearRing(ring);
    }
  }

  checkLinearRing(json) {
    this.checkCoordinateList(json);
    if (json.length < 3) {
      throw new Error("invalid geometry");
    }
    const c0 = json[0];
    const c1 = json[json.length - 1];
    if (c0.length != c1.length) {
      throw new Error("invalid geometry");
    }
    for (let i = 0; i < c0.length; ++i) {
      if (c0[i] !== c1[i]) {
        throw new Error("invalid geometry");
      }
    }
  }

  checkCoordinate(json) {
    if (!isArray(json)) {
      throw new Error("invalid geometry");
    }
    if (json.length < 2 || json.length > 3) {
      throw new Error("invalid geometry");
    }
    for (let ordinate of json) {
      if (!isNumber(ordinate)) {
        throw new Error("invalid geometry");
      }
    }
  }

  checkCoordinateList(json) {
    if (!isArray(json)) {
      throw new Error("invalid geometry");
    }
    for (let coordinate of json) {
      this.checkCoordinate(coordinate);
    }
  }

  checkCoordinateListList(json) {
    if (!isArray(json)) {
      throw new Error("invalid geometry");
    }
    for (let coordinateList of json) {
      this.checkCoordinateList(coordinateList);
    }
  }

  checkFeature(json) {
    if (!json || !isObject(json)) {
      throw new Error("not an object");
    }
    if (json.type !== "Feature") {
      throw new Error("mismatching type");
    }
    if (!isObject(json.properties)) {
      throw new Error("missing feature properties");
    }
    if (json.geometry === null) {
      throw new Error("null geometry");
    } else {
      this.checkGeometry(json.geometry);
    }
  }

  checkFeatureCollection(json) {
    if (!json || !isObject(json)) {
      throw new Error("not an object");
    }
    if (json.type !== "FeatureCollection") {
      throw new Error("mismatching type");
    }
    if (!isArray(json.features)) {
      throw new Error("missing features array");
    }
    for (let feature of json.features) {
      this.check(feature);
    }
  }

  checkGeometryCollection(json) {
    if (!json || !isObject(json)) {
      throw new Error("not an object");
    }
    if (json.type !== "GeometryCollection") {
      throw new Error("mismatching type");
    }
    if (!isArray(json.geometries)) {
      throw new Error("missing geometries array");
    }
    for (let geometry of json.geometries) {
      this.checkGeometry(geometry);
    }
  }
}
