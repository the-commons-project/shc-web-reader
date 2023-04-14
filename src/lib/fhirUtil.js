
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

// +----------------------+
// | findCodedItem        |
// | findCodedItemInChild |
// +----------------------+

export function findCodedItemInChild(arr, child, system, code) {

  if (!arr) return(undefined);
  
  for (const i in arr) {
	  
	const item = arr[i];
	if (item[child] && item[child].coding) {

	  for (const j in item[child].coding) {

		if (item[child].coding[j].system === system &&
			item[child].coding[j].code === code) {

		  return(item);
		}
	  }
	}
  }

  return(undefined);
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


