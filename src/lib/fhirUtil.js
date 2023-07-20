
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

// +----------------+
// | renderQuantity |
// +----------------+

export function renderQuantity(q) {

  let disp = spaceAppend("", q.comparator);
  disp = spaceAppend(disp, q.value);
  disp = spaceAppend(disp, q.unit ? q.unit : q.code);
  
  return(disp);
}

// +---------------------------+
// | parseDateTimePrecision    |
// | parseDateTime             |
// +---------------------------+

export const PRECISION_NONE = 0;
export const PRECISION_YEAR = 1;
export const PRECISION_MONTH = 2;
export const PRECISION_DAY = 3;
export const PRECISION_TIME = 4;

export function parseDateTimePrecision(d) {

  const dateOnlyRegex = /^\d{4}(-\d{2}(-\d{2})?)?$/;

  let dateParsed;
  let precision;
  
  if (d.match(dateOnlyRegex)) {
	// create in local timezone so displays as expected
	const fields = d.split("-");
	if (fields.length === 1) {
	  dateParsed = new Date(fields[0], 0, 1);
	  precision = PRECISION_YEAR;
	}
	else if (fields.length === 2) {
	  dateParsed = new Date(fields[0], fields[1] - 1, 1);
	  precision = PRECISION_MONTH;
	}
	else {
	  dateParsed = new Date(fields[0], fields[1] - 1, fields[2]);
	  precision = PRECISION_DAY;
	}
  }
  else {
	// fully specified instant (or bogus); spec requires tz
	// so just let the parser figure it out
	dateParsed = new Date(d);
	precision = PRECISION_TIME;
  }

  return([dateParsed, precision]);
}

export function parseDateTime(d) {
  return(parseDateTimePrecision(d)[0]);
}

// +----------------+
// | renderDate     |
// | renderDateTime |
// +----------------+

export function renderDate(d) {

  const [ dateParsed, precision ] = parseDateTimePrecision(d);

  let fmt = {};

  if (precision >= PRECISION_YEAR) fmt.year = 'numeric';
  if (precision >= PRECISION_MONTH) fmt.month = 'numeric';
  if (precision >= PRECISION_DAY) fmt.day = 'numeric';
  
  return(dateParsed.toLocaleString(currentLocale(), fmt));
}

export function renderDateTime(d) {

  const [ dateParsed, precision ] = parseDateTimePrecision(d);

  let fmt = {};

  if (precision >= PRECISION_YEAR) fmt.year = 'numeric';
  if (precision >= PRECISION_MONTH) fmt.month = 'numeric';
  if (precision >= PRECISION_DAY) fmt.day = 'numeric';
  if (precision >= PRECISION_TIME) {
	fmt.hour = 'numeric';
	fmt.minute = 'numeric';
	fmt.timeZoneName = 'short';
  }
  
  return(dateParsed.toLocaleString(currentLocale(), fmt));
}

// +--------------+
// | renderPeriod |
// +--------------+

export function renderPeriod(p) {

  if (p.start) {
	if (p.end) {
	  return(renderDateTime(p.start) + " to " + renderDateTime(p.end));
	}
	else {
	  return("started " + renderDateTime(p.start));
	}
  }
  else if (p.end) {
	return("ended " + renderDateTime(p.end));
  }
  
  return("");
}

// +-------------+
// | renderRange |
// +-------------+

export function renderRange(r) {

  if (r.low) {
	if (r.high) {
	  return("between " + renderQuantity(r.low) + " and " + renderQuantity(r.high));
	}
	else {
	  return("more than " + renderQuantity(r.low));
	}
  }
  else if (r.high) {
	return("less than " + renderQuantity(r.high));
  }

  return("");
}

// +-------------+
// | renderRatio |
// +-------------+

export function renderRatio(r) {
  return(renderQuantity(r.numerator) + "/" + renderQuantity(r.denominator));
}

// +-----------------------------+
// | renderCrazyDateTime         |
// | parseCrazyDateTimeBestGuess |
// +-----------------------------+

// e.g.: onsetDateTime
//       onsetString
//       onsetAge
//       onsetPeriod
//       onsetRange
//       onsetInstant
//       onsetTiming (NOT SUPPORTED)

export function renderCrazyDateTime(parent, prefix) {

  if (parent[prefix + "DateTime"]) return(renderDateTime(parent[prefix + "DateTime"]));
  if (parent[prefix + "String"]) return(parent[prefix + "String"]);
  if (parent[prefix + "Age"]) return(renderQuantity(parent[prefix + "Age"]));
  if (parent[prefix + "Period"]) return(renderPeriod(parent[prefix + "Period"]));
  if (parent[prefix + "Range"]) return(renderRange(parent[prefix + "Range"]));
  if (parent[prefix + "Instant"]) return(renderDateTime(parent[prefix + "Instant"]));

  if (parent[prefix + "Timing"]) {
	console.error("Unsupported CrazyDateTime format");
	return("Unsupported");
  }
  
  return(undefined);
}

// "Best Guess" because we can't always get to an accurate single
// precise date ... use this for sorting, etc. but not medical decisions.

export function parseCrazyDateTimeBestGuess(parent, prefix) {
  if (parent[prefix + "DateTime"]) return(parseDateTime(parent[prefix + "DateTime"]));
  if (parent[prefix + "Instant"]) return(parseDateTime(parent[prefix + "Instant"]));
  if (parent[prefix + "Period"]) {
	if (parent[prefix + "Period"].start) return(parseDateTime(parent[prefix + "Period"].start));
	if (parent[prefix + "Period"].end) return(parseDateTime(parent[prefix + "Period"].end));
  }
  return(new Date());
}

// +------------------+
// | renderCrazyValue |
// +------------------+

// e.g.: valueQuantity
//       valueCodeableConcept
//       valueString
//       valueBoolean
//       valueInteger
//       valueRange
//       valueRatio
//       valueSampledData (NOT SUPPORTED)
//       valueTime
//       valueDateTime
//       valuePeriod
//       valueAttachment (NOT SUPPORTED)
//       valueReference(MolecularSequence) (NOT SUPPORTED)

export function renderCrazyValue(parent, prefix) {

  if (parent[prefix + "Quantity"]) return(renderQuantity(parent[prefix + "Quantity"]));
  if (parent[prefix + "CodeableConcept"]) return(renderCodeableJSX(parent[prefix + "CodeableConcept"]));
  if (parent[prefix + "String"]) return(parent[prefix + "String"]);
  if (parent[prefix + "Boolean"]) return(parent[prefix + "Boolean"]);
  if (parent[prefix + "Integer"]) return(parent[prefix + "Integer"]);
  if (parent[prefix + "Range"]) return(renderRange(parent[prefix + "Integer"]));
  if (parent[prefix + "Ratio"]) return(renderRatio(parent[prefix + "Ratio"]));
  if (parent[prefix + "Time"]) return(parent[prefix + "Time"]);
  if (parent[prefix + "DateTime"]) return(renderDateTime(parent[prefix + "DateTime"]));
  if (parent[prefix + "Period"]) return(renderPeriod(parent[prefix + "Period"]));
  
  if (parent[prefix + "SampledData"] ||
	  parent[prefix + "Attachement"] ||
	  parent[prefix + "Reference"]) {

	console.error("Unsupported CrazyValue format");
	return("Unsupported");
  }

  return(undefined);
}

// +--------------+
// | renderTiming |
// +--------------+

export function renderTiming(t) {

  if (!t) return(undefined);
  
  // specific date time
  if (t.event) return(renderDateTime(t.event));

  let disp = "";

  // bounds used for code and repeat so start here
  if (t.repeat) {
	if (t.repeat.boundsDuration) {
	  disp = delimiterAppend(disp, renderQuantity(t.repeat.boundsDuration), "; ");
	}
	else if (t.repeat.boundsRange) {
	  disp = delimiterAppend(disp, renderRange(t.repeat.boundsRange), "; ");
	}
	else if (t.repeat.boundsPeriod) {
	  disp = delimiterAppend(disp, renderPeriod(t.repeat.boundsPeriod), "; ");
	}
	
  }

  if (t.code) {
  // code
	disp = delimiterAppend(disp, renderCodeableJSX(t.code), "; ");
  }
  else if (t.repeat) {
	// repeat - first figure out the what ...
	
	let qty = undefined;
	let max = undefined;
	let tag = undefined;
	
	if (t.repeat.count) {
	  qty = t.repeat.count;
	  max = t.repeat.countMax;
	  tag = "";
	}
	else if (t.repeat.duration) {
	  qty = t.repeat.duration;
	  max = t.repeat.durationMax;
	  tag = t.repeat.durationUnit;
	}
	else if (t.repeat.frequency) {
	  qty = t.repeat.frequency;
	  max = t.repeat.frequencyMax;
	  tag = (qty > 1 ? "times" : "time");
	}

	if (qty) {
	  disp = delimiterAppend(disp, qty + (max ? " to " + max : " ") + tag, "; ");
	}

	// then the when...

	if (t.repeat.periodUnit) {
	  const pqty = (t.repeat.period ? t.repeat.period : 1);
	  const ptxt = (pqty === 1 ? "" : pqty + " ");
	  disp = delimiterAppend(disp, "per " + ptxt + t.repeat.periodUnit, (qty ? " " : "; "));
	  if (t.repeat.periodMax) disp += " (max " + t.repeat.periodMax + ")";
	}

	// ... and special
	if (t.repeat.dayOfWeek) {
	  const days = (Array.isArray(t.repeat.dayOfWeek)
					? delimiterAppendArray("", t.repeat.dayOfWeek, ",") : t.repeat.dayOfWeek);
	  
	  disp = delimiterAppend(disp, "weekly on " + days, "; ");
	}
	
	if (t.repeat.timeOfDay) {
	  const times = (Array.isArray(t.repeat.timeOfDay)
					 ? delimiterAppendArray("", t.repeat.timeOfDay, ",") : t.repeat.timeOfDay);
	  
	  disp = delimiterAppend(disp, "at " + times, "; ");
	}

	if (t.repeat.when) {
	  let when = (Array.isArray(t.repeat.when)
				  ? delimiterAppendArray("", t.repeat.when, ",") : t.repeat.when);

	  if (t.repeat.offset) when += " (" + t.repeat.offset + "minutes";

	  disp = delimiterAppend(disp, when, "; ");
	}
  }

  return(disp);
}

// +-------------------+
// | renderDosage      |
// | renderDoseAndRate |
// +-------------------+

export function renderDosage(d) {
  if (!d) return(undefined);
  if (!Array.isArray(d)) return(renderOneDosage(d));

  let disp = "";
  for (const i in d) disp = delimiterAppend(disp, renderOneDosage(d[i]), "\n");
  return(disp);
}

export function renderOneDosage(d) {
  
  if (!d) return(undefined);
  if (d.text) return(d.text);

  let disp = "";
  
  if (d.asNeededBoolean) disp = d.asNeededBoolean;
  else if (d.asNeededCodeableConcept) disp = renderCodeableJSX(d.asNeededCodeableConcept);

  disp = delimiterAppend(disp, renderCodeableJSX(d.route), "; ");
  disp = delimiterAppend(disp, renderDoseAndRate(d.doseAndRate), "; ");
  disp = delimiterAppend(disp, renderTiming(d.timing), "; ");

  return(disp);
}

export function renderDoseAndRate(dr) {
  if (!dr) return(undefined);
  if (!Array.isArray(dr)) return(renderOneDoseAndRate(dr));

  let disp = "";
  for (const i in dr) disp = delimiterAppend(disp, renderOneDoseAndRate(dr[i]), "; ");
  return(disp);
}

export function renderOneDoseAndRate(dr) {

  if (!dr) return(undefined);
  
  let doseTxt = undefined;
  let rateTxt = undefined;
  
  if (dr.doseRange) doseTxt = renderRange(dr.doseRange);
  else if (dr.doseQuantity) {
	doseTxt = renderQuantity(dr.doseQuantity);
	if (!isNaN(doseTxt)) doseTxt += (doseTxt === "1" ? " dose" : " doses");
  }
  
  if (dr.rateRatio) rateTxt = renderRatio(dr.rateRatio);
  else if (dr.rateRange) rateTxt = renderRange(dr.rateRange);
  else if (dr.rateQuantity) rateTxt = renderQuantity(dr.rateQuantity);

  return(delimiterAppend(doseTxt, rateTxt, ", "));
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

  if (!c) return(undefined);
  
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

  return(<span className="xtrahover" title={alt}>{disp}</span>);
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
  return(Array.isArray(o) ? o[0] : o);
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
  if (!cur || cur.length === 0) return(str ? str : "");
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

export function currentLocale() {

  // try to prefer a complete locale vs. just a language
  if (navigator.languages && navigator.languages.length) {
	for (const i in navigator.languages) {
	  const l = navigator.languages[i];
	  if (l.indexOf("-") !== -1) return(l);
	}

	return(navigator.languages[0]);
  }

  return(navigator.language ? navigator.language : "en-US");
}

