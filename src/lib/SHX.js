
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

var _verifyDir = undefined;

export async function verifySHX(shx) {

  if (!_verifyDir) _verifyDir = await Directory.create('vci');

  const result = await verify(shx.trim(), _verifyDir);

  if (!result.verified) throw result.reason.split('|');
  
  return(result.data.fhirBundle);
}

// +-----------+
// | verifySHL |
// +-----------+

export async function verifySHL(shl) {

  // 1. Decode the link body
  const shlPayload = decodeSHL(shl);

  if (shlPayload.flag && shlPayload.flag.indexOf('P') !== -1) {
	console.error('No support for passcode-protected SHLINKS');
	return(undefined);
  }

  // 2. Fetch the manifest
  const shlFiles = await fetchSHLManifest(shlPayload);

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

  // 4. DO SOMETHING WITH IT!
  // 4. DO SOMETHING WITH IT!
  // 4. DO SOMETHING WITH IT!
  // 4. DO SOMETHING WITH IT!
  // 4. DO SOMETHING WITH IT!
  // 4. DO SOMETHING WITH IT!
  // 4. DO SOMETHING WITH IT!

  console.log(JSON.stringify(shlJson, null, 2));
  return(undefined);
}

async function fetchSHLContent(file) {
  
  if (file.embedded) return(file.embedded);

  const response = await fetch(file.location);
  return(response.text());
}

async function fetchSHLManifest(shlPayload) {

  const body = { recipient: SHL_RECIPIENT };
  
  const response = await fetch(shlPayload.url, {
	method: 'POST',
	headers: { 'Content-Type': 'application/json' },
	body: JSON.stringify(body)
  });

  return(response.json());
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
