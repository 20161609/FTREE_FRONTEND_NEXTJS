import localFont from "next/font/local";
import "./globals.css";

// 폰트 설정
const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

// 메타데이터 설정
export const metadata = {
  title: "Finance Tree",
  description: "Manage your finances easily with Finance Tree",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <style>
          {`
            body {
              background-color: #f5f5f5; /* 은은한 흰색 */
              color: #222; /* 검정색 텍스트 */
              font-family: var(--font-geist-sans), sans-serif;
            }

            header {
              background-color: #222; /* 검은색 */
              color: #ffffff;
              padding: 20px;
              text-align: center;
              border-bottom: 4px solid #3a7c3a; /* 초록색 포인트 */
            }

            .container {
              max-width: 800px;
              margin: 0 auto;
              padding: 20px;
              border-radius: 8px;
              box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); /* 살짝 그림자 */
            }

            .footer {
              background-color: #222; /* 검은색 */
              color: #ffffff;
              text-align: center;
              padding: 10px;
              font-size: 0.8em;
              border-top: 2px solid #3a7c3a; /* 초록색 */
              position: fixed;
              bottom: 0;
              width: 100%;
            }

            a {
              color: #3a7c3a; /* 초록색 링크 */
              text-decoration: none;
              transition: color 0.3s ease;
            }

            a:hover {
              color: #1e5b1e; /* 더 짙은 초록색 */
            }
          `}
        </style>
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <header>
          <h1>Finance Tree</h1>
          <p>Simple, elegant financial management</p>
        </header>
        <div className="container">
          {children}
        </div>
        <footer className="footer">
          &copy; {new Date().getFullYear()} Finance Tree. All rights reserved.
        </footer>
      </body>
    </html>
  );
}
