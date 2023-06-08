import React, { useState } from 'react';
import { Button } from '@mui/material';
import ValidationInfo from './ValidationInfo.js';
import Coverage from './Coverage.js';

export default function Bundle({ bundle }) {

  const [showBundle, setShowBundle] = useState(false);

  // build up a dictionary so we can resolve references

  let resources = {};
  if (bundle.contentOK() && bundle.fhir.entry) {
	for (const i in bundle.fhir.entry) {
	  let entry = bundle.fhir.entry[i];
	  resources[entry.fullUrl] = entry.resource;
	}
  }

  // generate rendering elements
  
  const elts = Object.keys(resources).reduce((result, key) => {
	  
    const resource = resources[key];

	switch (resource.resourceType) {
	  case "Coverage":
	    result.push(<Coverage key={key} cov={resource} resources={resources} />);
	    break;
		
	  default:
	    break;
	}

	return(result);
	
  }, []);

  // if we didn't find any rendering elements, just show the FHIR
  
  const fallback = (bundle.contentOK() && elts.length === 0
					? <pre><code>{JSON.stringify(bundle.fhir, null, 2)}</code></pre>
					: undefined);

  // and... go!
  
  return(
	<>
	  <ValidationInfo bundle={bundle} />
	  { elts } { fallback }
	  <div>
	    <Button onClick={ () => setShowBundle(!showBundle) }>source</Button>
	    { showBundle && <pre><code>{JSON.stringify(bundle, null, 2)}</code></pre>}
	  </div>
	</>
  );

}
