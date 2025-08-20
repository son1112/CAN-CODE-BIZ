/**
 * Global type definitions for external libraries and APIs
 */

declare global {
  interface Window {
    gapi: {
      load: (api: string, callback: () => void) => void;
      auth2: {
        init: (config: { client_id: string }) => Promise<GoogleAuth>;
        getAuthInstance: () => GoogleAuth | null;
      };
    };
  }

  interface GoogleAuth {
    signIn: (options: { scope: string }) => Promise<GoogleUser>;
    signOut: () => Promise<void>;
    isSignedIn: {
      get: () => boolean;
    };
  }

  interface GoogleUser {
    getAuthResponse: () => {
      access_token: string;
      expires_at: number;
      expires_in: number;
      scope: string;
    };
    getBasicProfile: () => {
      getId: () => string;
      getName: () => string;
      getEmail: () => string;
    };
  }
}

export {};