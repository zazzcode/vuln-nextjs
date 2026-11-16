import '../styles/globals.css';
export default function MyApp({ Component, pageProps, router }) {
  return <Component key={router.asPath.split('?')[0]} {...pageProps} />;
}
