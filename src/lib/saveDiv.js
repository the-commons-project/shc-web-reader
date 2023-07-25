
import html2canvas from 'html2canvas';

// +-------------+
// | divToCanvas |
// +-------------+

export async function divToCanvas(div) {
  return(await html2canvas(div));
}

// +---------------+
// | saveDivToFile |
// +---------------+

export async function saveDivToFile(div, baseName) {

  const canvas = await divToCanvas(div);
  const link = document.createElement("a");
  link.href = canvas.toDataURL("image/jpeg", 1.0);

  link.download = todayForFilename() + ' ' + baseName + '.' +
	(link.href.startsWith("data:image.png") ? "png" : "jpg");
  
  link.click();
}

function todayForFilename() {

  const now = new Date();
  
  let month = '' + (now.getMonth() + 1);
  if (month.length < 2) month = '0' + month;

  let day = '' + now.getDate();
  if (day.length < 2) day = '0' + day;

  return([now.getFullYear(), month, day].join('-'));
}
