// pages/_app.tsx
import '../styles/globals.css'
import type { AppProps } from 'next/app'
import { SessionProvider } from 'next-auth/react'

export default function App({ Component, pageProps: { session, ...rest } }: AppProps) {
  return (
    <SessionProvider session={session}>
      <Component {...rest} />
    </SessionProvider>
  )
}
