import { CERT_STATUS_VALID, CERT_STATUS_INVALID } from './lib/SHX.js';

import styles from './ValidationInfo.module.css';

export default function ValidationInfo({ bundle }) {

  // +-------------+
  // | renderValid |
  // +-------------+

  const renderValid = () => {
	
	let issuer = bundle.issuerName;
	if (bundle.issuerURL) {
	  issuer = <a target="_blank" rel="noreferrer"
				  href={bundle.issuerURL}>{issuer}</a>;
	}

	const issueDate = bundle.issueDate.toLocaleString('en-US', {
	  month: 'long', day: 'numeric', year: 'numeric' });

	const revocationQualifier =
		  (bundle.supportsRevocation ? '' :
		   <> Because this issuer does not support revocation,
		   details may have changed since that time.</>);

	return(
	  <div className={styles.container}>
		This card is <span className={styles.green}>valid</span> and
		was issued by <b>{issuer}</b> on <b>{issueDate}</b>.
		{revocationQualifier}
	  </div>
	);
  }

  // +---------------+
  // | renderInvalid |
  // +---------------+
  
  const renderInvalid = () => {

	const reasons = bundle.reasons.map(r => <li key={r}>{r}</li>);
	
	return(
	  <div className={styles.container}>
		This card is <span className={styles.red}>invalid</span>.
		<ul>{reasons}</ul>
	  </div>
	);
  }

  // +------------+
  // | renderNone |
  // +------------+

  const renderNone = () => {
	return(<></>);
  }

  // +--------+
  // | render |
  // +--------+

  let info = undefined;
  switch (bundle.certStatus) {
    case CERT_STATUS_VALID: info = renderValid(); break;
    case CERT_STATUS_INVALID: info = renderInvalid(); break;
    default: info = renderNone(); break;
  }
  
  return(info);
}

