import "./custom.css"; // import the custom CSS
import Link from "next/link";

const NotFound = () => {
  return (
    <div className="notfound-container">
      <div className="notfound-card">
        <h1 className="notfound-title">404</h1>
        <h2 className="notfound-subtitle">Page Not Found</h2>
        <p className="notfound-text">
          Sorry, the page you're looking for doesn't exist.
        </p>
        <Link className="notfound-button" href="/">Go to Homepage</Link>
      </div>
    </div>
  );
};

export default NotFound;
