'use client'; // required for error components

import './custom.css'; // custom CSS file

export default function GlobalError({ error, reset }) {
  return (
    <div className="error-container">
      <div className="error-card">
        <h1 className="error-title">Something went wrong</h1>
        <p className="error-message">
          {error?.message || "An unexpected error occurred. Please try again later."}
        </p>
        <div className="error-actions">
          <button className="error-button" onClick={() => reset()}>
            Try Again
          </button>
          <a className="error-link" href="/">Go to Homepage</a>
        </div>
      </div>
    </div>
  );
}
