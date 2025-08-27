// Export handlers that can be dynamically imported
export const exportToPdf = async (messageId: string, sessionId: string) => {
  const response = await fetch('/api/export/pdf', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messageId, sessionId })
  });
  
  if (!response.ok) {
    throw new Error(`PDF export failed: ${response.status}`);
  }
  
  return response.json();
};

export const exportToWord = async (messageId: string, sessionId: string) => {
  const response = await fetch('/api/export/word', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messageId, sessionId })
  });
  
  if (!response.ok) {
    throw new Error(`Word export failed: ${response.status}`);
  }
  
  return response.json();
};

export const exportToText = async (messageId: string, sessionId: string) => {
  // Simple text export implementation
  const response = await fetch(`/api/sessions/${sessionId}`);
  const session = await response.json();
  const message = session.messages?.find((m: any) => m._id === messageId);
  
  if (!message) {
    throw new Error('Message not found');
  }
  
  const textContent = `Message from ${message.role}:\n\n${message.content}\n\nExported at: ${new Date().toISOString()}`;
  const blob = new Blob([textContent], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  
  return { type: 'text', link: url, success: true };
};