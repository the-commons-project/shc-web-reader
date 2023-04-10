import React, { useState, useEffect } from 'react';
import { Button } from '@mui/material';
import { verifySHX } from './lib/SHX.js';
import MultiResource from './MultiResource.js';
import DemoCoverage from './DemoCoverage.js';
import config from './lib/config.js';

export default function Data({ shx }) {

  const [cardData, setCardData] = useState(undefined);
  const [showBundle, setShowBundle] = useState(false);

  useEffect(() => {
	verifySHX(shx).then(result => setCardData(result));
  }, [shx]);

  if (!cardData) return(<></>);

  // build up a dictionary so we can resolve references
  
  let resources = {};
  if (cardData.fhirBundle && cardData.fhirBundle.entry) {
	for (const i in cardData.fhirBundle.entry) {
	  let entry = cardData.fhirBundle.entry[i];
	  resources[entry.fullUrl] = entry.resource;
	}
  }

  const renderer = (config("mayDemo")
					? <DemoCoverage cardData={cardData} resources={resources} />
					: <MultiResource cardData={cardData} resources={resources} />);

  return(
	<>
	  {renderer}
	  <div>
	    <Button onClick={ () => setShowBundle(!showBundle) }>source</Button>
	    { showBundle && <pre><code>{JSON.stringify(cardData.fhirBundle, null, 2)}</code></pre>}
	  </div>
	</>
  );
}
