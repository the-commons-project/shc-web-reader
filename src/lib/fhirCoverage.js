
import * as futil from "./fhirUtil.js";
import { fhirCodes, fhirKey } from "./fhirCodes.js";

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

  const checkedCode = fhirKey(fhirCodes.systems.class, code);

  if (checkedCode) {
	const item = futil.findCodedItem(cov.class, fhirCodes.systems.class, checkedCode);
	if (item) return [ item.value, item.name ];
  }

  return [undefined, undefined];
}

// +------------------------------+
// | Cost to Beneficiary Elements |
// +------------------------------+

export function costToBeneficiaryValue(cov, code) {

  let system = fhirCodes.systems.copay;
  let checkedCode = fhirKey(system, code);
  
  if (!checkedCode) {
	system = fhirCodes.systems.copayExt;
	checkedCode = fhirKey(system, code);
  }

  // TEMP - look in demo codeset too
  if (!checkedCode) {
	system = fhirCodes.systems.demo;
	checkedCode = fhirKey(system, code);
  }

  if (checkedCode) {
	const item = futil.findCodedItem(cov.costToBeneficiary, system, checkedCode);
	if (item) return(futil.renderMoney(item.valueMoney));
  }

  return(undefined);
}





