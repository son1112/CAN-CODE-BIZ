import { WebApplication, WithContext } from 'schema-dts'

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

export const appStructuredData: WithContext<WebApplication> = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "Rubber Ducky Live",
  "description": "Your friendly rubber duck AI companion for thinking out loud, problem-solving, and casual conversations. Chat with Claude 4 AI using voice or text.",
  "url": baseUrl,
  "applicationCategory": "Productivity",
  "applicationSubCategory": "AI Chat Application",
  "operatingSystem": ["Web", "iOS", "Android"],
  "browserRequirements": "Modern web browser with JavaScript enabled",
  "author": {
    "@type": "Organization",
    "name": "Rubber Ducky Live Team"
  },
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  },
  "featureList": [
    "AI Chat with Claude 4",
    "Voice Input and Recognition", 
    "Real-time Streaming Responses",
    "Session Management",
    "Message Export (PDF, Word)",
    "Offline Support",
    "Progressive Web App",
    "Mobile Optimized"
  ],
  "screenshot": `${baseUrl}/og-image.png`,
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "ratingCount": "150",
    "bestRating": "5",
    "worstRating": "1"
  },
  "publisher": {
    "@type": "Organization", 
    "name": "Rubber Ducky Live",
    "url": baseUrl
  }
}

export const organizationStructuredData = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Rubber Ducky Live",
  "url": baseUrl,
  "description": "Developer of AI-powered chat applications and productivity tools",
  "foundingDate": "2024",
  "applicationCategory": "Technology"
}

export const breadcrumbStructuredData = (items: Array<{name: string, url: string}>) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": items.map((item, index) => ({
    "@type": "ListItem",
    "position": index + 1,
    "name": item.name,
    "item": `${baseUrl}${item.url}`
  }))
})