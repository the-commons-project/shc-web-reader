import React, { useState, useEffect } from 'react';
import { Button } from '@mui/material';
import { useOptionalFhir } from './OptionalFhir';
import listDocs from './lib/listDocs.js';
import getDocSHX from './lib/getDocSHX.js';

export default function Search({ viewData }) {

  const [docs, setDocs] = useState(undefined);
  const [idocCurrent, setIDocCurrent] = useState(undefined);
  const [err, setErr] = useState(undefined);
  const fhir = useOptionalFhir();

  const refreshClick = () => {
	setDocs(undefined);
	setIDocCurrent(undefined);
	setErr(undefined);
  }

  useEffect(() => {

	// oops had an error
	if (err !== undefined) return;

	// search
	if (docs === undefined) {
	  const getDocs = async () => {
		listDocs(fhir)
		  .then((result) => {
			setDocs(result);
			if (result.length > 0) setIDocCurrent(0);
		  })
		  .catch((err) => {
			setErr(err);
		  });
	  };

	  getDocs();
	}			

	// process
	if (idocCurrent !== undefined && idocCurrent < docs.length) {
	  const processDoc = async () => {

		getDocSHX(fhir, docs[idocCurrent])
		  .then((shx) => {
			if (shx === undefined) {
			  // no love but no error
			  setIDocCurrent(idocCurrent + 1);
			}
			else {
			  setIDocCurrent(docs.length);
			  viewData(shx);
			}
		  })
		  .catch((err) => {
			// bummah
			  setIDocCurrent(idocCurrent + 1);
			setErr(err);
		  });
	  };

	  processDoc();
	}
	
  }, [fhir, idocCurrent, err, docs, viewData]);

  let progress = <></>;
  let refresh = <></>;

  if (err !== undefined) {
	progress = <p className='error'>{err.toString()}</p>;
	refresh = <Button variant='contained' onClick={refreshClick}>Search Again</Button>;
  }
  else if (docs === undefined) {
	progress = <p className='working'>Searching documents...</p>;
  }
  else if (docs.length === 0 || idocCurrent === docs.length) {
	progress = <p className='final'>No scannable documents found for patient.</p>;
	refresh = <Button variant='contained' onClick={refreshClick}>Search Again</Button>;
  }
  else if (idocCurrent !== undefined) {
	progress = <p className='working'>Scanning {docs[idocCurrent].title}...</p>
  }
  
  return (
	<div>
	  <h1>Search</h1>
	  {progress}
	  {refresh}
	</div>
  );
}
