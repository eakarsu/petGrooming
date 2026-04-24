'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { PawPrint, UserCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import toast from 'react-hot-toast'

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

type LoginFormData = z.infer<typeof loginSchema>

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const fillDemoCredentials = () => {
    setValue('email', 'admin@petgroom.com')
    setValue('password', 'password123')
    toast.success('Demo credentials filled!')
  }

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
                placeholder="admin@petgroom.com"
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
            <Button type="submit" className="w-full" loading={loading}>
              Sign In
            </Button>
          </form>
          <div className="mt-4 space-y-3">
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={fillDemoCredentials}
            >
              <UserCheck className="mr-2 h-4 w-4" />
              Use Demo Credentials
            </Button>
            <div className="text-center text-xs text-gray-400">
              <p>admin@petgroom.com / password123</p>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-sm">
            <Link href="/auth/forgot-password" className="text-primary-600 hover:underline">
              Forgot Password?
            </Link>
            <Link href="/auth/register" className="text-primary-600 hover:underline">
              Create Account
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
