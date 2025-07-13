// pages/faq.tsx
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { GetStaticProps } from 'next'
import { useTranslation } from 'next-i18next'
import Header from '../components/Header'

export default function FAQ() {
  const { t } = useTranslation('common')

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <Header />

      <main className="max-w-3xl mx-auto p-6 space-y-6">
        <h1 className="text-3xl font-bold">{t('faq')}</h1>

        <section>
          <h2 className="text-xl font-semibold">{t('faq_q1')}</h2>
          <p className="mt-2 text-gray-700">{t('faq_a1')}</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">{t('faq_q2')}</h2>
          <p className="mt-2 text-gray-700">{t('faq_a2')}</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">{t('faq_q3')}</h2>
          <p className="mt-2 text-gray-700">{t('faq_a3')}</p>
        </section>
      </main>
    </div>
  )
}

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(locale ?? 'ru', ['common'])),
  },
})
