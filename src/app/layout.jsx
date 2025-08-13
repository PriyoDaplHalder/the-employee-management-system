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
  title: "Managix",
  description: "An Employee Management System for Login and Management",
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
              marginTop: "20px",
              textDecoration: "underline",
            }}
          >
            Managix
          </h1>
          <h2
            style={{ padding:"5px", margin: "20px", textAlign: "center", color: "#ff5733", boxShadow: "0 0 10px rgba(255, 87, 51, 0.5)" , borderRadius: "10px" }}
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
