"use client"

import "./custom.css";

const ErrorPage = () => {
  return (
    <div className="error-container">
      <div className="error-card">
        <h1 className="error-title">500</h1>
        <h2 className="error-subtitle">Something went wrong</h2>
        <p className="error-message">
          An unexpected error has occurred. Please try again later.
        </p>
        <a className="error-button" href="/">Go to Homepage</a>
      </div>
    </div>
  );
};

export default ErrorPage;
