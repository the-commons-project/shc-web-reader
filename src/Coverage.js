import { useState } from 'react';
import { Button } from '@mui/material';
import * as futil from  './lib/fhirUtil.js';
import * as fcov from  './lib/fhirCoverage.js';
import Copyable from './Copyable.js';

import styles from './Coverage.module.css';

const LOGO_EXTENSION = "http://hl7.org/fhir/us/insurance-card/StructureDefinition/C4DIC-Logo-extension";

export default function Coverage({ cardData, cov, resources }) {

  const [showPayorContacts, setShowPayorContacts] = useState(false);

  const renderActive = () => {

	const active = fcov.isActive(cov);
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

	const idTxt = (cov.identifier ? cov.identifier[0].value : "");
	const id = (idTxt ? <><Copyable txt={idTxt} jsx=<b>{idTxt}</b> /><br/></> : "");
	
	const rel = (cov.relationship ? "Relationship: " + futil.renderCodable(cov.relationship) : "");

	return(
	  <tr>
		<th>Member</th>
		<td>
		  {id}
		  {futil.renderPerson(cov.beneficiary, resources)}
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
		  <Copyable txt={cov.subscriberId} jsx=<b>{cov.subscriberId}</b> /><br/>
		  {futil.renderPerson(cov.subscriber, resources)}
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

	  const purpose = (c.purpose ? futil.renderCodable(c.purpose) : "Contact");

	  const addr = (c.address ? <>{futil.renderAddress(c.address)}<br/></> : "");
	  
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
	  rows = futil.renderReferenceMapThrow(cov.payor[0], resources,
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
	const logoExt = futil.searchArray(cov.extension, (o) => (o.url && o.url === LOGO_EXTENSION));
	if (logoExt) logo = <div className={styles.logoImg}>{futil.renderImage(logoExt)}</div>;

	const renderMap = {
	  "Organization": futil.renderOrganization,
	  "any": futil.renderPerson
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
	      {futil.renderReferenceMap(cov.payor[0], resources, renderMap)}
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
	  
	  return(<tr key={hdr}><th>{hdr}:</th><td><Copyable txt={val} jsx={disp} /></td></tr>);
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

	  const hdr = futil.renderCodable(c.type);
	  return(<tr key={hdr}><th>{hdr}:</th><td>{futil.renderMoney(c.valueMoney)}</td></tr>);
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
	      { cov.period.start &&  <>{futil.renderDate(cov.period.start)}</> }
	      { cov.period.end &&  <> through {futil.renderDate(cov.period.end)}</> }
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


  </div>
  );

}



