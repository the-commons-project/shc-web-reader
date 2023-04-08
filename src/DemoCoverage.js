
import styles from './DemoCoverage.module.css';

export default function DemoCoverage({ cardData, cov, resources }) {

  const renderBody = () => {
	return(<></>);
  }
  
  return(
    <>
	  <div className={styles.section}>
		{ cardData.valid && <div className={styles.valid}>Verified</div> }
		{ !cardData.valid && <div className={styles.invalid}>Not Verifiable</div> }
	  </div>
	  {cardData.valid && <div className={styles.section}>{renderBody()}</div> }
	</>
  );
}

