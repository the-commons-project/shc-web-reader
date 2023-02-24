import React, { useState, useEffect, useCallback } from 'react';
import { Button, TextField } from '@mui/material';

export default function Scan({ viewData }) {

  const [qrCode, setQRCode] = useState('');

  const looksLikeSHC = useCallback(() => {
	return(qrCode.startsWith('shc:/'));
  }, [qrCode]);
  
  const handleQRCodeChange = async (evt) => {
	setQRCode(evt.target.value);
  };

  useEffect(() => {
	if (looksLikeSHC() && qrCode.endsWith('\n')) viewData(qrCode);
  }, [qrCode,looksLikeSHC,viewData]);

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
			  disabled={ !looksLikeSHC() }
			  onClick={ async () => viewData(qrCode) } >
		Read Code
	  </Button>
		
						
	

	</div>
  );
}
