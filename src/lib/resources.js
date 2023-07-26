
//
// Functions to organize and figure out what's in a SHC or SHL bundle. I am not a huge
// fan of this "dig around and figure it out" approach but that's a fight I
// lost, oh well. ;)
//
// "Bundle Type" is either a "meta-type" as specified in the constants below,
// or just a FHIR resource type when we don't know any better. We try to provide
// friendly names for types (to show in the picker), but will default to resource
// names when we haven't configued something better.
//
// organizeResources returns an object that identifies the type and sets up the 
// FHIR resource objects in various useful ways. It looks like this:
//
// {
//   "all": [ array of all resources ],
//   "byId": { dictionary of resources keyed on fullUrl AND resourceType/id },
//   "byType": { dictionary of [ arrays of resources ] keyed by resourceType },
//
//   "btype": (bundle type),
//   "label": (display label for bundle)
// }
//

import { hasCode } from './fhirUtil.js';

// +------------------+
// | Public Constants |
// +------------------+

export const BTYPE_COVERAGE = "cov";
export const BTYPE_PS = "ps";
export const BTYPE_BUNDLE = "Bundle";
export const BTYPE_IMMUNIZATION = "imm";
export const BTYPE_EMPTY = "empty"; // degenerate
// ... or a resource type

// +----------+
// | Organize |
// +----------+

// "bundle" is as returned from SHX.js

export function organizeResources(bundle, labelCounters) {

  const organized = {

	all: [],
	byId: {},
	byType: {},

	countOfType: function(t) {
	  return(this.byType[t] ? this.byType[t].length : 0);
	}
  };

  if (bundle.contentOK() && bundle.fhir.entry) {
	for (const i in bundle.fhir.entry) {
	  
	  const e = bundle.fhir.entry[i];
	  const r = e.resource;

	  organized.all.push(r);
	  
	  organized.byId[e.fullUrl] = r;
	  organized.byId[r.resourceType + "/" + r.id] = r;
	  
	  if (!organized.byType[r.resourceType]) organized.byType[r.resourceType] = [];
	  organized.byType[r.resourceType].push(r);
	}
  }

  organized.btype = figureOutType(organized);
  organized.label = addLabelCounter(labelFromType(organized.btype), labelCounters);
	
  return(organized);
}

// +-------+
// | Label |
// +-------+

function labelFromType(btype) {
  switch (btype) {
    case BTYPE_COVERAGE: return("Insurance Coverage"); 
    case BTYPE_PS: return("Patient Summary");
    case BTYPE_EMPTY: return("Invalid Content");
    case BTYPE_BUNDLE: return("Health Information");
    case BTYPE_IMMUNIZATION: return("Immunization History");
    default: return(btype);
  }
}

function addLabelCounter(label, labelCounters) {

  if (!labelCounters[label]) {
	labelCounters[label] = 1;
	return(label);
  }

  labelCounters[label] += 1;

  return(`${label} (${labelCounters[label]})`);
}

// +------+
// | Type |
// +------+

function figureOutType(organized) {

  if (organized.all.length === 0) return(BTYPE_EMPTY);
  if (isPatientSummary(organized)) return(BTYPE_PS);
  if (isCoverage(organized)) return(BTYPE_COVERAGE);
  if (isImmunizationHistory(organized)) return(BTYPE_IMMUNIZATION);

  if(organized.all.length === 1) return(organized.all[0].resourceType);
  return(BTYPE_BUNDLE);
}

function isPatientSummary(organized) {
  return(organized.countOfType("Composition") > 0 &&
		 hasCode(organized.byType.Composition[0].type, "http://loinc.org", "60591-5"));
}

function isCoverage(organized) {
  return(organized.countOfType("Coverage") > 0);
}

function isImmunizationHistory(organized) {
  // Immunization histories are a combination of a patient and some number of immunizations for that patient.
  return (
    Object.keys(organized.byType).length === 2 &&
    organized.countOfType("Immunization") > 0 &&
    organized.countOfType("Patient") === 1
  );
}
