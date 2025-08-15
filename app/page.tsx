import AuthGuard from './components/auth/AuthGuard';
import ChatInterface from './components/ChatInterface';

export default function Home() {
  return (
    <AuthGuard>
      <ChatInterface />
    </AuthGuard>
  );
}
