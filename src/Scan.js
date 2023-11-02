import React, { useState, useEffect, useCallback } from 'react';
import { Button, TextField } from '@mui/material';
import { looksLikeSHX } from './lib/SHX.js';
import { looksLikeJSON } from './lib/fhirUtil.js';

export default function Scan({ viewData }) {

  const [qrCode, setQRCode] = useState('');

  const maybeSHX = useCallback(() => {
	return(looksLikeSHX(qrCode) || looksLikeJSON(qrCode));
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

	  <TextField variant='outlined'
				 rows={6}
				 margin='normal'
				 fullWidth
				 autoFocus
				 multiline
				 value={qrCode}
				 onChange={handleQRCodeChange}
	  />

	  <Button variant='contained'
			  disabled={ !maybeSHX() }
			  onClick={ async () => viewData(qrCode) } >
		Read Code
	  </Button>
		
						
	

	</div>
  );
}
