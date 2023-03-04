import React, { useState, useEffect } from 'react';
import { Button } from '@mui/material';
import QrScanner from 'qr-scanner';

export default function Photo({ viewData }) {

  const [haveCamera, setHaveCamera] = useState(true);

  const openCameraClick = () => {
	window.openCameraResult = openCameraResult;
	window.open('captureQR.html', 'captureQR', 'width=500,height=300');
  }

  // called from our popup
  // eslint-disable-next-line
  const openCameraResult = (shx) => {
	viewData(shx);
  }

  useEffect(() => {

	if (!haveCamera) return;
	  
	const qrScanner = new QrScanner(
	  document.getElementById('video'),
	  result => viewData(result.data), 
	  {
		preferredCamera: 'user',
		highlightScanRegion: true,
		highlightCodeOutline: true,
		returnDetailedScanResult: true
	  });

	qrScanner.start().catch((err) => {
	  console.error(err);
	  setHaveCamera(false);
	});

	return () => {
	  qrScanner.destroy();
	}
	
  }, [haveCamera,setHaveCamera,viewData]);
	
  return (
	<div>

	  <h1>Capture Smart Health QR Code Image</h1>
	  
	  { haveCamera &&
		<video id='video' style={{ width: '400px', height: '225px' }}></video> }
	  
	  { !haveCamera &&
		<Button variant='contained' onClick={openCameraClick}>Open Camera</Button> }
	  
	</div>
  );
}
