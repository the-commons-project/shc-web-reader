
//
// Primary method is verifySHX which takes an incoming SHC or SHL string
// and teases it all apart. Return value is a JSON object with the
// following structure.
//
// "shxStatus" is the only element guaranteed to be present. A status of "ok"
// means that we were able to process the outer SHC/SHL to get to the bundles
// inside (i.e., there is at least one element in the "bundles" array). It does
// NOT mean that certificates are valid or that the bundles are readable --- the
// caller has to look at the "certStatus" and "fhir" fields in each bundle for that
//
// {
//   "shxStatus": "ok" | "error" | "need_passcode" | "expired",
//   "reasons": [ error strings for humans ],
//
//   "bundles": [
//
//     "fhir": (JSON bundle),
//     "certStatus": "cert_valid" | "invalid" | "none",
//
//     (Messages if relevant:)
//	   "reasons": [ error strings for humans ],
//	   "errors": [ error objects (not for humans) ],
//	   "warnings": [ warning objects (not for humans) ],
//
//     (Cert details if relevant:)
//     "issuerISS": (issuer base url string),
//     "issuerName": (issuer name string),
//     "issuerURL": (issuer human-visitable url),
//     "issueDate": (issued Date),
//     "supportsRevocation": (true iff cert CAN BE, not IS, revoked)
//    ]
// }
//
// The result object also supports a few convenience methods to 
// consolidate some common logic and keep things cleaner:
//
//    * On each element in the "bundles" array:
//        - contentOK (fhir && certStatus !== CERT_STATUS_INVALID)
//        - certValid (certStatus === CERT_STATUS_VALID)
//        - isVerifiable (certStatus !== CERT_STATUS_NONE)
//

import { verify, Directory } from 'smart-health-card-decoder'
import { compactDecrypt } from 'jose';
import { b64u_to_str, b64u_to_arr, arr_to_str } from './b64.js';

// +------------------+
// | Public Constants |
// +------------------+

export const SHX_STATUS_OK = "ok";
export const SHX_STATUS_ERROR = "error";
export const SHX_STATUS_NEED_PASSCODE = "need_passcode";
export const SHX_STATUS_EXPIRED = "expired";

export const CERT_STATUS_VALID = "valid";
export const CERT_STATUS_INVALID = "invalid";
export const CERT_STATUS_NONE = "none";

// +-------------------+
// | Private Constants |
// +-------------------+

const SHC_HEADER = 'shc:/';
const SHL_HEADER = 'shlink:/';

const SHL_RECIPIENT = 'SMART Health Card Web Reader';

const SHC_CONTENTTYPE = 'application/smart-health-card';

const DIRECTORY_PATHS = [
  'https://raw.githubusercontent.com/the-commons-project/vci-directory/main/logs/vci_snapshot.json',
  'https://raw.githubusercontent.com/seanno/shc-demo-data/main/keystore/directory.json'
];

// +--------------+
// | looksLikeSH* |
// +--------------+

export function looksLikeSHX(input) {
  return(looksLikeSHC(input) || looksLikeSHL(input));
}

function looksLikeSHC(input) {
  return(input.startsWith(SHC_HEADER));
}

function looksLikeSHL(input) {
  return(input.startsWith(SHL_HEADER) || input.indexOf('#' + SHL_HEADER) !== -1);
}

// +-----------+
// | verifySHX |
// +-----------+

export async function verifySHX(shx, passcode = undefined) {
  try {
	return(await _verifySHX(shx, passcode));
  }
  catch (err) {

	if (err.message === "Manifest: 401") {
	  const reasons = (passcode ? "passcode required" : "passcode incorrect");
	  return(status(SHX_STATUS_NEED_PASSCODE, reasons));
	}

	const reasons = (err ? err.toString() : "unexpected");
	return(status(SHX_STATUS_ERROR, reasons));
  }
}

async function _verifySHX(shx, passcode) {

  let target = shx.trim();
  if (looksLikeSHL(target)) {
	
	target = await resolveSHL(target, passcode);

	if (target === SHX_STATUS_NEED_PASSCODE) {
	  const reasons = (passcode ? "passcode required" : "passcode incorrect");
	  return(status(SHX_STATUS_NEED_PASSCODE, reasons));
	}

	if (target === SHX_STATUS_EXPIRED) {
	  return(status(SHX_STATUS_EXPIRED, "expired"));
	}
  }

  const dir = await getDirectory();
  const result = await verify(target, dir);

  return(addVerifiableBundle(status(), result));
}

var _verifyDir = undefined;

async function getDirectory() {
  
  if (_verifyDir) return(_verifyDir);

  const dirs = [];
  for (const i in DIRECTORY_PATHS) {
	dirs.push(await Directory.create(DIRECTORY_PATHS[i]));
  }

  _verifyDir = Directory.create(dirs);
  return(_verifyDir);
}

// +------------+
// | resolveSHL |
// +------------+

export async function resolveSHL(shl, passcode) {

  // 1. Decode the link body
  const shlPayload = decodeSHL(shl);

  // 1.5 Check expiration and passcode
  
  if (shlPayload.flag && shlPayload.flag.indexOf('P') !== -1 && !passcode) {
	return(SHX_STATUS_NEED_PASSCODE);
  }

  if (shlPayload.exp) {
	const expires = new Date(shlPayload.exp * 1000);
	const now = new Date();
	if (expires < now) return(SHX_STATUS_EXPIRED);
  }

  // 2. Fetch the manifest
  const shlManifest = await fetchSHLManifest(shlPayload, passcode);
  const shlFiles = shlManifest.files;

  let i;
  for (i = 0; i < shlFiles.length; ++i) {
	if (shlFiles[i].contentType === SHC_CONTENTTYPE) break;
  }

  if (i === shlFiles.length) {
	console.error('No file found with content type ' + SHC_CONTENTTYPE);
	return(undefined);
  }

  // 3. Fetch and decode the encrypted content
  const shlEncrypted = await fetchSHLContent(shlFiles[i]);
  
  const key = b64u_to_arr(shlPayload.key);
  const decrypted = await compactDecrypt(shlEncrypted, key);
  const shlJson = JSON.parse(arr_to_str(decrypted.plaintext));

  if (!shlJson.verifiableCredential ||
	  shlJson.verifiableCredential.length === 0) {
	
	console.error('No VC found in resolved SHL: ' +
				  JSON.stringify(shlJson, null, 2));

	return(undefined);
  }

  if (shlJson.verifiableCredential.length > 1) {
	console.warn('Multiple VCs in SHL; only using [0]');
  }

  return(shlJson.verifiableCredential[0]);
}

async function fetchSHLContent(file) {
  
  if (file.embedded) return(file.embedded);

  const response = await fetch(file.location);
  return(response.text());
}

async function fetchSHLManifest(shlPayload, passcode) {

  if (shlPayload.flag && shlPayload.flag.indexOf("U") !== -1) {
	return(singleFileManifest(shlPayload));
  }
  
  const body = { recipient: SHL_RECIPIENT };
  if (passcode) body.passcode = passcode;

  const response = await fetch(shlPayload.url, {
	method: 'POST',
	headers: { 'Content-Type': 'application/json' },
	body: JSON.stringify(body)
  });

  if (response.status !== 200) {
	throw new Error(`Manifest: ${response.status}`);
  }
	
  return(await response.json());
}

function singleFileManifest(shlPayload) {

  const location = shlPayload.url +
		(shlPayload.url.indexOf("?") === -1 ? "?" : "&") +
		"recipient=" +
		encodeURIComponent(SHL_RECIPIENT);

  // note we assume we're getting an SHC --- we will look
  // for verifiableCredential in the downloaded package later
  // so that seems totally fine
  
  const manifest = { files: [ {
	"contentType": SHC_CONTENTTYPE,
	"location": location
  } ] };

  return(manifest);
}

function decodeSHL(shl) {

  let body;
  if (shl.startsWith(SHL_HEADER)) {
	body = shl.substring(SHL_HEADER.length);
  }
  else {
	const ichHeader = shl.indexOf('#' + SHL_HEADER);
	body = shl.substring(ichHeader + 1 + SHL_HEADER.length);
  }

  return(JSON.parse(b64u_to_str(body)));
}

// +---------+
// | Helpesr |
// +---------+

function status(code, reasons) {

  const obj = {
	"shxStatus": (code ? code : SHX_STATUS_ERROR),
	"bundles": []
  };

  if (reasons) {
	obj.reasons = (Array.isArray(reasons) ? reasons : [ reasons ]);
  }

  return(obj);
}

function addVerifiableBundle(statusObj, vres) {

  if (!statusObj) statusObj = status();

  // 1. create the bundle object and set status 
  
  const obj = { };
  obj.contentOK = function() { return(this.fhir && this.certStatus !== CERT_STATUS_INVALID); }
  obj.certValid = function() { return(this.certStatus === CERT_STATUS_VALID); }
  obj.isVerifiable = function() { return(true); }
  
  statusObj.bundles.push(obj);
  obj.certStatus = (vres.verified ? CERT_STATUS_VALID : CERT_STATUS_INVALID);

  statusObj.shxStatus = SHX_STATUS_OK; // at least one bundle in package
  
  // 2. add reasons / warnings / errors
  
  if (vres.reason) {
	obj.reasons = vres.reason.split('|');
  }
  
  if (vres.data) {
	
	if (vres.data.fhirBundle) {
	  obj.fhir = vres.data.fhirBundle;
	}
	
	if (vres.data.errors) {

	  for (const i in vres.data.errors) {
		console.error(vres.data.errors[i].message);
	  }

	  obj.errors = vres.data.errors;
	}
  
	if (vres.data.warnings) {

	  for (const i in vres.data.warnings) {
		console.warn(vres.data.warnings[i].message);
	  }

	  obj.warnings = vres.data.warnings;
	}

  }

  // 3. add issuer-related details
  
  if (vres.verified) {
	
	obj.issuerISS = (vres.data.signature.issuer.iss ?
					 vres.data.signature.issuer.iss :
					 vres.data.jws.payload.iss);
					 
	obj.issuerName = (vres.data.signature.issuer.name ?
					  vres.data.signature.issuer.name :
					  obj.issuerISS);

	obj.supportsRevocation =
	  (("crlVersion" in vres.data.signature.key) ||
	   ("rid" in vres.data.jws.payload.vc));
  
	obj.issuerURL = vres.data.signature.issuer.website;
	obj.issueDate = new Date(vres.data.jws.payload.nbf * 1000);
  }

  return(statusObj);
}

