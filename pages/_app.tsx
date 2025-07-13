// pages/_app.tsx
import '../styles/globals.css'
import type { AppProps } from 'next/app'
import { SessionProvider } from 'next-auth/react'
import { appWithTranslation } from 'next-i18next'
import Header from '../components/Header'

function App({ Component, pageProps }: AppProps) {
  return (
    <SessionProvider session={pageProps.session}>
      {/* Header всегда сверху */}
      <Header />

      {/* Здесь меняются «вкладки» */}
      <main className="pt-16"> {/* отводим место под фиксированный Header */}
        <Component {...pageProps} />
      </main>
    </SessionProvider>
  )
}

export default appWithTranslation(App)
