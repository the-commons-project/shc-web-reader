import React from 'react';
import { Button } from '@mui/material';
import { useOptionalFhir } from './OptionalFhir';
import config from './lib/config.js';

import styles from './About.module.css';

export default function About({ setTab, tabValues }) {

  const fhir = useOptionalFhir();

  const lnk = (text, url) => {
	return(<a href={url} target="_blank" rel="noreferrer">{text}</a>);
  }

  const renderTabButton = (tab, text) => {
	return(<p><Button variant='contained' onClick={ () => setTab(tab) }>{text}</Button></p>);
  }

  const commonsLink = lnk("The Commons Project", "https://www.thecommonsproject.org/");
  const smartLink =	lnk("SMART Health Cards and Links", "https://smarthealth.cards/");
  
  const srcLink = lnk("open source application",
					  "https://github.com/the-commons-project/shc-web-reader");
  
  const covidLink = lnk("COVID-19 vaccine cards",
						"https://smarthealth.cards/en/find-my-issuer.html");
  
  const ipsLink = lnk("International Patient Summaries",
					  "https://international-patient-summary.net/");

  
  return (
	<div className={styles.container}>

	  <div className={styles.cardImg}>
		<img src="shc.png" alt="SMART Health Card" style={{ width: "100%" }} />
	  </div>

	  <div className={styles.content} >
		<h1>View SMART Health Cards and Links</h1>

		{ config("showScan") && renderTabButton(tabValues.Scan, "Use a 2D barcode scanner") }
		{ config("showPhoto") && renderTabButton(tabValues.Photo, "Use your camera") }
		{ config("showFile") && renderTabButton(tabValues.File, "Open a file") }
		{ config("showScan") && renderTabButton(tabValues.Scan, "Type or paste a code") }
		{ fhir && config("showSearch") && renderTabButton(tabValues.Search, "Find a code in patient record") }
	  </div>

	  <div className={styles.deets} >
		<p>
		  Developed and maintained by {commonsLink}, this {srcLink} can
		  be used standalone or embedded within an EHR to read information in {smartLink}.
		  Supported data types currently include {covidLink}, general immunization
		  records, {ipsLink}, and Digital Health Insurance Cards.
		</p>
		<p>
		  If you would like to host the viewer yourself, contribute features or fixes
		  to the project, or have any other questions, please contact {commonsLink}.
		  Personal health information is processed exclusively in the browser and is
		  never sent to the servers hosting the viewer.
		</p>
	  </div>
	</div>
  );
}

