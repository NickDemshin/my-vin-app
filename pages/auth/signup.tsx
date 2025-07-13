import { signIn, getCsrfToken } from 'next-auth/react'
import { useState } from 'react'
import { useRouter } from 'next/router'
import { GetServerSideProps } from 'next'

export default function Signup({ csrfToken }: { csrfToken: string }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const router = useRouter()

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })

    if (res.ok) {
      await signIn('credentials', {
        redirect: false,
        email,
        password,
        callbackUrl: '/dashboard',
      }).then((res) => {
        if (res?.ok) router.push('/dashboard')
      })
    } else {
      const data = await res.json()
      alert(data.message || 'Ошибка регистрации')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form onSubmit={handleSignup} className="bg-white p-8 rounded shadow-md w-full max-w-sm">
        <input name="csrfToken" type="hidden" defaultValue={csrfToken} />
        <h1 className="text-2xl font-bold mb-6 text-center">Регистрация</h1>
        <input
          type="email"
          placeholder="Email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full mb-4 px-4 py-2 border rounded"
        />
        <input
          type="password"
          placeholder="Пароль"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full mb-4 px-4 py-2 border rounded"
        />
        <button
          type="submit"
          className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
        >
          Зарегистрироваться
        </button>
        <p className="text-center text-sm mt-4">
          Уже есть аккаунт?{' '}
          <a href="/auth/signin" className="text-blue-600 underline">
            Войти
          </a>
        </p>
      </form>
    </div>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  return {
    props: {
      csrfToken: await getCsrfToken(context),
    },
  }
}
