import { useState } from 'react';
import { Button } from '@mui/material';
import * as rf from  './lib/renderFhir.js';

import styles from './Coverage.module.css';

const LOGO_EXTENSION = "http://hl7.org/fhir/us/insurance-card/StructureDefinition/C4DIC-Logo-extension";

export default function Coverage({ cardData, cov, resources }) {

  const [showPayorContacts, setShowPayorContacts] = useState(false);

  const isActive = () => {

	// if status != active, no go
	if (cov.status !== 'active') return(false);
	
	// if no period specified, assume good
	const period = cov.period;
	if (!period) return(true); 

	// check if in period
	const now = new Date();
	if (period.start && new Date(period.start) > now) return(false);
	if (period.end && new Date(period.end) < now) return(false);

	// must be in period I guess
	return(true);
  }

  const renderActive = () => {

	const active = isActive();
	const cls = (active ? styles.green : styles.red);
	const term = (active ? "ACTIVE" : "INACTIVE");
	const code = (active ? 10003 : 10006);

	return(
	  <div className={[styles.covText,cls].join(' ')}>
		{String.fromCharCode(code)} Card data indicates
	    that coverage is {term} today
	  </div>
	);
  }

  const renderMember = () => {

	if (cov.relationship && cov.relationship.coding[0].code === "self") {
	  return(<></>);
	}
	
	const rel = (cov.relationship ? "Relationship: " + rf.renderCodable(cov.relationship) : "");
	const id = (cov.identifier ? <><b>{cov.identifier[0].value}</b><br/></> : "");
	
	return(
	  <tr>
		<th>Member</th>
		<td>
		  {id}
		  {rf.renderPerson(cov.beneficiary, resources)}
		  {rel}
	    </td>
	  </tr>
	);
  }
  
  const renderSubscriber = () => {
	return(
	  <tr>
		<th>Subscriber</th>
		<td>
		  <b>{cov.subscriberId}</b><br/>
		  {rf.renderPerson(cov.subscriber, resources)}
	    </td>
	  </tr>
	);
  }

  const renderPayorContactRows = (o) => {

	if (o.resourceType !== "Organization" || !o.contact || o.contact.length === 0) {
	  // TODO - Since payor can be a person if it's there and there is a "telecom"
	  // array we should probably render a general contact row with that
	  return(<tr><th>No Contact Info</th></tr>);
	}

	let key = 1;
	let url;
	
	const rows = o.contact.reduce((result, c) => {

	  const purpose = (c.purpose ? rf.renderCodable(c.purpose) : "Contact");

	  const addr = (c.address ? <>{rf.renderAddress(c.address)}<br/></> : "");
	  
	  const telecom = (!c.telecom ? "" : c.telecom.map((t) => {
		switch (t.system) {
		  case "phone":
		    url = "tel:" + t.value;
		    return(<><a href={url}>{t.value}</a><br/></>);

		  case "email":
		    url = "mailto:" + t.value;
		    return(<><a href={url}>{t.value}</a><br/></>);

		  case "url":
		    return(<><a target="blank" rel="noreferrer" href={t.value}>{t.value}</a><br/></>);

		  default:
		    return(<>{t.system}: {t.value}<br/></>);
		}
	  }));

	  if (addr === "" && telecom === "") return(result);
			
	  result.push(
	    <tr key={key++}>
		  <th>{purpose}:</th>
		  <td>{telecom}{addr}</td>
		</tr>
	  );

	  return(result);
	  
	}, []);

	return(rows);
  }
  
  const renderPayorContacts = () => {

	let rows;
	
	try {
	  rows = rf.renderReferenceMapThrow(cov.payor[0], resources,
										{ "any": renderPayorContactRows });
	}
	catch (err) {
	  rows = <tr><th>No Contact Info</th></tr>;
	}
	
	return(
	  <>
		<br clear="all" />
	    <table className={styles.innerTable}><tbody>
		{rows}
  	    </tbody></table>
	  </>
	);
  }
  
  const renderPayor = () => {

	let logo = <></>;
	const logoExt = rf.searchArray(cov.extension, (o) => (o.url && o.url === LOGO_EXTENSION));
	if (logoExt) logo = <div className={styles.logoImg}>{rf.renderImage(logoExt)}</div>;

	const renderMap = {
	  "Organization": rf.renderOrganization,
	  "any": rf.renderPerson
	};

	return(
	  <tr>
		<th>Payor</th>
		<td>
		  <div className={styles.payorContacts}>
		    <Button onClick={ () => setShowPayorContacts(!showPayorContacts) }>
		      contact info
		    </Button>
	      </div>
		  {logo}
	      {rf.renderReferenceMap(cov.payor[0], resources, renderMap)}
	      { showPayorContacts && renderPayorContacts() }
	  </td>
	  </tr>
	);
  }

  const renderPlanNumbers = () => {

	if (!cov.class) return(<></>);

	const rows = cov.class.map((c) => {

	  const hdr = c.type.coding[0].code;
	  
	  const val = (c.value ? c.value : "NA");
	  const name = c.name;
	  const disp = val + (name ? " (" + name + ")" : "");
	  
	  return(<tr key={hdr}><th>{hdr}:</th><td>{disp}</td></tr>);
	});
	
	return(
	  <tr>
		<th>Plan Numbers</th>
		<td>
		<table className={styles.innerTable}><tbody>{rows}</tbody></table>
		</td>
	  </tr>
	);
  }

  const renderCosts = () => {

	if (!cov.costToBeneficiary) return(<></>);

	const rows = cov.costToBeneficiary.map((c) => {

	  const hdr = rf.renderCodable(c.type);
	  return(<tr key={hdr}><th>{hdr}:</th><td>{rf.renderMoney(c.valueMoney)}</td></tr>);
	});
	
	return(
	  <tr>
		<th>Cost to Beneficiary</th>
		<td>
		<table className={styles.innerTable}><tbody>{rows}</tbody></table>
		</td>
	  </tr>
	);
  }

  const renderPeriod = () => {

	return(
	  <tr>
		<th>Coverage Window</th>
		<td>
		  { cov.period.start && !cov.period.end && "from "}
	      { cov.period.start &&  <>{rf.renderDate(cov.period.start)}</> }
	      { cov.period.end &&  <> through {rf.renderDate(cov.period.end)}</> }
		</td>
	  </tr>
	);
  }

  return(
    <div className={styles.container}>
	  <h2>Insurance Coverage</h2>
	  {renderActive()}

	  <table className={styles.dataTable}><tbody>
	    {renderMember()}
	    {renderSubscriber()}
	    {renderPeriod()}
	    {renderPlanNumbers()}
	    {renderPayor()}
	    {renderCosts()}
	  </tbody></table>
	  
	  <pre><code>{JSON.stringify(cardData.fhirBundle, null, 2)}</code></pre>

  </div>
  );

}



