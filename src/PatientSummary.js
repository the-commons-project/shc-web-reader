import * as futil from  './lib/fhirUtil.js';
import PatientSummarySection from './PatientSummarySection.js';
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
  const logoUrl = "https://images.squarespace-cdn.com/content/v1/5f9c27bd4ee0a44f8d718110/1604069613309-IEK0SQB4KXDVEKDDQLBD/CommonHealth_Logo.png?format=1500w";

  return (
     <div className={styles.container}>
       <h2>{comp.title}</h2>
       <div className={styles.dataTable}>
         <div className={styles.sectionTitle}>Patient</div>
         <div className={styles.patCell}>{futil.renderPerson(comp.subject, rmap)}</div>

       <div className={styles.sectionTitle}>Summary prepared by</div>
       <div className={styles.titleWithLogo}>  {/* Flexbox container */}
           <img src={logoUrl} alt="Issuer Logo" style={{width: '125px', marginRight: '10px'}} />
           <div>{authors}</div>
       </div>


         {renderSections()}
       </div>
     </div>
  );
}


