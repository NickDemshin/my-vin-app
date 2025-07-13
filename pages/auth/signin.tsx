// pages/auth/signin.tsx
import { getCsrfToken } from 'next-auth/react'
import { GetServerSideProps } from 'next'

export default function SignIn({ csrfToken }: { csrfToken: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form
        method="post"
        action="/api/auth/callback/credentials"
        className="bg-white p-8 rounded shadow-md w-full max-w-sm"
      >
        {/* CSRF-токен */}
        <input name="csrfToken" type="hidden" defaultValue={csrfToken} />
        {/* Куда вернуть после входа */}
        <input name="callbackUrl" type="hidden" defaultValue="/dashboard" />

        <h1 className="text-2xl font-bold mb-6 text-center">Вход</h1>

        <label className="block mb-2">Email</label>
        <input
          name="email"
          type="email"
          required
          placeholder="you@example.com"
          className="w-full mb-4 px-4 py-2 border rounded"
        />

        <label className="block mb-2">Пароль</label>
        <input
          name="password"
          type="password"
          required
          placeholder="••••••••"
          className="w-full mb-4 px-4 py-2 border rounded"
        />

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
        >
          Войти
        </button>
        <p className="text-center text-sm mt-4">
          Если вы ещё не зарегистрированы, <a href="/auth/signup" className="text-blue-600 underline">зарегистрируйтесь</a>.
        </p>
      </form>
    </div>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => ({
  props: {
    csrfToken: await getCsrfToken(context),
  },
})
