
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

import * as futil from "./fhirUtil.js";

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
	},

	countOfTypes: function() {
	  return(Object.keys(this.byType).length);
	}
  };

  if (bundle.contentOK() && bundle.fhir.entry) {
	for (const i in bundle.fhir.entry) {

	  const e = bundle.fhir.entry[i];

	  if (!e.resource) {
		console.error("Malformed bundle entry: " + JSON.stringify(e, null, 2));
		continue;
	  }
	  
	  const r = e.resource;
	  organized.all.push(r);
	  
	  organized.byId[e.fullUrl] = r;
	  organized.byId[r.resourceType + "/" + r.id] = r;
	  
	  if (!organized.byType[r.resourceType]) organized.byType[r.resourceType] = [];
	  organized.byType[r.resourceType].push(r);
	}
  }

  organized.typeInfo = findTypeInfo(organized, labelCounters);
	
  return(organized);
}

// +-------+
// | Types |
// +-------+

function findTypeInfo(organized, labelCounters) {

  let info = undefined;
  if (!info) info = tryTypeInfoEmpty(organized);
  if (!info) info = tryTypeInfoPatientSummary(organized);
  if (!info) info = tryTypeInfoCoverage(organized);
  if (!info) info = tryTypeInfoImmunization(organized);
  if (!info) info = tryTypeInfoSingleResource(organized);
  if (!info) info = tryTypeInfoBundle(organized);

  if (info) info.label = addLabelCounter(info.label, labelCounters);

  return(info);
}

// +-------------+
// | BTYPE_EMPTY |
// +-------------+

function tryTypeInfoEmpty(organized) {

  if (organized.all.length > 0) return(undefined);
  
  return({
	btype: BTYPE_EMPTY,
	label: "Invalid Content",
	subjects: []
  });
}
						
// +----------+
// | BTYPE_PS |
// +----------+

const PS_SYS = "http://loinc.org";
const PS_CODE = "60591-5";

function tryTypeInfoPatientSummary(organized) {

  if (organized.countOfType("Composition") === 0 ||
	  !futil.hasCode(organized.byType.Composition[0].type, PS_SYS, PS_CODE)) {

	return(undefined);
  }

  const patientReference = organized.byType.Composition[0].subject.reference;
  const patient = organized.byId[patientReference];

  return({
	btype: BTYPE_PS,
	label: "Patient Summary",
	subjects: [ patient ]
  });
}

// +----------------+
// | BTYPE_COVERAGE |
// +----------------+

// Trying to deal with the fact that often a family member will provide
// a card for one of the other family members and that's considered ok.
//
// The format requires exactly one Patient record for "beneficiary" and
// one for "subscriber", so we'll add both of those unless they're the
// same.
//
// There is also an optional collection of "beneficiaries" but that
// is names only, and I'm not sure that helps us very much so ignoring
// it for now.

function tryTypeInfoCoverage(organized) {

  if (organized.countOfType("Coverage") === 0) return(undefined);

  const benReference = organized.byType.Coverage[0].beneficiary;
  const subReference = organized.byType.Coverage[0].subscriber;
  
  const beneficiary = organized.byId[benReference];
  const subscriber = organized.byId[subReference];

  const subjects = [ beneficiary ];
  if (!futil.seemsLikeSamePatient(subscriber, beneficiary)) {
	subjects.push(subscriber);
  }

  return({
	btype: BTYPE_COVERAGE,
	label: "Insurance Coverage",
	subjects: subjects
  });
}

// +--------------------+
// | BTYPE_IMMUNIZATION |
// +--------------------+

function tryTypeInfoImmunization(organized) {

  // Immunization histories are a combination of a patient and
  // some number of immunizations for that patient.

  if (organized.countOfTypes() !== 2 ||
	  organized.countOfType("Immunization") === 0 ||
	  organized.countOfType("Patient") !== 1) {

	return(undefined);
  }

  return({
	btype: BTYPE_IMMUNIZATION,
	label: "Immunization History",
	subjects: organized.byType.Patient
  });
}

// +-----------------+
// | Single Resource |
// +-----------------+

function tryTypeInfoSingleResource(organized) {

  if (organized.all.length !== 1) return(undefined);

  return({
	btype: organized.all[0].resourceType,
	label: organized.all[0].resourceType,
	subjects: organized.byType.Patient
  });
}

// +--------------+
// | BTYPE_BUNDLE |
// +--------------+

function tryTypeInfoBundle(organized) {

  if (organized.all.length === 0) return(undefined);

  return({
	btype: BTYPE_BUNDLE,
	label: "Bundle",
	subjects: organized.byType.Patient
  });
}

// +---------+
// | Helpers |
// +---------+

function addLabelCounter(label, labelCounters) {

  if (!labelCounters[label]) {
	labelCounters[label] = 1;
	return(label);
  }

  labelCounters[label] += 1;

  return(`${label} (${labelCounters[label]})`);
}


