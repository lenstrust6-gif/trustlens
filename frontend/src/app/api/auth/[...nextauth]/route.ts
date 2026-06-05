import NextAuth from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import { NextAuthOptions } from 'next-auth'

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
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  jwt: {
    secret: process.env.NEXTAUTH_SECRET,
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
      }
      if (account) {
        token.provider = account.provider
        token.providerAccountId = account.providerAccountId
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.provider = token.provider as string
      }
      return session
    },
    async signIn({ user, account, profile }) {
      // Optional: Call backend to create/update user
      try {
        if (user.email) {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/v1/users/${user.id}`,
            {
              method: 'GET',
            }
          )

          // User doesn't exist in backend, create them
          if (response.status === 404) {
            // Backend would create user on first login
            console.log('New user, backend will create on first API call')
          }
        }
      } catch (error) {
        console.error('Error in signIn callback:', error)
        // Don't block sign in if backend call fails
      }

      return true
    },
  },
  events: {
    async signIn({ user, account, profile, isNewUser }) {
      console.log(`User ${user.email} signed in via ${account?.provider}`)
    },
    async signOut({ token }) {
      console.log(`User signed out`)
    },
  },
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
