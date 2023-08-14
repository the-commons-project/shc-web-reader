
// Our primary need is to render human-useful text for various codes. This
// module tries to normalize all of the vagaries of this data into something
// simple that translates system + code into a display name.
//
// Most of these are FHIR ValueSet (NYI) or CodeSystem resources. Others are just
// scraped or hacked together from who knows where. Such a hassle.

// +--------------------+
// | Systems Dictionary |
// +--------------------+

// Edit this to add new systems. "url" should resolve to the source data;
// "type" defaults to "fhir" which means a ValueSet or CodeSystem resource.
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
	"url": "codes-who-atc.json"
  },

  // SNOMED SCT (Snapshot / Subset)
  "http://snomed.info/sct": {
	"type": "dictionary",
	"url": "codes-snomed-sct.json"
  },

  // CPT (Docket Snapshot)
  "http://www.ama-assn.org/go/cpt": {
	"type": "docket-cpt",
	"url": "https://raw.githubusercontent.com/hellodocket/vaccine-code-mappings/main/vaccine-code-mapping.json"
  },
  
  // CVX (Docket Snapshot)
  "http://hl7.org/fhir/sid/cvx": {
	"type": "docket-cvx",
	"url": "https://raw.githubusercontent.com/hellodocket/vaccine-code-mappings/main/vaccine-code-mapping.json"
  }
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
  if (systemLoaded(system)) return([ _loadedSystems[system][code] || code, false ]);
  return([ code, systemLoadable(system) ]);
}

// +----------------+
// | systemLoadable |
// | systemLoaded   |
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

export async function getSystem(system) {

  if (systemLoaded(system)) return(_loadedSystems[system]);
  if (!systemLoadable(system)) return(undefined);

  try {
	_loadedSystems[system] = await loadSystem(system);
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

	case "ValueSet":
	  return(parseFhirValueSet(resource));
	  
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

// +--------------------+
// | parseFhirValueSet  |
// +--------------------+

function parseFhirValueSet(resource) {
  throw new Error(`NYI`);
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

