import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import { MongoDBAdapter } from "@auth/mongodb-adapter"
import { MongoClient } from "mongodb"

// Create a cached MongoDB client for auth
let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable to preserve the value across HMR
  if (!global._mongoClientPromise) {
    client = new MongoClient(process.env.MONGODB_URI!, {
      connectTimeoutMS: 8000,
      serverSelectionTimeoutMS: 5000,
      maxPoolSize: 10,
      minPoolSize: 1,
    });
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  // In production mode, it's best to not use a global variable
  client = new MongoClient(process.env.MONGODB_URI!, {
    connectTimeoutMS: 8000,
    serverSelectionTimeoutMS: 5000,
    maxPoolSize: 10,
    minPoolSize: 1,
  });
  clientPromise = client.connect();
}

// Extend the global type
declare global {
  var _mongoClientPromise: Promise<MongoClient>;
}

// Check if we're in demo mode
const isDemoMode = process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

// Configure NextAuth based on demo mode
const authConfig = {
  ...(isDemoMode ? {} : { adapter: MongoDBAdapter(clientPromise) }),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  callbacks: {
    async redirect({ url, baseUrl }) {
      // Allows relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url
      return baseUrl
    },
    async session({ session, token, user }) {
      // Send properties to the client
      if (session.user) {
        session.user.id = user?.id || token?.sub || '';
      }
      return session;
    },
    async jwt({ token, user }) {
      // Persist user id to the token right after signin
      if (user) {
        token.userId = user.id;
      }
      return token;
    },
  },
  session: {
    strategy: isDemoMode ? "jwt" as const : "database" as const,
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  debug: process.env.NODE_ENV === "development" && !isDemoMode,
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig)