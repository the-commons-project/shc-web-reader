
export const DEFAULT_CONFIG = {

  // tab to show when app starts; see App.js:TabValue enum
  "initialTab": "about",

  // true to show the "Scan", "Photo" and "Search" tabs; false to hide
  "showScan": true,
  "showPhoto": true,
  "showSearch": true,
  "showFile": true,

  // these are good defaults for dev and test but should always be
  // updated for a production instance!
  "trustedDirectories": [
	'https://raw.githubusercontent.com/the-commons-project/vci-directory/main/logs/vci_snapshot.json',
	'https://raw.githubusercontent.com/seanno/shc-demo-data/main/keystore/directory.json'
  ],

  // default camera mode ('environment' or 'user') or ID
  "cameraIdMode": 'environment',

  // stop camera scanning after this many millis (default 120 seconds).
  // this is to work around what appear to be memory leaks in the
  // camera module
  "cameraPauseTimeoutMillis": 120000,

  // keep loaded terminologies in local storage this long (default 30 days)
  "terminologyCacheSeconds": (60 * 60 * 24 * 30),

  // don't try to save terminologies more than this many characters
  // in local storage (default 500k characters of serialized JSON)
  "terminologyCacheItemCeiling": (1024 * 500),

  // allow display of SHCs that have validation errors as long as
  // they are not "fatal" ... e.g., fullUrl values not in resource:# format
  "permissive": false,
  
  // true = show TCP privacy, disclaimer, etc.
  "tcpFooter": true
};

export const DOMAIN_OVERRIDES = {

  // TCP production
  "commonhealth.org": {
	
	"showScan": false,
	"showSearch": false,
	
	"trustedDirectories": [
	  'https://raw.githubusercontent.com/the-commons-project/vci-directory/main/logs/vci_snapshot.json'
	],

	tcpFooter: true
  },

  // TCP development
  "tcpdev.org": {

	tcpFooter: true
  }
  
};

