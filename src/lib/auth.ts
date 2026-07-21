import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { compare } from 'bcryptjs'
import { db } from './db'

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
    maxAge: 8 * 60 * 60,
  },
  pages: {
    signIn: '/auth/login',
  },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Invalid credentials')
        }

        const user = await db.user.findUnique({
          where: { email: credentials.email },
        })

        if (!user || !user.isActive) {
          throw new Error('Invalid credentials')
        }

        const isPasswordValid = await compare(credentials.password, user.password)

        if (!isPasswordValid) {
          throw new Error('Invalid credentials')
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const current = await db.user.findUnique({ where: { id: user.id }, select: { authVersion: true } })
        return {
          ...token,
          userId: user.id,
          role: (user as any).role,
          authVersion: current?.authVersion,
          invalid: false,
        }
      }
      const userId = String((token as any).userId || token.sub || '')
      const current = userId ? await db.user.findUnique({ where: { id: userId }, select: { role: true, isActive: true, authVersion: true } }) : null
      if (!current?.isActive || current.authVersion !== (token as any).authVersion) return { ...token, invalid: true }
      return { ...token, role: current.role, invalid: false }
    },
    async session({ session, token }) {
      return {
        ...session,
        invalid: Boolean((token as any).invalid),
        user: {
          ...session.user,
          id: (token as any).userId || token.sub,
          role: (token as any).role,
          authVersion: (token as any).authVersion,
        },
      }
    },
  },
}
