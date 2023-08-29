import React, { useState, useEffect } from 'react';
import { Button } from '@mui/material';
import config from './lib/config.js';
import QrScanner from 'qr-scanner';

export default function Photo({ viewData }) {

  const [haveCamera, setHaveCamera] = useState(true);
  const [paused, setPaused] = useState(false);

  const openCameraClick = () => {
	const url = 'captureQR.html#' + escape(getSelectedCamera());
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

  // +---------------+
  // | Switch Camera |
  // +---------------+

  const maybeShowSwitchCamera = async (qrScanner) => {

	const cams = await QrScanner.listCameras();
	if (cams.length === 1) return;

	document.getElementById('switchCamera').style.display = 'block';
  }

  let switchTimer = undefined;
  const dblClickMillis = 250;
  
  const switchCameraClick = async (isTimer) => {

	if (isTimer) {
	  // double-click timeout --- single
	  switchTimer = undefined;
	  await switchCameraAction(false);
	}
	else if (switchTimer) {
	  // second click within period --- double
	  clearTimeout(switchTimer);
	  switchTimer = undefined;
	  await switchCameraAction(true);
	}
	else {
	  // first click --- set timer
	  switchTimer = setTimeout(() => switchCameraClick(true), dblClickMillis);
	}
  }

  const switchCameraAction = async (isDouble) => {
	
	let currentCam = getSelectedCamera();
	let newCam = undefined;

	if (isDouble) {
	  // switch by id
	  if (isFacingMode(currentCam)) currentCam = findCurrentCam(true);
	  newCam = await findNextCameraId(currentCam);
	}
	else {
	  // switch by mode
	  if (!isFacingMode(currentCam)) currentCam = findCurrentCam(false);
	  newCam = (currentCam === 'user' ? 'environment' : 'user');
	}

	console.log(`Switching camera from ${currentCam} to ${newCam}`);
	
	saveSelectedCamera(newCam);
	window.scanner.setCamera(newCam);
  }

  const findCurrentCam = (getId) => {

	const vid = document.getElementById('video');
	const track = vid.srcObject.getTracks().find(t => t.kind === 'video');
	const settings = track.getSettings();
	return(getId ? settings.deviceId : settings.facingMode);
  }

  const findNextCameraId = async (currentId) => {

	const cams = await QrScanner.listCameras(true);

	let i = 0;
	while (i < cams.length) {
	  if (cams[i].id === currentId) break;
	  ++i;
	}

	return(cams[(i >= (cams.length - 1)) ? 0 : i + 1].id);
  }

  const isFacingMode = (s) => (s === 'user' || s === 'environment');

  function getSelectedCamera() {
	const cached = localStorage.getItem('cameraIdMode');
	return(cached || config('cameraIdMode'));
  }

  function saveSelectedCamera(cameraIdMode) {
	try { localStorage.setItem('cameraIdMode', cameraIdMode); }
	catch (err) { console.error(err.toString()); }
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
		preferredCamera: getSelectedCamera(),
		highlightScanRegion: true,
		highlightCodeOutline: true,
		returnDetailedScanResult: true
	  });

	qrScanner.start().then(() => {
	  window.scanner = qrScanner;
	  maybeShowSwitchCamera();
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
	  window.scanner = undefined;
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
		  <video id='video' style={{ width: '400px', height: '225px' }}></video>
		  <div id='switchCamera' style={{ display: 'none' }}>
			<Button variant='text' onClick={() => switchCameraClick(false) }>
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
