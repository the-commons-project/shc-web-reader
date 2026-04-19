// DocumentModalContext
//
// Provides app-wide document modal functionality via React context.
// Use the useDocumentModal() hook to get showDocuments(), then call:
//
//   showDocuments(documents, initialIndex)
//
// where each document in the array has the shape:
//
//   {
//     title:       string    // displayed in the modal header
//     contentType: string    // MIME type, e.g. "application/pdf", "image/png",
//                            //   "text/html", "text/rtf", "text/plain"
//     base64Data:  string    // base64-encoded content
//   }
//
// initialIndex (optional, default 0) sets which document opens first.
// Prev/Next navigation is shown only when the array has more than one document.

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Button,
  Typography,
  CircularProgress
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DownloadIcon from '@mui/icons-material/Download';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import * as pdfjs from 'pdfjs-dist';
import { b64_to_arr, base64ToDataUrl, base64ToBlob } from './lib/b64.js';
import { getDocTypeFromContentType, getExtensionFromContentType } from './lib/fhirDocs.js';
import styles from './DocumentModal.module.css';
import DOMPurify from 'dompurify';

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

// +------------------+
// | downloadDocument |
// +------------------+

function todayForFilename() {
  const now = new Date();
  let month = '' + (now.getMonth() + 1);
  if (month.length < 2) month = '0' + month;
  let day = '' + now.getDate();
  if (day.length < 2) day = '0' + day;
  return([now.getFullYear(), month, day].join('-'));
}

function downloadDocument(doc) {
  if (!doc || !doc.base64Data || !doc.contentType) {
    console.error('Invalid document for download');
    return;
  }
  const blob = base64ToBlob(doc.base64Data, doc.contentType);
  const url = window.URL.createObjectURL(blob);
  const link = window.document.createElement('a');
  const ext = getExtensionFromContentType(doc.contentType);
  const sanitizedTitle = (doc.title || 'document').replace(/[^a-z0-9]/gi, '_').substring(0, 50);
  link.href = url;
  link.download = `${todayForFilename()}_${sanitizedTitle}.${ext}`;
  window.document.body.appendChild(link);
  link.click();
  window.document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

// +-------------------------+
// | DocumentModalContext    |
// +-------------------------+

const DocumentModalContext = React.createContext(null);

export function useDocumentModal() {
  return React.useContext(DocumentModalContext);
}

// +-------------------------+
// | DocumentModalProvider   |
// +-------------------------+

export function DocumentModalProvider({ children }) {

  const [docs, setDocs] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const showDocuments = useCallback((documents, initialIndex = 0) => {
    setDocs(documents);
    setCurrentIndex(initialIndex);
  }, []);

  const handleClose = () => setDocs(null);

  return (
    <DocumentModalContext.Provider value={{ showDocuments }}>
      {children}
      <DocumentModalDialog
        documents={docs}
        currentIndex={currentIndex}
        setCurrentIndex={setCurrentIndex}
        onClose={handleClose}
      />
    </DocumentModalContext.Provider>
  );
}

// +------------------------+
// | DocumentModalDialog    |
// +------------------------+

function DocumentModalDialog({ documents, currentIndex, setCurrentIndex, onClose }) {

  const open = !!documents && documents.length > 0;
  const document = open ? documents[currentIndex] : null;
  const docType = document ? getDocTypeFromContentType(document.contentType) : null;
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < (documents?.length ?? 0) - 1;

  const [pdfDoc, setPdfDoc] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1.0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rtfHtml, setRtfHtml] = useState(null);
  const canvasRef = useRef(null);
  const renderTaskRef = useRef(null);

  // Load document
  useEffect(() => {
    if (!document || !open) return;

    let cancelled = false;
    setLoading(true);
    setError(null);
    setRtfHtml(null);

    const loadDocument = async () => {
      try {
        if (docType === 'pdf') {
          const pdfData = b64_to_arr(document.base64Data);
          const pdf = await pdfjs.getDocument({ data: pdfData }).promise;

          if (!cancelled) {
            setPdfDoc(pdf);
            setTotalPages(pdf.numPages);
            setCurrentPage(1);
            setScale(1.0);
            setLoading(false);
          }
        } else if (docType === 'rtf') {
          const rtfString = atob(document.base64Data);
          const buffer = new ArrayBuffer(rtfString.length);
          const view = new Uint8Array(buffer);
          for (let i = 0; i < rtfString.length; i++) {
            view[i] = rtfString.charCodeAt(i);
          }

          const { RTFJS } = await import('rtf.js');
          RTFJS.loggingEnabled(false);
          const rtfDoc = new RTFJS.Document(buffer);
          const elements = await rtfDoc.render();

          const container = window.document.createElement('div');
          elements.forEach(el => container.appendChild(el));

          container.querySelectorAll('a[href]').forEach(a => {
            a.removeAttribute('href');
          });

          const html = DOMPurify.sanitize(container.innerHTML, {
            ADD_TAGS: ['style'],
            ADD_ATTR: ['style', 'class']
          });

          if (!cancelled) {
            setPdfDoc(null);
            setRtfHtml(html);
            setLoading(false);
          }
        } else {
          if (!cancelled) {
            setPdfDoc(null);
            setLoading(false);
          }
        }
      } catch (err) {
        console.error('Error loading document:', err);
        if (!cancelled) {
          setError('Failed to load document: ' + err.message);
          setLoading(false);
        }
      }
    };

    loadDocument();

    return () => {
      cancelled = true;
      if (pdfDoc) pdfDoc.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [document, open]);

  // Render PDF page
  const renderPage = useCallback(async () => {
    if (!pdfDoc || !canvasRef.current) return;

    if (renderTaskRef.current) {
      renderTaskRef.current.cancel();
    }

    try {
      const page = await pdfDoc.getPage(currentPage);
      const viewport = page.getViewport({ scale });

      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      renderTaskRef.current = page.render({ canvasContext: context, viewport });
      await renderTaskRef.current.promise;
    } catch (err) {
      if (err.name !== 'RenderingCancelledException') {
        console.error('Error rendering page:', err);
      }
    }
  }, [pdfDoc, currentPage, scale]);

  useEffect(() => {
    renderPage();
  }, [renderPage]);

  // Cleanup on close
  useEffect(() => {
    if (!open && pdfDoc) {
      pdfDoc.destroy();
      setPdfDoc(null);
    }
  }, [open, pdfDoc]);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        if (docType === 'pdf' && currentPage > 1) {
          setCurrentPage(p => p - 1);
        } else if (hasPrev) {
          setCurrentIndex(i => i - 1);
        }
      } else if (e.key === 'ArrowRight') {
        if (docType === 'pdf' && currentPage < totalPages) {
          setCurrentPage(p => p + 1);
        } else if (hasNext) {
          setCurrentIndex(i => i + 1);
        }
      } else if (e.key === '+' || e.key === '=') {
        setScale(s => Math.min(s + 0.25, 3.0));
      } else if (e.key === '-') {
        setScale(s => Math.max(s - 0.25, 0.5));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, document, currentPage, totalPages, hasPrev, hasNext, onClose, setCurrentIndex]);

  const handleDownload = () => {
    if (document) downloadDocument(document);
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className={styles.loadingContainer}>
          <CircularProgress />
          <Typography variant="body2" className={styles.loadingText}>
            Loading document...
          </Typography>
        </div>
      );
    }

    if (error) {
      return (
        <div className={styles.errorContainer}>
          <ErrorOutlineIcon className={styles.errorIcon} />
          <Typography variant="body1" className={styles.errorText}>
            {error}
          </Typography>
          <Button variant="contained" startIcon={<DownloadIcon />} onClick={handleDownload}>
            Download Instead
          </Button>
        </div>
      );
    }

    if (docType === 'pdf') {
      return (
        <div className={styles.pdfContainer}>
          <canvas ref={canvasRef} className={styles.pdfCanvas} />
        </div>
      );
    }

    if (docType === 'image') {
      return (
        <div className={styles.imageContainer}>
          <img
            src={base64ToDataUrl(document.base64Data, document.contentType)}
            alt={document.title}
            className={styles.image}
            style={{ transform: `scale(${scale})` }}
          />
        </div>
      );
    }

    if (docType === 'html') {
      let htmlContent;
      try {
        htmlContent = atob(document.base64Data);
      } catch (e) {
        console.error('Failed to decode HTML content:', e);
        return (
          <div className={styles.errorContainer}>
            <Typography variant="body1">Failed to decode HTML content</Typography>
          </div>
        );
      }

      const sanitizedHtml = '<base target="_blank">' + DOMPurify.sanitize(htmlContent, {
        ADD_TAGS: ['style'],
        ADD_ATTR: ['style', 'class']
      });

      return (
        <div className={styles.htmlContainer}>
          <iframe
            srcDoc={sanitizedHtml}
            title={document.title}
            className={styles.htmlIframe}
            sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox"
          />
        </div>
      );
    }

    if (docType === 'rtf' && rtfHtml) {
      return (
        <div className={styles.htmlContainer}>
          <iframe
            srcDoc={'<base target="_blank">' + rtfHtml}
            title={document.title}
            className={styles.htmlIframe}
            sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox"
          />
        </div>
      );
    }

    if (docType === 'text') {
      let textContent;
      try {
        textContent = atob(document.base64Data);
      } catch (e) {
        console.error('Failed to decode text content:', e);
        return (
          <div className={styles.errorContainer}>
            <Typography variant="body1">Failed to decode text content</Typography>
          </div>
        );
      }

      return (
        <div className={styles.textContainer}>
          <pre className={styles.textContent}>{textContent}</pre>
        </div>
      );
    }

    return (
      <div className={styles.errorContainer}>
        <Typography variant="body1">
          Unsupported document type: {document?.contentType}
        </Typography>
      </div>
    );
  };

  if (!document) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{ className: styles.dialogPaper }}
    >
      <DialogTitle className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.titleSection}>
            <Typography variant="h6" className={styles.title}>
              {document.title}
            </Typography>
            {documents.length > 1 && (
              <Typography variant="body2" className={styles.docCount}>
                {currentIndex + 1} of {documents.length}
              </Typography>
            )}
          </div>
          <div className={styles.headerActions}>
            {hasPrev && (
              <IconButton onClick={() => setCurrentIndex(i => i - 1)} title="Previous document">
                <NavigateBeforeIcon />
              </IconButton>
            )}
            {hasNext && (
              <IconButton onClick={() => setCurrentIndex(i => i + 1)} title="Next document">
                <NavigateNextIcon />
              </IconButton>
            )}
            <IconButton onClick={handleDownload} title="Download">
              <DownloadIcon />
            </IconButton>
            <IconButton onClick={onClose} title="Close">
              <CloseIcon />
            </IconButton>
          </div>
        </div>
      </DialogTitle>

      <DialogContent className={styles.content}>
        {renderContent()}
      </DialogContent>

      {!loading && !error && (docType === 'pdf' || docType === 'image') && (
        <div className={styles.controls}>
          {docType === 'pdf' && totalPages > 1 && (
            <div className={styles.pageControls}>
              <IconButton onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage <= 1} size="small">
                <NavigateBeforeIcon />
              </IconButton>
              <Typography variant="body2" className={styles.pageInfo}>
                Page {currentPage} of {totalPages}
              </Typography>
              <IconButton onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage >= totalPages} size="small">
                <NavigateNextIcon />
              </IconButton>
            </div>
          )}
          <div className={styles.zoomControls}>
            <IconButton onClick={() => setScale(s => Math.max(s - 0.25, 0.5))} size="small" title="Zoom out">
              <ZoomOutIcon />
            </IconButton>
            <Typography variant="body2" className={styles.zoomInfo}>
              {Math.round(scale * 100)}%
            </Typography>
            <IconButton onClick={() => setScale(s => Math.min(s + 0.25, 3.0))} size="small" title="Zoom in">
              <ZoomInIcon />
            </IconButton>
          </div>
        </div>
      )}
    </Dialog>
  );
}
