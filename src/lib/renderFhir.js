
import { fhirCodes } from "./fhirCodes.js";

const NA = "Unknown";

// +--------------------+
// | renderOrganization |
// +--------------------+

export function renderOrganization(org, resources) {
  return(renderReference(org, resources, renderOrganizationResource));
}

function renderOrganizationResource(org) {
  // TODO - NOT COMPLETE - contacts
  return(<div>{org.name}</div>);
}

// +--------------+
// | renderPerson |
// +--------------+

export function renderPerson(person, resources) {
  return(renderReference(person, resources, renderPersonResource));
}

function renderPersonResource(person) {
  // TODO - NOT COMPLETE - telecoms, etc.

  const dob = (person.birthDate ? "DOB " + renderDate(person.birthDate) : "");
  
  return(
    <div>
	  {getPersonDisplayName(person.name[0])}<br/>
	  {dob}
	</div>
  );
}

function getPersonDisplayName(name) {

  if (name.text) return(name.text);

  let d = "";

  d = spaceAppend(d, name.prefix);
  d = spaceAppendArray(d, name.given);
  d = spaceAppend(d, name.family);
  d = spaceAppend(d, name.suffix);

  return(d);
}

// +-------------+
// | renderMoney |
// +-------------+

export function renderMoney(m) {

  if (m.value) {
	const currency = m.currency ? m.currency : "USD";
	const fmt = new Intl.NumberFormat("en-US", { style: "currency", currency: currency });
	return(fmt.format(m.value));
  }
  else if (m.extension && m.extension.length && m.extension.length >= 1 && m.extension[0].valueString) {
	return(m.extension[0].valueString);
  }

  return(NA);
}

// +-------------+
// | renderImage |
// +-------------+

export function renderImage(img) {

  const imageExt = searchArray(img.extension, (o) => (o.url && o.url === "image"));
  const labelExt = searchArray(img.extension, (o) => (o.url && o.url === "label"));
  const descExt = searchArray(img.extension, (o) => (o.url && o.url === "description"));

  let alt = (labelExt ? labelExt.valueString : "");
  if (descExt) alt = delimiterAppend(alt, descExt.valueString, "; ");
  
  const dataUri = "data:" + imageExt.valueAttachment.contentType +
		";base64," + imageExt.valueAttachment.data;
  
  return(<img src={dataUri} alt={alt} title={alt} />);
}

// +------------+
// | renderDate |
// +------------+

export function renderDate(d) {

  return(new Date(d).toLocaleString('en-US', {
	month: 'numeric', day: 'numeric', year: 'numeric' }));
}

// +---------------+
// | renderAddress |
// +---------------+

export function renderAddress(a) {

  if (a.text) return(a.text);

  let d = "";

  if (a.line) {
	for (const i in a.line) d = delimiterAppend(d, a.line[i], ", ");
  }

  d = delimiterAppend(d, a.city, ", ");
  d = delimiterAppend(d, a.state, ", ");
  d = delimiterAppend(d, a.postalCode, ", ");
  d = delimiterAppend(d, a.country, ", ");

  return(d);
}

// +--------------+
// | renderCoding |
// +--------------+

export function renderCodable(c) {

  let disp = c.text;

  if (!disp && c.coding && c.coding.length >= 1) {

	disp = c.coding[0].display;

	if (!disp && c.coding[0].system in fhirCodes) {
	  disp = fhirCodes[c.coding[0].system][c.coding[0].code];
	}

	if (!disp) disp = c.coding[0].code;
  }

  if (!disp) disp = NA;

  return(disp);
}

// +---------------+
// | firstOrObject |
// +---------------+

// if passed-in object is an array, return [0] else identity.   
// this is for elements that stupidly are sometimes 1-elt arrays

export function firstOrObject(o) {
  return(o.isArray() ? o[0] : o);
}

// +-----------------+
// | renderReference |
// +-----------------+

// try to render a resource; if not found try for display 

export function renderReference(o, resources, refRenderFunc) {
  return(renderReferenceMap(o, resources, { "any": refRenderFunc }));
}

export function renderReferenceMap(o, resources, refRenderFuncMap) {
  try {
	return(renderReferenceMapThrow(o, resources, refRenderFuncMap));
  }
  catch (err) {
	return(<div>{o.display ? o.display : NA}</div>);
  }
}

export function renderReferenceMapThrow(o, resources, refRenderFuncMap) {

  let r = undefined;

  if (o.resourceType) {
	r = o;
  }
  else if (o.reference && (o.reference in resources)) {
	r = resources[o.reference];
  }

  if (r) {
	const t = r.resourceType;
	
	if (t in refRenderFuncMap) return(refRenderFuncMap[t](r));
	if ("any" in refRenderFuncMap) return(refRenderFuncMap["any"](r));
  }

  throw new Error("no resource or resource function in map");
}

// +-------------+
// | searchArray |
// +-------------+

export function searchArray(arr, searchFunc) {
  if (!arr) return(undefined);
  for (const i in arr) if (searchFunc(arr[i])) return(arr[i]);
  return(undefined);
}

// +-----------+
// | utilities |
// +-----------+

function spaceAppend(cur, str) {
  return(delimiterAppend(cur, str, " "));
}

function delimiterAppend(cur, str, delim) {
  if (!cur || cur.length === 0) return(str);
  if (str && str.length !== 0) return(cur + delim + str);
  return(cur);
}

function spaceAppendArray(cur, arr) {
  return(delimiterAppendArray(cur, arr, " "));
}

function delimiterAppendArray(cur, arr, delim) {
  if (!arr) return(cur);
  for (const i in arr) cur = delimiterAppend(cur, arr[i], delim);
  return(cur);
}


