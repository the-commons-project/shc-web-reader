//
// Loads up code/display dictionaries for a FHIR ValueSet resource
// (https://hl7.org/fhir/R4/valueset.html) ... included systems must
// be pre-defined in codes.js or else we won't know where to go to get them.
// 
// However, if a ValueSet contains specific compose.include.concept entries
// for systems that are not in codes.js, we'll add them individually to
// codes.js at runtime. This leaves us with partial terminology sets, but
// that's fine because we only care the entries relevant to the VS anyways.
//
// We only read values from the compose element; ignoring expansion. Relying
// on expansion has issues with large sets, requires a terminology server or
// snapshots, etc. etc. --- more resilient for us to just figure it out
// ourselves. Downside is that we may not implement all possible constructs
// (see NYI below) but at least we control our own destiny by throwing in
// those cases.
//
// NYI: compose.include.filter, compose.exclude
//
// Returned object is:
//
//   {
//     systems: { dictionary of code/display pairs keyed on system name },
//     getDisplay: function(system,code) that searches for display value
//   }
//

import { getSystem } from './codes.js';
import * as futil from "./fhirUtil.js";

// +------------+
// | Value Sets |
// +------------+

const valueSets = {

  // SMART Health Cards consolidated COVID vaccination codes
  "https://terminology.smarthealth.cards/ValueSet/immunization-covid-all":
  "https://terminology.smarthealth.cards/ValueSet-immunization-covid-all.json",

  // Consent category & dependents
  "http://hl7.org/fhir/ValueSet/consent-category":
  "https://hl7.org/fhir/R4/valueset-consent-category.json"
}

// +-------------+
// | getValueSet |
// +-------------+

export default async function getValueSet(url) {

  const result = { systems: {} };

  result.getDisplay = function(system, code) {
	if (!systems[system]) return(undefined);
	return(systems[system][code]);
  }
  
  return(await getValueSetInternal(valueSets[url] || url, result.systems));
}

async function getValueSetInternal(url, systems) {

  const vs = await futil.fetchJson(url);

  if (!vs.compose) throw new Error('VS compose required');
  if (vs.compose.exclude) throw new Error('VS compose.exclude NYI');

  for (const i in vs.include) {

	const inc = vs.include[i];
	if (inc.filter) throw new Error('VS compose.include.filter NYI');
	
	// nested ValueSets
	if (inc.valueSet) {
	  for (const i in inc.valueSet) {
		await getValueSetInternal(inc.valueSet[i], systems);
	  }
	}

	// system
	if (inc.system) {

	  // maybe undefined, that's (probably) ok
	  const sys = await getSystem(inc.system);

	  if (inc.concept) {
		// selected concepts
		if (!systems[inc.system]) systems[inc.system] = {};
		
		for (const c in inc.concept) {
		  const disp = (c.display || (sys && sys[c.code] ? sys[c.code] : c.code));
		  systems[inc.system][c.code] = disp;
		}
	  }
	  else {
		// whole system
		if (!sys) throw new Error(`Missing sys ${inc.system} for vs ${url}`);
		systems[inc.system] = sys;
	  }
	}
  }

  return(result);
}


