
// +--------------+
// | ContentTypes |
// +--------------+

const DOCINFO = {
  pdf: { type: 'pdf', score: 100, ext: 'pdf' },
  image: { type: 'image', score: 90, ext: null }, // ext generated dynamically
  html: { type: 'html', score: 80, ext: 'html' },
  rtf: { type: 'rtf', score: 70, ext: 'rtf' },
  text: { type: 'text', score: 60, ext: 'txt' },
  unknown: { type: 'unknown', score: 0, ext: 'bin' }
};
  
export function getDocInfoFromContentType(contentType) {

  const norm = normalizeContentType(contentType);
  
  if (!norm) return(DOCINFO.unknown);

  if (norm === 'application/pdf') return(DOCINFO.pdf);
  if (norm === 'text/html') return(DOCINFO.html);
  if (norm === 'text/plain') return(DOCINFO.text);
  
  const normParts = norm.split("/");
  
  if (normParts[1] === 'rtf') return(DOCINFO.rtf);
  if (normParts[0] === 'image') return({ type: DOCINFO.image.type, score: DOCINFO.image.score, ext: normParts[1] });
	
  return(DOCINFO.unknown);
}

export function getExtensionFromContentType(contentType) {
  return(getDocInfoFromContentType(contentType).ext);
}

export function getDocTypeFromContentType(contentType) {
  return(getDocInfoFromContentType(contentType).type);
}

// +-------------+
// | Attachments |
// +-------------+

export function getBestAttachment(r) {
  switch (r.resourceType) {
	case "DocumentReference": return(getBestDocRefAttachment(r));
	case "DiagnosticReport": return(getBestDiagnosticReportAttachment(r));
	default: return(null);
  }
}

function getBestDocRefAttachment(docref) {

  if (!docref.content) return(null); // against spec but oh well
  
  const contents = (Array.isArray(docref.content) ? docref.content : [docref.content]);
  const attachmentScores = contents.map((c) => {
	return({
	  attachment: c.attachment,
	  score: getDocInfoFromContentType(c.attachment.contentType).score,
	  external: (c.attachment.data ? 1 : 0)
	});
  });

  return(getBestAttachmentHelper(attachmentScores));
}

function getBestDiagnosticReportAttachment(drpt) {

  if (!drpt.presentedForm) return(null); 
  
  const forms = (Array.isArray(drpt.presentedForm) ? drpt.presentedForm : [drpt.presentedForm]);
  const attachmentScores = forms.map((f) => {
	return({
	  attachment: f,
	  score: getDocInfoFromContentType(f.contentType).score,
	  external: (f.data ? 1 : 0)
	});
  });

  return(getBestAttachmentHelper(attachmentScores));
}

function getBestAttachmentHelper(attachmentScores) {

  attachmentScores.sort((a, b) => {
	const cmp = b.score - a.score;
	if (cmp !== 0) return(cmp);
	return(b.external - a.external);
  });

  return(attachmentScores[0].attachment);
}

// +----------+
// | getTitle |
// +----------+

export function getTitle(r) {

  const attachment = getBestAttachment(r);
  if (attachment?.title) return(attachment.title);
  
  switch (r.resourceType) {
	  
	case "DocumentReference":
	  if (r.description) return(r.description);
	  if (r.type?.text) return(r.type.text);
	  if (r.type?.coding?.[0]?.display) return(r.type.coding[0].display);
	  if (r.category?.[0]?.text) return(r.category[0].text);
	  if (r.category?.[0]?.coding?.[0]?.display) return(r.category[0].coding[0].display);
	  break;

	case "DiagnosticReport":
	  // NYI
	  return("NYI");

	default:
	  break;
  }
  
  return('Document');
}

// +-------+
// | Files |
// +-------+

export function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  // parseFloat strips trailing zeros from toFixed output (e.g., "1.0" -> 1, "2.5" -> 2.5)
  return(parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]);
}

// +---------+
// | Helpers |
// +---------+

function normalizeContentType(contentType) {
  return(contentType?.split(';')[0]?.trim()?.toLowerCase());
}

