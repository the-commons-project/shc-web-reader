import React, { useState, useEffect, useCallback } from 'react';
import { Button, TextField } from '@mui/material';
import { looksLikeSHX } from './lib/SHX.js';

export default function Scan({ viewData }) {

  const [qrCode, setQRCode] = useState('');

  const maybeSHX = useCallback(() => {
	return(looksLikeSHX(qrCode));
  }, [qrCode]);
  
  const handleQRCodeChange = async (evt) => {
	setQRCode(evt.target.value);
  };

  useEffect(() => {
	if (maybeSHX() && qrCode.endsWith('\n')) viewData(qrCode);
  }, [qrCode,maybeSHX,viewData]);

  return (
	<div>
	  <h1>Scan a Smart Health Card QR Code</h1>

	  {/* Ensure this input field is easily interactable on mobile devices. */}
	  <TextField variant='outlined'
				 rows={6}
				 margin='normal'
				 fullWidth
				 autoFocus
				 multiline
				 value={qrCode}
				 onChange={handleQRCodeChange}
	  />

	  {/* Ensure this button is easily interactable on mobile devices. */}
	  <Button variant='contained'
			  disabled={ !maybeSHX() }
			  onClick={ async () => viewData(qrCode) } >
		Read Code
	  </Button>
		
						
	

	</div>
  );
}
