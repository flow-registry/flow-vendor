/**
 * binance-utils — pure-computation helpers for Binance REST workflows.
 * VENDOR_FORMAT v1: no I/O, no require, no environment names. Signing and
 * filter math happen here; transport stays on the net.fetch tool surface.
 */
var K256 = [
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
];
function _r(x, n) { return (x >>> n) | (x << (32 - n)); }
function _sha256(bytes) {
  var h = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
  var bitLen = bytes.length * 8;
  var padded = bytes.slice();
  padded.push(0x80);
  while (padded.length % 64 !== 56) padded.push(0);
  for (var i = 0; i < 8; i++) padded.push((bitLen / Math.pow(2, (7 - i) * 8)) & 0xff);
  var w = new Array(64);
  for (var blk = 0; blk < padded.length; blk += 64) {
    for (i = 0; i < 16; i++) {
      w[i] = (padded[blk + i * 4] << 24) | (padded[blk + i * 4 + 1] << 16) |
             (padded[blk + i * 4 + 2] << 8) | padded[blk + i * 4 + 3];
    }
    for (i = 16; i < 64; i++) {
      var s0 = _r(w[i - 15], 7) ^ _r(w[i - 15], 18) ^ (w[i - 15] >>> 3);
      var s1 = _r(w[i - 2], 17) ^ _r(w[i - 2], 19) ^ (w[i - 2] >>> 10);
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) | 0;
    }
    var a = h[0], b = h[1], c = h[2], d = h[3], e = h[4], f = h[5], g = h[6], hh = h[7];
    for (i = 0; i < 64; i++) {
      var S1 = _r(e, 6) ^ _r(e, 11) ^ _r(e, 25);
      var ch = (e & f) ^ (~e & g);
      var t1 = (hh + S1 + ch + K256[i] + w[i]) | 0;
      var S0 = _r(a, 2) ^ _r(a, 13) ^ _r(a, 22);
      var maj = (a & b) ^ (a & c) ^ (b & c);
      var t2 = (S0 + maj) | 0;
      hh = g; g = f; f = e; e = (d + t1) | 0; d = c; c = b; b = a; a = (t1 + t2) | 0;
    }
    h[0] = (h[0] + a) | 0; h[1] = (h[1] + b) | 0; h[2] = (h[2] + c) | 0; h[3] = (h[3] + d) | 0;
    h[4] = (h[4] + e) | 0; h[5] = (h[5] + f) | 0; h[6] = (h[6] + g) | 0; h[7] = (h[7] + hh) | 0;
  }
  var out = "";
  for (i = 0; i < 8; i++) {
    for (var j = 3; j >= 0; j--) {
      var byte = (h[i] >>> (j * 8)) & 0xff;
      out += (byte < 16 ? "0" : "") + byte.toString(16);
    }
  }
  return out;
}
function _utf8(s) {
  var bytes = [];
  for (var i = 0; i < s.length; i++) {
    var c = s.charCodeAt(i);
    if (c < 0x80) bytes.push(c);
    else if (c < 0x800) { bytes.push(0xc0 | (c >> 6), 0x80 | (c & 0x3f)); }
    else { bytes.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 0x3f), 0x80 | (c & 0x3f)); }
  }
  return bytes;
}
function sha256(text) { return _sha256(_utf8(text)); }
function hmacSha256(keyText, msgText) {
  var key = _utf8(keyText);
  if (key.length > 64) key = _hexBytes(_sha256(key));
  var ipad = [], opad = [];
  for (var i = 0; i < 64; i++) {
    var k = i < key.length ? key[i] : 0;
    ipad.push(k ^ 0x36); opad.push(k ^ 0x5c);
  }
  return _sha256(opad.concat(_sha256(ipad.concat(_utf8(msgText))).match(/../g).map(_hexByte)));
}
function _hexByte(h) { return parseInt(h, 16); }
function _hexBytes(hex) { return hex.match(/../g).map(_hexByte); }

function queryString(params) {
  return Object.keys(params).map(function (k) {
    return k + "=" + encodeURIComponent(String(params[k]));
  }).join("&");
}
function sign(params, secret) {
  var qs = queryString(params);
  return { query: qs, signature: hmacSha256(secret, qs) };
}

function _roundDown(value, step) {
  if (step <= 0) return value;
  var inv = 1 / step;
  return Math.round(Math.floor(value * inv) / inv * 1e12) / 1e12;
}
function normalizeQuantity(qty, stepSize) { return _roundDown(qty, stepSize); }
function normalizePrice(price, tickSize) { return _roundDown(price, tickSize); }
function checkFilters(input) {
  var price = input.price, qty = input.qty;
  var errors = [];
  if (input.tickSize > 0 && Math.abs(price - _roundDown(price, input.tickSize)) > 1e-12) {
    errors.push("PRICE_FILTER: price not on tick " + input.tickSize);
  }
  if (input.stepSize > 0 && Math.abs(qty - _roundDown(qty, input.stepSize)) > 1e-12) {
    errors.push("LOT_SIZE: qty not on step " + input.stepSize);
  }
  if (input.minQty > 0 && qty < input.minQty) {
    errors.push("LOT_SIZE: qty " + qty + " below minQty " + input.minQty);
  }
  if (input.minNotional > 0 && price * qty < input.minNotional) {
    errors.push("MIN_NOTIONAL: " + price * qty + " below " + input.minNotional);
  }
  return errors;
}

function decodeKline(row) {
  if (!Array.isArray(row) || row.length < 11) {
    throw new Error("kline row must be an array of >= 11 fields");
  }
  return {
    openTime: row[0], open: parseFloat(row[1]), high: parseFloat(row[2]),
    low: parseFloat(row[3]), close: parseFloat(row[4]), volume: parseFloat(row[5]),
    closeTime: row[6], quoteVolume: parseFloat(row[7]), trades: row[8]
  };
}

module.exports = {
  sha256: sha256,
  hmacSha256: hmacSha256,
  queryString: queryString,
  sign: sign,
  normalizeQuantity: normalizeQuantity,
  normalizePrice: normalizePrice,
  checkFilters: checkFilters,
  decodeKline: decodeKline
};
