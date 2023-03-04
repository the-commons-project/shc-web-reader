// We expect the R4 version of DocumentReference as per:
// http://hl7.org/fhir/documentreference.html

// scanned types we understand
const imageTypes = [
  'image/jpeg',
  'image/png',
  'application/pdf'
];

// our biased view of the document world
const DocClass = {
  Unknown: 0,
  NotPayment: 1,
  Payment: 2
}

export default async function listDocs(fhir) {

  // request ... sadly not much up-front filtering
  const req = 'DocumentReference?_summary=true';
  const fhirDocs = await fhir.patient.request(req);
			  
  // secondary filtering and shaping
  const docs = [];

  for (const i in fhirDocs.entry) {

	const fhirDoc = fhirDocs.entry[i].resource;

	// check stuff at the global level
	if (!statusOK(fhirDoc)) continue;

	const dcT = docClassFromType(fhirDoc);
	const dcC = docClassFromCategory(fhirDoc);
	const dc = Math.max(dcT, dcC);

	if (dc === DocClass.NotPayment) continue;
	
	// if ok so far, see if there's a content node we can use.
	// really, this had to be an array? come on now.
	for (const j in fhirDoc.content) {

	  const fhirContent = fhirDoc.content[j];
	  
	  if (contentTypeOK(fhirContent) && contentFormatOK(fhirContent)) {
		
		addDoc(docs, fhirDoc, fhirContent, j, dc === DocClass.Payment);
		break;
	  }
	}
  }

  // sort by date descending
  docs.sort((a,b) => { return(b.sortDate - a.sortDate); });
  
  return(docs);
}

function addDoc(docs, fhirDoc, fhirContent, icontent, highPriority) {

  // console.log('>>> PASSED SEARCH:\n' + JSON.stringify(fhirDoc, null, 2));
  
  const title = (fhirDoc.description ? fhirDoc.description :
				 (fhirContent.attachment.title ? fhirContent.attachment.title :
				  (getDocAutoTitle(fhirDoc, fhirContent))));

  const sortDate = (highPriority ? new Date()
					: Date.parse(fhirDoc.Date ? fhirDoc.date : '1970-01-01'));
  
  docs.push({
	"id": fhirDoc.id,
	"title": title,
	"contentType": fhirContent.attachment.contentType,
	"contentIndex": icontent,
	"sortDate": sortDate
  });
}

function getDocAutoTitle(fhirDoc, fhirContent) {

  let title;
  
  try { title = fhirContent.attachment.contentType.split(/\/|;/)[1].toUpperCase(); }
  catch (e) { title = 'Document'; }

  if (fhirDoc.date) title += ' captured ' + fhirDoc.date;

  return(title);
}

// http://hl7.org/fhir/documentreference-definitions.html#DocumentReference.status

function statusOK(fhirDoc) {
  return(!fhirDoc.status || fhirDoc.status === 'current');
}

// http://hl7.org/fhir/documentreference-definitions.html#DocumentReference.type
//
// we actually maybe will see something here that actually identifies it as a
// payment source document! All values in http://hl7.org/fhir/ValueSet/c80-doc-typecodes
// except 48768-6 (Payment sources Document) are clinical.

function docClassFromType(fhirDoc) {

  if (!fhirDoc.type) return(DocClass.Unknown);

  for (const i in fhirDoc.type.coding) {

	const coding = fhirDoc.type.coding[i];
	
	if (coding.system &&
		coding.system === 'http://hl7.org/fhir/ValueSet/c80-doc-typecodes' &&
		coding.code) {

	  return(coding.code === '48768-6' ? DocClass.Payment : DocClass.NotPayment);
	}
  }
  
  return(DocClass.Unknown);
}

// http://hl7.org/fhir/documentreference-definitions.html#DocumentReference.category
//
// * http://loinc.org 48768-6, 64290-0, 64291-8 all are potential payment cards
// * http://hl7.org/fhir/ValueSet/document-classcodes are all clinical
// * http://hl7.org/fhir/us/core/CodeSystem/us-core-documentreference-category
//   'clinical-note' is obviously clinical
// 

function docClassFromCategory(fhirDoc) {

  if (!fhirDoc.category) return(DocClass.Unknown);

  let docClass = DocClass.Unknown;

  for (const icat in fhirDoc.category) {
	
	if (!fhirDoc.category[icat].coding) continue;
	
	for (const icode in fhirDoc.category[icat].coding) {

	  const coding = fhirDoc.category[icat].coding[icode];

	  if (!coding.system) continue;

	  if (coding.system === 'http://loinc.org') {

		if (coding.code === '48768-6' ||
			coding.code === '64290-0' ||
			coding.code === '64291-8') {
		  
		  return(DocClass.Payment);
		}
		else {
		  return(DocClass.NotPayment);
		}
	  }
	  
	  if (coding.system === 'http://hl7.org/fhir/ValueSet/document-classcodes') {
		docClass = DocClass.NotPayment;
	  }
	  
	  if (coding.system === 'http://hl7.org/fhir/us/core/CodeSystem/us-core-documentreference-category' && coding.code === 'clinical-note') {
		docClass = DocClass.NotPayment;
	  }
	}
  }
  
  return(docClass);
}

// http://hl7.org/fhir/documentreference-definitions.html#DocumentReference.content.format
//
// filter out if we see a system of http://hl7.org/fhir/ValueSet/formatcodes
// and any code other than urn:ihe:iti:xds:2017:mimeTypeSufficient (MIME type sufficient)
// because all other values are clinical.

function contentFormatOK(fhirContent) {

  if (fhirContent.format &&
	  fhirContent.format.system &&
	  fhirContent.format.system === 'http://hl7.org/fhir/ValueSet/formatcodes' &&
	  fhirContent.format.code &&
	  fhirContent.format.code !== 'urn:ihe:iti:xds:2017:mimeTypeSufficient') {

	return(false);
  }
  
  return(true);
}

function contentTypeOK(fhirContent) {

  if (!fhirContent.attachment.contentType) return(false)
  const contentType = fhirContent.attachment.contentType.toLowerCase();
  
  for (const i in imageTypes) {
	if (contentType.startsWith(imageTypes[i])) return(true);
  }

  return(false);
}

