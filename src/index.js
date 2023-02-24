import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import OptionalFhir from './OptionalFhir';

import '@fontsource/roboto';
import './index.css';

ReactDOM.render(
  <React.StrictMode>
	<OptionalFhir>
      <App />
	</OptionalFhir>
  </React.StrictMode>,
  document.getElementById('root')
);
