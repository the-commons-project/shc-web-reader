
import { verify, Directory } from 'smart-health-card-decoder'
import { compactDecrypt } from 'jose';
import { b64u_to_str, b64_to_arr, arr_to_str } from './b64.js';

// +-----------+
// | Constants |
// +-----------+

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

export async function verifySHX(shx) {

  let target = shx;
  if (looksLikeSHL(shx)) target = await resolveSHL(shx);

  const dir = await getDirectory();
  const result = await verify(target.trim(), dir);

  if (!result.verified) {

	if (result.data.warnings) {
	  for (const i in result.data.warnings) {
		console.warn(result.data.warnings[i].message);
	  }
	}

	return({
	  "valid": false,
	  "reasons": result.reason.split('|'),
	  "errors": result.data.errors,
	  "warnings": result.data.warnings
	});
  }

  const issuerISS = (result.data.signature.issuer.iss ?
					 result.data.signature.issuer.iss :
					 result.data.jws.payload.iss);
					 
  const issuerName = (result.data.signature.issuer.name ?
					  result.data.signature.issuer.name :
					  issuerISS);

  const supportsRevocation =
		(("crlVersion" in result.data.signature.key) ||
		 ("rid" in result.data.jws.payload.vc));
  
  return({
	"valid": true,
	"issuerISS": issuerISS,
	"issuerName": issuerName,
	"issuerURL": result.data.signature.issuer.website,
	"issueDate": new Date(result.data.jws.payload.nbf * 1000),
	"supportsRevocation": supportsRevocation,
	"fhirBundle": result.data.fhirBundle
  });
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

export async function resolveSHL(shl) {

  // 1. Decode the link body
  const shlPayload = decodeSHL(shl);

  if (shlPayload.flag && shlPayload.flag.indexOf('P') !== -1) {
	console.error('No support for passcode-protected SHLINKS');
	return(undefined);
  }

  // 2. Fetch the manifest
  const shlManifest = await fetchSHLManifest(shlPayload);
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
  
  const key = b64_to_arr(shlPayload.key);
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

async function fetchSHLManifest(shlPayload) {

  if (shlPayload.flag && shlPayload.flag.indexOf("U") !== -1) {
	return(singleFileManifest(shlPayload));
  }
  
  const body = { recipient: SHL_RECIPIENT };

  const response = await fetch(shlPayload.url, {
	method: 'POST',
	headers: { 'Content-Type': 'application/json' },
	body: JSON.stringify(body)
  });

  return(response.json());
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
