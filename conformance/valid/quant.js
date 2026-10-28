// Host trusted script "quant". European Black-Scholes-Merton on one finite
// argument object: { s, k, t, v, r, type, q? }. No I/O, no globals.
function num(value, name) {
    if (typeof value !== "number" || !isFinite(value)) {
        throw new Error("quant: " + name);
    }
    return value;
}

function read(args) {
    if (args === null || typeof args !== "object") {
        throw new Error("quant: arguments");
    }
    var s = num(args.s, "s");
    var k = num(args.k, "k");
    var t = num(args.t, "t");
    var v = num(args.v, "v");
    var r = num(args.r, "r");
    var q = args.q === undefined ? 0 : num(args.q, "q");
    var type = args.type;
    if (!(s > 0) || !(k > 0) || !(t > 0) || !(v > 0)) {
        throw new Error("quant: domain");
    }
    if (type !== "call" && type !== "put") {
        throw new Error("quant: type");
    }
    var sqrtT = Math.sqrt(t);
    return {
        s: s,
        k: k,
        t: t,
        v: v,
        r: r,
        q: q,
        type: type,
        sqrtT: sqrtT,
        d1: (Math.log(s / k) + (r - q + 0.5 * v * v) * t) / (v * sqrtT),
        d2: (Math.log(s / k) + (r - q - 0.5 * v * v) * t) / (v * sqrtT),
        dfS: Math.exp(-q * t),
        dfK: Math.exp(-r * t)
    };
}

function erf(x) {
    var sign = x < 0 ? -1 : 1;
    var ax = Math.abs(x);
    var p = 0.3275911;
    var t = 1 / (1 + p * ax);
    var y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-ax * ax);
    return sign * y;
}

function normCdf(x) {
    return 0.5 * (1 + erf(x / Math.SQRT2));
}

function normPdf(x) {
    return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
}

function priceOf(m) {
    if (m.type === "call") {
        return m.dfS * m.s * normCdf(m.d1) - m.dfK * m.k * normCdf(m.d2);
    }
    return m.dfK * m.k * normCdf(-m.d2) - m.dfS * m.s * normCdf(-m.d1);
}

function blackScholes(args) {
    return priceOf(read(args));
}

function greeks(args) {
    var m = read(args);
    var pdf = normPdf(m.d1);
    var call = m.type === "call";
    var delta = call ? m.dfS * normCdf(m.d1) : m.dfS * (normCdf(m.d1) - 1);
    var gamma = m.dfS * pdf / (m.s * m.v * m.sqrtT);
    var vega = m.dfS * m.s * pdf * m.sqrtT;
    var theta = -m.dfS * m.s * pdf * m.v / (2 * m.sqrtT);
    if (call) {
        theta += -m.r * m.k * m.dfK * normCdf(m.d2) + m.q * m.s * m.dfS * normCdf(m.d1);
    } else {
        theta += m.r * m.k * m.dfK * normCdf(-m.d2) - m.q * m.s * m.dfS * normCdf(-m.d1);
    }
    var rho = call ? m.k * m.t * m.dfK * normCdf(m.d2) : -m.k * m.t * m.dfK * normCdf(-m.d2);
    return {
        price: priceOf(m),
        delta: delta,
        gamma: gamma,
        vega: vega,
        theta: theta,
        rho: rho
    };
}

function impliedVol(args) {
    if (args === null || typeof args !== "object") {
        throw new Error("quant: arguments");
    }
    var target = num(args.price, "price");
    if (!(target > 0)) {
        throw new Error("quant: domain");
    }
    var low = 1e-4;
    var high = 5;
    function at(sigma) {
        return blackScholes({
            s: args.s,
            k: args.k,
            t: args.t,
            v: sigma,
            r: args.r,
            q: args.q,
            type: args.type
        });
    }
    if (at(high) < target) {
        throw new Error("quant: implied vol");
    }
    for (var i = 0; i < 60; i++) {
        var mid = (low + high) / 2;
        if (at(mid) > target) high = mid;
        else low = mid;
    }
    return (low + high) / 2;
}

module.exports = {
    blackScholes: blackScholes,
    greeks: greeks,
    impliedVol: impliedVol
};
