
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

export async function saveDivToFile(div) {

  const canvas = await divToCanvas(div);
  const link = document.createElement("a");
  link.download = "download";
  link.href = canvas.toDataURL();
  link.click();
}
