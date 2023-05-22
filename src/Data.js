import React, { useState, useEffect, useRef } from 'react';
import { Button, TextField } from '@mui/material';
import { verifySHX, SHX_STATUS_NEED_PASSCODE, SHX_STATUS_OK  } from './lib/SHX.js';
import MultiResource from './MultiResource.js';
import DemoCoverage from './DemoCoverage.js';
import config from './lib/config.js';

export default function Data({ shx }) {

  const [passcode, setPasscode] = useState(undefined);
  const [shxResult, setShxResult] = useState(undefined);
  const [showBundle, setShowBundle] = useState(false);
  const [demoView, setDemoView] = useState(config("mayDemo"));

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
  
  const cardData = ((shxResult && shxResult.bundles.length > 0) ?
					shxResult.bundles[0] : undefined);
  
  if (!cardData) return(<></>);

  // at least for now, we don't want to show contents if the cert
  // is invalid ... the simplest way to make that happen now is
  // to make the fhir element go away. REVISIT THIS when doing
  // multi-bundles better.
  if (!cardData.contentOK()) cardData.fhir = undefined;
  
  // build up a dictionary so we can resolve references
  let resources = {};
  if (cardData.fhir && cardData.fhir.entry) {
	for (const i in cardData.fhir.entry) {
	  let entry = cardData.fhir.entry[i];
	  resources[entry.fullUrl] = entry.resource;
	}
  }

  const renderer = (demoView
					? <DemoCoverage cardData={cardData} resources={resources} />
					: <MultiResource cardData={cardData} resources={resources} />);

  return(
	<>
	  {renderer}
	  <div>
	    <Button onClick={ () => setDemoView(!demoView) }>toggle view</Button> |
	    <Button onClick={ () => setShowBundle(!showBundle) }>source</Button>
	    { showBundle && <pre><code>{JSON.stringify(cardData.fhir, null, 2)}</code></pre>}
	  </div>
	</>
  );

}
