'use client'

import { useEffect, useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { PawPrint } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import toast from 'react-hot-toast'

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

type LoginFormData = z.infer<typeof loginSchema>

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [demoEnabled, setDemoEnabled] = useState(false)
  const [demoLoading, setDemoLoading] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    fetch('/api/auth/demo-credentials?status=1', { cache: 'no-store', signal: controller.signal })
      .then(async response => response.ok ? response.json() : { enabled: false })
      .then(result => setDemoEnabled(result.enabled === true))
      .catch(() => {})
    return () => controller.abort()
  }, [])

  const {
    register, setValue,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormData) => {
    setLoading(true)
    try {
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      })

      if (result?.error) {
        toast.error('Invalid email or password')
      } else {
        toast.success('Login successful!')
        router.push('/dashboard')
        router.refresh()
      }
    } catch (error) {
      toast.error('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-100">
            <PawPrint className="h-8 w-8 text-primary-600" />
          </div>
          <CardTitle className="text-2xl">Welcome to PetGroom Pro</CardTitle>
          <CardDescription>Sign in to manage your grooming business</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@business.example"
                {...register('email')}
                error={errors.email?.message}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                {...register('password')}
                error={errors.password?.message}
              />
            </div>
            {demoEnabled && <button
              type="button"
              disabled={demoLoading || loading}
              onClick={async () => {
                setDemoLoading(true)
                try {
                  const response = await fetch('/api/auth/demo-credentials', { cache: 'no-store' })
                  const credentials = await response.json()
                  if (!response.ok || !credentials.enabled || !credentials.email || !credentials.password) {
                    setDemoEnabled(false)
                    toast.error('Demo credentials are unavailable. Please sign in with your account.')
                    return
                  }
                  setValue('email', credentials.email, { shouldValidate: true })
                  setValue('password', credentials.password, { shouldValidate: true })
                } catch {
                  toast.error('Could not load demo credentials. Please try again.')
                } finally {
                  setDemoLoading(false)
                }
              }}
              aria-label="Auto Fill Demo Credentials"
              style={{ width: '100%', marginBottom: '12px', padding: '10px 14px', borderRadius: '8px', border: '1px solid currentColor', background: 'transparent', cursor: 'pointer' }}
            >
              {demoLoading ? 'Filling credentials…' : 'Auto Fill Demo Credentials'}
            </button>}
            <Button type="submit" className="w-full" loading={loading}>
              Sign In
            </Button>
          </form>
          <p className="mt-4 text-center text-xs text-gray-500">Accounts are provisioned by an administrator.</p>
        </CardContent>
      </Card>
    </div>
  )
}
