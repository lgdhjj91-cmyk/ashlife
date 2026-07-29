import React from 'react';

const LoadingScreen = ({ error, copy }) => (
  <div className="claw-loading-screen" role="status">
    <strong>{error ? copy.reset : copy.loading}</strong>
    <span>{error || copy.preparing}</span>
  </div>
);

export default LoadingScreen;
