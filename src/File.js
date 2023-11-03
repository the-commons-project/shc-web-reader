
export default function File({ viewData }) {

  const handleFileChange = async (evt) => {
	const reader = new FileReader();
	reader.onload = (evtRead) => { viewData(evtRead.target.result); }
	reader.readAsText(evt.target.files[0]);
  }

  return (
	<div>
	  <h1>Open File</h1>

	  <input id="file"
			 type="file"
			 accept=".json,.fhir,.smart-health-card"
			 onChange={handleFileChange} />
	  
	  <p>
		The viewer can typically read files with a <b>.smart-health-card</b> or <b>.fhir</b> extension.
	  </p>
	  
	</div>
  );
}
