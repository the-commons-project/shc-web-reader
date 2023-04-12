
// +-----------+
// | fhirCodes |
// +-----------+

export const fhirCodes = {

  "systems": {
	
	"class": "http://terminology.hl7.org/CodeSystem/coverage-class",
	"copay": "http://terminology.hl7.org/CodeSystem/coverage-copay-type",
	"copayExt": "http://hl7.org/fhir/us/insurance-card/CodeSystem/C4DICExtendedCopayTypeCS",
	"contact": "http://terminology.hl7.org/CodeSystem/contactentity-type", 
	"contactExt": "http://hl7.org/fhir/us/insurance-card/CodeSystem/C4DICExtendedContactTypeCS",
	"demo": "http://example.com/demoTerms"
  },
  
  "http://terminology.hl7.org/CodeSystem/coverage-class": {
	
	"group": "An employee group",
	"subgroup": "A sub-group of an employee group",
	"plan": "A specific suite of benefits",
	"subplan": "A subset of a specific suite of benefits",
	"class": "A class of benefits",
	"subclass": "A subset of a class of benefits",
	"sequence": "A sequence number associated with a short-term continuance of the coverage",
	"rxbin": "Pharmacy benefit manager's Business Identification Number",
	"rxpcn": "A Pharmacy Benefit Manager specified Processor Control Number",
	"rxid": "A Pharmacy Benefit Manager specified Member ID",
	"rxgroup": "A Pharmacy Benefit Manager specified Group number"
  },

  "http://terminology.hl7.org/CodeSystem/coverage-copay-type": {
	
    "gpvisit": "GP Office Visit Copay",
    "spvisit": "Specialist Office Visit Copay",
    "emergency": "Emergency Copay",
    "inpthosp": "Inpatient Hospital Copay",
    "televisit": "Tele-visit Copay",
    "urgentcare": "Urgent Care Copay",
    "copaypct": "Copay Percentage",
    "copay": "Copay Amount",
    "deductible": "Deductible",
    "maxoutofpocket": "Maximum out of pocket"
  },

  "http://hl7.org/fhir/us/insurance-card/CodeSystem/C4DICExtendedCopayTypeCS": {
	
    "FamOutDed": "Family Out of Network Deductible",
    "FamInDed": "Family In Network Deductible",
    "FamRxOutDed": "Family Pharmacy Out of Network Deductible",
    "FamRxInDed": "Family Pharmacy In Network Deductible",
    "FamOutMax": "Family Out of Network Out of Pocket Maximum",
    "FamInMax": "Family In Network Out of Pocket Maximum",
    "FamRxOutMax": "Family Pharmacy Out of Network Out of Pocket Maximum",
    "FamRxInMax": "Family Pharmacy In Network Out of Pocket Maximum",
    "IndOutDed": "Invidual Out of Network Deductible",
    "IndInDed": "Individual In Network Deductible",
    "IndRxOutDed": "Individual Pharmacy Out of Network Deductible",
    "IndRxInDed": "Individual Pharmacy In Network Deductible",
    "IndOutMax": "Individual Out of Network Out of Pocket Maximum",
    "IndInMax": "Individual In Network Out of Pocket Maximum",
    "IndRxOutMax": "Individual Pharmacy Out of Network Out of Pocket Maximum",
    "IndRxInMax": "Individual Pharmacy In Network Out of Pocket Maximum",
    "rx": "Prescription"
  },

  "http://terminology.hl7.org/CodeSystem/contactentity-type": {
	"BILL": "Billing Contact",
	"ADMIN": "Administrative",
	"HR": "Human Resource",
	"PAYOR": "Payor",
	"PATINF": "Patient",
	"PRESS": "Press"
  },

  "http://hl7.org/fhir/us/insurance-card/CodeSystem/C4DICExtendedContactTypeCS": {

	"pharma": "Pharmacists",
	"rxmailorder": "Mail Order Pharmacy",
	"provider": "Provider Service",
	"virtual": "Virtual Care Services"
  },

  "http://example.com/demoTerms": {
	"coinsIn": "In-Network CoInsurance",
	"coinsOut": "Out-of-Network CoInsurance",
  }
};

// +---------+
// | fhirKey |
// +---------+

// this is just to provide a measure of safety when referencing
// codes with a string value ... feels pretty overengineered actually.

const _fhirKeys = {};

export function fhirKey(system, key) {

  const sys = (fhirCodes.systems[system] ? fhirCodes.systems[system] : system);
  
  if (!_fhirKeys[sys]) {
	
	if (!fhirCodes[sys]) throw new Error(`System ${system} not found`);

	_fhirKeys[sys] = new Set();
	const keys = Object.keys(fhirCodes[sys]);
	for (const i in keys) {
	  _fhirKeys[sys].add(keys[i]);
	}
  }

  return(_fhirKeys[sys].has(key) ? key : undefined);
}
