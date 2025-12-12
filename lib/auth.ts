import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from './prisma'

export const authOptions: NextAuthOptions = {
  debug: true,
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        console.log('🔐 [AUTH] authorize() appelé avec:', { email: credentials?.email })

        if (!credentials?.email || !credentials?.password) {
          console.log('❌ [AUTH] Credentials manquantes')
          return null
        }

        try {
          const user = await prisma.user.findUnique({
            where: {
              email: credentials.email
            }
          })

          console.log('👤 [AUTH] User trouvé:', user ? `✅ ${user.email}` : '❌ non trouvé')

          if (!user) {
            return null
          }

          console.log('🔑 [AUTH] Test du mot de passe...')
          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password
          )

          console.log('🔑 [AUTH] Mot de passe valide:', isPasswordValid ? '✅' : '❌')

          if (!isPasswordValid) {
            return null
          }

          const returnUser = {
            id: user.id,
            email: user.email,
            name: user.name,
          }

          console.log('✅ [AUTH] Authentification réussie, retour:', returnUser)
          return returnUser
        } catch (error) {
          console.error('❌ [AUTH] Erreur dans authorize():', error)
          return null
        }
      }
    })
  ],
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      console.log('🎫 [AUTH] jwt callback:', { token, user })
      if (user) {
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      console.log('📋 [AUTH] session callback:', { session, token })
      if (session.user) {
        session.user.id = token.id as string
      }
      return session
    }
  }
}
