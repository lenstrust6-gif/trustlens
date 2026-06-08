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
    // Google OAuth (Phase 2 - uncomment when ready)
    // GoogleProvider({
    //   clientId: process.env.GOOGLE_CLIENT_ID || '',
    //   clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    //   allowDangerousEmailAccountLinking: true,
    // }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60,
  },
  jwt: {
    secret: process.env.NEXTAUTH_SECRET,
    maxAge: 30 * 24 * 60 * 60,
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.email = user.email
        token.name = user.name
      }
      return token
    },
    async session({ session, token }) {
      if (session && session.user) {
        session.user.id = (token.id as string) || ''
        session.user.email = (token.email as string) || null
        session.user.name = (token.name as string) || null
      }
      return session
    },
  },
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
