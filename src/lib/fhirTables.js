
import * as futil from "./fhirUtil.js";

//
// Routines for rendering potentially diverse groups of resources in tabular form.
//

// +-------------+
// | addResource |
// +-------------+

export function addResource(resource, tableState, rmap) {

  const r = futil.resolveReference(resource, rmap);
  
  if (r === undefined) {
	console.log("Unable to resolve reference for: " + JSON.stringify(resource));
	return;
  }
  
  const rtype = r.resourceType;

  // for DRs, just add individual Observations
  if (rtype === "DiagnosticReport" && r.result && r.result.length) {
	for (const i in r.result) addResource(r.result[i], tableState, rmap);
	return;
  }

  // otherwise accumulate the resource in our state
  if (!tableState[rtype]) tableState[rtype] = [];
  tableState[rtype].push(r);

  // Observation can included a list of referenced Observations
  if (rtype === "Observation" && r.hasMember && r.hasMember.length > 0) {

	for (const i in r.hasMember) {
	  addResource(r.hasMember[i], tableState, rmap);
	}
  }
}

// +-----------+
// | renderJSX |
// +-----------+

const renderConfig = {
  
  "Condition": {
	"hdrFn": conditionsHeader,
	"rowFn": conditionsRow
  },
  "MedicationStatement": {
	"hdrFn": medStmtHeader,
	"rowFn": medStmtRow,
	"compFn": medStmtCompare
  },
  "MedicationRequest": {
	"hdrFn": medReqHeader,
	"rowFn": medReqRow,
	"compFn": medReqCompare
  },
  "AllergyIntolerance": {
	"hdrFn": allergyHeader,
	"rowFn": allergyRow
  },
  "Observation": {
	"hdrFn": obsHeader,
	"rowFn": obsRow,
	"compFn": obsCompare
  },
  "Immunization": {
	"hdrFn": immunizationHeader,
	"rowFn": immunizationRow,
	"compFn": immunizationCompare
  },
  "CarePlan": {
    "hdrFn": carePlanHeader,
    "rowFn": carePlanRow,
  }
}

export function renderJSX(tableState, className, rmap, dcr) {

  const tables = Object.keys(tableState).reduce((acc, rtype) => {

	const render = renderConfig[rtype];
	
	if (!render) {
	  console.warn("fhirTables can't render: " + rtype);
	  return(acc);
	}

	const arr = tableState[rtype];
	if (render.compFn) arr.sort(render.compFn);

	const seen = {};
	const rows = arr.reduce((rowsAcc, r) => {

	  if (!r.id || !seen[r.id]) {
		rowsAcc.push(render.rowFn(r, rmap, dcr));
		if (r.id) seen[r.id] = true;
	  }

	  return(rowsAcc);
	  
	}, []);
		  
	acc.push(
	  <table key={rtype} className={className}>
		<tbody>
		  { render.hdrFn() }
		  {rows}
		</tbody>
	  </table>
	);
	
	return(acc);
  }, []);

  return(tables);
}

// +-----------+
// | Condition |
// +-----------+

function conditionsHeader() {
  return(<tr>
		   <th>Status</th>
		   <th>Name</th>
		   <th>Severity</th>
		   <th>Onset</th>
		   <th>Abatement</th>
		 </tr>);
}

function conditionsRow(r, rmap, dcr) {

  const status = (r.clinicalStatus ? futil.renderCodeableJSX(r.clinicalStatus, dcr) : "");
  const name = (r.code ? futil.renderCodeableJSX(r.code, dcr) : "");
  const sev = (r.severity ? futil.renderCodeableJSX(r.severity, dcr) : "");

  return(<tr key={r.id}>
		   <td>{status}</td>
		   <td>{name}</td>
		   <td>{sev}</td>
		   <td>{ futil.renderCrazyDateTime(r, "onset") }</td>
		   <td>{ futil.renderCrazyDateTime(r, "abatement") }</td>
		 </tr>);
}

// +---------------------+
// | MedicationStatement |
// +---------------------+

function medStmtHeader() {
  return(<tr>
		   <th>Status</th>
		   <th>Name</th>
		   <th>Effective</th>
		   <th>Dosage</th>
		 </tr>);
}

function medStmtRow(r, rmap, dcr) {

  let effective = undefined;
  if (r.effectiveDateTime) {
	effective = "started " + futil.renderDateTime(r.effectiveDateTime);
  }
  else if (r.effectivePeriod) {
	effective = futil.renderPeriod(r.effectivePeriod);
  }

  return(<tr key={r.id}>
		   <td>{r.status}</td>
		   <td>{renderMedXNameJSX(r, rmap, dcr)}</td>
		   <td>{effective}</td>
		   <td>{futil.renderDosage(r.dosage, dcr)}</td>
		 </tr>);
}

function medStmtCompare(a, b) {
  const effectiveA = futil.parseCrazyDateTimeBestGuess(a, "effective");
  const effectiveB = futil.parseCrazyDateTimeBestGuess(b, "effective");
  return(effectiveB - effectiveA);
}

// +--------------------+
// | MedicationRequest  |
// +--------------------+

function medReqHeader() {
  return(<tr>
		   <th>Status</th>
		   <th>Name</th>
		   <th>AuthoredOn</th>
		   <th>Dosage</th>
		 </tr>);
}

function medReqRow(r, rmap, dcr) {

  // nyi
  return(<tr key={r.id}>
		   <td>{r.status}</td>
		   <td>{renderMedXNameJSX(r, rmap, dcr)}</td>
		   <td>{(r.authoredOn ? futil.renderDateTime(r.authoredOn) : "")}</td>
		   <td>{futil.renderDosage(r.dosageInstruction, dcr)}</td>
		 </tr>);
}

function medReqCompare(a, b) {
  const authoredA = (a.authoredOn ? futil.parseDateTime(a.authoredOn) : new Date());
  const authoredB = (b.authoredOn ? futil.parseDateTime(b.authoredOn) : new Date());
  return(authoredB - authoredA);
}

function renderMedXNameJSX(r, rmap, dcr) {
  
  let nameJSX = "Unknown";
  
  if (r.medicationReference) {
	const ref = r.medicationReference;
	const m = rmap[ref.reference];
	if (m) {
	  nameJSX = futil.renderCodeableJSX(m.code, dcr);
	}
	else {
	  if (ref.display) nameJSX = ref.display;
	  console.error(`medicationReference.reference not found: ${ref.reference}`);
	}
  }
  else if (r.medicationCodeableConcept) {
	nameJSX = futil.renderCodeableJSX(r.medicationCodeableConcept, dcr);
  }

  return(nameJSX);
}

// +--------------------+
// | AllergyIntolerance |
// +--------------------+

function allergyHeader() {
  return(<tr>
		   <th>Status</th>
		   <th>Name</th>
		   <th>Category</th>
		   <th>Criticality</th>
		   <th>Onset</th>
		 </tr>);
}

function allergyRow(r, rmap, dcr) {

  const status = (r.clinicalStatus ? futil.renderCodeableJSX(r.clinicalStatus, dcr) : "");
  const name = (r.code ? futil.renderCodeableJSX(r.code, dcr) : "");
  const category = (r.category ? r.category.join("; ") : "");
  const crit = (r.criticality ? r.criticality : "");
  
  return(<tr key={r.id}>
		   <td>{status}</td>
		   <td>{name}</td>
		   <td>{category}</td>
		   <td>{crit}</td>
		   <td>{ futil.renderCrazyDateTime(r, "onset") }</td>
		 </tr>);
}

// +--------------+
// | Immunization |
// +--------------+

function immunizationHeader() {
  return(<tr>
		   <th>Status</th>
		   <th>Name</th>
		   <th>Administered</th>
		   <th>Reaction</th>
		 </tr>);
}

function immunizationRow(r, rmap, dcr) {

  const status = r.status + (r.statusReason ? "; " + futil.renderCodeableJSX(r.statusReason, dcr) : "");
  const name = futil.renderCodeableJSX(r.vaccineCode, dcr);
  const administered = futil.renderCrazyDateTime(r, "occurrence");

  let reaction = undefined;
  if (r.reaction) {
	if (!Array.isArray(r.reaction)) reaction = renderOneReaction(r.reaction, rmap, dcr);
	else r.reaction.map((reaction) => renderOneReaction(reaction, rmap, dcr)).join("\n");
  }
  
  return(<tr key={r.id}>
		   <td>{status}</td>
		   <td>{name}</td>
		   <td>{administered}</td>
		   <td>{reaction}</td>
		 </tr>);
}

function immunizationCompare(a, b) {
  const dateA = futil.parseCrazyDateTimeBestGuess(a, "occurrence");
  const dateB = futil.parseCrazyDateTimeBestGuess(b, "occurrence");
  return(dateB - dateA);
}

function renderOneReaction(reaction, rmap, dcr) {
  
  let disp = undefined;
  
  disp = futil.delimiterAppend(disp, futil.renderDateTime(reaction.date), "; ");
  
  if (reaction.manifestation) {
	if (reaction.manifestation.concept) {
	  disp = futil.delimiterAppend(disp, futil.renderCodeableJSX(reaction.manifestation.concept, dcr), "; ");
	}
	else {
	  const obs = rmap[reaction.manifestation.reference];
	  disp = futil.delimiterAppend(disp, futil.renderCodeableJSX(obs.code, dcr), "; ");
	}
  }
  
  if (reaction.reported) futil.delimiterAppend(disp, "patient-reported", "; ");

  return(disp);
}

// +-------------+
// | Observation |
// +-------------+

function obsHeader() {
  return(<tr>
		   <th>Performed</th>
		   <th>Test</th>
		   <th>Result</th>
		   <th>Flag</th>
		 </tr>);
}

function obsRow(r, rmap, dcr) {

  // observations may have compound results, which we treat as
  // multiple distinct observations ... not ideal but it works ok.

  const effective = futil.renderCrazyDateTime(r, "effective");

  const rows = [];

  const outerName = (r.code ? futil.renderCodeableJSX(r.code, dcr) : "");
  const outerValue = futil.renderCrazyValue(r, "value", dcr);

  if (outerValue || r.dataAbsentReason) {
	pushObsRow(effective, outerName, outerValue, r, rows, dcr);
  }

  if (r.component && r.component.length) {
	for (const i in r.component) {
	  const c = r.component[i];
	  const compName = (c.code ? futil.renderCodeableJSX(c.code, dcr) : "");
	  if (compName !== outerName) {

		const compValue = futil.renderCrazyValue(c, "value", dcr);
		if (compValue || c.dataAbsentReason) {
		  pushObsRow(effective, compName, compValue, c, rows, dcr);
		}
	  }

	}
  }

  return(rows);
}

function pushObsRow(effective, name, value, obj, rows, dcr) {

  const realValue = (value ? value
					 : futil.renderCodeableJSX(obj.dataAbsentReason, dcr));

  let flag = undefined;
  if (obj.interpretation && obj.interpretation.length) {
	flag = obj.interpretation.map((i) => futil.renderCodeableJSX(i, dcr)).join("\n");
  }

  rows.push(
	<tr key={obj.id}>
	  <td>{effective}</td>
	  <td>{name}</td>
	  <td>{realValue}</td>
	  <td>{flag}</td>
	</tr>
  );
}

function obsCompare(a, b) {
  const effectiveA = futil.parseCrazyDateTimeBestGuess(a, "effective");
  const effectiveB = futil.parseCrazyDateTimeBestGuess(b, "effective");
  return(effectiveB - effectiveA);
}

// +--------------------+
// |    Plan of Care    |
// +--------------------+


function carePlanHeader() {
  return (
    <tr>
      <th>Status</th>
      <th>Intent</th>
      <th>Activities</th>
      <th>Category</th>
      <th>Period Start</th>
      {/* Add headers for other relevant CarePlan properties */}
    </tr>
  );
}

function carePlanRow(r, rmap, dcr) {
  const status = r.status;
  const intent = r.intent;
  const activities = r.activity ? r.activity.map(activity => activity.detail.code.text).join(", ") : "";
  const category = r.category ? r.category.map(c => c.text).join(", ") : "";
  const periodStart = r.period ? futil.renderDateTime(r.period.start) : "";

  return (
    <tr key={r.id}>
      <td>{status}</td>
      <td>{intent}</td>
      <td>{activities}</td>
      <td>{category}</td>
      <td>{periodStart}</td>
      {/* Render other relevant CarePlan properties as table cells */}
    </tr>
  );
}
