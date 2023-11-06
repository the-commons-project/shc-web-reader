

const fs = require('fs');
const parse = require('csv-parser');

// +-----------+
// | Snomed CT |
// +-----------+

function snomedRow(row) {
  if (row.Active !== '1') return(SKIP);
  return([ row.ConceptID, row.USPreferredTerm ]);
}

const SNOMED_OPTS = { separator: '\t' };

const SNOMED_LICENSE =
	  'This file includes content from the SNOMED SCT Global Patient Set ' +
	  'used under CC4 Attribution; see https://www.snomed.org/gps';

// +-------+
// | LOINC |
// +-------+

function loincRow(row) {
  if (row.STATUS !== 'ACTIVE') return(SKIP);
  return([ row.LOINC_NUM, row.LONG_COMMON_NAME ]);
}

const LOINC_OPTS = { };

const LOINC_LICENSE = 
	  'This file includes content from LOINC(c) ' +
	  'which is copyright (c) 1995 Regenstrief Institute, Inc. ' +
	  'and the LOINC Committee, and available at no cost under ' +
	  'the license at http://loinc.org/terms-of-use';

// +------------+
// | Entrypoint |
// +------------+

const action = process.argv[2];
const inputFile = process.argv[3];
const outputFile = process.argv[4];

const SKIP = [ undefined, undefined ];

let rowFn = undefined;
let opts = undefined;
let codes = {};

switch (action) {
  case 'snomed':
	rowFn = snomedRow;
	opts = SNOMED_OPTS;
	codes['__license'] = SNOMED_LICENSE;
	break;

  case 'loinc':
	rowFn = loincRow;
	opts = LOINC_OPTS;
	codes['__license'] = LOINC_LICENSE;
	break;

  default:
	console.error('usage: node . [snomed/loinc] inputfile outputfile');
	return;
}

fs.createReadStream(inputFile).pipe(parse(opts))

  .on('data', (row) => {
	const [ code, display ] = rowFn(row);
	if (code !== undefined) codes[code] = display;
  })

  .on('end', () => {
	fs.writeFileSync(outputFile, JSON.stringify(codes, null, 2));
  });


