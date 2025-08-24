import AuthGuard from './components/auth/AuthGuard';
import ChatInterface from './components/ChatInterface';
import OnboardingTour from './components/OnboardingTour';
import OfflineIndicator from './components/OfflineIndicator';
import MobileFloatingActions from './components/MobileFloatingActions';
import { appStructuredData, organizationStructuredData } from '@/lib/structured-data';

export default function Home() {
  return (
    <>
      {/* Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(appStructuredData),
        }}
      />
      <script
        type="application/ld+json" 
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organizationStructuredData),
        }}
      />
      
      <AuthGuard>
        <main role="main" aria-label="AI Chat Interface">
          <ChatInterface />
          <OnboardingTour />
          <OfflineIndicator position="bottom" showDetails={true} />
          <MobileFloatingActions position="bottom-right" />
        </main>
      </AuthGuard>
    </>
  );
}
