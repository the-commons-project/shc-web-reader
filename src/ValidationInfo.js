import { useState } from 'react';
import { Button } from '@mui/material';

import styles from './ValidationInfo.module.css';

export default function ValidationInfo({ cardData }) {

  const [showDetails, setShowDetails] = useState(false);

  // +-------------+
  // | renderValid |
  // +-------------+

  const renderValid = (cardData) => {
	
	let issuer = cardData.issuerName;
	if (cardData.issuerURL) {
	  issuer = <a target="_blank" rel="noreferrer"
				  href={cardData.issuerURL}>{issuer}</a>;
	}

	const issueDate = cardData.issueDate.toLocaleString('en-US', {
	  month: 'long', day: 'numeric', year: 'numeric' });

	const revocationQualifier =
		  (cardData.supportsRevocation ? '' :
		   <> Because this issuer does not support revocation,
		   details may have changed since that time.</>);

	return(
	  <>
		This card is <span className={styles.green}>valid</span> and
		was issued by <b>{issuer}</b> on <b>{issueDate}</b>.
		{revocationQualifier}
	  </>
	);
  }

  // +---------------+
  // | renderInvalid |
  // +---------------+
  
  const renderInvalid = (cardData) => {

	const reasons = cardData.reasons.map(r => <li key={r}>{r}</li>);
	
	return(
	  <>
		{errorsLink(cardData)}
		This card is <span className={styles.red}>invalid</span>.
		<ul>{reasons}</ul>
	  </>
	);
  }

  const errorsLink = (cardData) => {
	return(
	  <div className={styles.errors}>
		<Button onClick={ () => setShowDetails(!showDetails) }>
		  details
		</Button>
	  </div>
	);
  }

  // +--------+
  // | render |
  // +--------+

  let details = '';
  if (showDetails) {
	details = <pre><code>{JSON.stringify(cardData, null, 2)}</code></pre>;
  }

  return(
	<div className={styles.container}>
	  {cardData.certValid() ? renderValid(cardData) : renderInvalid(cardData)}
	  {details}
	</div>
  );
}

