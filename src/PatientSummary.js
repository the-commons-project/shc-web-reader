import React, { useState } from 'react';
import * as futil from './lib/fhirUtil.js';
import PatientSummarySection from './PatientSummarySection.js';
import DocumentList from './DocumentList.js';
import DocumentModal from './DocumentModal.js';
import { extractDocumentsFromBundle } from './lib/documentUtils.js';
import styles from './PatientSummary.module.css';
import IFrameSandbox from './IFrameSandbox.js';
import DOMPurify from 'dompurify';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { useLanguage } from './lib/LanguageContext';

export default function PatientSummary({ organized, dcr }) {
  
  const { t } = useLanguage();

  // +----------------+
  // | Document State |
  // +----------------+
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [collapsedBlocks, setCollapsedBlocks] = useState({});

  // +---------+
  // | Actions |
  // +---------+

  const toggleBlockCollapse = (blockKey) => {
    setCollapsedBlocks(prev => ({
      ...prev,
      [blockKey]: !prev[blockKey]
    }));
  };

  const handleNavigate = (direction) => {
    const idx = documents.findIndex(d => d.id === selectedDocument?.id);
    const newIdx = direction === 'next' ? idx + 1 : idx - 1;
    if (newIdx >= 0 && newIdx < documents.length) {
      setSelectedDocument(documents[newIdx]);
    }
  };

  // +------------------------+
  // | renderCollapsibleBlock |
  // +------------------------+
  
  const renderCollapsibleBlock = (blockKey, title, content, keyPrefix) => {
	
    const isCollapsed = collapsedBlocks[blockKey];

    return (
      <React.Fragment key={keyPrefix}>
        <div
          className={isCollapsed ? styles.blockTitleCollapsed : styles.blockTitle}
          onClick={() => toggleBlockCollapse(blockKey)}
        >
          <span className={styles.blockTitleText}>{title}</span>
          <span className={styles.collapseIcon}>
            {isCollapsed ? <ExpandMoreIcon fontSize="small" /> : <ExpandLessIcon fontSize="small" />}
          </span>
        </div>
        <div className={isCollapsed ? styles.blockContentCollapsed : styles.blockContent}>
          {!isCollapsed && content}
        </div>
      </React.Fragment>
    );
  };

  // +-------------+
  // | Main Render |
  // +-------------+
  
  // Extract embedded documents from the bundle
  const documents = extractDocumentsFromBundle(organized, t);

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

        {/* Documents Block */}
        {documents && documents.length > 0 && renderCollapsibleBlock(
          'Documents',
          `${t('documents', 'Documents')} (${documents.length})`,
          <DocumentList
            documents={documents}
            onViewDocument={(doc) => {
              setSelectedDocument(doc);
              setModalOpen(true);
            }}
          />,
          'row-documents'
        )}

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

      <DocumentModal
        document={selectedDocument}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        documents={documents}
        onNavigate={handleNavigate}
      />
    </div>
  );
}
