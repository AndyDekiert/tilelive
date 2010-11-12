var mapnik = require('../modules/mapnik.node');

var mercator = new mapnik.Projection('+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +no_defs +over');

/**
 * SphericalMercator constructor: precaches calculations
 * for fast tile lookups
 */
function SphericalMercator() {
    this.Bc = [];
    this.Cc = [];
    this.zc = [];
    this.Ac = [];
    this.DEG_TO_RAD = Math.PI / 180;
    this.RAD_TO_DEG = 180 / Math.PI;
    this.cache = {};
    this.size = 256;
    this.levels = 23;
    for (var d = 0; d < this.levels; d++) {
        this.Bc.push(this.size / 360.0);
        this.Cc.push(this.size / (2 * Math.PI));
        this.zc.push(this.size / 2);
        this.Ac.push(this.size);
        this.size *= 2.0;
    }
}

/**
 * Get the max of the first two numbers and the min of that and the third
 *
 * @param Number a.
 * @param Number b.
 * @param Number c.
 * @return Number.
 */
SphericalMercator.prototype.minmax = function(a, b, c) {
    return Math.min(Math.max(a, b), c);
};

/**
 * Convert lat lon to screen pixel value
 *
 * @param Array px [lat lon] array of geographic coordinates.
 * @param Number zoom number of the zoom level.
 */
SphericalMercator.prototype.ll_to_px = function(ll, zoom) {
    var d = this.zc[zoom];
    var f = this.minmax(Math.sin(this.DEG_TO_RAD * ll[1]), -0.9999, 0.9999);
    var x = Math.round(d + ll[0] * this.Bc[zoom]);
    var y = Math.round(d + 0.5 * Math.log((1 + f) / (1 - f)) * -this.Cc[zoom]);
    return [x, y];
};

/**
 * Convert screen pixel value to lat lon
 *
 * @param Array px [x y] array of geographic coordinates.
 * @param Number zoom number of the zoom level.
 */
SphericalMercator.prototype.px_to_ll = function(px, zoom) {
    var zoom_denom = this.zc[zoom];
    var g = (px[1] - zoom_denom) / -this.Cc[zoom];
    var lat = (px[0] - zoom_denom) / this.Bc[zoom];
    var lon = this.RAD_TO_DEG * (2 * Math.atan(Math.exp(g)) - 0.5 * Math.PI);
    return [lat, lon];
};

/**
 * Convert tile xyz value to Mapnik envelope
 *
 * @param Number x latitude number.
 * @param Number y longitude number.
 * @param Number zoom zoom.
 * @param Boolean tms_style whether to compute a tms tile.
 * @return Object Mapnik envelope.
 */
SphericalMercator.prototype.xyz_to_envelope = function(x, y, zoom, tms_style) {
    if (tms_style) {
        y = (Math.pow(2, zoom) - 1) - y;
    }
    var ll = (x * this.size, (y + 1) * this.size);
    var ur = ((x + 1) * this.size, y * this.size);
    var ys = this.px_to_ll(ll, zoom);
    var xs = this.px_to_ll(ur, zoom);
    var env = mercator.forward(ys.concat(xs))
    return env;
};

module.exports = { SphericalMercator: SphericalMercator };