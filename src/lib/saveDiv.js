
import html2canvas from 'html2canvas';

// +---------------+
// | saveDivToFile |
// +---------------+

export async function saveDivToFile(div, baseName) {

  const imageInfo = await divToImage(div);
  
  const link = document.createElement("a");
  link.href = imageInfo.url;
  link.download = getFilename(baseName, imageInfo.extension);

  link.click();
}

// +---------------+
// | saveDivToFHIR |
// +---------------+

export async function saveDivToFHIR(fhir, div, baseName) {

  const imageInfo = await divToImage(div);
  const now = new Date().toISOString();

  let patientReference = fhir.patient.id;
  if (!patientReference.startsWith("Patient/")) {
	patientReference = "Patient/" + patientReference;
  }

  let userReference = fhir.user.fhirUser;
  if (!userReference.startsWith(fhir.user.resourceType)) {
	userReference = fhir.user.resourceType + "/" + userReference;
  }

  const documentReference = {
	"resourceType": "DocumentReference",
	"status": "current",
	"docStatus": "final",
	"type": { "text": "SMART Health (" + baseName + ")" },
	"subject": {
	  "type": "Patient",
	  "reference": patientReference
	},
	"author": [ {
	  "type": fhir.user.resourceType,
	  "reference": userReference
	} ],
	"context": { "period": { "start": now  } },
	"content": {
	  "attachment": {
		"contentType": imageInfo.contentType,
		"data": imageInfo.base64,
		"title": getFilename(baseName, imageInfo.extension),
		"width": imageInfo.width,
		"height": imageInfo.height,
		"creation": now
	  }
	}
  }

  try {
	fhir.create(documentReference).then((response) => {
	  alert("View saved to patient record");
	  console.log("DocumentReference ID: " + response.id);
	});
  }
  catch (e) {
	alert(e);
  }

}

// +---------+
// | Helpers |
// +---------+

async function divToImage(div) {
  const canvas = await html2canvas(div);

  const info = {
	url: canvas.toDataURL("image/jpeg", 1.0),
	width: canvas.width,
	height: canvas.height
  };

  if (!info.url.startsWith("data:")) return(info);

  // we're a little lazy about optional components because we know
  // that toDataURL returns the media type and base64 tag

  const ichSemi = info.url.indexOf(";");
  const ichComma = info.url.indexOf(",");

  info.contentType = info.url.substring(5, ichSemi);
  info.extension = (info.contentType === "image/png" ? "png" : "jpg");
  info.base64 = info.url.substring(ichComma + 1);

  return(info);
}

function getFilename(baseName, ext) {
  return(todayForFilename() + ' ' + baseName + '.' + ext);
}

function todayForFilename() {

  const now = new Date();
  
  let month = '' + (now.getMonth() + 1);
  if (month.length < 2) month = '0' + month;

  let day = '' + now.getDate();
  if (day.length < 2) day = '0' + day;

  return([now.getFullYear(), month, day].join('-'));
}


