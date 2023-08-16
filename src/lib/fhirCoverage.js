
import * as futil from "./fhirUtil.js";

const CLASS_SYSTEM = "http://terminology.hl7.org/CodeSystem/coverage-class";
const COPAY_SYSTEM = "http://terminology.hl7.org/CodeSystem/coverage-copay-type";
const COPAYEXT_SYSTEM = "http://hl7.org/fhir/us/insurance-card/CodeSystem/C4DICExtendedCopayTypeCS";

// +----------------+
// | Coverage Dates |
// +----------------+

export function isActive(cov) {
  
  // if status != active, no go
  if (cov.status !== 'active') return(false);
  
  // if no period specified, assume good
  const period = cov.period;
  if (!period) return(true); 

  // check if in period
  const now = new Date();
  if (period.start && new Date(period.start) > now) return(false);
  if (period.end && new Date(period.end) < now) return(false);

  // must be in period I guess
  return(true);
}

export function startDate(cov) {
  return(cov.period ? cov.period.start : undefined);
}

export function endDate(cov) {
  return(cov.period ? cov.period.end : undefined);
}

// +-------------------------+
// | Coverage Class Elements |
// +-------------------------+

export function coverageClassValue(cov, code) {
  // eslint-disable-next-line no-unused-vars
  const [val, name] = coverageClass(cov, code);
  return(val);
}

export function coverageClassName(cov, code) {
  const [val, name] = coverageClass(cov, code);
  return(name ? name : val);
}

export function coverageClass(cov, code) {
  const item = futil.findCodedItem(cov.class, CLASS_SYSTEM, code);
  return(item ? [ item.value, item.name ] : [ undefined, undefined ]);
}

// +------------------------------+
// | Cost to Beneficiary Elements |
// +------------------------------+

export function costToBeneficiaryValue(cov, code) {
  let item = futil.findCodedItem(cov.costToBeneficiary, COPAY_SYSTEM, code);
  if (!item) item = futil.findCodedItem(cov.costToBeneficiary, COPAYEXT_SYSTEM, code);
  return(item ? futil.renderMoney(item.valueMoney) : undefined);
}

// +-----------------+
// | renderLogoImage |
// +-----------------+

const LOGO_EXTENSION =
	  "http://hl7.org/fhir/us/insurance-card/StructureDefinition/C4DIC-Logo-extension";

export function renderLogoImage(cov, className) {
  
  const logoExt = futil.searchArray(cov.extension, (o) => {
	return(o.url && o.url === LOGO_EXTENSION);
  });

  return(logoExt ? futil.renderImage(logoExt, className) : undefined);
}

// +------------------------+
// | renderPayorDisplayName |
// +------------------------+

export function renderPayorDisplayName(cov, resources) {

  const renderMap = {
	"Organization": futil.renderOrganization,
	"any": futil.renderPerson
  };

  return(futil.renderReferenceMap(cov.payor[0], resources, renderMap));
}



