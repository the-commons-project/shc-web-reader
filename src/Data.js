import React, { useState, useEffect, useRef } from 'react';
import { Button, TextField, Select, MenuItem } from '@mui/material';
import { verifySHX, SHX_STATUS_NEED_PASSCODE, SHX_STATUS_OK  } from './lib/SHX.js';
import Bundle from './Bundle.js';

export default function Data({ shx }) {

  const [passcode, setPasscode] = useState(undefined);
  const [shxResult, setShxResult] = useState(undefined);
  const [bundleIndex, setBundleIndex] = useState(0);

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
  // | renderBundleChooser |
  // +---------------------+

  const onBundleChange = (evt) => {
	setBundleIndex(evt.target.value);
  }
  
  const renderBundleChooser = () => {

	if (shxResult.bundles.length <= 1) return(undefined);

	const elts = [];
	for (const i in shxResult.bundles) {
	  elts.push(<MenuItem key={i} value={i}>{shxResult.bundles[i].label}</MenuItem>);
	}
	
	return(
	  <Select
		value={bundleIndex}
		sx={{ mb: 2 }}
		onChange={ onBundleChange } >
		
		{ elts }
		
	  </Select>
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

  return(
	<>
	  { renderBundleChooser() }
	  <Bundle bundle={shxResult.bundles[bundleIndex]} />
	</>
  );

}
