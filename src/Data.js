import React, { useState, useEffect, useRef } from 'react';
import { Button, TextField, Select, MenuItem } from '@mui/material';
import { useOptionalFhir } from './OptionalFhir';
import { verifySHX, SHX_STATUS_NEED_PASSCODE, SHX_STATUS_OK  } from './lib/SHX.js';
import { saveDivToFile, saveDivToFHIR } from './lib/saveDiv.js';
import * as res from './lib/resources.js';
import ValidationInfo from './ValidationInfo.js';
import WrongPatientWarning from './WrongPatientWarning.js';

import Coverage from './Coverage.js';
import ImmunizationHistory from './ImmunizationHistory.js'
import PatientSummary from './PatientSummary.js';

export default function Data({ shx }) {

  const [passcode, setPasscode] = useState(undefined);
  const [shxResult, setShxResult] = useState(undefined);
  const [bundleIndex, setBundleIndex] = useState(0);
  const [showSource, setShowSource] = useState(false);

  const fhir = useOptionalFhir();

  // +--------------------+
  // | renderNeedPasscode |
  // +--------------------+

  const passcodeRef = useRef(null);

  const passcodeClick = async () => {
	setPasscode(passcodeRef.current.value);
	setShxResult(undefined);
  }

  const passcodeKeyDown = (evt) => {
	if (evt.key === 'Enter') passcodeClick(); 
  }
  
  const renderNeedPasscode = () => {

	const msg = (passcode
				 ? "Given passcode not valid for this SMART Health Link."
				 : "This SMART Health Link requires a passcode.");
	
	return(
	  <>
		<div>{msg}</div>

		<div>
		  <TextField variant='outlined'
					 margin='normal'
					 type='password'
					 autoComplete='off'
					 autoFocus
					 inputRef={passcodeRef}
					 onKeyDown={passcodeKeyDown}
		  />
		</div>
		
		<div>
		  <Button variant='contained'
				  onClick={ passcodeClick } >
			Submit
		  </Button>
		</div>
		
	  </>
	);
  }

  // +-------------+
  // | renderError |
  // +-------------+

  const renderError = (reasons) => {
	return(<div>{Array.isArray(reasons) ? reasons.join('; ') : reasons}</div>);
  }

  // +---------------------+
  // | renderBundle        |
  // | renderBundleChooser |
  // +---------------------+

  const renderBundle = () => {

	const bundle = shxResult.bundles[bundleIndex];
	const organized = (bundle.contentOK() ? bundle.organized : undefined);
	
	let elt = undefined;

	if (organized) {
	  
	  switch (organized.typeInfo.btype) {
		
	    case res.BTYPE_COVERAGE:
		  elt = <Coverage organized={ organized } />;
		  break;

	    case res.BTYPE_PS:
		  elt = <PatientSummary organized={ organized } />;
		  break;

	    case res.BTYPE_IMMUNIZATION:
		  elt = <ImmunizationHistory organized={ organized } />;
		  break;

		// >>> ADD MORE RENDERERS HERE <<<
		
	    default:
		  elt = <pre><code>{JSON.stringify(bundle.fhir, null, 2)}</code></pre>;  
		  break;
	  }
	}
	
	return(
	  <>
		{ renderBundleChooser() }
		<div id="bundle-contents">
		  <ValidationInfo bundle={bundle} />
		  <WrongPatientWarning organized={organized} />
		  { elt }
		</div>
		<div>
	      <Button onClick={ () => setShowSource(!showSource) }>source</Button>
	      { elt && <Button onClick={ () => onSaveClick(true) }>save to file</Button> }
	      { elt && fhir && <Button onClick={ () => onSaveClick(false) }>save to ehr</Button> }
	      { showSource && <pre><code>{JSON.stringify(bundle, null, 2)}</code></pre>}
		</div>
	  </>
	);
	
  }

  const onSaveClick = (toFile) => {

	// defensive because we can show in error cases too
	const baseName = (shxResult &&
					  shxResult.bundles &&
					  shxResult.bundles[bundleIndex] &&
					  shxResult.bundles[bundleIndex].organized &&
					  shxResult.bundles[bundleIndex].organized.typeInfo &&
					  shxResult.bundles[bundleIndex].organized.typeInfo.label
					  
					  ? shxResult.bundles[bundleIndex].organized.typeInfo.label
					  : "Shared Information");

	const div = document.getElementById("bundle-contents");
	
	if (toFile) {
	  saveDivToFile(div, baseName);
	}
	else {
	  saveDivToFHIR(fhir, div, baseName);
	}
  }

  const onBundleChange = (evt) => {
	setBundleIndex(parseInt(evt.target.value));
  }
  
  const renderBundleChooser = () => {

	if (shxResult.bundles.length <= 1) return(undefined);

 	const elts = [];
	for (const i in shxResult.bundles) {
	  elts.push(<MenuItem key={i} value={i}>
				  {shxResult.bundles[i].organized.typeInfo.label}
				</MenuItem>);
	}

	return(
	  <>
		<span style={{ padding: "0px 8px 0px 6px" }} >
		  Section { bundleIndex + 1 } of { shxResult.bundles.length }:
		</span>
	  <Select
		value={bundleIndex}
		sx={{ mb: 2 }}
		onChange={ onBundleChange } >
		
		{ elts }
		
	  </Select>
	  </>
	);
  }
  
  // +-------------+
  // | Main Render |
  // +-------------+
  
  useEffect(() => {
	verifySHX(shx, passcode).then(result => setShxResult(result));
  }, [shx,passcode]);

  if (shxResult && shxResult.shxStatus === SHX_STATUS_NEED_PASSCODE) {
	return(renderNeedPasscode());
  }

  if (shxResult && shxResult.shxStatus !== SHX_STATUS_OK) {
	return(renderError(shxResult.reasons));
  }

  if (!shxResult || shxResult.bundles.length === 0) {
	return(<></>);
  }

  return(renderBundle());
}
