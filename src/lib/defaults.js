
export const DEFAULT_CONFIG = {

  // tab to show when app starts; see App.js:TabValue enum
  "initialTab": "about",

  // true to show the "Scan", "Photo" and "Search" tabs; false to hide
  "showScan": true,
  "showPhoto": true,
  "showSearch": true,

  // stop camera scanning after this many millis (default 120 seconds).
  // this is to work around what appear to be memory leaks in the
  // camera module
  "cameraPauseTimeoutMillis": 120000,

  // keep loaded terminologies in local storage this long (default 30 days)
  "terminologyCacheSeconds": (60 * 60 * 24 * 30),

  // don't try to save terminologies more than this many characters
  // in local storage (default 500k characters of serialized JSON)
  "terminologyCacheItemCeiling": (1024 * 500) 
};
