
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
//     "organized": (iff fhir != undefined, object per resources.js)
//     "certStatus": "valid" | "invalid" | "none",
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
import { organizeResources } from './resources.js';
import { looksLikeJSON } from './fhirUtil.js';
import config from './config.js';

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
const FHIR_CONTENTTYPE = 'application/fhir+json';
const INFER_CONTENTTYPE = '___INFER___';

// +---------------+
// | Custom Errors |
// +---------------+

class PasscodeError extends Error {
  constructor(message) {
    super(message);
    this.name = "PasscodeError";
  }
}


class ExpiredError extends Error {
  constructor(msg) { super(msg); this.name = "ExpiredError"; }
}


class DataMissingError extends Error {
  constructor(message) {
    super(message);
    this.name = "DataMissingError";
  }
}



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

	// console.error(err.stack);
	
	if (err instanceof PasscodeError) {
	  return(status(SHX_STATUS_NEED_PASSCODE, err.message));
	}

	if (err instanceof ExpiredError) {
	  return(status(SHX_STATUS_EXPIRED, err.message));
	}
	// Handle DataMissingError
    if (err instanceof DataMissingError) {
      return status(SHX_STATUS_ERROR, err.message);
    }
	const reasons = (err ? err.toString() : "unexpected");
	return(status(SHX_STATUS_ERROR, reasons));
  }
}

async function _verifySHX(shx, passcode) {

  const resolved = await resolveSHX(shx, passcode);

  const statusObj = status();

  if (resolved.verifiableCredentials.length > 0) {
  
    const dir = await getDirectory();

	const permissive = config("permissive");
	for (const i in resolved.verifiableCredentials) {
	  const vres = await verify(resolved.verifiableCredentials[i], dir);
	  if (permissive) bePermissive(vres);
	  addVerifiableBundle(statusObj, vres);
	}
  }

  for (const i in resolved.rawBundles) {
	addRawBundle(statusObj, resolved.rawBundles[i]);
  }
  // Check if no entry in each FHIR bundle
  statusObj.bundles.forEach(bundle => {
    if (!bundle.fhir || !bundle.fhir.entry) {
      throw new DataMissingError("The provided Smart Health Link does not contain any data.");
    }
  });
  
  // build up our organized resources
  const labelCounters = { };
  for (const i in statusObj.bundles) {
	const b = statusObj.bundles[i];
	if (b.fhir) b.organized = organizeResources(b, labelCounters);
  }

  return(statusObj);
}

var _verifyDir = undefined;

async function getDirectory() {
  
  if (_verifyDir) return(_verifyDir);

  const dirs = [];
  const urls = config("trustedDirectories");
  for (const i in urls) dirs.push(await Directory.create(urls[i]));

  _verifyDir = Directory.create(dirs);
  return(_verifyDir);
}

function bePermissive(vres) {

  if (vres.verified) return;
  if (!vres.data || !vres.data.errors) return;

  let anyFatal = false;
  for (const i in vres.data.errors) {
	if (vres.data.errors[i].fatal) {
	  anyFatal = true;
	  break;
	}
  }

  if (anyFatal) return;
  vres.verified = true;
}

// +------------+
// | resolveSHX |
// +------------+

// grovels around in the given SHC or SHL and ultimately comes
// back with an object with two arrays:
//
//   - "verifiableCredentials" contains all shc:/ or jws strings
//   - "rawBundles" contains a list of unsigned fhir bundle resources
//
// and one string value:
//
//   - "label" if it's a SHL and has one, else not present

async function resolveSHX(shx, passcode) {

  const resolved = {
	"verifiableCredentials": [],
	"rawBundles": []
  };

  let target = shx.trim();

  if (looksLikeSHL(target)) {
	// yeah this is going to take some work
	await resolveSHL(target, passcode, resolved);
  }
  else if (!resolveFromJSON(resolved, target)) {
	// wasn't JSON, so assume it's an SHC... we'll error on verification if not
	resolved.verifiableCredentials.push(target);
  }
  return(resolved);
}

function resolveFromJSON(resolved, input) {

  if (!looksLikeJSON(input)) return(false);

  try {
	const json = JSON.parse(input);
	const vc = json.verifiableCredential;
	  
	if (vc) {
	  // shc
	  for (const i in vc) resolved.verifiableCredentials.push(vc[i]);
	  return(true);
	}
	else if (json.resourceType) {
	  // fhir
	  pushRawBundle(resolved, json);
	  return(true);
	}
  }
  catch {
	// eat it and return false
  }

  return(false);
}

function pushRawBundle(resolved, fhir) {
  
  if (fhir.resourceType === "Bundle") {
	// already a bundle
	resolved.rawBundles.push(fhir);
  }
  else {
	// put it into a bundle
	resolved.rawBundles.push({
	  "resourceType": "Bundle",
	  "type": "collection",
	  "entry": [ {
		"fullUrl": "resource:0",
		"resource": fhir
	  } ]
	});
  }
}

// +------------+
// | resolveSHL |
// +------------+

export async function resolveSHL(shl, passcode, resolved) {

  // 1. Decode the link body
  const shlPayload = decodeSHL(shl);

  if (shlPayload.label) resolved.label = shlPayload.label;
  
  // 1.5 Check expiration and passcode
  
  if (shlPayload.flag && shlPayload.flag.indexOf('P') !== -1 && !passcode) {
	throw new PasscodeError("This SHL requires a passcode.");
  }

  if (shlPayload.exp) {
	const expires = new Date(shlPayload.exp * 1000);
	const now = new Date();
	if (expires < now) throw new ExpiredError("This SHL is expired.");
  }

  // 2. Fetch the manifest
  const shlManifest = await fetchSHLManifest(shlPayload, passcode);
  const shlFiles = shlManifest.files;

  // 3. Fetch and decode encrypted content

  const key = b64u_to_arr(shlPayload.key);

  for (const i in shlFiles) {

	const contentType = shlFiles[i].contentType;

	if (contentType !== SHC_CONTENTTYPE &&
		contentType !== FHIR_CONTENTTYPE &&
		contentType !== INFER_CONTENTTYPE) {
	  // don't bother downloading things we KNOW we can't use
	  continue;
	}

	const shlEncrypted = await fetchSHLContent(shlFiles[i]);
	const decrypted = await compactDecrypt(shlEncrypted, key);
	const shlJson = JSON.parse(arr_to_str(decrypted.plaintext));

	if (shlJson.verifiableCredential) {
	  // looks like an shc to me
	  for (const j in shlJson.verifiableCredential) {
		resolved.verifiableCredentials.push(shlJson.verifiableCredential[j]);
	  }
	}
	else if (shlJson.resourceType) {
	  // feels like fhir!
	  pushRawBundle(resolved, shlJson);
	}
  }
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

  if (response.status === 401 && passcode) {
    let responseBody;
    try {
      responseBody = await response.json();
    } catch (error) {
      // If JSON parsing fails, log the error and throw a generic error
      console.error('There was an error processing the passcode.', error);
      throw new Error('There was an error processing the passcode.');
    }
    // If JSON parsing succeeds but the passcode is incorrect, throw a PasscodeError
    const remainingAttempts = responseBody.remainingAttempts;
    const attemptText = remainingAttempts === 1 ? "attempt" : "attempts";
    throw new PasscodeError(`Passcode incorrect. ${remainingAttempts} ${attemptText} remaining.`);
  }

  if (response.status === 404) {
    throw new Error("The SHL is no longer active.");
  }

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

  const manifest = { files: [ {
	"contentType": INFER_CONTENTTYPE,
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
// | Helpers |
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

function addBaseBundle(statusObj) {

  const obj = { };

  obj.contentOK = function() { return(this.fhir && this.certStatus !== CERT_STATUS_INVALID); }
  obj.certValid = function() { return(this.certStatus === CERT_STATUS_VALID); }
  obj.isVerifiable = function() { return(this.certStauts !== CERT_STATUS_NONE); }

  statusObj.bundles.push(obj);
  statusObj.shxStatus = SHX_STATUS_OK; // at least one bundle in package

  return(obj);
}

function addRawBundle(statusObj, fhirBundle) {

  if (!statusObj) statusObj = status();

  const obj = addBaseBundle(statusObj);

  obj.certStatus = CERT_STATUS_NONE;
  obj.fhir = fhirBundle;

  return(statusObj);
}

function addVerifiableBundle(statusObj, vres) {

  if (!statusObj) statusObj = status();

  // 1. create the bundle object and set status

  const obj = addBaseBundle(statusObj);
  obj.certStatus = (vres.verified ? CERT_STATUS_VALID : CERT_STATUS_INVALID);
  obj.validationResult = vres;

  // 2. add reasons / warnings / errors

  if (vres.reason) {
	obj.reasons = vres.reason.split('|');
  }

  if (vres.data) {

	if (vres.data.fhirBundle) obj.fhir = vres.data.fhirBundle;

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