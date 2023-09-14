
// NYI --- reuse canvas and engine for perf
// NYI --- reuse canvas and engine for perf
// NYI --- reuse canvas and engine for perf
// NYI --- reuse canvas and engine for perf

import QrScanner from 'qr-scanner';
import { b64_to_arr } from './b64.js';
import { looksLikeSHX } from './SHX.js';

export default async function getDocSHX(fhir, doc) {

  console.log(`Scanning ${doc.id} ${doc.title}`);
  
  const req = 'DocumentReference/' + encodeURIComponent(doc.id);
  const fhirDoc = await fhir.request(req);
  const fhirContent = fhirDoc.content[doc.contentIndex];

  const base64 = await getBase64(fhir, fhirContent.attachment);

  let shx = undefined;

  if (doc.contentType === 'application/pdf') {
	shx = await scanPdf(doc, base64);
  }
  else {
	shx = await scanImageUri(doc, `data:${doc.contentType};Base64,${base64}`);
  }

  return(shx);
}

async function scanPdf(doc, base64) {
  
  const PdfjsLib = await import('pdfjs-dist/build/pdf');
  const PdfjsWorker = await import('pdfjs-dist/build/pdf.worker.entry');

  return(await _scanPdf(doc, base64, PdfjsLib, PdfjsWorker));
}

async function _scanPdf(doc, base64, PdfjsLib, PdfjsWorker) {

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  PdfjsLib.GlobalWorkerOptions.workerSrc = PdfjsWorker;
  const pdf = await PdfjsLib.getDocument(b64_to_arr(base64)).promise;

  // only check first 2 pages of PDF (front or back of card)
  const pageCountMax = 2;
  const pageCount = (pdf.numPages > pageCountMax ? pageCountMax : pdf.numPages);

  for (let pageNum = 1; pageNum <= pageCount; ++pageNum) {

	const page = await pdf.getPage(pageNum);
	const viewport = page.getViewport({ scale: 1.5 });

	canvas.height = viewport.height; 
	canvas.width = viewport.width;

	await page.render({ canvasContext: ctx, viewport: viewport }).promise;
	document.getElementById('body'); // forces render

	const dataUri = canvas.toDataURL();
	const shx = await scanImageUri(doc, dataUri);
	if (shx !== undefined) return(shx);
  }

  return(undefined);
}

async function scanImageUri(doc, dataUri) {

  let shx = undefined;

  try {
	const result = await QrScanner.scanImage(dataUri, { returnDetailedScanResult: true });
	if (looksLikeSHX(result.data)) {
	  shx = result.data;
	}
	else {
	  console.warn('scanned QR but not SHX: ' + result.data);
	}
  }
  catch (err) {
	console.error(`ERR Scanning ${doc.id}: ${err.toString()}`);
  }

  return(shx);
}

async function getBase64(fhir, fhirAttachment) {

  let base64 = fhirAttachment.data;

  if (!base64) {

	if (!fhirAttachment.url || fhirAttachment.url.indexOf('Binary/') === -1) {
	  
	  console.warn(JSON.stringify(fhirAttachment, null, 2));
	  throw(new Error("Attachment needs data or Binary resource url"));
	}

	const fhirBinary = await fhir.request({
	  url: fhirAttachment.url,
	  headers: { Accept: 'application/fhir+json' }
	});

	base64 = fhirBinary.data;
  }

  return(base64);
}


