import React, { useState } from 'react';
import DocumentList from './DocumentList.js';
import DocumentModal from './DocumentModal.js';

/**
 * Standalone documents section that can be used for any bundle type.
 * Extracts and displays DocumentReference and DiagnosticReport resources with embedded data.
 */
export default function DocumentsSection({ documents }) {
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Don't render if no documents
  if (!documents || documents.length === 0) {
    return null;
  }

  const handleNavigate = (direction) => {
    const idx = documents.findIndex(d => d.id === selectedDocument?.id);
    const newIdx = direction === 'next' ? idx + 1 : idx - 1;
    if (newIdx >= 0 && newIdx < documents.length) {
      setSelectedDocument(documents[newIdx]);
    }
  };

  return (
	<>
      <DocumentList
        documents={documents}
        onViewDocument={(doc) => {
          setSelectedDocument(doc);
          setModalOpen(true);
        }}
      />
      <DocumentModal
        document={selectedDocument}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        documents={documents}
        onNavigate={handleNavigate}
      />
    </>
  );
}
