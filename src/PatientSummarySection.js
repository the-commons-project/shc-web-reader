import { useState } from 'react';
import * as ftabs from './lib/fhirTables.js';
import { Button } from '@mui/material';
import IFrameSandbox from './IFrameSandbox.js';
import DOMPurify from 'dompurify';
import RemoveRedEyeOutlinedIcon from '@mui/icons-material/RemoveRedEyeOutlined';

import styles from './PatientSummary.module.css';

export default function PatientSummarySection({ s, rmap, dcr }) {

  const NONLY = "narrative_only";
  const SONLY = "structured_only";
  const NTOGGLE = "narrative_toggle";
  const STOGGLE = "structured_toggle";
  
  const [ viewState, setViewState ] = useState(undefined);

  // +---------------------+
  // | setInitialViewState |
  // +---------------------+

  const setInitialViewState = () => {
	
	const narrativeType = (s.text && s.text.div && s.text.status ?
						   s.text.status : "empty");

	const haveNarrative = (narrativeType !== "empty");
	const haveStructured = (s.entry && s.entry.length > 0);

	let initialViewState;
	
	if (haveNarrative && !haveStructured) {
	  // only narrative, ok
	  initialViewState = NONLY;
	}
	else if (!haveNarrative && haveStructured) {
	  // only structured, ok
	  initialViewState = SONLY;
	}
	else if (narrativeType === "additional" || narrativeType === "extensions") {
	  // narrative may be more complete than structured data
	  initialViewState = NTOGGLE;
	}
	else {
	  // otherwise prefer structured
	  initialViewState = STOGGLE;
	}

	setViewState(initialViewState);
	return(<></>);
  }

  // +--------------+
  // | renderToggle |
  // +--------------+

  const renderToggle = () => {
    let buttonText = (viewState === NTOGGLE) ? "Show Structured" : "Show Narrative";

    return(
        <div className={styles.toggleButton}>
            <Button
                data-html2canvas-ignore="true"
                size="small"
                onClick={ () => setViewState(viewState === NTOGGLE ? STOGGLE : NTOGGLE) }
                startIcon={ <RemoveRedEyeOutlinedIcon /> }>
                {buttonText}
            </Button>
        </div>
    );
}

  // +-----------------+
  // | renderNarrative |
  // +-----------------+

  const renderNarrative = () => {
	if (DOMPurify.isSupported) {
	  const safeHtml = DOMPurify.sanitize(s.text.div);
	  return(<div className={styles.narrative}
				  dangerouslySetInnerHTML={{ __html: safeHtml }}></div>);
	}

	// fallback to putting it into an iframe ... this is suboptimal
	// because html2canvas will lose the content when rendering, but
	// it is much safer so seems well worth the tradeoff.
	return(<IFrameSandbox html={s.text.div} />);
  }

  // +------------------+
  // | renderStructured |
  // +------------------+

  const renderStructured = () => {
	const tableState = {};
	for (const i in s.entry) ftabs.addResource(rmap[s.entry[i].reference], tableState, rmap);
	return(ftabs.renderJSX(tableState, styles.fhirTable, rmap, dcr));
  }

  // +-------------+
  // | Main Render |
  // +-------------+
  
  if (viewState === undefined) return(setInitialViewState());

  const toggle = (viewState === NTOGGLE || viewState === STOGGLE ? renderToggle() : undefined);
  const narrative = (viewState === NONLY || viewState === NTOGGLE ? renderNarrative() : undefined);
  const structured = (viewState === SONLY || viewState === STOGGLE ? renderStructured() : undefined);

  const fallback = (narrative || structured ? undefined : <div>no data</div>);
	
  return(
	<>
	  { structured }
	  { narrative }
	  { fallback }
	  { toggle }
	</>
  );
}

