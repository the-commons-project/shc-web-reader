
import * as futil from  './lib/fhirUtil.js';
import * as fcov from  './lib/fhirCoverage.js';
import styles from './DemoCoverage.module.css';

export default function DemoCoverage({ cardData, resources }) {

  // +--------------------+
  // | Main Render & Grid |
  // +--------------------+

  let cov = undefined;
  for (const i in resources) {
	if (resources[i].resourceType === "Coverage") {
	  cov = resources[i];
	  break;
	}
  }

  if (cardData.valid && !cov) return(<div>Unexpected</div>);

  // +--------------+
  // | renderBanner |
  // +--------------+
  
  const renderBanner = () => {

	let covText = undefined;
	let covDate = undefined;
	
	if (active && fcov.startDate(cov)) {
	  covText = "Coverage Effective Date ";
	  covDate = futil.renderDate(fcov.startDate(cov));
	}
	else if (!active && fcov.endDate(cov)) {
	  covText = "Coverage Terminated Date ";
	  covDate = futil.renderDate(fcov.endDate(cov));
	}
	
	return(
	  <div className={styles.banner}>

		{ covText && <div className={styles.covEffective}>
					   {covText}
					   <span className={styles.covDate}>{covDate}</span>
					 </div> }

		<img src="header-icon.png" alt="logo" />
		<span className={styles.headerStatic}>Medical & Pharmacy ID Card</span>
	  </div>);
  }

  // +--------------------+
  // | renderDemographics |
  // +--------------------+

  const renderDemographics = () => {

	let memberID = undefined;
	let person = undefined;
	
	if (cov.relationship && cov.relationship.coding[0].code === "self") {
	  memberID = cov.subscriberId;
	  person = futil.resolveReference(cov.subscriber, resources);
	}
	else {
	  memberID = cov.identifier[0].value;
	  person = futil.resolveReference(cov.beneficiary, resources);
	}

	const name = person.name[0].family + " / " + futil.spaceAppendArray("", person.name[0].given);
	const dob = (person.birthDate ? futil.renderDate(person.birthDate) : undefined);

	const group = fcov.groupNumber(cov);
	
	return(
	  <div className={styles.demos}>
		
		<div className={styles.tinyHeader}>Name</div>
		<div className={styles.biggerText}>{name.toUpperCase()}</div>

		{ dob && <>
				   <div className={styles.tinyHeader}>Date of Birth</div>
				   <div className={styles.biggerText}>{dob}</div> 
				 </> }

		<div className={styles.tinyHeader}>ID</div>
		<div className={styles.biggerText}>{memberID}</div>
		
		{ group && <>
				   <div className={styles.tinyHeader}>Group</div>
				   <div className={styles.biggerText}>{group}</div> 
				   </> }

		<div className={styles.tinyHeader}>
		  Always verify identity with a government-issued I.D.
		</div>

		<div className={styles.greyBar}></div>

		<div className={styles.blueHeader}>Contact Information</div>
	  </div>
	);
  }
  
  // +----------------+
  // | renderBenefits |
  // +----------------+

  const renderBenefits = () => {
	return(
	  <div className={styles.benefits}>
		<div className={styles.blueHeader}>Benefits</div>
		nyi
	  </div>
	);
  }
  
  // +-------------+
  // | renderOther |
  // +-------------+

  const renderOther = () => {
	return(
	  <div className={styles.other}>
		<div className={styles.blueHeader}>Rx</div>
		nyi
	  </div>
	);
  }

  // +------------+
  // | renderGrid |
  // +------------+

  const renderGrid = () => {
	return(
	  <div className={styles.gridContainer}>
		{renderBanner()}
		{renderDemographics()}
		{renderBenefits()}
	    {renderOther()}
		<div className={styles.doubleGrey}></div>
	  </div>
	);
  }

  // +-------------+
  // | Main Render |
  // +-------------+

  const active = (cardData.valid ? fcov.isActive(cov) : false);
  const verifiedClass = (active ? styles.valid : styles.invalid);
  const verifiedText = (active ? "Verified" : (cardData.valid ? "Coverage Inactive" : "Not Verifiable"));
  const mark = String.fromCharCode(active ? 10003 : 10006);

  return(
    <>
	  <div className={styles.outermost}>
		<div className={[styles.topBar,verifiedClass].join(' ')}>
		  <span className={styles.mark}>{mark}</span>{verifiedText}
		</div>
		{cov && renderGrid()}
	  </div>
	</>
  );
}

