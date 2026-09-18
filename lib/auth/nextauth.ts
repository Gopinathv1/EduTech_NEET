import type { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { authorizeGoogleStudent } from '@/lib/auth/google';

export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt' },
  secret: process.env.NEXTAUTH_SECRET ?? process.env.JWT_SECRET,
  pages: {
    signIn: '/login',
    error: '/login',
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
      authorization: { params: { prompt: 'select_account' } },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      const decision = await authorizeGoogleStudent({ user, account, profile });
      // Unknown verified Google identities may complete the provider exchange,
      // but /api/auth/google/finish never creates an application account. It
      // redirects them to the branded register-first state instead.
      return decision !== 'denied';
    },
  },
};
