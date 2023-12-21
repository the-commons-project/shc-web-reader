import React, { useState, useEffect, useRef } from 'react';
import { Button, TextField, Select, MenuItem } from '@mui/material';
import CircularProgress from '@mui/material/CircularProgress';
import { useOptionalFhir } from './OptionalFhir';
import { verifySHX, SHX_STATUS_NEED_PASSCODE, SHX_STATUS_OK  } from './lib/SHX.js';
import { saveDivToPdfFile, saveDivToFHIR, downloadBundleToJSON } from './lib/saveDiv.js';
import { getDeferringCodeRenderer } from './lib/codes.js';
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

  const [dcr, setDcr] = useState(getDeferringCodeRenderer());

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

  const msg = (passcode && Array.isArray(shxResult.reasons) && shxResult.reasons.length > 0)
            ? shxResult.reasons[0]  // Display the specific error message from PasscodeError
            : "This SMART Health Link requires a passcode.";

	
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
    let displayReasons = Array.isArray(reasons) ? reasons : [reasons];
    displayReasons = displayReasons.map(reason => reason.replaceAll("Error: ", ''));
    return(<div>{displayReasons.join('; ')}</div>);
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
		  elt = <Coverage organized={ organized } dcr={ dcr } />;
		  break;

	    case res.BTYPE_PS:
		  elt = <PatientSummary organized={ organized } dcr={ dcr } />;
		  break;

	    case res.BTYPE_IMMUNIZATION:
		  elt = <ImmunizationHistory organized={ organized } dcr={ dcr } />;
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
          { elt && <Button onClick={ () => onSaveClick(true) }>save to PDF</Button> }
          { elt && fhir && <Button onClick={ () => onSaveClick(false) }>save to ehr</Button> }
          { elt && <Button onClick={ () => downloadBundleToJSON(bundle.fhir, "fhir-bundle-data") }>Save as FHIR</Button> }
          <Button onClick={ () => setShowSource(!showSource) }>source</Button>
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
	  saveDivToPdfFile(div, baseName);
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

    verifySHX(shx, passcode)
        .then(result => {
            setShxResult(result);
        })
        .catch(error => {
            // Handle the error appropriately
        });
  }, [shx, passcode]);


  useEffect(() => {
	const checkDcr = async () => { if (await dcr.awaitDeferred()) setDcr(getDeferringCodeRenderer()); }
	checkDcr();
  });

  if (shxResult && shxResult.shxStatus === SHX_STATUS_NEED_PASSCODE) {
	return(renderNeedPasscode());
  }

  if (shxResult && shxResult.shxStatus !== SHX_STATUS_OK) {
	return(renderError(shxResult.reasons));
  }

  if (!shxResult || shxResult.bundles.length === 0) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', width: '100vw' }}>
        <CircularProgress />
      </div>
    );
  }

  return(renderBundle());
}