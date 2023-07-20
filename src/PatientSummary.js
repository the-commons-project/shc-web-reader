import * as futil from  './lib/fhirUtil.js';
import * as ftabs from './lib/fhirTables.js';
import IFrameSandbox from './IFrameSandbox.js';

import styles from './PatientSummary.module.css';

export default function PatientSummary({ organized }) {

  // +----------------+
  // | renderSections |
  // | renderSection  |
  // +----------------+

  const renderSections = () => {
	return(comp.section.map((s) => renderSection(s)));
  }

  const renderSection = (s) => {

	const narrativeType = (s.text && s.text.div && s.text.status ?
						   s.text.status : "empty");

	const haveStructured = (s.entry && s.entry.length > 0);

	const useNarrative = ((narrativeType === "additional") ||
						  (narrativeType === "extensions") ||
						  (narrativeType === "generated" && !haveStructured));

	let content = undefined;
	
	if (useNarrative) {
	  content = <IFrameSandbox html={s.text.div} />;
	}
	else if (haveStructured) {
	  const tableState = {};
	  for (const i in s.entry) ftabs.addResource(rmap[s.entry[i].reference], tableState, rmap);
	  content = ftabs.renderJSX(tableState, styles.fhirTable, rmap);
	}
	else {
	  content = <div>no data</div>;
	}

	return(
	  <tr key={ s.title }>
		<th>{ s.title }</th>
		<td>{ content }</td>
	  </tr>
	);
  }

  // +-------------+
  // | Main Render |
  // +-------------+
  
  const comp = organized.byType.Composition[0];
  const rmap = organized.byId;

  const authors = comp.author.map((a) => futil.renderPerson(a, rmap));
  
  const sections = renderSections();
  
  return(
    <div className={styles.container}>
	  <h1>{comp.title}</h1>
	  <table className={styles.dataTable}>
		<tbody>
		  <tr>
			<th>Patient</th>
			<td>{ futil.renderPerson(comp.subject, rmap) }</td>
		  </tr>
		  <tr>
			<th>Summary prepared by</th>
			<td>{ authors }</td>
		  </tr>
		  { sections }
		</tbody>
	  </table>
	</div>
  );

}



