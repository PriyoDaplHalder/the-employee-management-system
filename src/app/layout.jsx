import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "../context/AuthContext";
import MUIProvider from "../components/MUIProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Employee Management System",
  description: "Employee Management System for Login and Management",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning={true}
      >
        <noscript>
          <h1
            style={{
              padding: "10px",
              margin: "10px",
              color: "blue",
              textAlign: "center",
              border: "2px solid blue",
              borderRadius: "10px",
              marginTop: "20px",
            }}
          >
            Employee Management System
          </h1>
          <h2
            style={{ padding: "20px", textAlign: "center", color: "#ff5733" }}
          >
            Please enable JavaScript to use this application.
          </h2>
          <p
            style={{
              textAlign: "center",
              color: " #FFC300",
              paddingBottom: "30px",
            }}
          >
            Go to your browser settings and enable <b>Java Script</b>
          </p>
        </noscript>
        <MUIProvider>
          <AuthProvider>{children}</AuthProvider>
        </MUIProvider>
      </body>
    </html>
  );
}
