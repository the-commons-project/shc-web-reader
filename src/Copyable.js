
import { useState } from 'react';
import { IconButton, Snackbar } from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

export default function Copyable({ txt, jsx }) {

  const [copied, setCopied] = useState(false);

  const copyText = async (txt) => {

	const queryOpts = { name: "clipboard-write", allowWithoutGesture: "false" };
	const perms = await navigator.permissions.query(queryOpts);

	if (perms.state === "denied") {
	  const url = "copyText.html?" + encodeURIComponent(txt);
	  window.open(url, 'copyText',
				  'width=300,height=50,popup,noopener,noreferrer,left=100,top=100');
	}
	else {
	  navigator.clipboard.writeText(txt)
		.then(() => { setCopied(true); },
			  (err) => { alert(err); });
	}
  }
  
  return(
    <>
	  <IconButton size="small" onClick={() => copyText(txt)}>
	  <ContentCopyIcon sx={{ fontSize: 14 }} />
	  </IconButton>
	  <Snackbar
	    open={copied}
	    onClose={() => setCopied(false)}
	    autoHideDuration={1000}
	    message={`Copied "${txt}" to clipboard`} />
	  {jsx ? jsx : txt}
	</>
  );
}


