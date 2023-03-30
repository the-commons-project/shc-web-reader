
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
  // TODO - NOT COMPLETE - dob, telecoms, etc.
  return(renderPersonName(person));
}

function renderPersonName(person) {
  // TODO - NOT COMPLETE - find best name rather than [0]
  return(<div>{getPersonDisplayName(person.name[0])}</div>);
}

function getPersonDisplayName(name) {

  if (name.text) return(name.text);

  let d = "";

  d = spaceAppend(d, name.prefix);
  d = spaceAppendArray(d, name.given);
  d = spaceAppend(name.family);
  d = spaceAppend(name.suffix);

  return(d);
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

  return(o.display ? o.display : NA);
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


