import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import OptionalFhir from './OptionalFhir';

import '@fontsource/open-sans';
import '@fontsource/open-sans/700.css';
import '@fontsource/open-sans/800.css';
import './index.css';

ReactDOM.render(
  <React.StrictMode>
	<OptionalFhir>
      <App />
	</OptionalFhir>
  </React.StrictMode>,
  document.getElementById('root')
);
