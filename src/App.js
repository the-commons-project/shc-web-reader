import React, { useState } from 'react';
import { Tab, Tabs } from '@mui/material';
import About from './About.js';
import Scan from './Scan.js';
import Photo from './Photo.js';
import Search from './Search.js';
import Data from './Data.js';
import { useOptionalFhir } from './OptionalFhir';

import styles from './App.module.css';

const TabValue = {
  About: 'about',
  Scan: 'scan',
  Photo: 'photo',
  Search: 'search',
  Data: 'data'
}

export default function App() {

  const [tabValue, setTabValue] = useState(TabValue.About);
  const [scannedSHC, setScannedSHC] = useState(undefined);
  const fhir = useOptionalFhir();

  const handleTabChange = (evt, newValue) => {
	setTabValue(newValue);
  };

  function viewData(shc) {
	setScannedSHC(shc);
	setTabValue(TabValue.Data);
  }
  
  return (

	<div className={styles.container}>

	  <div className={styles.nav}>
	  
		<Tabs value={tabValue} onChange={handleTabChange} orientation='horizontal'>
		  <Tab label='About' value={TabValue.About} />
		  <Tab label='Scan Card' value={TabValue.Scan} />
		  <Tab label='Take Photo'  value={TabValue.Photo} />
		  { fhir && <Tab label='Search Record' value={TabValue.Search} /> }
		  { scannedSHC && <Tab label='Card Details' value={TabValue.Data} /> }
		</Tabs>

	  </div>

	  <div className={styles.content}>
		{ tabValue === TabValue.About  && <About /> }
		{ tabValue === TabValue.Scan   && <Scan viewData={viewData} /> }
		{ tabValue === TabValue.Photo  && <Photo viewData={viewData} /> }
		{ tabValue === TabValue.Search && <Search viewData={viewData} /> }
		{ tabValue === TabValue.Data   && <Data shc={scannedSHC} /> }
	  </div>

	</div>
  );
}

