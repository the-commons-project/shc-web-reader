
import React from 'react';
import * as ftabs from './lib/fhirTables.js';
import styles from './PatientSummary.module.css';
import { useLanguage } from './lib/LanguageContext';
import { useDocumentModal } from './DocumentModalContext';

export default function Collection({ organized, dcr }) {

  const { t } = useLanguage();
  const { showDocuments } = useDocumentModal();

  // +-------------+
  // | Main Render |
  // +-------------+
  
  const tableState = {};
  for (const i in organized.all) ftabs.addResource(organized.all[i], tableState, organized);
  const jsx = ftabs.renderJSX(tableState, styles.fhirTable, organized, { dcr, loc: t, doc: showDocuments });
  
  return(<>{jsx}</>);
}

  
