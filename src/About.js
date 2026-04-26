import React from 'react';
import { Button } from '@mui/material';
import { useOptionalFhir } from './OptionalFhir';
import config from './lib/config.js';
import { useLanguage } from './lib/LanguageContext';

import styles from './About.module.css';

export default function About({ setTab, tabValues }) {
  const { t } = useLanguage();
  const fhir = useOptionalFhir();

  const lnk = (text, url) => {
	return(<a href={url} target="_blank" rel="noreferrer">{text}</a>);
  }

  const renderTabButton = (tab, text) => {
	return(<p><Button variant='contained' onClick={ () => setTab(tab) }>{text}</Button></p>);
  }

  const commonsLink = lnk(t('aboutContent2'), "https://www.thecommonsproject.org/");

  const srcLink = lnk(t('aboutContent4'),
					  "https://github.com/the-commons-project/shc-web-reader");

  const smartLink = lnk(t('aboutContent6'), "https://smarthealth.cards/");

  const covidLink = lnk(t('aboutContent8'),
						"https://smarthealth.cards/en/find-my-issuer.html");

  const ipsLink = lnk(t('aboutContent10'),
					  "https://international-patient-summary.net/");



  return (
	<div className={styles.container}>

	  <div className={styles.cardImg}>
		<img src="shc.png" alt="SMART Health Card" style={{ width: "100%" }} />
	  </div>

	  <div className={styles.content} >
		<h1>{t('aboutSubtitle')}</h1>

		{ config("showScan") && renderTabButton(tabValues.Scan, t('scanDescriptionShort')) }
		{ config("showPhoto") && renderTabButton(tabValues.Photo, t('photoDescriptionShort')) }
		{ config("showFile") && renderTabButton(tabValues.File, t('openFileText')) }
		{ config("showScan") && renderTabButton(tabValues.Scan, t('typeOrPaste')) }
		{ fhir && config("showSearch") && renderTabButton(tabValues.Search, t('findCode')) }
	  </div>

	  <div className={styles.deets} >
		<p>
			{t('aboutContent1')} {commonsLink}, {t('aboutContent3')} {srcLink} {t('aboutContent5')} {smartLink}.
			{' '}
			{t('aboutContent7')} {covidLink}, {t('aboutContent9')}, {ipsLink}, {t('aboutContent11')}.
		</p>
		<p>
			{t('aboutContributing')} {commonsLink}.
			{' '}
			{t('aboutPrivacy')}.
		</p>
	  </div>
	</div>
  );
}

