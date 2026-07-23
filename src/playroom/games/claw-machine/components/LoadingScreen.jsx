import React from 'react';

const LoadingScreen = ({ error }) => (
  <div className="claw-loading-screen" role="status">
    <strong>{error ? 'The machine needs a quick reset.' : 'Loading Ashlife Swing & Win...'}</strong>
    <span>{error || 'Preparing prizes, cable and cozy cafe lights.'}</span>
  </div>
);

export default LoadingScreen;
