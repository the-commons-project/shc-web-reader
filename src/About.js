import React from 'react';

export default function About() {

  const lnk = (text, url) => {
	return(<a href={url} target="_blank" rel="noreferrer">{text}</a>);
  }

  const srcLink =
		lnk("open source", 
			"https://github.com/the-commons-project/shc-web-reader");
		
  const shcLink =
		lnk("SMART Health Card / Link Specification", 
			"https://smarthealth.cards/");

  const carinLink =
		lnk("HL7 CARIN Digital Insurance Card specification",
			"https://build.fhir.org/ig/HL7/carin-digital-insurance-card/");

  return (
	<>
	  <img src="shc.png" alt="shc" align="left"
		   style={{ width: "200px", marginRight: "20px", marginTop: "16px"  }} />

	  <div><h1>About</h1></div>

	  
	  <p>
		This SMART Health Insurance Card Reader App is a 
		free, {srcLink} tool for health organizations to use to scan,
		verify and display health insurance information shared via
		SMART Health Insurance Card QR codes.
	  </p>
	  <p>
		SMART Health Insurance Card QR codes contain links back to an
		individual's coverage data maintained by the insurer. The data
		is cryptographically signed by the insurer following the
		{shcLink}. The data elements available through the
		link are based on the {carinLink}.
	  </p>
	  <p>
		The Reader App can be used in any browser and can also be embedded as
		a SMART Launch App in most EHRs.
	  </p>

	</>
  );
}

