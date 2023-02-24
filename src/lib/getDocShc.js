
// NYI --- reuse canvas and engine for perf
// NYI --- reuse canvas and engine for perf
// NYI --- reuse canvas and engine for perf
// NYI --- reuse canvas and engine for perf

import QrScanner from 'qr-scanner';
import * as PdfjsLib from 'pdfjs-dist/build/pdf';
import PdfjsWorker from 'pdfjs-dist/build/pdf.worker.entry';

export default async function getDocShc(fhir, doc) {

  console.log(`Scanning ${doc.id} ${doc.title}`);
  
  const req = 'DocumentReference/' + encodeURIComponent(doc.id);
  const fhirDoc = await fhir.request(req);
  const fhirContent = fhirDoc.content[doc.contentIndex];

  const base64 = await getBase64(fhir, fhirContent.attachment);

  let shc = undefined;

  if (doc.contentType === 'application/pdf') {
	shc = await scanPdf(doc, base64);
  }
  else {
	shc = await scanImageUri(doc, `data:${doc.contentType};Base64,${base64}`);
  }

  return(shc);
}

async function scanPdf(doc, base64) {

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  PdfjsLib.GlobalWorkerOptions.workerSrc = PdfjsWorker;
  const pdf = await PdfjsLib.getDocument(uint8ArrayFromBase64(base64)).promise;

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
	const shc = await scanImageUri(doc, dataUri);
	if (shc !== undefined) return(shc);
  }

  return(undefined);
}

async function scanImageUri(doc, dataUri) {

  let shc = undefined;

  try {
	const result = await QrScanner.scanImage(dataUri, { returnDetailedScanResult: true });
	shc = result.data;
  }
  catch (err) {
	console.error(`ERR Scanning ${doc.id}: ${err.toString()}`);
  }

  return(shc);
}

async function getBase64(fhir, fhirAttachment) {

  let base64 = fhirAttachment.data;

  if (!base64) {

	if (!fhirAttachment.url || !fhirAttachment.url.startsWith("Binary")) {
	  throw(new Error("Attachment needs data or Binary resource url"));
	}

	base64 = await fhir.req(fhirAttachment.url).data;
  }

  return(base64);
}

function uint8ArrayFromBase64(base64) {
  const raw = window.atob(base64);
  const arr = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; ++i) arr[i] = raw.charCodeAt(i);
  return(arr);
}

