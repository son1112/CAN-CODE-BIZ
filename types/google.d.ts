// Google Identity Services TypeScript declarations
declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: {
              access_token?: string;
              error?: string;
              error_description?: string;
            }) => void;
          }) => {
            requestAccessToken: () => void;
          };
        };
      };
    };
    gapi?: {
      load: (api: string, callback: () => void) => void;
      auth2: {
        init: (config: { client_id: string }) => Promise<{
          getAuthInstance: () => {
            signIn: (options: { scope: string }) => Promise<{
              getAuthResponse: () => { access_token: string };
            }>;
          };
        }>;
        getAuthInstance: () => {
          signIn: (options: { scope: string }) => Promise<{
            getAuthResponse: () => { access_token: string };
          }>;
        } | null;
      };
    };
    googleGSILoaded?: boolean;
  }
}

export {};