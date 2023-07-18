
import { fhirCodes } from "./fhirCodes.js";

const NA = "Unknown";

// +--------------------+
// | renderOrganization |
// +--------------------+

export function renderOrganization(org, resources) {
  return(renderReference(org, resources, renderOrganizationResource));
}

function renderOrganizationResource(org) {
  return(<div>{org.name}</div>);
}

// +---------------+
// | renderContact |
// +---------------+

export function renderContact(c, withLinks) {

  const addr = renderAddressJSX(c.address);
  const telecom = renderTelecomJSX(c.telecom, withLinks);
  
  return(<>{addr}{telecom}</>);
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
    <div key={person.id}>
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

export function renderImage(img, className) {

  const imageExt = searchArray(img.extension, (o) => (o.url && o.url === "image"));
  const labelExt = searchArray(img.extension, (o) => (o.url && o.url === "label"));
  const descExt = searchArray(img.extension, (o) => (o.url && o.url === "description"));

  let alt = (labelExt ? labelExt.valueString : "");
  if (descExt) alt = delimiterAppend(alt, descExt.valueString, "; ");
  
  const dataUri = "data:" + imageExt.valueAttachment.contentType +
		";base64," + imageExt.valueAttachment.data;
  
  return(<img src={dataUri} alt={alt} title={alt}
			  className={className ? className : "fhirImg"} />);
}

// +------------+
// | renderDate |
// +------------+

export function renderDate(d) {

  const dateOnlyRegex = /^\d{4}(-\d{2}(-\d{2})?)?$/;

  let dateParsed;
  
  if (d.match(dateOnlyRegex)) {
	// create in local timezone so displays as expected
	const fields = d.split("-");
	if (fields.length === 1) dateParsed = new Date(fields[0]);
	else if (fields.length === 2) dateParsed = new Date(fields[0], fields[1] - 1);
	else dateParsed = new Date(fields[0], fields[1] - 1, fields[2]);
  }
  else {
	// fully specified instant (or bogus); spec requires tz
	// so just let the parser figure it out
	dateParsed = new Date(d);
  }
  
  return(dateParsed.toLocaleString('en-US', {
	month: 'numeric', day: 'numeric', year: 'numeric' }));
}

// +-------------------------+
// | renderAddressJSX        |
// | renderAddressSingleLine |
// | renderAddressLines      |
// +-------------------------+

export function renderAddressJSX(a) {
  
  const lines = getAddressLines(a);
  
  let key = 0;
  return(lines.map((line) => <span key={key++}>{line}<br/></span>));
}

export function renderAddressSingleLine(a) {
  return(getAddressLines(a).join(", "));
}

function getAddressLines(a) {

  if (!a) return([]);
  //if (a.text) return(a.text.split("\n"));

  let lines = [];
  if (a.line) lines = lines.concat(a.line);

  let cityState = "";
  cityState = delimiterAppend(cityState, a.city, ", ");
  cityState = delimiterAppend(cityState, a.state, ", ");
  if (cityState.length) lines.push(cityState);

  if (a.postalCode) lines.push(a.postalCode);
  if (a.country && a.country !== "US") lines.push(a.country);

  return(lines);
}

// +----------------------+
// | renderTelecomJSX     |
// | renderTelecomItemJSX |
// +----------------------+

export function renderTelecomItemJSX(t, withLinks) {

  if (!withLinks) return(t.value);

  switch (t.system) {
    case "phone":
	  return(<a href={"tel" + t.value}>{t.value}</a>);

    case "email":
	  return(<a href={"mailto:" + t.value}>{t.value}</a>);

    case "url":
	  return(<a target="_blank" rel="noreferrer" href={t.value}>{t.value}</a>);

    default:
	  return(<>{t.system}>{t.system}: {t.value}</>);
  }
  
}

export function renderTelecomJSX(t, withLinks) {

  if (!t || t.length === 0) return(undefined);

  let key = 0;
  
  return(t.map((item) =>
	<span key={key++}>{renderTelecomItemJSX(item, withLinks)}<br/></span>));
}

// +-----------------+
// | renderCoding    |
// | renderOneCoding |
// +-----------------+

export function renderCodable(c) {

  let disp = ((c.text && typeof c.text === "string") ? c.text : undefined);
  if (!disp && c.coding && c.coding.length >= 1) disp = renderOneCoding(c.coding[0]);
  if (!disp) disp = NA;

  return(disp);
}

export function renderCodeableJSX(c) {

  // first look at text (note in some objs text is an object, screw that)
  let disp = ((c.text && typeof c.text === "string") ? c.text : undefined);

  // if no text and no code, we've got nothing
  if (!disp && (!c.coding || c.coding.length === 0)) return("");

  // if we have text and only one code, just use text (code probably == text)
  if (disp && (!c.coding || c.coding.length <= 1)) return(disp);

  // if no text, use the first code we find as base text
  let iFirstAlt = 0;
  if (!disp && c.coding && c.coding.length > 0) {
	disp = renderOneCoding(c.coding[0]);
	iFirstAlt = 1;
  }

  // if no more codes, just return what we found
  if (!c.coding || iFirstAlt === c.coding.length) return(disp);

  // otherwise add other codings as alt
  let alt = "";
  for (let i = iFirstAlt; i < c.coding.length; ++i) {
	if (alt.length > 0) alt += "\n";
	alt += renderOneCoding(c.coding[i]);
  }

  return(<span title={alt}>{disp}</span>);
}

export function renderOneCoding(c) {

  let disp = c.display;
  if (!disp && c.system in fhirCodes) disp = fhirCodes[c.system][c.code];
  if (!disp) disp = c.code;

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

  const r = resolveReference(o, resources);

  if (r) {
	const t = r.resourceType;
	
	if (t in refRenderFuncMap) return(refRenderFuncMap[t](r));
	if ("any" in refRenderFuncMap) return(refRenderFuncMap["any"](r));
  }

  throw new Error("no resource or resource function in map");
}

// +------------------+
// | resolveReference |
// +------------------+

export function resolveReference(o, resources) {
  if (o.resourceType) return(o);
  if (o.reference && o.reference in resources) return(resources[o.reference]);
  return(undefined);
}

// +-------------+
// | searchArray |
// +-------------+

export function searchArray(arr, searchFunc) {
  if (!arr) return(undefined);
  for (const i in arr) if (searchFunc(arr[i])) return(arr[i]);
  return(undefined);
}

// +---------------------------+
// | hasCode (CodeableConcept) |
// +---------------------------+

// cc must be a CodeableConcept, often a "type" element but whatevs

export function hasCode(cc, system, code) {
  const ret = searchArray(cc.coding, (o) => (o.system === system && o.code === code));
  return(ret ? true : false);
}

// +-----------------------+
// | findCodedItemsInChild |
// | findCodedIteInChild   |
// | findCodedItem         |
// +-----------------------+

// These are used when there is an array of objects, each one of which
// is identified by a CodeableConcept. The "child" element of each item
// is passed to hasCode to determine a match.
//
// E.g., the "class" array in a Coverage element is made up of objects
// that look like this:
//
//   {
//     "type": {
//       "coding": [
//         {
//           "system": "http://terminology.hl7.org/CodeSystem/coverage-class",
//           "code": "group"
//         }
//       ]
//     },
//     "value": "993355",
//     "name": "Stars Inc"
//   }
//
// To find this item, the function would be called with the class array as arr,
// "type" as the child, "http://terminology.hl7.org/CodeSystem/coverage-class"
// as the system and "group" as the code.

export function findCodedItemsInChild(arr, child, system, code) {

  if (!arr) return([]);

  const items = [];

  for (const i in arr) {
	const item = arr[i];
	if (item[child] && hasCode(item[child], system, code)) items.push(item);
  }

  return(items);
}

export function findCodedItemInChild(arr, child, system, code) {
  const items = findCodedItemsInChild(arr, child, system, code);
  return(items && items.length > 0 ? items[0] : undefined);
}

export function findCodedItem(arr, system, code) {
  return(findCodedItemInChild(arr, "type", system, code));
}

// +-----------+
// | utilities |
// +-----------+

export function spaceAppend(cur, str) {
  return(delimiterAppend(cur, str, " "));
}

export function delimiterAppend(cur, str, delim) {
  if (!cur || cur.length === 0) return(str);
  if (str && str.length !== 0) return(cur + delim + str);
  return(cur);
}

export function spaceAppendArray(cur, arr) {
  return(delimiterAppendArray(cur, arr, " "));
}

export function delimiterAppendArray(cur, arr, delim) {
  if (!arr) return(cur);
  for (const i in arr) cur = delimiterAppend(cur, arr[i], delim);
  return(cur);
}


