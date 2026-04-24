
import * as futil from "./fhirUtil.js";
import * as fdocs from "./fhirDocs.js";
import { estimateBase64SizeBytes } from "./b64.js";
import { Link } from '@mui/material';

//
// Routines for rendering potentially diverse groups of resources in tabular form.
//
// addResource is called for each resource in the section, which organizes into
// lists by resource type. Then renderJSX renders one table per key in tableState.
//
// renderJSX takes two helper objects:
//    "ctx" contains context
//        organized: the organized object (see resources.js)
//        arr: the array of resources being rendered
//        state: an object that can be used as needed to track state from row-to-row
//    "funcs" contains various methods to assist in rendering
//         dcr: deferred code renderer
//         loc: language-aware renderer ("t") elsewhere
//         doc: modal dialog function (see DocumentModelContext "showDocuments")
//

// +-------------+
// | addResource |
// +-------------+

export function addResource(resource, tableState, organized) {

  const r = futil.resolveReference(resource, organized.byId);

  if (r === undefined) {
	console.log("Unable to resolve reference for: " + JSON.stringify(resource));
	return;
  }

  const rtype = r.resourceType;

  // "Medication" appears in CH export but isn't a valid standalone entity
  if (rtype === "Medication") return;

  // accumulate the resource in our state
  if (!tableState[rtype]) tableState[rtype] = [];
  tableState[rtype].push(r);

  // Observation can include a list of referenced Observations; flatten
  if (rtype === "Observation" && r.hasMember && r.hasMember.length > 0) {

	for (const i in r.hasMember) {
	  addResource(r.hasMember[i], tableState, organized);
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
  "MedicationAdministration": { // reuse medStmt
	"hdrFn": medStmtHeader,
	"rowFn": medStmtRow,
	"compFn": medStmtCompare
  },
  "MedicationDispense": {
	"hdrFn": medDispHeader,
	"rowFn": medDispRow,
	"compFn": medDispCompare
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
  "Procedure": {
	"hdrFn": procHeader,
	"rowFn": procRow,
	"compFn": procCompare
  },
  "CarePlan": {
    "hdrFn": carePlanHeader,
    "rowFn": carePlanRow,
  },
  "Consent": {
    "hdrFn": consentHeader,
    "rowFn": consentRow
  },
  "DeviceUseStatement": {
    "hdrFn": deviceUseStatementHeader,
    "rowFn": deviceUseStatementRow
  },
   "ClinicalImpression": {
     "hdrFn": clinicalImpressionHeader,
     "rowFn": clinicalImpressionRow
   },
  "Goal": {
	"hdrFn": goalHeader,
	"rowFn": goalRow,
	"compFn": goalCompare
  },
   "DocumentReference": {
     "hdrFn": docRefHeader,
     "rowFn": docRefRow,
	 "compFn": docRefCompare
   },
   "DiagnosticReport": {
     "hdrFn": diagRptHeader,
     "rowFn": diagRptRow,
	 "compFn": diagRptCompare
   }
}

export function renderJSX(tableState, className, organized, funcs) {

  const tables = Object.keys(tableState).reduce((acc, rtype) => {

	const render = renderConfig[rtype];

	if (!render) {
	  console.warn("fhirTables can't render: " + rtype);
	  return(acc);
	}

	const arr = uniquifyResources(rtype, tableState, organized.byId);
	if (arr.length === 0) return(acc);
	
	if (render.compFn) arr.sort(render.compFn);

	const ctx = {
	  organized: organized,
	  arr: arr,
	  state: {},
	  className: className
	};
	
	const rows = arr.reduce((rowsAcc, r) => {

	  const theseRows = render.rowFn(r, ctx, funcs);
	  if (theseRows) rowsAcc.push(theseRows);

	  return(rowsAcc);

	}, []);

	acc.push(
	  <table key={rtype} className={className}>
		<tbody>
		  { render.hdrFn(funcs, ctx) }
		  {rows}
		</tbody>
	  </table>
	);

	return(acc);
  }, []);

  return(tables);
}

// +---------+
// | Helpers |
// +---------+

// Note this uniques BOTH by resource.id and resource.identifier.
// Epic has been show to return multiple copies of the same document
// with the same identifiers but different resource ids in different
// contexts. This may be OK by spec, but it's never what we want, so
// we uniquify.
//
// We also uniquify away Observations that are already present in
// a Diagnositc Report in the same section. This is a bit ugly but
// at least the CH export is duping them up and it makes for a
// super-messy display.

function uniquifyResources(rtype, tableState, byId) {

  // first unique by identifiers
  
  const seenResources = {};
  const seenIds = {};

  let result = tableState[rtype].reduce((uniques, r) => {

	const newResource = (!r.id || !seenResources[r.id]);
	if (newResource) {

	  const jsonId = (r.identifier ? JSON.stringify(r.identifier) : null);
	  const newId = (!jsonId || !seenIds[jsonId]);

	  if (newId) {
		uniques.push(r);
		if (r.id) seenResources[r.id] = true;
		if (jsonId) seenIds[jsonId] = true;
	  }
	}

	return(uniques);

  }, []);

  // next remove Observations already in DRs
  
  if (rtype === "Observation") {
	const drs = tableState["DiagnosticReport"];
	const omap = getObservationsMapForDiagnosticReports(drs, byId);
	result = result.filter((r) => !omap[r.id]);
  }

  return(result);
}


// +-----------+
// | Condition |
// +-----------+

function conditionsHeader(funcs, ctx) {
  return(<tr>
		   <th>{funcs.loc('statusHeader')}</th>
		   <th>{funcs.loc('nameHeader')}</th>
		   <th>{funcs.loc('severityHeader')}</th>
		   <th>{funcs.loc('onsetHeader')}</th>
		   <th>{funcs.loc('abatementHeader')}</th>
		 </tr>);
}

function conditionsRow(r, ctx, funcs) {

  const status = (r.clinicalStatus ? futil.renderCodeableJSX(r.clinicalStatus, funcs.dcr) : "");
  const name = (r.code ? futil.renderCodeableJSX(r.code, funcs.dcr) : "");
  const sev = (r.severity ? futil.renderCodeableJSX(r.severity, funcs.dcr) : "");

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

function medStmtHeader(funcs, ctx) {
  return(<tr>
		   <th>{funcs.loc('statusHeader')}</th>
		   <th>{funcs.loc('nameHeader')}</th>
		   <th>{funcs.loc('effectiveHeader')}</th>
		   <th>{funcs.loc('dosageHeader')}</th>
		 </tr>);
}

function medStmtRow(r, ctx, funcs) {

  let effective = undefined;
  if (r.effectiveDateTime) {
	effective = "started " + futil.renderDateTime(r.effectiveDateTime);
  }
  else if (r.effectivePeriod) {
	effective = futil.renderPeriod(r.effectivePeriod);
  }

  return(<tr key={r.id}>
		   <td>{r.status}</td>
		   <td>{renderMedXNameJSX(r, ctx.organized.byId, funcs)}</td>
		   <td>{effective}</td>
		   <td>{futil.renderDosage(r.dosage, funcs.dcr)}</td>
		 </tr>);
}

function medStmtCompare(a, b) {

  if (a.status === "active" && b.status !== "active") return(-1);
  if (a.status !== "active" && b.status === "active") return(1);

  const effectiveA = futil.parseCrazyDateTimeBestGuess(a, "effective");
  const effectiveB = futil.parseCrazyDateTimeBestGuess(b, "effective");
  return(effectiveB - effectiveA);
}

// +--------------------+
// | MedicationDispense |
// +--------------------+

function medDispHeader(funcs, ctx) {
  return(<tr>
		   <th>{funcs.loc('statusHeader')}</th>
		   <th>{funcs.loc('nameHeader')}</th>
		   <th>{funcs.loc('quantityHeader')}</th>
		   <th>{funcs.loc('daysSupplyHeader')}</th>
		   <th>{funcs.loc('deliveredHeader')}</th>
		   <th>{funcs.loc('substitutionHeader')}</th>
		 </tr>);
}

function medDispRow(r, ctx, funcs) {

  const rsub = r.substitution;
  let sub = "";
  if (rsub && rsub.wasSubstituted) {
	if (rsub.type) sub += futil.renderCodeableJSX(rsub.type, funcs.dcr);
	if (rsub.reason) {
	  if (sub.length) sub += "; ";
	  sub += futil.renderCodeableJSX(futil.firstOrObject(rsub.reason), funcs.dcr);
	}
  }

  return(<tr key={r.id}>
		   <td>{r.status}</td>
		   <td>{renderMedXNameJSX(r, ctx.organized.byId, funcs)}</td>
		   <td>{r.quantity ? futil.renderQuantity(r.quantity) : undefined}</td>
		   <td>{r.daysSupply ? futil.renderQuantity(r.daysSupply) : undefined}</td>
		   <td>{(r.whenHandedOver ? futil.renderDateTime(r.whenHandedOver) : "")}</td>
		   <td>{sub}</td>
		 </tr>);
}

function medDispCompare(a, b) {
  const dateA = (a.whenHandedOver ? futil.parseDateTime(a.whenHandedOver) : new Date());
  const dateB = (b.whenHandedOver ? futil.parseDateTime(b.whenHandedOver) : new Date());
  return(dateB - dateA);
}

// +--------------------+
// | MedicationRequest  |
// +--------------------+

function medReqHeader(funcs, ctx) {
  return(<tr>
		   <th>{funcs.loc('statusHeader')}</th>
		   <th>{funcs.loc('nameHeader')}</th>
		   <th>{funcs.loc('authoredOnHeader')}</th>
		   <th>{funcs.loc('dosageHeader')}</th>
		 </tr>);
}

function medReqRow(r, ctx, funcs) {

  // nyi
  return(<tr key={r.id}>
		   <td>{r.status}</td>
		   <td>{renderMedXNameJSX(r, ctx.organized.byId, funcs)}</td>
		   <td>{(r.authoredOn ? futil.renderDateTime(r.authoredOn) : "")}</td>
		   <td>{futil.renderDosage(r.dosageInstruction, funcs.dcr)}</td>
		 </tr>);
}

function medReqCompare(a, b) {
  if (a.status === "active" && b.status !== "active") return(-1);
  if (a.status !== "active" && b.status === "active") return(1);
  const authoredA = (a.authoredOn ? futil.parseDateTime(a.authoredOn) : new Date());
  const authoredB = (b.authoredOn ? futil.parseDateTime(b.authoredOn) : new Date());
  return(authoredB - authoredA);
}

function renderMedXNameJSX(r, byId, funcs) {

  let nameJSX = undefined;

  if (r.medicationReference) {
	const ref = r.medicationReference;
	const m = byId[ref.reference];
	if (m) {
	  nameJSX = futil.renderCodeableJSX(m.code, funcs.dcr);
	}
	else if (ref.display) {
	  nameJSX = ref.display;
	}
  }
  
  if (!nameJSX && r.medicationCodeableConcept) {
	nameJSX = futil.renderCodeableJSX(r.medicationCodeableConcept, funcs.dcr);
  }

  return(nameJSX ?? "Unknown");
}

// +--------------------+
// | AllergyIntolerance |
// +--------------------+

function allergyHeader(funcs, ctx) {
  return(<tr>
		   <th>{funcs.loc('statusHeader')}</th>
		   <th>{funcs.loc('nameHeader')}</th>
		   <th>{funcs.loc('categoryHeader')}</th>
		   <th>{funcs.loc('criticalityHeader')}</th>
		   <th>{funcs.loc('onsetHeader')}</th>
		 </tr>);
}

function allergyRow(r, ctx, funcs) {

  const status = (r.clinicalStatus ? futil.renderCodeableJSX(r.clinicalStatus, funcs.dcr) : "");
  const name = (r.code ? futil.renderCodeableJSX(r.code, funcs.dcr) : "");
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

function immunizationHeader(funcs, ctx) {
  return(<tr>
		   <th>{funcs.loc('statusHeader')}</th>
		   <th>{funcs.loc('nameHeader')}</th>
		   <th>{funcs.loc('administeredHeader')}</th>
		   <th>{funcs.loc('reactionHeader')}</th>
		 </tr>);
}

function immunizationRow(r, ctx, funcs) {

  const status = r.status + (r.statusReason ? "; " + futil.renderCodeableJSX(r.statusReason, funcs.dcr) : "");
  const name = futil.renderCodeableJSX(r.vaccineCode, funcs.dcr);
  const administered = futil.renderCrazyDateTime(r, "occurrence");

  let reaction = undefined;
  if (r.reaction) {
	if (!Array.isArray(r.reaction)) reaction = renderOneReaction(r.reaction, ctx.organized.byId, funcs);
	else r.reaction.map((reaction) => renderOneReaction(reaction, ctx.organized.byId, funcs)).join("\n");
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

function renderOneReaction(reaction, byId, funcs) {

  let disp = undefined;

  disp = futil.delimiterAppend(disp, futil.renderDateTime(reaction.date), "; ");

  if (reaction.manifestation) {
	if (reaction.manifestation.concept) {
	  disp = futil.delimiterAppend(disp, futil.renderCodeableJSX(reaction.manifestation.concept, funcs.dcr), "; ");
	}
	else {
	  const obs = byId[reaction.manifestation.reference];
	  disp = futil.delimiterAppend(disp, futil.renderCodeableJSX(obs.code, funcs.dcr), "; ");
	}
  }

  if (reaction.reported) futil.delimiterAppend(disp, "patient-reported", "; ");

  return(disp);
}

// +-------------+
// | Observation |
// +-------------+

function obsHeader(funcs, ctx) {
  return(<tr>
		   <th>{funcs.loc('performedHeader')}</th>
		   <th>{funcs.loc('testHeader')}</th>
		   <th>{funcs.loc('resultHeader')}</th>
		   <th>{funcs.loc('flagHeader')}</th>
		 </tr>);
}

function obsRow(r, ctx, funcs) {

  // observations may have compound results, which we treat as
  // multiple distinct observations ... not ideal but it works ok.

  const effective = futil.renderCrazyDateTime(r, "effective");

  const rows = [];

  const outerName = (r.code ? futil.renderCodeableJSX(r.code, funcs.dcr) : "");
  const outerValue = futil.renderCrazyValue(r, "value", funcs.dcr);

  if (outerValue || r.dataAbsentReason) {
	pushObsRow(effective, outerName, outerValue, r, r.id, rows, funcs);
  }

  if (r.component && r.component.length) {
	for (const i in r.component) {
	  const c = r.component[i];
	  const compName = (c.code ? futil.renderCodeableJSX(c.code, funcs.dcr) : "");
	  if (compName !== outerName) {

		const compValue = futil.renderCrazyValue(c, "value", funcs.dcr);
		if (compValue || c.dataAbsentReason) {
		  pushObsRow(effective, compName, compValue, c, `${r.id}-${i}`, rows, funcs);
		}
	  }

	}
  }

  return(rows);
}

function pushObsRow(effective, name, value, obj, key, rows, funcs) {

  const realValue = (value ? value
					 : futil.renderCodeableJSX(obj.dataAbsentReason, funcs.dcr));

  let flag = undefined;
  if (obj.interpretation && obj.interpretation.length) {
	flag = obj.interpretation.map((i) => futil.renderCodeableJSX(i, funcs.dcr)).join("\n");
  }

  rows.push(
	<tr key={key}>
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

// +-----------+
// | Procedure |
// +-----------+

function procHeader(funcs, ctx) {
  return(<tr>
		   <th>{funcs.loc('statusHeader')}</th>
		   <th>{funcs.loc('nameHeader')}</th>
		   <th>{funcs.loc('performedHeader')}</th>
		   <th>{funcs.loc('outcomeHeader')}</th>
		 </tr>);
}

function procRow(r, ctx, funcs) {

  const status = r.status + (r.statusReason ? "; " + futil.renderCodeableJSX(r.statusReason, funcs.dcr) : "");
  const name = r.code ? futil.renderCodeableJSX(r.code, funcs.dcr) : "Unknown";
  const performed = futil.renderCrazyDateTime(r, "performed");
  const outcome = r.outcome ? futil.renderCodeableJSX(r.outcome, funcs.dcr) : undefined;

  return(<tr key={r.id}>
		   <td>{status}</td>
		   <td>{name}</td>
		   <td>{performed}</td>
		   <td>{outcome}</td>
		 </tr>);
}

function procCompare(a, b) {
  const dateA = futil.parseCrazyDateTimeBestGuess(a, "performed");
  const dateB = futil.parseCrazyDateTimeBestGuess(b, "performed");
  return(dateB - dateA);
}

// +--------------------+
// |    Plan of Care    |
// +--------------------+

function carePlanHeader(funcs, ctx) {
  return (
    <tr>
      <th>{funcs.loc('statusHeader')}</th>
      <th>{funcs.loc('intentHeader')}</th>
      <th>{funcs.loc('activitiesHeader')}</th>
      <th>{funcs.loc('categoryHeader')}</th>
      <th>{funcs.loc('periodStartHeader')}</th>
      <th>{funcs.loc('noteHeader')}</th>
      {/* Add headers for other relevant CarePlan properties */}
    </tr>
  );
}

function carePlanRow(r, ctx, funcs) {
  const status = r.status;
  const intent = r.intent;

  const activities = futil.joinJSXElements(
    (r.activity || []).map(activity =>
      activity.detail && activity.detail.code
      ? futil.renderCodeableJSX(activity.detail.code, funcs.dcr)
      : null
    ).filter(activity => activity !== null),
    ', '
  );

   const category = futil.joinJSXElements(
       (r.category || []).map(c =>
          futil.renderCodeableJSX(c, funcs.dcr)
       ).filter(c => c !== null),
       ', '
   );

  const period = r.period ? futil.renderPeriod(r.period) : "";
  const note = r.note ? r.note.text : "";

  return (
    <tr key={r.id}>
      <td>{status}</td>
      <td>{intent}</td>
      <td>{activities}</td>
      <td>{category}</td>
      <td>{period}</td>
      <td>{note}</td>
      {/* Render other relevant CarePlan properties as table cells */}
    </tr>
  );
}

// +--------------------+
// |      Consent       |
// +--------------------+

function consentHeader(funcs, ctx) {
  return (
    <tr>
      <th>{funcs.loc('statusHeader')}</th>
      <th>{funcs.loc('scopeHeader')}</th>
      <th>{funcs.loc('categoryHeader')}</th>
      <th>{funcs.loc('dateTimeHeader')}</th>
      <th>{funcs.loc('policyRuleHeader')}</th>
      <th>{funcs.loc('provisionPeriodForConsentHeader')}</th>
      <th>{funcs.loc('organizationHeader')}</th>
    </tr>
  );
}

function consentRow(r, ctx, funcs) {
  const status = r.status || "N/A";
  const scopeDisplay = futil.renderCodeableJSX(r.scope, funcs.dcr);
  const categoryDisplay = futil.joinJSXElements(
      (r.category || []).map(c => futil.renderCodeableJSX(c, funcs.dcr)),
      ', '
  );
  const dateTime = r.dateTime
    ? futil.renderDateTime(r.dateTime)
    : "";
  const policyRule = futil.renderCodeableJSX(r.policyRule, funcs.dcr);

  const provisionPeriod = r.provision && r.provision.period
    ? futil.renderPeriod(r.provision.period)
    : "";
  const organization = futil.joinJSXElements(
      (r.organization || []).map(org => futil.renderOrganization(org, funcs.dcr)),
      ', '
  );

  return (
    <tr key={r.id}>
      <td>{status}</td>
      <td>{scopeDisplay}</td>
      <td>{categoryDisplay}</td>
      <td>{dateTime}</td>
      <td>{policyRule}</td>
      <td>{provisionPeriod}</td>
      <td>{organization}</td>
    </tr>
  );
}

// +--------------------+
// | DeviceUseStatement |
// +--------------------+

function deviceUseStatementHeader(funcs, ctx) {
    return (
        <tr>
            <th>{funcs.loc('subjectHeader')}</th>
            <th>{funcs.loc('timingForDeviceUseHeader')}</th>
            <th>{funcs.loc('sourceHeader')}</th>
            <th>{funcs.loc('deviceHeader')}</th>
            <th>{funcs.loc('bodySiteHeader')}</th>
            {/* Add other relevant headers if needed */}
        </tr>
    );
}

function deviceUseStatementRow(r, ctx, funcs) {
    const subject = futil.renderReference(r.subject, funcs.dcr);
    const timing = futil.renderCrazyDateTime(r, "timing");
    const source = r.source ? futil.renderReference(r.source, funcs.dcr) : "";
    const device = futil.renderReference(r.device, funcs.dcr);
    const bodySite = r.bodySite ? futil.renderCodeable(r.bodySite, funcs.dcr) : "";

    return (
        <tr key={r.id}>
            <td>{subject}</td>
            <td>{timing}</td>
            <td>{source}</td>
            <td>{device}</td>
            <td>{bodySite}</td>
        </tr>
    );
};

// +--------------------+
// | ClinicalImpression |
// +--------------------+

function clinicalImpressionHeader(funcs, ctx) {
    return (
        <tr>
            <th>{funcs.loc('statusHeader')}</th>
            <th>{funcs.loc('descriptionHeader')}</th>
            <th>{funcs.loc('effectivePeriodDateTimeHeader')}</th>
            <th>{funcs.loc('summaryHeader')}</th>
            <th>{funcs.loc('subjectHeader')}</th>
            <th>{funcs.loc('accessorHeader')}</th>
            {/* Add other relevant headers if needed */}
        </tr>
    );
}

function clinicalImpressionRow(r, ctx, funcs) {
    const status = r.status;
    const description = r.description || "";
    const effective = futil.renderCrazyDateTime(r, "effective");
    const summary = r.summary || "";
    const subject = futil.renderReference(r.subject, funcs.dcr) || "";
    const assessor = futil.renderReference(r.assessor, funcs.dcr) || "";


    return (
        <tr key={r.id}>
            <td>{status}</td>
            <td>{description}</td>
            <td>{effective}</td>
            <td>{summary}</td>
            <td>{subject}</td>
            <td>{assessor}</td>
            {/* Render other relevant ClinicalImpression properties as table cells */}
        </tr>
    );
}

// +------+
// | Goal |
// +------+

function goalHeader(funcs, ctx) {
  return(<tr>
		   <th>{funcs.loc('updatedHeader')}</th>
		   <th>{funcs.loc('statusHeader')}</th>
		   <th>{funcs.loc('nameHeader')}</th>
		 </tr>);
}

function goalRow(r, ctx, funcs) {

  const updated = r.statusDate ? futil.renderDate(r.statusDate)
		: (r.startDate ? futil.renderDate(r.startDate) : null);
	
  const status = r.lifecycleStatus + (r.statusReason ? "; " + futil.renderCodeableJSX(r.statusReason, funcs.dcr) : "");

  const description = futil.renderCodeableJSX(r.description, funcs.dcr);

  return(<tr key={r.id}>
		   <td>{updated}</td>
		   <td>{status}</td>
		   <td>{description}</td>
		 </tr>);
}

function goalCompare(a, b) {
  
  const dateA = a.statusDate ?? a.startDate;
  const dateB = b.statusDate ?? b.startDate;

  if (!dateA && !dateB) return(0);
  if (!dateA) return(1);
  if (!dateB) return(-1);

  return(dateB - dateA);
}

// +-------------------+
// | DocumentReference |
// +-------------------+

function docRefHeader(funcs, ctx) {
  return(<tr>
		   <th>{funcs.loc('dateHeader')}</th>
		   <th>{funcs.loc('nameHeader')}</th>
		   <th>{funcs.loc('authorHeader')}</th>
		   <th>{funcs.loc('sizeHeader')}</th>
		   <th>{funcs.loc('statusHeader')}</th>
		 </tr>);
}

function docRefRow(r, ctx, funcs) {

  if (!ctx.state.modalDocs) ctx.state.modalDocs = computeModalDocs(ctx);
  if (!ctx.state.rowIndex) ctx.state.rowIndex = 0;

  const rowIndex = ctx.state.rowIndex++;
  const modalDoc = ctx.state.modalDocs[rowIndex];

  const date = (r.date ? futil.renderDateTime(r.date) : null);
  const status = r.status || 'current';
  const authors = futil.joinJSXElements((r.author || []).map((a) => futil.renderGenerator(a, ctx.organized.byId)), ', ');

  const bytes = (modalDoc.attachment.data ? estimateBase64SizeBytes(modalDoc.attachment.data) : 0);
  const size = fdocs.formatFileSize(bytes);
  
  return(<tr key={r.id}>
		   <td><nobr>{date}</nobr></td>
		   <td><Link component="button" variant="body2"
					 sx={{ fontSize: '0.75rem', textAlign: 'left' }}
					 onClick={() => funcs.doc(ctx.state.modalDocs, rowIndex)}>{modalDoc.title}</Link></td>
		   <td>{authors}</td>
		   <td>{size}</td>
		   <td>{status}</td>
		 </tr>);
}

function docRefCompare(a, b) {
  
  if (!a.date && !b.date) return(0);
  if (!a.date) return(1);
  if (!b.date) return(-1);
  
  let cmp = futil.parseDateTime(b.date) - futil.parseDateTime(a.date);
  if (cmp === 0) cmp = scoreStatus(a.status) - scoreStatus(b.status);
  
  return(cmp);
}

function scoreStatus(status) {
  switch (status) {
	case "current": case "final": return(0);
	case "corrected": case "amended": case "appended": return(1);
	case "partial": case "preliminary": case "registered": return(2);
	case "superseded": case "entered-in-error": case "cancelled": return(3);
	default: return(4);
  }
}

function computeModalDocs(ctx) {

  return(ctx.arr.map((r) => {

	const attachment = fdocs.getBestAttachment(r);
	
	return({
	  title: fdocs.getTitle(r),
	  contentType: attachment.contentType,
	  base64Data: attachment.data,
	  attachment: attachment
	});
  }));
}

// +------------------+
// | DiagnosticReport |
// +------------------+

function diagRptHasResults(r) { return(r.result && r.result.length); }
function diagRptHasReport(r) { return(r.presentedForm && r.presentedForm.length); }

function viewDiagRptFiles(r, ctx, funcs, index) {

  const modals = [];

  if (diagRptHasResults(r)) {

	const observations = getObservationsForDiagnosticReport(r, ctx.organized.byId);
	const tableState = { "Observation": observations };
	
	const textBlockStyle = { width: '100%', textAlign: 'left', padding: '4px 12px' };

	const conclusionTextJSX = r.conclusion ? <div style={textBlockStyle}>{r.conclusion}</div> : undefined;

	const conclusionCodeJSX = r.conclusionCode
		  ? r.conclusionCode.map((c,i) => <div key={i} style={textBlockStyle}>{futil.renderCodeableJSX(c, funcs.dcr)}</div>)
		  : undefined;
								 
	let tableJSX = renderJSX(tableState, ctx.className, ctx.organized, funcs);
	if (tableJSX.length === 0) tableJSX = <div style={textBlockStyle}>{funcs.loc('noResultsAvailable')}</div>;

	const allJSX = <>{conclusionTextJSX}{conclusionCodeJSX}{tableJSX}</>;

	modals.push({
	  title: funcs.loc('observationsTitle'),
	  jsxContent: allJSX
	});
  }

  if (diagRptHasReport(r)) {

	const attachment = fdocs.getBestAttachment(r);

	modals.push({
	  title: funcs.loc('presentedReportTitle'),
	  contentType: attachment.contentType,
	  base64Data: attachment.data,
	  attachment: attachment
	});
  }

  funcs.doc(modals, index);
}

function diagRptHeader(funcs, ctx) {
  return(<tr>
		   <th>{funcs.loc('effectiveHeader')}</th>
		   <th>{funcs.loc('nameHeader')}</th>
		   <th>{funcs.loc('performerHeader')}</th>
		   <th>{funcs.loc('statusHeader')}</th>
		   <th>{funcs.loc('resultsHeader')}</th>
		 </tr>);
}

function diagRptRow(r, ctx, funcs) {

  // effectiveDateTime/Period (0..1)
  // code (1)
  // status (1)
  // result -> structured Observations (0..*)
  // conclusion (0..1) /conclusionCode (0..*)
  // presentedForm (0..*)

  let effective = undefined;
  if (r.effectiveDateTime) {
	effective = futil.renderDateTime(r.effectiveDateTime);
  }
  else if (r.effectivePeriod) {
	effective = futil.renderPeriod(r.effectivePeriod);
  }

  const status = r.status || 'unknown';
  const code = futil.renderCodeableJSX(r.code, funcs.dcr);
  const performers = (r.performer || []).map((a) => futil.renderGenerator(a, ctx.organized.byId));

  const hasResults = diagRptHasResults(r);
  const hasReport = diagRptHasReport(r);
		
  return(<tr key={r.id}>
		   <td><nobr>{effective}</nobr></td>
		   <td>{code}</td>
		   <td>{performers}</td>
		   <td>{status}</td>
		   <td><nobr>
			 { hasResults &&
				 <Link component="button" variant="body2"
					   sx={{ fontSize: '0.75rem', textAlign: 'left' }}
					   onClick={() => viewDiagRptFiles(r, ctx, funcs, 0)}>{funcs.loc('resultsLink')}</Link> }
			 { hasResults && hasReport && <span>&nbsp;&nbsp;</span> }
			 { hasReport &&
				 <Link component="button" variant="body2"
					   sx={{ fontSize: '0.75rem', textAlign: 'left' }}
					   onClick={() => viewDiagRptFiles(r, ctx, funcs, hasResults ? 1 : 0)}>{funcs.loc('reportLink')}</Link> }
		   </nobr></td>
		 </tr>);
}

function diagRptCompare(a, b) {
  
  let dateA = undefined;
  if (a.effectiveDateTime) dateA = futil.parseDateTime(a.effectiveDateTime);
  else if (a.effectivePeriod && a.effectivePeriod.start) dateA = futil.parseDateTime(a.effectivePeriod.start);
  else if (a.effectivePeriod && a.effectivePeriod.end) dateA = futil.parseDateTime(a.effectivePeriod.end);

  let dateB = undefined;
  if (b.effectiveDateTime) dateB = futil.parseDateTime(b.effectiveDateTime);
  else if (b.effectivePeriod && b.effectivePeriod.start) dateB = futil.parseDateTime(b.effectivePeriod.start);
  else if (b.effectivePeriod && b.effectivePeriod.end) dateB = futil.parseDateTime(b.effectivePeriod.end);

  if (!dateA && !dateB) return(0);
  if (!dateA) return(1);
  if (!dateB) return(-1);

  return(dateB - dateA);
}

// +--------------------------------------------+
// | getObservations(Map)ForDiagnosticReport(s) |
// +--------------------------------------------+

// These aren't super-efficient, but they allow us to stay within the mostly-generic
// rendering model of futil. I am beginning to think this wants a braoder refactor but
// that time hasn't come yet.

function getObservationsMapForDiagnosticReports(drs, byId) {

  const omap = {};

  if (drs && drs.length) {
	for (const i in drs) {
	  const observations = getObservationsForDiagnosticReport(drs[i], byId);
	  for (const j in observations) omap[observations[j].id] = observations[j];
	}
  }

  return(omap);
}

function getObservationsForDiagnosticReport(dr, byId) {

  const observations = [];

  if (dr.result && dr.result.length) {
	for (const i in dr.result) {
	  addObsRecursive(observations, dr.result[i], byId);
	}
  }

  return(observations);
}

function addObsRecursive(observations, ref, byId) {

  const o = futil.resolveReference(ref, byId);

  if (!o || o.resourceType !== "Observation") return;

  observations.push(o);

  if (o.hasMember && o.hashMember.length) {
	for (const i in o.hasMember) {
	  addObsRecursive(observations, o.hasMember[i], byId);
	}
  }
}


