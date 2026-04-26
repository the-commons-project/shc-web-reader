
// I can't keep all of these straight to save my life.
//
// b64u = base64url
// b64  = base64
// arr  = UInt8Array
// str  = string

export function b64u_to_arr(input) {
  return(b64_to_arr(b64u_to_b64(input)));
}

export function b64u_to_str(input) {
  return(b64_to_str(b64u_to_b64(input)));
}

export function b64_to_str(input) {
  return(arr_to_str(b64_to_arr(input)));
}

export function b64_to_arr(input) {
  const raw = atob(input);
  const arr = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; ++i) arr[i] = raw.charCodeAt(i);
  return(arr);
}

export function arr_to_str(input) {
  return(new TextDecoder().decode(input));
}

// From https://stackoverflow.com/questions/5234581/base64url-decoding-via-javascript

export function b64u_to_b64(input) {

  let b64;
  
  // Replace non-url compatible chars with base64 standard chars
  b64 = input
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  // Pad out with standard base64 required padding characters
  var pad = input.length % 4;
  if (pad) {
    if(pad === 1) {
      throw new Error('InvalidLengthError: input is wrong length to determine padding');
    }
    b64 += new Array(5-pad).join('=');
  }

  return(b64);
}

export function estimateBase64SizeBytes(base64Data) {
  if (!base64Data) return(0);
  // Base64 encoding adds ~33% overhead, so actual size is ~75% of base64 length
  return(Math.floor(base64Data.length * 0.75));
}

export function base64ToDataUrl(base64Data, contentType) {
  return(`data:${contentType};base64,${base64Data}`);
}

export function base64ToBlob(base64Data, contentType) {
  return(new Blob([b64_to_arr(base64Data)], { type: contentType }));
}


