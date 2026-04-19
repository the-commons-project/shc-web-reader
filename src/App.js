import React, { useEffect, useState } from 'react';
import { Tab, Tabs, Button } from '@mui/material';
import About from './About.js';
import Scan from './Scan.js';
import File from './File.js';
import Photo from './Photo.js';
import Search from './Search.js';
import Data from './Data.js';
import TCPFooter from './TCPFooter.js';
import { useOptionalFhir } from './OptionalFhir';
import config from './lib/config.js';
import { LanguageProvider, useLanguage } from './lib/LanguageContext';
import { DocumentModalProvider } from './DocumentModalContext';

import styles from './App.module.css';

const TabValue = {
  About: 'about',
  Scan: 'scan',
  File: 'file',
  Photo: 'photo',
  Search: 'search',
  Data: 'data'
}

function AppContent() {
  const [tabValue, setTabValue] = useState(config("initialTab"));
  const [scannedSHX, setScannedSHX] = useState(undefined);
  const fhir = useOptionalFhir();
  const { t, toggleLanguage, currentLanguage } = useLanguage();

  const handleTabChange = (evt, newValue) => {
	setTabValue(newValue);
  };

  function setTab(newTab) {
	setTabValue(newTab);
  }

  function viewData(shx) {
	setScannedSHX(shx);
	setTabValue(TabValue.Data);
  }

  useEffect(() => {

	const shx = config("shx");
	if (shx) viewData(shx);

  }, []); // empty array as second param ensures we'll only run once
  
  return (

	<div className={styles.container}>

	  <div className={styles.nav}>

		<Tabs
		  value={tabValue}
		  onChange={handleTabChange}
		  orientation='horizontal'
		  variant='scrollable'>

		  <Tab label={t('aboutTab')} value={TabValue.About} />
		  { config("showScan") && <Tab label={t('scanTab')} value={TabValue.Scan} /> }
		  { config("showFile") && <Tab label={t('fileTab')} value={TabValue.File} /> }
		  { config("showPhoto") && <Tab label={t('photoTab')} value={TabValue.Photo} /> }
		  { fhir && config("showSearch") && <Tab label={t('searchTab')} value={TabValue.Search} /> }
		  { scannedSHX && <Tab label={t('dataTab')} value={TabValue.Data} /> }
		</Tabs>

		<Button
		  onClick={toggleLanguage}
		  className={styles.languageButton}
		>
		  {currentLanguage === 'en' ? 'FR' : 'EN'}
		</Button>

	  </div>

	  <div className={styles.content}>
		{ tabValue === TabValue.About  && <About setTab={setTab} tabValues={TabValue} /> }
		{ tabValue === TabValue.Scan   && <Scan viewData={viewData} /> }
		{ tabValue === TabValue.File   && <File viewData={viewData} /> }
		{ tabValue === TabValue.Photo  && <Photo viewData={viewData} /> }
		{ tabValue === TabValue.Search && <Search viewData={viewData} /> }
		{ tabValue === TabValue.Data   && <Data shx={scannedSHX} /> }
	  </div>

	  { config("tcpFooter") && <TCPFooter /> }

	</div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <DocumentModalProvider>
        <AppContent />
      </DocumentModalProvider>
    </LanguageProvider>
  );
}

