import React, { useState, useEffect } from 'react';
import verifySHC from './lib/verifySHC.js';

export default function Data({ shc }) {

  const [fhirBundle, setFhirBundle] = useState(undefined);
  const [validationErrors, setValidationErrors]= useState(undefined);

  useEffect(() => {

	verifySHC(shc)
	  .then(fhirBundle => {
		setFhirBundle(fhirBundle);
		setValidationErrors(undefined);
	  })
	  .catch(errs => {
		setFhirBundle(undefined);
		setValidationErrors(errs.join('; '));
	  });
  }, [shc]);
  
  return (
	<div>
	  <h1>Card Details</h1>
	  { fhirBundle &&
		<pre><code>{JSON.stringify(fhirBundle, null, 2)}</code></pre> }
	  
	  { validationErrors &&
		<>
		  <div>Unable to read Smart Health Card.</div>
		  <div>{validationErrors}</div> 
		</> }
	  
	</div>
  );
}
