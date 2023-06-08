import React, { useState, useEffect, useRef } from 'react';
import { Button, TextField } from '@mui/material';
import { verifySHX, SHX_STATUS_NEED_PASSCODE, SHX_STATUS_OK  } from './lib/SHX.js';
import Bundle from './Bundle.js';

export default function Data({ shx }) {

  const [passcode, setPasscode] = useState(undefined);
  const [shxResult, setShxResult] = useState(undefined);

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

  if (!shxResult || shxResult.bundles.length === 0) {
	return(<></>);
  }

  return(
	<>
	  <Bundle bundle={shxResult.bundles[0]} />
	</>
  );

}
