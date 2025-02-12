"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = SearchBar;
var _react = _interopRequireWildcard(require("react"));
var _Link = _interopRequireDefault(require("@docusaurus/Link"));
var _clsx = _interopRequireDefault(require("clsx"));
var _useDebounce = require("use-debounce");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && {}.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
function SearchBar({
  apiEndpoint
}) {
  const [query, setQuery] = (0, _react.useState)('');
  const [debouncedQuery] = (0, _useDebounce.useDebounce)(query, 300);
  const [results, setResults] = (0, _react.useState)([]);
  const [error, setError] = (0, _react.useState)(null);
  (0, _react.useEffect)(() => {
    if (debouncedQuery.trim().length > 1) {
      setError(null);
      const fetchResults = async () => {
        try {
          const response = await fetch(`${apiEndpoint}?q=${debouncedQuery}`);
          const data = await response.json();
          setResults(data.result['qsc-documentation'].documents || []);
        } catch (error) {
          setError('Error fetching search results.');
        }
      };
      fetchResults();
    } else {
      setResults([]);
    }
  }, [debouncedQuery, apiEndpoint]);
  const handleSearch = e => {
    setQuery(e.target.value);
  };
  return /*#__PURE__*/_react.default.createElement("div", {
    className: "searchContainer"
  }, /*#__PURE__*/_react.default.createElement("input", {
    type: "text",
    className: (0, _clsx.default)('navbar__search-input', 'searchInput'),
    placeholder: "Search documentation...",
    value: query,
    onChange: handleSearch
  }), error && /*#__PURE__*/_react.default.createElement("p", null, error), results.length > 0 && /*#__PURE__*/_react.default.createElement("ul", {
    className: "searchResults"
  }, results.map(result => /*#__PURE__*/_react.default.createElement("li", {
    key: result.id
  }, /*#__PURE__*/_react.default.createElement(_Link.default, {
    to: result?.document.url
  }, /*#__PURE__*/_react.default.createElement("strong", null, result.document.title || result.id))))));
}