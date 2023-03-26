
import styles from './Coverage.module.css';

export default function Coverage({ cardData, cov }) {

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

  return(
    <div className={styles.container}>
	  <h2>Insurance Coverage</h2>
	  {renderActive()}
	  <pre><code>{JSON.stringify(cardData.fhirBundle, null, 2)}</code></pre>);
	</div>
  );

}



