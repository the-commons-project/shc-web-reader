
const COVERAGE_CLASS_SYSTEM = "http://terminology.hl7.org/CodeSystem/coverage-class";
const COVERAGE_CLASS_GROUP = "group";

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

export function groupNumber(cov) {

  if (cov.class) {
	for (const i in cov.class) {
	  const item = cov.class[i];
	  if (item.type && item.type.coding) {
		for (const j in item.type.coding) {
		  if (item.type.coding[j].system === COVERAGE_CLASS_SYSTEM &&
			  item.type.coding[j].code === COVERAGE_CLASS_GROUP) {
			return(item.value);
		  }
		}
	  }
	}
  }

  return(undefined);
}


