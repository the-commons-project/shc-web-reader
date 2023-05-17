
import { useState } from 'react';
import { IconButton } from '@mui/material';
import RemoveRedEyeOutlinedIcon from '@mui/icons-material/RemoveRedEyeOutlined';
import * as futil from  './lib/fhirUtil.js';
import * as fcov from  './lib/fhirCoverage.js';
import styles from './DemoCoverage.module.css';

export default function DemoCoverage({ cardData, resources }) {

  const [showDOB, setShowDOB] = useState(false);

  let cov = undefined;
  for (const i in resources) {
	if (resources[i].resourceType === "Coverage") {
	  cov = resources[i];
	  break;
	}
  }

  if (cardData.certValid() && !cov) return(<div>Unexpected</div>);

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

  const renderContacts = (payor) => {

	if (!payor.contact) return(<></>);

	const rows = [];
	
	for (const i in payor.contact) {
	  
	  const c = payor.contact[i];
	  
	  if (c.purpose && c.purpose.coding) {
		
		for (const j in c.purpose.coding) {
		  
		  // using a looser version of code matching here to account
		  // for cigna usage in demo ... probably actually fine forever.
		  
		  if (c.purpose.coding[j].code === "PATINF" ||
			  c.purpose.coding[j].code === "provider" ||
			  c.purpose.coding[j].code === "PAYOR") {

			const purpose = (c.purpose ? futil.renderCodable(c.purpose) : "Contact");
			const txt = futil.renderContact(c, false);

			rows.push(<tr key={`${i}_${j}`}><th>{purpose}</th><td>{txt}</td></tr>);
		  }
		}
	  }
	}
	
	return(rows);
  }

  const renderContactInfo = () => {

	const payor = futil.resolveReference(cov.payor[0], resources);
	if (!payor) return(<></>);

	return (
	  <>
		<div className={styles.blueHeader}>Contact Information</div>
		<table className={styles.columnTable}>
		  <tbody>
			{ renderContacts(payor) } 
		  </tbody>
		</table>
	  </>
	);
  }

  const renderDemographics = () => {

	let memberID = undefined;
	let personRef = undefined;
	
	if (cov.relationship && cov.relationship.coding[0].code === "self") {
	  memberID = cov.subscriberId;
	  personRef = cov.subscriber;
	}
	else {
	  memberID = cov.identifier[0].value;
	  personRef = cov.beneficiary;
	}

	const person = futil.resolveReference(personRef, resources);
	let name = undefined;
	let dob = undefined;
	
	try {
	  name = person.name[0].family + " / " + futil.spaceAppendArray("", person.name[0].given);
	  dob = (person.birthDate ? futil.renderDate(person.birthDate) : undefined);
	}
	catch (err) {
	  name = (personRef.display ? personRef.display : "NA / NA");
	  dob = undefined;
	}

	const dobButton = 
	  <IconButton size="small" sx={{ marginLeft: "15px" }}
				  onClick={() => setShowDOB(!showDOB) }>
		<RemoveRedEyeOutlinedIcon />
	  </IconButton>;

	const group = fcov.coverageClassValue(cov, "group");
	
	return(
	  <div className={styles.demos}>
		
		<div className={styles.tinyHeader}>Name</div>
		<div className={styles.biggerText}>{name.toUpperCase()}</div>

		{ dob && <>
				   <div className={styles.tinyHeader}>Date of Birth</div>
				   <div className={styles.biggerText}>
					 {showDOB ? dob : "**/**/****"}{dobButton}
				   </div>
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
		{ renderContactInfo() }

	  </div>
	);
  }
  
  // +----------------+
  // | renderBenefits |
  // +----------------+

  const renderBenefits = () => {

	const plan = fcov.coverageClassName(cov, "plan");

	const gpvisit = fcov.costToBeneficiaryValue(cov, "gpvisit");
	const spvisit = fcov.costToBeneficiaryValue(cov, "spvisit");
	const emergency = fcov.costToBeneficiaryValue(cov, "emergency");
	const urgent = fcov.costToBeneficiaryValue(cov, "urgentcare");
	const rx = fcov.costToBeneficiaryValue(cov, "rx");

	const coinsIn = fcov.costToBeneficiaryValue(cov, "coinsIn");
	const coinsOut = fcov.costToBeneficiaryValue(cov, "coinsOut");
	
	let dedIn = fcov.costToBeneficiaryValue(cov, "IndInDed");
	if (!dedIn) dedIn = fcov.costToBeneficiaryValue(cov, "FamInDed");

	let dedOut = fcov.costToBeneficiaryValue(cov, "IndOutDed");
	if (!dedOut) dedOut = fcov.costToBeneficiaryValue(cov, "FamOutDed");

	let maxIn = fcov.costToBeneficiaryValue(cov, "IndInMax");
	if (!maxIn) maxIn = fcov.costToBeneficiaryValue(cov, "FamInMax");
	
	let maxOut = fcov.costToBeneficiaryValue(cov, "IndOutMax");
	if (!maxOut) maxOut = fcov.costToBeneficiaryValue(cov, "FamOutMax");
	
	const dedGen = (dedIn || dedOut ? undefined : fcov.costToBeneficiaryValue(cov, "deductible"));
	const maxGen = (maxIn || maxOut ? undefined : fcov.costToBeneficiaryValue(cov, "maxoutofpocket"));

	return(
	  <div className={styles.benefits}>
		<div className={styles.blueHeader}>Benefits</div>
		<table className={styles.columnTable}>
		  <tbody>

			{ plan &&
			  <>
				<tr><th>Plan Name</th><td></td></tr>
				<tr><td colSpan="2" className={styles.fw}>{plan}</td></tr>
			  </> }
			
			{ gpvisit && <tr><th>PCP Visit</th><td>{gpvisit}</td></tr> }
			{ spvisit && <tr><th>Specialist</th><td>{spvisit}</td></tr> }
			{ emergency && <tr><th>Hospital ER</th><td>{emergency}</td></tr> }
			{ urgent && <tr><th>Urgent Care</th><td>{urgent}</td></tr> }
			{ rx && <tr><th>Rx</th><td>{rx}</td></tr> }

			{ (coinsIn || coinsOut) &&
			  <>
				<tr><th>Network Coinsurance:</th><td></td></tr>
				{ coinsIn && <tr><th>In-Network</th><td>{coinsIn}</td></tr> }
				{ coinsOut && <tr><th>Out-of-Network</th><td>{coinsOut}</td></tr> }
			  </> }
			
			{ dedIn && <tr><th>In-Network Deductible</th><td>{dedIn}</td></tr> }
			{ dedOut && <tr><th>Out-of-Network Deductible</th><td>{dedOut}</td></tr> }
			{ dedGen && <tr><th>Deductible</th><td>{dedGen}</td></tr> }
			{ maxIn && <tr><th>In-Network Out-of-Pocket</th><td>{maxIn}</td></tr> }
			{ maxOut && <tr><th>Out-of-Network Out-of-Pocket</th><td>{maxOut}</td></tr> }
			{ maxGen && <tr><th>Max Out-of-Pocket</th><td>{maxGen}</td></tr> }
			
		  </tbody>
		</table>
	  </div>
	);
  }
  
  // +-------------+
  // | renderOther |
  // +-------------+

  const renderOther = () => {

	const rxbin = fcov.coverageClassValue(cov, "rxbin");
	const rxpcn = fcov.coverageClassValue(cov, "rxpcn");
	const rxgrp = fcov.coverageClassValue(cov, "rxgroup");

	let rx = <></>;
	if (rxbin || rxpcn || rxgrp) {
	  rx = <>
			 <div className={styles.blueHeader}>Rx</div>
			 <table className={styles.columnTable}><tbody>
			   {rxbin && <tr><th>RxBIN</th><td>{rxbin}</td></tr>}
			   {rxpcn && <tr><th>RxPCN</th><td>{rxpcn}</td></tr>}
			   {rxgrp && <tr><th>RxGroup</th><td>{rxgrp}</td></tr>}
			 </tbody></table>
		   </>;
	}

	const payorImg = fcov.renderLogoImage(cov, styles.payorLogo);
	const payorName = fcov.renderPayorDisplayName(cov, resources);

	const payor =  <>
					 <div className={styles.blueHeader}>Payor</div>
					 {payorImg}
					 <div className={styles.org}>{payorName}</div>
					 <br clear="all" />
				   </>;

	let issuer = <></>;

	if (cardData.issuerName) {
	  issuer = <>
				 <div className={styles.blueHeader}>Issuer</div>
				 <img src="https://smarthealthit.org/wp-content/themes/SMART/images/logo.svg"
					  alt="SMART logo" className={styles.smartLogo} />
				 <div className={styles.org}>{cardData.issuerName}</div>
				 <img src="https://images.squarespace-cdn.com/content/v1/6055264fa5940469575508a4/1617891600462-LY5SKLL1XUNP7PCDPRFO/CTN_Logo_Horizontal.png"
					  alt="CommonTrust Network logo" className={styles.ctnLogo} />
			   </>;
	}
	
	
	return(
	  <div className={styles.other}>
		{rx}
		{payor}
		{issuer}
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

  const active = (cardData.certValid() ? fcov.isActive(cov) : false);
  const verifiedClass = (active ? styles.valid : styles.invalid);
  const verifiedText = (active ? "Verified" : (cardData.certValid() ? "Coverage Inactive" : "Not Verifiable"));
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

