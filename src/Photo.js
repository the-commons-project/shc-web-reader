import React, { useState, useEffect } from 'react';
import { Button } from '@mui/material';
import config from './lib/config.js';
import QrScanner from 'qr-scanner';

export default function Photo({ viewData }) {

  const [haveCamera, setHaveCamera] = useState(true);
  const [paused, setPaused] = useState(false);

  const openCameraClick = () => {
	const cameraIdMode = window.sc.getSelectedCamera(config("cameraIdMode"));
	const url = 'captureQR.html#' + escape(cameraIdMode);
	window.openCameraResult = openCameraResult;
	window.open(url, 'captureQR', 'width=500,height=300');
  }

  const unPauseCameraClick = () => { setPaused(false); }
  const pauseCamera = () => { setPaused(true); } 

  // called from our popup
  // eslint-disable-next-line
  const openCameraResult = (shx) => {
	viewData(shx);
  }

  // +-----------+
  // | useEffect |
  // +-----------+

  useEffect(() => {

	if (!haveCamera || paused) return;
	  
	const qrScanner = new QrScanner(
	  document.getElementById('video'),
	  result => viewData(result.data), 
	  {
		preferredCamera: window.sc.getSelectedCamera(config("cameraIdMode")),
		highlightScanRegion: true,
		highlightCodeOutline: true,
		returnDetailedScanResult: true
	  });

	qrScanner.start().then(() => {
	  window.sc.maybeShowSwitchCamera(qrScanner, 'switchCamera');
	})
	.catch((err) => {
	  console.error(err);
	  setHaveCamera(false);
	});

	const millis = config("cameraPauseTimeoutMillis");
	const timerId = setTimeout(pauseCamera, millis);

	return () => {
	  clearTimeout(timerId);
	  qrScanner.stop();
	  qrScanner.destroy();
	}
	
  }, [haveCamera, setHaveCamera, paused, viewData]);
	
  // +--------+
  // | render |
  // +--------+

  return (
	<div>

	  <h1>Capture Smart Health QR Code Image</h1>
	  
	  { paused &&
		<div>
		  <p>Camera paused</p>
		  <Button variant='contained' onClick={unPauseCameraClick}>Restart</Button>
		</div> }

	  { haveCamera &&
		<>
          <video id='video' style={{ width: '100%', maxWidth: '400px', height: 'auto' }}></video>
		  <div id='switchCamera' style={{ display: 'none' }}>
			<Button variant='text' onClick={ window.sc.switchCameraClick }>
			  Change Camera
			</Button> 
		  </div>
		</>
	  }

	  { !haveCamera &&
		<Button variant='contained' onClick={openCameraClick}>Open Camera</Button> }
	  
	</div>
  );
}
