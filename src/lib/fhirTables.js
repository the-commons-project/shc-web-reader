
import * as futil from "./fhirUtil.js";

//
// Routines for rendering potentially diverse groups of resources in tabular form.
//

// +-------------+
// | addResource |
// +-------------+

export function addResource(resource, tableState) {
  const rtype = resource.resourceType;
  if (!tableState[rtype]) tableState[rtype] = [];
  tableState[rtype].push(resource);
}

// +-----------+
// | renderJSX |
// +-----------+

export function renderJSX(tableState, className, rmap) {

  const tables = Object.keys(tableState).reduce((acc, rtype) => {

	const arr = tableState[rtype];

	let hdrFn = undefined;
	let rowFn = undefined;
	
	switch (rtype) {
	  case "Condition": hdrFn = conditionsHeader; rowFn = conditionsRow; break;
	  case "MedicationStatement": hdrFn = medStmtHeader; rowFn = medStmtRow; break;
	  case "AllergyIntolerance": hdrFn = allergyHeader; rowFn = allergyRow; break;
	  case "Observation": hdrFn = obsHeader; rowFn = obsRow; break;
	  default: console.warn("fhirTables can't render: " + rtype); break;
	}

	if (!hdrFn) return(acc);
	
	const rows = arr.map((r) => rowFn(r, rmap));
	
	acc.push(
	  <table key={rtype} className={className}>
		<tbody>
		  { hdrFn() }
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

function conditionsRow(r, rmap) {

  const status = (r.clinicalStatus ? futil.renderCodeableJSX(r.clinicalStatus) : "");
  const name = (r.code ? futil.renderCodeableJSX(r.code) : "");
  const sev = (r.severity ? futil.renderCodeableJSX(r.severity) : "");

  return(<tr key={r.id}>
		   <td>{status}</td>
		   <td>{name}</td>
		   <td>{sev}</td>
		   <td>NYI</td>
		   <td>NYI</td>
		 </tr>);
}

// +---------------------+
// | MedicationStatement |
// +---------------------+

// nyi
// nyi
// nyi
// nyi

function medStmtHeader() {
  return(<tr><th>Name</th></tr>);
}

function medStmtRow(r, rmap) {

  let nameJSX = "Unknown";
  
  if (r.medicationReference) {
	const m = rmap[r.medicationReference.reference];
	nameJSX = futil.renderCodeableJSX(m.code);
  }
  else if (r.medicationCodeableConcept) {
	nameJSX = futil.renderCodeableJSX(r.medicationCodeableConcept);
  }
  
  return(<tr key={r.id}><td>{nameJSX}</td></tr>);
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

function allergyRow(r, rmap) {

  const status = (r.clinicalStatus ? futil.renderCodeableJSX(r.clinicalStatus) : "");
  const name = (r.code ? futil.renderCodeableJSX(r.code) : "");
  const category = (r.category ? r.category.join("; ") : "");
  const crit = (r.criticality ? r.criticality : "");
  
  return(<tr key={r.id}>
		   <td>{status}</td>
		   <td>{name}</td>
		   <td>{category}</td>
		   <td>{crit}</td>
		   <td>NYI</td>
		 </tr>);
}

// +-------------+
// | Observation |
// +-------------+

function obsHeader() {
  return(<tr>
		   <th>Status</th>
		   <th>Name</th>
		   <th>Performed</th>
		   <th>Result</th>
		 </tr>);
}

function obsRow(r, rmap) {

  const name = (r.code ? futil.renderCodeableJSX(r.code) : "");

  return(<tr key={r.id}>
		   <td>{r.status}</td>
		   <td>{name}</td>
		   <td>NYI</td>
		   <td>NYI</td>
		 </tr>);
}
