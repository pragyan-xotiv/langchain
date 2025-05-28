import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-8">Multi-Agent Support System</h1>
      <p className="text-xl mb-8">
        Welcome to the Next.js implementation of the Knowledge Layer for the Multi-Agent Support System.
      </p>
      
      <div className="flex flex-col gap-4">
        <Link 
          href="/dashboard/knowledge" 
          className="px-6 py-3 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
        >
          Knowledge Dashboard
        </Link>
        
        <Link 
          href="/dashboard/agents" 
          className="px-6 py-3 bg-green-500 text-white rounded hover:bg-green-600 transition"
        >
          Agents Dashboard
        </Link>
        
        <Link 
          href="/dashboard/scraper" 
          className="px-6 py-3 bg-purple-500 text-white rounded hover:bg-purple-600 transition"
        >
          Web Scraper
        </Link>
      </div>
    </main>
  );
}
