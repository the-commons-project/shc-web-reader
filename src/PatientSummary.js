import React from 'react';
import * as futil from './lib/fhirUtil.js';
import PatientSummarySection from './PatientSummarySection.js';
import styles from './PatientSummary.module.css';
import IFrameSandbox from './IFrameSandbox.js';
import DOMPurify from 'dompurify';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { useLanguage } from './lib/LanguageContext';

export default function PatientSummary({ organized, dcr }) {
  
  const { t } = useLanguage();

  // +------------------------+
  // | renderCollapsibleBlock |
  // +------------------------+

  const renderCollapsibleBlock = (blockKey, title, content, keyPrefix) => {

    const handleToggle = (e) => {
      const titleEl = e.currentTarget;
      titleEl.classList.toggle(styles.collapsed);
      titleEl.nextElementSibling.classList.toggle(styles.collapsed);
      titleEl.nextElementSibling.nextElementSibling.classList.toggle(styles.collapsed);
    };

    return (
      <React.Fragment key={keyPrefix}>
        <div
          className={styles.blockTitle}
          onClick={handleToggle}
        >
          <span className={styles.blockTitleText}>{title}</span>
          <span className={styles.collapseIcon}>
            <span className={styles.iconExpand}><ExpandMoreIcon fontSize="small" /></span>
            <span className={styles.iconCollapse}><ExpandLessIcon fontSize="small" /></span>
          </span>
        </div>
        <div className={styles.blockContent}>
          {content}
        </div>
        <div className={styles.blockContentEmpty}></div>
      </React.Fragment>
    );
  };

  // +-------------+
  // | Main Render |
  // +-------------+
  
  const comp = organized.byType.Composition?.[0] || {};
  const rmap = organized.byId;

  const authors = (comp.author || []).map((a) => futil.renderGenerator(a, rmap));
  const compositionDivTextContent = comp.text && comp.text.div ? comp.text.div : '';

  return (
    <div className={styles.container}>
      <h2>{comp.title}</h2>
      <div className={styles.dataTable}>
        {/* Patient Block */}
        {renderCollapsibleBlock(
          'Patient',
          t('patient'),
          <span className={styles.patCell}>{futil.renderPerson(comp.subject, rmap)}</span>,
          'row-patient'
        )}

        {/* Dynamic Composition Sections with i18n */}
        {(comp.section || []).map((s, index) => {
          const codingCode = s.code ? s.code.coding[0].code : "";
          const translationKey = `ipsSection_${codingCode.replaceAll('-', '_')}`;

          return renderCollapsibleBlock(
            s.title,
            t(translationKey, s.title),
            <PatientSummarySection s={s} rmap={rmap} dcr={dcr} />,
            `row-section-${index}`
          );
        })}

        {/* Composition Block */}
        {compositionDivTextContent && renderCollapsibleBlock(
          'Composition',
          t('composition'),
          <IFrameSandbox html={DOMPurify.sanitize(compositionDivTextContent)} />,
          'row-composition'
        )}

        {/* Summary By Block */}
        {renderCollapsibleBlock(
          'SummaryBy',
          t('summaryPreparedBy'),
          authors,
          'row-summaryby'
        )}
      </div>

    </div>
  );
}
