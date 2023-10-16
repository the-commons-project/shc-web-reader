
// Our primary need is to render human-useful text for various codes. This
// module tries to normalize all of the vagaries of this data into something
// simple that translates system + code into a display name.
//
// Most of these are FHIR CodeSystem resources. Others are just
// scraped or hacked together from who knows where. Such a hassle.

import config from './config.js';

// +--------------------+
// | Systems Dictionary |
// +--------------------+

// Edit this to add new systems. "url" should resolve to the source data;
// "type" defaults to "fhir" which means a CodeSystem resource.
// See "loadSystem" for alternative type options.

const systems = {

  // coverage-class
  "http://terminology.hl7.org/CodeSystem/coverage-class": {
	"url": "https://build.fhir.org/ig/HL7/UTG/CodeSystem-coverage-class.json"
  },

  // copay 
  "http://terminology.hl7.org/CodeSystem/coverage-copay-type": {
	"url": "https://build.fhir.org/ig/HL7/UTG/CodeSystem-coverage-copay-type.json"
  },

  // copayExt
  "http://hl7.org/fhir/us/insurance-card/CodeSystem/C4DICExtendedCopayTypeCS": {
	"url": "https://build.fhir.org/ig/HL7/carin-digital-insurance-card/CodeSystem-C4DICExtendedCopayTypeCS.json"
  },

  // contact
  "http://terminology.hl7.org/CodeSystem/contactentity-type": {
	"url": "https://build.fhir.org/ig/HL7/UTG/CodeSystem-contactentity-type.json"
  },

  // contactExt
  "http://hl7.org/fhir/us/insurance-card/CodeSystem/C4DICExtendedContactTypeCS": {
	"url": "https://build.fhir.org/ig/HL7/carin-digital-insurance-card/CodeSystem-C4DICExtendedContactTypeCS.json"
  },

  // WHO ATC (Snapshot)
  "http://www.whocc.no/atc": {
	"type": "dictionary",
	"url": "codes-who-atc.json",
	"placeHolder": "..."
  },

  // SNOMED SCT (Global Patient Set)
  "http://snomed.info/sct": {
	"type": "dictionary",
	"url": "codes-snomed-sct.json",
	"plaecHolder": "..."
  },

  // LOINC
  "http://loinc.org": {
	"type": "dictionary",
	"url": "codes-loinc.json",
	"plaecHolder": "..."
  },

  // CPT (Docket Snapshot)
  "http://www.ama-assn.org/go/cpt": {
	"type": "docket-cpt",
	"url": "https://raw.githubusercontent.com/hellodocket/vaccine-code-mappings/main/vaccine-code-mapping.json",
	"placeHolder": "..."
  },
  
  // CVX (Docket Snapshot)
  "http://hl7.org/fhir/sid/cvx": {
	"type": "docket-cvx",
	"url": "https://raw.githubusercontent.com/hellodocket/vaccine-code-mappings/main/vaccine-code-mapping.json",
	"placeHolder": "..."
  },

  // ObservationInterpretation
  "http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation": {
	"url": "https://build.fhir.org/ig/HL7/UTG/CodeSystem-v3-ObservationInterpretation.json"
  },

  // Substance Admin Substitution
  "http://terminology.hl7.org/CodeSystem/v3-substanceAdminSubstitution": {
	"url": "https://build.fhir.org/ig/HL7/UTG/CodeSystem-v3-substanceAdminSubstitution.json"
  },

  // Consent Policy and Scope Definitions
  "http://terminology.hl7.org/CodeSystem/consentpolicycodes": {
	"url": "https://build.fhir.org/ig/HL7/UTG/CodeSystem-consentpolicycodes.json"
  },

  "http://terminology.hl7.org/CodeSystem/consentscope": {
	"url": "https://build.fhir.org/ig/HL7/UTG/CodeSystem-consentscope.json"
  },

  // Consent Category value set dependencies
  "http://terminology.hl7.org/CodeSystem/consentcategorycodes": {
	"url": "https://build.fhir.org/ig/HL7/UTG/CodeSystem-consentcategorycodes.json"
  },

  
}

// +--------------------------+
// | getDeferringCodeRenderer |
// +--------------------------+

// This object makes it easier to use codes in React components that
// are expected to run sync. safeDisplay will always return a "reasonable"
// value synchronously. In UseEffect(), a true value from awaitDeferred
// means you should re-render because new (relevant) systems have been
// loaded.

export function getDeferringCodeRenderer() {

  const obj = { deferred: {}, promises: [] };

  obj.safeCodeDisplay = function(system, code) {
	
	const [disp, defer] = safeDisplaySync(system, code);
	
	if (defer && !this.deferred[system]) {
	  console.log(`deferring load for system ${system}`);
	  this.deferred[system] = true;
	  this.promises.push(getSystem(system));
	}

	return(disp);
  };

  obj.safeCodingDisplay = function(c) {
	return(c.display || this.safeCodeDisplay(c.system, c.code));
  }

  obj.awaitDeferred = async function() {
	let anyLoaded = false;
	for (const i in this.promises) {
	  if (await this.promises[i]) anyLoaded = true;
	}
	return(anyLoaded);
  }

  return(obj);
}

// +-----------------+
// | safeDisplay     |
// | safeDisplaySync |
// +-----------------+

export async function safeDisplay(system, code) {
  let [disp, defer] = safeDisplaySync(system, code);
  if (defer && await getSystem(system)) [disp, defer] = safeDisplaySync(system, code);
  return(disp);
}

function safeDisplaySync(system, code) {

  if (systemLoaded(system) || getSystemLocal(system)) {
	return([ _loadedSystems[system][code] || code, false ]);
  }

  const loadable = systemLoadable(system);
  const placeHolder = (loadable ? (systems[system].placeHolder || code) : code);
  return([ placeHolder, loadable ]);
}

// +----------------+
// | systemLoadable |
// | systemLoaded   |
// | getSystemLocal |
// | getSystem      |
// +----------------+

const _loadedSystems = {};
const _failedSystems = {};

function systemLoadable(system) {
  return(systemLoaded(system) || (systems[system] && !_failedSystems[system]));
}

function systemLoaded(system) {
  return(_loadedSystems[system]);
}

function getSystemLocal(system) {

  const local = getFromLocal(system);
  if (!local) return(undefined);

  _loadedSystems[system] = local;
  return(local);
}

export async function getSystem(system) {

  if (systemLoaded(system)) return(_loadedSystems[system]);
  if (!systemLoadable(system)) return(undefined);

  try {
	let loaded = getFromLocal(system);
	if (!loaded) {
	  loaded = await loadSystem(system);
	  saveToLocal(system, loaded);
	}
	
	_loadedSystems[system] = loaded;
	return(_loadedSystems[system]);
  }
  catch (err) {
	console.error(err.toString());
	_failedSystems[system] = true;
	return(undefined);
  }
}

async function loadSystem(system) {

  const url = systems[system].url;
  const type = systems[system].type || "fhir";
  
  const response = await fetch(url);
  if (response.status < 200 || response.status >= 300) {
	throw new Error(`loading ${system} from ${url} (${response.status})`);
  }

  switch (type) {
	case "fhir":
	  return(parseFhirSystem(system, await response.json()));

	case "dictionary":
	  return(await response.json());

	case "docket-cvx":
	  return(parseDocketVaccineMappings(await response.json(), "cvx"));

	case "docket-cpt":
	  return(parseDocketVaccineMappings(await response.json(), "cpt"));

	default:
	  throw new Error(`Unknown system type ${type} for ${system}`);
  }
}

// +-----------------+
// | parseFhirSystem |
// +-----------------+

function parseFhirSystem(system, resource) {

  switch (resource.resourceType) {
	  
	case "CodeSystem":
	  return(parseFhirCodeSystem(resource));

	default:
	  throw new Error(`Can't parse ${resource.resourceType} for ${system}`);
  }
}

// +---------------------+
// | parseFhirCodeSystem |
// +---------------------+

function parseFhirCodeSystem(resource) {

  const system = {};

  for (const i in resource.concept) {
	addCodeSystemConcept(system, resource.concept[i]);
  }

  return(system);
}

function addCodeSystemConcept(system, c) {

  system[c.code] = c.display || c.code;

  if (c.concept) {
	for (const i in c.concept) {
	  addCodeSystemConcept(system, c.concept[i]);
	}
  }
}

// +----------------------------+
// | parseDocketVaccineMappings |
// +----------------------------+

function parseDocketVaccineMappings(json, tag) {

  const values = json[tag];
  const parsed = {};

  Object.keys(values).forEach((key,index) => {
	parsed[key.toString()] = values[key].name;
  });

  return(parsed);
}

// +--------------+
// | getFromLocal |
// | saveToLocal  |
// +--------------+

const CACHE_PREFIX = "sys__";

function getFromLocal(system) {

  const key = getCacheKey(system);
  const cached = localStorage.getItem(key);
  if (!cached) return(undefined);

  try {
	let expireDate = getCacheDate(cached);
	expireDate.setSeconds(expireDate.getSeconds() + config("terminologyCacheSeconds"));
	if (new Date() > expireDate) throw new Error("expired");
	return(JSON.parse(cached.substring(cached.indexOf("|") + 1)));
  }
  catch (err) {
	console.log(`pruning ${system} from cache (${err})`);
	localStorage.removeItem(key);
	return(undefined);
  }
}

function saveToLocal(system, dict) {

  const key = getCacheKey(system);
  const cached = `${new Date()}|${JSON.stringify(dict)}`;

  if (cached.length > config("terminologyCacheItemCeiling")) {
	console.log(`system ${system} too big to cache (${cached.length})`);
	return;
  }

  if (trySaveLocal(key, cached)) {
	console.log(`successfully cached ${system} on first try`);
	return;
  }

  // try to prune things out and save in the background
  
  setTimeout(() => {
	
	// start pruning from the cache FIFO
	// (sort comes from getCacheState)
	
	let cchNeeded = cached.length;
	const cacheState = getCacheState();

	let i = 0;
	while (cchNeeded > 0 && i < cacheState.length) {
	  localStorage.removeItem(cacheState[i].key);
	  cchNeeded -= cacheState[i].cch;
	  ++i;
	}

	if (cchNeeded > 0) {
	  // so sad too bad
	  console.log(`can't cache ${system} (${cached.length} cch)`);
	  return;
	}

	if (!trySaveLocal(key, cached)) {
	  console.log(`failed caching ${system} on second try`);
	}
  }, 0);
  
}

function trySaveLocal(key, cached) {
  try {
	localStorage.setItem(key, cached);
	return(true);
  }
  catch (err) {
	console.log(err.toString());
	return(false);
  }
}

function getCacheKey(system) {
  return(CACHE_PREFIX + system);
}

function getCacheDate(cached) {
  const ichPipe = cached.indexOf("|");
  if (ichPipe === -1) throw new Error("invalid cache item");
  const cacheDate = new Date();
  cacheDate.setTime(Date.parse(cached.substring(0, ichPipe)));
  return(cacheDate);
}

function getCacheState() {

  const state = [];

  for (let i = 0; i < localStorage.length; ++i) {
	
	const key = localStorage.key(i);
	if (!key.startsWith(CACHE_PREFIX)) continue;

	const cached = localStorage.getItem(key);
	
	state.push({
	  key: key,
	  cached: getCacheDate(cached),
	  cch: cached.length
	});
  }

  state.sort((a,b) => (a.cached - b.cached));
  
  return(state);
}



