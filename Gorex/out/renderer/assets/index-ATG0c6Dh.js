function getDefaultExportFromCjs(x2) {
  return x2 && x2.__esModule && Object.prototype.hasOwnProperty.call(x2, "default") ? x2["default"] : x2;
}
var jsxRuntime = { exports: {} };
var reactJsxRuntime_production_min = {};
var react = { exports: {} };
var react_production_min = {};
/**
 * @license React
 * react.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var l$1 = Symbol.for("react.element"), n$1 = Symbol.for("react.portal"), p$2 = Symbol.for("react.fragment"), q$1 = Symbol.for("react.strict_mode"), r = Symbol.for("react.profiler"), t = Symbol.for("react.provider"), u = Symbol.for("react.context"), v$1 = Symbol.for("react.forward_ref"), w = Symbol.for("react.suspense"), x = Symbol.for("react.memo"), y = Symbol.for("react.lazy"), z$1 = Symbol.iterator;
function A$1(a) {
  if (null === a || "object" !== typeof a) return null;
  a = z$1 && a[z$1] || a["@@iterator"];
  return "function" === typeof a ? a : null;
}
var B$1 = { isMounted: function() {
  return false;
}, enqueueForceUpdate: function() {
}, enqueueReplaceState: function() {
}, enqueueSetState: function() {
} }, C$1 = Object.assign, D$1 = {};
function E$1(a, b, e) {
  this.props = a;
  this.context = b;
  this.refs = D$1;
  this.updater = e || B$1;
}
E$1.prototype.isReactComponent = {};
E$1.prototype.setState = function(a, b) {
  if ("object" !== typeof a && "function" !== typeof a && null != a) throw Error("setState(...): takes an object of state variables to update or a function which returns an object of state variables.");
  this.updater.enqueueSetState(this, a, b, "setState");
};
E$1.prototype.forceUpdate = function(a) {
  this.updater.enqueueForceUpdate(this, a, "forceUpdate");
};
function F() {
}
F.prototype = E$1.prototype;
function G$1(a, b, e) {
  this.props = a;
  this.context = b;
  this.refs = D$1;
  this.updater = e || B$1;
}
var H$1 = G$1.prototype = new F();
H$1.constructor = G$1;
C$1(H$1, E$1.prototype);
H$1.isPureReactComponent = true;
var I$1 = Array.isArray, J = Object.prototype.hasOwnProperty, K$1 = { current: null }, L$1 = { key: true, ref: true, __self: true, __source: true };
function M$1(a, b, e) {
  var d, c = {}, k2 = null, h = null;
  if (null != b) for (d in void 0 !== b.ref && (h = b.ref), void 0 !== b.key && (k2 = "" + b.key), b) J.call(b, d) && !L$1.hasOwnProperty(d) && (c[d] = b[d]);
  var g = arguments.length - 2;
  if (1 === g) c.children = e;
  else if (1 < g) {
    for (var f2 = Array(g), m2 = 0; m2 < g; m2++) f2[m2] = arguments[m2 + 2];
    c.children = f2;
  }
  if (a && a.defaultProps) for (d in g = a.defaultProps, g) void 0 === c[d] && (c[d] = g[d]);
  return { $$typeof: l$1, type: a, key: k2, ref: h, props: c, _owner: K$1.current };
}
function N$1(a, b) {
  return { $$typeof: l$1, type: a.type, key: b, ref: a.ref, props: a.props, _owner: a._owner };
}
function O$1(a) {
  return "object" === typeof a && null !== a && a.$$typeof === l$1;
}
function escape(a) {
  var b = { "=": "=0", ":": "=2" };
  return "$" + a.replace(/[=:]/g, function(a2) {
    return b[a2];
  });
}
var P$1 = /\/+/g;
function Q$1(a, b) {
  return "object" === typeof a && null !== a && null != a.key ? escape("" + a.key) : b.toString(36);
}
function R$1(a, b, e, d, c) {
  var k2 = typeof a;
  if ("undefined" === k2 || "boolean" === k2) a = null;
  var h = false;
  if (null === a) h = true;
  else switch (k2) {
    case "string":
    case "number":
      h = true;
      break;
    case "object":
      switch (a.$$typeof) {
        case l$1:
        case n$1:
          h = true;
      }
  }
  if (h) return h = a, c = c(h), a = "" === d ? "." + Q$1(h, 0) : d, I$1(c) ? (e = "", null != a && (e = a.replace(P$1, "$&/") + "/"), R$1(c, b, e, "", function(a2) {
    return a2;
  })) : null != c && (O$1(c) && (c = N$1(c, e + (!c.key || h && h.key === c.key ? "" : ("" + c.key).replace(P$1, "$&/") + "/") + a)), b.push(c)), 1;
  h = 0;
  d = "" === d ? "." : d + ":";
  if (I$1(a)) for (var g = 0; g < a.length; g++) {
    k2 = a[g];
    var f2 = d + Q$1(k2, g);
    h += R$1(k2, b, e, f2, c);
  }
  else if (f2 = A$1(a), "function" === typeof f2) for (a = f2.call(a), g = 0; !(k2 = a.next()).done; ) k2 = k2.value, f2 = d + Q$1(k2, g++), h += R$1(k2, b, e, f2, c);
  else if ("object" === k2) throw b = String(a), Error("Objects are not valid as a React child (found: " + ("[object Object]" === b ? "object with keys {" + Object.keys(a).join(", ") + "}" : b) + "). If you meant to render a collection of children, use an array instead.");
  return h;
}
function S$1(a, b, e) {
  if (null == a) return a;
  var d = [], c = 0;
  R$1(a, d, "", "", function(a2) {
    return b.call(e, a2, c++);
  });
  return d;
}
function T$1(a) {
  if (-1 === a._status) {
    var b = a._result;
    b = b();
    b.then(function(b2) {
      if (0 === a._status || -1 === a._status) a._status = 1, a._result = b2;
    }, function(b2) {
      if (0 === a._status || -1 === a._status) a._status = 2, a._result = b2;
    });
    -1 === a._status && (a._status = 0, a._result = b);
  }
  if (1 === a._status) return a._result.default;
  throw a._result;
}
var U$1 = { current: null }, V$1 = { transition: null }, W$1 = { ReactCurrentDispatcher: U$1, ReactCurrentBatchConfig: V$1, ReactCurrentOwner: K$1 };
function X$1() {
  throw Error("act(...) is not supported in production builds of React.");
}
react_production_min.Children = { map: S$1, forEach: function(a, b, e) {
  S$1(a, function() {
    b.apply(this, arguments);
  }, e);
}, count: function(a) {
  var b = 0;
  S$1(a, function() {
    b++;
  });
  return b;
}, toArray: function(a) {
  return S$1(a, function(a2) {
    return a2;
  }) || [];
}, only: function(a) {
  if (!O$1(a)) throw Error("React.Children.only expected to receive a single React element child.");
  return a;
} };
react_production_min.Component = E$1;
react_production_min.Fragment = p$2;
react_production_min.Profiler = r;
react_production_min.PureComponent = G$1;
react_production_min.StrictMode = q$1;
react_production_min.Suspense = w;
react_production_min.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = W$1;
react_production_min.act = X$1;
react_production_min.cloneElement = function(a, b, e) {
  if (null === a || void 0 === a) throw Error("React.cloneElement(...): The argument must be a React element, but you passed " + a + ".");
  var d = C$1({}, a.props), c = a.key, k2 = a.ref, h = a._owner;
  if (null != b) {
    void 0 !== b.ref && (k2 = b.ref, h = K$1.current);
    void 0 !== b.key && (c = "" + b.key);
    if (a.type && a.type.defaultProps) var g = a.type.defaultProps;
    for (f2 in b) J.call(b, f2) && !L$1.hasOwnProperty(f2) && (d[f2] = void 0 === b[f2] && void 0 !== g ? g[f2] : b[f2]);
  }
  var f2 = arguments.length - 2;
  if (1 === f2) d.children = e;
  else if (1 < f2) {
    g = Array(f2);
    for (var m2 = 0; m2 < f2; m2++) g[m2] = arguments[m2 + 2];
    d.children = g;
  }
  return { $$typeof: l$1, type: a.type, key: c, ref: k2, props: d, _owner: h };
};
react_production_min.createContext = function(a) {
  a = { $$typeof: u, _currentValue: a, _currentValue2: a, _threadCount: 0, Provider: null, Consumer: null, _defaultValue: null, _globalName: null };
  a.Provider = { $$typeof: t, _context: a };
  return a.Consumer = a;
};
react_production_min.createElement = M$1;
react_production_min.createFactory = function(a) {
  var b = M$1.bind(null, a);
  b.type = a;
  return b;
};
react_production_min.createRef = function() {
  return { current: null };
};
react_production_min.forwardRef = function(a) {
  return { $$typeof: v$1, render: a };
};
react_production_min.isValidElement = O$1;
react_production_min.lazy = function(a) {
  return { $$typeof: y, _payload: { _status: -1, _result: a }, _init: T$1 };
};
react_production_min.memo = function(a, b) {
  return { $$typeof: x, type: a, compare: void 0 === b ? null : b };
};
react_production_min.startTransition = function(a) {
  var b = V$1.transition;
  V$1.transition = {};
  try {
    a();
  } finally {
    V$1.transition = b;
  }
};
react_production_min.unstable_act = X$1;
react_production_min.useCallback = function(a, b) {
  return U$1.current.useCallback(a, b);
};
react_production_min.useContext = function(a) {
  return U$1.current.useContext(a);
};
react_production_min.useDebugValue = function() {
};
react_production_min.useDeferredValue = function(a) {
  return U$1.current.useDeferredValue(a);
};
react_production_min.useEffect = function(a, b) {
  return U$1.current.useEffect(a, b);
};
react_production_min.useId = function() {
  return U$1.current.useId();
};
react_production_min.useImperativeHandle = function(a, b, e) {
  return U$1.current.useImperativeHandle(a, b, e);
};
react_production_min.useInsertionEffect = function(a, b) {
  return U$1.current.useInsertionEffect(a, b);
};
react_production_min.useLayoutEffect = function(a, b) {
  return U$1.current.useLayoutEffect(a, b);
};
react_production_min.useMemo = function(a, b) {
  return U$1.current.useMemo(a, b);
};
react_production_min.useReducer = function(a, b, e) {
  return U$1.current.useReducer(a, b, e);
};
react_production_min.useRef = function(a) {
  return U$1.current.useRef(a);
};
react_production_min.useState = function(a) {
  return U$1.current.useState(a);
};
react_production_min.useSyncExternalStore = function(a, b, e) {
  return U$1.current.useSyncExternalStore(a, b, e);
};
react_production_min.useTransition = function() {
  return U$1.current.useTransition();
};
react_production_min.version = "18.3.1";
{
  react.exports = react_production_min;
}
var reactExports = react.exports;
const React = /* @__PURE__ */ getDefaultExportFromCjs(reactExports);
/**
 * @license React
 * react-jsx-runtime.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var f = reactExports, k = Symbol.for("react.element"), l = Symbol.for("react.fragment"), m$1 = Object.prototype.hasOwnProperty, n = f.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner, p$1 = { key: true, ref: true, __self: true, __source: true };
function q(c, a, g) {
  var b, d = {}, e = null, h = null;
  void 0 !== g && (e = "" + g);
  void 0 !== a.key && (e = "" + a.key);
  void 0 !== a.ref && (h = a.ref);
  for (b in a) m$1.call(a, b) && !p$1.hasOwnProperty(b) && (d[b] = a[b]);
  if (c && c.defaultProps) for (b in a = c.defaultProps, a) void 0 === d[b] && (d[b] = a[b]);
  return { $$typeof: k, type: c, key: e, ref: h, props: d, _owner: n.current };
}
reactJsxRuntime_production_min.Fragment = l;
reactJsxRuntime_production_min.jsx = q;
reactJsxRuntime_production_min.jsxs = q;
{
  jsxRuntime.exports = reactJsxRuntime_production_min;
}
var jsxRuntimeExports = jsxRuntime.exports;
var client = {};
var reactDom = { exports: {} };
var reactDom_production_min = {};
var scheduler = { exports: {} };
var scheduler_production_min = {};
/**
 * @license React
 * scheduler.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
(function(exports$1) {
  function f2(a, b) {
    var c = a.length;
    a.push(b);
    a: for (; 0 < c; ) {
      var d = c - 1 >>> 1, e = a[d];
      if (0 < g(e, b)) a[d] = b, a[c] = e, c = d;
      else break a;
    }
  }
  function h(a) {
    return 0 === a.length ? null : a[0];
  }
  function k2(a) {
    if (0 === a.length) return null;
    var b = a[0], c = a.pop();
    if (c !== b) {
      a[0] = c;
      a: for (var d = 0, e = a.length, w2 = e >>> 1; d < w2; ) {
        var m2 = 2 * (d + 1) - 1, C2 = a[m2], n2 = m2 + 1, x2 = a[n2];
        if (0 > g(C2, c)) n2 < e && 0 > g(x2, C2) ? (a[d] = x2, a[n2] = c, d = n2) : (a[d] = C2, a[m2] = c, d = m2);
        else if (n2 < e && 0 > g(x2, c)) a[d] = x2, a[n2] = c, d = n2;
        else break a;
      }
    }
    return b;
  }
  function g(a, b) {
    var c = a.sortIndex - b.sortIndex;
    return 0 !== c ? c : a.id - b.id;
  }
  if ("object" === typeof performance && "function" === typeof performance.now) {
    var l2 = performance;
    exports$1.unstable_now = function() {
      return l2.now();
    };
  } else {
    var p2 = Date, q2 = p2.now();
    exports$1.unstable_now = function() {
      return p2.now() - q2;
    };
  }
  var r2 = [], t2 = [], u2 = 1, v2 = null, y2 = 3, z2 = false, A2 = false, B2 = false, D2 = "function" === typeof setTimeout ? setTimeout : null, E2 = "function" === typeof clearTimeout ? clearTimeout : null, F2 = "undefined" !== typeof setImmediate ? setImmediate : null;
  "undefined" !== typeof navigator && void 0 !== navigator.scheduling && void 0 !== navigator.scheduling.isInputPending && navigator.scheduling.isInputPending.bind(navigator.scheduling);
  function G2(a) {
    for (var b = h(t2); null !== b; ) {
      if (null === b.callback) k2(t2);
      else if (b.startTime <= a) k2(t2), b.sortIndex = b.expirationTime, f2(r2, b);
      else break;
      b = h(t2);
    }
  }
  function H2(a) {
    B2 = false;
    G2(a);
    if (!A2) if (null !== h(r2)) A2 = true, I2(J2);
    else {
      var b = h(t2);
      null !== b && K2(H2, b.startTime - a);
    }
  }
  function J2(a, b) {
    A2 = false;
    B2 && (B2 = false, E2(L2), L2 = -1);
    z2 = true;
    var c = y2;
    try {
      G2(b);
      for (v2 = h(r2); null !== v2 && (!(v2.expirationTime > b) || a && !M2()); ) {
        var d = v2.callback;
        if ("function" === typeof d) {
          v2.callback = null;
          y2 = v2.priorityLevel;
          var e = d(v2.expirationTime <= b);
          b = exports$1.unstable_now();
          "function" === typeof e ? v2.callback = e : v2 === h(r2) && k2(r2);
          G2(b);
        } else k2(r2);
        v2 = h(r2);
      }
      if (null !== v2) var w2 = true;
      else {
        var m2 = h(t2);
        null !== m2 && K2(H2, m2.startTime - b);
        w2 = false;
      }
      return w2;
    } finally {
      v2 = null, y2 = c, z2 = false;
    }
  }
  var N2 = false, O2 = null, L2 = -1, P2 = 5, Q2 = -1;
  function M2() {
    return exports$1.unstable_now() - Q2 < P2 ? false : true;
  }
  function R2() {
    if (null !== O2) {
      var a = exports$1.unstable_now();
      Q2 = a;
      var b = true;
      try {
        b = O2(true, a);
      } finally {
        b ? S2() : (N2 = false, O2 = null);
      }
    } else N2 = false;
  }
  var S2;
  if ("function" === typeof F2) S2 = function() {
    F2(R2);
  };
  else if ("undefined" !== typeof MessageChannel) {
    var T2 = new MessageChannel(), U2 = T2.port2;
    T2.port1.onmessage = R2;
    S2 = function() {
      U2.postMessage(null);
    };
  } else S2 = function() {
    D2(R2, 0);
  };
  function I2(a) {
    O2 = a;
    N2 || (N2 = true, S2());
  }
  function K2(a, b) {
    L2 = D2(function() {
      a(exports$1.unstable_now());
    }, b);
  }
  exports$1.unstable_IdlePriority = 5;
  exports$1.unstable_ImmediatePriority = 1;
  exports$1.unstable_LowPriority = 4;
  exports$1.unstable_NormalPriority = 3;
  exports$1.unstable_Profiling = null;
  exports$1.unstable_UserBlockingPriority = 2;
  exports$1.unstable_cancelCallback = function(a) {
    a.callback = null;
  };
  exports$1.unstable_continueExecution = function() {
    A2 || z2 || (A2 = true, I2(J2));
  };
  exports$1.unstable_forceFrameRate = function(a) {
    0 > a || 125 < a ? console.error("forceFrameRate takes a positive int between 0 and 125, forcing frame rates higher than 125 fps is not supported") : P2 = 0 < a ? Math.floor(1e3 / a) : 5;
  };
  exports$1.unstable_getCurrentPriorityLevel = function() {
    return y2;
  };
  exports$1.unstable_getFirstCallbackNode = function() {
    return h(r2);
  };
  exports$1.unstable_next = function(a) {
    switch (y2) {
      case 1:
      case 2:
      case 3:
        var b = 3;
        break;
      default:
        b = y2;
    }
    var c = y2;
    y2 = b;
    try {
      return a();
    } finally {
      y2 = c;
    }
  };
  exports$1.unstable_pauseExecution = function() {
  };
  exports$1.unstable_requestPaint = function() {
  };
  exports$1.unstable_runWithPriority = function(a, b) {
    switch (a) {
      case 1:
      case 2:
      case 3:
      case 4:
      case 5:
        break;
      default:
        a = 3;
    }
    var c = y2;
    y2 = a;
    try {
      return b();
    } finally {
      y2 = c;
    }
  };
  exports$1.unstable_scheduleCallback = function(a, b, c) {
    var d = exports$1.unstable_now();
    "object" === typeof c && null !== c ? (c = c.delay, c = "number" === typeof c && 0 < c ? d + c : d) : c = d;
    switch (a) {
      case 1:
        var e = -1;
        break;
      case 2:
        e = 250;
        break;
      case 5:
        e = 1073741823;
        break;
      case 4:
        e = 1e4;
        break;
      default:
        e = 5e3;
    }
    e = c + e;
    a = { id: u2++, callback: b, priorityLevel: a, startTime: c, expirationTime: e, sortIndex: -1 };
    c > d ? (a.sortIndex = c, f2(t2, a), null === h(r2) && a === h(t2) && (B2 ? (E2(L2), L2 = -1) : B2 = true, K2(H2, c - d))) : (a.sortIndex = e, f2(r2, a), A2 || z2 || (A2 = true, I2(J2)));
    return a;
  };
  exports$1.unstable_shouldYield = M2;
  exports$1.unstable_wrapCallback = function(a) {
    var b = y2;
    return function() {
      var c = y2;
      y2 = b;
      try {
        return a.apply(this, arguments);
      } finally {
        y2 = c;
      }
    };
  };
})(scheduler_production_min);
{
  scheduler.exports = scheduler_production_min;
}
var schedulerExports = scheduler.exports;
/**
 * @license React
 * react-dom.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var aa = reactExports, ca = schedulerExports;
function p(a) {
  for (var b = "https://reactjs.org/docs/error-decoder.html?invariant=" + a, c = 1; c < arguments.length; c++) b += "&args[]=" + encodeURIComponent(arguments[c]);
  return "Minified React error #" + a + "; visit " + b + " for the full message or use the non-minified dev environment for full errors and additional helpful warnings.";
}
var da = /* @__PURE__ */ new Set(), ea = {};
function fa(a, b) {
  ha(a, b);
  ha(a + "Capture", b);
}
function ha(a, b) {
  ea[a] = b;
  for (a = 0; a < b.length; a++) da.add(b[a]);
}
var ia = !("undefined" === typeof window || "undefined" === typeof window.document || "undefined" === typeof window.document.createElement), ja = Object.prototype.hasOwnProperty, ka = /^[:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD][:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\-.0-9\u00B7\u0300-\u036F\u203F-\u2040]*$/, la = {}, ma = {};
function oa(a) {
  if (ja.call(ma, a)) return true;
  if (ja.call(la, a)) return false;
  if (ka.test(a)) return ma[a] = true;
  la[a] = true;
  return false;
}
function pa(a, b, c, d) {
  if (null !== c && 0 === c.type) return false;
  switch (typeof b) {
    case "function":
    case "symbol":
      return true;
    case "boolean":
      if (d) return false;
      if (null !== c) return !c.acceptsBooleans;
      a = a.toLowerCase().slice(0, 5);
      return "data-" !== a && "aria-" !== a;
    default:
      return false;
  }
}
function qa(a, b, c, d) {
  if (null === b || "undefined" === typeof b || pa(a, b, c, d)) return true;
  if (d) return false;
  if (null !== c) switch (c.type) {
    case 3:
      return !b;
    case 4:
      return false === b;
    case 5:
      return isNaN(b);
    case 6:
      return isNaN(b) || 1 > b;
  }
  return false;
}
function v(a, b, c, d, e, f2, g) {
  this.acceptsBooleans = 2 === b || 3 === b || 4 === b;
  this.attributeName = d;
  this.attributeNamespace = e;
  this.mustUseProperty = c;
  this.propertyName = a;
  this.type = b;
  this.sanitizeURL = f2;
  this.removeEmptyString = g;
}
var z = {};
"children dangerouslySetInnerHTML defaultValue defaultChecked innerHTML suppressContentEditableWarning suppressHydrationWarning style".split(" ").forEach(function(a) {
  z[a] = new v(a, 0, false, a, null, false, false);
});
[["acceptCharset", "accept-charset"], ["className", "class"], ["htmlFor", "for"], ["httpEquiv", "http-equiv"]].forEach(function(a) {
  var b = a[0];
  z[b] = new v(b, 1, false, a[1], null, false, false);
});
["contentEditable", "draggable", "spellCheck", "value"].forEach(function(a) {
  z[a] = new v(a, 2, false, a.toLowerCase(), null, false, false);
});
["autoReverse", "externalResourcesRequired", "focusable", "preserveAlpha"].forEach(function(a) {
  z[a] = new v(a, 2, false, a, null, false, false);
});
"allowFullScreen async autoFocus autoPlay controls default defer disabled disablePictureInPicture disableRemotePlayback formNoValidate hidden loop noModule noValidate open playsInline readOnly required reversed scoped seamless itemScope".split(" ").forEach(function(a) {
  z[a] = new v(a, 3, false, a.toLowerCase(), null, false, false);
});
["checked", "multiple", "muted", "selected"].forEach(function(a) {
  z[a] = new v(a, 3, true, a, null, false, false);
});
["capture", "download"].forEach(function(a) {
  z[a] = new v(a, 4, false, a, null, false, false);
});
["cols", "rows", "size", "span"].forEach(function(a) {
  z[a] = new v(a, 6, false, a, null, false, false);
});
["rowSpan", "start"].forEach(function(a) {
  z[a] = new v(a, 5, false, a.toLowerCase(), null, false, false);
});
var ra = /[\-:]([a-z])/g;
function sa(a) {
  return a[1].toUpperCase();
}
"accent-height alignment-baseline arabic-form baseline-shift cap-height clip-path clip-rule color-interpolation color-interpolation-filters color-profile color-rendering dominant-baseline enable-background fill-opacity fill-rule flood-color flood-opacity font-family font-size font-size-adjust font-stretch font-style font-variant font-weight glyph-name glyph-orientation-horizontal glyph-orientation-vertical horiz-adv-x horiz-origin-x image-rendering letter-spacing lighting-color marker-end marker-mid marker-start overline-position overline-thickness paint-order panose-1 pointer-events rendering-intent shape-rendering stop-color stop-opacity strikethrough-position strikethrough-thickness stroke-dasharray stroke-dashoffset stroke-linecap stroke-linejoin stroke-miterlimit stroke-opacity stroke-width text-anchor text-decoration text-rendering underline-position underline-thickness unicode-bidi unicode-range units-per-em v-alphabetic v-hanging v-ideographic v-mathematical vector-effect vert-adv-y vert-origin-x vert-origin-y word-spacing writing-mode xmlns:xlink x-height".split(" ").forEach(function(a) {
  var b = a.replace(
    ra,
    sa
  );
  z[b] = new v(b, 1, false, a, null, false, false);
});
"xlink:actuate xlink:arcrole xlink:role xlink:show xlink:title xlink:type".split(" ").forEach(function(a) {
  var b = a.replace(ra, sa);
  z[b] = new v(b, 1, false, a, "http://www.w3.org/1999/xlink", false, false);
});
["xml:base", "xml:lang", "xml:space"].forEach(function(a) {
  var b = a.replace(ra, sa);
  z[b] = new v(b, 1, false, a, "http://www.w3.org/XML/1998/namespace", false, false);
});
["tabIndex", "crossOrigin"].forEach(function(a) {
  z[a] = new v(a, 1, false, a.toLowerCase(), null, false, false);
});
z.xlinkHref = new v("xlinkHref", 1, false, "xlink:href", "http://www.w3.org/1999/xlink", true, false);
["src", "href", "action", "formAction"].forEach(function(a) {
  z[a] = new v(a, 1, false, a.toLowerCase(), null, true, true);
});
function ta(a, b, c, d) {
  var e = z.hasOwnProperty(b) ? z[b] : null;
  if (null !== e ? 0 !== e.type : d || !(2 < b.length) || "o" !== b[0] && "O" !== b[0] || "n" !== b[1] && "N" !== b[1]) qa(b, c, e, d) && (c = null), d || null === e ? oa(b) && (null === c ? a.removeAttribute(b) : a.setAttribute(b, "" + c)) : e.mustUseProperty ? a[e.propertyName] = null === c ? 3 === e.type ? false : "" : c : (b = e.attributeName, d = e.attributeNamespace, null === c ? a.removeAttribute(b) : (e = e.type, c = 3 === e || 4 === e && true === c ? "" : "" + c, d ? a.setAttributeNS(d, b, c) : a.setAttribute(b, c)));
}
var ua = aa.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED, va = Symbol.for("react.element"), wa = Symbol.for("react.portal"), ya = Symbol.for("react.fragment"), za = Symbol.for("react.strict_mode"), Aa = Symbol.for("react.profiler"), Ba = Symbol.for("react.provider"), Ca = Symbol.for("react.context"), Da = Symbol.for("react.forward_ref"), Ea = Symbol.for("react.suspense"), Fa = Symbol.for("react.suspense_list"), Ga = Symbol.for("react.memo"), Ha = Symbol.for("react.lazy");
var Ia = Symbol.for("react.offscreen");
var Ja = Symbol.iterator;
function Ka(a) {
  if (null === a || "object" !== typeof a) return null;
  a = Ja && a[Ja] || a["@@iterator"];
  return "function" === typeof a ? a : null;
}
var A = Object.assign, La;
function Ma(a) {
  if (void 0 === La) try {
    throw Error();
  } catch (c) {
    var b = c.stack.trim().match(/\n( *(at )?)/);
    La = b && b[1] || "";
  }
  return "\n" + La + a;
}
var Na = false;
function Oa(a, b) {
  if (!a || Na) return "";
  Na = true;
  var c = Error.prepareStackTrace;
  Error.prepareStackTrace = void 0;
  try {
    if (b) if (b = function() {
      throw Error();
    }, Object.defineProperty(b.prototype, "props", { set: function() {
      throw Error();
    } }), "object" === typeof Reflect && Reflect.construct) {
      try {
        Reflect.construct(b, []);
      } catch (l2) {
        var d = l2;
      }
      Reflect.construct(a, [], b);
    } else {
      try {
        b.call();
      } catch (l2) {
        d = l2;
      }
      a.call(b.prototype);
    }
    else {
      try {
        throw Error();
      } catch (l2) {
        d = l2;
      }
      a();
    }
  } catch (l2) {
    if (l2 && d && "string" === typeof l2.stack) {
      for (var e = l2.stack.split("\n"), f2 = d.stack.split("\n"), g = e.length - 1, h = f2.length - 1; 1 <= g && 0 <= h && e[g] !== f2[h]; ) h--;
      for (; 1 <= g && 0 <= h; g--, h--) if (e[g] !== f2[h]) {
        if (1 !== g || 1 !== h) {
          do
            if (g--, h--, 0 > h || e[g] !== f2[h]) {
              var k2 = "\n" + e[g].replace(" at new ", " at ");
              a.displayName && k2.includes("<anonymous>") && (k2 = k2.replace("<anonymous>", a.displayName));
              return k2;
            }
          while (1 <= g && 0 <= h);
        }
        break;
      }
    }
  } finally {
    Na = false, Error.prepareStackTrace = c;
  }
  return (a = a ? a.displayName || a.name : "") ? Ma(a) : "";
}
function Pa(a) {
  switch (a.tag) {
    case 5:
      return Ma(a.type);
    case 16:
      return Ma("Lazy");
    case 13:
      return Ma("Suspense");
    case 19:
      return Ma("SuspenseList");
    case 0:
    case 2:
    case 15:
      return a = Oa(a.type, false), a;
    case 11:
      return a = Oa(a.type.render, false), a;
    case 1:
      return a = Oa(a.type, true), a;
    default:
      return "";
  }
}
function Qa(a) {
  if (null == a) return null;
  if ("function" === typeof a) return a.displayName || a.name || null;
  if ("string" === typeof a) return a;
  switch (a) {
    case ya:
      return "Fragment";
    case wa:
      return "Portal";
    case Aa:
      return "Profiler";
    case za:
      return "StrictMode";
    case Ea:
      return "Suspense";
    case Fa:
      return "SuspenseList";
  }
  if ("object" === typeof a) switch (a.$$typeof) {
    case Ca:
      return (a.displayName || "Context") + ".Consumer";
    case Ba:
      return (a._context.displayName || "Context") + ".Provider";
    case Da:
      var b = a.render;
      a = a.displayName;
      a || (a = b.displayName || b.name || "", a = "" !== a ? "ForwardRef(" + a + ")" : "ForwardRef");
      return a;
    case Ga:
      return b = a.displayName || null, null !== b ? b : Qa(a.type) || "Memo";
    case Ha:
      b = a._payload;
      a = a._init;
      try {
        return Qa(a(b));
      } catch (c) {
      }
  }
  return null;
}
function Ra(a) {
  var b = a.type;
  switch (a.tag) {
    case 24:
      return "Cache";
    case 9:
      return (b.displayName || "Context") + ".Consumer";
    case 10:
      return (b._context.displayName || "Context") + ".Provider";
    case 18:
      return "DehydratedFragment";
    case 11:
      return a = b.render, a = a.displayName || a.name || "", b.displayName || ("" !== a ? "ForwardRef(" + a + ")" : "ForwardRef");
    case 7:
      return "Fragment";
    case 5:
      return b;
    case 4:
      return "Portal";
    case 3:
      return "Root";
    case 6:
      return "Text";
    case 16:
      return Qa(b);
    case 8:
      return b === za ? "StrictMode" : "Mode";
    case 22:
      return "Offscreen";
    case 12:
      return "Profiler";
    case 21:
      return "Scope";
    case 13:
      return "Suspense";
    case 19:
      return "SuspenseList";
    case 25:
      return "TracingMarker";
    case 1:
    case 0:
    case 17:
    case 2:
    case 14:
    case 15:
      if ("function" === typeof b) return b.displayName || b.name || null;
      if ("string" === typeof b) return b;
  }
  return null;
}
function Sa(a) {
  switch (typeof a) {
    case "boolean":
    case "number":
    case "string":
    case "undefined":
      return a;
    case "object":
      return a;
    default:
      return "";
  }
}
function Ta(a) {
  var b = a.type;
  return (a = a.nodeName) && "input" === a.toLowerCase() && ("checkbox" === b || "radio" === b);
}
function Ua(a) {
  var b = Ta(a) ? "checked" : "value", c = Object.getOwnPropertyDescriptor(a.constructor.prototype, b), d = "" + a[b];
  if (!a.hasOwnProperty(b) && "undefined" !== typeof c && "function" === typeof c.get && "function" === typeof c.set) {
    var e = c.get, f2 = c.set;
    Object.defineProperty(a, b, { configurable: true, get: function() {
      return e.call(this);
    }, set: function(a2) {
      d = "" + a2;
      f2.call(this, a2);
    } });
    Object.defineProperty(a, b, { enumerable: c.enumerable });
    return { getValue: function() {
      return d;
    }, setValue: function(a2) {
      d = "" + a2;
    }, stopTracking: function() {
      a._valueTracker = null;
      delete a[b];
    } };
  }
}
function Va(a) {
  a._valueTracker || (a._valueTracker = Ua(a));
}
function Wa(a) {
  if (!a) return false;
  var b = a._valueTracker;
  if (!b) return true;
  var c = b.getValue();
  var d = "";
  a && (d = Ta(a) ? a.checked ? "true" : "false" : a.value);
  a = d;
  return a !== c ? (b.setValue(a), true) : false;
}
function Xa(a) {
  a = a || ("undefined" !== typeof document ? document : void 0);
  if ("undefined" === typeof a) return null;
  try {
    return a.activeElement || a.body;
  } catch (b) {
    return a.body;
  }
}
function Ya(a, b) {
  var c = b.checked;
  return A({}, b, { defaultChecked: void 0, defaultValue: void 0, value: void 0, checked: null != c ? c : a._wrapperState.initialChecked });
}
function Za(a, b) {
  var c = null == b.defaultValue ? "" : b.defaultValue, d = null != b.checked ? b.checked : b.defaultChecked;
  c = Sa(null != b.value ? b.value : c);
  a._wrapperState = { initialChecked: d, initialValue: c, controlled: "checkbox" === b.type || "radio" === b.type ? null != b.checked : null != b.value };
}
function ab(a, b) {
  b = b.checked;
  null != b && ta(a, "checked", b, false);
}
function bb(a, b) {
  ab(a, b);
  var c = Sa(b.value), d = b.type;
  if (null != c) if ("number" === d) {
    if (0 === c && "" === a.value || a.value != c) a.value = "" + c;
  } else a.value !== "" + c && (a.value = "" + c);
  else if ("submit" === d || "reset" === d) {
    a.removeAttribute("value");
    return;
  }
  b.hasOwnProperty("value") ? cb(a, b.type, c) : b.hasOwnProperty("defaultValue") && cb(a, b.type, Sa(b.defaultValue));
  null == b.checked && null != b.defaultChecked && (a.defaultChecked = !!b.defaultChecked);
}
function db(a, b, c) {
  if (b.hasOwnProperty("value") || b.hasOwnProperty("defaultValue")) {
    var d = b.type;
    if (!("submit" !== d && "reset" !== d || void 0 !== b.value && null !== b.value)) return;
    b = "" + a._wrapperState.initialValue;
    c || b === a.value || (a.value = b);
    a.defaultValue = b;
  }
  c = a.name;
  "" !== c && (a.name = "");
  a.defaultChecked = !!a._wrapperState.initialChecked;
  "" !== c && (a.name = c);
}
function cb(a, b, c) {
  if ("number" !== b || Xa(a.ownerDocument) !== a) null == c ? a.defaultValue = "" + a._wrapperState.initialValue : a.defaultValue !== "" + c && (a.defaultValue = "" + c);
}
var eb = Array.isArray;
function fb(a, b, c, d) {
  a = a.options;
  if (b) {
    b = {};
    for (var e = 0; e < c.length; e++) b["$" + c[e]] = true;
    for (c = 0; c < a.length; c++) e = b.hasOwnProperty("$" + a[c].value), a[c].selected !== e && (a[c].selected = e), e && d && (a[c].defaultSelected = true);
  } else {
    c = "" + Sa(c);
    b = null;
    for (e = 0; e < a.length; e++) {
      if (a[e].value === c) {
        a[e].selected = true;
        d && (a[e].defaultSelected = true);
        return;
      }
      null !== b || a[e].disabled || (b = a[e]);
    }
    null !== b && (b.selected = true);
  }
}
function gb(a, b) {
  if (null != b.dangerouslySetInnerHTML) throw Error(p(91));
  return A({}, b, { value: void 0, defaultValue: void 0, children: "" + a._wrapperState.initialValue });
}
function hb(a, b) {
  var c = b.value;
  if (null == c) {
    c = b.children;
    b = b.defaultValue;
    if (null != c) {
      if (null != b) throw Error(p(92));
      if (eb(c)) {
        if (1 < c.length) throw Error(p(93));
        c = c[0];
      }
      b = c;
    }
    null == b && (b = "");
    c = b;
  }
  a._wrapperState = { initialValue: Sa(c) };
}
function ib(a, b) {
  var c = Sa(b.value), d = Sa(b.defaultValue);
  null != c && (c = "" + c, c !== a.value && (a.value = c), null == b.defaultValue && a.defaultValue !== c && (a.defaultValue = c));
  null != d && (a.defaultValue = "" + d);
}
function jb(a) {
  var b = a.textContent;
  b === a._wrapperState.initialValue && "" !== b && null !== b && (a.value = b);
}
function kb(a) {
  switch (a) {
    case "svg":
      return "http://www.w3.org/2000/svg";
    case "math":
      return "http://www.w3.org/1998/Math/MathML";
    default:
      return "http://www.w3.org/1999/xhtml";
  }
}
function lb(a, b) {
  return null == a || "http://www.w3.org/1999/xhtml" === a ? kb(b) : "http://www.w3.org/2000/svg" === a && "foreignObject" === b ? "http://www.w3.org/1999/xhtml" : a;
}
var mb, nb = function(a) {
  return "undefined" !== typeof MSApp && MSApp.execUnsafeLocalFunction ? function(b, c, d, e) {
    MSApp.execUnsafeLocalFunction(function() {
      return a(b, c, d, e);
    });
  } : a;
}(function(a, b) {
  if ("http://www.w3.org/2000/svg" !== a.namespaceURI || "innerHTML" in a) a.innerHTML = b;
  else {
    mb = mb || document.createElement("div");
    mb.innerHTML = "<svg>" + b.valueOf().toString() + "</svg>";
    for (b = mb.firstChild; a.firstChild; ) a.removeChild(a.firstChild);
    for (; b.firstChild; ) a.appendChild(b.firstChild);
  }
});
function ob(a, b) {
  if (b) {
    var c = a.firstChild;
    if (c && c === a.lastChild && 3 === c.nodeType) {
      c.nodeValue = b;
      return;
    }
  }
  a.textContent = b;
}
var pb = {
  animationIterationCount: true,
  aspectRatio: true,
  borderImageOutset: true,
  borderImageSlice: true,
  borderImageWidth: true,
  boxFlex: true,
  boxFlexGroup: true,
  boxOrdinalGroup: true,
  columnCount: true,
  columns: true,
  flex: true,
  flexGrow: true,
  flexPositive: true,
  flexShrink: true,
  flexNegative: true,
  flexOrder: true,
  gridArea: true,
  gridRow: true,
  gridRowEnd: true,
  gridRowSpan: true,
  gridRowStart: true,
  gridColumn: true,
  gridColumnEnd: true,
  gridColumnSpan: true,
  gridColumnStart: true,
  fontWeight: true,
  lineClamp: true,
  lineHeight: true,
  opacity: true,
  order: true,
  orphans: true,
  tabSize: true,
  widows: true,
  zIndex: true,
  zoom: true,
  fillOpacity: true,
  floodOpacity: true,
  stopOpacity: true,
  strokeDasharray: true,
  strokeDashoffset: true,
  strokeMiterlimit: true,
  strokeOpacity: true,
  strokeWidth: true
}, qb = ["Webkit", "ms", "Moz", "O"];
Object.keys(pb).forEach(function(a) {
  qb.forEach(function(b) {
    b = b + a.charAt(0).toUpperCase() + a.substring(1);
    pb[b] = pb[a];
  });
});
function rb(a, b, c) {
  return null == b || "boolean" === typeof b || "" === b ? "" : c || "number" !== typeof b || 0 === b || pb.hasOwnProperty(a) && pb[a] ? ("" + b).trim() : b + "px";
}
function sb(a, b) {
  a = a.style;
  for (var c in b) if (b.hasOwnProperty(c)) {
    var d = 0 === c.indexOf("--"), e = rb(c, b[c], d);
    "float" === c && (c = "cssFloat");
    d ? a.setProperty(c, e) : a[c] = e;
  }
}
var tb = A({ menuitem: true }, { area: true, base: true, br: true, col: true, embed: true, hr: true, img: true, input: true, keygen: true, link: true, meta: true, param: true, source: true, track: true, wbr: true });
function ub(a, b) {
  if (b) {
    if (tb[a] && (null != b.children || null != b.dangerouslySetInnerHTML)) throw Error(p(137, a));
    if (null != b.dangerouslySetInnerHTML) {
      if (null != b.children) throw Error(p(60));
      if ("object" !== typeof b.dangerouslySetInnerHTML || !("__html" in b.dangerouslySetInnerHTML)) throw Error(p(61));
    }
    if (null != b.style && "object" !== typeof b.style) throw Error(p(62));
  }
}
function vb(a, b) {
  if (-1 === a.indexOf("-")) return "string" === typeof b.is;
  switch (a) {
    case "annotation-xml":
    case "color-profile":
    case "font-face":
    case "font-face-src":
    case "font-face-uri":
    case "font-face-format":
    case "font-face-name":
    case "missing-glyph":
      return false;
    default:
      return true;
  }
}
var wb = null;
function xb(a) {
  a = a.target || a.srcElement || window;
  a.correspondingUseElement && (a = a.correspondingUseElement);
  return 3 === a.nodeType ? a.parentNode : a;
}
var yb = null, zb = null, Ab = null;
function Bb(a) {
  if (a = Cb(a)) {
    if ("function" !== typeof yb) throw Error(p(280));
    var b = a.stateNode;
    b && (b = Db(b), yb(a.stateNode, a.type, b));
  }
}
function Eb(a) {
  zb ? Ab ? Ab.push(a) : Ab = [a] : zb = a;
}
function Fb() {
  if (zb) {
    var a = zb, b = Ab;
    Ab = zb = null;
    Bb(a);
    if (b) for (a = 0; a < b.length; a++) Bb(b[a]);
  }
}
function Gb(a, b) {
  return a(b);
}
function Hb() {
}
var Ib = false;
function Jb(a, b, c) {
  if (Ib) return a(b, c);
  Ib = true;
  try {
    return Gb(a, b, c);
  } finally {
    if (Ib = false, null !== zb || null !== Ab) Hb(), Fb();
  }
}
function Kb(a, b) {
  var c = a.stateNode;
  if (null === c) return null;
  var d = Db(c);
  if (null === d) return null;
  c = d[b];
  a: switch (b) {
    case "onClick":
    case "onClickCapture":
    case "onDoubleClick":
    case "onDoubleClickCapture":
    case "onMouseDown":
    case "onMouseDownCapture":
    case "onMouseMove":
    case "onMouseMoveCapture":
    case "onMouseUp":
    case "onMouseUpCapture":
    case "onMouseEnter":
      (d = !d.disabled) || (a = a.type, d = !("button" === a || "input" === a || "select" === a || "textarea" === a));
      a = !d;
      break a;
    default:
      a = false;
  }
  if (a) return null;
  if (c && "function" !== typeof c) throw Error(p(231, b, typeof c));
  return c;
}
var Lb = false;
if (ia) try {
  var Mb = {};
  Object.defineProperty(Mb, "passive", { get: function() {
    Lb = true;
  } });
  window.addEventListener("test", Mb, Mb);
  window.removeEventListener("test", Mb, Mb);
} catch (a) {
  Lb = false;
}
function Nb(a, b, c, d, e, f2, g, h, k2) {
  var l2 = Array.prototype.slice.call(arguments, 3);
  try {
    b.apply(c, l2);
  } catch (m2) {
    this.onError(m2);
  }
}
var Ob = false, Pb = null, Qb = false, Rb = null, Sb = { onError: function(a) {
  Ob = true;
  Pb = a;
} };
function Tb(a, b, c, d, e, f2, g, h, k2) {
  Ob = false;
  Pb = null;
  Nb.apply(Sb, arguments);
}
function Ub(a, b, c, d, e, f2, g, h, k2) {
  Tb.apply(this, arguments);
  if (Ob) {
    if (Ob) {
      var l2 = Pb;
      Ob = false;
      Pb = null;
    } else throw Error(p(198));
    Qb || (Qb = true, Rb = l2);
  }
}
function Vb(a) {
  var b = a, c = a;
  if (a.alternate) for (; b.return; ) b = b.return;
  else {
    a = b;
    do
      b = a, 0 !== (b.flags & 4098) && (c = b.return), a = b.return;
    while (a);
  }
  return 3 === b.tag ? c : null;
}
function Wb(a) {
  if (13 === a.tag) {
    var b = a.memoizedState;
    null === b && (a = a.alternate, null !== a && (b = a.memoizedState));
    if (null !== b) return b.dehydrated;
  }
  return null;
}
function Xb(a) {
  if (Vb(a) !== a) throw Error(p(188));
}
function Yb(a) {
  var b = a.alternate;
  if (!b) {
    b = Vb(a);
    if (null === b) throw Error(p(188));
    return b !== a ? null : a;
  }
  for (var c = a, d = b; ; ) {
    var e = c.return;
    if (null === e) break;
    var f2 = e.alternate;
    if (null === f2) {
      d = e.return;
      if (null !== d) {
        c = d;
        continue;
      }
      break;
    }
    if (e.child === f2.child) {
      for (f2 = e.child; f2; ) {
        if (f2 === c) return Xb(e), a;
        if (f2 === d) return Xb(e), b;
        f2 = f2.sibling;
      }
      throw Error(p(188));
    }
    if (c.return !== d.return) c = e, d = f2;
    else {
      for (var g = false, h = e.child; h; ) {
        if (h === c) {
          g = true;
          c = e;
          d = f2;
          break;
        }
        if (h === d) {
          g = true;
          d = e;
          c = f2;
          break;
        }
        h = h.sibling;
      }
      if (!g) {
        for (h = f2.child; h; ) {
          if (h === c) {
            g = true;
            c = f2;
            d = e;
            break;
          }
          if (h === d) {
            g = true;
            d = f2;
            c = e;
            break;
          }
          h = h.sibling;
        }
        if (!g) throw Error(p(189));
      }
    }
    if (c.alternate !== d) throw Error(p(190));
  }
  if (3 !== c.tag) throw Error(p(188));
  return c.stateNode.current === c ? a : b;
}
function Zb(a) {
  a = Yb(a);
  return null !== a ? $b(a) : null;
}
function $b(a) {
  if (5 === a.tag || 6 === a.tag) return a;
  for (a = a.child; null !== a; ) {
    var b = $b(a);
    if (null !== b) return b;
    a = a.sibling;
  }
  return null;
}
var ac = ca.unstable_scheduleCallback, bc = ca.unstable_cancelCallback, cc = ca.unstable_shouldYield, dc = ca.unstable_requestPaint, B = ca.unstable_now, ec = ca.unstable_getCurrentPriorityLevel, fc = ca.unstable_ImmediatePriority, gc = ca.unstable_UserBlockingPriority, hc = ca.unstable_NormalPriority, ic = ca.unstable_LowPriority, jc = ca.unstable_IdlePriority, kc = null, lc = null;
function mc(a) {
  if (lc && "function" === typeof lc.onCommitFiberRoot) try {
    lc.onCommitFiberRoot(kc, a, void 0, 128 === (a.current.flags & 128));
  } catch (b) {
  }
}
var oc = Math.clz32 ? Math.clz32 : nc, pc = Math.log, qc = Math.LN2;
function nc(a) {
  a >>>= 0;
  return 0 === a ? 32 : 31 - (pc(a) / qc | 0) | 0;
}
var rc = 64, sc = 4194304;
function tc(a) {
  switch (a & -a) {
    case 1:
      return 1;
    case 2:
      return 2;
    case 4:
      return 4;
    case 8:
      return 8;
    case 16:
      return 16;
    case 32:
      return 32;
    case 64:
    case 128:
    case 256:
    case 512:
    case 1024:
    case 2048:
    case 4096:
    case 8192:
    case 16384:
    case 32768:
    case 65536:
    case 131072:
    case 262144:
    case 524288:
    case 1048576:
    case 2097152:
      return a & 4194240;
    case 4194304:
    case 8388608:
    case 16777216:
    case 33554432:
    case 67108864:
      return a & 130023424;
    case 134217728:
      return 134217728;
    case 268435456:
      return 268435456;
    case 536870912:
      return 536870912;
    case 1073741824:
      return 1073741824;
    default:
      return a;
  }
}
function uc(a, b) {
  var c = a.pendingLanes;
  if (0 === c) return 0;
  var d = 0, e = a.suspendedLanes, f2 = a.pingedLanes, g = c & 268435455;
  if (0 !== g) {
    var h = g & ~e;
    0 !== h ? d = tc(h) : (f2 &= g, 0 !== f2 && (d = tc(f2)));
  } else g = c & ~e, 0 !== g ? d = tc(g) : 0 !== f2 && (d = tc(f2));
  if (0 === d) return 0;
  if (0 !== b && b !== d && 0 === (b & e) && (e = d & -d, f2 = b & -b, e >= f2 || 16 === e && 0 !== (f2 & 4194240))) return b;
  0 !== (d & 4) && (d |= c & 16);
  b = a.entangledLanes;
  if (0 !== b) for (a = a.entanglements, b &= d; 0 < b; ) c = 31 - oc(b), e = 1 << c, d |= a[c], b &= ~e;
  return d;
}
function vc(a, b) {
  switch (a) {
    case 1:
    case 2:
    case 4:
      return b + 250;
    case 8:
    case 16:
    case 32:
    case 64:
    case 128:
    case 256:
    case 512:
    case 1024:
    case 2048:
    case 4096:
    case 8192:
    case 16384:
    case 32768:
    case 65536:
    case 131072:
    case 262144:
    case 524288:
    case 1048576:
    case 2097152:
      return b + 5e3;
    case 4194304:
    case 8388608:
    case 16777216:
    case 33554432:
    case 67108864:
      return -1;
    case 134217728:
    case 268435456:
    case 536870912:
    case 1073741824:
      return -1;
    default:
      return -1;
  }
}
function wc(a, b) {
  for (var c = a.suspendedLanes, d = a.pingedLanes, e = a.expirationTimes, f2 = a.pendingLanes; 0 < f2; ) {
    var g = 31 - oc(f2), h = 1 << g, k2 = e[g];
    if (-1 === k2) {
      if (0 === (h & c) || 0 !== (h & d)) e[g] = vc(h, b);
    } else k2 <= b && (a.expiredLanes |= h);
    f2 &= ~h;
  }
}
function xc(a) {
  a = a.pendingLanes & -1073741825;
  return 0 !== a ? a : a & 1073741824 ? 1073741824 : 0;
}
function yc() {
  var a = rc;
  rc <<= 1;
  0 === (rc & 4194240) && (rc = 64);
  return a;
}
function zc(a) {
  for (var b = [], c = 0; 31 > c; c++) b.push(a);
  return b;
}
function Ac(a, b, c) {
  a.pendingLanes |= b;
  536870912 !== b && (a.suspendedLanes = 0, a.pingedLanes = 0);
  a = a.eventTimes;
  b = 31 - oc(b);
  a[b] = c;
}
function Bc(a, b) {
  var c = a.pendingLanes & ~b;
  a.pendingLanes = b;
  a.suspendedLanes = 0;
  a.pingedLanes = 0;
  a.expiredLanes &= b;
  a.mutableReadLanes &= b;
  a.entangledLanes &= b;
  b = a.entanglements;
  var d = a.eventTimes;
  for (a = a.expirationTimes; 0 < c; ) {
    var e = 31 - oc(c), f2 = 1 << e;
    b[e] = 0;
    d[e] = -1;
    a[e] = -1;
    c &= ~f2;
  }
}
function Cc(a, b) {
  var c = a.entangledLanes |= b;
  for (a = a.entanglements; c; ) {
    var d = 31 - oc(c), e = 1 << d;
    e & b | a[d] & b && (a[d] |= b);
    c &= ~e;
  }
}
var C = 0;
function Dc(a) {
  a &= -a;
  return 1 < a ? 4 < a ? 0 !== (a & 268435455) ? 16 : 536870912 : 4 : 1;
}
var Ec, Fc, Gc, Hc, Ic, Jc = false, Kc = [], Lc = null, Mc = null, Nc = null, Oc = /* @__PURE__ */ new Map(), Pc = /* @__PURE__ */ new Map(), Qc = [], Rc = "mousedown mouseup touchcancel touchend touchstart auxclick dblclick pointercancel pointerdown pointerup dragend dragstart drop compositionend compositionstart keydown keypress keyup input textInput copy cut paste click change contextmenu reset submit".split(" ");
function Sc(a, b) {
  switch (a) {
    case "focusin":
    case "focusout":
      Lc = null;
      break;
    case "dragenter":
    case "dragleave":
      Mc = null;
      break;
    case "mouseover":
    case "mouseout":
      Nc = null;
      break;
    case "pointerover":
    case "pointerout":
      Oc.delete(b.pointerId);
      break;
    case "gotpointercapture":
    case "lostpointercapture":
      Pc.delete(b.pointerId);
  }
}
function Tc(a, b, c, d, e, f2) {
  if (null === a || a.nativeEvent !== f2) return a = { blockedOn: b, domEventName: c, eventSystemFlags: d, nativeEvent: f2, targetContainers: [e] }, null !== b && (b = Cb(b), null !== b && Fc(b)), a;
  a.eventSystemFlags |= d;
  b = a.targetContainers;
  null !== e && -1 === b.indexOf(e) && b.push(e);
  return a;
}
function Uc(a, b, c, d, e) {
  switch (b) {
    case "focusin":
      return Lc = Tc(Lc, a, b, c, d, e), true;
    case "dragenter":
      return Mc = Tc(Mc, a, b, c, d, e), true;
    case "mouseover":
      return Nc = Tc(Nc, a, b, c, d, e), true;
    case "pointerover":
      var f2 = e.pointerId;
      Oc.set(f2, Tc(Oc.get(f2) || null, a, b, c, d, e));
      return true;
    case "gotpointercapture":
      return f2 = e.pointerId, Pc.set(f2, Tc(Pc.get(f2) || null, a, b, c, d, e)), true;
  }
  return false;
}
function Vc(a) {
  var b = Wc(a.target);
  if (null !== b) {
    var c = Vb(b);
    if (null !== c) {
      if (b = c.tag, 13 === b) {
        if (b = Wb(c), null !== b) {
          a.blockedOn = b;
          Ic(a.priority, function() {
            Gc(c);
          });
          return;
        }
      } else if (3 === b && c.stateNode.current.memoizedState.isDehydrated) {
        a.blockedOn = 3 === c.tag ? c.stateNode.containerInfo : null;
        return;
      }
    }
  }
  a.blockedOn = null;
}
function Xc(a) {
  if (null !== a.blockedOn) return false;
  for (var b = a.targetContainers; 0 < b.length; ) {
    var c = Yc(a.domEventName, a.eventSystemFlags, b[0], a.nativeEvent);
    if (null === c) {
      c = a.nativeEvent;
      var d = new c.constructor(c.type, c);
      wb = d;
      c.target.dispatchEvent(d);
      wb = null;
    } else return b = Cb(c), null !== b && Fc(b), a.blockedOn = c, false;
    b.shift();
  }
  return true;
}
function Zc(a, b, c) {
  Xc(a) && c.delete(b);
}
function $c() {
  Jc = false;
  null !== Lc && Xc(Lc) && (Lc = null);
  null !== Mc && Xc(Mc) && (Mc = null);
  null !== Nc && Xc(Nc) && (Nc = null);
  Oc.forEach(Zc);
  Pc.forEach(Zc);
}
function ad(a, b) {
  a.blockedOn === b && (a.blockedOn = null, Jc || (Jc = true, ca.unstable_scheduleCallback(ca.unstable_NormalPriority, $c)));
}
function bd(a) {
  function b(b2) {
    return ad(b2, a);
  }
  if (0 < Kc.length) {
    ad(Kc[0], a);
    for (var c = 1; c < Kc.length; c++) {
      var d = Kc[c];
      d.blockedOn === a && (d.blockedOn = null);
    }
  }
  null !== Lc && ad(Lc, a);
  null !== Mc && ad(Mc, a);
  null !== Nc && ad(Nc, a);
  Oc.forEach(b);
  Pc.forEach(b);
  for (c = 0; c < Qc.length; c++) d = Qc[c], d.blockedOn === a && (d.blockedOn = null);
  for (; 0 < Qc.length && (c = Qc[0], null === c.blockedOn); ) Vc(c), null === c.blockedOn && Qc.shift();
}
var cd = ua.ReactCurrentBatchConfig, dd = true;
function ed(a, b, c, d) {
  var e = C, f2 = cd.transition;
  cd.transition = null;
  try {
    C = 1, fd(a, b, c, d);
  } finally {
    C = e, cd.transition = f2;
  }
}
function gd(a, b, c, d) {
  var e = C, f2 = cd.transition;
  cd.transition = null;
  try {
    C = 4, fd(a, b, c, d);
  } finally {
    C = e, cd.transition = f2;
  }
}
function fd(a, b, c, d) {
  if (dd) {
    var e = Yc(a, b, c, d);
    if (null === e) hd(a, b, d, id, c), Sc(a, d);
    else if (Uc(e, a, b, c, d)) d.stopPropagation();
    else if (Sc(a, d), b & 4 && -1 < Rc.indexOf(a)) {
      for (; null !== e; ) {
        var f2 = Cb(e);
        null !== f2 && Ec(f2);
        f2 = Yc(a, b, c, d);
        null === f2 && hd(a, b, d, id, c);
        if (f2 === e) break;
        e = f2;
      }
      null !== e && d.stopPropagation();
    } else hd(a, b, d, null, c);
  }
}
var id = null;
function Yc(a, b, c, d) {
  id = null;
  a = xb(d);
  a = Wc(a);
  if (null !== a) if (b = Vb(a), null === b) a = null;
  else if (c = b.tag, 13 === c) {
    a = Wb(b);
    if (null !== a) return a;
    a = null;
  } else if (3 === c) {
    if (b.stateNode.current.memoizedState.isDehydrated) return 3 === b.tag ? b.stateNode.containerInfo : null;
    a = null;
  } else b !== a && (a = null);
  id = a;
  return null;
}
function jd(a) {
  switch (a) {
    case "cancel":
    case "click":
    case "close":
    case "contextmenu":
    case "copy":
    case "cut":
    case "auxclick":
    case "dblclick":
    case "dragend":
    case "dragstart":
    case "drop":
    case "focusin":
    case "focusout":
    case "input":
    case "invalid":
    case "keydown":
    case "keypress":
    case "keyup":
    case "mousedown":
    case "mouseup":
    case "paste":
    case "pause":
    case "play":
    case "pointercancel":
    case "pointerdown":
    case "pointerup":
    case "ratechange":
    case "reset":
    case "resize":
    case "seeked":
    case "submit":
    case "touchcancel":
    case "touchend":
    case "touchstart":
    case "volumechange":
    case "change":
    case "selectionchange":
    case "textInput":
    case "compositionstart":
    case "compositionend":
    case "compositionupdate":
    case "beforeblur":
    case "afterblur":
    case "beforeinput":
    case "blur":
    case "fullscreenchange":
    case "focus":
    case "hashchange":
    case "popstate":
    case "select":
    case "selectstart":
      return 1;
    case "drag":
    case "dragenter":
    case "dragexit":
    case "dragleave":
    case "dragover":
    case "mousemove":
    case "mouseout":
    case "mouseover":
    case "pointermove":
    case "pointerout":
    case "pointerover":
    case "scroll":
    case "toggle":
    case "touchmove":
    case "wheel":
    case "mouseenter":
    case "mouseleave":
    case "pointerenter":
    case "pointerleave":
      return 4;
    case "message":
      switch (ec()) {
        case fc:
          return 1;
        case gc:
          return 4;
        case hc:
        case ic:
          return 16;
        case jc:
          return 536870912;
        default:
          return 16;
      }
    default:
      return 16;
  }
}
var kd = null, ld = null, md = null;
function nd() {
  if (md) return md;
  var a, b = ld, c = b.length, d, e = "value" in kd ? kd.value : kd.textContent, f2 = e.length;
  for (a = 0; a < c && b[a] === e[a]; a++) ;
  var g = c - a;
  for (d = 1; d <= g && b[c - d] === e[f2 - d]; d++) ;
  return md = e.slice(a, 1 < d ? 1 - d : void 0);
}
function od(a) {
  var b = a.keyCode;
  "charCode" in a ? (a = a.charCode, 0 === a && 13 === b && (a = 13)) : a = b;
  10 === a && (a = 13);
  return 32 <= a || 13 === a ? a : 0;
}
function pd() {
  return true;
}
function qd() {
  return false;
}
function rd(a) {
  function b(b2, d, e, f2, g) {
    this._reactName = b2;
    this._targetInst = e;
    this.type = d;
    this.nativeEvent = f2;
    this.target = g;
    this.currentTarget = null;
    for (var c in a) a.hasOwnProperty(c) && (b2 = a[c], this[c] = b2 ? b2(f2) : f2[c]);
    this.isDefaultPrevented = (null != f2.defaultPrevented ? f2.defaultPrevented : false === f2.returnValue) ? pd : qd;
    this.isPropagationStopped = qd;
    return this;
  }
  A(b.prototype, { preventDefault: function() {
    this.defaultPrevented = true;
    var a2 = this.nativeEvent;
    a2 && (a2.preventDefault ? a2.preventDefault() : "unknown" !== typeof a2.returnValue && (a2.returnValue = false), this.isDefaultPrevented = pd);
  }, stopPropagation: function() {
    var a2 = this.nativeEvent;
    a2 && (a2.stopPropagation ? a2.stopPropagation() : "unknown" !== typeof a2.cancelBubble && (a2.cancelBubble = true), this.isPropagationStopped = pd);
  }, persist: function() {
  }, isPersistent: pd });
  return b;
}
var sd = { eventPhase: 0, bubbles: 0, cancelable: 0, timeStamp: function(a) {
  return a.timeStamp || Date.now();
}, defaultPrevented: 0, isTrusted: 0 }, td = rd(sd), ud = A({}, sd, { view: 0, detail: 0 }), vd = rd(ud), wd, xd, yd, Ad = A({}, ud, { screenX: 0, screenY: 0, clientX: 0, clientY: 0, pageX: 0, pageY: 0, ctrlKey: 0, shiftKey: 0, altKey: 0, metaKey: 0, getModifierState: zd, button: 0, buttons: 0, relatedTarget: function(a) {
  return void 0 === a.relatedTarget ? a.fromElement === a.srcElement ? a.toElement : a.fromElement : a.relatedTarget;
}, movementX: function(a) {
  if ("movementX" in a) return a.movementX;
  a !== yd && (yd && "mousemove" === a.type ? (wd = a.screenX - yd.screenX, xd = a.screenY - yd.screenY) : xd = wd = 0, yd = a);
  return wd;
}, movementY: function(a) {
  return "movementY" in a ? a.movementY : xd;
} }), Bd = rd(Ad), Cd = A({}, Ad, { dataTransfer: 0 }), Dd = rd(Cd), Ed = A({}, ud, { relatedTarget: 0 }), Fd = rd(Ed), Gd = A({}, sd, { animationName: 0, elapsedTime: 0, pseudoElement: 0 }), Hd = rd(Gd), Id = A({}, sd, { clipboardData: function(a) {
  return "clipboardData" in a ? a.clipboardData : window.clipboardData;
} }), Jd = rd(Id), Kd = A({}, sd, { data: 0 }), Ld = rd(Kd), Md = {
  Esc: "Escape",
  Spacebar: " ",
  Left: "ArrowLeft",
  Up: "ArrowUp",
  Right: "ArrowRight",
  Down: "ArrowDown",
  Del: "Delete",
  Win: "OS",
  Menu: "ContextMenu",
  Apps: "ContextMenu",
  Scroll: "ScrollLock",
  MozPrintableKey: "Unidentified"
}, Nd = {
  8: "Backspace",
  9: "Tab",
  12: "Clear",
  13: "Enter",
  16: "Shift",
  17: "Control",
  18: "Alt",
  19: "Pause",
  20: "CapsLock",
  27: "Escape",
  32: " ",
  33: "PageUp",
  34: "PageDown",
  35: "End",
  36: "Home",
  37: "ArrowLeft",
  38: "ArrowUp",
  39: "ArrowRight",
  40: "ArrowDown",
  45: "Insert",
  46: "Delete",
  112: "F1",
  113: "F2",
  114: "F3",
  115: "F4",
  116: "F5",
  117: "F6",
  118: "F7",
  119: "F8",
  120: "F9",
  121: "F10",
  122: "F11",
  123: "F12",
  144: "NumLock",
  145: "ScrollLock",
  224: "Meta"
}, Od = { Alt: "altKey", Control: "ctrlKey", Meta: "metaKey", Shift: "shiftKey" };
function Pd(a) {
  var b = this.nativeEvent;
  return b.getModifierState ? b.getModifierState(a) : (a = Od[a]) ? !!b[a] : false;
}
function zd() {
  return Pd;
}
var Qd = A({}, ud, { key: function(a) {
  if (a.key) {
    var b = Md[a.key] || a.key;
    if ("Unidentified" !== b) return b;
  }
  return "keypress" === a.type ? (a = od(a), 13 === a ? "Enter" : String.fromCharCode(a)) : "keydown" === a.type || "keyup" === a.type ? Nd[a.keyCode] || "Unidentified" : "";
}, code: 0, location: 0, ctrlKey: 0, shiftKey: 0, altKey: 0, metaKey: 0, repeat: 0, locale: 0, getModifierState: zd, charCode: function(a) {
  return "keypress" === a.type ? od(a) : 0;
}, keyCode: function(a) {
  return "keydown" === a.type || "keyup" === a.type ? a.keyCode : 0;
}, which: function(a) {
  return "keypress" === a.type ? od(a) : "keydown" === a.type || "keyup" === a.type ? a.keyCode : 0;
} }), Rd = rd(Qd), Sd = A({}, Ad, { pointerId: 0, width: 0, height: 0, pressure: 0, tangentialPressure: 0, tiltX: 0, tiltY: 0, twist: 0, pointerType: 0, isPrimary: 0 }), Td = rd(Sd), Ud = A({}, ud, { touches: 0, targetTouches: 0, changedTouches: 0, altKey: 0, metaKey: 0, ctrlKey: 0, shiftKey: 0, getModifierState: zd }), Vd = rd(Ud), Wd = A({}, sd, { propertyName: 0, elapsedTime: 0, pseudoElement: 0 }), Xd = rd(Wd), Yd = A({}, Ad, {
  deltaX: function(a) {
    return "deltaX" in a ? a.deltaX : "wheelDeltaX" in a ? -a.wheelDeltaX : 0;
  },
  deltaY: function(a) {
    return "deltaY" in a ? a.deltaY : "wheelDeltaY" in a ? -a.wheelDeltaY : "wheelDelta" in a ? -a.wheelDelta : 0;
  },
  deltaZ: 0,
  deltaMode: 0
}), Zd = rd(Yd), $d = [9, 13, 27, 32], ae = ia && "CompositionEvent" in window, be = null;
ia && "documentMode" in document && (be = document.documentMode);
var ce = ia && "TextEvent" in window && !be, de = ia && (!ae || be && 8 < be && 11 >= be), ee = String.fromCharCode(32), fe = false;
function ge(a, b) {
  switch (a) {
    case "keyup":
      return -1 !== $d.indexOf(b.keyCode);
    case "keydown":
      return 229 !== b.keyCode;
    case "keypress":
    case "mousedown":
    case "focusout":
      return true;
    default:
      return false;
  }
}
function he(a) {
  a = a.detail;
  return "object" === typeof a && "data" in a ? a.data : null;
}
var ie = false;
function je(a, b) {
  switch (a) {
    case "compositionend":
      return he(b);
    case "keypress":
      if (32 !== b.which) return null;
      fe = true;
      return ee;
    case "textInput":
      return a = b.data, a === ee && fe ? null : a;
    default:
      return null;
  }
}
function ke(a, b) {
  if (ie) return "compositionend" === a || !ae && ge(a, b) ? (a = nd(), md = ld = kd = null, ie = false, a) : null;
  switch (a) {
    case "paste":
      return null;
    case "keypress":
      if (!(b.ctrlKey || b.altKey || b.metaKey) || b.ctrlKey && b.altKey) {
        if (b.char && 1 < b.char.length) return b.char;
        if (b.which) return String.fromCharCode(b.which);
      }
      return null;
    case "compositionend":
      return de && "ko" !== b.locale ? null : b.data;
    default:
      return null;
  }
}
var le = { color: true, date: true, datetime: true, "datetime-local": true, email: true, month: true, number: true, password: true, range: true, search: true, tel: true, text: true, time: true, url: true, week: true };
function me(a) {
  var b = a && a.nodeName && a.nodeName.toLowerCase();
  return "input" === b ? !!le[a.type] : "textarea" === b ? true : false;
}
function ne(a, b, c, d) {
  Eb(d);
  b = oe(b, "onChange");
  0 < b.length && (c = new td("onChange", "change", null, c, d), a.push({ event: c, listeners: b }));
}
var pe = null, qe = null;
function re(a) {
  se(a, 0);
}
function te(a) {
  var b = ue(a);
  if (Wa(b)) return a;
}
function ve(a, b) {
  if ("change" === a) return b;
}
var we = false;
if (ia) {
  var xe;
  if (ia) {
    var ye = "oninput" in document;
    if (!ye) {
      var ze = document.createElement("div");
      ze.setAttribute("oninput", "return;");
      ye = "function" === typeof ze.oninput;
    }
    xe = ye;
  } else xe = false;
  we = xe && (!document.documentMode || 9 < document.documentMode);
}
function Ae() {
  pe && (pe.detachEvent("onpropertychange", Be), qe = pe = null);
}
function Be(a) {
  if ("value" === a.propertyName && te(qe)) {
    var b = [];
    ne(b, qe, a, xb(a));
    Jb(re, b);
  }
}
function Ce(a, b, c) {
  "focusin" === a ? (Ae(), pe = b, qe = c, pe.attachEvent("onpropertychange", Be)) : "focusout" === a && Ae();
}
function De(a) {
  if ("selectionchange" === a || "keyup" === a || "keydown" === a) return te(qe);
}
function Ee(a, b) {
  if ("click" === a) return te(b);
}
function Fe(a, b) {
  if ("input" === a || "change" === a) return te(b);
}
function Ge(a, b) {
  return a === b && (0 !== a || 1 / a === 1 / b) || a !== a && b !== b;
}
var He = "function" === typeof Object.is ? Object.is : Ge;
function Ie(a, b) {
  if (He(a, b)) return true;
  if ("object" !== typeof a || null === a || "object" !== typeof b || null === b) return false;
  var c = Object.keys(a), d = Object.keys(b);
  if (c.length !== d.length) return false;
  for (d = 0; d < c.length; d++) {
    var e = c[d];
    if (!ja.call(b, e) || !He(a[e], b[e])) return false;
  }
  return true;
}
function Je(a) {
  for (; a && a.firstChild; ) a = a.firstChild;
  return a;
}
function Ke(a, b) {
  var c = Je(a);
  a = 0;
  for (var d; c; ) {
    if (3 === c.nodeType) {
      d = a + c.textContent.length;
      if (a <= b && d >= b) return { node: c, offset: b - a };
      a = d;
    }
    a: {
      for (; c; ) {
        if (c.nextSibling) {
          c = c.nextSibling;
          break a;
        }
        c = c.parentNode;
      }
      c = void 0;
    }
    c = Je(c);
  }
}
function Le(a, b) {
  return a && b ? a === b ? true : a && 3 === a.nodeType ? false : b && 3 === b.nodeType ? Le(a, b.parentNode) : "contains" in a ? a.contains(b) : a.compareDocumentPosition ? !!(a.compareDocumentPosition(b) & 16) : false : false;
}
function Me() {
  for (var a = window, b = Xa(); b instanceof a.HTMLIFrameElement; ) {
    try {
      var c = "string" === typeof b.contentWindow.location.href;
    } catch (d) {
      c = false;
    }
    if (c) a = b.contentWindow;
    else break;
    b = Xa(a.document);
  }
  return b;
}
function Ne(a) {
  var b = a && a.nodeName && a.nodeName.toLowerCase();
  return b && ("input" === b && ("text" === a.type || "search" === a.type || "tel" === a.type || "url" === a.type || "password" === a.type) || "textarea" === b || "true" === a.contentEditable);
}
function Oe(a) {
  var b = Me(), c = a.focusedElem, d = a.selectionRange;
  if (b !== c && c && c.ownerDocument && Le(c.ownerDocument.documentElement, c)) {
    if (null !== d && Ne(c)) {
      if (b = d.start, a = d.end, void 0 === a && (a = b), "selectionStart" in c) c.selectionStart = b, c.selectionEnd = Math.min(a, c.value.length);
      else if (a = (b = c.ownerDocument || document) && b.defaultView || window, a.getSelection) {
        a = a.getSelection();
        var e = c.textContent.length, f2 = Math.min(d.start, e);
        d = void 0 === d.end ? f2 : Math.min(d.end, e);
        !a.extend && f2 > d && (e = d, d = f2, f2 = e);
        e = Ke(c, f2);
        var g = Ke(
          c,
          d
        );
        e && g && (1 !== a.rangeCount || a.anchorNode !== e.node || a.anchorOffset !== e.offset || a.focusNode !== g.node || a.focusOffset !== g.offset) && (b = b.createRange(), b.setStart(e.node, e.offset), a.removeAllRanges(), f2 > d ? (a.addRange(b), a.extend(g.node, g.offset)) : (b.setEnd(g.node, g.offset), a.addRange(b)));
      }
    }
    b = [];
    for (a = c; a = a.parentNode; ) 1 === a.nodeType && b.push({ element: a, left: a.scrollLeft, top: a.scrollTop });
    "function" === typeof c.focus && c.focus();
    for (c = 0; c < b.length; c++) a = b[c], a.element.scrollLeft = a.left, a.element.scrollTop = a.top;
  }
}
var Pe = ia && "documentMode" in document && 11 >= document.documentMode, Qe = null, Re = null, Se = null, Te = false;
function Ue(a, b, c) {
  var d = c.window === c ? c.document : 9 === c.nodeType ? c : c.ownerDocument;
  Te || null == Qe || Qe !== Xa(d) || (d = Qe, "selectionStart" in d && Ne(d) ? d = { start: d.selectionStart, end: d.selectionEnd } : (d = (d.ownerDocument && d.ownerDocument.defaultView || window).getSelection(), d = { anchorNode: d.anchorNode, anchorOffset: d.anchorOffset, focusNode: d.focusNode, focusOffset: d.focusOffset }), Se && Ie(Se, d) || (Se = d, d = oe(Re, "onSelect"), 0 < d.length && (b = new td("onSelect", "select", null, b, c), a.push({ event: b, listeners: d }), b.target = Qe)));
}
function Ve(a, b) {
  var c = {};
  c[a.toLowerCase()] = b.toLowerCase();
  c["Webkit" + a] = "webkit" + b;
  c["Moz" + a] = "moz" + b;
  return c;
}
var We = { animationend: Ve("Animation", "AnimationEnd"), animationiteration: Ve("Animation", "AnimationIteration"), animationstart: Ve("Animation", "AnimationStart"), transitionend: Ve("Transition", "TransitionEnd") }, Xe = {}, Ye = {};
ia && (Ye = document.createElement("div").style, "AnimationEvent" in window || (delete We.animationend.animation, delete We.animationiteration.animation, delete We.animationstart.animation), "TransitionEvent" in window || delete We.transitionend.transition);
function Ze(a) {
  if (Xe[a]) return Xe[a];
  if (!We[a]) return a;
  var b = We[a], c;
  for (c in b) if (b.hasOwnProperty(c) && c in Ye) return Xe[a] = b[c];
  return a;
}
var $e = Ze("animationend"), af = Ze("animationiteration"), bf = Ze("animationstart"), cf = Ze("transitionend"), df = /* @__PURE__ */ new Map(), ef = "abort auxClick cancel canPlay canPlayThrough click close contextMenu copy cut drag dragEnd dragEnter dragExit dragLeave dragOver dragStart drop durationChange emptied encrypted ended error gotPointerCapture input invalid keyDown keyPress keyUp load loadedData loadedMetadata loadStart lostPointerCapture mouseDown mouseMove mouseOut mouseOver mouseUp paste pause play playing pointerCancel pointerDown pointerMove pointerOut pointerOver pointerUp progress rateChange reset resize seeked seeking stalled submit suspend timeUpdate touchCancel touchEnd touchStart volumeChange scroll toggle touchMove waiting wheel".split(" ");
function ff(a, b) {
  df.set(a, b);
  fa(b, [a]);
}
for (var gf = 0; gf < ef.length; gf++) {
  var hf = ef[gf], jf = hf.toLowerCase(), kf = hf[0].toUpperCase() + hf.slice(1);
  ff(jf, "on" + kf);
}
ff($e, "onAnimationEnd");
ff(af, "onAnimationIteration");
ff(bf, "onAnimationStart");
ff("dblclick", "onDoubleClick");
ff("focusin", "onFocus");
ff("focusout", "onBlur");
ff(cf, "onTransitionEnd");
ha("onMouseEnter", ["mouseout", "mouseover"]);
ha("onMouseLeave", ["mouseout", "mouseover"]);
ha("onPointerEnter", ["pointerout", "pointerover"]);
ha("onPointerLeave", ["pointerout", "pointerover"]);
fa("onChange", "change click focusin focusout input keydown keyup selectionchange".split(" "));
fa("onSelect", "focusout contextmenu dragend focusin keydown keyup mousedown mouseup selectionchange".split(" "));
fa("onBeforeInput", ["compositionend", "keypress", "textInput", "paste"]);
fa("onCompositionEnd", "compositionend focusout keydown keypress keyup mousedown".split(" "));
fa("onCompositionStart", "compositionstart focusout keydown keypress keyup mousedown".split(" "));
fa("onCompositionUpdate", "compositionupdate focusout keydown keypress keyup mousedown".split(" "));
var lf = "abort canplay canplaythrough durationchange emptied encrypted ended error loadeddata loadedmetadata loadstart pause play playing progress ratechange resize seeked seeking stalled suspend timeupdate volumechange waiting".split(" "), mf = new Set("cancel close invalid load scroll toggle".split(" ").concat(lf));
function nf(a, b, c) {
  var d = a.type || "unknown-event";
  a.currentTarget = c;
  Ub(d, b, void 0, a);
  a.currentTarget = null;
}
function se(a, b) {
  b = 0 !== (b & 4);
  for (var c = 0; c < a.length; c++) {
    var d = a[c], e = d.event;
    d = d.listeners;
    a: {
      var f2 = void 0;
      if (b) for (var g = d.length - 1; 0 <= g; g--) {
        var h = d[g], k2 = h.instance, l2 = h.currentTarget;
        h = h.listener;
        if (k2 !== f2 && e.isPropagationStopped()) break a;
        nf(e, h, l2);
        f2 = k2;
      }
      else for (g = 0; g < d.length; g++) {
        h = d[g];
        k2 = h.instance;
        l2 = h.currentTarget;
        h = h.listener;
        if (k2 !== f2 && e.isPropagationStopped()) break a;
        nf(e, h, l2);
        f2 = k2;
      }
    }
  }
  if (Qb) throw a = Rb, Qb = false, Rb = null, a;
}
function D(a, b) {
  var c = b[of];
  void 0 === c && (c = b[of] = /* @__PURE__ */ new Set());
  var d = a + "__bubble";
  c.has(d) || (pf(b, a, 2, false), c.add(d));
}
function qf(a, b, c) {
  var d = 0;
  b && (d |= 4);
  pf(c, a, d, b);
}
var rf = "_reactListening" + Math.random().toString(36).slice(2);
function sf(a) {
  if (!a[rf]) {
    a[rf] = true;
    da.forEach(function(b2) {
      "selectionchange" !== b2 && (mf.has(b2) || qf(b2, false, a), qf(b2, true, a));
    });
    var b = 9 === a.nodeType ? a : a.ownerDocument;
    null === b || b[rf] || (b[rf] = true, qf("selectionchange", false, b));
  }
}
function pf(a, b, c, d) {
  switch (jd(b)) {
    case 1:
      var e = ed;
      break;
    case 4:
      e = gd;
      break;
    default:
      e = fd;
  }
  c = e.bind(null, b, c, a);
  e = void 0;
  !Lb || "touchstart" !== b && "touchmove" !== b && "wheel" !== b || (e = true);
  d ? void 0 !== e ? a.addEventListener(b, c, { capture: true, passive: e }) : a.addEventListener(b, c, true) : void 0 !== e ? a.addEventListener(b, c, { passive: e }) : a.addEventListener(b, c, false);
}
function hd(a, b, c, d, e) {
  var f2 = d;
  if (0 === (b & 1) && 0 === (b & 2) && null !== d) a: for (; ; ) {
    if (null === d) return;
    var g = d.tag;
    if (3 === g || 4 === g) {
      var h = d.stateNode.containerInfo;
      if (h === e || 8 === h.nodeType && h.parentNode === e) break;
      if (4 === g) for (g = d.return; null !== g; ) {
        var k2 = g.tag;
        if (3 === k2 || 4 === k2) {
          if (k2 = g.stateNode.containerInfo, k2 === e || 8 === k2.nodeType && k2.parentNode === e) return;
        }
        g = g.return;
      }
      for (; null !== h; ) {
        g = Wc(h);
        if (null === g) return;
        k2 = g.tag;
        if (5 === k2 || 6 === k2) {
          d = f2 = g;
          continue a;
        }
        h = h.parentNode;
      }
    }
    d = d.return;
  }
  Jb(function() {
    var d2 = f2, e2 = xb(c), g2 = [];
    a: {
      var h2 = df.get(a);
      if (void 0 !== h2) {
        var k3 = td, n2 = a;
        switch (a) {
          case "keypress":
            if (0 === od(c)) break a;
          case "keydown":
          case "keyup":
            k3 = Rd;
            break;
          case "focusin":
            n2 = "focus";
            k3 = Fd;
            break;
          case "focusout":
            n2 = "blur";
            k3 = Fd;
            break;
          case "beforeblur":
          case "afterblur":
            k3 = Fd;
            break;
          case "click":
            if (2 === c.button) break a;
          case "auxclick":
          case "dblclick":
          case "mousedown":
          case "mousemove":
          case "mouseup":
          case "mouseout":
          case "mouseover":
          case "contextmenu":
            k3 = Bd;
            break;
          case "drag":
          case "dragend":
          case "dragenter":
          case "dragexit":
          case "dragleave":
          case "dragover":
          case "dragstart":
          case "drop":
            k3 = Dd;
            break;
          case "touchcancel":
          case "touchend":
          case "touchmove":
          case "touchstart":
            k3 = Vd;
            break;
          case $e:
          case af:
          case bf:
            k3 = Hd;
            break;
          case cf:
            k3 = Xd;
            break;
          case "scroll":
            k3 = vd;
            break;
          case "wheel":
            k3 = Zd;
            break;
          case "copy":
          case "cut":
          case "paste":
            k3 = Jd;
            break;
          case "gotpointercapture":
          case "lostpointercapture":
          case "pointercancel":
          case "pointerdown":
          case "pointermove":
          case "pointerout":
          case "pointerover":
          case "pointerup":
            k3 = Td;
        }
        var t2 = 0 !== (b & 4), J2 = !t2 && "scroll" === a, x2 = t2 ? null !== h2 ? h2 + "Capture" : null : h2;
        t2 = [];
        for (var w2 = d2, u2; null !== w2; ) {
          u2 = w2;
          var F2 = u2.stateNode;
          5 === u2.tag && null !== F2 && (u2 = F2, null !== x2 && (F2 = Kb(w2, x2), null != F2 && t2.push(tf(w2, F2, u2))));
          if (J2) break;
          w2 = w2.return;
        }
        0 < t2.length && (h2 = new k3(h2, n2, null, c, e2), g2.push({ event: h2, listeners: t2 }));
      }
    }
    if (0 === (b & 7)) {
      a: {
        h2 = "mouseover" === a || "pointerover" === a;
        k3 = "mouseout" === a || "pointerout" === a;
        if (h2 && c !== wb && (n2 = c.relatedTarget || c.fromElement) && (Wc(n2) || n2[uf])) break a;
        if (k3 || h2) {
          h2 = e2.window === e2 ? e2 : (h2 = e2.ownerDocument) ? h2.defaultView || h2.parentWindow : window;
          if (k3) {
            if (n2 = c.relatedTarget || c.toElement, k3 = d2, n2 = n2 ? Wc(n2) : null, null !== n2 && (J2 = Vb(n2), n2 !== J2 || 5 !== n2.tag && 6 !== n2.tag)) n2 = null;
          } else k3 = null, n2 = d2;
          if (k3 !== n2) {
            t2 = Bd;
            F2 = "onMouseLeave";
            x2 = "onMouseEnter";
            w2 = "mouse";
            if ("pointerout" === a || "pointerover" === a) t2 = Td, F2 = "onPointerLeave", x2 = "onPointerEnter", w2 = "pointer";
            J2 = null == k3 ? h2 : ue(k3);
            u2 = null == n2 ? h2 : ue(n2);
            h2 = new t2(F2, w2 + "leave", k3, c, e2);
            h2.target = J2;
            h2.relatedTarget = u2;
            F2 = null;
            Wc(e2) === d2 && (t2 = new t2(x2, w2 + "enter", n2, c, e2), t2.target = u2, t2.relatedTarget = J2, F2 = t2);
            J2 = F2;
            if (k3 && n2) b: {
              t2 = k3;
              x2 = n2;
              w2 = 0;
              for (u2 = t2; u2; u2 = vf(u2)) w2++;
              u2 = 0;
              for (F2 = x2; F2; F2 = vf(F2)) u2++;
              for (; 0 < w2 - u2; ) t2 = vf(t2), w2--;
              for (; 0 < u2 - w2; ) x2 = vf(x2), u2--;
              for (; w2--; ) {
                if (t2 === x2 || null !== x2 && t2 === x2.alternate) break b;
                t2 = vf(t2);
                x2 = vf(x2);
              }
              t2 = null;
            }
            else t2 = null;
            null !== k3 && wf(g2, h2, k3, t2, false);
            null !== n2 && null !== J2 && wf(g2, J2, n2, t2, true);
          }
        }
      }
      a: {
        h2 = d2 ? ue(d2) : window;
        k3 = h2.nodeName && h2.nodeName.toLowerCase();
        if ("select" === k3 || "input" === k3 && "file" === h2.type) var na = ve;
        else if (me(h2)) if (we) na = Fe;
        else {
          na = De;
          var xa = Ce;
        }
        else (k3 = h2.nodeName) && "input" === k3.toLowerCase() && ("checkbox" === h2.type || "radio" === h2.type) && (na = Ee);
        if (na && (na = na(a, d2))) {
          ne(g2, na, c, e2);
          break a;
        }
        xa && xa(a, h2, d2);
        "focusout" === a && (xa = h2._wrapperState) && xa.controlled && "number" === h2.type && cb(h2, "number", h2.value);
      }
      xa = d2 ? ue(d2) : window;
      switch (a) {
        case "focusin":
          if (me(xa) || "true" === xa.contentEditable) Qe = xa, Re = d2, Se = null;
          break;
        case "focusout":
          Se = Re = Qe = null;
          break;
        case "mousedown":
          Te = true;
          break;
        case "contextmenu":
        case "mouseup":
        case "dragend":
          Te = false;
          Ue(g2, c, e2);
          break;
        case "selectionchange":
          if (Pe) break;
        case "keydown":
        case "keyup":
          Ue(g2, c, e2);
      }
      var $a;
      if (ae) b: {
        switch (a) {
          case "compositionstart":
            var ba = "onCompositionStart";
            break b;
          case "compositionend":
            ba = "onCompositionEnd";
            break b;
          case "compositionupdate":
            ba = "onCompositionUpdate";
            break b;
        }
        ba = void 0;
      }
      else ie ? ge(a, c) && (ba = "onCompositionEnd") : "keydown" === a && 229 === c.keyCode && (ba = "onCompositionStart");
      ba && (de && "ko" !== c.locale && (ie || "onCompositionStart" !== ba ? "onCompositionEnd" === ba && ie && ($a = nd()) : (kd = e2, ld = "value" in kd ? kd.value : kd.textContent, ie = true)), xa = oe(d2, ba), 0 < xa.length && (ba = new Ld(ba, a, null, c, e2), g2.push({ event: ba, listeners: xa }), $a ? ba.data = $a : ($a = he(c), null !== $a && (ba.data = $a))));
      if ($a = ce ? je(a, c) : ke(a, c)) d2 = oe(d2, "onBeforeInput"), 0 < d2.length && (e2 = new Ld("onBeforeInput", "beforeinput", null, c, e2), g2.push({ event: e2, listeners: d2 }), e2.data = $a);
    }
    se(g2, b);
  });
}
function tf(a, b, c) {
  return { instance: a, listener: b, currentTarget: c };
}
function oe(a, b) {
  for (var c = b + "Capture", d = []; null !== a; ) {
    var e = a, f2 = e.stateNode;
    5 === e.tag && null !== f2 && (e = f2, f2 = Kb(a, c), null != f2 && d.unshift(tf(a, f2, e)), f2 = Kb(a, b), null != f2 && d.push(tf(a, f2, e)));
    a = a.return;
  }
  return d;
}
function vf(a) {
  if (null === a) return null;
  do
    a = a.return;
  while (a && 5 !== a.tag);
  return a ? a : null;
}
function wf(a, b, c, d, e) {
  for (var f2 = b._reactName, g = []; null !== c && c !== d; ) {
    var h = c, k2 = h.alternate, l2 = h.stateNode;
    if (null !== k2 && k2 === d) break;
    5 === h.tag && null !== l2 && (h = l2, e ? (k2 = Kb(c, f2), null != k2 && g.unshift(tf(c, k2, h))) : e || (k2 = Kb(c, f2), null != k2 && g.push(tf(c, k2, h))));
    c = c.return;
  }
  0 !== g.length && a.push({ event: b, listeners: g });
}
var xf = /\r\n?/g, yf = /\u0000|\uFFFD/g;
function zf(a) {
  return ("string" === typeof a ? a : "" + a).replace(xf, "\n").replace(yf, "");
}
function Af(a, b, c) {
  b = zf(b);
  if (zf(a) !== b && c) throw Error(p(425));
}
function Bf() {
}
var Cf = null, Df = null;
function Ef(a, b) {
  return "textarea" === a || "noscript" === a || "string" === typeof b.children || "number" === typeof b.children || "object" === typeof b.dangerouslySetInnerHTML && null !== b.dangerouslySetInnerHTML && null != b.dangerouslySetInnerHTML.__html;
}
var Ff = "function" === typeof setTimeout ? setTimeout : void 0, Gf = "function" === typeof clearTimeout ? clearTimeout : void 0, Hf = "function" === typeof Promise ? Promise : void 0, Jf = "function" === typeof queueMicrotask ? queueMicrotask : "undefined" !== typeof Hf ? function(a) {
  return Hf.resolve(null).then(a).catch(If);
} : Ff;
function If(a) {
  setTimeout(function() {
    throw a;
  });
}
function Kf(a, b) {
  var c = b, d = 0;
  do {
    var e = c.nextSibling;
    a.removeChild(c);
    if (e && 8 === e.nodeType) if (c = e.data, "/$" === c) {
      if (0 === d) {
        a.removeChild(e);
        bd(b);
        return;
      }
      d--;
    } else "$" !== c && "$?" !== c && "$!" !== c || d++;
    c = e;
  } while (c);
  bd(b);
}
function Lf(a) {
  for (; null != a; a = a.nextSibling) {
    var b = a.nodeType;
    if (1 === b || 3 === b) break;
    if (8 === b) {
      b = a.data;
      if ("$" === b || "$!" === b || "$?" === b) break;
      if ("/$" === b) return null;
    }
  }
  return a;
}
function Mf(a) {
  a = a.previousSibling;
  for (var b = 0; a; ) {
    if (8 === a.nodeType) {
      var c = a.data;
      if ("$" === c || "$!" === c || "$?" === c) {
        if (0 === b) return a;
        b--;
      } else "/$" === c && b++;
    }
    a = a.previousSibling;
  }
  return null;
}
var Nf = Math.random().toString(36).slice(2), Of = "__reactFiber$" + Nf, Pf = "__reactProps$" + Nf, uf = "__reactContainer$" + Nf, of = "__reactEvents$" + Nf, Qf = "__reactListeners$" + Nf, Rf = "__reactHandles$" + Nf;
function Wc(a) {
  var b = a[Of];
  if (b) return b;
  for (var c = a.parentNode; c; ) {
    if (b = c[uf] || c[Of]) {
      c = b.alternate;
      if (null !== b.child || null !== c && null !== c.child) for (a = Mf(a); null !== a; ) {
        if (c = a[Of]) return c;
        a = Mf(a);
      }
      return b;
    }
    a = c;
    c = a.parentNode;
  }
  return null;
}
function Cb(a) {
  a = a[Of] || a[uf];
  return !a || 5 !== a.tag && 6 !== a.tag && 13 !== a.tag && 3 !== a.tag ? null : a;
}
function ue(a) {
  if (5 === a.tag || 6 === a.tag) return a.stateNode;
  throw Error(p(33));
}
function Db(a) {
  return a[Pf] || null;
}
var Sf = [], Tf = -1;
function Uf(a) {
  return { current: a };
}
function E(a) {
  0 > Tf || (a.current = Sf[Tf], Sf[Tf] = null, Tf--);
}
function G(a, b) {
  Tf++;
  Sf[Tf] = a.current;
  a.current = b;
}
var Vf = {}, H = Uf(Vf), Wf = Uf(false), Xf = Vf;
function Yf(a, b) {
  var c = a.type.contextTypes;
  if (!c) return Vf;
  var d = a.stateNode;
  if (d && d.__reactInternalMemoizedUnmaskedChildContext === b) return d.__reactInternalMemoizedMaskedChildContext;
  var e = {}, f2;
  for (f2 in c) e[f2] = b[f2];
  d && (a = a.stateNode, a.__reactInternalMemoizedUnmaskedChildContext = b, a.__reactInternalMemoizedMaskedChildContext = e);
  return e;
}
function Zf(a) {
  a = a.childContextTypes;
  return null !== a && void 0 !== a;
}
function $f() {
  E(Wf);
  E(H);
}
function ag(a, b, c) {
  if (H.current !== Vf) throw Error(p(168));
  G(H, b);
  G(Wf, c);
}
function bg(a, b, c) {
  var d = a.stateNode;
  b = b.childContextTypes;
  if ("function" !== typeof d.getChildContext) return c;
  d = d.getChildContext();
  for (var e in d) if (!(e in b)) throw Error(p(108, Ra(a) || "Unknown", e));
  return A({}, c, d);
}
function cg(a) {
  a = (a = a.stateNode) && a.__reactInternalMemoizedMergedChildContext || Vf;
  Xf = H.current;
  G(H, a);
  G(Wf, Wf.current);
  return true;
}
function dg(a, b, c) {
  var d = a.stateNode;
  if (!d) throw Error(p(169));
  c ? (a = bg(a, b, Xf), d.__reactInternalMemoizedMergedChildContext = a, E(Wf), E(H), G(H, a)) : E(Wf);
  G(Wf, c);
}
var eg = null, fg = false, gg = false;
function hg(a) {
  null === eg ? eg = [a] : eg.push(a);
}
function ig(a) {
  fg = true;
  hg(a);
}
function jg() {
  if (!gg && null !== eg) {
    gg = true;
    var a = 0, b = C;
    try {
      var c = eg;
      for (C = 1; a < c.length; a++) {
        var d = c[a];
        do
          d = d(true);
        while (null !== d);
      }
      eg = null;
      fg = false;
    } catch (e) {
      throw null !== eg && (eg = eg.slice(a + 1)), ac(fc, jg), e;
    } finally {
      C = b, gg = false;
    }
  }
  return null;
}
var kg = [], lg = 0, mg = null, ng = 0, og = [], pg = 0, qg = null, rg = 1, sg = "";
function tg(a, b) {
  kg[lg++] = ng;
  kg[lg++] = mg;
  mg = a;
  ng = b;
}
function ug(a, b, c) {
  og[pg++] = rg;
  og[pg++] = sg;
  og[pg++] = qg;
  qg = a;
  var d = rg;
  a = sg;
  var e = 32 - oc(d) - 1;
  d &= ~(1 << e);
  c += 1;
  var f2 = 32 - oc(b) + e;
  if (30 < f2) {
    var g = e - e % 5;
    f2 = (d & (1 << g) - 1).toString(32);
    d >>= g;
    e -= g;
    rg = 1 << 32 - oc(b) + e | c << e | d;
    sg = f2 + a;
  } else rg = 1 << f2 | c << e | d, sg = a;
}
function vg(a) {
  null !== a.return && (tg(a, 1), ug(a, 1, 0));
}
function wg(a) {
  for (; a === mg; ) mg = kg[--lg], kg[lg] = null, ng = kg[--lg], kg[lg] = null;
  for (; a === qg; ) qg = og[--pg], og[pg] = null, sg = og[--pg], og[pg] = null, rg = og[--pg], og[pg] = null;
}
var xg = null, yg = null, I = false, zg = null;
function Ag(a, b) {
  var c = Bg(5, null, null, 0);
  c.elementType = "DELETED";
  c.stateNode = b;
  c.return = a;
  b = a.deletions;
  null === b ? (a.deletions = [c], a.flags |= 16) : b.push(c);
}
function Cg(a, b) {
  switch (a.tag) {
    case 5:
      var c = a.type;
      b = 1 !== b.nodeType || c.toLowerCase() !== b.nodeName.toLowerCase() ? null : b;
      return null !== b ? (a.stateNode = b, xg = a, yg = Lf(b.firstChild), true) : false;
    case 6:
      return b = "" === a.pendingProps || 3 !== b.nodeType ? null : b, null !== b ? (a.stateNode = b, xg = a, yg = null, true) : false;
    case 13:
      return b = 8 !== b.nodeType ? null : b, null !== b ? (c = null !== qg ? { id: rg, overflow: sg } : null, a.memoizedState = { dehydrated: b, treeContext: c, retryLane: 1073741824 }, c = Bg(18, null, null, 0), c.stateNode = b, c.return = a, a.child = c, xg = a, yg = null, true) : false;
    default:
      return false;
  }
}
function Dg(a) {
  return 0 !== (a.mode & 1) && 0 === (a.flags & 128);
}
function Eg(a) {
  if (I) {
    var b = yg;
    if (b) {
      var c = b;
      if (!Cg(a, b)) {
        if (Dg(a)) throw Error(p(418));
        b = Lf(c.nextSibling);
        var d = xg;
        b && Cg(a, b) ? Ag(d, c) : (a.flags = a.flags & -4097 | 2, I = false, xg = a);
      }
    } else {
      if (Dg(a)) throw Error(p(418));
      a.flags = a.flags & -4097 | 2;
      I = false;
      xg = a;
    }
  }
}
function Fg(a) {
  for (a = a.return; null !== a && 5 !== a.tag && 3 !== a.tag && 13 !== a.tag; ) a = a.return;
  xg = a;
}
function Gg(a) {
  if (a !== xg) return false;
  if (!I) return Fg(a), I = true, false;
  var b;
  (b = 3 !== a.tag) && !(b = 5 !== a.tag) && (b = a.type, b = "head" !== b && "body" !== b && !Ef(a.type, a.memoizedProps));
  if (b && (b = yg)) {
    if (Dg(a)) throw Hg(), Error(p(418));
    for (; b; ) Ag(a, b), b = Lf(b.nextSibling);
  }
  Fg(a);
  if (13 === a.tag) {
    a = a.memoizedState;
    a = null !== a ? a.dehydrated : null;
    if (!a) throw Error(p(317));
    a: {
      a = a.nextSibling;
      for (b = 0; a; ) {
        if (8 === a.nodeType) {
          var c = a.data;
          if ("/$" === c) {
            if (0 === b) {
              yg = Lf(a.nextSibling);
              break a;
            }
            b--;
          } else "$" !== c && "$!" !== c && "$?" !== c || b++;
        }
        a = a.nextSibling;
      }
      yg = null;
    }
  } else yg = xg ? Lf(a.stateNode.nextSibling) : null;
  return true;
}
function Hg() {
  for (var a = yg; a; ) a = Lf(a.nextSibling);
}
function Ig() {
  yg = xg = null;
  I = false;
}
function Jg(a) {
  null === zg ? zg = [a] : zg.push(a);
}
var Kg = ua.ReactCurrentBatchConfig;
function Lg(a, b, c) {
  a = c.ref;
  if (null !== a && "function" !== typeof a && "object" !== typeof a) {
    if (c._owner) {
      c = c._owner;
      if (c) {
        if (1 !== c.tag) throw Error(p(309));
        var d = c.stateNode;
      }
      if (!d) throw Error(p(147, a));
      var e = d, f2 = "" + a;
      if (null !== b && null !== b.ref && "function" === typeof b.ref && b.ref._stringRef === f2) return b.ref;
      b = function(a2) {
        var b2 = e.refs;
        null === a2 ? delete b2[f2] : b2[f2] = a2;
      };
      b._stringRef = f2;
      return b;
    }
    if ("string" !== typeof a) throw Error(p(284));
    if (!c._owner) throw Error(p(290, a));
  }
  return a;
}
function Mg(a, b) {
  a = Object.prototype.toString.call(b);
  throw Error(p(31, "[object Object]" === a ? "object with keys {" + Object.keys(b).join(", ") + "}" : a));
}
function Ng(a) {
  var b = a._init;
  return b(a._payload);
}
function Og(a) {
  function b(b2, c2) {
    if (a) {
      var d2 = b2.deletions;
      null === d2 ? (b2.deletions = [c2], b2.flags |= 16) : d2.push(c2);
    }
  }
  function c(c2, d2) {
    if (!a) return null;
    for (; null !== d2; ) b(c2, d2), d2 = d2.sibling;
    return null;
  }
  function d(a2, b2) {
    for (a2 = /* @__PURE__ */ new Map(); null !== b2; ) null !== b2.key ? a2.set(b2.key, b2) : a2.set(b2.index, b2), b2 = b2.sibling;
    return a2;
  }
  function e(a2, b2) {
    a2 = Pg(a2, b2);
    a2.index = 0;
    a2.sibling = null;
    return a2;
  }
  function f2(b2, c2, d2) {
    b2.index = d2;
    if (!a) return b2.flags |= 1048576, c2;
    d2 = b2.alternate;
    if (null !== d2) return d2 = d2.index, d2 < c2 ? (b2.flags |= 2, c2) : d2;
    b2.flags |= 2;
    return c2;
  }
  function g(b2) {
    a && null === b2.alternate && (b2.flags |= 2);
    return b2;
  }
  function h(a2, b2, c2, d2) {
    if (null === b2 || 6 !== b2.tag) return b2 = Qg(c2, a2.mode, d2), b2.return = a2, b2;
    b2 = e(b2, c2);
    b2.return = a2;
    return b2;
  }
  function k2(a2, b2, c2, d2) {
    var f3 = c2.type;
    if (f3 === ya) return m2(a2, b2, c2.props.children, d2, c2.key);
    if (null !== b2 && (b2.elementType === f3 || "object" === typeof f3 && null !== f3 && f3.$$typeof === Ha && Ng(f3) === b2.type)) return d2 = e(b2, c2.props), d2.ref = Lg(a2, b2, c2), d2.return = a2, d2;
    d2 = Rg(c2.type, c2.key, c2.props, null, a2.mode, d2);
    d2.ref = Lg(a2, b2, c2);
    d2.return = a2;
    return d2;
  }
  function l2(a2, b2, c2, d2) {
    if (null === b2 || 4 !== b2.tag || b2.stateNode.containerInfo !== c2.containerInfo || b2.stateNode.implementation !== c2.implementation) return b2 = Sg(c2, a2.mode, d2), b2.return = a2, b2;
    b2 = e(b2, c2.children || []);
    b2.return = a2;
    return b2;
  }
  function m2(a2, b2, c2, d2, f3) {
    if (null === b2 || 7 !== b2.tag) return b2 = Tg(c2, a2.mode, d2, f3), b2.return = a2, b2;
    b2 = e(b2, c2);
    b2.return = a2;
    return b2;
  }
  function q2(a2, b2, c2) {
    if ("string" === typeof b2 && "" !== b2 || "number" === typeof b2) return b2 = Qg("" + b2, a2.mode, c2), b2.return = a2, b2;
    if ("object" === typeof b2 && null !== b2) {
      switch (b2.$$typeof) {
        case va:
          return c2 = Rg(b2.type, b2.key, b2.props, null, a2.mode, c2), c2.ref = Lg(a2, null, b2), c2.return = a2, c2;
        case wa:
          return b2 = Sg(b2, a2.mode, c2), b2.return = a2, b2;
        case Ha:
          var d2 = b2._init;
          return q2(a2, d2(b2._payload), c2);
      }
      if (eb(b2) || Ka(b2)) return b2 = Tg(b2, a2.mode, c2, null), b2.return = a2, b2;
      Mg(a2, b2);
    }
    return null;
  }
  function r2(a2, b2, c2, d2) {
    var e2 = null !== b2 ? b2.key : null;
    if ("string" === typeof c2 && "" !== c2 || "number" === typeof c2) return null !== e2 ? null : h(a2, b2, "" + c2, d2);
    if ("object" === typeof c2 && null !== c2) {
      switch (c2.$$typeof) {
        case va:
          return c2.key === e2 ? k2(a2, b2, c2, d2) : null;
        case wa:
          return c2.key === e2 ? l2(a2, b2, c2, d2) : null;
        case Ha:
          return e2 = c2._init, r2(
            a2,
            b2,
            e2(c2._payload),
            d2
          );
      }
      if (eb(c2) || Ka(c2)) return null !== e2 ? null : m2(a2, b2, c2, d2, null);
      Mg(a2, c2);
    }
    return null;
  }
  function y2(a2, b2, c2, d2, e2) {
    if ("string" === typeof d2 && "" !== d2 || "number" === typeof d2) return a2 = a2.get(c2) || null, h(b2, a2, "" + d2, e2);
    if ("object" === typeof d2 && null !== d2) {
      switch (d2.$$typeof) {
        case va:
          return a2 = a2.get(null === d2.key ? c2 : d2.key) || null, k2(b2, a2, d2, e2);
        case wa:
          return a2 = a2.get(null === d2.key ? c2 : d2.key) || null, l2(b2, a2, d2, e2);
        case Ha:
          var f3 = d2._init;
          return y2(a2, b2, c2, f3(d2._payload), e2);
      }
      if (eb(d2) || Ka(d2)) return a2 = a2.get(c2) || null, m2(b2, a2, d2, e2, null);
      Mg(b2, d2);
    }
    return null;
  }
  function n2(e2, g2, h2, k3) {
    for (var l3 = null, m3 = null, u2 = g2, w2 = g2 = 0, x2 = null; null !== u2 && w2 < h2.length; w2++) {
      u2.index > w2 ? (x2 = u2, u2 = null) : x2 = u2.sibling;
      var n3 = r2(e2, u2, h2[w2], k3);
      if (null === n3) {
        null === u2 && (u2 = x2);
        break;
      }
      a && u2 && null === n3.alternate && b(e2, u2);
      g2 = f2(n3, g2, w2);
      null === m3 ? l3 = n3 : m3.sibling = n3;
      m3 = n3;
      u2 = x2;
    }
    if (w2 === h2.length) return c(e2, u2), I && tg(e2, w2), l3;
    if (null === u2) {
      for (; w2 < h2.length; w2++) u2 = q2(e2, h2[w2], k3), null !== u2 && (g2 = f2(u2, g2, w2), null === m3 ? l3 = u2 : m3.sibling = u2, m3 = u2);
      I && tg(e2, w2);
      return l3;
    }
    for (u2 = d(e2, u2); w2 < h2.length; w2++) x2 = y2(u2, e2, w2, h2[w2], k3), null !== x2 && (a && null !== x2.alternate && u2.delete(null === x2.key ? w2 : x2.key), g2 = f2(x2, g2, w2), null === m3 ? l3 = x2 : m3.sibling = x2, m3 = x2);
    a && u2.forEach(function(a2) {
      return b(e2, a2);
    });
    I && tg(e2, w2);
    return l3;
  }
  function t2(e2, g2, h2, k3) {
    var l3 = Ka(h2);
    if ("function" !== typeof l3) throw Error(p(150));
    h2 = l3.call(h2);
    if (null == h2) throw Error(p(151));
    for (var u2 = l3 = null, m3 = g2, w2 = g2 = 0, x2 = null, n3 = h2.next(); null !== m3 && !n3.done; w2++, n3 = h2.next()) {
      m3.index > w2 ? (x2 = m3, m3 = null) : x2 = m3.sibling;
      var t3 = r2(e2, m3, n3.value, k3);
      if (null === t3) {
        null === m3 && (m3 = x2);
        break;
      }
      a && m3 && null === t3.alternate && b(e2, m3);
      g2 = f2(t3, g2, w2);
      null === u2 ? l3 = t3 : u2.sibling = t3;
      u2 = t3;
      m3 = x2;
    }
    if (n3.done) return c(
      e2,
      m3
    ), I && tg(e2, w2), l3;
    if (null === m3) {
      for (; !n3.done; w2++, n3 = h2.next()) n3 = q2(e2, n3.value, k3), null !== n3 && (g2 = f2(n3, g2, w2), null === u2 ? l3 = n3 : u2.sibling = n3, u2 = n3);
      I && tg(e2, w2);
      return l3;
    }
    for (m3 = d(e2, m3); !n3.done; w2++, n3 = h2.next()) n3 = y2(m3, e2, w2, n3.value, k3), null !== n3 && (a && null !== n3.alternate && m3.delete(null === n3.key ? w2 : n3.key), g2 = f2(n3, g2, w2), null === u2 ? l3 = n3 : u2.sibling = n3, u2 = n3);
    a && m3.forEach(function(a2) {
      return b(e2, a2);
    });
    I && tg(e2, w2);
    return l3;
  }
  function J2(a2, d2, f3, h2) {
    "object" === typeof f3 && null !== f3 && f3.type === ya && null === f3.key && (f3 = f3.props.children);
    if ("object" === typeof f3 && null !== f3) {
      switch (f3.$$typeof) {
        case va:
          a: {
            for (var k3 = f3.key, l3 = d2; null !== l3; ) {
              if (l3.key === k3) {
                k3 = f3.type;
                if (k3 === ya) {
                  if (7 === l3.tag) {
                    c(a2, l3.sibling);
                    d2 = e(l3, f3.props.children);
                    d2.return = a2;
                    a2 = d2;
                    break a;
                  }
                } else if (l3.elementType === k3 || "object" === typeof k3 && null !== k3 && k3.$$typeof === Ha && Ng(k3) === l3.type) {
                  c(a2, l3.sibling);
                  d2 = e(l3, f3.props);
                  d2.ref = Lg(a2, l3, f3);
                  d2.return = a2;
                  a2 = d2;
                  break a;
                }
                c(a2, l3);
                break;
              } else b(a2, l3);
              l3 = l3.sibling;
            }
            f3.type === ya ? (d2 = Tg(f3.props.children, a2.mode, h2, f3.key), d2.return = a2, a2 = d2) : (h2 = Rg(f3.type, f3.key, f3.props, null, a2.mode, h2), h2.ref = Lg(a2, d2, f3), h2.return = a2, a2 = h2);
          }
          return g(a2);
        case wa:
          a: {
            for (l3 = f3.key; null !== d2; ) {
              if (d2.key === l3) if (4 === d2.tag && d2.stateNode.containerInfo === f3.containerInfo && d2.stateNode.implementation === f3.implementation) {
                c(a2, d2.sibling);
                d2 = e(d2, f3.children || []);
                d2.return = a2;
                a2 = d2;
                break a;
              } else {
                c(a2, d2);
                break;
              }
              else b(a2, d2);
              d2 = d2.sibling;
            }
            d2 = Sg(f3, a2.mode, h2);
            d2.return = a2;
            a2 = d2;
          }
          return g(a2);
        case Ha:
          return l3 = f3._init, J2(a2, d2, l3(f3._payload), h2);
      }
      if (eb(f3)) return n2(a2, d2, f3, h2);
      if (Ka(f3)) return t2(a2, d2, f3, h2);
      Mg(a2, f3);
    }
    return "string" === typeof f3 && "" !== f3 || "number" === typeof f3 ? (f3 = "" + f3, null !== d2 && 6 === d2.tag ? (c(a2, d2.sibling), d2 = e(d2, f3), d2.return = a2, a2 = d2) : (c(a2, d2), d2 = Qg(f3, a2.mode, h2), d2.return = a2, a2 = d2), g(a2)) : c(a2, d2);
  }
  return J2;
}
var Ug = Og(true), Vg = Og(false), Wg = Uf(null), Xg = null, Yg = null, Zg = null;
function $g() {
  Zg = Yg = Xg = null;
}
function ah(a) {
  var b = Wg.current;
  E(Wg);
  a._currentValue = b;
}
function bh(a, b, c) {
  for (; null !== a; ) {
    var d = a.alternate;
    (a.childLanes & b) !== b ? (a.childLanes |= b, null !== d && (d.childLanes |= b)) : null !== d && (d.childLanes & b) !== b && (d.childLanes |= b);
    if (a === c) break;
    a = a.return;
  }
}
function ch(a, b) {
  Xg = a;
  Zg = Yg = null;
  a = a.dependencies;
  null !== a && null !== a.firstContext && (0 !== (a.lanes & b) && (dh = true), a.firstContext = null);
}
function eh(a) {
  var b = a._currentValue;
  if (Zg !== a) if (a = { context: a, memoizedValue: b, next: null }, null === Yg) {
    if (null === Xg) throw Error(p(308));
    Yg = a;
    Xg.dependencies = { lanes: 0, firstContext: a };
  } else Yg = Yg.next = a;
  return b;
}
var fh = null;
function gh(a) {
  null === fh ? fh = [a] : fh.push(a);
}
function hh(a, b, c, d) {
  var e = b.interleaved;
  null === e ? (c.next = c, gh(b)) : (c.next = e.next, e.next = c);
  b.interleaved = c;
  return ih(a, d);
}
function ih(a, b) {
  a.lanes |= b;
  var c = a.alternate;
  null !== c && (c.lanes |= b);
  c = a;
  for (a = a.return; null !== a; ) a.childLanes |= b, c = a.alternate, null !== c && (c.childLanes |= b), c = a, a = a.return;
  return 3 === c.tag ? c.stateNode : null;
}
var jh = false;
function kh(a) {
  a.updateQueue = { baseState: a.memoizedState, firstBaseUpdate: null, lastBaseUpdate: null, shared: { pending: null, interleaved: null, lanes: 0 }, effects: null };
}
function lh(a, b) {
  a = a.updateQueue;
  b.updateQueue === a && (b.updateQueue = { baseState: a.baseState, firstBaseUpdate: a.firstBaseUpdate, lastBaseUpdate: a.lastBaseUpdate, shared: a.shared, effects: a.effects });
}
function mh(a, b) {
  return { eventTime: a, lane: b, tag: 0, payload: null, callback: null, next: null };
}
function nh(a, b, c) {
  var d = a.updateQueue;
  if (null === d) return null;
  d = d.shared;
  if (0 !== (K & 2)) {
    var e = d.pending;
    null === e ? b.next = b : (b.next = e.next, e.next = b);
    d.pending = b;
    return ih(a, c);
  }
  e = d.interleaved;
  null === e ? (b.next = b, gh(d)) : (b.next = e.next, e.next = b);
  d.interleaved = b;
  return ih(a, c);
}
function oh(a, b, c) {
  b = b.updateQueue;
  if (null !== b && (b = b.shared, 0 !== (c & 4194240))) {
    var d = b.lanes;
    d &= a.pendingLanes;
    c |= d;
    b.lanes = c;
    Cc(a, c);
  }
}
function ph(a, b) {
  var c = a.updateQueue, d = a.alternate;
  if (null !== d && (d = d.updateQueue, c === d)) {
    var e = null, f2 = null;
    c = c.firstBaseUpdate;
    if (null !== c) {
      do {
        var g = { eventTime: c.eventTime, lane: c.lane, tag: c.tag, payload: c.payload, callback: c.callback, next: null };
        null === f2 ? e = f2 = g : f2 = f2.next = g;
        c = c.next;
      } while (null !== c);
      null === f2 ? e = f2 = b : f2 = f2.next = b;
    } else e = f2 = b;
    c = { baseState: d.baseState, firstBaseUpdate: e, lastBaseUpdate: f2, shared: d.shared, effects: d.effects };
    a.updateQueue = c;
    return;
  }
  a = c.lastBaseUpdate;
  null === a ? c.firstBaseUpdate = b : a.next = b;
  c.lastBaseUpdate = b;
}
function qh(a, b, c, d) {
  var e = a.updateQueue;
  jh = false;
  var f2 = e.firstBaseUpdate, g = e.lastBaseUpdate, h = e.shared.pending;
  if (null !== h) {
    e.shared.pending = null;
    var k2 = h, l2 = k2.next;
    k2.next = null;
    null === g ? f2 = l2 : g.next = l2;
    g = k2;
    var m2 = a.alternate;
    null !== m2 && (m2 = m2.updateQueue, h = m2.lastBaseUpdate, h !== g && (null === h ? m2.firstBaseUpdate = l2 : h.next = l2, m2.lastBaseUpdate = k2));
  }
  if (null !== f2) {
    var q2 = e.baseState;
    g = 0;
    m2 = l2 = k2 = null;
    h = f2;
    do {
      var r2 = h.lane, y2 = h.eventTime;
      if ((d & r2) === r2) {
        null !== m2 && (m2 = m2.next = {
          eventTime: y2,
          lane: 0,
          tag: h.tag,
          payload: h.payload,
          callback: h.callback,
          next: null
        });
        a: {
          var n2 = a, t2 = h;
          r2 = b;
          y2 = c;
          switch (t2.tag) {
            case 1:
              n2 = t2.payload;
              if ("function" === typeof n2) {
                q2 = n2.call(y2, q2, r2);
                break a;
              }
              q2 = n2;
              break a;
            case 3:
              n2.flags = n2.flags & -65537 | 128;
            case 0:
              n2 = t2.payload;
              r2 = "function" === typeof n2 ? n2.call(y2, q2, r2) : n2;
              if (null === r2 || void 0 === r2) break a;
              q2 = A({}, q2, r2);
              break a;
            case 2:
              jh = true;
          }
        }
        null !== h.callback && 0 !== h.lane && (a.flags |= 64, r2 = e.effects, null === r2 ? e.effects = [h] : r2.push(h));
      } else y2 = { eventTime: y2, lane: r2, tag: h.tag, payload: h.payload, callback: h.callback, next: null }, null === m2 ? (l2 = m2 = y2, k2 = q2) : m2 = m2.next = y2, g |= r2;
      h = h.next;
      if (null === h) if (h = e.shared.pending, null === h) break;
      else r2 = h, h = r2.next, r2.next = null, e.lastBaseUpdate = r2, e.shared.pending = null;
    } while (1);
    null === m2 && (k2 = q2);
    e.baseState = k2;
    e.firstBaseUpdate = l2;
    e.lastBaseUpdate = m2;
    b = e.shared.interleaved;
    if (null !== b) {
      e = b;
      do
        g |= e.lane, e = e.next;
      while (e !== b);
    } else null === f2 && (e.shared.lanes = 0);
    rh |= g;
    a.lanes = g;
    a.memoizedState = q2;
  }
}
function sh(a, b, c) {
  a = b.effects;
  b.effects = null;
  if (null !== a) for (b = 0; b < a.length; b++) {
    var d = a[b], e = d.callback;
    if (null !== e) {
      d.callback = null;
      d = c;
      if ("function" !== typeof e) throw Error(p(191, e));
      e.call(d);
    }
  }
}
var th = {}, uh = Uf(th), vh = Uf(th), wh = Uf(th);
function xh(a) {
  if (a === th) throw Error(p(174));
  return a;
}
function yh(a, b) {
  G(wh, b);
  G(vh, a);
  G(uh, th);
  a = b.nodeType;
  switch (a) {
    case 9:
    case 11:
      b = (b = b.documentElement) ? b.namespaceURI : lb(null, "");
      break;
    default:
      a = 8 === a ? b.parentNode : b, b = a.namespaceURI || null, a = a.tagName, b = lb(b, a);
  }
  E(uh);
  G(uh, b);
}
function zh() {
  E(uh);
  E(vh);
  E(wh);
}
function Ah(a) {
  xh(wh.current);
  var b = xh(uh.current);
  var c = lb(b, a.type);
  b !== c && (G(vh, a), G(uh, c));
}
function Bh(a) {
  vh.current === a && (E(uh), E(vh));
}
var L = Uf(0);
function Ch(a) {
  for (var b = a; null !== b; ) {
    if (13 === b.tag) {
      var c = b.memoizedState;
      if (null !== c && (c = c.dehydrated, null === c || "$?" === c.data || "$!" === c.data)) return b;
    } else if (19 === b.tag && void 0 !== b.memoizedProps.revealOrder) {
      if (0 !== (b.flags & 128)) return b;
    } else if (null !== b.child) {
      b.child.return = b;
      b = b.child;
      continue;
    }
    if (b === a) break;
    for (; null === b.sibling; ) {
      if (null === b.return || b.return === a) return null;
      b = b.return;
    }
    b.sibling.return = b.return;
    b = b.sibling;
  }
  return null;
}
var Dh = [];
function Eh() {
  for (var a = 0; a < Dh.length; a++) Dh[a]._workInProgressVersionPrimary = null;
  Dh.length = 0;
}
var Fh = ua.ReactCurrentDispatcher, Gh = ua.ReactCurrentBatchConfig, Hh = 0, M = null, N = null, O = null, Ih = false, Jh = false, Kh = 0, Lh = 0;
function P() {
  throw Error(p(321));
}
function Mh(a, b) {
  if (null === b) return false;
  for (var c = 0; c < b.length && c < a.length; c++) if (!He(a[c], b[c])) return false;
  return true;
}
function Nh(a, b, c, d, e, f2) {
  Hh = f2;
  M = b;
  b.memoizedState = null;
  b.updateQueue = null;
  b.lanes = 0;
  Fh.current = null === a || null === a.memoizedState ? Oh : Ph;
  a = c(d, e);
  if (Jh) {
    f2 = 0;
    do {
      Jh = false;
      Kh = 0;
      if (25 <= f2) throw Error(p(301));
      f2 += 1;
      O = N = null;
      b.updateQueue = null;
      Fh.current = Qh;
      a = c(d, e);
    } while (Jh);
  }
  Fh.current = Rh;
  b = null !== N && null !== N.next;
  Hh = 0;
  O = N = M = null;
  Ih = false;
  if (b) throw Error(p(300));
  return a;
}
function Sh() {
  var a = 0 !== Kh;
  Kh = 0;
  return a;
}
function Th() {
  var a = { memoizedState: null, baseState: null, baseQueue: null, queue: null, next: null };
  null === O ? M.memoizedState = O = a : O = O.next = a;
  return O;
}
function Uh() {
  if (null === N) {
    var a = M.alternate;
    a = null !== a ? a.memoizedState : null;
  } else a = N.next;
  var b = null === O ? M.memoizedState : O.next;
  if (null !== b) O = b, N = a;
  else {
    if (null === a) throw Error(p(310));
    N = a;
    a = { memoizedState: N.memoizedState, baseState: N.baseState, baseQueue: N.baseQueue, queue: N.queue, next: null };
    null === O ? M.memoizedState = O = a : O = O.next = a;
  }
  return O;
}
function Vh(a, b) {
  return "function" === typeof b ? b(a) : b;
}
function Wh(a) {
  var b = Uh(), c = b.queue;
  if (null === c) throw Error(p(311));
  c.lastRenderedReducer = a;
  var d = N, e = d.baseQueue, f2 = c.pending;
  if (null !== f2) {
    if (null !== e) {
      var g = e.next;
      e.next = f2.next;
      f2.next = g;
    }
    d.baseQueue = e = f2;
    c.pending = null;
  }
  if (null !== e) {
    f2 = e.next;
    d = d.baseState;
    var h = g = null, k2 = null, l2 = f2;
    do {
      var m2 = l2.lane;
      if ((Hh & m2) === m2) null !== k2 && (k2 = k2.next = { lane: 0, action: l2.action, hasEagerState: l2.hasEagerState, eagerState: l2.eagerState, next: null }), d = l2.hasEagerState ? l2.eagerState : a(d, l2.action);
      else {
        var q2 = {
          lane: m2,
          action: l2.action,
          hasEagerState: l2.hasEagerState,
          eagerState: l2.eagerState,
          next: null
        };
        null === k2 ? (h = k2 = q2, g = d) : k2 = k2.next = q2;
        M.lanes |= m2;
        rh |= m2;
      }
      l2 = l2.next;
    } while (null !== l2 && l2 !== f2);
    null === k2 ? g = d : k2.next = h;
    He(d, b.memoizedState) || (dh = true);
    b.memoizedState = d;
    b.baseState = g;
    b.baseQueue = k2;
    c.lastRenderedState = d;
  }
  a = c.interleaved;
  if (null !== a) {
    e = a;
    do
      f2 = e.lane, M.lanes |= f2, rh |= f2, e = e.next;
    while (e !== a);
  } else null === e && (c.lanes = 0);
  return [b.memoizedState, c.dispatch];
}
function Xh(a) {
  var b = Uh(), c = b.queue;
  if (null === c) throw Error(p(311));
  c.lastRenderedReducer = a;
  var d = c.dispatch, e = c.pending, f2 = b.memoizedState;
  if (null !== e) {
    c.pending = null;
    var g = e = e.next;
    do
      f2 = a(f2, g.action), g = g.next;
    while (g !== e);
    He(f2, b.memoizedState) || (dh = true);
    b.memoizedState = f2;
    null === b.baseQueue && (b.baseState = f2);
    c.lastRenderedState = f2;
  }
  return [f2, d];
}
function Yh() {
}
function Zh(a, b) {
  var c = M, d = Uh(), e = b(), f2 = !He(d.memoizedState, e);
  f2 && (d.memoizedState = e, dh = true);
  d = d.queue;
  $h(ai.bind(null, c, d, a), [a]);
  if (d.getSnapshot !== b || f2 || null !== O && O.memoizedState.tag & 1) {
    c.flags |= 2048;
    bi(9, ci.bind(null, c, d, e, b), void 0, null);
    if (null === Q) throw Error(p(349));
    0 !== (Hh & 30) || di(c, b, e);
  }
  return e;
}
function di(a, b, c) {
  a.flags |= 16384;
  a = { getSnapshot: b, value: c };
  b = M.updateQueue;
  null === b ? (b = { lastEffect: null, stores: null }, M.updateQueue = b, b.stores = [a]) : (c = b.stores, null === c ? b.stores = [a] : c.push(a));
}
function ci(a, b, c, d) {
  b.value = c;
  b.getSnapshot = d;
  ei(b) && fi(a);
}
function ai(a, b, c) {
  return c(function() {
    ei(b) && fi(a);
  });
}
function ei(a) {
  var b = a.getSnapshot;
  a = a.value;
  try {
    var c = b();
    return !He(a, c);
  } catch (d) {
    return true;
  }
}
function fi(a) {
  var b = ih(a, 1);
  null !== b && gi(b, a, 1, -1);
}
function hi(a) {
  var b = Th();
  "function" === typeof a && (a = a());
  b.memoizedState = b.baseState = a;
  a = { pending: null, interleaved: null, lanes: 0, dispatch: null, lastRenderedReducer: Vh, lastRenderedState: a };
  b.queue = a;
  a = a.dispatch = ii.bind(null, M, a);
  return [b.memoizedState, a];
}
function bi(a, b, c, d) {
  a = { tag: a, create: b, destroy: c, deps: d, next: null };
  b = M.updateQueue;
  null === b ? (b = { lastEffect: null, stores: null }, M.updateQueue = b, b.lastEffect = a.next = a) : (c = b.lastEffect, null === c ? b.lastEffect = a.next = a : (d = c.next, c.next = a, a.next = d, b.lastEffect = a));
  return a;
}
function ji() {
  return Uh().memoizedState;
}
function ki(a, b, c, d) {
  var e = Th();
  M.flags |= a;
  e.memoizedState = bi(1 | b, c, void 0, void 0 === d ? null : d);
}
function li(a, b, c, d) {
  var e = Uh();
  d = void 0 === d ? null : d;
  var f2 = void 0;
  if (null !== N) {
    var g = N.memoizedState;
    f2 = g.destroy;
    if (null !== d && Mh(d, g.deps)) {
      e.memoizedState = bi(b, c, f2, d);
      return;
    }
  }
  M.flags |= a;
  e.memoizedState = bi(1 | b, c, f2, d);
}
function mi(a, b) {
  return ki(8390656, 8, a, b);
}
function $h(a, b) {
  return li(2048, 8, a, b);
}
function ni(a, b) {
  return li(4, 2, a, b);
}
function oi(a, b) {
  return li(4, 4, a, b);
}
function pi(a, b) {
  if ("function" === typeof b) return a = a(), b(a), function() {
    b(null);
  };
  if (null !== b && void 0 !== b) return a = a(), b.current = a, function() {
    b.current = null;
  };
}
function qi(a, b, c) {
  c = null !== c && void 0 !== c ? c.concat([a]) : null;
  return li(4, 4, pi.bind(null, b, a), c);
}
function ri() {
}
function si(a, b) {
  var c = Uh();
  b = void 0 === b ? null : b;
  var d = c.memoizedState;
  if (null !== d && null !== b && Mh(b, d[1])) return d[0];
  c.memoizedState = [a, b];
  return a;
}
function ti(a, b) {
  var c = Uh();
  b = void 0 === b ? null : b;
  var d = c.memoizedState;
  if (null !== d && null !== b && Mh(b, d[1])) return d[0];
  a = a();
  c.memoizedState = [a, b];
  return a;
}
function ui(a, b, c) {
  if (0 === (Hh & 21)) return a.baseState && (a.baseState = false, dh = true), a.memoizedState = c;
  He(c, b) || (c = yc(), M.lanes |= c, rh |= c, a.baseState = true);
  return b;
}
function vi(a, b) {
  var c = C;
  C = 0 !== c && 4 > c ? c : 4;
  a(true);
  var d = Gh.transition;
  Gh.transition = {};
  try {
    a(false), b();
  } finally {
    C = c, Gh.transition = d;
  }
}
function wi() {
  return Uh().memoizedState;
}
function xi(a, b, c) {
  var d = yi(a);
  c = { lane: d, action: c, hasEagerState: false, eagerState: null, next: null };
  if (zi(a)) Ai(b, c);
  else if (c = hh(a, b, c, d), null !== c) {
    var e = R();
    gi(c, a, d, e);
    Bi(c, b, d);
  }
}
function ii(a, b, c) {
  var d = yi(a), e = { lane: d, action: c, hasEagerState: false, eagerState: null, next: null };
  if (zi(a)) Ai(b, e);
  else {
    var f2 = a.alternate;
    if (0 === a.lanes && (null === f2 || 0 === f2.lanes) && (f2 = b.lastRenderedReducer, null !== f2)) try {
      var g = b.lastRenderedState, h = f2(g, c);
      e.hasEagerState = true;
      e.eagerState = h;
      if (He(h, g)) {
        var k2 = b.interleaved;
        null === k2 ? (e.next = e, gh(b)) : (e.next = k2.next, k2.next = e);
        b.interleaved = e;
        return;
      }
    } catch (l2) {
    } finally {
    }
    c = hh(a, b, e, d);
    null !== c && (e = R(), gi(c, a, d, e), Bi(c, b, d));
  }
}
function zi(a) {
  var b = a.alternate;
  return a === M || null !== b && b === M;
}
function Ai(a, b) {
  Jh = Ih = true;
  var c = a.pending;
  null === c ? b.next = b : (b.next = c.next, c.next = b);
  a.pending = b;
}
function Bi(a, b, c) {
  if (0 !== (c & 4194240)) {
    var d = b.lanes;
    d &= a.pendingLanes;
    c |= d;
    b.lanes = c;
    Cc(a, c);
  }
}
var Rh = { readContext: eh, useCallback: P, useContext: P, useEffect: P, useImperativeHandle: P, useInsertionEffect: P, useLayoutEffect: P, useMemo: P, useReducer: P, useRef: P, useState: P, useDebugValue: P, useDeferredValue: P, useTransition: P, useMutableSource: P, useSyncExternalStore: P, useId: P, unstable_isNewReconciler: false }, Oh = { readContext: eh, useCallback: function(a, b) {
  Th().memoizedState = [a, void 0 === b ? null : b];
  return a;
}, useContext: eh, useEffect: mi, useImperativeHandle: function(a, b, c) {
  c = null !== c && void 0 !== c ? c.concat([a]) : null;
  return ki(
    4194308,
    4,
    pi.bind(null, b, a),
    c
  );
}, useLayoutEffect: function(a, b) {
  return ki(4194308, 4, a, b);
}, useInsertionEffect: function(a, b) {
  return ki(4, 2, a, b);
}, useMemo: function(a, b) {
  var c = Th();
  b = void 0 === b ? null : b;
  a = a();
  c.memoizedState = [a, b];
  return a;
}, useReducer: function(a, b, c) {
  var d = Th();
  b = void 0 !== c ? c(b) : b;
  d.memoizedState = d.baseState = b;
  a = { pending: null, interleaved: null, lanes: 0, dispatch: null, lastRenderedReducer: a, lastRenderedState: b };
  d.queue = a;
  a = a.dispatch = xi.bind(null, M, a);
  return [d.memoizedState, a];
}, useRef: function(a) {
  var b = Th();
  a = { current: a };
  return b.memoizedState = a;
}, useState: hi, useDebugValue: ri, useDeferredValue: function(a) {
  return Th().memoizedState = a;
}, useTransition: function() {
  var a = hi(false), b = a[0];
  a = vi.bind(null, a[1]);
  Th().memoizedState = a;
  return [b, a];
}, useMutableSource: function() {
}, useSyncExternalStore: function(a, b, c) {
  var d = M, e = Th();
  if (I) {
    if (void 0 === c) throw Error(p(407));
    c = c();
  } else {
    c = b();
    if (null === Q) throw Error(p(349));
    0 !== (Hh & 30) || di(d, b, c);
  }
  e.memoizedState = c;
  var f2 = { value: c, getSnapshot: b };
  e.queue = f2;
  mi(ai.bind(
    null,
    d,
    f2,
    a
  ), [a]);
  d.flags |= 2048;
  bi(9, ci.bind(null, d, f2, c, b), void 0, null);
  return c;
}, useId: function() {
  var a = Th(), b = Q.identifierPrefix;
  if (I) {
    var c = sg;
    var d = rg;
    c = (d & ~(1 << 32 - oc(d) - 1)).toString(32) + c;
    b = ":" + b + "R" + c;
    c = Kh++;
    0 < c && (b += "H" + c.toString(32));
    b += ":";
  } else c = Lh++, b = ":" + b + "r" + c.toString(32) + ":";
  return a.memoizedState = b;
}, unstable_isNewReconciler: false }, Ph = {
  readContext: eh,
  useCallback: si,
  useContext: eh,
  useEffect: $h,
  useImperativeHandle: qi,
  useInsertionEffect: ni,
  useLayoutEffect: oi,
  useMemo: ti,
  useReducer: Wh,
  useRef: ji,
  useState: function() {
    return Wh(Vh);
  },
  useDebugValue: ri,
  useDeferredValue: function(a) {
    var b = Uh();
    return ui(b, N.memoizedState, a);
  },
  useTransition: function() {
    var a = Wh(Vh)[0], b = Uh().memoizedState;
    return [a, b];
  },
  useMutableSource: Yh,
  useSyncExternalStore: Zh,
  useId: wi,
  unstable_isNewReconciler: false
}, Qh = { readContext: eh, useCallback: si, useContext: eh, useEffect: $h, useImperativeHandle: qi, useInsertionEffect: ni, useLayoutEffect: oi, useMemo: ti, useReducer: Xh, useRef: ji, useState: function() {
  return Xh(Vh);
}, useDebugValue: ri, useDeferredValue: function(a) {
  var b = Uh();
  return null === N ? b.memoizedState = a : ui(b, N.memoizedState, a);
}, useTransition: function() {
  var a = Xh(Vh)[0], b = Uh().memoizedState;
  return [a, b];
}, useMutableSource: Yh, useSyncExternalStore: Zh, useId: wi, unstable_isNewReconciler: false };
function Ci(a, b) {
  if (a && a.defaultProps) {
    b = A({}, b);
    a = a.defaultProps;
    for (var c in a) void 0 === b[c] && (b[c] = a[c]);
    return b;
  }
  return b;
}
function Di(a, b, c, d) {
  b = a.memoizedState;
  c = c(d, b);
  c = null === c || void 0 === c ? b : A({}, b, c);
  a.memoizedState = c;
  0 === a.lanes && (a.updateQueue.baseState = c);
}
var Ei = { isMounted: function(a) {
  return (a = a._reactInternals) ? Vb(a) === a : false;
}, enqueueSetState: function(a, b, c) {
  a = a._reactInternals;
  var d = R(), e = yi(a), f2 = mh(d, e);
  f2.payload = b;
  void 0 !== c && null !== c && (f2.callback = c);
  b = nh(a, f2, e);
  null !== b && (gi(b, a, e, d), oh(b, a, e));
}, enqueueReplaceState: function(a, b, c) {
  a = a._reactInternals;
  var d = R(), e = yi(a), f2 = mh(d, e);
  f2.tag = 1;
  f2.payload = b;
  void 0 !== c && null !== c && (f2.callback = c);
  b = nh(a, f2, e);
  null !== b && (gi(b, a, e, d), oh(b, a, e));
}, enqueueForceUpdate: function(a, b) {
  a = a._reactInternals;
  var c = R(), d = yi(a), e = mh(c, d);
  e.tag = 2;
  void 0 !== b && null !== b && (e.callback = b);
  b = nh(a, e, d);
  null !== b && (gi(b, a, d, c), oh(b, a, d));
} };
function Fi(a, b, c, d, e, f2, g) {
  a = a.stateNode;
  return "function" === typeof a.shouldComponentUpdate ? a.shouldComponentUpdate(d, f2, g) : b.prototype && b.prototype.isPureReactComponent ? !Ie(c, d) || !Ie(e, f2) : true;
}
function Gi(a, b, c) {
  var d = false, e = Vf;
  var f2 = b.contextType;
  "object" === typeof f2 && null !== f2 ? f2 = eh(f2) : (e = Zf(b) ? Xf : H.current, d = b.contextTypes, f2 = (d = null !== d && void 0 !== d) ? Yf(a, e) : Vf);
  b = new b(c, f2);
  a.memoizedState = null !== b.state && void 0 !== b.state ? b.state : null;
  b.updater = Ei;
  a.stateNode = b;
  b._reactInternals = a;
  d && (a = a.stateNode, a.__reactInternalMemoizedUnmaskedChildContext = e, a.__reactInternalMemoizedMaskedChildContext = f2);
  return b;
}
function Hi(a, b, c, d) {
  a = b.state;
  "function" === typeof b.componentWillReceiveProps && b.componentWillReceiveProps(c, d);
  "function" === typeof b.UNSAFE_componentWillReceiveProps && b.UNSAFE_componentWillReceiveProps(c, d);
  b.state !== a && Ei.enqueueReplaceState(b, b.state, null);
}
function Ii(a, b, c, d) {
  var e = a.stateNode;
  e.props = c;
  e.state = a.memoizedState;
  e.refs = {};
  kh(a);
  var f2 = b.contextType;
  "object" === typeof f2 && null !== f2 ? e.context = eh(f2) : (f2 = Zf(b) ? Xf : H.current, e.context = Yf(a, f2));
  e.state = a.memoizedState;
  f2 = b.getDerivedStateFromProps;
  "function" === typeof f2 && (Di(a, b, f2, c), e.state = a.memoizedState);
  "function" === typeof b.getDerivedStateFromProps || "function" === typeof e.getSnapshotBeforeUpdate || "function" !== typeof e.UNSAFE_componentWillMount && "function" !== typeof e.componentWillMount || (b = e.state, "function" === typeof e.componentWillMount && e.componentWillMount(), "function" === typeof e.UNSAFE_componentWillMount && e.UNSAFE_componentWillMount(), b !== e.state && Ei.enqueueReplaceState(e, e.state, null), qh(a, c, e, d), e.state = a.memoizedState);
  "function" === typeof e.componentDidMount && (a.flags |= 4194308);
}
function Ji(a, b) {
  try {
    var c = "", d = b;
    do
      c += Pa(d), d = d.return;
    while (d);
    var e = c;
  } catch (f2) {
    e = "\nError generating stack: " + f2.message + "\n" + f2.stack;
  }
  return { value: a, source: b, stack: e, digest: null };
}
function Ki(a, b, c) {
  return { value: a, source: null, stack: null != c ? c : null, digest: null != b ? b : null };
}
function Li(a, b) {
  try {
    console.error(b.value);
  } catch (c) {
    setTimeout(function() {
      throw c;
    });
  }
}
var Mi = "function" === typeof WeakMap ? WeakMap : Map;
function Ni(a, b, c) {
  c = mh(-1, c);
  c.tag = 3;
  c.payload = { element: null };
  var d = b.value;
  c.callback = function() {
    Oi || (Oi = true, Pi = d);
    Li(a, b);
  };
  return c;
}
function Qi(a, b, c) {
  c = mh(-1, c);
  c.tag = 3;
  var d = a.type.getDerivedStateFromError;
  if ("function" === typeof d) {
    var e = b.value;
    c.payload = function() {
      return d(e);
    };
    c.callback = function() {
      Li(a, b);
    };
  }
  var f2 = a.stateNode;
  null !== f2 && "function" === typeof f2.componentDidCatch && (c.callback = function() {
    Li(a, b);
    "function" !== typeof d && (null === Ri ? Ri = /* @__PURE__ */ new Set([this]) : Ri.add(this));
    var c2 = b.stack;
    this.componentDidCatch(b.value, { componentStack: null !== c2 ? c2 : "" });
  });
  return c;
}
function Si(a, b, c) {
  var d = a.pingCache;
  if (null === d) {
    d = a.pingCache = new Mi();
    var e = /* @__PURE__ */ new Set();
    d.set(b, e);
  } else e = d.get(b), void 0 === e && (e = /* @__PURE__ */ new Set(), d.set(b, e));
  e.has(c) || (e.add(c), a = Ti.bind(null, a, b, c), b.then(a, a));
}
function Ui(a) {
  do {
    var b;
    if (b = 13 === a.tag) b = a.memoizedState, b = null !== b ? null !== b.dehydrated ? true : false : true;
    if (b) return a;
    a = a.return;
  } while (null !== a);
  return null;
}
function Vi(a, b, c, d, e) {
  if (0 === (a.mode & 1)) return a === b ? a.flags |= 65536 : (a.flags |= 128, c.flags |= 131072, c.flags &= -52805, 1 === c.tag && (null === c.alternate ? c.tag = 17 : (b = mh(-1, 1), b.tag = 2, nh(c, b, 1))), c.lanes |= 1), a;
  a.flags |= 65536;
  a.lanes = e;
  return a;
}
var Wi = ua.ReactCurrentOwner, dh = false;
function Xi(a, b, c, d) {
  b.child = null === a ? Vg(b, null, c, d) : Ug(b, a.child, c, d);
}
function Yi(a, b, c, d, e) {
  c = c.render;
  var f2 = b.ref;
  ch(b, e);
  d = Nh(a, b, c, d, f2, e);
  c = Sh();
  if (null !== a && !dh) return b.updateQueue = a.updateQueue, b.flags &= -2053, a.lanes &= ~e, Zi(a, b, e);
  I && c && vg(b);
  b.flags |= 1;
  Xi(a, b, d, e);
  return b.child;
}
function $i(a, b, c, d, e) {
  if (null === a) {
    var f2 = c.type;
    if ("function" === typeof f2 && !aj(f2) && void 0 === f2.defaultProps && null === c.compare && void 0 === c.defaultProps) return b.tag = 15, b.type = f2, bj(a, b, f2, d, e);
    a = Rg(c.type, null, d, b, b.mode, e);
    a.ref = b.ref;
    a.return = b;
    return b.child = a;
  }
  f2 = a.child;
  if (0 === (a.lanes & e)) {
    var g = f2.memoizedProps;
    c = c.compare;
    c = null !== c ? c : Ie;
    if (c(g, d) && a.ref === b.ref) return Zi(a, b, e);
  }
  b.flags |= 1;
  a = Pg(f2, d);
  a.ref = b.ref;
  a.return = b;
  return b.child = a;
}
function bj(a, b, c, d, e) {
  if (null !== a) {
    var f2 = a.memoizedProps;
    if (Ie(f2, d) && a.ref === b.ref) if (dh = false, b.pendingProps = d = f2, 0 !== (a.lanes & e)) 0 !== (a.flags & 131072) && (dh = true);
    else return b.lanes = a.lanes, Zi(a, b, e);
  }
  return cj(a, b, c, d, e);
}
function dj(a, b, c) {
  var d = b.pendingProps, e = d.children, f2 = null !== a ? a.memoizedState : null;
  if ("hidden" === d.mode) if (0 === (b.mode & 1)) b.memoizedState = { baseLanes: 0, cachePool: null, transitions: null }, G(ej, fj), fj |= c;
  else {
    if (0 === (c & 1073741824)) return a = null !== f2 ? f2.baseLanes | c : c, b.lanes = b.childLanes = 1073741824, b.memoizedState = { baseLanes: a, cachePool: null, transitions: null }, b.updateQueue = null, G(ej, fj), fj |= a, null;
    b.memoizedState = { baseLanes: 0, cachePool: null, transitions: null };
    d = null !== f2 ? f2.baseLanes : c;
    G(ej, fj);
    fj |= d;
  }
  else null !== f2 ? (d = f2.baseLanes | c, b.memoizedState = null) : d = c, G(ej, fj), fj |= d;
  Xi(a, b, e, c);
  return b.child;
}
function gj(a, b) {
  var c = b.ref;
  if (null === a && null !== c || null !== a && a.ref !== c) b.flags |= 512, b.flags |= 2097152;
}
function cj(a, b, c, d, e) {
  var f2 = Zf(c) ? Xf : H.current;
  f2 = Yf(b, f2);
  ch(b, e);
  c = Nh(a, b, c, d, f2, e);
  d = Sh();
  if (null !== a && !dh) return b.updateQueue = a.updateQueue, b.flags &= -2053, a.lanes &= ~e, Zi(a, b, e);
  I && d && vg(b);
  b.flags |= 1;
  Xi(a, b, c, e);
  return b.child;
}
function hj(a, b, c, d, e) {
  if (Zf(c)) {
    var f2 = true;
    cg(b);
  } else f2 = false;
  ch(b, e);
  if (null === b.stateNode) ij(a, b), Gi(b, c, d), Ii(b, c, d, e), d = true;
  else if (null === a) {
    var g = b.stateNode, h = b.memoizedProps;
    g.props = h;
    var k2 = g.context, l2 = c.contextType;
    "object" === typeof l2 && null !== l2 ? l2 = eh(l2) : (l2 = Zf(c) ? Xf : H.current, l2 = Yf(b, l2));
    var m2 = c.getDerivedStateFromProps, q2 = "function" === typeof m2 || "function" === typeof g.getSnapshotBeforeUpdate;
    q2 || "function" !== typeof g.UNSAFE_componentWillReceiveProps && "function" !== typeof g.componentWillReceiveProps || (h !== d || k2 !== l2) && Hi(b, g, d, l2);
    jh = false;
    var r2 = b.memoizedState;
    g.state = r2;
    qh(b, d, g, e);
    k2 = b.memoizedState;
    h !== d || r2 !== k2 || Wf.current || jh ? ("function" === typeof m2 && (Di(b, c, m2, d), k2 = b.memoizedState), (h = jh || Fi(b, c, h, d, r2, k2, l2)) ? (q2 || "function" !== typeof g.UNSAFE_componentWillMount && "function" !== typeof g.componentWillMount || ("function" === typeof g.componentWillMount && g.componentWillMount(), "function" === typeof g.UNSAFE_componentWillMount && g.UNSAFE_componentWillMount()), "function" === typeof g.componentDidMount && (b.flags |= 4194308)) : ("function" === typeof g.componentDidMount && (b.flags |= 4194308), b.memoizedProps = d, b.memoizedState = k2), g.props = d, g.state = k2, g.context = l2, d = h) : ("function" === typeof g.componentDidMount && (b.flags |= 4194308), d = false);
  } else {
    g = b.stateNode;
    lh(a, b);
    h = b.memoizedProps;
    l2 = b.type === b.elementType ? h : Ci(b.type, h);
    g.props = l2;
    q2 = b.pendingProps;
    r2 = g.context;
    k2 = c.contextType;
    "object" === typeof k2 && null !== k2 ? k2 = eh(k2) : (k2 = Zf(c) ? Xf : H.current, k2 = Yf(b, k2));
    var y2 = c.getDerivedStateFromProps;
    (m2 = "function" === typeof y2 || "function" === typeof g.getSnapshotBeforeUpdate) || "function" !== typeof g.UNSAFE_componentWillReceiveProps && "function" !== typeof g.componentWillReceiveProps || (h !== q2 || r2 !== k2) && Hi(b, g, d, k2);
    jh = false;
    r2 = b.memoizedState;
    g.state = r2;
    qh(b, d, g, e);
    var n2 = b.memoizedState;
    h !== q2 || r2 !== n2 || Wf.current || jh ? ("function" === typeof y2 && (Di(b, c, y2, d), n2 = b.memoizedState), (l2 = jh || Fi(b, c, l2, d, r2, n2, k2) || false) ? (m2 || "function" !== typeof g.UNSAFE_componentWillUpdate && "function" !== typeof g.componentWillUpdate || ("function" === typeof g.componentWillUpdate && g.componentWillUpdate(d, n2, k2), "function" === typeof g.UNSAFE_componentWillUpdate && g.UNSAFE_componentWillUpdate(d, n2, k2)), "function" === typeof g.componentDidUpdate && (b.flags |= 4), "function" === typeof g.getSnapshotBeforeUpdate && (b.flags |= 1024)) : ("function" !== typeof g.componentDidUpdate || h === a.memoizedProps && r2 === a.memoizedState || (b.flags |= 4), "function" !== typeof g.getSnapshotBeforeUpdate || h === a.memoizedProps && r2 === a.memoizedState || (b.flags |= 1024), b.memoizedProps = d, b.memoizedState = n2), g.props = d, g.state = n2, g.context = k2, d = l2) : ("function" !== typeof g.componentDidUpdate || h === a.memoizedProps && r2 === a.memoizedState || (b.flags |= 4), "function" !== typeof g.getSnapshotBeforeUpdate || h === a.memoizedProps && r2 === a.memoizedState || (b.flags |= 1024), d = false);
  }
  return jj(a, b, c, d, f2, e);
}
function jj(a, b, c, d, e, f2) {
  gj(a, b);
  var g = 0 !== (b.flags & 128);
  if (!d && !g) return e && dg(b, c, false), Zi(a, b, f2);
  d = b.stateNode;
  Wi.current = b;
  var h = g && "function" !== typeof c.getDerivedStateFromError ? null : d.render();
  b.flags |= 1;
  null !== a && g ? (b.child = Ug(b, a.child, null, f2), b.child = Ug(b, null, h, f2)) : Xi(a, b, h, f2);
  b.memoizedState = d.state;
  e && dg(b, c, true);
  return b.child;
}
function kj(a) {
  var b = a.stateNode;
  b.pendingContext ? ag(a, b.pendingContext, b.pendingContext !== b.context) : b.context && ag(a, b.context, false);
  yh(a, b.containerInfo);
}
function lj(a, b, c, d, e) {
  Ig();
  Jg(e);
  b.flags |= 256;
  Xi(a, b, c, d);
  return b.child;
}
var mj = { dehydrated: null, treeContext: null, retryLane: 0 };
function nj(a) {
  return { baseLanes: a, cachePool: null, transitions: null };
}
function oj(a, b, c) {
  var d = b.pendingProps, e = L.current, f2 = false, g = 0 !== (b.flags & 128), h;
  (h = g) || (h = null !== a && null === a.memoizedState ? false : 0 !== (e & 2));
  if (h) f2 = true, b.flags &= -129;
  else if (null === a || null !== a.memoizedState) e |= 1;
  G(L, e & 1);
  if (null === a) {
    Eg(b);
    a = b.memoizedState;
    if (null !== a && (a = a.dehydrated, null !== a)) return 0 === (b.mode & 1) ? b.lanes = 1 : "$!" === a.data ? b.lanes = 8 : b.lanes = 1073741824, null;
    g = d.children;
    a = d.fallback;
    return f2 ? (d = b.mode, f2 = b.child, g = { mode: "hidden", children: g }, 0 === (d & 1) && null !== f2 ? (f2.childLanes = 0, f2.pendingProps = g) : f2 = pj(g, d, 0, null), a = Tg(a, d, c, null), f2.return = b, a.return = b, f2.sibling = a, b.child = f2, b.child.memoizedState = nj(c), b.memoizedState = mj, a) : qj(b, g);
  }
  e = a.memoizedState;
  if (null !== e && (h = e.dehydrated, null !== h)) return rj(a, b, g, d, h, e, c);
  if (f2) {
    f2 = d.fallback;
    g = b.mode;
    e = a.child;
    h = e.sibling;
    var k2 = { mode: "hidden", children: d.children };
    0 === (g & 1) && b.child !== e ? (d = b.child, d.childLanes = 0, d.pendingProps = k2, b.deletions = null) : (d = Pg(e, k2), d.subtreeFlags = e.subtreeFlags & 14680064);
    null !== h ? f2 = Pg(h, f2) : (f2 = Tg(f2, g, c, null), f2.flags |= 2);
    f2.return = b;
    d.return = b;
    d.sibling = f2;
    b.child = d;
    d = f2;
    f2 = b.child;
    g = a.child.memoizedState;
    g = null === g ? nj(c) : { baseLanes: g.baseLanes | c, cachePool: null, transitions: g.transitions };
    f2.memoizedState = g;
    f2.childLanes = a.childLanes & ~c;
    b.memoizedState = mj;
    return d;
  }
  f2 = a.child;
  a = f2.sibling;
  d = Pg(f2, { mode: "visible", children: d.children });
  0 === (b.mode & 1) && (d.lanes = c);
  d.return = b;
  d.sibling = null;
  null !== a && (c = b.deletions, null === c ? (b.deletions = [a], b.flags |= 16) : c.push(a));
  b.child = d;
  b.memoizedState = null;
  return d;
}
function qj(a, b) {
  b = pj({ mode: "visible", children: b }, a.mode, 0, null);
  b.return = a;
  return a.child = b;
}
function sj(a, b, c, d) {
  null !== d && Jg(d);
  Ug(b, a.child, null, c);
  a = qj(b, b.pendingProps.children);
  a.flags |= 2;
  b.memoizedState = null;
  return a;
}
function rj(a, b, c, d, e, f2, g) {
  if (c) {
    if (b.flags & 256) return b.flags &= -257, d = Ki(Error(p(422))), sj(a, b, g, d);
    if (null !== b.memoizedState) return b.child = a.child, b.flags |= 128, null;
    f2 = d.fallback;
    e = b.mode;
    d = pj({ mode: "visible", children: d.children }, e, 0, null);
    f2 = Tg(f2, e, g, null);
    f2.flags |= 2;
    d.return = b;
    f2.return = b;
    d.sibling = f2;
    b.child = d;
    0 !== (b.mode & 1) && Ug(b, a.child, null, g);
    b.child.memoizedState = nj(g);
    b.memoizedState = mj;
    return f2;
  }
  if (0 === (b.mode & 1)) return sj(a, b, g, null);
  if ("$!" === e.data) {
    d = e.nextSibling && e.nextSibling.dataset;
    if (d) var h = d.dgst;
    d = h;
    f2 = Error(p(419));
    d = Ki(f2, d, void 0);
    return sj(a, b, g, d);
  }
  h = 0 !== (g & a.childLanes);
  if (dh || h) {
    d = Q;
    if (null !== d) {
      switch (g & -g) {
        case 4:
          e = 2;
          break;
        case 16:
          e = 8;
          break;
        case 64:
        case 128:
        case 256:
        case 512:
        case 1024:
        case 2048:
        case 4096:
        case 8192:
        case 16384:
        case 32768:
        case 65536:
        case 131072:
        case 262144:
        case 524288:
        case 1048576:
        case 2097152:
        case 4194304:
        case 8388608:
        case 16777216:
        case 33554432:
        case 67108864:
          e = 32;
          break;
        case 536870912:
          e = 268435456;
          break;
        default:
          e = 0;
      }
      e = 0 !== (e & (d.suspendedLanes | g)) ? 0 : e;
      0 !== e && e !== f2.retryLane && (f2.retryLane = e, ih(a, e), gi(d, a, e, -1));
    }
    tj();
    d = Ki(Error(p(421)));
    return sj(a, b, g, d);
  }
  if ("$?" === e.data) return b.flags |= 128, b.child = a.child, b = uj.bind(null, a), e._reactRetry = b, null;
  a = f2.treeContext;
  yg = Lf(e.nextSibling);
  xg = b;
  I = true;
  zg = null;
  null !== a && (og[pg++] = rg, og[pg++] = sg, og[pg++] = qg, rg = a.id, sg = a.overflow, qg = b);
  b = qj(b, d.children);
  b.flags |= 4096;
  return b;
}
function vj(a, b, c) {
  a.lanes |= b;
  var d = a.alternate;
  null !== d && (d.lanes |= b);
  bh(a.return, b, c);
}
function wj(a, b, c, d, e) {
  var f2 = a.memoizedState;
  null === f2 ? a.memoizedState = { isBackwards: b, rendering: null, renderingStartTime: 0, last: d, tail: c, tailMode: e } : (f2.isBackwards = b, f2.rendering = null, f2.renderingStartTime = 0, f2.last = d, f2.tail = c, f2.tailMode = e);
}
function xj(a, b, c) {
  var d = b.pendingProps, e = d.revealOrder, f2 = d.tail;
  Xi(a, b, d.children, c);
  d = L.current;
  if (0 !== (d & 2)) d = d & 1 | 2, b.flags |= 128;
  else {
    if (null !== a && 0 !== (a.flags & 128)) a: for (a = b.child; null !== a; ) {
      if (13 === a.tag) null !== a.memoizedState && vj(a, c, b);
      else if (19 === a.tag) vj(a, c, b);
      else if (null !== a.child) {
        a.child.return = a;
        a = a.child;
        continue;
      }
      if (a === b) break a;
      for (; null === a.sibling; ) {
        if (null === a.return || a.return === b) break a;
        a = a.return;
      }
      a.sibling.return = a.return;
      a = a.sibling;
    }
    d &= 1;
  }
  G(L, d);
  if (0 === (b.mode & 1)) b.memoizedState = null;
  else switch (e) {
    case "forwards":
      c = b.child;
      for (e = null; null !== c; ) a = c.alternate, null !== a && null === Ch(a) && (e = c), c = c.sibling;
      c = e;
      null === c ? (e = b.child, b.child = null) : (e = c.sibling, c.sibling = null);
      wj(b, false, e, c, f2);
      break;
    case "backwards":
      c = null;
      e = b.child;
      for (b.child = null; null !== e; ) {
        a = e.alternate;
        if (null !== a && null === Ch(a)) {
          b.child = e;
          break;
        }
        a = e.sibling;
        e.sibling = c;
        c = e;
        e = a;
      }
      wj(b, true, c, null, f2);
      break;
    case "together":
      wj(b, false, null, null, void 0);
      break;
    default:
      b.memoizedState = null;
  }
  return b.child;
}
function ij(a, b) {
  0 === (b.mode & 1) && null !== a && (a.alternate = null, b.alternate = null, b.flags |= 2);
}
function Zi(a, b, c) {
  null !== a && (b.dependencies = a.dependencies);
  rh |= b.lanes;
  if (0 === (c & b.childLanes)) return null;
  if (null !== a && b.child !== a.child) throw Error(p(153));
  if (null !== b.child) {
    a = b.child;
    c = Pg(a, a.pendingProps);
    b.child = c;
    for (c.return = b; null !== a.sibling; ) a = a.sibling, c = c.sibling = Pg(a, a.pendingProps), c.return = b;
    c.sibling = null;
  }
  return b.child;
}
function yj(a, b, c) {
  switch (b.tag) {
    case 3:
      kj(b);
      Ig();
      break;
    case 5:
      Ah(b);
      break;
    case 1:
      Zf(b.type) && cg(b);
      break;
    case 4:
      yh(b, b.stateNode.containerInfo);
      break;
    case 10:
      var d = b.type._context, e = b.memoizedProps.value;
      G(Wg, d._currentValue);
      d._currentValue = e;
      break;
    case 13:
      d = b.memoizedState;
      if (null !== d) {
        if (null !== d.dehydrated) return G(L, L.current & 1), b.flags |= 128, null;
        if (0 !== (c & b.child.childLanes)) return oj(a, b, c);
        G(L, L.current & 1);
        a = Zi(a, b, c);
        return null !== a ? a.sibling : null;
      }
      G(L, L.current & 1);
      break;
    case 19:
      d = 0 !== (c & b.childLanes);
      if (0 !== (a.flags & 128)) {
        if (d) return xj(a, b, c);
        b.flags |= 128;
      }
      e = b.memoizedState;
      null !== e && (e.rendering = null, e.tail = null, e.lastEffect = null);
      G(L, L.current);
      if (d) break;
      else return null;
    case 22:
    case 23:
      return b.lanes = 0, dj(a, b, c);
  }
  return Zi(a, b, c);
}
var zj, Aj, Bj, Cj;
zj = function(a, b) {
  for (var c = b.child; null !== c; ) {
    if (5 === c.tag || 6 === c.tag) a.appendChild(c.stateNode);
    else if (4 !== c.tag && null !== c.child) {
      c.child.return = c;
      c = c.child;
      continue;
    }
    if (c === b) break;
    for (; null === c.sibling; ) {
      if (null === c.return || c.return === b) return;
      c = c.return;
    }
    c.sibling.return = c.return;
    c = c.sibling;
  }
};
Aj = function() {
};
Bj = function(a, b, c, d) {
  var e = a.memoizedProps;
  if (e !== d) {
    a = b.stateNode;
    xh(uh.current);
    var f2 = null;
    switch (c) {
      case "input":
        e = Ya(a, e);
        d = Ya(a, d);
        f2 = [];
        break;
      case "select":
        e = A({}, e, { value: void 0 });
        d = A({}, d, { value: void 0 });
        f2 = [];
        break;
      case "textarea":
        e = gb(a, e);
        d = gb(a, d);
        f2 = [];
        break;
      default:
        "function" !== typeof e.onClick && "function" === typeof d.onClick && (a.onclick = Bf);
    }
    ub(c, d);
    var g;
    c = null;
    for (l2 in e) if (!d.hasOwnProperty(l2) && e.hasOwnProperty(l2) && null != e[l2]) if ("style" === l2) {
      var h = e[l2];
      for (g in h) h.hasOwnProperty(g) && (c || (c = {}), c[g] = "");
    } else "dangerouslySetInnerHTML" !== l2 && "children" !== l2 && "suppressContentEditableWarning" !== l2 && "suppressHydrationWarning" !== l2 && "autoFocus" !== l2 && (ea.hasOwnProperty(l2) ? f2 || (f2 = []) : (f2 = f2 || []).push(l2, null));
    for (l2 in d) {
      var k2 = d[l2];
      h = null != e ? e[l2] : void 0;
      if (d.hasOwnProperty(l2) && k2 !== h && (null != k2 || null != h)) if ("style" === l2) if (h) {
        for (g in h) !h.hasOwnProperty(g) || k2 && k2.hasOwnProperty(g) || (c || (c = {}), c[g] = "");
        for (g in k2) k2.hasOwnProperty(g) && h[g] !== k2[g] && (c || (c = {}), c[g] = k2[g]);
      } else c || (f2 || (f2 = []), f2.push(
        l2,
        c
      )), c = k2;
      else "dangerouslySetInnerHTML" === l2 ? (k2 = k2 ? k2.__html : void 0, h = h ? h.__html : void 0, null != k2 && h !== k2 && (f2 = f2 || []).push(l2, k2)) : "children" === l2 ? "string" !== typeof k2 && "number" !== typeof k2 || (f2 = f2 || []).push(l2, "" + k2) : "suppressContentEditableWarning" !== l2 && "suppressHydrationWarning" !== l2 && (ea.hasOwnProperty(l2) ? (null != k2 && "onScroll" === l2 && D("scroll", a), f2 || h === k2 || (f2 = [])) : (f2 = f2 || []).push(l2, k2));
    }
    c && (f2 = f2 || []).push("style", c);
    var l2 = f2;
    if (b.updateQueue = l2) b.flags |= 4;
  }
};
Cj = function(a, b, c, d) {
  c !== d && (b.flags |= 4);
};
function Dj(a, b) {
  if (!I) switch (a.tailMode) {
    case "hidden":
      b = a.tail;
      for (var c = null; null !== b; ) null !== b.alternate && (c = b), b = b.sibling;
      null === c ? a.tail = null : c.sibling = null;
      break;
    case "collapsed":
      c = a.tail;
      for (var d = null; null !== c; ) null !== c.alternate && (d = c), c = c.sibling;
      null === d ? b || null === a.tail ? a.tail = null : a.tail.sibling = null : d.sibling = null;
  }
}
function S(a) {
  var b = null !== a.alternate && a.alternate.child === a.child, c = 0, d = 0;
  if (b) for (var e = a.child; null !== e; ) c |= e.lanes | e.childLanes, d |= e.subtreeFlags & 14680064, d |= e.flags & 14680064, e.return = a, e = e.sibling;
  else for (e = a.child; null !== e; ) c |= e.lanes | e.childLanes, d |= e.subtreeFlags, d |= e.flags, e.return = a, e = e.sibling;
  a.subtreeFlags |= d;
  a.childLanes = c;
  return b;
}
function Ej(a, b, c) {
  var d = b.pendingProps;
  wg(b);
  switch (b.tag) {
    case 2:
    case 16:
    case 15:
    case 0:
    case 11:
    case 7:
    case 8:
    case 12:
    case 9:
    case 14:
      return S(b), null;
    case 1:
      return Zf(b.type) && $f(), S(b), null;
    case 3:
      d = b.stateNode;
      zh();
      E(Wf);
      E(H);
      Eh();
      d.pendingContext && (d.context = d.pendingContext, d.pendingContext = null);
      if (null === a || null === a.child) Gg(b) ? b.flags |= 4 : null === a || a.memoizedState.isDehydrated && 0 === (b.flags & 256) || (b.flags |= 1024, null !== zg && (Fj(zg), zg = null));
      Aj(a, b);
      S(b);
      return null;
    case 5:
      Bh(b);
      var e = xh(wh.current);
      c = b.type;
      if (null !== a && null != b.stateNode) Bj(a, b, c, d, e), a.ref !== b.ref && (b.flags |= 512, b.flags |= 2097152);
      else {
        if (!d) {
          if (null === b.stateNode) throw Error(p(166));
          S(b);
          return null;
        }
        a = xh(uh.current);
        if (Gg(b)) {
          d = b.stateNode;
          c = b.type;
          var f2 = b.memoizedProps;
          d[Of] = b;
          d[Pf] = f2;
          a = 0 !== (b.mode & 1);
          switch (c) {
            case "dialog":
              D("cancel", d);
              D("close", d);
              break;
            case "iframe":
            case "object":
            case "embed":
              D("load", d);
              break;
            case "video":
            case "audio":
              for (e = 0; e < lf.length; e++) D(lf[e], d);
              break;
            case "source":
              D("error", d);
              break;
            case "img":
            case "image":
            case "link":
              D(
                "error",
                d
              );
              D("load", d);
              break;
            case "details":
              D("toggle", d);
              break;
            case "input":
              Za(d, f2);
              D("invalid", d);
              break;
            case "select":
              d._wrapperState = { wasMultiple: !!f2.multiple };
              D("invalid", d);
              break;
            case "textarea":
              hb(d, f2), D("invalid", d);
          }
          ub(c, f2);
          e = null;
          for (var g in f2) if (f2.hasOwnProperty(g)) {
            var h = f2[g];
            "children" === g ? "string" === typeof h ? d.textContent !== h && (true !== f2.suppressHydrationWarning && Af(d.textContent, h, a), e = ["children", h]) : "number" === typeof h && d.textContent !== "" + h && (true !== f2.suppressHydrationWarning && Af(
              d.textContent,
              h,
              a
            ), e = ["children", "" + h]) : ea.hasOwnProperty(g) && null != h && "onScroll" === g && D("scroll", d);
          }
          switch (c) {
            case "input":
              Va(d);
              db(d, f2, true);
              break;
            case "textarea":
              Va(d);
              jb(d);
              break;
            case "select":
            case "option":
              break;
            default:
              "function" === typeof f2.onClick && (d.onclick = Bf);
          }
          d = e;
          b.updateQueue = d;
          null !== d && (b.flags |= 4);
        } else {
          g = 9 === e.nodeType ? e : e.ownerDocument;
          "http://www.w3.org/1999/xhtml" === a && (a = kb(c));
          "http://www.w3.org/1999/xhtml" === a ? "script" === c ? (a = g.createElement("div"), a.innerHTML = "<script><\/script>", a = a.removeChild(a.firstChild)) : "string" === typeof d.is ? a = g.createElement(c, { is: d.is }) : (a = g.createElement(c), "select" === c && (g = a, d.multiple ? g.multiple = true : d.size && (g.size = d.size))) : a = g.createElementNS(a, c);
          a[Of] = b;
          a[Pf] = d;
          zj(a, b, false, false);
          b.stateNode = a;
          a: {
            g = vb(c, d);
            switch (c) {
              case "dialog":
                D("cancel", a);
                D("close", a);
                e = d;
                break;
              case "iframe":
              case "object":
              case "embed":
                D("load", a);
                e = d;
                break;
              case "video":
              case "audio":
                for (e = 0; e < lf.length; e++) D(lf[e], a);
                e = d;
                break;
              case "source":
                D("error", a);
                e = d;
                break;
              case "img":
              case "image":
              case "link":
                D(
                  "error",
                  a
                );
                D("load", a);
                e = d;
                break;
              case "details":
                D("toggle", a);
                e = d;
                break;
              case "input":
                Za(a, d);
                e = Ya(a, d);
                D("invalid", a);
                break;
              case "option":
                e = d;
                break;
              case "select":
                a._wrapperState = { wasMultiple: !!d.multiple };
                e = A({}, d, { value: void 0 });
                D("invalid", a);
                break;
              case "textarea":
                hb(a, d);
                e = gb(a, d);
                D("invalid", a);
                break;
              default:
                e = d;
            }
            ub(c, e);
            h = e;
            for (f2 in h) if (h.hasOwnProperty(f2)) {
              var k2 = h[f2];
              "style" === f2 ? sb(a, k2) : "dangerouslySetInnerHTML" === f2 ? (k2 = k2 ? k2.__html : void 0, null != k2 && nb(a, k2)) : "children" === f2 ? "string" === typeof k2 ? ("textarea" !== c || "" !== k2) && ob(a, k2) : "number" === typeof k2 && ob(a, "" + k2) : "suppressContentEditableWarning" !== f2 && "suppressHydrationWarning" !== f2 && "autoFocus" !== f2 && (ea.hasOwnProperty(f2) ? null != k2 && "onScroll" === f2 && D("scroll", a) : null != k2 && ta(a, f2, k2, g));
            }
            switch (c) {
              case "input":
                Va(a);
                db(a, d, false);
                break;
              case "textarea":
                Va(a);
                jb(a);
                break;
              case "option":
                null != d.value && a.setAttribute("value", "" + Sa(d.value));
                break;
              case "select":
                a.multiple = !!d.multiple;
                f2 = d.value;
                null != f2 ? fb(a, !!d.multiple, f2, false) : null != d.defaultValue && fb(
                  a,
                  !!d.multiple,
                  d.defaultValue,
                  true
                );
                break;
              default:
                "function" === typeof e.onClick && (a.onclick = Bf);
            }
            switch (c) {
              case "button":
              case "input":
              case "select":
              case "textarea":
                d = !!d.autoFocus;
                break a;
              case "img":
                d = true;
                break a;
              default:
                d = false;
            }
          }
          d && (b.flags |= 4);
        }
        null !== b.ref && (b.flags |= 512, b.flags |= 2097152);
      }
      S(b);
      return null;
    case 6:
      if (a && null != b.stateNode) Cj(a, b, a.memoizedProps, d);
      else {
        if ("string" !== typeof d && null === b.stateNode) throw Error(p(166));
        c = xh(wh.current);
        xh(uh.current);
        if (Gg(b)) {
          d = b.stateNode;
          c = b.memoizedProps;
          d[Of] = b;
          if (f2 = d.nodeValue !== c) {
            if (a = xg, null !== a) switch (a.tag) {
              case 3:
                Af(d.nodeValue, c, 0 !== (a.mode & 1));
                break;
              case 5:
                true !== a.memoizedProps.suppressHydrationWarning && Af(d.nodeValue, c, 0 !== (a.mode & 1));
            }
          }
          f2 && (b.flags |= 4);
        } else d = (9 === c.nodeType ? c : c.ownerDocument).createTextNode(d), d[Of] = b, b.stateNode = d;
      }
      S(b);
      return null;
    case 13:
      E(L);
      d = b.memoizedState;
      if (null === a || null !== a.memoizedState && null !== a.memoizedState.dehydrated) {
        if (I && null !== yg && 0 !== (b.mode & 1) && 0 === (b.flags & 128)) Hg(), Ig(), b.flags |= 98560, f2 = false;
        else if (f2 = Gg(b), null !== d && null !== d.dehydrated) {
          if (null === a) {
            if (!f2) throw Error(p(318));
            f2 = b.memoizedState;
            f2 = null !== f2 ? f2.dehydrated : null;
            if (!f2) throw Error(p(317));
            f2[Of] = b;
          } else Ig(), 0 === (b.flags & 128) && (b.memoizedState = null), b.flags |= 4;
          S(b);
          f2 = false;
        } else null !== zg && (Fj(zg), zg = null), f2 = true;
        if (!f2) return b.flags & 65536 ? b : null;
      }
      if (0 !== (b.flags & 128)) return b.lanes = c, b;
      d = null !== d;
      d !== (null !== a && null !== a.memoizedState) && d && (b.child.flags |= 8192, 0 !== (b.mode & 1) && (null === a || 0 !== (L.current & 1) ? 0 === T && (T = 3) : tj()));
      null !== b.updateQueue && (b.flags |= 4);
      S(b);
      return null;
    case 4:
      return zh(), Aj(a, b), null === a && sf(b.stateNode.containerInfo), S(b), null;
    case 10:
      return ah(b.type._context), S(b), null;
    case 17:
      return Zf(b.type) && $f(), S(b), null;
    case 19:
      E(L);
      f2 = b.memoizedState;
      if (null === f2) return S(b), null;
      d = 0 !== (b.flags & 128);
      g = f2.rendering;
      if (null === g) if (d) Dj(f2, false);
      else {
        if (0 !== T || null !== a && 0 !== (a.flags & 128)) for (a = b.child; null !== a; ) {
          g = Ch(a);
          if (null !== g) {
            b.flags |= 128;
            Dj(f2, false);
            d = g.updateQueue;
            null !== d && (b.updateQueue = d, b.flags |= 4);
            b.subtreeFlags = 0;
            d = c;
            for (c = b.child; null !== c; ) f2 = c, a = d, f2.flags &= 14680066, g = f2.alternate, null === g ? (f2.childLanes = 0, f2.lanes = a, f2.child = null, f2.subtreeFlags = 0, f2.memoizedProps = null, f2.memoizedState = null, f2.updateQueue = null, f2.dependencies = null, f2.stateNode = null) : (f2.childLanes = g.childLanes, f2.lanes = g.lanes, f2.child = g.child, f2.subtreeFlags = 0, f2.deletions = null, f2.memoizedProps = g.memoizedProps, f2.memoizedState = g.memoizedState, f2.updateQueue = g.updateQueue, f2.type = g.type, a = g.dependencies, f2.dependencies = null === a ? null : { lanes: a.lanes, firstContext: a.firstContext }), c = c.sibling;
            G(L, L.current & 1 | 2);
            return b.child;
          }
          a = a.sibling;
        }
        null !== f2.tail && B() > Gj && (b.flags |= 128, d = true, Dj(f2, false), b.lanes = 4194304);
      }
      else {
        if (!d) if (a = Ch(g), null !== a) {
          if (b.flags |= 128, d = true, c = a.updateQueue, null !== c && (b.updateQueue = c, b.flags |= 4), Dj(f2, true), null === f2.tail && "hidden" === f2.tailMode && !g.alternate && !I) return S(b), null;
        } else 2 * B() - f2.renderingStartTime > Gj && 1073741824 !== c && (b.flags |= 128, d = true, Dj(f2, false), b.lanes = 4194304);
        f2.isBackwards ? (g.sibling = b.child, b.child = g) : (c = f2.last, null !== c ? c.sibling = g : b.child = g, f2.last = g);
      }
      if (null !== f2.tail) return b = f2.tail, f2.rendering = b, f2.tail = b.sibling, f2.renderingStartTime = B(), b.sibling = null, c = L.current, G(L, d ? c & 1 | 2 : c & 1), b;
      S(b);
      return null;
    case 22:
    case 23:
      return Hj(), d = null !== b.memoizedState, null !== a && null !== a.memoizedState !== d && (b.flags |= 8192), d && 0 !== (b.mode & 1) ? 0 !== (fj & 1073741824) && (S(b), b.subtreeFlags & 6 && (b.flags |= 8192)) : S(b), null;
    case 24:
      return null;
    case 25:
      return null;
  }
  throw Error(p(156, b.tag));
}
function Ij(a, b) {
  wg(b);
  switch (b.tag) {
    case 1:
      return Zf(b.type) && $f(), a = b.flags, a & 65536 ? (b.flags = a & -65537 | 128, b) : null;
    case 3:
      return zh(), E(Wf), E(H), Eh(), a = b.flags, 0 !== (a & 65536) && 0 === (a & 128) ? (b.flags = a & -65537 | 128, b) : null;
    case 5:
      return Bh(b), null;
    case 13:
      E(L);
      a = b.memoizedState;
      if (null !== a && null !== a.dehydrated) {
        if (null === b.alternate) throw Error(p(340));
        Ig();
      }
      a = b.flags;
      return a & 65536 ? (b.flags = a & -65537 | 128, b) : null;
    case 19:
      return E(L), null;
    case 4:
      return zh(), null;
    case 10:
      return ah(b.type._context), null;
    case 22:
    case 23:
      return Hj(), null;
    case 24:
      return null;
    default:
      return null;
  }
}
var Jj = false, U = false, Kj = "function" === typeof WeakSet ? WeakSet : Set, V = null;
function Lj(a, b) {
  var c = a.ref;
  if (null !== c) if ("function" === typeof c) try {
    c(null);
  } catch (d) {
    W(a, b, d);
  }
  else c.current = null;
}
function Mj(a, b, c) {
  try {
    c();
  } catch (d) {
    W(a, b, d);
  }
}
var Nj = false;
function Oj(a, b) {
  Cf = dd;
  a = Me();
  if (Ne(a)) {
    if ("selectionStart" in a) var c = { start: a.selectionStart, end: a.selectionEnd };
    else a: {
      c = (c = a.ownerDocument) && c.defaultView || window;
      var d = c.getSelection && c.getSelection();
      if (d && 0 !== d.rangeCount) {
        c = d.anchorNode;
        var e = d.anchorOffset, f2 = d.focusNode;
        d = d.focusOffset;
        try {
          c.nodeType, f2.nodeType;
        } catch (F2) {
          c = null;
          break a;
        }
        var g = 0, h = -1, k2 = -1, l2 = 0, m2 = 0, q2 = a, r2 = null;
        b: for (; ; ) {
          for (var y2; ; ) {
            q2 !== c || 0 !== e && 3 !== q2.nodeType || (h = g + e);
            q2 !== f2 || 0 !== d && 3 !== q2.nodeType || (k2 = g + d);
            3 === q2.nodeType && (g += q2.nodeValue.length);
            if (null === (y2 = q2.firstChild)) break;
            r2 = q2;
            q2 = y2;
          }
          for (; ; ) {
            if (q2 === a) break b;
            r2 === c && ++l2 === e && (h = g);
            r2 === f2 && ++m2 === d && (k2 = g);
            if (null !== (y2 = q2.nextSibling)) break;
            q2 = r2;
            r2 = q2.parentNode;
          }
          q2 = y2;
        }
        c = -1 === h || -1 === k2 ? null : { start: h, end: k2 };
      } else c = null;
    }
    c = c || { start: 0, end: 0 };
  } else c = null;
  Df = { focusedElem: a, selectionRange: c };
  dd = false;
  for (V = b; null !== V; ) if (b = V, a = b.child, 0 !== (b.subtreeFlags & 1028) && null !== a) a.return = b, V = a;
  else for (; null !== V; ) {
    b = V;
    try {
      var n2 = b.alternate;
      if (0 !== (b.flags & 1024)) switch (b.tag) {
        case 0:
        case 11:
        case 15:
          break;
        case 1:
          if (null !== n2) {
            var t2 = n2.memoizedProps, J2 = n2.memoizedState, x2 = b.stateNode, w2 = x2.getSnapshotBeforeUpdate(b.elementType === b.type ? t2 : Ci(b.type, t2), J2);
            x2.__reactInternalSnapshotBeforeUpdate = w2;
          }
          break;
        case 3:
          var u2 = b.stateNode.containerInfo;
          1 === u2.nodeType ? u2.textContent = "" : 9 === u2.nodeType && u2.documentElement && u2.removeChild(u2.documentElement);
          break;
        case 5:
        case 6:
        case 4:
        case 17:
          break;
        default:
          throw Error(p(163));
      }
    } catch (F2) {
      W(b, b.return, F2);
    }
    a = b.sibling;
    if (null !== a) {
      a.return = b.return;
      V = a;
      break;
    }
    V = b.return;
  }
  n2 = Nj;
  Nj = false;
  return n2;
}
function Pj(a, b, c) {
  var d = b.updateQueue;
  d = null !== d ? d.lastEffect : null;
  if (null !== d) {
    var e = d = d.next;
    do {
      if ((e.tag & a) === a) {
        var f2 = e.destroy;
        e.destroy = void 0;
        void 0 !== f2 && Mj(b, c, f2);
      }
      e = e.next;
    } while (e !== d);
  }
}
function Qj(a, b) {
  b = b.updateQueue;
  b = null !== b ? b.lastEffect : null;
  if (null !== b) {
    var c = b = b.next;
    do {
      if ((c.tag & a) === a) {
        var d = c.create;
        c.destroy = d();
      }
      c = c.next;
    } while (c !== b);
  }
}
function Rj(a) {
  var b = a.ref;
  if (null !== b) {
    var c = a.stateNode;
    switch (a.tag) {
      case 5:
        a = c;
        break;
      default:
        a = c;
    }
    "function" === typeof b ? b(a) : b.current = a;
  }
}
function Sj(a) {
  var b = a.alternate;
  null !== b && (a.alternate = null, Sj(b));
  a.child = null;
  a.deletions = null;
  a.sibling = null;
  5 === a.tag && (b = a.stateNode, null !== b && (delete b[Of], delete b[Pf], delete b[of], delete b[Qf], delete b[Rf]));
  a.stateNode = null;
  a.return = null;
  a.dependencies = null;
  a.memoizedProps = null;
  a.memoizedState = null;
  a.pendingProps = null;
  a.stateNode = null;
  a.updateQueue = null;
}
function Tj(a) {
  return 5 === a.tag || 3 === a.tag || 4 === a.tag;
}
function Uj(a) {
  a: for (; ; ) {
    for (; null === a.sibling; ) {
      if (null === a.return || Tj(a.return)) return null;
      a = a.return;
    }
    a.sibling.return = a.return;
    for (a = a.sibling; 5 !== a.tag && 6 !== a.tag && 18 !== a.tag; ) {
      if (a.flags & 2) continue a;
      if (null === a.child || 4 === a.tag) continue a;
      else a.child.return = a, a = a.child;
    }
    if (!(a.flags & 2)) return a.stateNode;
  }
}
function Vj(a, b, c) {
  var d = a.tag;
  if (5 === d || 6 === d) a = a.stateNode, b ? 8 === c.nodeType ? c.parentNode.insertBefore(a, b) : c.insertBefore(a, b) : (8 === c.nodeType ? (b = c.parentNode, b.insertBefore(a, c)) : (b = c, b.appendChild(a)), c = c._reactRootContainer, null !== c && void 0 !== c || null !== b.onclick || (b.onclick = Bf));
  else if (4 !== d && (a = a.child, null !== a)) for (Vj(a, b, c), a = a.sibling; null !== a; ) Vj(a, b, c), a = a.sibling;
}
function Wj(a, b, c) {
  var d = a.tag;
  if (5 === d || 6 === d) a = a.stateNode, b ? c.insertBefore(a, b) : c.appendChild(a);
  else if (4 !== d && (a = a.child, null !== a)) for (Wj(a, b, c), a = a.sibling; null !== a; ) Wj(a, b, c), a = a.sibling;
}
var X = null, Xj = false;
function Yj(a, b, c) {
  for (c = c.child; null !== c; ) Zj(a, b, c), c = c.sibling;
}
function Zj(a, b, c) {
  if (lc && "function" === typeof lc.onCommitFiberUnmount) try {
    lc.onCommitFiberUnmount(kc, c);
  } catch (h) {
  }
  switch (c.tag) {
    case 5:
      U || Lj(c, b);
    case 6:
      var d = X, e = Xj;
      X = null;
      Yj(a, b, c);
      X = d;
      Xj = e;
      null !== X && (Xj ? (a = X, c = c.stateNode, 8 === a.nodeType ? a.parentNode.removeChild(c) : a.removeChild(c)) : X.removeChild(c.stateNode));
      break;
    case 18:
      null !== X && (Xj ? (a = X, c = c.stateNode, 8 === a.nodeType ? Kf(a.parentNode, c) : 1 === a.nodeType && Kf(a, c), bd(a)) : Kf(X, c.stateNode));
      break;
    case 4:
      d = X;
      e = Xj;
      X = c.stateNode.containerInfo;
      Xj = true;
      Yj(a, b, c);
      X = d;
      Xj = e;
      break;
    case 0:
    case 11:
    case 14:
    case 15:
      if (!U && (d = c.updateQueue, null !== d && (d = d.lastEffect, null !== d))) {
        e = d = d.next;
        do {
          var f2 = e, g = f2.destroy;
          f2 = f2.tag;
          void 0 !== g && (0 !== (f2 & 2) ? Mj(c, b, g) : 0 !== (f2 & 4) && Mj(c, b, g));
          e = e.next;
        } while (e !== d);
      }
      Yj(a, b, c);
      break;
    case 1:
      if (!U && (Lj(c, b), d = c.stateNode, "function" === typeof d.componentWillUnmount)) try {
        d.props = c.memoizedProps, d.state = c.memoizedState, d.componentWillUnmount();
      } catch (h) {
        W(c, b, h);
      }
      Yj(a, b, c);
      break;
    case 21:
      Yj(a, b, c);
      break;
    case 22:
      c.mode & 1 ? (U = (d = U) || null !== c.memoizedState, Yj(a, b, c), U = d) : Yj(a, b, c);
      break;
    default:
      Yj(a, b, c);
  }
}
function ak(a) {
  var b = a.updateQueue;
  if (null !== b) {
    a.updateQueue = null;
    var c = a.stateNode;
    null === c && (c = a.stateNode = new Kj());
    b.forEach(function(b2) {
      var d = bk.bind(null, a, b2);
      c.has(b2) || (c.add(b2), b2.then(d, d));
    });
  }
}
function ck(a, b) {
  var c = b.deletions;
  if (null !== c) for (var d = 0; d < c.length; d++) {
    var e = c[d];
    try {
      var f2 = a, g = b, h = g;
      a: for (; null !== h; ) {
        switch (h.tag) {
          case 5:
            X = h.stateNode;
            Xj = false;
            break a;
          case 3:
            X = h.stateNode.containerInfo;
            Xj = true;
            break a;
          case 4:
            X = h.stateNode.containerInfo;
            Xj = true;
            break a;
        }
        h = h.return;
      }
      if (null === X) throw Error(p(160));
      Zj(f2, g, e);
      X = null;
      Xj = false;
      var k2 = e.alternate;
      null !== k2 && (k2.return = null);
      e.return = null;
    } catch (l2) {
      W(e, b, l2);
    }
  }
  if (b.subtreeFlags & 12854) for (b = b.child; null !== b; ) dk(b, a), b = b.sibling;
}
function dk(a, b) {
  var c = a.alternate, d = a.flags;
  switch (a.tag) {
    case 0:
    case 11:
    case 14:
    case 15:
      ck(b, a);
      ek(a);
      if (d & 4) {
        try {
          Pj(3, a, a.return), Qj(3, a);
        } catch (t2) {
          W(a, a.return, t2);
        }
        try {
          Pj(5, a, a.return);
        } catch (t2) {
          W(a, a.return, t2);
        }
      }
      break;
    case 1:
      ck(b, a);
      ek(a);
      d & 512 && null !== c && Lj(c, c.return);
      break;
    case 5:
      ck(b, a);
      ek(a);
      d & 512 && null !== c && Lj(c, c.return);
      if (a.flags & 32) {
        var e = a.stateNode;
        try {
          ob(e, "");
        } catch (t2) {
          W(a, a.return, t2);
        }
      }
      if (d & 4 && (e = a.stateNode, null != e)) {
        var f2 = a.memoizedProps, g = null !== c ? c.memoizedProps : f2, h = a.type, k2 = a.updateQueue;
        a.updateQueue = null;
        if (null !== k2) try {
          "input" === h && "radio" === f2.type && null != f2.name && ab(e, f2);
          vb(h, g);
          var l2 = vb(h, f2);
          for (g = 0; g < k2.length; g += 2) {
            var m2 = k2[g], q2 = k2[g + 1];
            "style" === m2 ? sb(e, q2) : "dangerouslySetInnerHTML" === m2 ? nb(e, q2) : "children" === m2 ? ob(e, q2) : ta(e, m2, q2, l2);
          }
          switch (h) {
            case "input":
              bb(e, f2);
              break;
            case "textarea":
              ib(e, f2);
              break;
            case "select":
              var r2 = e._wrapperState.wasMultiple;
              e._wrapperState.wasMultiple = !!f2.multiple;
              var y2 = f2.value;
              null != y2 ? fb(e, !!f2.multiple, y2, false) : r2 !== !!f2.multiple && (null != f2.defaultValue ? fb(
                e,
                !!f2.multiple,
                f2.defaultValue,
                true
              ) : fb(e, !!f2.multiple, f2.multiple ? [] : "", false));
          }
          e[Pf] = f2;
        } catch (t2) {
          W(a, a.return, t2);
        }
      }
      break;
    case 6:
      ck(b, a);
      ek(a);
      if (d & 4) {
        if (null === a.stateNode) throw Error(p(162));
        e = a.stateNode;
        f2 = a.memoizedProps;
        try {
          e.nodeValue = f2;
        } catch (t2) {
          W(a, a.return, t2);
        }
      }
      break;
    case 3:
      ck(b, a);
      ek(a);
      if (d & 4 && null !== c && c.memoizedState.isDehydrated) try {
        bd(b.containerInfo);
      } catch (t2) {
        W(a, a.return, t2);
      }
      break;
    case 4:
      ck(b, a);
      ek(a);
      break;
    case 13:
      ck(b, a);
      ek(a);
      e = a.child;
      e.flags & 8192 && (f2 = null !== e.memoizedState, e.stateNode.isHidden = f2, !f2 || null !== e.alternate && null !== e.alternate.memoizedState || (fk = B()));
      d & 4 && ak(a);
      break;
    case 22:
      m2 = null !== c && null !== c.memoizedState;
      a.mode & 1 ? (U = (l2 = U) || m2, ck(b, a), U = l2) : ck(b, a);
      ek(a);
      if (d & 8192) {
        l2 = null !== a.memoizedState;
        if ((a.stateNode.isHidden = l2) && !m2 && 0 !== (a.mode & 1)) for (V = a, m2 = a.child; null !== m2; ) {
          for (q2 = V = m2; null !== V; ) {
            r2 = V;
            y2 = r2.child;
            switch (r2.tag) {
              case 0:
              case 11:
              case 14:
              case 15:
                Pj(4, r2, r2.return);
                break;
              case 1:
                Lj(r2, r2.return);
                var n2 = r2.stateNode;
                if ("function" === typeof n2.componentWillUnmount) {
                  d = r2;
                  c = r2.return;
                  try {
                    b = d, n2.props = b.memoizedProps, n2.state = b.memoizedState, n2.componentWillUnmount();
                  } catch (t2) {
                    W(d, c, t2);
                  }
                }
                break;
              case 5:
                Lj(r2, r2.return);
                break;
              case 22:
                if (null !== r2.memoizedState) {
                  gk(q2);
                  continue;
                }
            }
            null !== y2 ? (y2.return = r2, V = y2) : gk(q2);
          }
          m2 = m2.sibling;
        }
        a: for (m2 = null, q2 = a; ; ) {
          if (5 === q2.tag) {
            if (null === m2) {
              m2 = q2;
              try {
                e = q2.stateNode, l2 ? (f2 = e.style, "function" === typeof f2.setProperty ? f2.setProperty("display", "none", "important") : f2.display = "none") : (h = q2.stateNode, k2 = q2.memoizedProps.style, g = void 0 !== k2 && null !== k2 && k2.hasOwnProperty("display") ? k2.display : null, h.style.display = rb("display", g));
              } catch (t2) {
                W(a, a.return, t2);
              }
            }
          } else if (6 === q2.tag) {
            if (null === m2) try {
              q2.stateNode.nodeValue = l2 ? "" : q2.memoizedProps;
            } catch (t2) {
              W(a, a.return, t2);
            }
          } else if ((22 !== q2.tag && 23 !== q2.tag || null === q2.memoizedState || q2 === a) && null !== q2.child) {
            q2.child.return = q2;
            q2 = q2.child;
            continue;
          }
          if (q2 === a) break a;
          for (; null === q2.sibling; ) {
            if (null === q2.return || q2.return === a) break a;
            m2 === q2 && (m2 = null);
            q2 = q2.return;
          }
          m2 === q2 && (m2 = null);
          q2.sibling.return = q2.return;
          q2 = q2.sibling;
        }
      }
      break;
    case 19:
      ck(b, a);
      ek(a);
      d & 4 && ak(a);
      break;
    case 21:
      break;
    default:
      ck(
        b,
        a
      ), ek(a);
  }
}
function ek(a) {
  var b = a.flags;
  if (b & 2) {
    try {
      a: {
        for (var c = a.return; null !== c; ) {
          if (Tj(c)) {
            var d = c;
            break a;
          }
          c = c.return;
        }
        throw Error(p(160));
      }
      switch (d.tag) {
        case 5:
          var e = d.stateNode;
          d.flags & 32 && (ob(e, ""), d.flags &= -33);
          var f2 = Uj(a);
          Wj(a, f2, e);
          break;
        case 3:
        case 4:
          var g = d.stateNode.containerInfo, h = Uj(a);
          Vj(a, h, g);
          break;
        default:
          throw Error(p(161));
      }
    } catch (k2) {
      W(a, a.return, k2);
    }
    a.flags &= -3;
  }
  b & 4096 && (a.flags &= -4097);
}
function hk(a, b, c) {
  V = a;
  ik(a);
}
function ik(a, b, c) {
  for (var d = 0 !== (a.mode & 1); null !== V; ) {
    var e = V, f2 = e.child;
    if (22 === e.tag && d) {
      var g = null !== e.memoizedState || Jj;
      if (!g) {
        var h = e.alternate, k2 = null !== h && null !== h.memoizedState || U;
        h = Jj;
        var l2 = U;
        Jj = g;
        if ((U = k2) && !l2) for (V = e; null !== V; ) g = V, k2 = g.child, 22 === g.tag && null !== g.memoizedState ? jk(e) : null !== k2 ? (k2.return = g, V = k2) : jk(e);
        for (; null !== f2; ) V = f2, ik(f2), f2 = f2.sibling;
        V = e;
        Jj = h;
        U = l2;
      }
      kk(a);
    } else 0 !== (e.subtreeFlags & 8772) && null !== f2 ? (f2.return = e, V = f2) : kk(a);
  }
}
function kk(a) {
  for (; null !== V; ) {
    var b = V;
    if (0 !== (b.flags & 8772)) {
      var c = b.alternate;
      try {
        if (0 !== (b.flags & 8772)) switch (b.tag) {
          case 0:
          case 11:
          case 15:
            U || Qj(5, b);
            break;
          case 1:
            var d = b.stateNode;
            if (b.flags & 4 && !U) if (null === c) d.componentDidMount();
            else {
              var e = b.elementType === b.type ? c.memoizedProps : Ci(b.type, c.memoizedProps);
              d.componentDidUpdate(e, c.memoizedState, d.__reactInternalSnapshotBeforeUpdate);
            }
            var f2 = b.updateQueue;
            null !== f2 && sh(b, f2, d);
            break;
          case 3:
            var g = b.updateQueue;
            if (null !== g) {
              c = null;
              if (null !== b.child) switch (b.child.tag) {
                case 5:
                  c = b.child.stateNode;
                  break;
                case 1:
                  c = b.child.stateNode;
              }
              sh(b, g, c);
            }
            break;
          case 5:
            var h = b.stateNode;
            if (null === c && b.flags & 4) {
              c = h;
              var k2 = b.memoizedProps;
              switch (b.type) {
                case "button":
                case "input":
                case "select":
                case "textarea":
                  k2.autoFocus && c.focus();
                  break;
                case "img":
                  k2.src && (c.src = k2.src);
              }
            }
            break;
          case 6:
            break;
          case 4:
            break;
          case 12:
            break;
          case 13:
            if (null === b.memoizedState) {
              var l2 = b.alternate;
              if (null !== l2) {
                var m2 = l2.memoizedState;
                if (null !== m2) {
                  var q2 = m2.dehydrated;
                  null !== q2 && bd(q2);
                }
              }
            }
            break;
          case 19:
          case 17:
          case 21:
          case 22:
          case 23:
          case 25:
            break;
          default:
            throw Error(p(163));
        }
        U || b.flags & 512 && Rj(b);
      } catch (r2) {
        W(b, b.return, r2);
      }
    }
    if (b === a) {
      V = null;
      break;
    }
    c = b.sibling;
    if (null !== c) {
      c.return = b.return;
      V = c;
      break;
    }
    V = b.return;
  }
}
function gk(a) {
  for (; null !== V; ) {
    var b = V;
    if (b === a) {
      V = null;
      break;
    }
    var c = b.sibling;
    if (null !== c) {
      c.return = b.return;
      V = c;
      break;
    }
    V = b.return;
  }
}
function jk(a) {
  for (; null !== V; ) {
    var b = V;
    try {
      switch (b.tag) {
        case 0:
        case 11:
        case 15:
          var c = b.return;
          try {
            Qj(4, b);
          } catch (k2) {
            W(b, c, k2);
          }
          break;
        case 1:
          var d = b.stateNode;
          if ("function" === typeof d.componentDidMount) {
            var e = b.return;
            try {
              d.componentDidMount();
            } catch (k2) {
              W(b, e, k2);
            }
          }
          var f2 = b.return;
          try {
            Rj(b);
          } catch (k2) {
            W(b, f2, k2);
          }
          break;
        case 5:
          var g = b.return;
          try {
            Rj(b);
          } catch (k2) {
            W(b, g, k2);
          }
      }
    } catch (k2) {
      W(b, b.return, k2);
    }
    if (b === a) {
      V = null;
      break;
    }
    var h = b.sibling;
    if (null !== h) {
      h.return = b.return;
      V = h;
      break;
    }
    V = b.return;
  }
}
var lk = Math.ceil, mk = ua.ReactCurrentDispatcher, nk = ua.ReactCurrentOwner, ok = ua.ReactCurrentBatchConfig, K = 0, Q = null, Y = null, Z = 0, fj = 0, ej = Uf(0), T = 0, pk = null, rh = 0, qk = 0, rk = 0, sk = null, tk = null, fk = 0, Gj = Infinity, uk = null, Oi = false, Pi = null, Ri = null, vk = false, wk = null, xk = 0, yk = 0, zk = null, Ak = -1, Bk = 0;
function R() {
  return 0 !== (K & 6) ? B() : -1 !== Ak ? Ak : Ak = B();
}
function yi(a) {
  if (0 === (a.mode & 1)) return 1;
  if (0 !== (K & 2) && 0 !== Z) return Z & -Z;
  if (null !== Kg.transition) return 0 === Bk && (Bk = yc()), Bk;
  a = C;
  if (0 !== a) return a;
  a = window.event;
  a = void 0 === a ? 16 : jd(a.type);
  return a;
}
function gi(a, b, c, d) {
  if (50 < yk) throw yk = 0, zk = null, Error(p(185));
  Ac(a, c, d);
  if (0 === (K & 2) || a !== Q) a === Q && (0 === (K & 2) && (qk |= c), 4 === T && Ck(a, Z)), Dk(a, d), 1 === c && 0 === K && 0 === (b.mode & 1) && (Gj = B() + 500, fg && jg());
}
function Dk(a, b) {
  var c = a.callbackNode;
  wc(a, b);
  var d = uc(a, a === Q ? Z : 0);
  if (0 === d) null !== c && bc(c), a.callbackNode = null, a.callbackPriority = 0;
  else if (b = d & -d, a.callbackPriority !== b) {
    null != c && bc(c);
    if (1 === b) 0 === a.tag ? ig(Ek.bind(null, a)) : hg(Ek.bind(null, a)), Jf(function() {
      0 === (K & 6) && jg();
    }), c = null;
    else {
      switch (Dc(d)) {
        case 1:
          c = fc;
          break;
        case 4:
          c = gc;
          break;
        case 16:
          c = hc;
          break;
        case 536870912:
          c = jc;
          break;
        default:
          c = hc;
      }
      c = Fk(c, Gk.bind(null, a));
    }
    a.callbackPriority = b;
    a.callbackNode = c;
  }
}
function Gk(a, b) {
  Ak = -1;
  Bk = 0;
  if (0 !== (K & 6)) throw Error(p(327));
  var c = a.callbackNode;
  if (Hk() && a.callbackNode !== c) return null;
  var d = uc(a, a === Q ? Z : 0);
  if (0 === d) return null;
  if (0 !== (d & 30) || 0 !== (d & a.expiredLanes) || b) b = Ik(a, d);
  else {
    b = d;
    var e = K;
    K |= 2;
    var f2 = Jk();
    if (Q !== a || Z !== b) uk = null, Gj = B() + 500, Kk(a, b);
    do
      try {
        Lk();
        break;
      } catch (h) {
        Mk(a, h);
      }
    while (1);
    $g();
    mk.current = f2;
    K = e;
    null !== Y ? b = 0 : (Q = null, Z = 0, b = T);
  }
  if (0 !== b) {
    2 === b && (e = xc(a), 0 !== e && (d = e, b = Nk(a, e)));
    if (1 === b) throw c = pk, Kk(a, 0), Ck(a, d), Dk(a, B()), c;
    if (6 === b) Ck(a, d);
    else {
      e = a.current.alternate;
      if (0 === (d & 30) && !Ok(e) && (b = Ik(a, d), 2 === b && (f2 = xc(a), 0 !== f2 && (d = f2, b = Nk(a, f2))), 1 === b)) throw c = pk, Kk(a, 0), Ck(a, d), Dk(a, B()), c;
      a.finishedWork = e;
      a.finishedLanes = d;
      switch (b) {
        case 0:
        case 1:
          throw Error(p(345));
        case 2:
          Pk(a, tk, uk);
          break;
        case 3:
          Ck(a, d);
          if ((d & 130023424) === d && (b = fk + 500 - B(), 10 < b)) {
            if (0 !== uc(a, 0)) break;
            e = a.suspendedLanes;
            if ((e & d) !== d) {
              R();
              a.pingedLanes |= a.suspendedLanes & e;
              break;
            }
            a.timeoutHandle = Ff(Pk.bind(null, a, tk, uk), b);
            break;
          }
          Pk(a, tk, uk);
          break;
        case 4:
          Ck(a, d);
          if ((d & 4194240) === d) break;
          b = a.eventTimes;
          for (e = -1; 0 < d; ) {
            var g = 31 - oc(d);
            f2 = 1 << g;
            g = b[g];
            g > e && (e = g);
            d &= ~f2;
          }
          d = e;
          d = B() - d;
          d = (120 > d ? 120 : 480 > d ? 480 : 1080 > d ? 1080 : 1920 > d ? 1920 : 3e3 > d ? 3e3 : 4320 > d ? 4320 : 1960 * lk(d / 1960)) - d;
          if (10 < d) {
            a.timeoutHandle = Ff(Pk.bind(null, a, tk, uk), d);
            break;
          }
          Pk(a, tk, uk);
          break;
        case 5:
          Pk(a, tk, uk);
          break;
        default:
          throw Error(p(329));
      }
    }
  }
  Dk(a, B());
  return a.callbackNode === c ? Gk.bind(null, a) : null;
}
function Nk(a, b) {
  var c = sk;
  a.current.memoizedState.isDehydrated && (Kk(a, b).flags |= 256);
  a = Ik(a, b);
  2 !== a && (b = tk, tk = c, null !== b && Fj(b));
  return a;
}
function Fj(a) {
  null === tk ? tk = a : tk.push.apply(tk, a);
}
function Ok(a) {
  for (var b = a; ; ) {
    if (b.flags & 16384) {
      var c = b.updateQueue;
      if (null !== c && (c = c.stores, null !== c)) for (var d = 0; d < c.length; d++) {
        var e = c[d], f2 = e.getSnapshot;
        e = e.value;
        try {
          if (!He(f2(), e)) return false;
        } catch (g) {
          return false;
        }
      }
    }
    c = b.child;
    if (b.subtreeFlags & 16384 && null !== c) c.return = b, b = c;
    else {
      if (b === a) break;
      for (; null === b.sibling; ) {
        if (null === b.return || b.return === a) return true;
        b = b.return;
      }
      b.sibling.return = b.return;
      b = b.sibling;
    }
  }
  return true;
}
function Ck(a, b) {
  b &= ~rk;
  b &= ~qk;
  a.suspendedLanes |= b;
  a.pingedLanes &= ~b;
  for (a = a.expirationTimes; 0 < b; ) {
    var c = 31 - oc(b), d = 1 << c;
    a[c] = -1;
    b &= ~d;
  }
}
function Ek(a) {
  if (0 !== (K & 6)) throw Error(p(327));
  Hk();
  var b = uc(a, 0);
  if (0 === (b & 1)) return Dk(a, B()), null;
  var c = Ik(a, b);
  if (0 !== a.tag && 2 === c) {
    var d = xc(a);
    0 !== d && (b = d, c = Nk(a, d));
  }
  if (1 === c) throw c = pk, Kk(a, 0), Ck(a, b), Dk(a, B()), c;
  if (6 === c) throw Error(p(345));
  a.finishedWork = a.current.alternate;
  a.finishedLanes = b;
  Pk(a, tk, uk);
  Dk(a, B());
  return null;
}
function Qk(a, b) {
  var c = K;
  K |= 1;
  try {
    return a(b);
  } finally {
    K = c, 0 === K && (Gj = B() + 500, fg && jg());
  }
}
function Rk(a) {
  null !== wk && 0 === wk.tag && 0 === (K & 6) && Hk();
  var b = K;
  K |= 1;
  var c = ok.transition, d = C;
  try {
    if (ok.transition = null, C = 1, a) return a();
  } finally {
    C = d, ok.transition = c, K = b, 0 === (K & 6) && jg();
  }
}
function Hj() {
  fj = ej.current;
  E(ej);
}
function Kk(a, b) {
  a.finishedWork = null;
  a.finishedLanes = 0;
  var c = a.timeoutHandle;
  -1 !== c && (a.timeoutHandle = -1, Gf(c));
  if (null !== Y) for (c = Y.return; null !== c; ) {
    var d = c;
    wg(d);
    switch (d.tag) {
      case 1:
        d = d.type.childContextTypes;
        null !== d && void 0 !== d && $f();
        break;
      case 3:
        zh();
        E(Wf);
        E(H);
        Eh();
        break;
      case 5:
        Bh(d);
        break;
      case 4:
        zh();
        break;
      case 13:
        E(L);
        break;
      case 19:
        E(L);
        break;
      case 10:
        ah(d.type._context);
        break;
      case 22:
      case 23:
        Hj();
    }
    c = c.return;
  }
  Q = a;
  Y = a = Pg(a.current, null);
  Z = fj = b;
  T = 0;
  pk = null;
  rk = qk = rh = 0;
  tk = sk = null;
  if (null !== fh) {
    for (b = 0; b < fh.length; b++) if (c = fh[b], d = c.interleaved, null !== d) {
      c.interleaved = null;
      var e = d.next, f2 = c.pending;
      if (null !== f2) {
        var g = f2.next;
        f2.next = e;
        d.next = g;
      }
      c.pending = d;
    }
    fh = null;
  }
  return a;
}
function Mk(a, b) {
  do {
    var c = Y;
    try {
      $g();
      Fh.current = Rh;
      if (Ih) {
        for (var d = M.memoizedState; null !== d; ) {
          var e = d.queue;
          null !== e && (e.pending = null);
          d = d.next;
        }
        Ih = false;
      }
      Hh = 0;
      O = N = M = null;
      Jh = false;
      Kh = 0;
      nk.current = null;
      if (null === c || null === c.return) {
        T = 1;
        pk = b;
        Y = null;
        break;
      }
      a: {
        var f2 = a, g = c.return, h = c, k2 = b;
        b = Z;
        h.flags |= 32768;
        if (null !== k2 && "object" === typeof k2 && "function" === typeof k2.then) {
          var l2 = k2, m2 = h, q2 = m2.tag;
          if (0 === (m2.mode & 1) && (0 === q2 || 11 === q2 || 15 === q2)) {
            var r2 = m2.alternate;
            r2 ? (m2.updateQueue = r2.updateQueue, m2.memoizedState = r2.memoizedState, m2.lanes = r2.lanes) : (m2.updateQueue = null, m2.memoizedState = null);
          }
          var y2 = Ui(g);
          if (null !== y2) {
            y2.flags &= -257;
            Vi(y2, g, h, f2, b);
            y2.mode & 1 && Si(f2, l2, b);
            b = y2;
            k2 = l2;
            var n2 = b.updateQueue;
            if (null === n2) {
              var t2 = /* @__PURE__ */ new Set();
              t2.add(k2);
              b.updateQueue = t2;
            } else n2.add(k2);
            break a;
          } else {
            if (0 === (b & 1)) {
              Si(f2, l2, b);
              tj();
              break a;
            }
            k2 = Error(p(426));
          }
        } else if (I && h.mode & 1) {
          var J2 = Ui(g);
          if (null !== J2) {
            0 === (J2.flags & 65536) && (J2.flags |= 256);
            Vi(J2, g, h, f2, b);
            Jg(Ji(k2, h));
            break a;
          }
        }
        f2 = k2 = Ji(k2, h);
        4 !== T && (T = 2);
        null === sk ? sk = [f2] : sk.push(f2);
        f2 = g;
        do {
          switch (f2.tag) {
            case 3:
              f2.flags |= 65536;
              b &= -b;
              f2.lanes |= b;
              var x2 = Ni(f2, k2, b);
              ph(f2, x2);
              break a;
            case 1:
              h = k2;
              var w2 = f2.type, u2 = f2.stateNode;
              if (0 === (f2.flags & 128) && ("function" === typeof w2.getDerivedStateFromError || null !== u2 && "function" === typeof u2.componentDidCatch && (null === Ri || !Ri.has(u2)))) {
                f2.flags |= 65536;
                b &= -b;
                f2.lanes |= b;
                var F2 = Qi(f2, h, b);
                ph(f2, F2);
                break a;
              }
          }
          f2 = f2.return;
        } while (null !== f2);
      }
      Sk(c);
    } catch (na) {
      b = na;
      Y === c && null !== c && (Y = c = c.return);
      continue;
    }
    break;
  } while (1);
}
function Jk() {
  var a = mk.current;
  mk.current = Rh;
  return null === a ? Rh : a;
}
function tj() {
  if (0 === T || 3 === T || 2 === T) T = 4;
  null === Q || 0 === (rh & 268435455) && 0 === (qk & 268435455) || Ck(Q, Z);
}
function Ik(a, b) {
  var c = K;
  K |= 2;
  var d = Jk();
  if (Q !== a || Z !== b) uk = null, Kk(a, b);
  do
    try {
      Tk();
      break;
    } catch (e) {
      Mk(a, e);
    }
  while (1);
  $g();
  K = c;
  mk.current = d;
  if (null !== Y) throw Error(p(261));
  Q = null;
  Z = 0;
  return T;
}
function Tk() {
  for (; null !== Y; ) Uk(Y);
}
function Lk() {
  for (; null !== Y && !cc(); ) Uk(Y);
}
function Uk(a) {
  var b = Vk(a.alternate, a, fj);
  a.memoizedProps = a.pendingProps;
  null === b ? Sk(a) : Y = b;
  nk.current = null;
}
function Sk(a) {
  var b = a;
  do {
    var c = b.alternate;
    a = b.return;
    if (0 === (b.flags & 32768)) {
      if (c = Ej(c, b, fj), null !== c) {
        Y = c;
        return;
      }
    } else {
      c = Ij(c, b);
      if (null !== c) {
        c.flags &= 32767;
        Y = c;
        return;
      }
      if (null !== a) a.flags |= 32768, a.subtreeFlags = 0, a.deletions = null;
      else {
        T = 6;
        Y = null;
        return;
      }
    }
    b = b.sibling;
    if (null !== b) {
      Y = b;
      return;
    }
    Y = b = a;
  } while (null !== b);
  0 === T && (T = 5);
}
function Pk(a, b, c) {
  var d = C, e = ok.transition;
  try {
    ok.transition = null, C = 1, Wk(a, b, c, d);
  } finally {
    ok.transition = e, C = d;
  }
  return null;
}
function Wk(a, b, c, d) {
  do
    Hk();
  while (null !== wk);
  if (0 !== (K & 6)) throw Error(p(327));
  c = a.finishedWork;
  var e = a.finishedLanes;
  if (null === c) return null;
  a.finishedWork = null;
  a.finishedLanes = 0;
  if (c === a.current) throw Error(p(177));
  a.callbackNode = null;
  a.callbackPriority = 0;
  var f2 = c.lanes | c.childLanes;
  Bc(a, f2);
  a === Q && (Y = Q = null, Z = 0);
  0 === (c.subtreeFlags & 2064) && 0 === (c.flags & 2064) || vk || (vk = true, Fk(hc, function() {
    Hk();
    return null;
  }));
  f2 = 0 !== (c.flags & 15990);
  if (0 !== (c.subtreeFlags & 15990) || f2) {
    f2 = ok.transition;
    ok.transition = null;
    var g = C;
    C = 1;
    var h = K;
    K |= 4;
    nk.current = null;
    Oj(a, c);
    dk(c, a);
    Oe(Df);
    dd = !!Cf;
    Df = Cf = null;
    a.current = c;
    hk(c);
    dc();
    K = h;
    C = g;
    ok.transition = f2;
  } else a.current = c;
  vk && (vk = false, wk = a, xk = e);
  f2 = a.pendingLanes;
  0 === f2 && (Ri = null);
  mc(c.stateNode);
  Dk(a, B());
  if (null !== b) for (d = a.onRecoverableError, c = 0; c < b.length; c++) e = b[c], d(e.value, { componentStack: e.stack, digest: e.digest });
  if (Oi) throw Oi = false, a = Pi, Pi = null, a;
  0 !== (xk & 1) && 0 !== a.tag && Hk();
  f2 = a.pendingLanes;
  0 !== (f2 & 1) ? a === zk ? yk++ : (yk = 0, zk = a) : yk = 0;
  jg();
  return null;
}
function Hk() {
  if (null !== wk) {
    var a = Dc(xk), b = ok.transition, c = C;
    try {
      ok.transition = null;
      C = 16 > a ? 16 : a;
      if (null === wk) var d = false;
      else {
        a = wk;
        wk = null;
        xk = 0;
        if (0 !== (K & 6)) throw Error(p(331));
        var e = K;
        K |= 4;
        for (V = a.current; null !== V; ) {
          var f2 = V, g = f2.child;
          if (0 !== (V.flags & 16)) {
            var h = f2.deletions;
            if (null !== h) {
              for (var k2 = 0; k2 < h.length; k2++) {
                var l2 = h[k2];
                for (V = l2; null !== V; ) {
                  var m2 = V;
                  switch (m2.tag) {
                    case 0:
                    case 11:
                    case 15:
                      Pj(8, m2, f2);
                  }
                  var q2 = m2.child;
                  if (null !== q2) q2.return = m2, V = q2;
                  else for (; null !== V; ) {
                    m2 = V;
                    var r2 = m2.sibling, y2 = m2.return;
                    Sj(m2);
                    if (m2 === l2) {
                      V = null;
                      break;
                    }
                    if (null !== r2) {
                      r2.return = y2;
                      V = r2;
                      break;
                    }
                    V = y2;
                  }
                }
              }
              var n2 = f2.alternate;
              if (null !== n2) {
                var t2 = n2.child;
                if (null !== t2) {
                  n2.child = null;
                  do {
                    var J2 = t2.sibling;
                    t2.sibling = null;
                    t2 = J2;
                  } while (null !== t2);
                }
              }
              V = f2;
            }
          }
          if (0 !== (f2.subtreeFlags & 2064) && null !== g) g.return = f2, V = g;
          else b: for (; null !== V; ) {
            f2 = V;
            if (0 !== (f2.flags & 2048)) switch (f2.tag) {
              case 0:
              case 11:
              case 15:
                Pj(9, f2, f2.return);
            }
            var x2 = f2.sibling;
            if (null !== x2) {
              x2.return = f2.return;
              V = x2;
              break b;
            }
            V = f2.return;
          }
        }
        var w2 = a.current;
        for (V = w2; null !== V; ) {
          g = V;
          var u2 = g.child;
          if (0 !== (g.subtreeFlags & 2064) && null !== u2) u2.return = g, V = u2;
          else b: for (g = w2; null !== V; ) {
            h = V;
            if (0 !== (h.flags & 2048)) try {
              switch (h.tag) {
                case 0:
                case 11:
                case 15:
                  Qj(9, h);
              }
            } catch (na) {
              W(h, h.return, na);
            }
            if (h === g) {
              V = null;
              break b;
            }
            var F2 = h.sibling;
            if (null !== F2) {
              F2.return = h.return;
              V = F2;
              break b;
            }
            V = h.return;
          }
        }
        K = e;
        jg();
        if (lc && "function" === typeof lc.onPostCommitFiberRoot) try {
          lc.onPostCommitFiberRoot(kc, a);
        } catch (na) {
        }
        d = true;
      }
      return d;
    } finally {
      C = c, ok.transition = b;
    }
  }
  return false;
}
function Xk(a, b, c) {
  b = Ji(c, b);
  b = Ni(a, b, 1);
  a = nh(a, b, 1);
  b = R();
  null !== a && (Ac(a, 1, b), Dk(a, b));
}
function W(a, b, c) {
  if (3 === a.tag) Xk(a, a, c);
  else for (; null !== b; ) {
    if (3 === b.tag) {
      Xk(b, a, c);
      break;
    } else if (1 === b.tag) {
      var d = b.stateNode;
      if ("function" === typeof b.type.getDerivedStateFromError || "function" === typeof d.componentDidCatch && (null === Ri || !Ri.has(d))) {
        a = Ji(c, a);
        a = Qi(b, a, 1);
        b = nh(b, a, 1);
        a = R();
        null !== b && (Ac(b, 1, a), Dk(b, a));
        break;
      }
    }
    b = b.return;
  }
}
function Ti(a, b, c) {
  var d = a.pingCache;
  null !== d && d.delete(b);
  b = R();
  a.pingedLanes |= a.suspendedLanes & c;
  Q === a && (Z & c) === c && (4 === T || 3 === T && (Z & 130023424) === Z && 500 > B() - fk ? Kk(a, 0) : rk |= c);
  Dk(a, b);
}
function Yk(a, b) {
  0 === b && (0 === (a.mode & 1) ? b = 1 : (b = sc, sc <<= 1, 0 === (sc & 130023424) && (sc = 4194304)));
  var c = R();
  a = ih(a, b);
  null !== a && (Ac(a, b, c), Dk(a, c));
}
function uj(a) {
  var b = a.memoizedState, c = 0;
  null !== b && (c = b.retryLane);
  Yk(a, c);
}
function bk(a, b) {
  var c = 0;
  switch (a.tag) {
    case 13:
      var d = a.stateNode;
      var e = a.memoizedState;
      null !== e && (c = e.retryLane);
      break;
    case 19:
      d = a.stateNode;
      break;
    default:
      throw Error(p(314));
  }
  null !== d && d.delete(b);
  Yk(a, c);
}
var Vk;
Vk = function(a, b, c) {
  if (null !== a) if (a.memoizedProps !== b.pendingProps || Wf.current) dh = true;
  else {
    if (0 === (a.lanes & c) && 0 === (b.flags & 128)) return dh = false, yj(a, b, c);
    dh = 0 !== (a.flags & 131072) ? true : false;
  }
  else dh = false, I && 0 !== (b.flags & 1048576) && ug(b, ng, b.index);
  b.lanes = 0;
  switch (b.tag) {
    case 2:
      var d = b.type;
      ij(a, b);
      a = b.pendingProps;
      var e = Yf(b, H.current);
      ch(b, c);
      e = Nh(null, b, d, a, e, c);
      var f2 = Sh();
      b.flags |= 1;
      "object" === typeof e && null !== e && "function" === typeof e.render && void 0 === e.$$typeof ? (b.tag = 1, b.memoizedState = null, b.updateQueue = null, Zf(d) ? (f2 = true, cg(b)) : f2 = false, b.memoizedState = null !== e.state && void 0 !== e.state ? e.state : null, kh(b), e.updater = Ei, b.stateNode = e, e._reactInternals = b, Ii(b, d, a, c), b = jj(null, b, d, true, f2, c)) : (b.tag = 0, I && f2 && vg(b), Xi(null, b, e, c), b = b.child);
      return b;
    case 16:
      d = b.elementType;
      a: {
        ij(a, b);
        a = b.pendingProps;
        e = d._init;
        d = e(d._payload);
        b.type = d;
        e = b.tag = Zk(d);
        a = Ci(d, a);
        switch (e) {
          case 0:
            b = cj(null, b, d, a, c);
            break a;
          case 1:
            b = hj(null, b, d, a, c);
            break a;
          case 11:
            b = Yi(null, b, d, a, c);
            break a;
          case 14:
            b = $i(null, b, d, Ci(d.type, a), c);
            break a;
        }
        throw Error(p(
          306,
          d,
          ""
        ));
      }
      return b;
    case 0:
      return d = b.type, e = b.pendingProps, e = b.elementType === d ? e : Ci(d, e), cj(a, b, d, e, c);
    case 1:
      return d = b.type, e = b.pendingProps, e = b.elementType === d ? e : Ci(d, e), hj(a, b, d, e, c);
    case 3:
      a: {
        kj(b);
        if (null === a) throw Error(p(387));
        d = b.pendingProps;
        f2 = b.memoizedState;
        e = f2.element;
        lh(a, b);
        qh(b, d, null, c);
        var g = b.memoizedState;
        d = g.element;
        if (f2.isDehydrated) if (f2 = { element: d, isDehydrated: false, cache: g.cache, pendingSuspenseBoundaries: g.pendingSuspenseBoundaries, transitions: g.transitions }, b.updateQueue.baseState = f2, b.memoizedState = f2, b.flags & 256) {
          e = Ji(Error(p(423)), b);
          b = lj(a, b, d, c, e);
          break a;
        } else if (d !== e) {
          e = Ji(Error(p(424)), b);
          b = lj(a, b, d, c, e);
          break a;
        } else for (yg = Lf(b.stateNode.containerInfo.firstChild), xg = b, I = true, zg = null, c = Vg(b, null, d, c), b.child = c; c; ) c.flags = c.flags & -3 | 4096, c = c.sibling;
        else {
          Ig();
          if (d === e) {
            b = Zi(a, b, c);
            break a;
          }
          Xi(a, b, d, c);
        }
        b = b.child;
      }
      return b;
    case 5:
      return Ah(b), null === a && Eg(b), d = b.type, e = b.pendingProps, f2 = null !== a ? a.memoizedProps : null, g = e.children, Ef(d, e) ? g = null : null !== f2 && Ef(d, f2) && (b.flags |= 32), gj(a, b), Xi(a, b, g, c), b.child;
    case 6:
      return null === a && Eg(b), null;
    case 13:
      return oj(a, b, c);
    case 4:
      return yh(b, b.stateNode.containerInfo), d = b.pendingProps, null === a ? b.child = Ug(b, null, d, c) : Xi(a, b, d, c), b.child;
    case 11:
      return d = b.type, e = b.pendingProps, e = b.elementType === d ? e : Ci(d, e), Yi(a, b, d, e, c);
    case 7:
      return Xi(a, b, b.pendingProps, c), b.child;
    case 8:
      return Xi(a, b, b.pendingProps.children, c), b.child;
    case 12:
      return Xi(a, b, b.pendingProps.children, c), b.child;
    case 10:
      a: {
        d = b.type._context;
        e = b.pendingProps;
        f2 = b.memoizedProps;
        g = e.value;
        G(Wg, d._currentValue);
        d._currentValue = g;
        if (null !== f2) if (He(f2.value, g)) {
          if (f2.children === e.children && !Wf.current) {
            b = Zi(a, b, c);
            break a;
          }
        } else for (f2 = b.child, null !== f2 && (f2.return = b); null !== f2; ) {
          var h = f2.dependencies;
          if (null !== h) {
            g = f2.child;
            for (var k2 = h.firstContext; null !== k2; ) {
              if (k2.context === d) {
                if (1 === f2.tag) {
                  k2 = mh(-1, c & -c);
                  k2.tag = 2;
                  var l2 = f2.updateQueue;
                  if (null !== l2) {
                    l2 = l2.shared;
                    var m2 = l2.pending;
                    null === m2 ? k2.next = k2 : (k2.next = m2.next, m2.next = k2);
                    l2.pending = k2;
                  }
                }
                f2.lanes |= c;
                k2 = f2.alternate;
                null !== k2 && (k2.lanes |= c);
                bh(
                  f2.return,
                  c,
                  b
                );
                h.lanes |= c;
                break;
              }
              k2 = k2.next;
            }
          } else if (10 === f2.tag) g = f2.type === b.type ? null : f2.child;
          else if (18 === f2.tag) {
            g = f2.return;
            if (null === g) throw Error(p(341));
            g.lanes |= c;
            h = g.alternate;
            null !== h && (h.lanes |= c);
            bh(g, c, b);
            g = f2.sibling;
          } else g = f2.child;
          if (null !== g) g.return = f2;
          else for (g = f2; null !== g; ) {
            if (g === b) {
              g = null;
              break;
            }
            f2 = g.sibling;
            if (null !== f2) {
              f2.return = g.return;
              g = f2;
              break;
            }
            g = g.return;
          }
          f2 = g;
        }
        Xi(a, b, e.children, c);
        b = b.child;
      }
      return b;
    case 9:
      return e = b.type, d = b.pendingProps.children, ch(b, c), e = eh(e), d = d(e), b.flags |= 1, Xi(a, b, d, c), b.child;
    case 14:
      return d = b.type, e = Ci(d, b.pendingProps), e = Ci(d.type, e), $i(a, b, d, e, c);
    case 15:
      return bj(a, b, b.type, b.pendingProps, c);
    case 17:
      return d = b.type, e = b.pendingProps, e = b.elementType === d ? e : Ci(d, e), ij(a, b), b.tag = 1, Zf(d) ? (a = true, cg(b)) : a = false, ch(b, c), Gi(b, d, e), Ii(b, d, e, c), jj(null, b, d, true, a, c);
    case 19:
      return xj(a, b, c);
    case 22:
      return dj(a, b, c);
  }
  throw Error(p(156, b.tag));
};
function Fk(a, b) {
  return ac(a, b);
}
function $k(a, b, c, d) {
  this.tag = a;
  this.key = c;
  this.sibling = this.child = this.return = this.stateNode = this.type = this.elementType = null;
  this.index = 0;
  this.ref = null;
  this.pendingProps = b;
  this.dependencies = this.memoizedState = this.updateQueue = this.memoizedProps = null;
  this.mode = d;
  this.subtreeFlags = this.flags = 0;
  this.deletions = null;
  this.childLanes = this.lanes = 0;
  this.alternate = null;
}
function Bg(a, b, c, d) {
  return new $k(a, b, c, d);
}
function aj(a) {
  a = a.prototype;
  return !(!a || !a.isReactComponent);
}
function Zk(a) {
  if ("function" === typeof a) return aj(a) ? 1 : 0;
  if (void 0 !== a && null !== a) {
    a = a.$$typeof;
    if (a === Da) return 11;
    if (a === Ga) return 14;
  }
  return 2;
}
function Pg(a, b) {
  var c = a.alternate;
  null === c ? (c = Bg(a.tag, b, a.key, a.mode), c.elementType = a.elementType, c.type = a.type, c.stateNode = a.stateNode, c.alternate = a, a.alternate = c) : (c.pendingProps = b, c.type = a.type, c.flags = 0, c.subtreeFlags = 0, c.deletions = null);
  c.flags = a.flags & 14680064;
  c.childLanes = a.childLanes;
  c.lanes = a.lanes;
  c.child = a.child;
  c.memoizedProps = a.memoizedProps;
  c.memoizedState = a.memoizedState;
  c.updateQueue = a.updateQueue;
  b = a.dependencies;
  c.dependencies = null === b ? null : { lanes: b.lanes, firstContext: b.firstContext };
  c.sibling = a.sibling;
  c.index = a.index;
  c.ref = a.ref;
  return c;
}
function Rg(a, b, c, d, e, f2) {
  var g = 2;
  d = a;
  if ("function" === typeof a) aj(a) && (g = 1);
  else if ("string" === typeof a) g = 5;
  else a: switch (a) {
    case ya:
      return Tg(c.children, e, f2, b);
    case za:
      g = 8;
      e |= 8;
      break;
    case Aa:
      return a = Bg(12, c, b, e | 2), a.elementType = Aa, a.lanes = f2, a;
    case Ea:
      return a = Bg(13, c, b, e), a.elementType = Ea, a.lanes = f2, a;
    case Fa:
      return a = Bg(19, c, b, e), a.elementType = Fa, a.lanes = f2, a;
    case Ia:
      return pj(c, e, f2, b);
    default:
      if ("object" === typeof a && null !== a) switch (a.$$typeof) {
        case Ba:
          g = 10;
          break a;
        case Ca:
          g = 9;
          break a;
        case Da:
          g = 11;
          break a;
        case Ga:
          g = 14;
          break a;
        case Ha:
          g = 16;
          d = null;
          break a;
      }
      throw Error(p(130, null == a ? a : typeof a, ""));
  }
  b = Bg(g, c, b, e);
  b.elementType = a;
  b.type = d;
  b.lanes = f2;
  return b;
}
function Tg(a, b, c, d) {
  a = Bg(7, a, d, b);
  a.lanes = c;
  return a;
}
function pj(a, b, c, d) {
  a = Bg(22, a, d, b);
  a.elementType = Ia;
  a.lanes = c;
  a.stateNode = { isHidden: false };
  return a;
}
function Qg(a, b, c) {
  a = Bg(6, a, null, b);
  a.lanes = c;
  return a;
}
function Sg(a, b, c) {
  b = Bg(4, null !== a.children ? a.children : [], a.key, b);
  b.lanes = c;
  b.stateNode = { containerInfo: a.containerInfo, pendingChildren: null, implementation: a.implementation };
  return b;
}
function al(a, b, c, d, e) {
  this.tag = b;
  this.containerInfo = a;
  this.finishedWork = this.pingCache = this.current = this.pendingChildren = null;
  this.timeoutHandle = -1;
  this.callbackNode = this.pendingContext = this.context = null;
  this.callbackPriority = 0;
  this.eventTimes = zc(0);
  this.expirationTimes = zc(-1);
  this.entangledLanes = this.finishedLanes = this.mutableReadLanes = this.expiredLanes = this.pingedLanes = this.suspendedLanes = this.pendingLanes = 0;
  this.entanglements = zc(0);
  this.identifierPrefix = d;
  this.onRecoverableError = e;
  this.mutableSourceEagerHydrationData = null;
}
function bl(a, b, c, d, e, f2, g, h, k2) {
  a = new al(a, b, c, h, k2);
  1 === b ? (b = 1, true === f2 && (b |= 8)) : b = 0;
  f2 = Bg(3, null, null, b);
  a.current = f2;
  f2.stateNode = a;
  f2.memoizedState = { element: d, isDehydrated: c, cache: null, transitions: null, pendingSuspenseBoundaries: null };
  kh(f2);
  return a;
}
function cl(a, b, c) {
  var d = 3 < arguments.length && void 0 !== arguments[3] ? arguments[3] : null;
  return { $$typeof: wa, key: null == d ? null : "" + d, children: a, containerInfo: b, implementation: c };
}
function dl(a) {
  if (!a) return Vf;
  a = a._reactInternals;
  a: {
    if (Vb(a) !== a || 1 !== a.tag) throw Error(p(170));
    var b = a;
    do {
      switch (b.tag) {
        case 3:
          b = b.stateNode.context;
          break a;
        case 1:
          if (Zf(b.type)) {
            b = b.stateNode.__reactInternalMemoizedMergedChildContext;
            break a;
          }
      }
      b = b.return;
    } while (null !== b);
    throw Error(p(171));
  }
  if (1 === a.tag) {
    var c = a.type;
    if (Zf(c)) return bg(a, c, b);
  }
  return b;
}
function el(a, b, c, d, e, f2, g, h, k2) {
  a = bl(c, d, true, a, e, f2, g, h, k2);
  a.context = dl(null);
  c = a.current;
  d = R();
  e = yi(c);
  f2 = mh(d, e);
  f2.callback = void 0 !== b && null !== b ? b : null;
  nh(c, f2, e);
  a.current.lanes = e;
  Ac(a, e, d);
  Dk(a, d);
  return a;
}
function fl(a, b, c, d) {
  var e = b.current, f2 = R(), g = yi(e);
  c = dl(c);
  null === b.context ? b.context = c : b.pendingContext = c;
  b = mh(f2, g);
  b.payload = { element: a };
  d = void 0 === d ? null : d;
  null !== d && (b.callback = d);
  a = nh(e, b, g);
  null !== a && (gi(a, e, g, f2), oh(a, e, g));
  return g;
}
function gl(a) {
  a = a.current;
  if (!a.child) return null;
  switch (a.child.tag) {
    case 5:
      return a.child.stateNode;
    default:
      return a.child.stateNode;
  }
}
function hl(a, b) {
  a = a.memoizedState;
  if (null !== a && null !== a.dehydrated) {
    var c = a.retryLane;
    a.retryLane = 0 !== c && c < b ? c : b;
  }
}
function il(a, b) {
  hl(a, b);
  (a = a.alternate) && hl(a, b);
}
function jl() {
  return null;
}
var kl = "function" === typeof reportError ? reportError : function(a) {
  console.error(a);
};
function ll(a) {
  this._internalRoot = a;
}
ml.prototype.render = ll.prototype.render = function(a) {
  var b = this._internalRoot;
  if (null === b) throw Error(p(409));
  fl(a, b, null, null);
};
ml.prototype.unmount = ll.prototype.unmount = function() {
  var a = this._internalRoot;
  if (null !== a) {
    this._internalRoot = null;
    var b = a.containerInfo;
    Rk(function() {
      fl(null, a, null, null);
    });
    b[uf] = null;
  }
};
function ml(a) {
  this._internalRoot = a;
}
ml.prototype.unstable_scheduleHydration = function(a) {
  if (a) {
    var b = Hc();
    a = { blockedOn: null, target: a, priority: b };
    for (var c = 0; c < Qc.length && 0 !== b && b < Qc[c].priority; c++) ;
    Qc.splice(c, 0, a);
    0 === c && Vc(a);
  }
};
function nl(a) {
  return !(!a || 1 !== a.nodeType && 9 !== a.nodeType && 11 !== a.nodeType);
}
function ol(a) {
  return !(!a || 1 !== a.nodeType && 9 !== a.nodeType && 11 !== a.nodeType && (8 !== a.nodeType || " react-mount-point-unstable " !== a.nodeValue));
}
function pl() {
}
function ql(a, b, c, d, e) {
  if (e) {
    if ("function" === typeof d) {
      var f2 = d;
      d = function() {
        var a2 = gl(g);
        f2.call(a2);
      };
    }
    var g = el(b, d, a, 0, null, false, false, "", pl);
    a._reactRootContainer = g;
    a[uf] = g.current;
    sf(8 === a.nodeType ? a.parentNode : a);
    Rk();
    return g;
  }
  for (; e = a.lastChild; ) a.removeChild(e);
  if ("function" === typeof d) {
    var h = d;
    d = function() {
      var a2 = gl(k2);
      h.call(a2);
    };
  }
  var k2 = bl(a, 0, false, null, null, false, false, "", pl);
  a._reactRootContainer = k2;
  a[uf] = k2.current;
  sf(8 === a.nodeType ? a.parentNode : a);
  Rk(function() {
    fl(b, k2, c, d);
  });
  return k2;
}
function rl(a, b, c, d, e) {
  var f2 = c._reactRootContainer;
  if (f2) {
    var g = f2;
    if ("function" === typeof e) {
      var h = e;
      e = function() {
        var a2 = gl(g);
        h.call(a2);
      };
    }
    fl(b, g, a, e);
  } else g = ql(c, b, a, e, d);
  return gl(g);
}
Ec = function(a) {
  switch (a.tag) {
    case 3:
      var b = a.stateNode;
      if (b.current.memoizedState.isDehydrated) {
        var c = tc(b.pendingLanes);
        0 !== c && (Cc(b, c | 1), Dk(b, B()), 0 === (K & 6) && (Gj = B() + 500, jg()));
      }
      break;
    case 13:
      Rk(function() {
        var b2 = ih(a, 1);
        if (null !== b2) {
          var c2 = R();
          gi(b2, a, 1, c2);
        }
      }), il(a, 1);
  }
};
Fc = function(a) {
  if (13 === a.tag) {
    var b = ih(a, 134217728);
    if (null !== b) {
      var c = R();
      gi(b, a, 134217728, c);
    }
    il(a, 134217728);
  }
};
Gc = function(a) {
  if (13 === a.tag) {
    var b = yi(a), c = ih(a, b);
    if (null !== c) {
      var d = R();
      gi(c, a, b, d);
    }
    il(a, b);
  }
};
Hc = function() {
  return C;
};
Ic = function(a, b) {
  var c = C;
  try {
    return C = a, b();
  } finally {
    C = c;
  }
};
yb = function(a, b, c) {
  switch (b) {
    case "input":
      bb(a, c);
      b = c.name;
      if ("radio" === c.type && null != b) {
        for (c = a; c.parentNode; ) c = c.parentNode;
        c = c.querySelectorAll("input[name=" + JSON.stringify("" + b) + '][type="radio"]');
        for (b = 0; b < c.length; b++) {
          var d = c[b];
          if (d !== a && d.form === a.form) {
            var e = Db(d);
            if (!e) throw Error(p(90));
            Wa(d);
            bb(d, e);
          }
        }
      }
      break;
    case "textarea":
      ib(a, c);
      break;
    case "select":
      b = c.value, null != b && fb(a, !!c.multiple, b, false);
  }
};
Gb = Qk;
Hb = Rk;
var sl = { usingClientEntryPoint: false, Events: [Cb, ue, Db, Eb, Fb, Qk] }, tl = { findFiberByHostInstance: Wc, bundleType: 0, version: "18.3.1", rendererPackageName: "react-dom" };
var ul = { bundleType: tl.bundleType, version: tl.version, rendererPackageName: tl.rendererPackageName, rendererConfig: tl.rendererConfig, overrideHookState: null, overrideHookStateDeletePath: null, overrideHookStateRenamePath: null, overrideProps: null, overridePropsDeletePath: null, overridePropsRenamePath: null, setErrorHandler: null, setSuspenseHandler: null, scheduleUpdate: null, currentDispatcherRef: ua.ReactCurrentDispatcher, findHostInstanceByFiber: function(a) {
  a = Zb(a);
  return null === a ? null : a.stateNode;
}, findFiberByHostInstance: tl.findFiberByHostInstance || jl, findHostInstancesForRefresh: null, scheduleRefresh: null, scheduleRoot: null, setRefreshHandler: null, getCurrentFiber: null, reconcilerVersion: "18.3.1-next-f1338f8080-20240426" };
if ("undefined" !== typeof __REACT_DEVTOOLS_GLOBAL_HOOK__) {
  var vl = __REACT_DEVTOOLS_GLOBAL_HOOK__;
  if (!vl.isDisabled && vl.supportsFiber) try {
    kc = vl.inject(ul), lc = vl;
  } catch (a) {
  }
}
reactDom_production_min.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = sl;
reactDom_production_min.createPortal = function(a, b) {
  var c = 2 < arguments.length && void 0 !== arguments[2] ? arguments[2] : null;
  if (!nl(b)) throw Error(p(200));
  return cl(a, b, null, c);
};
reactDom_production_min.createRoot = function(a, b) {
  if (!nl(a)) throw Error(p(299));
  var c = false, d = "", e = kl;
  null !== b && void 0 !== b && (true === b.unstable_strictMode && (c = true), void 0 !== b.identifierPrefix && (d = b.identifierPrefix), void 0 !== b.onRecoverableError && (e = b.onRecoverableError));
  b = bl(a, 1, false, null, null, c, false, d, e);
  a[uf] = b.current;
  sf(8 === a.nodeType ? a.parentNode : a);
  return new ll(b);
};
reactDom_production_min.findDOMNode = function(a) {
  if (null == a) return null;
  if (1 === a.nodeType) return a;
  var b = a._reactInternals;
  if (void 0 === b) {
    if ("function" === typeof a.render) throw Error(p(188));
    a = Object.keys(a).join(",");
    throw Error(p(268, a));
  }
  a = Zb(b);
  a = null === a ? null : a.stateNode;
  return a;
};
reactDom_production_min.flushSync = function(a) {
  return Rk(a);
};
reactDom_production_min.hydrate = function(a, b, c) {
  if (!ol(b)) throw Error(p(200));
  return rl(null, a, b, true, c);
};
reactDom_production_min.hydrateRoot = function(a, b, c) {
  if (!nl(a)) throw Error(p(405));
  var d = null != c && c.hydratedSources || null, e = false, f2 = "", g = kl;
  null !== c && void 0 !== c && (true === c.unstable_strictMode && (e = true), void 0 !== c.identifierPrefix && (f2 = c.identifierPrefix), void 0 !== c.onRecoverableError && (g = c.onRecoverableError));
  b = el(b, null, a, 1, null != c ? c : null, e, false, f2, g);
  a[uf] = b.current;
  sf(a);
  if (d) for (a = 0; a < d.length; a++) c = d[a], e = c._getVersion, e = e(c._source), null == b.mutableSourceEagerHydrationData ? b.mutableSourceEagerHydrationData = [c, e] : b.mutableSourceEagerHydrationData.push(
    c,
    e
  );
  return new ml(b);
};
reactDom_production_min.render = function(a, b, c) {
  if (!ol(b)) throw Error(p(200));
  return rl(null, a, b, false, c);
};
reactDom_production_min.unmountComponentAtNode = function(a) {
  if (!ol(a)) throw Error(p(40));
  return a._reactRootContainer ? (Rk(function() {
    rl(null, null, a, false, function() {
      a._reactRootContainer = null;
      a[uf] = null;
    });
  }), true) : false;
};
reactDom_production_min.unstable_batchedUpdates = Qk;
reactDom_production_min.unstable_renderSubtreeIntoContainer = function(a, b, c, d) {
  if (!ol(c)) throw Error(p(200));
  if (null == a || void 0 === a._reactInternals) throw Error(p(38));
  return rl(a, b, c, false, d);
};
reactDom_production_min.version = "18.3.1-next-f1338f8080-20240426";
function checkDCE() {
  if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ === "undefined" || typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE !== "function") {
    return;
  }
  try {
    __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(checkDCE);
  } catch (err) {
    console.error(err);
  }
}
{
  checkDCE();
  reactDom.exports = reactDom_production_min;
}
var reactDomExports = reactDom.exports;
var m = reactDomExports;
{
  client.createRoot = m.createRoot;
  client.hydrateRoot = m.hydrateRoot;
}
const logoWhite = "data:image/svg+xml,%3csvg%20width='1024'%20height='1024'%20viewBox='0%200%201024%201024'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M475.415%2046.7394C478.505%2045.9272%20486.557%2045.9726%20489.918%2046.0244C609.607%2047.8756%20717.391%20120.168%20760.512%20232.981C786.016%20299.702%20787.259%20375.466%20759.113%20441.475L598.146%20441.421C611.585%20423.413%20622.191%20406.871%20628.58%20385.229C639.765%20347.34%20637.856%20305.148%20618.623%20270.177C599.182%20234.828%20568.83%20207.222%20529.971%20195.642C491.259%20184.17%20449.579%20188.657%20414.178%20208.11C378.498%20227.926%20356.39%20260.249%20345.271%20299.134C326.419%20370.373%20360.684%20439.52%20425.564%20472.413C443.813%20481.665%20462.458%20485.605%20482.573%20488.188C444.692%20527.356%20405.165%20564.723%20367.56%20603.586C345.913%20595.957%20315.667%20575.387%20298.429%20560.459C239.877%20510.287%20203.692%20438.79%20197.885%20361.795C191.975%20281.297%20215.668%20207.388%20268.827%20146.216C324.456%2082.203%20392.411%2052.6925%20475.415%2046.7394Z'%20fill='white'/%3e%3cpath%20d='M599.728%20481.69C657.856%20483.212%20708.463%20503.811%20750.261%20544.665C798.358%20591.367%20825.948%20655.23%20826.973%20722.238C827.964%20789.499%20801.884%20854.339%20754.591%20902.21C723.506%20933.423%20679.819%20961.053%20636.743%20971.226C598.892%20980.168%20544.519%20977.283%20504.135%20977.272L347.154%20977.229C347.549%20947.524%20346.632%20916.201%20346.656%20886.173L347.627%20760.348C347.577%20730.162%20342.605%20691.19%20368.332%20669.901C374.658%20664.673%20382.145%20661.034%20390.168%20659.291C401.907%20656.775%20467.572%20658.129%20480.382%20659.512L480.576%20835.474C513.86%20834.534%20548.092%20836.958%20581.134%20835.31C634.982%20832.627%20679.388%20782.817%20680.998%20730.216C681.988%20700.108%20671.007%20670.83%20650.457%20648.788C637.412%20635.097%20620.91%20625.18%20602.693%20620.082C581.639%20614.233%20546.343%20615.305%20523.24%20615.02C487.183%20614.819%20451.126%20614.405%20415.073%20613.773C434.397%20593.116%20456.392%20572.269%20475.96%20552.088C517.855%20508.882%20535.165%20485.246%20599.728%20481.69Z'%20fill='white'/%3e%3c/svg%3e";
const logoDark = "data:image/svg+xml,%3csvg%20width='1024'%20height='1024'%20viewBox='0%200%201024%201024'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M475.415%2046.7394C478.505%2045.9272%20486.557%2045.9726%20489.918%2046.0244C609.607%2047.8756%20717.391%20120.168%20760.512%20232.981C786.016%20299.702%20787.259%20375.466%20759.113%20441.475L598.146%20441.421C611.585%20423.413%20622.191%20406.871%20628.58%20385.229C639.765%20347.34%20637.856%20305.148%20618.623%20270.177C599.182%20234.828%20568.83%20207.222%20529.971%20195.642C491.259%20184.17%20449.579%20188.657%20414.178%20208.11C378.498%20227.926%20356.39%20260.249%20345.271%20299.134C326.419%20370.373%20360.684%20439.52%20425.564%20472.413C443.813%20481.665%20462.458%20485.605%20482.573%20488.188C444.692%20527.356%20405.165%20564.723%20367.56%20603.586C345.913%20595.957%20315.667%20575.387%20298.429%20560.459C239.877%20510.287%20203.692%20438.79%20197.885%20361.795C191.975%20281.297%20215.668%20207.388%20268.827%20146.216C324.456%2082.203%20392.411%2052.6925%20475.415%2046.7394Z'%20fill='%230E0D0E'/%3e%3cpath%20d='M599.728%20481.69C657.856%20483.212%20708.463%20503.811%20750.261%20544.665C798.357%20591.367%20825.948%20655.23%20826.973%20722.238C827.963%20789.499%20801.884%20854.339%20754.591%20902.21C723.506%20933.423%20679.819%20961.053%20636.743%20971.226C598.892%20980.168%20544.519%20977.283%20504.135%20977.272L347.154%20977.229C347.549%20947.524%20346.632%20916.201%20346.656%20886.173L347.627%20760.348C347.577%20730.162%20342.604%20691.19%20368.332%20669.901C374.658%20664.673%20382.145%20661.034%20390.168%20659.291C401.907%20656.775%20467.572%20658.129%20480.382%20659.512L480.576%20835.474C513.86%20834.534%20548.091%20836.958%20581.133%20835.31C634.982%20832.627%20679.388%20782.817%20680.998%20730.216C681.988%20700.108%20671.007%20670.83%20650.457%20648.788C637.412%20635.097%20620.91%20625.18%20602.693%20620.082C581.639%20614.233%20546.343%20615.305%20523.24%20615.02C487.183%20614.819%20451.126%20614.405%20415.073%20613.773C434.396%20593.116%20456.392%20572.269%20475.96%20552.088C517.855%20508.882%20535.165%20485.246%20599.728%20481.69Z'%20fill='%230E0D0E'/%3e%3c/svg%3e";
function TitleBar({
  onOpen,
  theme,
  toggleTheme,
  onViewChange,
  currentView,
  isEncoding,
  isPaused,
  hasVideos,
  onStartEncoding,
  onPause,
  onStop,
  onClearQueue
}) {
  const [toggling, setToggling] = reactExports.useState(false);
  const [fileMenuOpen, setFileMenuOpen] = reactExports.useState(false);
  const fileMenuRef = reactExports.useRef(null);
  const handleToggle = reactExports.useCallback(() => {
    setToggling(true);
    toggleTheme();
    setTimeout(() => setToggling(false), 450);
  }, [toggleTheme]);
  reactExports.useEffect(() => {
    if (!fileMenuOpen) return;
    const handler = (e) => {
      if (fileMenuRef.current && !fileMenuRef.current.contains(e.target)) {
        setFileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [fileMenuOpen]);
  const menuAction = (fn) => {
    setFileMenuOpen(false);
    fn();
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "titlebar", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "titlebar-drag-region" }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "titlebar-content", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "titlebar-left", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "titlebar-logo", children: /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: theme === "dark" ? logoWhite : logoDark, alt: "Logo" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("nav", { className: "titlebar-menu", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "tb-file-menu", ref: fileMenuRef, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                className: fileMenuOpen ? "active" : "",
                onClick: () => setFileMenuOpen((v2) => !v2),
                children: "Файл"
              }
            ),
            fileMenuOpen && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "tb-dropdown", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "tb-dropdown-item", onClick: () => menuAction(() => {
                onViewChange("source");
                onOpen();
              }), children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "tb-item-label", children: "Открыть источник" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  className: "tb-dropdown-item tb-dropdown-item--danger",
                  disabled: !hasVideos || isEncoding,
                  onClick: () => menuAction(onClearQueue),
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "tb-item-label", children: "Очистить очередь" })
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "tb-dropdown-sep" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  className: "tb-dropdown-item",
                  disabled: !hasVideos || isEncoding,
                  onClick: () => menuAction(onStartEncoding),
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "tb-item-label", children: "Начать кодирование" })
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  className: "tb-dropdown-item",
                  disabled: !isEncoding,
                  onClick: () => menuAction(onPause),
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "tb-item-label", children: isPaused ? "Продолжить" : "Пауза" })
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  className: "tb-dropdown-item tb-dropdown-item--danger",
                  disabled: !isEncoding,
                  onClick: () => menuAction(onStop),
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "tb-item-label", children: "Стоп" })
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "tb-dropdown-sep" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "tb-dropdown-item", onClick: () => menuAction(() => window.api.close()), children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "tb-item-label", children: "Выход" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "tb-dropdown-sep" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "tb-dropdown-item", onClick: () => menuAction(() => window.api.openDevTools()), children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "tb-item-label", children: "Консоль отладки" }) })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              className: currentView === "settings" ? "active" : "",
              onClick: () => onViewChange("settings"),
              children: "Настройки"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              className: currentView === "about" ? "active" : "",
              onClick: () => onViewChange("about"),
              children: "О программе"
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "titlebar-right", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "theme-toggle", onClick: handleToggle, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `toggle-switch ${theme}${toggling ? " toggling" : ""}`, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "bi bi-brightness-high toggle-icon-sun" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "toggle-handle" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "bi bi-moon toggle-icon-moon" })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "window-controls", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "control-btn", onClick: () => window.api.minimize(), children: /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "bi bi-dash-lg" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "control-btn", onClick: () => window.api.maximize(), children: /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "bi bi-square" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "control-btn close", onClick: () => window.api.close(), children: /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "bi bi-x-lg" }) })
        ] })
      ] })
    ] })
  ] });
}
const SERVICE_MAP$1 = {
  "youtube.com": { name: "YouTube", icon: "bi-youtube", color: "#ff0000" },
  "youtu.be": { name: "YouTube", icon: "bi-youtube", color: "#ff0000" },
  "twitter.com": { name: "Twitter / X", icon: "bi-twitter-x", color: "#ffffff" },
  "x.com": { name: "Twitter / X", icon: "bi-twitter-x", color: "#ffffff" },
  "t.co": { name: "Twitter / X", icon: "bi-twitter-x", color: "#ffffff" },
  "instagram.com": { name: "Instagram", icon: "bi-instagram", color: "#e1306c" },
  "ddinstagram.com": { name: "Instagram", icon: "bi-instagram", color: "#e1306c" },
  "reddit.com": { name: "Reddit", icon: "bi-reddit", color: "#ff4500" },
  "redd.it": { name: "Reddit", icon: "bi-reddit", color: "#ff4500" },
  "vimeo.com": { name: "Vimeo", icon: "bi-vimeo", color: "#1ab7ea" },
  "soundcloud.com": { name: "SoundCloud", icon: "bi-soundcloud", color: "#ff5500" },
  "twitch.tv": { name: "Twitch", icon: "bi-twitch", color: "#9146ff" },
  "facebook.com": { name: "Facebook", icon: "bi-facebook", color: "#1877f2" },
  "fb.watch": { name: "Facebook", icon: "bi-facebook", color: "#1877f2" },
  "pinterest.com": { name: "Pinterest", icon: "bi-pinterest", color: "#e60023" },
  "pin.it": { name: "Pinterest", icon: "bi-pinterest", color: "#e60023" },
  "tumblr.com": { name: "Tumblr", icon: "bi-tumblr", color: "#35465c" },
  "snapchat.com": { name: "Snapchat", icon: "bi-snapchat", color: "#fffc00" },
  "tiktok.com": { name: "TikTok", icon: "bi-tiktok", color: "#ff0050" },
  "vt.tiktok.com": { name: "TikTok", icon: "bi-tiktok", color: "#ff0050" },
  "bilibili.com": { name: "Bilibili", icon: "bi-play-circle-fill", color: "#00a1d6" },
  "b23.tv": { name: "Bilibili", icon: "bi-play-circle-fill", color: "#00a1d6" },
  "ok.ru": { name: "OK", icon: "bi-person-circle", color: "#f7931e" },
  "vk.com": { name: "VKontakte", icon: "bi-person-circle", color: "#4a76a8" },
  "vk.ru": { name: "VKontakte", icon: "bi-person-circle", color: "#4a76a8" },
  "rutube.ru": { name: "Rutube", icon: "bi-play-circle-fill", color: "#ff5c00" },
  "dailymotion.com": { name: "Dailymotion", icon: "bi-play-circle-fill", color: "#0066dc" },
  "bsky.app": { name: "Bluesky", icon: "bi-cloud-fill", color: "#0085ff" },
  "xiaohongshu.com": { name: "Xiaohongshu", icon: "bi-book-fill", color: "#ff2442" },
  "xhslink.com": { name: "Xiaohongshu", icon: "bi-book-fill", color: "#ff2442" },
  "loom.com": { name: "Loom", icon: "bi-camera-video-fill", color: "#625df5" },
  "newgrounds.com": { name: "Newgrounds", icon: "bi-joystick", color: "#f6a623" },
  "streamable.com": { name: "Streamable", icon: "bi-play-circle-fill", color: "#41b883" }
};
function detectService$1(raw) {
  if (!raw) return null;
  try {
    const u2 = new URL(raw);
    const host = u2.hostname.replace(/^www\./, "");
    return SERVICE_MAP$1[host] ?? null;
  } catch {
    return null;
  }
}
function isValidUrl$1(raw) {
  try {
    new URL(raw);
    return true;
  } catch {
    return false;
  }
}
function SourcePage({ theme, isDragging, onSelectFiles, onDragOver, onDragLeave, onDrop, onDownload }) {
  const [url, setUrl] = reactExports.useState("");
  const [isDownloading, setIsDownloading] = reactExports.useState(false);
  const [dlError, setDlError] = reactExports.useState("");
  const [dlHint, setDlHint] = reactExports.useState("");
  const trimmed = url.trim();
  const hasUrl = trimmed.length > 0;
  const isUrl = isValidUrl$1(trimmed);
  const service = reactExports.useMemo(() => detectService$1(trimmed), [trimmed]);
  const isUnsupported = hasUrl && isUrl && !service;
  const handleDownload = async () => {
    if (!trimmed || isDownloading || isUnsupported) return;
    setDlError("");
    setDlHint("");
    setIsDownloading(true);
    try {
      await onDownload(trimmed, service);
      setUrl("");
    } catch (err) {
      setDlError(err?.message || "Ошибка запроса форматов");
    } finally {
      setIsDownloading(false);
    }
  };
  const handleChange = (e) => {
    setUrl(e.target.value);
    setDlError("");
    setDlHint("");
  };
  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleDownload();
  };
  let iconEl;
  if (isDownloading) {
    iconEl = /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "dl-spinner" });
  } else if (service) {
    iconEl = /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: `bi ${service.icon}`, style: { color: service.color }, title: service.name });
  } else if (isUnsupported) {
    iconEl = /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "bi bi-x-circle-fill dl-icon--unsupported" });
  } else {
    iconEl = /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "bi bi-link-45deg dl-icon--placeholder" });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "source-wrapper", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "div",
      {
        className: `drop-area ${isDragging ? "active" : ""} ${theme}`,
        onClick: onSelectFiles,
        onDragOver,
        onDragLeave,
        onDrop,
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "drop-content", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "drop-icon-large", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              "img",
              {
                className: "drop-logo",
                src: theme === "dark" ? logoWhite : logoDark,
                alt: "Logo"
              }
            ) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "drop-text-large", children: "Добавить файл / файлы" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "drop-info-large", children: "Вы можете выбрать один или несколько файлов для конвертации, просто перенесите их в эту область" })
        ]
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "dl-zone", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "dl-zone-label", children: "Или скачайте из сети" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "dl-bar", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `dl-input-wrap${isUnsupported ? " dl-input-wrap--error" : ""}${service ? " dl-input-wrap--ok" : ""}`, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "dl-input-icon", children: iconEl }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              className: "dl-input",
              type: "url",
              placeholder: "Вставьте ссылку (YouTube, TikTok, Twitter ...)",
              value: url,
              onChange: handleChange,
              onKeyDown: handleKeyDown,
              disabled: isDownloading,
              spellCheck: false
            }
          ),
          service && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "dl-service-label", children: service.name }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              className: "dl-btn",
              onClick: handleDownload,
              disabled: !trimmed || isDownloading || isUnsupported,
              children: isDownloading ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "dl-spinner" }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "bi bi-cloud-arrow-down-fill" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Скачать" })
              ] })
            }
          )
        ] }),
        isUnsupported && !dlError && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "dl-hint", children: "Сервис не поддерживается" }),
        dlError && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "dl-hint dl-hint--error", children: dlError })
      ] })
    ] })
  ] });
}
const CODEC_RF = {
  x264: { high: 18, medium: 23, low: 30, potato: 51, min: 0, max: 51 },
  x264_10bit: { high: 18, medium: 23, low: 30, potato: 51, min: 0, max: 51 },
  x265: { high: 20, medium: 26, low: 34, potato: 51, min: 0, max: 51 },
  x265_10bit: { high: 20, medium: 26, low: 34, potato: 51, min: 0, max: 51 },
  x265_12bit: { high: 20, medium: 26, low: 34, potato: 51, min: 0, max: 51 },
  svt_av1: { high: 28, medium: 38, low: 50, potato: 63, min: 1, max: 63 },
  svt_av1_10bit: { high: 28, medium: 38, low: 50, potato: 63, min: 1, max: 63 },
  vp8: { high: 5, medium: 15, low: 30, potato: 63, min: 0, max: 63 },
  vp9: { high: 24, medium: 34, low: 46, potato: 63, min: 0, max: 63 },
  vp9_10bit: { high: 24, medium: 34, low: 46, potato: 63, min: 0, max: 63 },
  nvenc_h264: { high: 18, medium: 24, low: 32, potato: 51, min: 0, max: 51 },
  nvenc_h265: { high: 20, medium: 28, low: 38, potato: 51, min: 0, max: 51 },
  nvenc_av1: { high: 20, medium: 28, low: 38, potato: 51, min: 0, max: 51 },
  qsv_h264: { high: 18, medium: 24, low: 32, potato: 51, min: 0, max: 51 },
  qsv_h265: { high: 20, medium: 28, low: 38, potato: 51, min: 0, max: 51 },
  qsv_av1: { high: 20, medium: 28, low: 38, potato: 51, min: 0, max: 51 },
  vce_h264: { high: 18, medium: 24, low: 32, potato: 51, min: 0, max: 51 },
  vce_h265: { high: 20, medium: 28, low: 38, potato: 51, min: 0, max: 51 },
  vce_av1: { high: 20, medium: 28, low: 38, potato: 51, min: 0, max: 51 },
  mf_h264: { high: 18, medium: 24, low: 32, potato: 51, min: 0, max: 51 },
  mf_h265: { high: 20, medium: 28, low: 38, potato: 51, min: 0, max: 51 },
  theora: { high: 8, medium: 6, low: 3, potato: 0, min: 0, max: 10 }
};
const X264_X265_SPEEDS = [
  { value: "ultrafast", label: "ultrafast", desc: "Кодирует в 10–15× быстрее slow. Файл в 2–3× больше при том же качестве. Только для тестов." },
  { value: "superfast", label: "superfast", desc: "В 7–10× быстрее slow. Файл значительно больше — сжатие слабое." },
  { value: "veryfast", label: "veryfast", desc: "В 4–5× быстрее slow. Заметный проигрыш в размере файла." },
  { value: "faster", label: "faster", desc: "В 2–3× быстрее slow. Файл немного крупнее при том же качестве." },
  { value: "fast", label: "fast", desc: "В 1.5× быстрее slow. Небольшая потеря сжатия по сравнению с medium." },
  { value: "medium", label: "medium", desc: "Дефолтный пресет. Разумный баланс скорости и размера файла." },
  { value: "slow", label: "slow", desc: "Лучше сжатие, чем medium: файл на 5–10% меньше при том же качестве. Рекомендован для архива.", recommended: true },
  { value: "slower", label: "slower", desc: "Файл ещё на 3–5% меньше, чем slow. Заметно дольше кодирование." },
  { value: "veryslow", label: "veryslow", desc: "Максимальное сжатие. Файл на ~10% меньше, чем slow, но кодирует в 3–4× дольше." }
];
const SVT_AV1_SPEEDS = [
  { value: "12", label: "12 — Fastest", desc: "Максимальная скорость. Файл значительно больше, чем при preset 6." },
  { value: "11", label: "11", desc: "Очень быстро, слабое сжатие." },
  { value: "10", label: "10", desc: "Быстро, но файл заметно крупнее среднего." },
  { value: "9", label: "9", desc: "Чуть медленнее 10, ощутимо лучше сжатие." },
  { value: "8", label: "8", desc: "Хорошая скорость, приемлемый размер файла." },
  { value: "7", label: "7", desc: "Немного медленнее 8, немного меньше файл." },
  { value: "6", label: "6 — Balanced", desc: "Оптимальный баланс скорости и размера файла. Рекомендован.", recommended: true },
  { value: "5", label: "5", desc: "Файл на ~3% меньше, чем при 6, но кодирует заметно дольше." },
  { value: "4", label: "4", desc: "Хорошее сжатие, кодирование в 2× медленнее, чем при 6." },
  { value: "3", label: "3", desc: "Отличное сжатие. Заметный прирост времени." },
  { value: "2", label: "2", desc: "Очень медленно. Минимальный прирост качества по сравнению с 3." },
  { value: "1", label: "1", desc: "Почти максимальное качество. Очень медленно." },
  { value: "0", label: "0 — Slowest", desc: "Наилучшее сжатие. Кодирует в 5–8× дольше, чем preset 6." }
];
const NVENC_SPEEDS = [
  { value: "default", label: "default", desc: "Стандартный пресет NVENC — аналог balanced." },
  { value: "hp", label: "hp (High Perf)", desc: "Максимальная скорость GPU. Файл чуть больше, чем hq." },
  { value: "hq", label: "hq (High Quality)", desc: "Лучшее качество при аппаратном кодировании. Файл немного меньше, скорость чуть ниже hp.", recommended: true },
  { value: "bd", label: "bd (Blu-ray)", desc: "Настройки для Blu-ray совместимости. Для обычных файлов отличий от default нет." },
  { value: "ll", label: "ll (Low Latency)", desc: "Сниженная задержка за счёт ухудшения сжатия. Файл крупнее." },
  { value: "llhq", label: "llhq (LL + HQ)", desc: "Сниженная задержка с сохранением качества. Компромисс между ll и hq." },
  { value: "llhp", label: "llhp (LL + HP)", desc: "Максимальная скорость с низкой задержкой. Файл самый крупный." }
];
const QSV_SPEEDS = [
  { value: "veryfast", label: "veryfast", desc: "Максимальная скорость QSV. Файл заметно крупнее, чем balanced." },
  { value: "faster", label: "faster", desc: "Быстро, сжатие хуже среднего." },
  { value: "fast", label: "fast", desc: "Немного быстрее balanced, файл чуть больше." },
  { value: "balanced", label: "balanced", desc: "Оптимальный баланс скорости и размера файла для QSV. Рекомендован.", recommended: true },
  { value: "slow", label: "slow", desc: "Лучше сжатие, чем balanced. Файл немного меньше." },
  { value: "slower", label: "slower", desc: "Ещё лучше сжатие, но кодирует заметно дольше." },
  { value: "veryslow", label: "veryslow", desc: "Максимальное качество QSV. Медленнее, но разница с slower невелика." }
];
const VCE_SPEEDS = [
  { value: "speed", label: "speed", desc: "Максимальная скорость AMD VCE. Файл крупнее, чем quality." },
  { value: "balanced", label: "balanced", desc: "Баланс скорости и размера файла." },
  { value: "quality", label: "quality", desc: "Лучшее сжатие AMD VCE. Файл на ~10% меньше speed при том же качестве. Рекомендован.", recommended: true }
];
const VP_SPEEDS = [
  { value: "best", label: "best", desc: "Лучшее сжатие VP8/VP9. Файл меньше, кодирование значительно дольше.", recommended: true },
  { value: "good", label: "good", desc: "Разумный баланс скорости и размера файла." },
  { value: "realtime", label: "realtime", desc: "Очень быстро, но слабое сжатие. Файл значительно крупнее." }
];
const ENCODER_PRESETS = {
  x264: X264_X265_SPEEDS,
  x264_10bit: X264_X265_SPEEDS,
  x265: X264_X265_SPEEDS,
  x265_10bit: X264_X265_SPEEDS,
  x265_12bit: X264_X265_SPEEDS,
  svt_av1: SVT_AV1_SPEEDS,
  svt_av1_10bit: SVT_AV1_SPEEDS,
  nvenc_h264: NVENC_SPEEDS,
  nvenc_h265: NVENC_SPEEDS,
  nvenc_av1: NVENC_SPEEDS,
  qsv_h264: QSV_SPEEDS,
  qsv_h265: QSV_SPEEDS,
  qsv_av1: QSV_SPEEDS,
  vce_h264: VCE_SPEEDS,
  vce_h265: VCE_SPEEDS,
  vce_av1: VCE_SPEEDS,
  mf_h264: [{ value: "default", label: "default", desc: "Единственный пресет. Параметры задаются драйвером." }],
  mf_h265: [{ value: "default", label: "default", desc: "Единственный пресет. Параметры задаются драйвером." }],
  vp8: VP_SPEEDS,
  vp9: VP_SPEEDS,
  vp9_10bit: VP_SPEEDS,
  theora: []
};
const DEFAULT_SETTINGS = {
  // Video
  format: "av_mp4",
  resolution: "source",
  fps: "source",
  fpsMode: "vfr",
  quality: "high",
  customQuality: 20,
  encoder: "x265",
  encoderSpeed: "slow",
  hwDecoding: "none",
  multiPass: false,
  // Audio
  audioCodec: "av_aac",
  audioBitrate: "160",
  audioMixdown: "stereo",
  audioSampleRate: "auto",
  chapterMarkers: true,
  optimizeMP4: false,
  // Subtitles
  subtitleMode: "none",
  subtitleBurn: false,
  subtitleDefault: false,
  subtitleLanguage: "any",
  subtitleExternalFile: "",
  // Filters
  deinterlace: "off",
  denoise: "off",
  deblock: "off",
  sharpen: "off",
  grayscale: false,
  rotate: "0",
  // HDR & Meta
  hdrMetadata: "off",
  keepMetadata: false,
  inlineParamSets: false,
  // UI
  showAllCodecs: false
};
const GPU_ENCODER_MAP = {
  nvidia: { encoder: "nvenc_h264", encoderSpeed: "hq" },
  amd: { encoder: "vce_h264", encoderSpeed: "quality" },
  intel: { encoder: "qsv_h264", encoderSpeed: "balanced" }
};
function getDefaultSettingsForGpu(vendor) {
  return { ...DEFAULT_SETTINGS, ...GPU_ENCODER_MAP[vendor] || {} };
}
function getStoredGpuVendor() {
  try {
    return localStorage.getItem("gorex-gpu-vendor") || null;
  } catch {
    return null;
  }
}
function saveGpuVendor(vendor) {
  try {
    localStorage.setItem("gorex-gpu-vendor", vendor);
  } catch {
  }
}
function initDefaultSettings() {
  try {
    const saved = localStorage.getItem("gorex-default-settings");
    if (saved) return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
  } catch {
  }
  const vendor = getStoredGpuVendor();
  return vendor ? getDefaultSettingsForGpu(vendor) : { ...DEFAULT_SETTINGS };
}
const ENCODER_GROUPS = [
  {
    label: "Программные",
    encoders: [
      { value: "x265", label: "H.265 / HEVC (x265)", desc: "Вдвое эффективнее H.264. Лучший выбор для архива и 4K. Медленнее." },
      { value: "x265_10bit", label: "H.265 10-bit (x265)", desc: "H.265 с расширенным цветом. Лучше для HDR и плавных градиентов." },
      { value: "x265_12bit", label: "H.265 12-bit (x265)", desc: "H.265 профессионального уровня. Избыточен для большинства задач." },
      { value: "x264", label: "H.264 (x264)", desc: "Максимальная совместимость. Воспроизводится на любом устройстве." },
      { value: "x264_10bit", label: "H.264 10-bit (x264)", desc: "H.264 с улучшенным цветом. Чуть хуже совместимость со старыми ТВ." },
      { value: "svt_av1", label: "AV1 (SVT-AV1)", desc: "Современный открытый кодек. Эффективнее H.265, но значительно медленнее." },
      { value: "svt_av1_10bit", label: "AV1 10-bit (SVT-AV1)", desc: "AV1 с поддержкой широкого цвета и HDR." },
      { value: "vp9", label: "VP9 (libvpx)", desc: "Открытый кодек Google. Хорош для YouTube и HTML5 видео." },
      { value: "vp9_10bit", label: "VP9 10-bit (libvpx)", desc: "VP9 с расширенным диапазоном цвета." },
      { value: "vp8", label: "VP8 (libvpx)", desc: "Устаревший. Рекомендуется только для контейнера WebM." },
      { value: "theora", label: "Theora", desc: "Открытый кодек для OGG. Устарел, не рекомендуется." }
    ]
  },
  {
    label: "NVIDIA (NVENC)",
    encoders: [
      { value: "nvenc_h264", label: "H.264 NVENC", desc: "Аппаратный H.264 на GPU NVIDIA. В 10–20× быстрее x264, качество чуть ниже." },
      { value: "nvenc_h265", label: "H.265 NVENC", desc: "Быстрый H.265 через NVENC. Карты Pascal и новее." },
      { value: "nvenc_av1", label: "AV1 NVENC", desc: "Аппаратный AV1. Только RTX 40xx и новее." }
    ]
  },
  {
    label: "Intel (QSV)",
    encoders: [
      { value: "qsv_h264", label: "H.264 QSV", desc: "Аппаратный H.264 через Intel Quick Sync. Быстро, умеренное качество." },
      { value: "qsv_h265", label: "H.265 QSV", desc: "Быстрый H.265 через QSV. Skylake и новее." },
      { value: "qsv_av1", label: "AV1 QSV", desc: "Аппаратный AV1 через QSV. Только Intel Arc." }
    ]
  },
  {
    label: "AMD (VCE)",
    encoders: [
      { value: "vce_h264", label: "H.264 VCE", desc: "Аппаратный H.264 на видеокартах AMD. Быстро, совместимость везде." },
      { value: "vce_h265", label: "H.265 VCE", desc: "Быстрый H.265 на AMD. Карты RX 5xxx и новее." },
      { value: "vce_av1", label: "AV1 VCE", desc: "Аппаратный AV1 на AMD. Только RX 7xxx и новее." }
    ]
  },
  {
    label: "Windows (MediaFoundation)",
    encoders: [
      { value: "mf_h264", label: "H.264 MF", desc: "H.264 через Windows Media API. Резервный вариант при отсутствии NVENC/QSV/VCE." },
      { value: "mf_h265", label: "H.265 MF", desc: "H.265 через Windows Media API. Совместимость зависит от драйверов." }
    ]
  }
];
function getConversionEncoderGroups(vendor, showAll) {
  ENCODER_GROUPS.find((g) => g.label === "Программные");
  const nvenc = ENCODER_GROUPS.find((g) => g.label === "NVIDIA (NVENC)");
  const qsv = ENCODER_GROUPS.find((g) => g.label === "Intel (QSV)");
  const vce = ENCODER_GROUPS.find((g) => g.label === "AMD (VCE)");
  ENCODER_GROUPS.find((g) => g.label === "Windows (MediaFoundation)");
  const gpuGroupMap = { nvidia: nvenc, intel: qsv, amd: vce };
  const gpuGroup = gpuGroupMap[vendor];
  const softwarePrimary = {
    label: "Программные",
    encoders: [
      { value: "x265", label: "H.265 / HEVC (x265)", desc: "Вдвое эффективнее H.264. Лучший выбор для архива и 4K. Медленнее." },
      { value: "x264", label: "H.264 (x264)", desc: "Максимальная совместимость. Воспроизводится на любом устройстве." },
      { value: "svt_av1", label: "AV1 (SVT-AV1)", desc: "Современный открытый кодек. Эффективнее H.265, но значительно медленнее." }
    ]
  };
  if (!showAll) {
    if (gpuGroup) {
      const gpuLabel = {
        nvidia: "NVIDIA NVENC (рекомендован)",
        intel: "Intel QSV (рекомендован)",
        amd: "AMD VCE (рекомендован)"
      }[vendor];
      return [
        { label: gpuLabel, encoders: gpuGroup.encoders },
        softwarePrimary
      ];
    }
    return [softwarePrimary];
  }
  if (gpuGroup) {
    const others = ENCODER_GROUPS.filter((g) => g !== gpuGroup);
    return [gpuGroup, ...others];
  }
  return ENCODER_GROUPS;
}
const WEBM_COMPATIBLE_ENCODERS = /* @__PURE__ */ new Set(["vp8", "vp9", "vp9_10bit", "svt_av1", "svt_av1_10bit", "nvenc_av1", "qsv_av1", "vce_av1"]);
const WEBM_COMPATIBLE_AUDIO = /* @__PURE__ */ new Set(["vorbis", "opus"]);
const ENCODER_DISABLED_FORMATS = {
  // VP8 / VP9 — несовместимы с MP4 и MOV
  vp8: /* @__PURE__ */ new Set(["av_mp4", "av_mov"]),
  vp9: /* @__PURE__ */ new Set(["av_mp4", "av_mov"]),
  vp9_10bit: /* @__PURE__ */ new Set(["av_mp4", "av_mov"]),
  // Theora — только MKV
  theora: /* @__PURE__ */ new Set(["av_mp4", "av_mov", "av_webm"])
};
const FORMAT_HELP = {
  av_mp4: "MP4 — универсальный контейнер. Совместим с любыми устройствами, ТВ, смартфонами и браузерами. Лучший выбор для публикации.",
  av_mkv: "MKV — гибкий контейнер без ограничений на количество дорожек. Идеален для архивирования, поддерживает любые кодеки.",
  av_webm: "WebM — контейнер для веба. Поддерживает только VP8/VP9/AV1 и аудио Vorbis/Opus. При выборе WebM кодек автоматически скорректируется.",
  av_mov: "MOV — контейнер Apple QuickTime. Хорошо совместим с macOS / iOS, поддерживает H.264, H.265 и большинство кодеков."
};
const RESOLUTION_HELP = {
  source: "Разрешение исходного видео сохраняется без изменений. Никакого масштабирования.",
  "4k": "4K (2160p) — Ultra HD. Используется для архива и больших экранов. Сохраняет пропорции источника.",
  "1440p": "2K (1440p) — Quad HD. Оптимально для мониторов 2K и архива высокого качества.",
  "1080p": "1080p (Full HD) — стандарт для большинства экранов и видеоплатформ. Хороший баланс качества и размера.",
  "720p": "720p (HD) — меньший файл при приемлемом качестве. Хорошо для мобильных устройств.",
  "480p": "480p (SD) — минимальное разрешение. Самые маленькие файлы, заметная потеря деталей."
};
const FPS_HELP = {
  source: "Частота кадров сохраняется как в источнике. Рекомендуется для большинства случаев.",
  "60": "60 fps — максимальная плавность для геймплея, экшна и спорта. Файл будет значительно крупнее.",
  "30": "30 fps — стандарт для ТВ, YouTube и соцсетей. Хороший баланс плавности и размера.",
  "25": "25 fps — европейский ТВ-стандарт (PAL). Для совместимости с PAL-устройствами.",
  "24": '24 fps — кинематографический стандарт. Создаёт "киношный" облик видео.',
  "23.976": "23.976 fps — NTSC-кинематографический стандарт. Совместим с большинством медиаплееров."
};
const QUALITY_HELP = {
  lossless: "Lossless — RF 0, кодирование без потерь. Файл будет значительно больше исходника, так как хранит декодированный YUV без сжатия.",
  high: "Высокое качество — визуально близко к оригиналу. Рекомендуется для архива и дальнейшего редактирования.",
  medium: "Баланс качества и размера — минимально заметная потеря детализации при значительном уменьшении файла.",
  low: "Низкое качество — заметные артефакты компрессии. Маленький файл для быстрой передачи.",
  potato: "Максимальное сжатие — качество уровня VHS. Артефакты гарантированы. Только если файл нужен очень маленьким.",
  custom: "RF (Rate Factor): чем ниже значение — тем лучше качество и больше размер файла. RF 0 ≈ lossless."
};
const ENCODER_HELP = {
  x265: "H.265/HEVC (libx265) — в 2× эффективнее H.264 при том же качестве. Рекомендован для 4K и архива.",
  x265_10bit: "H.265 10-bit — лучше сохраняет HDR, плавные градиенты и контент с широким цветом.",
  x265_12bit: "H.265 12-bit — для профессионального мастеринга. Избыточен для большинства задач.",
  x264: "H.264 (libx264) — самый совместимый кодек. Воспроизводится на любом устройстве.",
  x264_10bit: "H.264 10-bit — лучшее сохранение цвета при чуть меньшей совместимости.",
  svt_av1: "AV1 (SVT-AV1) — современный открытый кодек. Эффективнее H.265, но медленнее в кодировании.",
  svt_av1_10bit: "AV1 10-bit — AV1 с поддержкой широкого цвета и HDR.",
  vp9: "VP9 (libvpx) — открытый кодек Google. Хорош для YouTube и HTML5 видео.",
  vp9_10bit: "VP9 10-bit — VP9 с расширенным диапазоном цвета.",
  vp8: "VP8 (libvpx) — устаревший кодек. Рекомендуется только в контейнере WebM.",
  theora: "Theora — открытый кодек для контейнера OGG. Устарел, использовать не рекомендуется.",
  nvenc_h264: "NVIDIA NVENC H.264 — аппаратное кодирование на GPU NVIDIA. Очень быстро, качество чуть ниже x264.",
  nvenc_h265: "NVIDIA NVENC H.265 — быстрый аппаратный H.265 на картах NVIDIA Pascal и новее.",
  nvenc_av1: "NVIDIA NVENC AV1 — аппаратный AV1 на картах RTX 40xx+.",
  qsv_h264: "Intel QSV H.264 — аппаратное ускорение через Intel Graphics или Arc.",
  qsv_h265: "Intel QSV H.265 — быстрый H.265 через Intel Quick Sync (Skylake+).",
  qsv_av1: "Intel QSV AV1 — аппаратный AV1 на Intel Arc.",
  vce_h264: "AMD VCE H.264 — аппаратное кодирование на видеокартах AMD.",
  vce_h265: "AMD VCE H.265 — аппаратный H.265 на AMD RX 5xxx+.",
  vce_av1: "AMD VCE AV1 — аппаратный AV1 на AMD RX 7xxx+.",
  mf_h264: "MediaFoundation H.264 — аппаратное кодирование через Windows Media API.",
  mf_h265: "MediaFoundation H.265 — H.265 через Windows Media API."
};
function getResolutionOptions(videos) {
  const opts = [{ value: "source", label: "По исходному" }];
  let isPortrait = false;
  let maxDim = 0;
  if (videos && videos.length > 0) {
    const portraitCount = videos.filter((v2) => {
      if (!v2.resolution) return false;
      const [w2, h] = v2.resolution.split("x").map(Number);
      return h > w2;
    }).length;
    isPortrait = portraitCount > videos.length / 2;
    videos.forEach((v2) => {
      if (!v2.resolution) return;
      const [w2, h] = v2.resolution.split("x").map(Number);
      maxDim = Math.max(maxDim, w2, h);
    });
  }
  const standard = [
    { value: "4k", label: isPortrait ? "4K вертикально (2160p)" : "4K (2160p)", short: 2160 },
    { value: "1440p", label: isPortrait ? "2K вертикально (1440p)" : "2K (1440p)", short: 1440 },
    { value: "1080p", label: isPortrait ? "1080p вертикально" : "1080p", short: 1080 },
    { value: "720p", label: isPortrait ? "720p вертикально" : "720p", short: 720 },
    { value: "480p", label: isPortrait ? "480p вертикально" : "480p", short: 480 }
  ];
  standard.forEach((r2) => {
    if (maxDim === 0 || r2.short <= maxDim + 20) {
      opts.push(r2);
    }
  });
  return opts;
}
function GsSelect({ value, onChange, options, groups, disabled, className, onSpecial, direction = "up" }) {
  const [open, setOpen] = reactExports.useState(false);
  const ref = reactExports.useRef(null);
  reactExports.useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);
  let currentLabel = value;
  if (options) {
    const found = options.find((o) => o.value === value);
    if (found) currentLabel = found.label;
  }
  if (groups) {
    outer: for (const g of groups) {
      for (const o of g.options) {
        if (o.value === value) {
          currentLabel = o.label;
          break outer;
        }
      }
    }
  }
  const handleSelect = (optValue, special, optDisabled) => {
    if (optDisabled) return;
    setOpen(false);
    if (special && onSpecial) {
      onSpecial(optValue);
      return;
    }
    onChange(optValue);
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      className: `gs-dropdown${disabled ? " gs-dropdown--disabled" : ""}${open ? " gs-dropdown--open" : ""}${direction === "down" ? " gs-dropdown--down" : ""}${className ? " " + className : ""}`,
      ref,
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            className: "gs-dropdown-trigger",
            type: "button",
            onClick: () => {
              if (!disabled) setOpen((v2) => !v2);
            },
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "gs-dropdown-value", children: currentLabel }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "bi bi-chevron-down gs-dropdown-chevron" })
            ]
          }
        ),
        open && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "gs-dropdown-menu", children: [
          options && options.map((o) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "button",
            {
              type: "button",
              disabled: !!o.disabled,
              className: `gs-dropdown-item${o.value === value ? " active" : ""}${o.special ? " gs-dropdown-item--special" : ""}${o.disabled ? " gs-dropdown-item--disabled" : ""}${o.tags && o.tags.length ? " gs-dropdown-item--with-tags" : ""}`,
              onClick: () => handleSelect(o.value, o.special, o.disabled),
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "gs-dropdown-item-main", children: [
                  o.label,
                  o.recommended && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "gs-dropdown-item-badge", children: "рекомендован" })
                ] }),
                o.tags && o.tags.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "gs-dropdown-item-tags", children: o.tags.map((t2) => /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: `gs-item-tag ${t2.cls}`, children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: `bi ${t2.icon}` }),
                  t2.label
                ] }, t2.key)) }),
                o.desc && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "gs-dropdown-item-desc", children: o.desc })
              ]
            },
            o.value
          )),
          groups && groups.map((g, gi2) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `gs-dropdown-group${gi2 > 0 ? " gs-dropdown-group--sep" : ""}`, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "gs-dropdown-group-label", children: g.label }),
            g.options.map((o) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "button",
              {
                type: "button",
                disabled: !!o.disabled,
                className: `gs-dropdown-item${o.value === value ? " active" : ""}${o.disabled ? " gs-dropdown-item--disabled" : ""}${o.tags && o.tags.length ? " gs-dropdown-item--with-tags" : ""}`,
                onClick: () => handleSelect(o.value, false, o.disabled),
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "gs-dropdown-item-main", children: o.label }),
                  o.tags && o.tags.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "gs-dropdown-item-tags", children: o.tags.map((t2) => /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: `gs-item-tag ${t2.cls}`, children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: `bi ${t2.icon}` }),
                    t2.label
                  ] }, t2.key)) }),
                  o.desc && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "gs-dropdown-item-desc", children: o.desc })
                ]
              },
              o.value
            ))
          ] }, g.label))
        ] })
      ]
    }
  );
}
function Tooltip({ text }) {
  const [visible, setVisible] = reactExports.useState(false);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "gs-tooltip-wrap", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "button",
      {
        className: "gs-help-btn",
        onMouseEnter: () => setVisible(true),
        onMouseLeave: () => setVisible(false),
        onClick: (e) => {
          e.stopPropagation();
          setVisible((v2) => !v2);
        },
        tabIndex: -1,
        children: /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "bi bi-question-circle" })
      }
    ),
    visible && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "gs-tooltip", children: text })
  ] });
}
function GlobalSettings({ settings, onChange, videos, disabled, gpuVendor }) {
  const [showCustomQuality, setShowCustomQuality] = reactExports.useState(false);
  const [draftRF, setDraftRF] = reactExports.useState(settings.customQuality);
  const rfTable = CODEC_RF[settings.encoder] || CODEC_RF.x265;
  const speedPresets = ENCODER_PRESETS[settings.encoder] ?? [];
  const resOptions = getResolutionOptions(videos);
  const encoderGroups = getConversionEncoderGroups(gpuVendor || "unknown", !!settings.showAllCodecs);
  const update = (key, value) => onChange({ ...settings, [key]: value });
  const handleFormatChange = (fmt) => {
    const patch = { format: fmt };
    if (fmt === "av_webm") {
      if (!WEBM_COMPATIBLE_ENCODERS.has(settings.encoder)) {
        const speeds = ENCODER_PRESETS.vp9;
        patch.encoder = "vp9";
        patch.encoderSpeed = speeds[Math.floor(speeds.length / 2)]?.value ?? "good";
      }
      const audioCodec = settings.audioCodec || "av_aac";
      if (!WEBM_COMPATIBLE_AUDIO.has(audioCodec) && !audioCodec.startsWith("copy")) {
        patch.audioCodec = "opus";
      }
    }
    onChange({ ...settings, ...patch });
  };
  const openCustomQuality = () => {
    setDraftRF(settings.quality === "custom" ? settings.customQuality : rfTable[settings.quality] ?? rfTable.medium);
    setShowCustomQuality(true);
  };
  const confirmCustomQuality = () => {
    onChange({ ...settings, quality: "custom", customQuality: draftRF });
    setShowCustomQuality(false);
  };
  const handleEncoderChange = (enc) => {
    const speeds = ENCODER_PRESETS[enc] ?? [];
    const mid = speeds[Math.floor(speeds.length / 2)]?.value ?? "medium";
    onChange({ ...settings, encoder: enc, encoderSpeed: mid });
  };
  const qualityPresets = [
    { key: "high", label: "Высокое", rf: rfTable.high },
    { key: "medium", label: "Среднее", rf: rfTable.medium },
    { key: "low", label: "Низкое", rf: rfTable.low },
    { key: "potato", label: "Шакал", rf: rfTable.potato }
  ];
  settings.quality === "custom" ? settings.customQuality : rfTable[settings.quality];
  const currentFormatHelp = FORMAT_HELP[settings.format] || "Контейнер для выходного файла.";
  const currentResHelp = RESOLUTION_HELP[settings.resolution] || "Целевое разрешение выходного видео.";
  const currentFpsHelp = FPS_HELP[settings.fps] || "Частота кадров выходного видео.";
  const currentQualityHelp = settings.quality === "custom" ? QUALITY_HELP.custom : QUALITY_HELP[settings.quality] || QUALITY_HELP.custom;
  const currentEncHelp = ENCODER_HELP[settings.encoder] || "Видеокодек для кодирования.";
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "global-settings", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "gs-card gs-card--format", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "gs-card-header", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "bi bi-file-earmark-play gs-icon" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "gs-card-label", children: "Формат" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Tooltip, { text: currentFormatHelp })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          GsSelect,
          {
            value: settings.format,
            options: (() => {
              const disabledSet = ENCODER_DISABLED_FORMATS[settings.encoder] || /* @__PURE__ */ new Set();
              return [
                { value: "av_mp4", label: "MP4", disabled: disabledSet.has("av_mp4") },
                { value: "av_mkv", label: "MKV" },
                { value: "av_webm", label: "WebM", disabled: disabledSet.has("av_webm") },
                { value: "av_mov", label: "MOV", disabled: disabledSet.has("av_mov") }
              ];
            })(),
            onChange: handleFormatChange,
            disabled
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "gs-card gs-card--resolution", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "gs-card-header", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "bi bi-aspect-ratio gs-icon" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "gs-card-label", children: "Разрешение" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Tooltip, { text: currentResHelp })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          GsSelect,
          {
            value: settings.resolution,
            options: resOptions.map((o) => ({ value: o.value, label: o.label })),
            onChange: (v2) => update("resolution", v2),
            disabled
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "gs-card gs-card--fps", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "gs-card-header", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "bi bi-camera-video gs-icon" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "gs-card-label", children: "FPS" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Tooltip, { text: currentFpsHelp })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          GsSelect,
          {
            value: settings.fps,
            options: [
              { value: "source", label: "По исходному" },
              { value: "60", label: "60 fps" },
              { value: "30", label: "30 fps" },
              { value: "25", label: "25 fps" },
              { value: "24", label: "24 fps" },
              { value: "23.976", label: "23.976 fps" }
            ],
            onChange: (v2) => update("fps", v2),
            disabled
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "gs-card gs-card--quality", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "gs-card-header", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "bi bi-sliders2 gs-icon" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "gs-card-label", children: "Качество" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Tooltip, { text: currentQualityHelp })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          GsSelect,
          {
            value: settings.quality,
            options: [
              { value: "lossless", label: `Lossless (RF ${rfTable.min})` },
              ...qualityPresets.map((p2) => ({ value: p2.key, label: `${p2.label} (RF ${p2.rf})` })),
              { value: "custom", label: settings.quality === "custom" ? `Своё (RF ${settings.customQuality})` : "Своё...", special: true }
            ],
            onChange: (v2) => update("quality", v2),
            onSpecial: () => openCustomQuality(),
            disabled
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "gs-card gs-card--codec", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "gs-card-header", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "bi bi-cpu gs-icon" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "gs-card-label", children: "Кодек / Кодировщик" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Tooltip, { text: currentEncHelp })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "gs-codec-row", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            GsSelect,
            {
              value: settings.encoder,
              groups: encoderGroups.map((g) => ({ label: g.label, options: g.encoders.map((e) => ({
                value: e.value,
                label: e.label,
                desc: e.desc,
                disabled: settings.format === "av_webm" && !WEBM_COMPATIBLE_ENCODERS.has(e.value)
              })) })),
              onChange: handleEncoderChange,
              disabled,
              className: "gs-dropdown--encoder"
            }
          ),
          speedPresets.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(
            GsSelect,
            {
              value: settings.encoderSpeed,
              options: speedPresets,
              onChange: (v2) => update("encoderSpeed", v2),
              disabled,
              className: "gs-dropdown--speed"
            }
          )
        ] })
      ] })
    ] }),
    showCustomQuality && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "gs-quality-overlay", onClick: () => setShowCustomQuality(false), children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "gs-quality-popup", onClick: (e) => e.stopPropagation(), children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "gs-qpopup-title", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "bi bi-sliders2" }),
        "Пользовательское качество"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "gs-qpopup-subtitle", children: [
        "RF ",
        rfTable.min,
        " = максимальное качество  ·  RF ",
        rfTable.max,
        " = минимальное качество"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "gs-qpopup-value", children: [
        "RF ",
        draftRF
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "input",
        {
          type: "range",
          className: "gs-quality-slider",
          min: rfTable.min,
          max: rfTable.max,
          step: 1,
          value: draftRF,
          onChange: (e) => setDraftRF(Number(e.target.value))
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "gs-qpopup-labels", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Лучше" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Хуже" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "gs-qpopup-hint", children: QUALITY_HELP.custom }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "gs-qpopup-actions", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "gs-qpopup-cancel", onClick: () => setShowCustomQuality(false), children: "Отмена" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "gs-qpopup-confirm", onClick: confirmCustomQuality, children: "Применить" })
      ] })
    ] }) })
  ] });
}
const COMPRESSION_RATIOS = {
  // [high, medium, low, potato] — fraction of source VIDEO size.
  // Calibrated for each encoder's recommended (baseline) preset:
  //   x264/x265 → slow | svt_av1 → preset 6 | nvenc → hq
  //   qsv → balanced | vce → quality | vp8/vp9 → best
  x265: [0.58, 0.39, 0.23, 0.1],
  x265_10bit: [0.58, 0.39, 0.23, 0.1],
  x265_12bit: [0.58, 0.39, 0.23, 0.1],
  x264: [0.8, 0.58, 0.36, 0.17],
  x264_10bit: [0.78, 0.56, 0.34, 0.16],
  svt_av1: [0.5, 0.33, 0.19, 0.08],
  svt_av1_10bit: [0.5, 0.33, 0.19, 0.08],
  vp9: [0.63, 0.44, 0.27, 0.13],
  vp9_10bit: [0.63, 0.44, 0.27, 0.13],
  vp8: [0.88, 0.65, 0.42, 0.2],
  nvenc_h264: [0.85, 0.62, 0.39, 0.19],
  nvenc_h265: [0.6, 0.41, 0.25, 0.12],
  nvenc_av1: [0.53, 0.36, 0.22, 0.1],
  qsv_h264: [0.83, 0.6, 0.38, 0.18],
  qsv_h265: [0.57, 0.39, 0.24, 0.11],
  qsv_av1: [0.53, 0.36, 0.22, 0.1],
  vce_h264: [0.85, 0.63, 0.4, 0.19],
  vce_h265: [0.61, 0.42, 0.26, 0.12],
  vce_av1: [0.55, 0.37, 0.23, 0.11],
  mf_h264: [0.87, 0.65, 0.41, 0.2],
  mf_h265: [0.62, 0.43, 0.27, 0.13],
  theora: [0.9, 0.7, 0.5, 0.24]
};
const SPEED_MULT = {
  x264: { ultrafast: 2.4, superfast: 1.8, veryfast: 1.4, faster: 1.2, fast: 1.1, medium: 1.05, slow: 1, slower: 0.93, veryslow: 0.87 },
  x265: { ultrafast: 2.2, superfast: 1.7, veryfast: 1.35, faster: 1.18, fast: 1.08, medium: 1.04, slow: 1, slower: 0.94, veryslow: 0.88 },
  svt_av1: { "12": 1.6, "11": 1.45, "10": 1.3, "9": 1.18, "8": 1.1, "7": 1.05, "6": 1, "5": 0.97, "4": 0.93, "3": 0.89, "2": 0.87, "1": 0.85, "0": 0.83 },
  nvenc_h264: { hp: 1.08, default: 1.03, bd: 1.03, hq: 1, ll: 1.15, llhq: 1.08, llhp: 1.18 },
  nvenc_h265: { hp: 1.08, default: 1.03, bd: 1.03, hq: 1, ll: 1.15, llhq: 1.08, llhp: 1.18 },
  nvenc_av1: { hp: 1.08, default: 1.03, bd: 1.03, hq: 1, ll: 1.15, llhq: 1.08, llhp: 1.18 },
  qsv_h264: { veryfast: 1.3, faster: 1.18, fast: 1.08, balanced: 1, slow: 0.95, slower: 0.91, veryslow: 0.88 },
  qsv_h265: { veryfast: 1.3, faster: 1.18, fast: 1.08, balanced: 1, slow: 0.95, slower: 0.91, veryslow: 0.88 },
  qsv_av1: { veryfast: 1.3, faster: 1.18, fast: 1.08, balanced: 1, slow: 0.95, slower: 0.91, veryslow: 0.88 },
  vce_h264: { speed: 1.2, balanced: 1.05, quality: 1 },
  vce_h265: { speed: 1.2, balanced: 1.05, quality: 1 },
  vce_av1: { speed: 1.2, balanced: 1.05, quality: 1 },
  vp8: { realtime: 1.3, good: 1.1, best: 1 },
  vp9: { realtime: 1.3, good: 1.1, best: 1 }
};
function parseSizeMB(str) {
  if (!str || str === "—") return null;
  const m2 = str.match(/([\d.]+)\s*(GB|MB)/i);
  if (!m2) return null;
  const v2 = parseFloat(m2[1]);
  return m2[2].toLowerCase() === "gb" ? v2 * 1024 : v2;
}
function fmtMB(mb2) {
  if (mb2 >= 1024) return (mb2 / 1024).toFixed(2) + " GB";
  return Math.round(mb2) + " MB";
}
function parseDurationSec(str) {
  if (!str || str === "—") return null;
  const parts = str.split(":").map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return null;
}
function parseBitrateKbps(str) {
  if (!str || str === "—") return null;
  const m2 = str.match(/([\d.]+)\s*(Mbps|kbps)/i);
  if (!m2) return null;
  const v2 = parseFloat(m2[1]);
  return m2[2].toLowerCase() === "mbps" ? v2 * 1e3 : v2;
}
function getSpeedMult(encoder, speed) {
  const base = encoder.replace(/_10bit|_12bit/, "");
  const table = SPEED_MULT[encoder] || SPEED_MULT[base];
  return table && speed != null && table[speed] != null ? table[speed] : 1;
}
function getRatioForCustomRF(customRF, rfTable, ratios) {
  const anchors = [
    { rf: rfTable.high, ratio: ratios[0] },
    { rf: rfTable.medium, ratio: ratios[1] },
    { rf: rfTable.low, ratio: ratios[2] },
    { rf: rfTable.potato, ratio: ratios[3] }
  ].sort((a, b) => a.rf - b.rf);
  if (customRF <= anchors[0].rf) return anchors[0].ratio;
  if (customRF >= anchors[anchors.length - 1].rf) return anchors[anchors.length - 1].ratio;
  for (let i = 0; i < anchors.length - 1; i++) {
    if (customRF >= anchors[i].rf && customRF <= anchors[i + 1].rf) {
      const t2 = (customRF - anchors[i].rf) / (anchors[i + 1].rf - anchors[i].rf);
      return anchors[i].ratio + t2 * (anchors[i + 1].ratio - anchors[i].ratio);
    }
  }
  return ratios[1];
}
function estimateOutputSize(video, settings) {
  if (!video || !settings || settings.quality === "lossless") return null;
  const sourceMB = parseSizeMB(video.size);
  if (!sourceMB || sourceMB <= 0) return null;
  const encoder = settings.encoder || "x265";
  const ratios = COMPRESSION_RATIOS[encoder] || COMPRESSION_RATIOS.x265;
  const rfTable = CODEC_RF[encoder] || CODEC_RF.x265;
  let videoRatio;
  if (settings.quality === "custom") {
    videoRatio = getRatioForCustomRF(settings.customQuality, rfTable, ratios);
  } else {
    const idx = { high: 0, medium: 1, low: 2, potato: 3 };
    videoRatio = ratios[idx[settings.quality] ?? 1];
  }
  videoRatio *= getSpeedMult(encoder, settings.encoderSpeed);
  if (settings.resolution && settings.resolution !== "source" && video.resolution) {
    const PX = { "4k": 3840 * 2160, "1440p": 2560 * 1440, "1080p": 1920 * 1080, "720p": 1280 * 720, "480p": 854 * 480 };
    const [w2, h] = video.resolution.split("x").map(Number);
    const srcPx = w2 * h;
    const tgtPx = PX[settings.resolution];
    if (tgtPx && tgtPx < srcPx) videoRatio *= Math.pow(tgtPx / srcPx, 0.65);
  }
  if (settings.fps && settings.fps !== "source" && video.fps) {
    const srcFps = parseFloat(video.fps);
    const tgtFps = parseFloat(settings.fps);
    if (srcFps > 0 && tgtFps < srcFps) videoRatio *= tgtFps / srcFps;
  }
  const durationSec = parseDurationSec(video.duration);
  if (durationSec && durationSec > 0) {
    const totalKbps = parseBitrateKbps(video.bitrate);
    const srcAudioKbps = totalKbps ? Math.min(totalKbps * 0.12, 512) : 192;
    const srcAudioMB = srcAudioKbps * 1e3 * durationSec / (8 * 1024 * 1024);
    const srcVideoMB = Math.max(sourceMB - srcAudioMB, sourceMB * 0.8);
    const outVideoMB = srcVideoMB * videoRatio;
    const outAudioKbps = parseInt(settings.audioBitrate) || 160;
    const outAudioMB = outAudioKbps * 1e3 * durationSec / (8 * 1024 * 1024);
    return fmtMB(outVideoMB + outAudioMB);
  }
  return fmtMB(sourceMB * videoRatio);
}
const SERVICE_MAP = {
  "youtube.com": { name: "YouTube", icon: "bi-youtube", color: "#ff0000" },
  "youtu.be": { name: "YouTube", icon: "bi-youtube", color: "#ff0000" },
  "twitter.com": { name: "Twitter / X", icon: "bi-twitter-x", color: "#ffffff" },
  "x.com": { name: "Twitter / X", icon: "bi-twitter-x", color: "#ffffff" },
  "instagram.com": { name: "Instagram", icon: "bi-instagram", color: "#e1306c" },
  "ddinstagram.com": { name: "Instagram", icon: "bi-instagram", color: "#e1306c" },
  "reddit.com": { name: "Reddit", icon: "bi-reddit", color: "#ff4500" },
  "vimeo.com": { name: "Vimeo", icon: "bi-vimeo", color: "#1ab7ea" },
  "soundcloud.com": { name: "SoundCloud", icon: "bi-soundcloud", color: "#ff5500" },
  "twitch.tv": { name: "Twitch", icon: "bi-twitch", color: "#9146ff" },
  "facebook.com": { name: "Facebook", icon: "bi-facebook", color: "#1877f2" },
  "fb.watch": { name: "Facebook", icon: "bi-facebook", color: "#1877f2" },
  "tiktok.com": { name: "TikTok", icon: "bi-tiktok", color: "#ff0050" },
  "vt.tiktok.com": { name: "TikTok", icon: "bi-tiktok", color: "#ff0050" },
  "t.co": { name: "Twitter / X", icon: "bi-twitter-x", color: "#ffffff" },
  "pinterest.com": { name: "Pinterest", icon: "bi-pinterest", color: "#e60023" },
  "pin.it": { name: "Pinterest", icon: "bi-pinterest", color: "#e60023" },
  "tumblr.com": { name: "Tumblr", icon: "bi-tumblr", color: "#35465c" },
  "snapchat.com": { name: "Snapchat", icon: "bi-snapchat", color: "#fffc00" },
  "bilibili.com": { name: "Bilibili", icon: "bi-play-circle-fill", color: "#00a1d6" },
  "b23.tv": { name: "Bilibili", icon: "bi-play-circle-fill", color: "#00a1d6" },
  "ok.ru": { name: "OK", icon: "bi-person-circle", color: "#f7931e" },
  "vk.com": { name: "VKontakte", icon: "bi-person-circle", color: "#4a76a8" },
  "vk.ru": { name: "VKontakte", icon: "bi-person-circle", color: "#4a76a8" },
  "rutube.ru": { name: "Rutube", icon: "bi-play-circle-fill", color: "#ff5c00" },
  "dailymotion.com": { name: "Dailymotion", icon: "bi-play-circle-fill", color: "#0066dc" },
  "bsky.app": { name: "Bluesky", icon: "bi-cloud-fill", color: "#0085ff" },
  "loom.com": { name: "Loom", icon: "bi-camera-video-fill", color: "#625df5" },
  "streamable.com": { name: "Streamable", icon: "bi-play-circle-fill", color: "#41b883" }
};
function detectService(raw) {
  if (!raw) return null;
  try {
    const host = new URL(raw).hostname.replace(/^www\./, "");
    return SERVICE_MAP[host] ?? null;
  } catch {
    return null;
  }
}
function isValidUrl(raw) {
  try {
    new URL(raw);
    return true;
  } catch {
    return false;
  }
}
function formatFileSize(bytes) {
  if (!bytes) return null;
  const mb2 = bytes / (1024 * 1024);
  if (mb2 < 1024) return mb2.toFixed(0) + " MB";
  return (mb2 / 1024).toFixed(1) + " GB";
}
const VCODEC_LABEL = {
  "avc1": "H.264",
  "h264": "H.264",
  "vp09": "VP9",
  "vp9": "VP9",
  "vp08": "VP8",
  "vp8": "VP8",
  "av01": "AV1",
  "av1": "AV1",
  "hvc1": "H.265",
  "hev1": "H.265",
  "h265": "H.265",
  "theora": "Theora"
};
function getCodecLabel(f2) {
  if (!f2.vcodec || f2.vcodec === "none") return null;
  const base = f2.vcodec.split(".")[0].toLowerCase();
  return VCODEC_LABEL[base] || f2.vcodec.split(".")[0];
}
function formatFormatLabel(f2) {
  const res = f2.height ? f2.height + "p" : f2.resolution || null;
  const ext = f2.ext ? f2.ext.toUpperCase() : null;
  const audioOnly = !f2.vcodec || f2.vcodec === "none";
  if (audioOnly) return ["Только аудио", ext].filter(Boolean).join(" ");
  return [res, ext].filter(Boolean).join(" ") || f2.format_id;
}
function buildFormatTags(f2) {
  const tags = [];
  const codec = getCodecLabel(f2);
  if (codec) tags.push({ key: "enc", icon: "bi-cpu", label: codec, cls: "tr-enc" });
  if (f2.fps) tags.push({ key: "fps", icon: "bi-camera-video", label: f2.fps + "fps", cls: "tr-fps" });
  const sz = formatFileSize(f2.filesize);
  if (sz) tags.push({ key: "sz", icon: "bi-hdd", label: "~" + sz, cls: "tr-size" });
  if (!f2.vcodec || f2.vcodec === "none")
    tags.push({ key: "aud", icon: "bi-music-note", label: "аудио", cls: "tr-aud" });
  return tags;
}
function buildYtdlFormatGroups(formats) {
  if (!formats || !formats.length) return [];
  const seen = /* @__PURE__ */ new Map();
  for (const f2 of formats) {
    const codec = getCodecLabel(f2) || f2.ext;
    const key = `${f2.height || 0}_${codec}`;
    const prev = seen.get(key);
    if (!prev || (f2.tbr || 0) > (prev.tbr || 0)) seen.set(key, f2);
  }
  const sorted = [...seen.values()].sort((a, b) => (b.height || 0) - (a.height || 0));
  return [{ label: "Доступные форматы", options: sorted.map((f2) => ({ value: f2.format_id, label: formatFormatLabel(f2), tags: buildFormatTags(f2) })) }];
}
const ENCODER_SHORT = {
  x264: "H.264",
  x264_10bit: "H.264 10b",
  x265: "H.265",
  x265_10bit: "H.265 10b",
  x265_12bit: "H.265 12b",
  svt_av1: "AV1",
  svt_av1_10bit: "AV1 10b",
  vp8: "VP8",
  vp9: "VP9",
  vp9_10bit: "VP9 10b",
  nvenc_h264: "H.264 NVENC",
  nvenc_h265: "H.265 NVENC",
  nvenc_av1: "AV1 NVENC",
  qsv_h264: "H.264 QSV",
  qsv_h265: "H.265 QSV",
  qsv_av1: "AV1 QSV",
  vce_h264: "H.264 VCE",
  vce_h265: "H.265 VCE",
  vce_av1: "AV1 VCE",
  mf_h264: "H.264 MF",
  mf_h265: "H.265 MF",
  theora: "Theora"
};
const FORMAT_LABEL = { av_mp4: "MP4", av_mkv: "MKV", av_webm: "WebM", av_mov: "MOV" };
const RES_LABEL = { "4k": "4K", "1440p": "1440p", "1080p": "1080p", "720p": "720p", "480p": "480p" };
function getTransformTags(video, s) {
  const tags = [];
  if (!s) return tags;
  if (s.format && FORMAT_LABEL[s.format]) tags.push({ key: "fmt", icon: "bi-file-earmark-play", label: FORMAT_LABEL[s.format], cls: "tr-fmt" });
  if (s.encoder) tags.push({ key: "enc", icon: "bi-cpu", label: ENCODER_SHORT[s.encoder] || s.encoder, cls: "tr-enc" });
  if (s.resolution && s.resolution !== "source") tags.push({ key: "res", icon: "bi-aspect-ratio", label: "→ " + (RES_LABEL[s.resolution] || s.resolution), cls: "tr-res" });
  if (s.fps && s.fps !== "source") tags.push({ key: "fps", icon: "bi-camera-video", label: "→ " + s.fps + " fps", cls: "tr-fps" });
  const audioShort = (s.audioCodec || "av_aac").replace("av_", "").replace("fdk_", "").toUpperCase().replace("COPY:", "").replace("COPY", "Passthru");
  tags.push({ key: "aud", icon: "bi-music-note", label: audioShort, cls: "tr-aud" });
  if (s.grayscale) tags.push({ key: "gray", icon: "bi-circle-half", label: "ЧБ", cls: "tr-filter" });
  if (s.rotate && s.rotate !== "0") tags.push({ key: "rot", icon: "bi-arrow-clockwise", label: s.rotate === "hflip" ? "Отражение" : s.rotate + "°", cls: "tr-filter" });
  if (s.deinterlace && s.deinterlace !== "off") tags.push({ key: "deint", icon: "bi-layout-split", label: "Деинтерлейс", cls: "tr-filter" });
  if (s.denoise && s.denoise !== "off") tags.push({ key: "dn", icon: "bi-snow", label: "Шумодав", cls: "tr-filter" });
  if (s.sharpen && s.sharpen !== "off") tags.push({ key: "sh", icon: "bi-stars", label: "Резкость", cls: "tr-filter" });
  if (s.deblock && s.deblock !== "off") tags.push({ key: "db", icon: "bi-bounding-box", label: "Деблок", cls: "tr-filter" });
  return tags;
}
const AUDIO_CODECS$1 = [
  { value: "av_aac", label: "AAC (libavcodec)" },
  { value: "fdk_aac", label: "AAC (FDK)" },
  { value: "fdk_haac", label: "HE-AAC (FDK)" },
  { value: "mp3", label: "MP3" },
  { value: "ac3", label: "AC-3 (Dolby Digital)" },
  { value: "eac3", label: "E-AC-3 (Dolby Plus)" },
  { value: "vorbis", label: "Vorbis" },
  { value: "flac16", label: "FLAC 16-bit" },
  { value: "flac24", label: "FLAC 24-bit" },
  { value: "opus", label: "Opus" },
  { value: "copy", label: "Passthru (авто)" },
  { value: "copy:aac", label: "AAC Passthru" },
  { value: "copy:ac3", label: "AC3 Passthru" },
  { value: "copy:eac3", label: "E-AC3 Passthru" },
  { value: "copy:dts", label: "DTS Passthru" },
  { value: "copy:dtshd", label: "DTS-HD Passthru" },
  { value: "copy:mp3", label: "MP3 Passthru" },
  { value: "copy:truehd", label: "TrueHD Passthru" }
];
function VspSectionHeader({ icon, title }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "vsp-section-header", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: `bi ${icon}` }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: title })
  ] });
}
function VspRow({ label, hint, children }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "vsp-row", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "vsp-row-label", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "vsp-row-name", children: label }),
      hint && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "vsp-row-hint", children: hint })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "vsp-row-control", children })
  ] });
}
function VspToggle({ value, onChange, disabled }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "button",
    {
      className: `vsp-toggle ${value ? "on" : "off"}${disabled ? " disabled" : ""}`,
      onClick: () => !disabled && onChange(!value),
      type: "button",
      children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "vsp-toggle-knob" })
    }
  );
}
function formatTime(sec) {
  const s = Math.max(0, Math.floor(sec));
  const h = Math.floor(s / 3600);
  const m2 = Math.floor(s % 3600 / 60);
  const ss = s % 60;
  if (h > 0) return `${h}:${String(m2).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
  return `${m2}:${String(ss).padStart(2, "0")}`;
}
const PanelSelect = (props) => /* @__PURE__ */ jsxRuntimeExports.jsx(GsSelect, { direction: "down", ...props });
const VSP_TABS = [
  { id: "video", label: "Видео", icon: "bi-camera-video" },
  { id: "audio", label: "Аудио", icon: "bi-music-note-beamed" },
  { id: "subtitles", label: "Субтитры", icon: "bi-badge-cc" },
  { id: "filters", label: "Фильтры", icon: "bi-sliders" },
  { id: "hdr", label: "HDR / Мета", icon: "bi-stars" }
];
const VSP_TABS_YTDL = [
  { id: "download", label: "Загрузка", icon: "bi-cloud-arrow-down" },
  { id: "video", label: "Видео", icon: "bi-camera-video" },
  { id: "audio", label: "Аудио", icon: "bi-music-note-beamed" },
  { id: "subtitles", label: "Субтитры", icon: "bi-badge-cc" },
  { id: "filters", label: "Фильтры", icon: "bi-sliders" },
  { id: "hdr", label: "HDR / Мета", icon: "bi-stars" }
];
function VideoSettingsPanel({ video, globalSettings, onClose, onSave, onReset, onYtdlFormatChange, onYtdlConvertToggle }) {
  const isYtdl = !!video.isYtdlItem;
  const tabs = isYtdl ? VSP_TABS_YTDL : VSP_TABS;
  const [draft, setDraft] = reactExports.useState(video.customSettings || video.conversionSettings || { ...globalSettings });
  const [activeTab, setActiveTab] = reactExports.useState(isYtdl ? "download" : "video");
  const update = (key, val) => setDraft((prev) => ({ ...prev, [key]: val }));
  const handleFormatChange = (fmt) => {
    const patch = { format: fmt };
    if (fmt === "av_webm") {
      if (!WEBM_COMPATIBLE_ENCODERS.has(draft.encoder)) {
        const speeds = ENCODER_PRESETS.vp9;
        patch.encoder = "vp9";
        patch.encoderSpeed = speeds[Math.floor(speeds.length / 2)]?.value ?? "good";
      }
      const audioCodec = draft.audioCodec || "av_aac";
      if (!WEBM_COMPATIBLE_AUDIO.has(audioCodec) && !audioCodec.startsWith("copy")) {
        patch.audioCodec = "opus";
      }
    }
    setDraft((prev) => ({ ...prev, ...patch }));
  };
  const rfTable = CODEC_RF[draft.encoder] || CODEC_RF.x265;
  const speedPresets = ENCODER_PRESETS[draft.encoder] ?? [];
  const isPassthru = (draft.audioCodec || "av_aac").startsWith("copy");
  ["nvenc_", "qsv_", "vce_", "mf_"].some((p2) => (draft.encoder || "").startsWith(p2));
  const encoderGroups = ENCODER_GROUPS.map((g) => ({
    label: g.label,
    options: g.encoders.map((e) => ({ value: e.value, label: e.label, desc: e.desc }))
  }));
  const handleSave = () => {
    if (isYtdl) {
      onYtdlConvertToggle(video.id, draft._convertAfterDownload ?? !!video.convertAfterDownload);
      const { _convertAfterDownload: _, ...cleanDraft } = draft;
      onSave(video.id, cleanDraft);
    } else {
      onSave(video.id, draft);
    }
    onClose();
  };
  const handleReset = () => {
    onReset(video.id);
    onClose();
  };
  const convertAfterDownload = isYtdl ? draft._convertAfterDownload !== void 0 ? draft._convertAfterDownload : !!video.convertAfterDownload : false;
  const ytdlFormatGroups = isYtdl ? buildYtdlFormatGroups(video.ytdlFormats) : [];
  const selectedYtdlFmt = isYtdl ? video.ytdlSelectedFormat || "" : "";
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "vsp-overlay", onClick: onClose, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "vsp-panel", onClick: (e) => e.stopPropagation(), children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "vsp-header", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "vsp-header-info", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("img", { className: "vsp-thumb", src: video.thumbnail, alt: "" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "vsp-title-block", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "vsp-title", children: video.title }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "vsp-subtitle", children: isYtdl ? "Настройки загрузки и конвертации" : "Индивидуальные настройки конвертации" })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "vsp-close", onClick: onClose, children: /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "bi bi-x-lg" }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "vsp-body", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "vsp-sidebar", children: tabs.map((tab) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          className: `vsp-tab${activeTab === tab.id ? " active" : ""}${isYtdl && tab.id !== "download" && !convertAfterDownload ? " vsp-tab--dim" : ""}`,
          onClick: () => setActiveTab(tab.id),
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: `bi ${tab.icon}` }),
            tab.label
          ]
        },
        tab.id
      )) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "vsp-content", children: [
        activeTab === "download" && isYtdl && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "vsp-section", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(VspSectionHeader, { icon: "bi-cloud-arrow-down", title: "Формат загрузки" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(VspRow, { label: "Качество / формат", hint: "Выберите разрешение и формат для скачивания", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
            PanelSelect,
            {
              value: selectedYtdlFmt,
              groups: ytdlFormatGroups,
              onChange: (v2) => onYtdlFormatChange(video.id, v2)
            }
          ) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(VspSectionHeader, { icon: "bi-arrow-repeat", title: "Конвертация после загрузки" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(VspRow, { label: "Конвертировать файл", hint: "После загрузки запустить HandBrake конвертацию (настройки — во вкладках Видео/Аудио)", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
            VspToggle,
            {
              value: convertAfterDownload,
              onChange: (v2) => setDraft((prev) => ({ ...prev, _convertAfterDownload: v2 }))
            }
          ) }),
          !convertAfterDownload && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "vsp-notice", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "bi bi-info-circle" }),
            "Вкладки Видео / Аудио / Фильтры доступны только если включена конвертация."
          ] })
        ] }),
        activeTab === "video" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "vsp-section", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(VspSectionHeader, { icon: "bi-file-earmark-play", title: "Контейнер" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(VspRow, { label: "Формат", hint: "Контейнер для выходного файла", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
            PanelSelect,
            {
              value: draft.format,
              options: (() => {
                const disabledSet = ENCODER_DISABLED_FORMATS[draft.encoder] || /* @__PURE__ */ new Set();
                return [
                  { value: "av_mp4", label: "MP4", disabled: disabledSet.has("av_mp4") },
                  { value: "av_mkv", label: "MKV" },
                  { value: "av_webm", label: "WebM", disabled: disabledSet.has("av_webm") },
                  { value: "av_mov", label: "MOV", disabled: disabledSet.has("av_mov") }
                ];
              })(),
              onChange: handleFormatChange
            }
          ) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(VspSectionHeader, { icon: "bi-cpu", title: "Кодировщик" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(VspRow, { label: "Видеокодек", hint: "Алгоритм сжатия видео", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
            PanelSelect,
            {
              value: draft.encoder,
              groups: encoderGroups.map((g) => ({
                ...g,
                options: g.options.map((e) => ({
                  ...e,
                  disabled: draft.format === "av_webm" && !WEBM_COMPATIBLE_ENCODERS.has(e.value)
                }))
              })),
              onChange: (v2) => {
                const speeds = ENCODER_PRESETS[v2] ?? [];
                const mid = speeds[Math.floor(speeds.length / 2)]?.value ?? "medium";
                setDraft((prev) => ({ ...prev, encoder: v2, encoderSpeed: mid }));
              }
            }
          ) }),
          speedPresets.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(VspRow, { label: "Скорость / пресет", hint: "Соотношение скорость↔эффективность кодека", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
            PanelSelect,
            {
              value: draft.encoderSpeed,
              options: speedPresets,
              onChange: (v2) => update("encoderSpeed", v2)
            }
          ) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(VspSectionHeader, { icon: "bi-sliders2", title: "Качество" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(VspRow, { label: "Режим качества", hint: "Предустановка или точное значение RF/CRF", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
            PanelSelect,
            {
              value: draft.quality,
              options: [
                { value: "lossless", label: `Lossless (RF ${rfTable.min})` },
                { value: "high", label: `Высокое (RF ${rfTable.high})` },
                { value: "medium", label: `Среднее (RF ${rfTable.medium})` },
                { value: "low", label: `Низкое (RF ${rfTable.low})` },
                { value: "potato", label: `Максимальное сжатие (RF ${rfTable.potato})` },
                { value: "custom", label: draft.quality === "custom" ? `Своё (RF ${draft.customQuality})` : "Своё значение..." }
              ],
              onChange: (v2) => update("quality", v2)
            }
          ) }),
          draft.quality === "custom" && /* @__PURE__ */ jsxRuntimeExports.jsx(
            VspRow,
            {
              label: `RF / CRF: ${draft.customQuality}`,
              hint: `${rfTable.min} (лучше качество) — ${rfTable.max} (хуже)`,
              children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "vsp-slider-wrap", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "vsp-slider-edge", children: rfTable.min }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "input",
                  {
                    type: "range",
                    className: "vsp-slider",
                    min: rfTable.min,
                    max: rfTable.max,
                    step: 1,
                    value: draft.customQuality,
                    onChange: (e) => update("customQuality", Number(e.target.value))
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "vsp-slider-edge", children: rfTable.max })
              ] })
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(VspSectionHeader, { icon: "bi-aspect-ratio", title: "Разрешение и частота кадров" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(VspRow, { label: "Разрешение", hint: "Максимальное разрешение (масштабирование вниз)", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
            PanelSelect,
            {
              value: draft.resolution,
              options: [
                { value: "source", label: "По исходному" },
                { value: "4k", label: "4K (2160p)" },
                { value: "1440p", label: "2K (1440p)" },
                { value: "1080p", label: "1080p (Full HD)" },
                { value: "720p", label: "720p (HD)" },
                { value: "480p", label: "480p (SD)" }
              ],
              onChange: (v2) => update("resolution", v2)
            }
          ) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(VspRow, { label: "Частота кадров", hint: "Целевой FPS выходного видео", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
            PanelSelect,
            {
              value: draft.fps,
              options: [
                { value: "source", label: "По исходному" },
                { value: "60", label: "60 fps" },
                { value: "30", label: "30 fps" },
                { value: "25", label: "25 fps (PAL)" },
                { value: "24", label: "24 fps (кино)" },
                { value: "23.976", label: "23.976 fps (NTSC)" }
              ],
              onChange: (v2) => update("fps", v2)
            }
          ) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(VspRow, { label: "Режим FPS", hint: "VFR = переменный, CFR = постоянный, PFR = с ограничением", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
            PanelSelect,
            {
              value: draft.fpsMode || "vfr",
              options: [
                { value: "vfr", label: "VFR — переменный (рекомендован)" },
                { value: "cfr", label: "CFR — постоянный" },
                { value: "pfr", label: "PFR — с пиковым ограничением" }
              ],
              onChange: (v2) => update("fpsMode", v2)
            }
          ) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(VspSectionHeader, { icon: "bi-lightning-charge", title: "Аппаратное ускорение" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(VspRow, { label: "Аппаратное декодирование", hint: "NVDEC / QSV разгружает CPU при чтении источника", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
            PanelSelect,
            {
              value: draft.hwDecoding || "none",
              options: [
                { value: "none", label: "Отключено (программное)" },
                { value: "nvdec", label: "NVDEC (NVIDIA)" },
                { value: "qsv", label: "Quick Sync (Intel)" }
              ],
              onChange: (v2) => update("hwDecoding", v2)
            }
          ) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(VspRow, { label: "Двухпроходное кодирование", hint: "2-pass: лучше распределяет битрейт, кодирует в 2× дольше", children: /* @__PURE__ */ jsxRuntimeExports.jsx(VspToggle, { value: !!draft.multiPass, onChange: (v2) => update("multiPass", v2) }) })
        ] }),
        activeTab === "audio" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "vsp-section", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(VspSectionHeader, { icon: "bi-music-note-beamed", title: "Кодек аудио" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(VspRow, { label: "Аудиокодек", hint: "Кодек для аудиодорожки выходного файла", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
            PanelSelect,
            {
              value: draft.audioCodec || "av_aac",
              options: AUDIO_CODECS$1.map((c) => ({
                ...c,
                disabled: draft.format === "av_webm" && !WEBM_COMPATIBLE_AUDIO.has(c.value) && !c.value.startsWith("copy")
              })),
              onChange: (v2) => update("audioCodec", v2)
            }
          ) }),
          !isPassthru && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(VspSectionHeader, { icon: "bi-speaker", title: "Параметры аудио" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(VspRow, { label: "Битрейт", hint: "Битрейт аудиодорожки в кбит/с", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              PanelSelect,
              {
                value: draft.audioBitrate || "160",
                options: [
                  { value: "64", label: "64 kbps" },
                  { value: "96", label: "96 kbps" },
                  { value: "128", label: "128 kbps" },
                  { value: "160", label: "160 kbps (по умолчанию)" },
                  { value: "192", label: "192 kbps" },
                  { value: "256", label: "256 kbps" },
                  { value: "320", label: "320 kbps" }
                ],
                onChange: (v2) => update("audioBitrate", v2)
              }
            ) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(VspRow, { label: "Микшинг", hint: "Количество каналов в выходной аудиодорожке", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              PanelSelect,
              {
                value: draft.audioMixdown || "stereo",
                options: [
                  { value: "mono", label: "Моно (1.0)" },
                  { value: "stereo", label: "Стерео (2.0)" },
                  { value: "dpl2", label: "Dolby Pro Logic II" },
                  { value: "5point1", label: "Surround 5.1" },
                  { value: "6point1", label: "Surround 6.1" },
                  { value: "7point1", label: "Surround 7.1" }
                ],
                onChange: (v2) => update("audioMixdown", v2)
              }
            ) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(VspRow, { label: "Частота дискретизации", hint: "Sample rate аудио", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              PanelSelect,
              {
                value: draft.audioSampleRate || "auto",
                options: [
                  { value: "auto", label: "Авто (по исходному)" },
                  { value: "22.05", label: "22.05 kHz" },
                  { value: "32", label: "32 kHz" },
                  { value: "44.1", label: "44.1 kHz" },
                  { value: "48", label: "48 kHz" },
                  { value: "96", label: "96 kHz" }
                ],
                onChange: (v2) => update("audioSampleRate", v2)
              }
            ) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(VspSectionHeader, { icon: "bi-collection-play", title: "Метаданные файла" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(VspRow, { label: "Метки глав (Chapter markers)", hint: "Добавлять chapter markers в контейнер", children: /* @__PURE__ */ jsxRuntimeExports.jsx(VspToggle, { value: draft.chapterMarkers !== false, onChange: (v2) => update("chapterMarkers", v2) }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(VspRow, { label: "Оптимизировать MP4 (fast start)", hint: "Moov-атом в начале файла — для HTTP стриминга. Только MP4.", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
            VspToggle,
            {
              value: !!draft.optimizeMP4,
              onChange: (v2) => update("optimizeMP4", v2),
              disabled: draft.format !== "av_mp4"
            }
          ) })
        ] }),
        activeTab === "subtitles" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "vsp-section", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(VspSectionHeader, { icon: "bi-badge-cc", title: "Дорожки субтитров" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(VspRow, { label: "Субтитры", hint: "Какие дорожки субтитров включить в выходной файл", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
            PanelSelect,
            {
              value: draft.subtitleMode || "none",
              options: [
                { value: "none", label: "Не включать" },
                { value: "first", label: "Первая дорожка" },
                { value: "all", label: "Все дорожки" },
                { value: "scan_forced", label: "Авто (принудительные / иностранные)" }
              ],
              onChange: (v2) => update("subtitleMode", v2)
            }
          ) }),
          draft.subtitleMode !== "none" && draft.subtitleMode !== "all" && /* @__PURE__ */ jsxRuntimeExports.jsx(VspRow, { label: "Вшивать субтитры", hint: "Субтитры рендерятся прямо в кадр (burn-in). Не требует поддержки контейнером", children: /* @__PURE__ */ jsxRuntimeExports.jsx(VspToggle, { value: !!draft.subtitleBurn, onChange: (v2) => update("subtitleBurn", v2) }) }),
          draft.subtitleMode !== "none" && !draft.subtitleBurn && draft.subtitleMode !== "all" && /* @__PURE__ */ jsxRuntimeExports.jsx(VspRow, { label: "Субтитры по умолчанию", hint: "Отметить дорожку как выбранную по умолчанию в плеере", children: /* @__PURE__ */ jsxRuntimeExports.jsx(VspToggle, { value: !!draft.subtitleDefault, onChange: (v2) => update("subtitleDefault", v2) }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(VspSectionHeader, { icon: "bi-translate", title: "Язык субтитров" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(VspRow, { label: "Предпочитаемый язык", hint: "Нативный язык: при наличии такой дорожки, она будет выбрана автоматически", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
            PanelSelect,
            {
              value: draft.subtitleLanguage || "any",
              options: [
                { value: "any", label: "Любой (не фильтровать)" },
                { value: "eng", label: "Английский (eng)" },
                { value: "rus", label: "Русский (rus)" },
                { value: "jpn", label: "Японский (jpn)" },
                { value: "chi", label: "Китайский (chi)" },
                { value: "kor", label: "Корейский (kor)" },
                { value: "fra", label: "Французский (fra)" },
                { value: "deu", label: "Немецкий (deu)" },
                { value: "spa", label: "Испанский (spa)" },
                { value: "por", label: "Португальский (por)" },
                { value: "ita", label: "Итальянский (ita)" },
                { value: "ara", label: "Арабский (ara)" }
              ],
              onChange: (v2) => update("subtitleLanguage", v2)
            }
          ) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(VspSectionHeader, { icon: "bi-file-earmark-text", title: "Внешний файл субтитров" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(VspRow, { label: "Файл субтитров", hint: "Прикрепить внешний файл .srt / .ass / .ssa", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "vsp-file-pick", children: [
            draft.subtitleExternalFile ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "vsp-file-pick__name", title: draft.subtitleExternalFile, children: draft.subtitleExternalFile.split(/[\\/]/).pop() }) : /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "vsp-file-pick__empty", children: "Не выбран" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                className: "vsp-file-pick__btn",
                type: "button",
                onClick: async () => {
                  const file = await window.api.selectSubtitleFile();
                  if (file) update("subtitleExternalFile", file);
                },
                children: /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "bi bi-folder2-open" })
              }
            ),
            draft.subtitleExternalFile && /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                className: "vsp-file-pick__clear",
                type: "button",
                title: "Убрать файл",
                onClick: () => update("subtitleExternalFile", ""),
                children: /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "bi bi-x-lg" })
              }
            )
          ] }) }),
          draft.subtitleExternalFile && /* @__PURE__ */ jsxRuntimeExports.jsx(VspRow, { label: "Вшить внешние субтитры", hint: "Рендерить сабы прямо в кадр (burn-in), иначе — как отдельная дорожка", children: /* @__PURE__ */ jsxRuntimeExports.jsx(VspToggle, { value: !!draft.subtitleBurn, onChange: (v2) => update("subtitleBurn", v2) }) }),
          draft.subtitleExternalFile && !draft.subtitleBurn && /* @__PURE__ */ jsxRuntimeExports.jsx(VspRow, { label: "Субтитры по умолчанию", hint: "Отметить как выбранную по умолчанию в плеере", children: /* @__PURE__ */ jsxRuntimeExports.jsx(VspToggle, { value: !!draft.subtitleDefault, onChange: (v2) => update("subtitleDefault", v2) }) })
        ] }),
        activeTab === "filters" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "vsp-section", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(VspSectionHeader, { icon: "bi-intersect", title: "Деинтерлейс" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(VspRow, { label: "Деинтерлейс", hint: "Устраняет гребёнку от чересстрочной развёртки", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
            PanelSelect,
            {
              value: draft.deinterlace || "off",
              options: [
                { value: "off", label: "Отключён" },
                { value: "yadif_default", label: "Yadif — стандартный" },
                { value: "yadif_bob", label: "Yadif Bob (двойной FPS)" },
                { value: "bwdif_default", label: "BWDif — стандартный" },
                { value: "bwdif_bob", label: "BWDif Bob (двойной FPS)" }
              ],
              onChange: (v2) => update("deinterlace", v2)
            }
          ) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(VspSectionHeader, { icon: "bi-snow2", title: "Шумоподавление" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(VspRow, { label: "Денойз", hint: "Убирает видеошум. Требует дополнительного времени.", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
            PanelSelect,
            {
              value: draft.denoise || "off",
              options: [
                { value: "off", label: "Отключено" },
                { value: "nlmeans_ultralight", label: "NL-Means — минимальный" },
                { value: "nlmeans_light", label: "NL-Means — лёгкий" },
                { value: "nlmeans_medium", label: "NL-Means — средний" },
                { value: "nlmeans_strong", label: "NL-Means — сильный" },
                { value: "hqdn3d_light", label: "HQ 3D — лёгкий" },
                { value: "hqdn3d_medium", label: "HQ 3D — средний" },
                { value: "hqdn3d_strong", label: "HQ 3D — сильный" }
              ],
              onChange: (v2) => update("denoise", v2)
            }
          ) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(VspSectionHeader, { icon: "bi-grid-3x3", title: "Деблокинг" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(VspRow, { label: "Деблокинг", hint: "Убирает блочные артефакты от кодека источника", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
            PanelSelect,
            {
              value: draft.deblock || "off",
              options: [
                { value: "off", label: "Отключён" },
                { value: "ultralight", label: "Минимальный" },
                { value: "light", label: "Лёгкий" },
                { value: "medium", label: "Средний" },
                { value: "strong", label: "Сильный" },
                { value: "stronger", label: "Максимальный" }
              ],
              onChange: (v2) => update("deblock", v2)
            }
          ) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(VspSectionHeader, { icon: "bi-zoom-in", title: "Резкость" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(VspRow, { label: "Повышение резкости", hint: "Unsharp Mask или Laplacian Sharpen", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
            PanelSelect,
            {
              value: draft.sharpen || "off",
              options: [
                { value: "off", label: "Отключено" },
                { value: "unsharp_ultralight", label: "Unsharp — минимальный" },
                { value: "unsharp_light", label: "Unsharp — лёгкий" },
                { value: "unsharp_medium", label: "Unsharp — средний" },
                { value: "unsharp_strong", label: "Unsharp — сильный" },
                { value: "lapsharp_ultralight", label: "Lapsharp — минимальный" },
                { value: "lapsharp_light", label: "Lapsharp — лёгкий" },
                { value: "lapsharp_medium", label: "Lapsharp — средний" },
                { value: "lapsharp_strong", label: "Lapsharp — сильный" }
              ],
              onChange: (v2) => update("sharpen", v2)
            }
          ) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(VspSectionHeader, { icon: "bi-camera", title: "Трансформация кадра" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(VspRow, { label: "Чёрно-белый режим", hint: "Удаляет цветовую информацию (grayscale)", children: /* @__PURE__ */ jsxRuntimeExports.jsx(VspToggle, { value: !!draft.grayscale, onChange: (v2) => update("grayscale", v2) }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(VspRow, { label: "Поворот / отражение", hint: "Повернуть или отразить кадр", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
            PanelSelect,
            {
              value: draft.rotate || "0",
              options: [
                { value: "0", label: "Без поворота" },
                { value: "90", label: "90° по часовой" },
                { value: "180", label: "180°" },
                { value: "270", label: "270° (90° против часовой)" },
                { value: "hflip", label: "Горизонтальное отражение" }
              ],
              onChange: (v2) => update("rotate", v2)
            }
          ) })
        ] }),
        activeTab === "hdr" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "vsp-section", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(VspSectionHeader, { icon: "bi-brightness-high", title: "HDR" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(VspRow, { label: "Динамические метаданные HDR", hint: "Передать HDR10+ или Dolby Vision metadata в выходной файл", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
            PanelSelect,
            {
              value: draft.hdrMetadata || "off",
              options: [
                { value: "off", label: "Отключено" },
                { value: "hdr10plus", label: "HDR10+" },
                { value: "dolbyvision", label: "Dolby Vision" },
                { value: "all", label: "Все (HDR10+ и Dolby Vision)" }
              ],
              onChange: (v2) => update("hdrMetadata", v2)
            }
          ) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(VspSectionHeader, { icon: "bi-tag", title: "Метаданные файла" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(VspRow, { label: "Сохранять метаданные", hint: "Копировать теги, описание, обложку из источника", children: /* @__PURE__ */ jsxRuntimeExports.jsx(VspToggle, { value: !!draft.keepMetadata, onChange: (v2) => update("keepMetadata", v2) }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(VspRow, { label: "Inline Parameter Sets", hint: "SPS/PPS inline в каждом кадре — требуется для HLS-стриминга", children: /* @__PURE__ */ jsxRuntimeExports.jsx(VspToggle, { value: !!draft.inlineParamSets, onChange: (v2) => update("inlineParamSets", v2) }) })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "vsp-footer", children: [
      (video.customSettings || video.conversionSettings) && !isYtdl && /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { className: "vsp-reset-btn", onClick: handleReset, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "bi bi-arrow-counterclockwise" }),
        "Сбросить (глобальные)"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "vsp-footer-right", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "vsp-cancel-btn", onClick: onClose, children: "Отмена" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { className: "vsp-save-btn", onClick: handleSave, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "bi bi-check2" }),
          "Применить"
        ] })
      ] })
    ] })
  ] }) });
}
function ListPage({
  videos,
  settings,
  isEncoding,
  theme,
  onSettingsChange,
  onStartEncoding,
  onStop,
  outputMode,
  customOutputDir,
  defaultOutputDir,
  onOutputModeChange,
  onAddFiles,
  onDownload,
  onRemoveVideo,
  onClearQueue,
  onRenameOutput,
  onVideoSettingsChange,
  onYtdlFormatChange,
  onYtdlConvertToggle,
  onYtdlConversionSettings,
  isDraggingOnList,
  onListDragEnter,
  onListDragLeave,
  onListDragOver,
  onListDrop,
  gpuVendor,
  encodingStartTime
}) {
  const [editingId, setEditingId] = reactExports.useState(null);
  const [editingValue, setEditingValue] = reactExports.useState("");
  const [editingVideoId, setEditingVideoId] = reactExports.useState(null);
  const [tickNow, setTickNow] = reactExports.useState(Date.now());
  const [addUrl, setAddUrl] = reactExports.useState("");
  const [isAddingUrl, setIsAddingUrl] = reactExports.useState(false);
  const [addUrlError, setAddUrlError] = reactExports.useState("");
  reactExports.useEffect(() => {
    if (!isEncoding) return;
    const timer = setInterval(() => setTickNow(Date.now()), 1e3);
    return () => clearInterval(timer);
  }, [isEncoding]);
  const startEdit = (v2) => {
    setEditingId(v2.id);
    setEditingValue(v2.outputName || v2.title);
  };
  const commitEdit = (id2) => {
    const trimmed = editingValue.trim();
    if (trimmed) onRenameOutput(id2, trimmed);
    setEditingId(null);
  };
  const handleEditKeyDown = (e, id2) => {
    if (e.key === "Enter") commitEdit(id2);
    if (e.key === "Escape") setEditingId(null);
  };
  const addUrlTrimmed = addUrl.trim();
  const addUrlService = detectService(addUrlTrimmed);
  const addUrlValid = isValidUrl(addUrlTrimmed);
  const addUrlUnsupported = addUrlTrimmed && addUrlValid && !addUrlService;
  const handleAddUrl = async () => {
    if (!addUrlTrimmed || isAddingUrl || addUrlUnsupported || !onDownload) return;
    setAddUrlError("");
    setIsAddingUrl(true);
    try {
      await onDownload(addUrlTrimmed, addUrlService);
      setAddUrl("");
    } catch (err) {
      setAddUrlError(err?.message || "Ошибка");
    } finally {
      setIsAddingUrl(false);
    }
  };
  const customCount = videos.filter((v2) => v2.customSettings).length;
  const globalCount = videos.length - customCount;
  const hasOnlyDownloads = videos.length > 0 && videos.every((v2) => v2.isYtdlItem);
  const hasRegular = videos.some((v2) => !v2.isYtdlItem);
  const hasDownloads = videos.some((v2) => v2.isYtdlItem);
  const hasYtdlConvert = videos.some((v2) => v2.isYtdlItem && v2.convertAfterDownload);
  const globalSettingsActive = hasRegular || hasYtdlConvert;
  videos.every(
    (v2) => v2.isYtdlItem ? ["format_select", "error"].includes(v2.status) : ["ready", "done", "error"].includes(v2.status)
  );
  const startBtnLabel = hasOnlyDownloads ? "СКАЧАТЬ" : hasDownloads ? "ЗАПУСТИТЬ" : "КОНВЕРТИРОВАТЬ";
  const editingVideo = editingVideoId !== null ? videos.find((v2) => v2.id === editingVideoId) : null;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "video-list-container", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "video-list-header", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "video-list-topbar", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `list-url-bar${addUrlUnsupported ? " list-url-bar--error" : ""}${addUrlService ? " list-url-bar--ok" : ""}`, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "list-url-icon", children: isAddingUrl ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "list-url-spinner" }) : addUrlService ? /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: `bi ${addUrlService.icon}`, style: { color: addUrlService.color } }) : addUrlUnsupported ? /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "bi bi-x-circle-fill", style: { color: "#ef4444" } }) : /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "bi bi-link-45deg", style: { opacity: 0.35 } }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              className: "list-url-input",
              type: "url",
              placeholder: "Ссылка для загрузки (YouTube, TikTok ...)",
              value: addUrl,
              onChange: (e) => {
                setAddUrl(e.target.value);
                setAddUrlError("");
              },
              onKeyDown: (e) => e.key === "Enter" && handleAddUrl(),
              disabled: isAddingUrl || isEncoding,
              spellCheck: false
            }
          ),
          addUrlService && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "list-url-svc", children: addUrlService.name }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              className: "list-url-btn",
              onClick: handleAddUrl,
              disabled: !addUrlTrimmed || isAddingUrl || addUrlUnsupported || isEncoding,
              title: "Добавить в очередь",
              children: isAddingUrl ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "list-url-spinner" }) : /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "bi bi-cloud-arrow-down-fill" })
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            className: "add-button",
            onClick: onAddFiles,
            disabled: isEncoding,
            title: "Добавить файлы",
            children: /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "bi bi-plus-lg" })
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            className: "add-button clear-button",
            onClick: onClearQueue,
            disabled: isEncoding,
            title: "Очистить очередь",
            children: /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "bi bi-trash3" })
          }
        )
      ] }),
      addUrlError && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "list-url-error", children: addUrlError })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "div",
      {
        className: `video-list-drop-zone ${isDraggingOnList ? "dragging" : ""}`,
        onDragEnter: onListDragEnter,
        onDragLeave: onListDragLeave,
        onDragOver: onListDragOver,
        onDrop: onListDrop,
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `video-list-scroll ${isDraggingOnList ? "blurred" : ""}`, children: videos.map((v2) => {
            const isActive = ["encoding", "downloading", "converting"].includes(v2.status);
            return /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "div",
              {
                className: `video-item ${v2.status} ${theme}${v2.customSettings || v2.isYtdlItem && v2.conversionSettings ? " has-custom-settings" : ""}`,
                style: {
                  ...v2.downloadService ? {
                    borderColor: `color-mix(in srgb, ${v2.downloadService.color} 40%, transparent)`,
                    background: `color-mix(in srgb, ${v2.downloadService.color} 8%, transparent)`
                  } : {},
                  ...!isEncoding && !isActive ? { cursor: "pointer" } : {}
                },
                onClick: () => !isEncoding && !isActive && setEditingVideoId(v2.id),
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "video-thumbnail", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: v2.thumbnail, alt: "Thumbnail" }),
                    isActive && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "encoding-overlay", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "spinner" }) })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "video-info", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "video-title-row", children: [
                      v2.downloadService && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "svc-icon-tag", style: { color: v2.downloadService.color }, title: v2.downloadService.name, children: /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: `bi ${v2.downloadService.icon}` }) }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "video-title", children: v2.title }),
                      (v2.customSettings || v2.isYtdlItem && v2.conversionSettings) && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "vtag custom-tag", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "bi bi-sliders2" }),
                        "Инд."
                      ] }),
                      !isEncoding && !isActive && (editingId === v2.id ? /* @__PURE__ */ jsxRuntimeExports.jsx(
                        "input",
                        {
                          className: "output-name-input",
                          value: editingValue,
                          autoFocus: true,
                          onChange: (e) => setEditingValue(e.target.value),
                          onBlur: () => commitEdit(v2.id),
                          onKeyDown: (e) => handleEditKeyDown(e, v2.id),
                          onClick: (e) => e.stopPropagation()
                        }
                      ) : /* @__PURE__ */ jsxRuntimeExports.jsxs(
                        "button",
                        {
                          className: "rename-btn",
                          onClick: (e) => {
                            e.stopPropagation();
                            startEdit(v2);
                          },
                          title: "Переименовать выходной файл",
                          children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "bi bi-pencil" }),
                            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: v2.outputName || v2.title })
                          ]
                        }
                      ))
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "video-tags", children: [
                      v2.container && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "vtag fmt", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "bi bi-file-earmark-play" }),
                        v2.container
                      ] }),
                      v2.resolution && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "vtag", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "bi bi-aspect-ratio" }),
                        v2.resolution
                      ] }),
                      v2.videoCodec && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "vtag", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "bi bi-cpu" }),
                        v2.videoCodec
                      ] }),
                      v2.fps && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "vtag", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "bi bi-camera-video" }),
                        v2.fps,
                        " fps"
                      ] }),
                      v2.audioCodec && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "vtag audio", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "bi bi-music-note" }),
                        v2.audioCodec
                      ] }),
                      v2.channels && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "vtag audio", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "bi bi-speaker" }),
                        v2.channels
                      ] }),
                      v2.bitrate && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "vtag bitrate", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "bi bi-speedometer2" }),
                        v2.bitrate
                      ] }),
                      v2.duration && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "vtag duration", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "bi bi-clock" }),
                        v2.duration
                      ] })
                    ] }),
                    v2.isYtdlItem && v2.status !== "done" && (() => {
                      const selFmt = (v2.ytdlFormats || []).find((f2) => f2.format_id === v2.ytdlSelectedFormat);
                      const fmtTags = selFmt ? buildFormatTags(selFmt) : [];
                      return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "ytdl-controls", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "ytdl-format-row", children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "bi bi-cloud-arrow-down ytdl-icon" }),
                          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "ytdl-label", children: "Формат:" }),
                          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { onClick: (e) => e.stopPropagation(), children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                            GsSelect,
                            {
                              className: "ytdl-format-gs",
                              groups: buildYtdlFormatGroups(v2.ytdlFormats),
                              value: v2.ytdlSelectedFormat || "",
                              onChange: (val) => onYtdlFormatChange(v2.id, val),
                              disabled: isEncoding,
                              direction: "down"
                            }
                          ) }),
                          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { onClick: (e) => e.stopPropagation(), children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                            VspToggle,
                            {
                              value: !!v2.convertAfterDownload,
                              onChange: (val) => onYtdlConvertToggle(v2.id, val),
                              disabled: isEncoding
                            }
                          ) }),
                          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "ytdl-label", children: "Конвертировать" })
                        ] }),
                        fmtTags.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "ytdl-fmt-tags", children: fmtTags.map((t2) => /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: `vtag transform-tag ${t2.cls}`, children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: `bi ${t2.icon}` }),
                          t2.label
                        ] }, t2.key)) })
                      ] });
                    })(),
                    (!v2.isYtdlItem || v2.convertAfterDownload) && (() => {
                      const effectiveSettings = v2.isYtdlItem ? v2.conversionSettings || settings : v2.customSettings || settings;
                      const transformTags = getTransformTags(v2, effectiveSettings);
                      if (!transformTags.length) return null;
                      return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "video-transform-tags", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "vtag-arrow", children: /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "bi bi-arrow-down-short" }) }),
                        transformTags.map((t2) => /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: `vtag transform-tag ${t2.cls}`, children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: `bi ${t2.icon}` }),
                          t2.label
                        ] }, t2.key))
                      ] });
                    })(),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "video-progress", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "progress-bar-bg", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                        "div",
                        {
                          className: `progress-bar-fill${v2.status === "downloading" ? " progress-bar-fill--download" : v2.status === "converting" ? " progress-bar-fill--convert" : ""}`,
                          style: { width: `${v2.progress}%` }
                        }
                      ) }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "progress-text", children: v2.status === "downloading" ? `↓ ${v2.progress.toFixed(1)}%` : v2.status === "converting" ? `⚙ ${v2.progress.toFixed(1)}%` : `${v2.progress.toFixed(1)}%` })
                    ] }),
                    (v2.status === "encoding" || v2.status === "downloading" || v2.status === "converting") && v2.startTime && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "video-time-info", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "vtime elapsed", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "bi bi-clock-history" }),
                        formatTime((tickNow - v2.startTime) / 1e3)
                      ] }),
                      v2.progress > 0.5 && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "vtime remaining", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "bi bi-hourglass-split" }),
                        "~",
                        formatTime((tickNow - v2.startTime) / 1e3 * (100 - v2.progress) / v2.progress)
                      ] })
                    ] }),
                    v2.status === "done" && v2.startTime && v2.endTime && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "video-time-info done", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "vtime done", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "bi bi-check2-circle" }),
                      formatTime((v2.endTime - v2.startTime) / 1e3)
                    ] }) })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "video-size", children: [
                    v2.status === "done" ? /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "bi bi-check-circle-fill success" }) : (() => {
                      if (v2.isYtdlItem) return null;
                      const effectiveSettings = v2.customSettings || settings;
                      const estimated = v2.status !== "encoding" ? estimateOutputSize(v2, effectiveSettings) : null;
                      const hasEst = !!estimated;
                      return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `size-display${hasEst ? " has-estimate" : ""}`, children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "sv-source", children: v2.size }),
                        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "sv-row", children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "bi bi-arrow-right sv-arrow" }),
                          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "sv-estimated", children: estimated || "" })
                        ] })
                      ] });
                    })(),
                    v2.status !== "encoding" && v2.status !== "downloading" && v2.status !== "converting" && !isEncoding && /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "button",
                      {
                        className: "delete-video-btn",
                        onClick: (e) => {
                          e.stopPropagation();
                          onRemoveVideo(v2.id);
                        },
                        children: /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "bi bi-trash3" })
                      }
                    )
                  ] })
                ]
              },
              v2.id
            );
          }) }),
          isDraggingOnList && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "list-drop-overlay", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "list-drop-inner", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "bi bi-plus-circle" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "ДОБАВИТЬ В ОЧЕРЕДЬ" })
          ] }) })
        ]
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "list-bottom-panel", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "list-bottom-header", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "list-bottom-title", children: hasOnlyDownloads ? "Настройки загрузки" : hasDownloads ? "Глобальные настройки конвертации" : "Глобальные настройки конвертации" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `gs-section${!globalSettingsActive ? " gs-section--dimmed" : ""}`, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
        GlobalSettings,
        {
          settings,
          onChange: onSettingsChange,
          videos: videos.filter((v2) => !v2.isYtdlItem),
          disabled: isEncoding || !globalSettingsActive,
          gpuVendor
        }
      ) }),
      hasRegular && hasDownloads && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "ytdl-global-notice", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "bi bi-info-circle-fill" }),
        videos.filter((v2) => v2.isYtdlItem).length,
        " файл(ов) для загрузки — у каждого свои настройки (откройте карточку)."
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "list-bottom-actions", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "list-output-section", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "list-output-top", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "list-output-label", children: hasOnlyDownloads ? "Папка для загрузки" : "Папка для сохранения" }),
            !hasOnlyDownloads && /* @__PURE__ */ jsxRuntimeExports.jsx(
              GsSelect,
              {
                value: outputMode,
                options: [
                  { value: "default", label: "По умолчанию" },
                  { value: "custom", label: "Своя папка" },
                  { value: "source", label: "Исходный путь" }
                ],
                onChange: onOutputModeChange,
                disabled: isEncoding,
                className: "list-output-mode-dropdown"
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "list-output-path-row", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "list-output-path-display", children: outputMode === "custom" ? customOutputDir || "Downloaded (рядом с программой)" : outputMode === "source" ? "Исходный путь файла" : defaultOutputDir || "Downloaded (рядом с программой)" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                className: "list-folder-btn",
                onClick: () => onOutputModeChange("custom"),
                disabled: isEncoding,
                title: "Выбрать папку",
                children: /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "bi bi-folder2-open" })
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            className: "start-button",
            onClick: onStartEncoding,
            disabled: isEncoding,
            style: isEncoding ? { display: "none" } : {},
            children: [
              startBtnLabel,
              /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "bi bi-arrow-right" })
            ]
          }
        ),
        isEncoding && /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            className: "stop-button",
            onClick: onStop,
            children: [
              "СТОП",
              /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "bi bi-stop-fill" })
            ]
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "list-bottom-status", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
          hasDownloads && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "bi bi-cloud-arrow-down" }),
            " ",
            /* @__PURE__ */ jsxRuntimeExports.jsx("b", { children: videos.filter((v2) => v2.isYtdlItem).length }),
            " загрузок"
          ] }),
          hasDownloads && hasRegular && /* @__PURE__ */ jsxRuntimeExports.jsx(jsxRuntimeExports.Fragment, { children: "  ·  " }),
          hasRegular && globalCount > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "bi bi-globe2" }),
            " ",
            /* @__PURE__ */ jsxRuntimeExports.jsx("b", { children: globalCount }),
            " ",
            globalCount === 1 ? "файл" : globalCount < 5 ? "файла" : "файлов",
            " по глобальным"
          ] }),
          hasRegular && globalCount > 0 && customCount > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(jsxRuntimeExports.Fragment, { children: "  ·  " }),
          hasRegular && customCount > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "bi bi-sliders2" }),
            " ",
            /* @__PURE__ */ jsxRuntimeExports.jsx("b", { children: customCount }),
            " ",
            customCount === 1 ? "файл" : customCount < 5 ? "файла" : "файлов",
            " по индивидуальным"
          ] }),
          videos.some((v2) => v2.status === "done") && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            "  ·  ",
            videos.filter((v2) => v2.status === "done").length,
            " готово"
          ] }),
          isEncoding && encodingStartTime && (() => {
            const elapsed = (tickNow - encodingStartTime) / 1e3;
            const encVideos = videos.filter((v2) => v2.status === "encoding" && v2.startTime && v2.progress > 0.5);
            const eta = encVideos.length ? encVideos.reduce((max, v2) => {
              const ve2 = (tickNow - v2.startTime) / 1e3;
              return Math.max(max, ve2 * (100 - v2.progress) / v2.progress);
            }, 0) : null;
            return /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "global-time-info", children: [
              "  ·  ",
              /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "bi bi-clock-history" }),
              " ",
              formatTime(elapsed),
              eta !== null && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                "  ",
                /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "bi bi-hourglass-split" }),
                " ~",
                formatTime(eta)
              ] })
            ] });
          })()
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
          videos.length,
          " ",
          videos.length === 1 ? "файл" : videos.length < 5 ? "файла" : "файлов",
          " в очереди"
        ] })
      ] })
    ] }),
    editingVideo && /* @__PURE__ */ jsxRuntimeExports.jsx(
      VideoSettingsPanel,
      {
        video: editingVideo,
        globalSettings: settings,
        onClose: () => setEditingVideoId(null),
        onSave: editingVideo.isYtdlItem ? onYtdlConversionSettings : onVideoSettingsChange,
        onReset: (id2) => editingVideo.isYtdlItem ? onYtdlConversionSettings(id2, null) : onVideoSettingsChange(id2, null),
        onYtdlFormatChange,
        onYtdlConvertToggle
      }
    )
  ] });
}
const tgQr = "" + new URL("TG_QR-BbnAudxN.png", import.meta.url).href;
const myPhoto = "" + new URL("Photo-BlRJMaj2.jpg", import.meta.url).href;
const LIBRARIES = [
  { name: "FFmpeg", url: "https://ffmpeg.org/", license: "L-GPL v2.1" },
  { name: "libx264", url: "https://www.videolan.org/developers/x264.html", license: "GPL v2" },
  { name: "libx265", url: "http://x265.org/", license: "GPL v2" },
  { name: "SVT-AV1", url: "https://gitlab.com/AOMediaCodec/SVT-AV1", license: "BSD 3-Clause" },
  { name: "libdav1d", url: "https://code.videolan.org/videolan/dav1d", license: "Simplified BSD" },
  { name: "libvpx", url: "https://github.com/webmproject/libvpx/", license: "BSD 3-Clause" },
  { name: "libvorbis", url: "https://xiph.org/vorbis/", license: "BSD 3-Clause" },
  { name: "libopus", url: "https://www.opus-codec.org/", license: "BSD 3-Clause" },
  { name: "libtheora", url: "https://theora.org/", license: "BSD 3-Clause" },
  { name: "libogg", url: "https://xiph.org/ogg/", license: "BSD 3-Clause" },
  { name: "libspeex", url: "https://www.speex.org/", license: "BSD 3-Clause" },
  { name: "libass", url: "https://github.com/libass/libass", license: "ISC" },
  { name: "libbluray", url: "https://www.videolan.org/developers/libbluray.html", license: "L-GPL v2.1" },
  { name: "libdvdnav", url: "https://www.videolan.org/developers/libdvdnav.html", license: "GPL v2" },
  { name: "libdvdread", url: "https://www.videolan.org/developers/libdvdnav.html", license: "GPL v2" },
  { name: "libdovi", url: "https://github.com/quietvoid/dovi_tool", license: "MIT" },
  { name: "libharfbuzz", url: "https://www.freedesktop.org/wiki/Software/HarfBuzz/", license: "MIT" },
  { name: "libfreetype", url: "https://freetype.org/", license: "GPL v2" },
  { name: "libfontconfig", url: "https://freedesktop.org/wiki/Software/fontconfig/", license: "MIT" },
  { name: "libjpeg-turbo", url: "https://github.com/libjpeg-turbo/libjpeg-turbo", license: "BSD 3-Clause" },
  { name: "libjansson", url: "https://github.com/akheron/jansson", license: "MIT" },
  { name: "libiconv", url: "https://www.gnu.org/software/libiconv/", license: "L-GPL v2.1" },
  { name: "libzlib", url: "https://zlib.net/", license: "zlib" },
  { name: "liblzma (xz)", url: "https://tukaani.org/xz/", license: "BSD Zero Clause" },
  { name: "libbzip2", url: "https://sourceforge.net/projects/bzip2/", license: "BSD-like" },
  { name: "AMD AMF", url: "https://github.com/GPUOpen-LibrariesAndSDKs/AMF", license: "MIT" },
  { name: "NV-codec-headers", url: "https://git.videolan.org/?p=ffmpeg/nv-codec-headers.git", license: "MIT" },
  { name: "libmfx / libvpl", url: "https://github.com/intel/libvpl", license: "MIT" },
  { name: "zimg", url: "https://github.com/sekrit-twc/zimg", license: "WTFPL" },
  // Web UI specific
  { name: "React", url: "https://react.dev/", license: "MIT" },
  { name: "Vite", url: "https://vitejs.dev/", license: "MIT" },
  { name: "Electron", url: "https://www.electronjs.org/", license: "MIT" },
  { name: "fluent-ffmpeg", url: "https://github.com/fluent-ffmpeg/node-fluent-ffmpeg", license: "MIT" },
  { name: "Bootstrap Icons", url: "https://icons.getbootstrap.com/", license: "MIT" }
];
const TABS$1 = [
  { id: "me", label: "Обо мне", icon: "bi-person-circle" },
  { id: "about", label: "О программе", icon: "bi-info-circle" },
  { id: "thanks", label: "Благодарности", icon: "bi-heart" },
  { id: "license", label: "Лицензия", icon: "bi-file-earmark-text" },
  { id: "libraries", label: "Библиотеки", icon: "bi-box-seam" }
];
const THANKS = [
  { name: "Андрей Виноградов", tg: "resonaura", url: "https://t.me/resonaura" },
  { name: "Святослав Драгунов", tg: "memsteel", url: "https://t.me/memsteel" },
  { name: "Павел Яшкин", tg: null, url: null },
  { name: "Барвашов Егор", tg: null, url: null }
];
function AboutPage({ theme, onBack }) {
  const [activeTab, setActiveTab] = reactExports.useState("me");
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `about-container ${theme}`, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "about-header", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { className: "ap-back-btn", onClick: onBack, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "bi bi-arrow-left" }),
        " Назад"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "about-logo", children: /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: theme === "dark" ? logoWhite : logoDark, alt: "Logo" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "about-title-block", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { children: "Gorex" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "version-info", children: "Version 1.0.0 · Web Edition · GPLv2" })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "about-tabs", children: TABS$1.map((tab) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "button",
      {
        className: `about-tab ${activeTab === tab.id ? "active" : ""}`,
        onClick: () => setActiveTab(tab.id),
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: `bi ${tab.icon}` }),
          tab.label
        ]
      },
      tab.id
    )) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "about-content-scroll", children: [
      activeTab === "me" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "about-section me-section", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "me-hero", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: myPhoto, alt: "Ахматьяров Егор", className: "me-photo" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "me-hero-text", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "me-eyebrow", children: "Дизайнер · Видеограф" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "me-name", children: "Ахматьяров Егор" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "me-role", children: "Автор идеи и создатель Gorex" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "me-qr-wrap", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: tgQr, alt: "TG QR", className: "me-qr" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "me-qr-label", children: "Telegram QR" })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "me-story", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "me-story-lead", children: "Я не программист. Я дизайнер и видеограф — человек, который годами работает с видео и остро чувствует, каким должен быть инструмент для таких же людей, как я." }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "Всё существующее либо выглядит так, будто застряло в 2005-м, либо стоит денег за каждый чих, либо просто не работает как надо. Я давно хотел сделать что-то по-настоящему красивое и удобное — не для разработчиков, а для людей из сферы. Концепт жил у меня в голове очень долго, но реализовать его самому было невозможно." }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { children: [
            "И вот благодаря технологиям ИИ — ",
            /* @__PURE__ */ jsxRuntimeExports.jsx("a", { href: "https://claude.ai", target: "_blank", rel: "noreferrer", className: "me-story-link", children: "Claude" }),
            " — я наконец смог воплотить эту идею в жизнь. Gorex — это не просто обёртка над HandBrake. Это концепция: инструмент, который уважает твоё время, выглядит как продукт, за который не стыдно, и работает именно так, как ожидает профессионал в видео."
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "me-contacts", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("a", { href: "https://t.me/akhmatyarov", target: "_blank", rel: "noreferrer", className: "me-contact-tg", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "bi bi-telegram" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "@akhmatyarov" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("a", { href: "https://github.com/Gor80hd/Gorex", target: "_blank", rel: "noreferrer", className: "me-contact-gh", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "bi bi-github" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Gorex on GitHub" })
          ] })
        ] })
      ] }),
      activeTab === "about" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "about-section", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "about-description", children: "Gorex — современный Electron-интерфейс для легендарного транскодера HandBrake и загрузчика yt-dlp. Сохраняет всю мощь оригинального HandBrake CLI, предоставляя удобный и эстетичный пользовательский опыт с открытым исходным кодом." }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "about-links", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("a", { href: "https://github.com/Gor80hd/Gorex", target: "_blank", rel: "noreferrer", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "bi bi-github" }),
            " GitHub — Gorex"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("a", { href: "https://handbrake.fr", target: "_blank", rel: "noreferrer", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "bi bi-globe" }),
            " handbrake.fr"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("a", { href: "https://github.com/yt-dlp/yt-dlp", target: "_blank", rel: "noreferrer", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "bi bi-github" }),
            " yt-dlp"
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "license-notice", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "bi bi-shield-check" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
            "Gorex использует HandBrake и yt-dlp — программы с открытым исходным кодом. HandBrake распространяется под лицензией ",
            /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "GNU GPL v2" }),
            ". Graphic assets — ",
            /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "CC BY-SA 4.0" }),
            ". Web UI дополнительно использует MIT-библиотеки React, Vite и Electron."
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("footer", { className: "about-footer", children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "© 2026 Gorex. Distributed under GNU General Public License Version 2." }) })
      ] }),
      activeTab === "thanks" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "about-section", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "thanks-intro", children: "Огромная благодарность этим людям за поддержку и вдохновение." }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "thanks-grid", children: THANKS.map((person) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "thanks-item", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "thanks-icon", children: /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "bi bi-telegram" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "thanks-info", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { className: "thanks-name", children: person.name }),
            person.url ? /* @__PURE__ */ jsxRuntimeExports.jsxs("a", { href: person.url, target: "_blank", rel: "noreferrer", className: "thanks-tg", children: [
              "@",
              person.tg
            ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "thanks-tg thanks-tg--offline", children: "нет ссылки" })
          ] })
        ] }, person.name)) })
      ] }),
      activeTab === "license" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "about-section", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "license-summary", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { children: [
            "Большинство файлов HandBrake распространяется под лицензией",
            " ",
            /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "GNU General Public License Version 2 (GPLv2)" }),
            ". Некоторые файлы — под GPLv2+, LGPLv2.1+ или BSD/MIT/X11. Скомпилированная сборка HandBrake лицензирована под GPLv2."
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { children: [
            "Графические ресурсы распространяются под лицензией ",
            /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "CC BY-SA 4.0 International" }),
            "."
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "license-box", children: /* @__PURE__ */ jsxRuntimeExports.jsx("pre", { children: `                    GNU GENERAL PUBLIC LICENSE
                       Version 2, June 1991

 Copyright (C) 1989, 1991 Free Software Foundation, Inc.,
 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA
 Everyone is permitted to copy and distribute verbatim copies
 of this license document, but changing it is not allowed.

                            Preamble

  The licenses for most software are designed to take away your
freedom to share and change it.  By contrast, the GNU General Public
License is intended to guarantee your freedom to share and change free
software--to make sure the software is free for all its users.  This
General Public License applies to most of the Free Software
Foundation's software and to any other program whose authors commit
to using it.  You can apply it to your programs, too.

  When we speak of free software, we are referring to freedom, not
price.  Our General Public Licenses are designed to make sure that
you have the freedom to distribute copies of free software (and charge
for this service if you wish), that you receive source code or can get
it if you want it, that you can change the software or use pieces of
it in new free programs; and that you know you can do these things.

  To protect your rights, we need to make restrictions that forbid
anyone to deny you these rights or to ask you to surrender the rights.
These restrictions translate to certain responsibilities for you if you
distribute copies of the software, or if you modify it.

 Full license text: https://www.gnu.org/licenses/old-licenses/gpl-2.0.html` }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "license-links", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("a", { href: "https://www.gnu.org/licenses/old-licenses/gpl-2.0.html", target: "_blank", rel: "noreferrer", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "bi bi-box-arrow-up-right" }),
            " GPL v2 Full Text"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("a", { href: "https://github.com/HandBrake/HandBrake/blob/master/LICENSE", target: "_blank", rel: "noreferrer", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "bi bi-box-arrow-up-right" }),
            " HandBrake LICENSE"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("a", { href: "https://github.com/HandBrake/HandBrake/blob/master/COPYING", target: "_blank", rel: "noreferrer", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "bi bi-box-arrow-up-right" }),
            " COPYING"
          ] })
        ] })
      ] }),
      activeTab === "libraries" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "about-section", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "lib-featured-grid", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("a", { className: "lib-featured-item", href: "https://github.com/HandBrake/HandBrake", target: "_blank", rel: "noreferrer", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "lib-featured-icon", children: /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "bi bi-camera-video-fill" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "lib-featured-body", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "lib-featured-name", children: "HandBrake" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "lib-featured-devs", children: "The HandBrake Team" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "lib-featured-license", children: "GPL v2" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "lib-featured-gh", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "bi bi-github" }),
              " HandBrake/HandBrake"
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("a", { className: "lib-featured-item", href: "https://github.com/yt-dlp/yt-dlp", target: "_blank", rel: "noreferrer", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "lib-featured-icon", children: /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "bi bi-cloud-arrow-down-fill" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "lib-featured-body", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "lib-featured-name", children: "yt-dlp" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "lib-featured-devs", children: "yt-dlp contributors" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "lib-featured-license", children: "Unlicense" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "lib-featured-gh", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "bi bi-github" }),
              " yt-dlp/yt-dlp"
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "libraries-intro", children: [
          "Дополнительные библиотеки с открытым исходным кодом, используемые в HandBrake. Полный список —",
          " ",
          /* @__PURE__ */ jsxRuntimeExports.jsx("a", { href: "https://github.com/HandBrake/HandBrake/blob/master/THANKS.markdown", target: "_blank", rel: "noreferrer", children: "THANKS.markdown" }),
          "."
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "libraries-grid", children: LIBRARIES.map((lib) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "a",
          {
            className: "library-item",
            href: lib.url,
            target: "_blank",
            rel: "noreferrer",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "library-name", children: lib.name }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "library-license", children: lib.license })
            ]
          },
          lib.name
        )) })
      ] })
    ] })
  ] });
}
const AUDIO_CODECS = [
  { value: "av_aac", label: "AAC (libavcodec)" },
  { value: "fdk_aac", label: "AAC (FDK)" },
  { value: "fdk_haac", label: "HE-AAC (FDK)" },
  { value: "mp3", label: "MP3" },
  { value: "ac3", label: "AC-3 (Dolby Digital)" },
  { value: "eac3", label: "E-AC-3 (Dolby Plus)" },
  { value: "vorbis", label: "Vorbis" },
  { value: "flac16", label: "FLAC 16-bit" },
  { value: "flac24", label: "FLAC 24-bit" },
  { value: "opus", label: "Opus" },
  { value: "copy", label: "Passthru (авто)" },
  { value: "copy:aac", label: "AAC Passthru" },
  { value: "copy:ac3", label: "AC3 Passthru" },
  { value: "copy:eac3", label: "E-AC3 Passthru" },
  { value: "copy:dts", label: "DTS Passthru" },
  { value: "copy:dtshd", label: "DTS-HD Passthru" },
  { value: "copy:mp3", label: "MP3 Passthru" },
  { value: "copy:truehd", label: "TrueHD Passthru" }
];
const GPU_VENDOR_LABEL = {
  nvidia: { label: "NVIDIA", icon: "bi-gpu-card", color: "#76b900" },
  amd: { label: "AMD", icon: "bi-gpu-card", color: "#ed1c24" },
  intel: { label: "Intel", icon: "bi-gpu-card", color: "#0071c5" },
  unknown: { label: null, icon: "bi-question-circle", color: null }
};
function getGpuMeta(gpuName) {
  const n2 = gpuName.toLowerCase();
  if (n2.includes("nvidia")) return GPU_VENDOR_LABEL.nvidia;
  if (n2.includes("amd") || n2.includes("radeon")) return GPU_VENDOR_LABEL.amd;
  if (n2.includes("intel")) return GPU_VENDOR_LABEL.intel;
  return GPU_VENDOR_LABEL.unknown;
}
const TABS = [
  { id: "app", label: "Приложение", icon: "bi-gear" },
  { id: "video", label: "Видео", icon: "bi-camera-video" },
  { id: "audio", label: "Аудио", icon: "bi-music-note-beamed" },
  { id: "subtitles", label: "Субтитры", icon: "bi-badge-cc" },
  { id: "filters", label: "Фильтры", icon: "bi-sliders" },
  { id: "hdr", label: "HDR / Мета", icon: "bi-stars" }
];
function Toggle({ value, onChange, disabled }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "button",
    {
      className: `sp-toggle ${value ? "on" : "off"}${disabled ? " disabled" : ""}`,
      onClick: () => !disabled && onChange(!value),
      type: "button",
      children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "sp-toggle-knob" })
    }
  );
}
function Row({ label, hint, children, className }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `sp-row${className ? " " + className : ""}`, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "sp-row-label", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "sp-row-name", children: label }),
      hint && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "sp-row-hint", children: hint })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "sp-row-control", children })
  ] });
}
function SectionHeader({ icon, title }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "sp-section-header", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: `bi ${icon}` }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: title })
  ] });
}
function SettingsPage({ theme, themeMode, onThemeModeChange, onBack, appSettings, onSave }) {
  const [activeSection, setActiveSection] = reactExports.useState("app");
  const [savedFlash, setSavedFlash] = reactExports.useState(false);
  const [gpuInfo, setGpuInfo] = reactExports.useState({ gpus: [], vendor: "unknown" });
  const [appConfig, setAppConfig] = reactExports.useState({
    defaultOutputDir: ""
  });
  const [enc, setEnc] = reactExports.useState(() => initDefaultSettings());
  const [cliStatus, setCliStatus] = reactExports.useState("checking");
  const [cliVersion, setCliVersion] = reactExports.useState("");
  const [cliPath, setCliPath] = reactExports.useState("");
  const [resolvedOutputDir, setResolvedOutputDir] = reactExports.useState("");
  const contentRef = reactExports.useRef(null);
  const sectionRefs = reactExports.useRef({});
  const isScrollingRef = reactExports.useRef(false);
  reactExports.useEffect(() => {
    if (appSettings) {
      setAppConfig((prev) => ({ ...prev, ...appSettings }));
    }
  }, [appSettings]);
  reactExports.useEffect(() => {
    window.api.checkCli().then((result) => {
      setCliStatus(result.found ? "ok" : "error");
      setCliVersion(result.version || "");
      setCliPath(result.path || "");
    }).catch(() => setCliStatus("error"));
    window.api.getDefaultOutputDir().then((dir) => setResolvedOutputDir(dir));
    window.api.getGpuInfo().then((info) => {
      setGpuInfo(info);
      const decoderMap = { nvidia: "nvdec", intel: "qsv" };
      const decoder = decoderMap[info.vendor];
      if (decoder) setEnc((prev) => prev.hwDecoding === "none" ? { ...prev, hwDecoding: decoder } : prev);
    }).catch(() => {
    });
  }, []);
  reactExports.useEffect(() => {
    const container = contentRef.current;
    if (!container) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (isScrollingRef.current) return;
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.dataset.section);
          }
        });
      },
      { root: container, rootMargin: "-30% 0px -60% 0px", threshold: 0 }
    );
    TABS.forEach((tab) => {
      const el2 = sectionRefs.current[tab.id];
      if (el2) observer.observe(el2);
    });
    const handleScroll = () => {
      if (isScrollingRef.current) return;
      const { scrollTop, scrollHeight, clientHeight } = container;
      if (scrollHeight - scrollTop - clientHeight < 8) {
        setActiveSection(TABS[TABS.length - 1].id);
      }
    };
    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      observer.disconnect();
      container.removeEventListener("scroll", handleScroll);
    };
  }, []);
  const scrollToSection = reactExports.useCallback((id2) => {
    const container = contentRef.current;
    const el2 = sectionRefs.current[id2];
    if (!container || !el2) return;
    setActiveSection(id2);
    isScrollingRef.current = true;
    container.scrollTo({ top: el2.offsetTop - 16, behavior: "smooth" });
    setTimeout(() => {
      isScrollingRef.current = false;
    }, 600);
  }, []);
  const updateEnc = (key, val) => setEnc((prev) => ({ ...prev, [key]: val }));
  const updateApp = (key, val) => setAppConfig((prev) => ({ ...prev, [key]: val }));
  const handleSave = () => {
    onSave(enc, appConfig);
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 2e3);
  };
  const handleReset = () => {
    const decoderMap = { nvidia: "nvdec", intel: "qsv" };
    const decoder = decoderMap[gpuInfo.vendor] || "none";
    const vendor = gpuInfo?.vendor || null;
    const base = vendor ? getDefaultSettingsForGpu(vendor) : { ...DEFAULT_SETTINGS };
    setEnc({ ...base, hwDecoding: decoder });
  };
  const handleBrowseOutputDir = async () => {
    const dir = await window.api.selectFolder();
    if (dir) {
      updateApp("defaultOutputDir", dir);
      setResolvedOutputDir(dir);
    }
  };
  const handleResetOutputDir = () => {
    updateApp("defaultOutputDir", "");
    window.api.getDefaultOutputDir().then((dir) => setResolvedOutputDir(dir));
  };
  const rfTable = CODEC_RF[enc.encoder] || CODEC_RF.x265;
  const speedPresets = ENCODER_PRESETS[enc.encoder] ?? [];
  ["nvenc", "qsv", "vce", "mf"].some((p2) => (enc.encoder || "").startsWith(p2));
  const isPassthru = (enc.audioCodec || "av_aac").startsWith("copy");
  const sectionRef = (id2) => (el2) => {
    sectionRefs.current[id2] = el2;
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `sp-page ${theme}`, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "sp-header", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { className: "sp-back-btn", onClick: onBack, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "bi bi-arrow-left" }),
        "Назад"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "sp-header-title", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "bi bi-gear-fill" }),
        "Настройки"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "sp-header-actions", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { className: "sp-btn-reset", onClick: handleReset, title: "Сбросить настройки кодирования до значений по умолчанию", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "bi bi-arrow-counterclockwise" }),
          "Сброс"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: `sp-btn-save${savedFlash ? " saved" : ""}`, onClick: handleSave, children: savedFlash ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "bi bi-check-lg" }),
          "Сохранено"
        ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "bi bi-floppy" }),
          "Сохранить"
        ] }) })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "sp-body", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "sp-sidebar", children: [
        TABS.map((tab) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            className: `sp-tab${activeSection === tab.id ? " active" : ""}`,
            onClick: () => scrollToSection(tab.id),
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: `bi ${tab.icon}` }),
              tab.label
            ]
          },
          tab.id
        )),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "sp-sidebar-spacer" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "sp-sidebar-hint", children: "Настройки применяются как значения по умолчанию для новых задач кодирования" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "sp-content", ref: contentRef, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "sp-section", "data-section": "app", ref: sectionRef("app"), children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(SectionHeader, { icon: "bi-palette", title: "Оформление" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Row, { label: "Тема оформления", hint: "Выбор темы интерфейса приложения", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "sp-theme-selector", children: [
            { mode: "dark", icon: "bi-moon-fill", label: "Тёмная" },
            { mode: "light", icon: "bi-sun-fill", label: "Светлая" },
            { mode: "auto", icon: "bi-circle-half", label: "Авто" }
          ].map(({ mode, icon, label }) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "button",
            {
              className: `sp-theme-btn${themeMode === mode ? " active" : ""}`,
              onClick: () => onThemeModeChange(mode),
              type: "button",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: `bi ${icon}` }),
                label
              ]
            },
            mode
          )) }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(SectionHeader, { icon: "bi-terminal", title: "HandBrake CLI" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Row, { label: "Статус", hint: "HandBrakeCLI.exe рядом с приложением", children: [
            cliStatus === "checking" && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "sp-cli-status sp-cli-status--checking", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "bi bi-arrow-repeat" }),
              " Проверка..."
            ] }),
            cliStatus === "ok" && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "sp-cli-status sp-cli-status--ok", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "bi bi-check-circle-fill" }),
              "Обнаружен",
              cliVersion ? ` · v${cliVersion}` : ""
            ] }),
            cliStatus === "error" && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "sp-cli-status sp-cli-status--error", title: cliPath, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "bi bi-x-circle-fill" }),
              " Не найден"
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(SectionHeader, { icon: "bi-gpu-card", title: "Видеокарта" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "sp-gpu-widget", children: gpuInfo.gpus.length > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "sp-gpu-items-row", children: gpuInfo.gpus.map((gpu, i) => {
              const meta = getGpuMeta(gpu);
              const isPrimary = gpu === gpuInfo.primaryGpu;
              return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `sp-gpu-item${isPrimary ? " sp-gpu-item--primary" : ""}`, children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  "span",
                  {
                    className: "sp-gpu-badge",
                    style: meta.color ? { color: meta.color, borderColor: meta.color + "40" } : {},
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: `bi ${meta.icon}` }),
                      meta.label || "GPU"
                    ]
                  }
                ),
                isPrimary && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "sp-gpu-primary-dot" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "sp-gpu-name", children: gpu })
              ] }, i);
            }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "sp-gpu-hint", children: "Доступные кодеки GPU автоматически показаны первыми в разделе «Видеокодек»" })
          ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "sp-gpu-none", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "bi bi-question-circle" }),
            "Видеокарта не определена — показаны программные кодеки"
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Row, { label: "Показывать все кодеки", hint: "На странице конвертации показывать все, а не только GPU-рекомендованные", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Toggle, { value: !!enc.showAllCodecs, onChange: (v2) => updateEnc("showAllCodecs", v2) }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(SectionHeader, { icon: "bi-folder2", title: "Папка вывода по умолчанию" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "sp-folder-widget", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "sp-folder-widget__info", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "sp-folder-widget__path", children: resolvedOutputDir || "…" }),
              !appConfig.defaultOutputDir && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "sp-folder-widget__tag", children: "папка «Видео» по умолчанию" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "sp-folder-widget__actions", children: [
              appConfig.defaultOutputDir && /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "sp-folder-widget__reset", onClick: handleResetOutputDir, title: "Сбросить к папке Видео", children: /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "bi bi-x-lg" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { className: "sp-folder-widget__browse", onClick: handleBrowseOutputDir, children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "bi bi-folder2-open" }),
                " Изменить"
              ] })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "sp-section", "data-section": "video", ref: sectionRef("video"), children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "sp-tab-description", children: "Параметры кодирования по умолчанию. Применяются к каждому новому файлу — можно изменить для конкретной задачи в списке." }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(SectionHeader, { icon: "bi-file-earmark-play", title: "Контейнер" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Row, { label: "Формат", hint: "Контейнер для выходного файла", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
            GsSelect,
            {
              value: enc.format,
              options: (() => {
                const disabledSet = ENCODER_DISABLED_FORMATS[enc.encoder] || /* @__PURE__ */ new Set();
                return [
                  { value: "av_mp4", label: "MP4", disabled: disabledSet.has("av_mp4") },
                  { value: "av_mkv", label: "MKV" },
                  { value: "av_webm", label: "WebM", disabled: disabledSet.has("av_webm") },
                  { value: "av_mov", label: "MOV", disabled: disabledSet.has("av_mov") }
                ];
              })(),
              onChange: (v2) => {
                const patch = { format: v2 };
                if (v2 === "av_webm") {
                  if (!WEBM_COMPATIBLE_ENCODERS.has(enc.encoder)) {
                    const speeds = ENCODER_PRESETS.vp9;
                    patch.encoder = "vp9";
                    patch.encoderSpeed = speeds[Math.floor(speeds.length / 2)]?.value ?? "good";
                  }
                  const audioCodec = enc.audioCodec || "av_aac";
                  if (!WEBM_COMPATIBLE_AUDIO.has(audioCodec) && !audioCodec.startsWith("copy")) {
                    patch.audioCodec = "opus";
                  }
                }
                setEnc((prev) => ({ ...prev, ...patch }));
              }
            }
          ) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(SectionHeader, { icon: "bi-cpu", title: "Кодировщик" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Row, { label: "Видеокодек", hint: "Алгоритм сжатия видео", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
            GsSelect,
            {
              value: enc.encoder,
              groups: ENCODER_GROUPS.map((g) => ({
                label: g.label,
                options: g.encoders.map((e) => ({
                  value: e.value,
                  label: e.label,
                  disabled: enc.format === "av_webm" && !WEBM_COMPATIBLE_ENCODERS.has(e.value)
                }))
              })),
              onChange: (v2) => {
                const speeds = ENCODER_PRESETS[v2] ?? [];
                const mid = speeds[Math.floor(speeds.length / 2)]?.value ?? "medium";
                setEnc((prev) => ({ ...prev, encoder: v2, encoderSpeed: mid }));
              }
            }
          ) }),
          speedPresets.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(Row, { label: "Скорость / пресет", hint: "Соотношение скорость↔эффективность кодека", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
            GsSelect,
            {
              value: enc.encoderSpeed,
              options: speedPresets.map((sp) => ({ value: sp.value, label: sp.label })),
              onChange: (v2) => updateEnc("encoderSpeed", v2)
            }
          ) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(SectionHeader, { icon: "bi-sliders2", title: "Качество" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Row, { label: "Режим качества", hint: "Предустановка или точное значение RF/CRF", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
            GsSelect,
            {
              value: enc.quality,
              options: [
                { value: "source", label: "Исходное (без потерь)" },
                { value: "high", label: `Высокое (RF ${rfTable.high})` },
                { value: "medium", label: `Среднее (RF ${rfTable.medium})` },
                { value: "low", label: `Низкое (RF ${rfTable.low})` },
                { value: "potato", label: `Максимальное сжатие (RF ${rfTable.potato})` },
                { value: "custom", label: enc.quality === "custom" ? `Своё (RF ${enc.customQuality})` : "Своё значение..." }
              ],
              onChange: (v2) => updateEnc("quality", v2)
            }
          ) }),
          enc.quality === "custom" && /* @__PURE__ */ jsxRuntimeExports.jsx(
            Row,
            {
              label: `RF / CRF: ${enc.customQuality}`,
              hint: `Диапазон: ${rfTable.min} (лучше) — ${rfTable.max} (хуже)`,
              children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "sp-slider-wrap", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "sp-slider-edge", children: rfTable.min }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "input",
                  {
                    type: "range",
                    className: "sp-slider",
                    min: rfTable.min,
                    max: rfTable.max,
                    step: 1,
                    value: enc.customQuality,
                    onChange: (e) => updateEnc("customQuality", Number(e.target.value))
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "sp-slider-edge", children: rfTable.max })
              ] })
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(SectionHeader, { icon: "bi-aspect-ratio", title: "Разрешение и частота кадров" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Row, { label: "Разрешение", hint: "Максимальное разрешение (масштабирование вниз)", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
            GsSelect,
            {
              value: enc.resolution,
              options: [
                { value: "source", label: "По исходному" },
                { value: "4k", label: "4K (2160p)" },
                { value: "1440p", label: "2K (1440p)" },
                { value: "1080p", label: "1080p (Full HD)" },
                { value: "720p", label: "720p (HD)" },
                { value: "480p", label: "480p (SD)" }
              ],
              onChange: (v2) => updateEnc("resolution", v2)
            }
          ) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Row, { label: "Частота кадров", hint: "Целевой FPS выходного видео", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
            GsSelect,
            {
              value: enc.fps,
              options: [
                { value: "source", label: "По исходному" },
                { value: "60", label: "60 fps" },
                { value: "30", label: "30 fps" },
                { value: "25", label: "25 fps (PAL)" },
                { value: "24", label: "24 fps (кино)" },
                { value: "23.976", label: "23.976 fps (NTSC)" }
              ],
              onChange: (v2) => updateEnc("fps", v2)
            }
          ) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Row, { label: "Режим FPS", hint: "VFR = переменный, CFR = постоянный, PFR = с ограничением", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
            GsSelect,
            {
              value: enc.fpsMode || "vfr",
              options: [
                { value: "vfr", label: "VFR — переменный (рекомендован)" },
                { value: "cfr", label: "CFR — постоянный" },
                { value: "pfr", label: "PFR — с пиковым ограничением" }
              ],
              onChange: (v2) => updateEnc("fpsMode", v2)
            }
          ) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(SectionHeader, { icon: "bi-lightning-charge", title: "Аппаратное ускорение" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Row, { label: "Аппаратное декодирование", hint: "Разгружает CPU при чтении источника", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
            GsSelect,
            {
              value: enc.hwDecoding || "none",
              options: [
                { value: "none", label: "Отключено (программное)" },
                { value: "nvdec", label: "NVDEC (NVIDIA)" },
                { value: "qsv", label: "Quick Sync (Intel)" }
              ],
              onChange: (v2) => updateEnc("hwDecoding", v2)
            }
          ) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Row, { label: "Двухпроходное кодирование", hint: "2-pass: лучше распределяет битрейт, кодирует в 2× дольше", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Toggle, { value: !!enc.multiPass, onChange: (v2) => updateEnc("multiPass", v2) }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "sp-section", "data-section": "audio", ref: sectionRef("audio"), children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(SectionHeader, { icon: "bi-music-note-beamed", title: "Кодек аудио" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Row, { label: "Аудиокодек", hint: "Кодек для аудиодорожки выходного файла", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
            GsSelect,
            {
              value: enc.audioCodec || "av_aac",
              options: AUDIO_CODECS.map((c) => ({
                ...c,
                disabled: enc.format === "av_webm" && !WEBM_COMPATIBLE_AUDIO.has(c.value) && !c.value.startsWith("copy")
              })),
              onChange: (v2) => updateEnc("audioCodec", v2)
            }
          ) }),
          !isPassthru && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(SectionHeader, { icon: "bi-speaker", title: "Параметры аудио" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Row, { label: "Битрейт", hint: "Битрейт аудиодорожки в кбит/с", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              GsSelect,
              {
                value: enc.audioBitrate || "160",
                options: [
                  { value: "64", label: "64 kbps" },
                  { value: "96", label: "96 kbps" },
                  { value: "128", label: "128 kbps" },
                  { value: "160", label: "160 kbps (по умолчанию)" },
                  { value: "192", label: "192 kbps" },
                  { value: "256", label: "256 kbps" },
                  { value: "320", label: "320 kbps" }
                ],
                onChange: (v2) => updateEnc("audioBitrate", v2)
              }
            ) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Row, { label: "Микшинг", hint: "Количество каналов в выходной аудиодорожке", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              GsSelect,
              {
                value: enc.audioMixdown || "stereo",
                options: [
                  { value: "mono", label: "Моно (1.0)" },
                  { value: "stereo", label: "Стерео (2.0)" },
                  { value: "dpl2", label: "Dolby Pro Logic II" },
                  { value: "5point1", label: "Surround 5.1" },
                  { value: "6point1", label: "Surround 6.1" },
                  { value: "7point1", label: "Surround 7.1" }
                ],
                onChange: (v2) => updateEnc("audioMixdown", v2)
              }
            ) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Row, { label: "Частота дискретизации", hint: "Sample rate аудио", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              GsSelect,
              {
                value: enc.audioSampleRate || "auto",
                options: [
                  { value: "auto", label: "Авто (по исходному)" },
                  { value: "22.05", label: "22.05 kHz" },
                  { value: "32", label: "32 kHz" },
                  { value: "44.1", label: "44.1 kHz" },
                  { value: "48", label: "48 kHz" },
                  { value: "96", label: "96 kHz" }
                ],
                onChange: (v2) => updateEnc("audioSampleRate", v2)
              }
            ) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(SectionHeader, { icon: "bi-collection-play", title: "Метаданные файла" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Row, { label: "Метки глав (Chapter markers)", hint: "Добавлять chapter markers в контейнер", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Toggle, { value: enc.chapterMarkers !== false, onChange: (v2) => updateEnc("chapterMarkers", v2) }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Row, { label: "Оптимизировать MP4 (fast start)", hint: "Moov-атом в начале файла — для HTTP стриминга. Только MP4.", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
            Toggle,
            {
              value: !!enc.optimizeMP4,
              onChange: (v2) => updateEnc("optimizeMP4", v2),
              disabled: enc.format !== "av_mp4"
            }
          ) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "sp-section", "data-section": "subtitles", ref: sectionRef("subtitles"), children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(SectionHeader, { icon: "bi-badge-cc", title: "Дорожки субтитров" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Row, { label: "Субтитры", hint: "Какие дорожки субтитров включить в выходной файл", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
            GsSelect,
            {
              value: enc.subtitleMode || "none",
              options: [
                { value: "none", label: "Не включать" },
                { value: "first", label: "Первая дорожка" },
                { value: "all", label: "Все дорожки" },
                { value: "scan_forced", label: "Авто (принудительные / иностранные)" }
              ],
              onChange: (v2) => updateEnc("subtitleMode", v2)
            }
          ) }),
          enc.subtitleMode !== "none" && enc.subtitleMode !== "all" && /* @__PURE__ */ jsxRuntimeExports.jsx(Row, { label: "Вшивать субтитры", hint: "Субтитры рендерятся прямо в кадр (burn-in). Не требует поддержки контейнером", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Toggle, { value: !!enc.subtitleBurn, onChange: (v2) => updateEnc("subtitleBurn", v2) }) }),
          enc.subtitleMode !== "none" && !enc.subtitleBurn && enc.subtitleMode !== "all" && /* @__PURE__ */ jsxRuntimeExports.jsx(Row, { label: "Субтитры по умолчанию", hint: "Отметить дорожку субтитров как выбранную по умолчанию в плеере", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Toggle, { value: !!enc.subtitleDefault, onChange: (v2) => updateEnc("subtitleDefault", v2) }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(SectionHeader, { icon: "bi-translate", title: "Язык субтитров" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Row, { label: "Предпочитаемый язык", hint: "Нативный язык: при наличии такой дорожки, она будет выбрана автоматически", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
            GsSelect,
            {
              value: enc.subtitleLanguage || "any",
              options: [
                { value: "any", label: "Любой (не фильтровать)" },
                { value: "eng", label: "Английский (eng)" },
                { value: "rus", label: "Русский (rus)" },
                { value: "jpn", label: "Японский (jpn)" },
                { value: "chi", label: "Китайский (chi)" },
                { value: "kor", label: "Корейский (kor)" },
                { value: "fra", label: "Французский (fra)" },
                { value: "deu", label: "Немецкий (deu)" },
                { value: "spa", label: "Испанский (spa)" },
                { value: "por", label: "Португальский (por)" },
                { value: "ita", label: "Итальянский (ita)" },
                { value: "ara", label: "Арабский (ara)" }
              ],
              onChange: (v2) => updateEnc("subtitleLanguage", v2)
            }
          ) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "sp-section", "data-section": "filters", ref: sectionRef("filters"), children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(SectionHeader, { icon: "bi-intersect", title: "Деинтерлейс" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Row, { label: "Деинтерлейс", hint: "Устраняет гребёнку от чересстрочной развёртки", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
            GsSelect,
            {
              value: enc.deinterlace || "off",
              options: [
                { value: "off", label: "Отключён" },
                { value: "yadif_default", label: "Yadif — стандартный" },
                { value: "yadif_bob", label: "Yadif Bob (двойной FPS)" },
                { value: "bwdif_default", label: "BWDif — стандартный" },
                { value: "bwdif_bob", label: "BWDif Bob (двойной FPS)" }
              ],
              onChange: (v2) => updateEnc("deinterlace", v2)
            }
          ) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(SectionHeader, { icon: "bi-snow2", title: "Шумоподавление" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Row, { label: "Денойз", hint: "Убирает видеошум. Требует дополнительного времени.", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
            GsSelect,
            {
              value: enc.denoise || "off",
              options: [
                { value: "off", label: "Отключено" },
                { value: "nlmeans_ultralight", label: "NL-Means — минимальный" },
                { value: "nlmeans_light", label: "NL-Means — лёгкий" },
                { value: "nlmeans_medium", label: "NL-Means — средний" },
                { value: "nlmeans_strong", label: "NL-Means — сильный" },
                { value: "hqdn3d_light", label: "HQ 3D — лёгкий" },
                { value: "hqdn3d_medium", label: "HQ 3D — средний" },
                { value: "hqdn3d_strong", label: "HQ 3D — сильный" }
              ],
              onChange: (v2) => updateEnc("denoise", v2)
            }
          ) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(SectionHeader, { icon: "bi-grid-3x3", title: "Деблокинг" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Row, { label: "Деблокинг", hint: "Убирает блочные артефакты от кодека источника", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
            GsSelect,
            {
              value: enc.deblock || "off",
              options: [
                { value: "off", label: "Отключён" },
                { value: "ultralight", label: "Минимальный" },
                { value: "light", label: "Лёгкий" },
                { value: "medium", label: "Средний" },
                { value: "strong", label: "Сильный" },
                { value: "stronger", label: "Максимальный" }
              ],
              onChange: (v2) => updateEnc("deblock", v2)
            }
          ) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(SectionHeader, { icon: "bi-zoom-in", title: "Резкость" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Row, { label: "Повышение резкости", hint: "Unsharp Mask или Laplacian Sharpen", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
            GsSelect,
            {
              value: enc.sharpen || "off",
              options: [
                { value: "off", label: "Отключено" },
                { value: "unsharp_ultralight", label: "Unsharp — минимальный" },
                { value: "unsharp_light", label: "Unsharp — лёгкий" },
                { value: "unsharp_medium", label: "Unsharp — средний" },
                { value: "unsharp_strong", label: "Unsharp — сильный" },
                { value: "lapsharp_ultralight", label: "Lapsharp — минимальный" },
                { value: "lapsharp_light", label: "Lapsharp — лёгкий" },
                { value: "lapsharp_medium", label: "Lapsharp — средний" },
                { value: "lapsharp_strong", label: "Lapsharp — сильный" }
              ],
              onChange: (v2) => updateEnc("sharpen", v2)
            }
          ) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(SectionHeader, { icon: "bi-camera", title: "Трансформация кадра" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Row, { label: "Чёрно-белый режим", hint: "Удаляет цветовую информацию (grayscale)", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Toggle, { value: !!enc.grayscale, onChange: (v2) => updateEnc("grayscale", v2) }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Row, { label: "Поворот / отражение", hint: "Повернуть или отразить кадр", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
            GsSelect,
            {
              value: enc.rotate || "0",
              options: [
                { value: "0", label: "Без поворота" },
                { value: "90", label: "90° по часовой" },
                { value: "180", label: "180°" },
                { value: "270", label: "270° (90° против часовой)" },
                { value: "hflip", label: "Горизонтальное отражение" }
              ],
              onChange: (v2) => updateEnc("rotate", v2)
            }
          ) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "sp-section", "data-section": "hdr", ref: sectionRef("hdr"), children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(SectionHeader, { icon: "bi-brightness-high", title: "HDR" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Row, { label: "Динамические метаданные HDR", hint: "Передать HDR10+ или Dolby Vision metadata в выходной файл", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
            GsSelect,
            {
              value: enc.hdrMetadata || "off",
              options: [
                { value: "off", label: "Отключено" },
                { value: "hdr10plus", label: "HDR10+" },
                { value: "dolbyvision", label: "Dolby Vision" },
                { value: "all", label: "Все (HDR10+ и Dolby Vision)" }
              ],
              onChange: (v2) => updateEnc("hdrMetadata", v2)
            }
          ) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(SectionHeader, { icon: "bi-tag", title: "Метаданные файла" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Row, { label: "Сохранять метаданные", hint: "Копировать теги, описание, обложку из источника в выходной файл", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Toggle, { value: !!enc.keepMetadata, onChange: (v2) => updateEnc("keepMetadata", v2) }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Row, { label: "Inline Parameter Sets", hint: "SPS/PPS inline в каждом кадре — требуется для HLS-стриминга", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Toggle, { value: !!enc.inlineParamSets, onChange: (v2) => updateEnc("inlineParamSets", v2) }) })
        ] })
      ] })
    ] })
  ] });
}
function getEncoderErrorHint(stderr) {
  if (/No capable devices found/i.test(stderr)) {
    if (/av1_nvenc/i.test(stderr)) return "Ваш GPU не поддерживает AV1 NVENC.";
    if (/h265_nvenc|hevc_nvenc/i.test(stderr)) return "Ваш GPU не поддерживает H.265 NVENC.";
    if (/nvenc/i.test(stderr)) return "Ваш GPU не поддерживает выбранный NVENC-кодировщик.";
    if (/av1_amf|av1_vce/i.test(stderr)) return "Ваш GPU не поддерживает AV1 VCE.";
    if (/av1_qsv/i.test(stderr)) return "Ваш GPU не поддерживает AV1 QSV.";
    return "Выбранный аппаратный кодировщик недоступен на данном GPU.";
  }
  if (/avcodec_open failed|Failure to initialise thread/i.test(stderr)) {
    if (/nvenc/i.test(stderr)) return "Не удалось инициализировать NVENC. Убедитесь, что драйверы NVIDIA актуальны.";
    if (/qsv/i.test(stderr)) return "Не удалось инициализировать Intel QSV. Проверьте драйверы Intel.";
    if (/vce|amf/i.test(stderr)) return "Не удалось инициализировать AMD VCE/AMF. Проверьте драйверы AMD.";
  }
  return null;
}
function App() {
  const [view, setView] = reactExports.useState("source");
  const [videos, setVideos] = reactExports.useState([]);
  const [isDragging, setIsDragging] = reactExports.useState(false);
  const [isDraggingOnList, setIsDraggingOnList] = reactExports.useState(false);
  const [selectedSettings, setSelectedSettings] = reactExports.useState(() => initDefaultSettings());
  const [isEncoding, setIsEncoding] = reactExports.useState(false);
  const [isPaused, setIsPaused] = reactExports.useState(false);
  const [encodingStartTime, setEncodingStartTime] = reactExports.useState(null);
  const [cliErrors, setCliErrors] = reactExports.useState([]);
  const [copiedIdx, setCopiedIdx] = reactExports.useState(null);
  const videosRef = reactExports.useRef([]);
  const progressStateRef = reactExports.useRef(/* @__PURE__ */ new Map());
  const stoppedJobsRef = reactExports.useRef(/* @__PURE__ */ new Set());
  const [themeMode, setThemeMode] = reactExports.useState(() => {
    const saved = localStorage.getItem("theme");
    return saved === "dark" || saved === "light" ? saved : "auto";
  });
  const [theme, setTheme] = reactExports.useState(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "dark" || saved === "light") return saved;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });
  const [isLoading, setIsLoading] = reactExports.useState(false);
  const [loadingMessage, setLoadingMessage] = reactExports.useState(null);
  const [outputMode, setOutputMode] = reactExports.useState("default");
  const [customOutputDir, setCustomOutputDir] = reactExports.useState(() => {
    try {
      const s = JSON.parse(localStorage.getItem("gorex-app-config") || "{}");
      return s.defaultOutputDir || s.defaultCustomOutputDir || "";
    } catch {
      return "";
    }
  });
  const [defaultOutputDir, setDefaultOutputDir] = reactExports.useState("");
  const [appSettings, setAppSettings] = reactExports.useState(null);
  const [gpuVendor, setGpuVendor] = reactExports.useState("unknown");
  const nextIdRef = reactExports.useRef(0);
  const listDragCounter = reactExports.useRef(0);
  reactExports.useEffect(() => {
    videosRef.current = videos;
  }, [videos]);
  const loadAndAddVideos = async (paths, downloadService = false) => {
    if (!paths || paths.length === 0) return;
    setIsLoading(true);
    try {
      const data = await window.api.getVideoData(paths);
      const newVideos = data.map((v2) => ({
        ...v2,
        id: nextIdRef.current++,
        progress: 0,
        status: "ready",
        customSettings: null,
        downloadService: downloadService && typeof downloadService === "object" ? downloadService : null
      }));
      setVideos((prev) => {
        const updated = [...prev, ...newVideos];
        return updated;
      });
      setView("list");
    } catch (err) {
      console.error("Failed to load video data:", err);
    } finally {
      setIsLoading(false);
    }
  };
  const handleSelectFiles = async () => {
    try {
      const paths = await window.api.selectFiles();
      if (paths && paths.length > 0) await loadAndAddVideos(paths);
    } catch (err) {
      console.error("Failed to select files:", err);
    }
  };
  const handleRemoveVideo = (id2) => {
    setVideos((prev) => {
      const updated = prev.filter((v2) => v2.id !== id2);
      if (updated.length === 0) setView("source");
      return updated;
    });
  };
  const handleClearQueue = () => {
    setVideos([]);
    setView("source");
  };
  const handleRenameOutput = (id2, newName) => {
    setVideos((prev) => prev.map((v2) => v2.id === id2 ? { ...v2, outputName: newName } : v2));
  };
  const handleVideoSettingsChange = (id2, settings) => {
    setVideos((prev) => prev.map((v2) => v2.id === id2 ? { ...v2, customSettings: settings } : v2));
  };
  const handleDownload = async (url, service) => {
    setIsLoading(true);
    setLoadingMessage({ title: "Получение форматов...", subtitle: "Запрашиваем информацию о видео" });
    try {
      const info = await window.api.ytdlGetFormats(url);
      const safeOutputName = (info.title || "video").replace(/[<>:"/\\|?*\x00-\x1f]/g, "_").replace(/\.+$/, "").trim() || "video";
      let bestFormatId = "";
      if (info.formats && info.formats.length) {
        const seen = /* @__PURE__ */ new Map();
        for (const f2 of info.formats) {
          if (!f2.vcodec || f2.vcodec === "none") continue;
          const base = (f2.vcodec || "").split(".")[0].toLowerCase();
          const key = `${f2.height || 0}_${base}`;
          const prev = seen.get(key);
          if (!prev || (f2.tbr || 0) > (prev.tbr || 0)) seen.set(key, f2);
        }
        const sorted = [...seen.values()].sort((a, b) => (b.height || 0) - (a.height || 0));
        bestFormatId = sorted[0]?.format_id || "";
      }
      const newVideo = {
        id: nextIdRef.current++,
        isYtdlItem: true,
        ytdlUrl: url,
        ytdlFormats: info.formats,
        ytdlSelectedFormat: bestFormatId,
        title: info.title,
        outputName: safeOutputName,
        thumbnail: info.thumbnailUrl,
        status: "format_select",
        progress: 0,
        downloadService: service,
        convertAfterDownload: false,
        conversionSettings: null,
        customSettings: null
      };
      setVideos((prev) => [...prev, newVideo]);
      setView("list");
    } catch (err) {
      console.error("Failed to fetch yt-dlp formats:", err);
    } finally {
      setIsLoading(false);
      setLoadingMessage(null);
    }
  };
  const handleYtdlFormatChange = (id2, formatId) => {
    setVideos((prev) => prev.map((v2) => v2.id === id2 ? { ...v2, ytdlSelectedFormat: formatId } : v2));
  };
  const handleYtdlConvertToggle = (id2, val) => {
    setVideos((prev) => prev.map((v2) => v2.id === id2 ? { ...v2, convertAfterDownload: val } : v2));
  };
  const handleYtdlConversionSettings = (id2, settings) => {
    setVideos((prev) => prev.map((v2) => v2.id === id2 ? { ...v2, conversionSettings: settings } : v2));
  };
  const toggleTheme = () => {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      localStorage.setItem("theme", next);
      setThemeMode(next);
      return next;
    });
  };
  const handleSetThemeMode = (mode) => {
    setThemeMode(mode);
    if (mode === "auto") {
      localStorage.removeItem("theme");
      const sys = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      setTheme(sys);
    } else {
      localStorage.setItem("theme", mode);
      setTheme(mode);
    }
  };
  reactExports.useEffect(() => {
    if (themeMode !== "auto") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e) => setTheme(e.matches ? "dark" : "light");
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [themeMode]);
  const handlePause = () => {
    if (!isEncoding) return;
    if (isPaused) {
      window.api.resumeAll();
      setIsPaused(false);
    } else {
      window.api.pauseAll();
      setIsPaused(true);
    }
  };
  const handleStop = () => {
    videosRef.current.filter((v2) => ["encoding", "downloading", "converting"].includes(v2.status)).forEach((v2) => stoppedJobsRef.current.add(v2.id));
    window.api.stopAll();
    setIsEncoding(false);
    setIsPaused(false);
    setEncodingStartTime(null);
    progressStateRef.current.clear();
    setVideos((prev) => prev.map(
      (v2) => ["encoding", "downloading", "converting"].includes(v2.status) ? { ...v2, status: v2.isYtdlItem ? "format_select" : "ready", progress: 0, startTime: null, endTime: null } : v2
    ));
  };
  const handleViewChange = (newView) => {
    setView(newView);
  };
  const handleSaveSettings = async (encodingSettings, appConfig) => {
    localStorage.setItem("gorex-default-settings", JSON.stringify(encodingSettings));
    setSelectedSettings(encodingSettings);
    localStorage.setItem("gorex-app-config", JSON.stringify(appConfig));
    if (appConfig.defaultOutputDir) setCustomOutputDir(appConfig.defaultOutputDir);
    await window.api.saveAppSettings(appConfig);
    setAppSettings(appConfig);
    window.api.getDefaultOutputDir().then((dir) => setDefaultOutputDir(dir));
  };
  const handleOutputModeChange = async (mode) => {
    if (mode === "custom") {
      const dir = await window.api.selectFolder();
      if (dir) {
        setCustomOutputDir(dir);
        setOutputMode("custom");
      }
    } else {
      setOutputMode(mode);
    }
  };
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) {
      const paths = Array.from(e.dataTransfer.files).map((f2) => f2.path);
      loadAndAddVideos(paths);
    }
  };
  const handleListDragEnter = (e) => {
    e.preventDefault();
    listDragCounter.current++;
    setIsDraggingOnList(true);
  };
  const handleListDragLeave = (e) => {
    e.preventDefault();
    listDragCounter.current--;
    if (listDragCounter.current === 0) setIsDraggingOnList(false);
  };
  const handleListDragOver = (e) => {
    e.preventDefault();
  };
  const handleListDrop = (e) => {
    e.preventDefault();
    listDragCounter.current = 0;
    setIsDraggingOnList(false);
    if (e.dataTransfer.files.length > 0) {
      const paths = Array.from(e.dataTransfer.files).map((f2) => f2.path);
      loadAndAddVideos(paths);
    }
  };
  const startEncoding = () => {
    const now = Date.now();
    setIsEncoding(true);
    setIsPaused(false);
    setEncodingStartTime(now);
    progressStateRef.current.clear();
    setVideos((prev) => prev.map(
      (v2) => v2.status === "done" || v2.status === "error" ? { ...v2, progress: 0, status: v2.isYtdlItem ? "format_select" : "ready", startTime: null, endTime: null } : v2
    ));
    const resolvedOutputDir = outputMode === "default" ? defaultOutputDir : customOutputDir;
    videos.forEach((v2) => {
      if (v2.isYtdlItem) {
        window.api.ytdlRun({
          id: v2.id,
          url: v2.ytdlUrl,
          formatId: v2.ytdlSelectedFormat || "best",
          outputDir: resolvedOutputDir,
          outputName: v2.outputName,
          convertAfterDownload: v2.convertAfterDownload,
          conversionSettings: v2.conversionSettings,
          videoResolution: v2.resolution
        });
      } else {
        window.api.runCli({
          filePath: v2.path,
          settings: v2.customSettings || selectedSettings,
          id: v2.id,
          outputMode,
          customOutputDir: resolvedOutputDir,
          outputName: v2.outputName,
          videoResolution: v2.resolution
        });
      }
    });
  };
  reactExports.useEffect(() => {
    window.api.getDefaultOutputDir().then((dir) => setDefaultOutputDir(dir));
    window.api.getAppSettings().then((s) => {
      if (s) setAppSettings(s);
    });
    window.api.getGpuInfo().then((info) => {
      if (info && info.vendor) {
        setGpuVendor(info.vendor);
        saveGpuVendor(info.vendor);
        const hasSaved = !!localStorage.getItem("gorex-default-settings");
        if (!hasSaved) {
          setSelectedSettings(getDefaultSettingsForGpu(info.vendor));
        }
      }
    }).catch(() => {
    });
  }, []);
  reactExports.useEffect(() => {
    document.body.className = theme;
  }, [theme]);
  reactExports.useEffect(() => {
    window.api.onCliProgress(({ id: id2, progress }) => {
      const ps = progressStateRef.current;
      const state = ps.get(id2) || { current: 0 };
      if (progress < state.current) return;
      ps.set(id2, { current: progress });
      setVideos((prev) => prev.map(
        (v2) => v2.id === id2 ? { ...v2, progress, status: "encoding", startTime: v2.startTime ?? Date.now() } : v2
      ));
    });
    window.api.onYtdlProgress(({ id: id2, progress }) => {
      setVideos((prev) => prev.map(
        (v2) => v2.id === id2 ? { ...v2, progress, status: "downloading", startTime: v2.startTime ?? Date.now() } : v2
      ));
    });
    window.api.onYtdlExit(({ id: id2, code, converting }) => {
      if (stoppedJobsRef.current.has(id2)) {
        stoppedJobsRef.current.delete(id2);
        return;
      }
      if (converting) {
        setVideos((prev) => prev.map(
          (v2) => v2.id === id2 ? { ...v2, progress: 0, status: "converting", startTime: Date.now() } : v2
        ));
      } else {
        setVideos((prev) => {
          const updated = prev.map(
            (v2) => v2.id === id2 ? { ...v2, progress: 100, status: code === 0 ? "done" : "error", endTime: Date.now() } : v2
          );
          if (!updated.some((v2) => ["encoding", "downloading", "converting"].includes(v2.status))) {
            setIsEncoding(false);
            setEncodingStartTime(null);
          }
          return updated;
        });
      }
    });
    window.api.onCliExit(({ id: id2, code, stderr }) => {
      if (stoppedJobsRef.current.has(id2)) {
        stoppedJobsRef.current.delete(id2);
        progressStateRef.current.delete(id2);
        return;
      }
      progressStateRef.current.delete(id2);
      setVideos((prev) => {
        const updated = prev.map(
          (v2) => v2.id === id2 ? { ...v2, progress: 100, status: code === 0 ? "done" : "error", endTime: Date.now() } : v2
        );
        if (!updated.some((v2) => ["encoding", "downloading", "converting"].includes(v2.status))) {
          setIsEncoding(false);
          setEncodingStartTime(null);
        }
        return updated;
      });
      if (code !== 0) {
        const v2 = videosRef.current.find((v22) => v22.id === id2);
        const title = v2 ? v2.title || v2.path?.split(/[\/\\]/).pop() || "Неизвестный файл" : "Неизвестный файл";
        const hint = getEncoderErrorHint(stderr || "");
        setCliErrors((prev) => [...prev, { title, stderr: (stderr || "").trim() || "(нет вывода)", hint }]);
      }
    });
  }, []);
  const renderPage = () => {
    switch (view) {
      case "about":
        return /* @__PURE__ */ jsxRuntimeExports.jsx(
          AboutPage,
          {
            theme,
            onBack: () => setView(videos.length > 0 ? "list" : "source")
          }
        );
      case "settings":
        return /* @__PURE__ */ jsxRuntimeExports.jsx(
          SettingsPage,
          {
            theme,
            themeMode,
            onThemeModeChange: handleSetThemeMode,
            onBack: () => setView(videos.length > 0 ? "list" : "source"),
            appSettings,
            onSave: handleSaveSettings
          }
        );
      case "list":
        return /* @__PURE__ */ jsxRuntimeExports.jsx(
          ListPage,
          {
            videos,
            settings: selectedSettings,
            isEncoding,
            theme,
            gpuVendor,
            encodingStartTime,
            onSettingsChange: setSelectedSettings,
            onStartEncoding: startEncoding,
            onStop: handleStop,
            outputMode,
            customOutputDir,
            defaultOutputDir,
            onOutputModeChange: handleOutputModeChange,
            onAddFiles: handleSelectFiles,
            onDownload: handleDownload,
            onRemoveVideo: handleRemoveVideo,
            onClearQueue: handleClearQueue,
            onRenameOutput: handleRenameOutput,
            onVideoSettingsChange: handleVideoSettingsChange,
            onYtdlFormatChange: handleYtdlFormatChange,
            onYtdlConvertToggle: handleYtdlConvertToggle,
            onYtdlConversionSettings: handleYtdlConversionSettings,
            isDraggingOnList,
            onListDragEnter: handleListDragEnter,
            onListDragLeave: handleListDragLeave,
            onListDragOver: handleListDragOver,
            onListDrop: handleListDrop
          }
        );
      default:
        return /* @__PURE__ */ jsxRuntimeExports.jsx(
          SourcePage,
          {
            theme,
            isDragging,
            onSelectFiles: handleSelectFiles,
            onDragOver: (e) => {
              e.preventDefault();
              setIsDragging(true);
            },
            onDragLeave: () => setIsDragging(false),
            onDrop: handleDrop,
            onDownload: handleDownload
          }
        );
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `app-wrapper ${theme}`, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      TitleBar,
      {
        onOpen: handleSelectFiles,
        theme,
        toggleTheme,
        onViewChange: handleViewChange,
        currentView: view,
        isEncoding,
        isPaused,
        hasVideos: videos.length > 0,
        onStartEncoding: startEncoding,
        onPause: handlePause,
        onStop: handleStop,
        onClearQueue: handleClearQueue
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx("main", { className: "container", children: renderPage() }),
    isLoading && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `loading-overlay ${theme}`, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "loading-popup", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "loading-popup-title", children: loadingMessage?.title ?? "Анализ файлов..." }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "loading-popup-subtitle", children: loadingMessage?.subtitle ?? "Считываем метаданные видео" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "loading-bar-track", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "loading-bar-fill" }) })
    ] }) }),
    cliErrors.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `cli-error-overlay ${theme}`, onClick: () => setCliErrors([]), children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "cli-error-popup", onClick: (e) => e.stopPropagation(), children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "cli-error-header", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "bi bi-exclamation-triangle-fill cli-error-icon" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "cli-error-title", children: cliErrors.length === 1 ? "Ошибка кодирования" : `Ошибки кодирования (${cliErrors.length})` }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "cli-error-close", onClick: () => setCliErrors([]), children: /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "bi bi-x-lg" }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "cli-error-body", children: cliErrors.map((err, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "cli-error-item", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "cli-error-item-header", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "cli-error-item-title", children: err.title }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              className: `cli-error-copy${copiedIdx === i ? " copied" : ""}`,
              title: "Копировать",
              onClick: () => {
                navigator.clipboard.writeText(err.stderr);
                setCopiedIdx(i);
                setTimeout(() => setCopiedIdx((c) => c === i ? null : c), 1500);
              },
              children: /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: `bi ${copiedIdx === i ? "bi-check-lg" : "bi-clipboard"}` })
            }
          )
        ] }),
        err.hint && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "cli-error-hint", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "bi bi-lightbulb-fill" }),
          err.hint
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("pre", { className: "cli-error-log", children: err.stderr })
      ] }, i)) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "cli-error-footer", children: [
        cliErrors.length > 1 && /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            className: `cli-error-copy-all${copiedIdx === "all" ? " copied" : ""}`,
            onClick: () => {
              const all = cliErrors.map((e, i) => `[${i + 1}] ${e.title}
${e.stderr}`).join("\n\n");
              navigator.clipboard.writeText(all);
              setCopiedIdx("all");
              setTimeout(() => setCopiedIdx((c) => c === "all" ? null : c), 1500);
            },
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: `bi ${copiedIdx === "all" ? "bi-check-lg" : "bi-clipboard"}` }),
              copiedIdx === "all" ? "Скопировано" : "Копировать всё"
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "cli-error-dismiss", onClick: () => setCliErrors([]), children: "Закрыть" })
      ] })
    ] }) })
  ] });
}
client.createRoot(document.getElementById("root")).render(
  /* @__PURE__ */ jsxRuntimeExports.jsx(React.StrictMode, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(App, {}) })
);
