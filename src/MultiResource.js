
import ValidationInfo from './ValidationInfo.js';
import Coverage from './Coverage.js';

export default function MultiResource({ cardData, resources }) {

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
	
  }, [])

  const fallback = (elts.length !== 0 ? '' :
	<pre><code>{JSON.stringify(cardData.fhirBundle, null, 2)}</code></pre>);

  return(
	<div>
	  <ValidationInfo cardData={cardData} /> 
	  { elts } { fallback }
	</div>
	);

}
