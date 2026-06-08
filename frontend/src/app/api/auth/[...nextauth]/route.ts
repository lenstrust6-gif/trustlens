import NextAuth, { type NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'

declare module 'next-auth' {
  interface Session {
    user: {
      id?: string
      provider?: string
      email?: string | null
      name?: string | null
      image?: string | null
    }
  }
  interface User {
    id?: string
    email?: string
    name?: string
    image?: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string
    provider?: string
    providerAccountId?: string
    image?: string
  }
}

const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60,
  },
  jwt: {
    secret: process.env.NEXTAUTH_SECRET || 'insecure-dev-secret-please-set-env-var',
    maxAge: 30 * 24 * 60 * 60,
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id
        token.email = user.email
        token.name = user.name
        token.image = user.image
      }
      if (account) {
        token.provider = (account as any).provider
        token.providerAccountId = ((account as any).providerAccountId || (account as any).id) as string
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.email = token.email as string | null
        session.user.name = token.name as string | null
        session.user.image = token.image as string | null
      }
      return session
    },
    async signIn({ user, account }) {
      // Sync user to backend database
      if (account && user.email) {
        try {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/auth/sync`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                email: user.email,
                name: user.name || null,
                image: user.image || null,
                provider: account.provider,
                provider_account_id: account.providerAccountId || account.id,
              }),
            }
          )

          if (!response.ok) {
            console.error('Failed to sync user to backend')
            return false
          }

          const userData = await response.json()
          user.id = userData.id
        } catch (error) {
          console.error('Error syncing user:', error)
          return false
        }
      }
      return true
    },
  },
  events: {
    async signIn({ user }) {
      console.log(`User ${user.email} signed in`)
    },
    async signOut() {
      console.log(`User signed out`)
    },
  },
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
