export const metadata = { title: 'Zazzles Lab · React2Shell' };
export default function RootLayout({ children }) {
  return <html lang="en"><body style={{ fontFamily: 'system-ui', maxWidth: 850, margin: '4rem auto', padding: 24 }}>{children}</body></html>;
}
