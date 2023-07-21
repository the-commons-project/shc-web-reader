import { useState, useRef } from 'react';

export default function IFrameSandbox({ html }) {

  // It seems like there must be a better way to do this. All to make sure
  // that we can render external bits of HTML in a maybe-sort-of-secure way
  // that also kind of lays out OK in the context of our pages. Nuts.

  const [ height, setHeight ] = useState("10px");
  const frameRef = useRef(null);

  const fontUrl = "https://fonts.googleapis.com/css2?family=Open+Sans&display=swap";
  
  const src =
		"<html><head>" +
		"<link rel='preconnect' href='https://fonts.googleapis.com'>" +
		"<link rel='preconnect' href='https://fonts.gstatic.com' crossorigin>" +
		"<link href='" + fontUrl + "' rel='stylesheet'>" +
		"</head><body style='font-family: Open Sans; font-size: smaller;'>" +
		html +
		"</body></html>";
		
  return(
	<iframe
	  title="sandboxed content"
	  sandbox="allow-same-origin"
	  frameBorder="0"
	  scrolling="no"
	  width="100%"
	  height={ height }
	  srcDoc={ src }
	  ref={ frameRef }
	  onLoad={ () => {
		const e = frameRef.current.contentWindow.document.body.parentElement;
		const h = e.scrollHeight;
		setHeight(h + "px");
	  }}>
	</iframe>
  );
}

