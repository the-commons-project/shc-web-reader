import { useState, useEffect } from 'react';
import { useOptionalFhir } from './OptionalFhir';
import * as futil from "./lib/fhirUtil.js";

import styles from './WrongPatientWarning.module.css';

export default function WrongPatientWarning({ organized }) {

  const [patient, setPatient] = useState(undefined);
  const fhir = useOptionalFhir();

  useEffect(() => {
	
	try {
	  if (fhir) fhir.patient.read().then((p) => setPatient(p));
	}
	catch (err) {
	  console.err(err.toString());
	}
	
  }, [organized,fhir]);

  const getPatientDeets = () => {

	let deets = "";
	
	if (patient.name && patient.name.length > 0) {
	  deets = "family name " + patient.name[0].family;
	}

	if (patient.birthDate) {
	  const dobStr = "DOB " + futil.renderDate(patient.birthDate);
	  deets = futil.delimiterAppend(deets, dobStr, ", ");
	}

	return(deets);
  }
  
  // +-------------+
  // | Main Render |
  // +-------------+
  
  if (!patient || !organized || !organized.typeInfo) return(undefined);
  
  const subjects = organized.typeInfo.subjects;
  let foundMatch = false;
		
  for (const i in subjects) {
	if (futil.seemsLikeSamePatient(patient, subjects[i])) {
	  foundMatch = true;
	  break;
	}
  }

  if (foundMatch) return(undefined);

  return(
	<div className={styles.warning}>
	  Warning: It appears that the subject referenced in the information
	  below may differ from the patient selected in the 
	  EHR (<span className={styles.deets}>{getPatientDeets()}</span>).
	  Please ensure a match before proceeding.
	</div>
  );
}

