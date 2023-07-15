import React, { useState } from 'react';
import { Button } from '@mui/material';
import ValidationInfo from './ValidationInfo.js';
import Coverage from './Coverage.js';

export default function Bundle({ bundle }) {

  const [showBundle, setShowBundle] = useState(false);

  // generate rendering elements
  
  const elts = Object.keys(bundle.organized.byId).reduce((result, key) => {
	  
    const resource = bundle.organized.byId[key];

	switch (resource.resourceType) {
	  case "Coverage":
	    result.push(<Coverage key={key}
		  					  cov={resource}
							  resources={bundle.organized.byId} />);
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
