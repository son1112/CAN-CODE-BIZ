import AuthGuard from './components/auth/AuthGuard';
import ChatInterface from './components/ChatInterface';
import OnboardingTour from './components/OnboardingTour';

export default function Home() {
  return (
    <AuthGuard>
      <ChatInterface />
      <OnboardingTour />
    </AuthGuard>
  );
}
