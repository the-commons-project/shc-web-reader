
import { renderOrganization, renderPerson, renderReferenceMap, renderImage, searchArray } from './lib/renderFhir.js';

import styles from './Coverage.module.css';

const LOGO_EXTENSION = "http://hl7.org/fhir/us/insurance-card/StructureDefinition/C4DIC-Logo-extension";

export default function Coverage({ cardData, cov, resources }) {

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

  const renderPayor = () => {

	let logo = <></>;
	const logoExt = searchArray(cov.extension, (o) => (o.url && o.url === LOGO_EXTENSION));
	if (logoExt) logo = <div className={styles.logoImg}>{renderImage(logoExt)}</div>;

	const renderMap = {
	  "Organization": renderOrganization,
	  "any": renderPerson
	};

	return(
	  <tr>
		<th>Payor</th>
		<td>{logo}{renderReferenceMap(cov.payor[0], resources, renderMap)}</td>
	  </tr>
	);
  }

  const renderPlanNumbers = () => {

	if (!cov.class) return(<></>);

	const rows = cov.class.map((c) => {
	  const val = (c.value ? c.value : "NA");
	  const name = c.name;
	  const disp = val + (name ? " (" + name + ")" : "");
	  return(<tr><th>{c.type.coding[0].code}:</th><td>{disp}</td></tr>);
	});
	
	return(
	  <tr>
		<th>Plan Numbers</th>
		<td>
		<table className={styles.innerTable}>{rows}</table>
		</td>
	  </tr>
	);
  }

  return(
    <div className={styles.container}>
	  <h2>Insurance Coverage</h2>
	  {renderActive()}

	  <table className={styles.dataTable}><tbody>
	    <tr><th>Subscriber</th><td>{cov.subscriberId}<br/>{renderPerson(cov.subscriber, resources)}</td></tr>
	    {renderPayor()}
	    {renderPlanNumbers()}
	  </tbody></table>
	  
	  <pre><code>{JSON.stringify(cardData.fhirBundle, null, 2)}</code></pre>
	</div>
  );

}



