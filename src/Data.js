import React, { useState, useEffect } from 'react';
import { verifySHX } from './lib/SHX.js';
import ValidationInfo from './ValidationInfo.js';
import Coverage from './Coverage.js';

export default function Data({ shx }) {

  const [cardData, setCardData] = useState(undefined);

  useEffect(() => {
	verifySHX(shx).then(result => setCardData(result));
  }, [shx]);

  const renderCard = (cardData) => {

	// first build up a dictionary so we can resolve references
	let resources = {};
	for (const i in cardData.fhirBundle.entry) {
	  let entry = cardData.fhirBundle.entry[i];
	  resources[entry.fullUrl] = entry.resource;
	}

	// now iterate the resources, rendering the ones we know about
	const elts = Object.keys(resources).reduce((result, key) => {
	  
	  const resource = resources[key];

	  switch (resource.resourceType) {
	    case "Coverage":
	      result.push(<Coverage key={key} cardData={cardData} cov={resource} resources={resources} />);
	      break;
		
	    default:
	      break;
	  }

	  return(result);
	  
	}, []);

	const fallback = (elts.length !== 0 ? '' :
	  <pre><code>{JSON.stringify(cardData.fhirBundle, null, 2)}</code></pre>);

	return(<>{elts}{fallback}</>);
  }

  if (!cardData) return(<></>);
  
  return(
	<div>
	  <ValidationInfo cardData={cardData} />
	  {cardData.valid && renderCard(cardData)}
	</div>
	);

}
