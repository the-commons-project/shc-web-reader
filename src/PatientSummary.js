import * as futil from  './lib/fhirUtil.js';
import PatientSummarySection from './PatientSummarySection.js';
import DisplayDemoLogo from './IssuerLogo.js';
import styles from './PatientSummary.module.css';

export default function PatientSummary({ organized, dcr }) {

  // +----------------+
  // | renderSections |
  // +----------------+

  const renderSections = () => {
    return comp.section.flatMap((s) => {
      return [
        <div key={`${s.title}-title`} className={styles.sectionTitle}>
          {s.title}
        </div>,
        <div key={`${s.title}-content`} className={styles.sectionContent}>
          <PatientSummarySection s={s} rmap={rmap} dcr={dcr} />
        </div>
      ];
    });
  }


  // +-------------+
  // | Main Render |
  // +-------------+

  const comp = organized.byType.Composition[0];
  const rmap = organized.byId;

  const authors = comp.author.map((a) => futil.renderOrgOrPerson(a, rmap));

  return (
     <div className={styles.container}>
       <h2>{comp.title}</h2>
       <div className={styles.dataTable}>
         <div className={styles.sectionTitle}>Patient</div>
         <div className={styles.patCell}>{futil.renderPerson(comp.subject, rmap)}</div>

         <div className={styles.sectionTitle}>Summary prepared by</div>
         <div>{authors}</div>

         {renderSections()}
       </div>
           <DisplayDemoLogo /> {/* Add this line to display the logo */}
     </div>
  );
}



