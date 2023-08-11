import * as futil from  './lib/fhirUtil.js';
import PatientSummarySection from './PatientSummarySection.js';

import styles from './PatientSummary.module.css';

export default function PatientSummary({ organized, dcr }) {

  // +----------------+
  // | renderSections |
  // +----------------+

  const renderSections = () => {
	return(comp.section.map((s) => {
	  return(
		<tr key={ s.title }>
		  <th>{ s.title }</th>
		  <td><PatientSummarySection s={s} rmap={rmap} dcr={dcr} /></td>
		</tr>
	  );
	}));
  }

  // +-------------+
  // | Main Render |
  // +-------------+
  
  const comp = organized.byType.Composition[0];
  const rmap = organized.byId;

  const authors = comp.author.map((a) => futil.renderPerson(a, rmap));
  
  return(
    <div className={styles.container}>
	  <h2>{comp.title}</h2>
	  <table className={styles.dataTable}>
		<tbody>
		  <tr>
			<th>Patient</th>
			<td className={styles.patCell}>{ futil.renderPerson(comp.subject, rmap) }</td>
		  </tr>
		  <tr>
			<th>Summary prepared by</th>
			<td>{ authors }</td>
		  </tr>
		  { renderSections() }
		</tbody>
	  </table>
	</div>
  );

}



