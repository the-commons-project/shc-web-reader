
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
  },

  "http://www.whocc.no/atc": {
    "J07": "VACCINES",
    "J07A": "BACTERIAL VACCINES",
    "J07AC": "Anthrax vaccines",
    "J07AC01": "anthrax antigen",
    "J07AD": "Brucellosis vaccines",
    "J07AD01": "brucella antigen",
    "J07AE": "Cholera vaccines",
    "J07AE01": "cholera, inactivated, whole cell",
    "J07AE02": "cholera, live attenuated",
    "J07AE51": "cholera, combinations with typhoid vaccine, inactivated, whole cell",
    "J07AF": "Diphtheria vaccines",
    "J07AF01": "diphtheria toxoid",
    "J07AG": "Haemophilus influenzae B vaccines",
    "J07AG01": "haemophilus influenzae B, purified antigen conjugated",
    "J07AG51": "haemophilus influenzae B, combinations with toxoids",
    "J07AG52": "haemophilus influenzae B, combinations with pertussis and toxoids",
    "J07AG53": "haemophilus influenzae B, combinations with meningococcus C, conjugated",
    "J07AH": "Meningococcal vaccines",
    "J07AH01": "meningococcus A, purified polysaccharides antigen",
    "J07AH02": "other meningococcal monovalent purified polysaccharides antigen",
    "J07AH03": "meningococcus A,C, bivalent purified polysaccharides antigen",
    "J07AH04": "meningococcus A,C,Y,W-135, tetravalent purified polysaccharides antigen",
    "J07AH05": "other meningococcal polyvalent purified polysaccharides antigen",
    "J07AH06": "meningococcus B, outer membrane vesicle vaccine",
    "J07AH07": "meningococcus C, purified polysaccharides antigen conjugated",
    "J07AH08": "meningococcus A,C,Y,W-135, tetravalent purified polysaccharides antigen conjugated",
    "J07AH09": "meningococcus B, multicomponent vaccine",
    "J07AH10": "meningococcus A, purified polysaccharides antigen conjugated",
    "J07AJ": "Pertussis vaccines",
    "J07AJ01": "pertussis, inactivated, whole cell",
    "J07AJ02": "pertussis, purified antigen",
    "J07AJ51": "pertussis, inactivated, whole cell, combinations with toxoids",
    "J07AJ52": "pertussis, purified antigen, combinations with toxoids",
    "J07AK": "Plague vaccines",
    "J07AK01": "plague, inactivated, whole cell",
    "J07AL": "Pneumococcal vaccines",
    "J07AL01": "pneumococcus, purified polysaccharides antigen",
    "J07AL02": "pneumococcus, purified polysaccharides antigen conjugated",
    "J07AL52": "pneumococcus purified polysaccharides antigen and haemophilus influenzae, conjugated",
    "J07AM": "Tetanus vaccines",
    "J07AM01": "tetanus toxoid",
    "J07AM51": "tetanus toxoid, combinations with diphtheria toxoid",
    "J07AM52": "tetanus toxoid, combinations with tetanus immunoglobulin",
    "J07AN": "Tuberculosis vaccines",
    "J07AN01": "tuberculosis, live attenuated",
    "J07AP": "Typhoid vaccines",
    "J07AP01": "typhoid, oral, live attenuated",
    "J07AP02": "typhoid, inactivated, whole cell",
    "J07AP03": "typhoid, purified polysaccharide antigen",
    "J07AP10": "typhoid, combinations with paratyphi types",
    "J07AR": "Typhus (exanthematicus) vaccines",
    "J07AR01": "typhus exanthematicus, inactivated, whole cell",
    "J07AX": "Other bacterial vaccines",
    "J07B": "VIRAL VACCINES",
    "J07BA": "Encephalitis vaccines",
    "J07BA01": "encephalitis, tick borne, inactivated, whole virus",
    "J07BA02": "encephalitis, Japanese, inactivated, whole virus",
    "J07BA03": "encephalitis, Japanese, live attenuated",
    "J07BB": "Influenza vaccines",
    "J07BB01": "influenza, inactivated, whole virus",
    "J07BB02": "influenza, inactivated, split virus or surface antigen",
    "J07BB03": "influenza, live attenuated",
    "J07BB04": "influenza, virus like particles",
    "J07BC": "Hepatitis vaccines",
    "J07BC01": "hepatitis B, purified antigen",
    "J07BC02": "hepatitis A, inactivated, whole virus",
    "J07BC20": "combinations",
    "J07BD": "Measles vaccines",
    "J07BD01": "measles, live attenuated",
    "J07BD51": "measles, combinations with mumps, live attenuated",
    "J07BD52": "measles, combinations with mumps and rubella, live attenuated",
    "J07BD53": "measles, combinations with rubella, live attenuated",
    "J07BD54": "measles, combinations with mumps, rubella and varicella, live attenuated",
    "J07BE": "Mumps vaccines",
    "J07BE01": "mumps, live attenuated",
    "J07BF": "Poliomyelitis vaccines",
    "J07BF01": "poliomyelitis oral, monovalent, live attenuated",
    "J07BF02": "poliomyelitis oral, trivalent, live attenuated",
    "J07BF03": "poliomyelitis, trivalent, inactivated, whole virus",
    "J07BF04": "poliomyelitis oral, bivalent, live attenuated",
    "J07BG": "Rabies vaccines",
    "J07BG01": "rabies, inactivated, whole virus",
    "J07BH": "Rota virus diarrhea vaccines",
    "J07BH01": "rota virus, live attenuated",
    "J07BH02": "rota virus, pentavalent, live, reassorted",
    "J07BJ": "Rubella vaccines",
    "J07BJ01": "rubella, live attenuated",
    "J07BJ51": "rubella, combinations with mumps, live attenuated",
    "J07BK": "Varicella zoster vaccines",
    "J07BK01": "varicella, live attenuated",
    "J07BK02": "zoster, live attenuated",
    "J07BK03": "zoster, purified antigen",
    "J07BL": "Yellow fever vaccines",
    "J07BL01": "yellow fever, live attenuated",
    "J07BM": "Papillomavirus vaccines",
    "J07BM01": "papillomavirus (human types 6, 11, 16, 18)",
    "J07BM02": "papillomavirus (human types 16, 18)",
    "J07BM03": "papillomavirus (human types 6, 11, 16, 18, 31, 33, 45, 52, 58)",
    "J07BX": "Other viral vaccines",
    "J07BX01": "smallpox vaccines",
    "J07BX02": "ebola vaccines",
    "J07C": "BACTERIAL AND VIRAL VACCINES, COMBINED",
    "J07CA": "Bacterial and viral vaccines, combined",
    "J07CA01": "diphtheria-poliomyelitis-tetanus",
    "J07CA02": "diphtheria-pertussis-poliomyelitis-tetanus",
    "J07CA03": "diphtheria-rubella-tetanus",
    "J07CA04": "haemophilus influenzae B and poliomyelitis",
    "J07CA05": "diphtheria-hepatitis B-pertussis-tetanus",
    "J07CA06": "diphtheria-haemophilus influenzae B-pertussis-poliomyelitis-tetanus",
    "J07CA07": "diphtheria-hepatitis B-tetanus",
    "J07CA08": "haemophilus influenzae B and hepatitis B",
    "J07CA09": "diphtheria-haemophilus influenzae B-pertussis-poliomyelitis-tetanus-hepatitis B",
    "J07CA10": "typhoid-hepatitis A",
    "J07CA11": "diphtheria-haemophilus influenzae B-pertussis-tetanus-hepatitis B",
    "J07CA12": "diphtheria-pertussis-poliomyelitis-tetanus-hepatitis B",
    "J07CA13": "diphtheria-haemophilus influenzae B-pertussis-tetanus-hepatitis B-meningococcus A + C",
    "J07X": "OTHER VACCINES"
  },

  "http://snomed.info/sct": {
    "2221000221107": "Live attenuated Human alphaherpesvirus 3 only vaccine product",
    "2171000221104": "Salmonella enterica subspecies enterica serovar Typhi capsular polysaccharide unconjugated antigen only vaccine product in parenteral dose form",
    "1981000221108": "Neisseria meningitidis serogroup B antigen only vaccine product",
    "1801000221105": "Streptococcus pneumoniae capsular polysaccharide antigen conjugated only vaccine product",
    "1181000221105": "Influenza virus antigen only vaccine product",
    "1131000221109": "Vaccine product containing only inactivated whole Rabies lyssavirus antigen",
    "1121000221106": "Live attenuated Yellow fever virus antigen only vaccine product",
    "1101000221104": "Clostridium tetani toxoid antigen-containing vaccine product",
    "1081000221109": "Live attenuated Rotavirus antigen only vaccine product",
    "1051000221104": "Live attenuated Human poliovirus serotypes 1 and 3 antigens only vaccine product in oral dose form",
    "1031000221108": "Human poliovirus antigen-containing vaccine product",
    "1011000221100": "Live attenuated Vibrio cholerae antigen only vaccine product in oral dose form",
    "1001000221103": "Inactivated whole Vibrio cholerae antigen only vaccine product in oral dose form",
    "971000221109": "Live attenuated Salmonella enterica subspecies enterica serovar Typhi antigen only vaccine product in oral dose form",
    "601000221108": "Bordetella pertussis antigen-containing vaccine product",
    "1119254000": "Streptococcus pneumoniae Danish serotype 1, 3, 4, 5, 6A, 6B, 7F, 9V, 14, 18C, 19A, 19F, and 23F capsular polysaccharide antigens only vaccine product",
    "1052328007": "Streptococcus pneumoniae Danish serotype 4, 6B, 9V, 14, 18C, 19F, and 23F capsular polysaccharide antigens conjugated only vaccine product",
    "871921009": "Staphylococcus toxoid vaccine",
    "871918007": "Rickettsia antigen-containing vaccine product",
    "871908002": "Human alphaherpesvirus 3 and Measles morbillivirus and Mumps orthorubulavirus and Rubella virus antigens only vaccine product",
    "871895005": "Bordetella pertussis and Clostridium tetani and Corynebacterium diphtheriae and Haemophilus influenzae type b and Hepatitis B virus and Human poliovirus antigens only vaccine product",
    "871889009": "Acellular Bordetella pertussis and Corynebacterium diphtheriae and Hepatitis B virus and inactivated whole Human poliovirus antigens only vaccine product",
    "871887006": "Bordetella pertussis and Clostridium tetani and Corynebacterium diphtheriae and Haemophilus influenzae type b and Human poliovirus antigens only vaccine product",
    "871878002": "Bordetella pertussis and Clostridium tetani and Corynebacterium diphtheriae and Human poliovirus antigens only vaccine product",
    "871876003": "Acellular Bordetella pertussis and Clostridium tetani and Corynebacterium diphtheriae antigens only vaccine product",
    "871875004": "Bordetella pertussis and Clostridium tetani and Corynebacterium diphtheriae antigens only vaccine product",
    "871873006": "Neisseria meningitidis serogroup A, C, W135 and Y only vaccine product",
    "871871008": "Neisseria meningitidis serogroup A and C only vaccine product",
    "871866001": "Neisseria meningitidis serogroup C only vaccine product",
    "871839001": "Bordetella pertussis and Clostridium tetani and Corynebacterium diphtheriae and Haemophilus influenzae type b antigens only vaccine product",
    "871837004": "Clostridium tetani and Corynebacterium diphtheriae and Human poliovirus antigens only vaccine product",
    "871831003": "Measles morbillivirus and Mumps orthorubulavirus and Rubella virus antigens only vaccine product",
    "871826000": "Clostridium tetani and Corynebacterium diphtheriae antigens only vaccine product",
    "871806004": "Haemophilus influenzae type b and Hepatitis B virus antigens only vaccine product",
    "871804001": "Hepatitis A virus and Salmonella enterica subspecies enterica serovar Typhi antigens only vaccine product",
    "871803007": "Hepatitis A and Hepatitis B virus antigens only vaccine product",
    "871772009": "Influenza A virus subtype H1N1 antigen only vaccine product",
    "871768005": "Influenza virus antigen only vaccine product in nasal dose form",
    "871765008": "Measles morbillivirus antigen only vaccine product",
    "871759008": "Acellular Bordetella pertussis only vaccine product",
    "871740006": "Inactivated whole Human poliovirus antigen only vaccine product",
    "871738001": "Live attenuated Mumps orthorubulavirus antigen only vaccine product",
    "871737006": "Mumps orthorubulavirus antigen only vaccine product",
    "863911006": "Clostridium tetani antigen-containing vaccine product",
    "840599008": "Borrelia burgdorferi antigen-containing vaccine product",
    "840549009": "Yersinia pestis antigen-containing vaccine product",
    "836500008": "Haemophilus influenzae type b and Neisseria meningitidis serogroup C antigens only vaccine product",
    "836498007": "Mumps orthorubulavirus antigen-containing vaccine product",
    "836495005": "Human alphaherpesvirus 3 antigen-containing vaccine product",
    "836403007": "Tick-borne encephalitis virus antigen-containing vaccine product",
    "836402002": "Bacillus Calmette-Guerin antigen-containing vaccine product",
    "836401009": "Neisseria meningitidis antigen-containing vaccine product",
    "836398006": "Streptococcus pneumoniae antigen-containing vaccine product",
    "836397001": "Coxiella burnetii antigen-containing vaccine product",
    "836393002": "Rabies lyssavirus antigen-containing vaccine product",
    "836390004": "Salmonella enterica subspecies enterica serovar Typhi antigen-containing vaccine product",
    "836389008": "Vaccinia virus antigen-containing vaccine product",
    "836388000": "Rubella virus antigen-containing vaccine product",
    "836387005": "Rotavirus antigen-containing vaccine product",
    "836385002": "Yellow fever virus antigen-containing vaccine product",
    "836384003": "Bacillus anthracis antigen-containing vaccine product",
    "836383009": "Vibrio cholerae antigen-containing vaccine product",
    "836382004": "Measles morbillivirus antigen-containing vaccine product",
    "836381006": "Corynebacterium diphtheriae antigen-containing vaccine product",
    "836380007": "Haemophilus influenzae type b antigen-containing vaccine product",
    "836379009": "Human papillomavirus antigen-containing vaccine product",
    "836378001": "Japanese encephalitis virus antigen-containing vaccine product",
    "836377006": "Influenza virus antigen-containing vaccine product",
    "836375003": "Hepatitis A virus antigen-containing vaccine product",
    "836374004": "Hepatitis B virus antigen-containing vaccine product",
    "836369007": "Virus antigen-containing vaccine product",
    "836368004": "Bacteria antigen-containing vaccine product",
    "777725002": "Clostridium tetani toxoid antigen adsorbed only vaccine product",
    "775641005": "Clostridium tetani toxoid adsorbed and Corynebacterium diphtheriae toxoid antigens only vaccine product",
    "774618008": "Whole cell Bordetella pertussis and Clostridium tetani toxoid adsorbed and Corynebacterium diphtheriae toxoid antigens only vaccine product",
    "428601009": "Paratyphoid vaccine",
    "409568008": "Pentavalent botulinum toxoid vaccine",
    "37146000": "Typhus vaccine"
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
