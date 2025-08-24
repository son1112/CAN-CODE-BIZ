import AuthGuard from './components/auth/AuthGuard';
import ChatInterface from './components/ChatInterface';
import OnboardingTour from './components/OnboardingTour';
import OfflineIndicator from './components/OfflineIndicator';
import MobileFloatingActions from './components/MobileFloatingActions';

export default function Home() {
  return (
    <AuthGuard>
      <ChatInterface />
      <OnboardingTour />
      <OfflineIndicator position="bottom" showDetails={true} />
      <MobileFloatingActions position="bottom-right" />
    </AuthGuard>
  );
}
