define("js-git/mixins/mem-cache.js", ["js-git/lib/object-codec.js","js-git/lib/object-codec.js","bodec.js"], function (module, exports) { "use strict";

var encoders = require('js-git/lib/object-codec.js').encoders;
var decoders = require('js-git/lib/object-codec.js').decoders;
var Binary = require('bodec.js').Binary;

var cache = memCache.cache = {};
module.exports = memCache;

function memCache(repo) {
  var loadAs = repo.loadAs;
  repo.loadAs = loadAsCached;
  function loadAsCached(type, hash, callback) {
    if (!callback) return loadAsCached.bind(this, type, hash);
    if (hash in cache) return callback(null, dupe(type, cache[hash]), hash);
    loadAs.call(repo, type, hash, function (err, value) {
      if (value === undefined) return callback(err);
      if (type !== "blob" || value.length < 100) {
        cache[hash] = dupe(type, value);
      }
      return callback.apply(this, arguments);
    });
  }

  var saveAs = repo.saveAs;
  repo.saveAs = saveAsCached;
  function saveAsCached(type, value, callback) {
    if (!callback) return saveAsCached.bind(this, type, value);
    value = dupe(type, value);
    saveAs.call(repo, type, value, function (err, hash) {
      if (err) return callback(err);
      if (type !== "blob" || value.length < 100) {
        cache[hash] = value;
      }
      return callback(null, hash, value);
    });
  }
}
function dupe(type, value) {
  if (type === "blob") {
    if (type.length >= 100) return value;
    return new Binary(value);
  }
  return decoders[type](encoders[type](value));
}

function deepFreeze(obj) {
  Object.freeze(obj);
  Object.keys(obj).forEach(function (key) {
    var value = obj[key];
    if (typeof value === "object") deepFreeze(value);
  });
}

});
