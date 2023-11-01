import React from 'react';

function DisplayDemoLogo() {
  /* hardcoded the logourl here for demo purposes */
  const logoUrl = "https://images.squarespace-cdn.com/content/v1/5f9c27bd4ee0a44f8d718110/1604069613309-IEK0SQB4KXDVEKDDQLBD/CommonHealth_Logo.png?format=1500w";

  const logoStyle = {
    display: 'block',
    margin: 'auto',
    width: '60%',  // Adjust as needed for the right size
    padding: '10px 0' // Vertical padding
  };

  return (
    <div style={{ textAlign: 'center', padding: '' }}>
      <img src={logoUrl} alt="Issuer Logo" style={logoStyle} />
    </div>
  );
}

export default DisplayDemoLogo;



