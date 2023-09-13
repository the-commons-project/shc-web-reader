
// +--------------------------+
// | sc.maybeShowSwitchCamera |
// +--------------------------+

async function maybeShowSwitchCamera(qrScanner, divId) {

  const camIds = await listCameraIds();
  if (camIds.length === 1) return;

  window.sc._scanner = qrScanner;
  document.getElementById(divId).style.display = 'block';
}

// +--------------------+
// | getSelectedCamera  |
// | saveSelectedCamera |
// +--------------------+

function getSelectedCamera(defaultIdMode) {
  const cached = localStorage.getItem('cameraIdMode');
  return(cached || defaultIdMode);
}

function saveSelectedCamera(cameraIdMode) {
  try { localStorage.setItem('cameraIdMode', cameraIdMode); }
  catch (err) { console.error(err.toString()); }
}

// +---------------------------+
// | switchCameraClick         |
// | switchCameraClickInternal |
// +---------------------------+

// deal with double-clickness and defer actual work to switchCameraAction

let switchTimer = undefined;
const dblClickMillis = 250;

async function switchCameraClick() {
  switchCameraClickInternal(false);
}

async function switchCameraClickInternal(isTimer) {

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
	switchTimer = setTimeout(() => {
	  switchCameraClickInternal(true);
	}, dblClickMillis);
  }
}

// +-------------------+
// | switchCamerAction |
// +-------------------+

async function switchCameraAction(isDouble) {
  
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
  window.sc._scanner.setCamera(newCam);
}

// +---------+
// | Helpers |
// +---------+

async function listCameraIds() {

  const devs = await navigator.mediaDevices.enumerateDevices();
  return(devs.filter((d) => (d.kind === 'videoinput')).map((c,i) => c.deviceId));
}

function findCurrentCam(getId) {

  const vid = document.getElementById('video');
  const track = vid.srcObject.getTracks().find(t => t.kind === 'video');
  const settings = track.getSettings();
  return(getId ? settings.deviceId : settings.facingMode);
}

async function findNextCameraId(currentId) {

  const camIds = await listCameraIds();

  let i = 0;
  while (i < camIds.length) {
	if (camIds[i] === currentId) break;
	++i;
  }

  return(camIds[(i >= (camIds.length - 1)) ? 0 : i + 1]);
}

function isFacingMode(s) {
  return(s === 'user' || s === 'environment');
}

// +-----------+
// | "Exports" |
// +-----------+

window.sc = {
  'maybeShowSwitchCamera': maybeShowSwitchCamera,
  'getSelectedCamera': getSelectedCamera,
  'switchCameraClick': switchCameraClick
};

