import { CERT_STATUS_VALID, CERT_STATUS_INVALID } from './lib/SHX.js';

import styles from './ValidationInfo.module.css';
import { useLanguage } from './lib/LanguageContext';

export default function ValidationInfo({ bundle }) {
  const { t, currentLanguage } = useLanguage();

  // +-------------+
  // | renderValid |
  // +-------------+

  const renderValid = () => {

	let issuer = bundle.issuerName;
	if (bundle.issuerURL) {
	  issuer = <a target="_blank" rel="noreferrer"
				  href={bundle.issuerURL}>{issuer}</a>;
	}

	const issueDate = bundle.issueDate.toLocaleString(currentLanguage === 'fr' ? 'fr-CA' : 'en-US', {
	  month: 'long', day: 'numeric', year: 'numeric' });

	const revocationQualifier =
		  (bundle.supportsRevocation ? '' : <> {t('noRevocation')} </>);

	return(
	  <div className={styles.container}>
		{t('validation1')} <span className={styles.green}>{t('validation2')}</span> {t('validation3')} <b>{issuer}</b> {t('validation4')} <b>{issueDate}</b>.
		{revocationQualifier}
	  </div>
	);
  }

  // +---------------+
  // | renderInvalid |
  // +---------------+

  const renderInvalid = () => {

	const reasons = bundle.reasons.map(r => (
	  <li key={r}>
		{/* TODO: Use translation function instead? */}
		{currentLanguage === 'fr'
		  ? (r === 'bad-signature' ? 'Mauvaise signature' : r === 'failed-validation' ? 'Validation échouée' : r)
		  : r}
	  </li>
	));

	return(
	  <div className={styles.container}>
		{t('validation1')} <span className={styles.red}>{t('invalidValidation')}</span>.
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

