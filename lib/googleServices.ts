// Google Services Dynamic Loader
export class GoogleServicesLoader {
  private static instance: GoogleServicesLoader;
  private loaded = false;
  private loading = false;
  private callbacks: Array<(loaded: boolean) => void> = [];

  static getInstance(): GoogleServicesLoader {
    if (!GoogleServicesLoader.instance) {
      GoogleServicesLoader.instance = new GoogleServicesLoader();
    }
    return GoogleServicesLoader.instance;
  }

  async loadGoogleServices(): Promise<boolean> {
    if (this.loaded) {
      return true;
    }

    if (this.loading) {
      return new Promise((resolve) => {
        this.callbacks.push(resolve);
      });
    }

    this.loading = true;

    try {
      console.log('🚀 Starting Google services load process');

      // Load Google Identity Services (this creates window.google)
      await this.loadScript('https://accounts.google.com/gsi/client');

      // Give the script time to initialize the global object
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Log current state for debugging
      if (typeof window !== 'undefined') {
        console.log('🔍 Google services state after script load:', {
          hasGoogle: !!window.google,
          hasAccounts: !!window.google?.accounts,
          hasOAuth2: !!window.google?.accounts?.oauth2,
          hasGapi: typeof window.gapi !== 'undefined',
          windowKeys: Object.keys(window).filter(key => key.includes('goog')),
          googleObject: window.google ? Object.keys(window.google) : 'no google object'
        });
      }

      // Wait for services to be available
      await this.waitForServices();

      this.loaded = true;
      this.notifyCallbacks(true);
      return true;
    } catch (error) {
      console.error('❌ Failed to load Google services:', error);
      this.notifyCallbacks(false);
      return false;
    } finally {
      this.loading = false;
    }
  }

  private loadScript(src: string): Promise<void> {
    return new Promise((resolve, reject) => {
      // Check if script already exists
      if (document.querySelector(`script[src="${src}"]`)) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = src;
      script.onload = () => {
        console.log(`✅ Loaded: ${src}`);
        resolve();
      };
      script.onerror = () => {
        console.error(`❌ Failed to load: ${src}`);
        reject(new Error(`Failed to load script: ${src}`));
      };

      document.head.appendChild(script);
    });
  }

  private waitForServices(timeout = 8000): Promise<void> {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();

      const checkServices = () => {
        const elapsed = Date.now() - startTime;

        // Log current state for debugging
        if (elapsed % 1000 < 100) { // Log every ~1 second
          console.log('🔍 Checking Google services...', {
            elapsed: `${elapsed}ms`,
            hasGoogle: !!window.google,
            hasAccounts: !!window.google?.accounts,
            hasOAuth2: !!window.google?.accounts?.oauth2,
            hasGapi: typeof window.gapi !== 'undefined'
          });
        }

        // Check for Google Identity Services OAuth2
        if (window.google?.accounts?.oauth2) {
          console.log('✅ Google Identity Services ready', {
            elapsed: `${elapsed}ms`
          });
          resolve();
          return;
        }

        // Alternative: Check if window.google exists but needs initialization
        if (elapsed > 2000 && window.google && !window.google.accounts?.oauth2) {
          console.log('🔧 Google object exists but OAuth2 not ready, attempting initialization');
          // Sometimes the object exists but needs a moment to fully initialize
          if (elapsed > 4000) {
            console.warn('⚠️ Google services partially loaded, proceeding anyway');
            resolve();
            return;
          }
        }

        if (elapsed > timeout) {
          const debugInfo = {
            elapsed: `${elapsed}ms`,
            timeout: `${timeout}ms`,
            hasWindow: typeof window !== 'undefined',
            hasGoogle: !!window.google,
            hasAccounts: !!window.google?.accounts,
            hasOAuth2: !!window.google?.accounts?.oauth2,
            hasGapi: typeof window.gapi !== 'undefined',
            googleKeys: window.google ? Object.keys(window.google) : [],
            accountsKeys: window.google?.accounts ? Object.keys(window.google.accounts) : []
          };

          console.error('❌ Timeout waiting for Google services', debugInfo);
          reject(new Error(`Timeout waiting for Google services after ${elapsed}ms. Debug info: ${JSON.stringify(debugInfo)}`));
          return;
        }

        setTimeout(checkServices, 100);
      };

      checkServices();
    });
  }

  private notifyCallbacks(success: boolean) {
    this.callbacks.forEach(callback => callback(success));
    this.callbacks = [];
  }

  isLoaded(): boolean {
    return this.loaded && !!window.google?.accounts?.oauth2;
  }
}

// Convenience function
export const loadGoogleServices = () => {
  return GoogleServicesLoader.getInstance().loadGoogleServices();
};

export const isGoogleServicesReady = () => {
  return GoogleServicesLoader.getInstance().isLoaded();
};