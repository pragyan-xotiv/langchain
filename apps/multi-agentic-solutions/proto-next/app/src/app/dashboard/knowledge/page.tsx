import KnowledgeSearch from '@/components/knowledge/KnowledgeSearch';

export default function KnowledgeDashboardPage() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Knowledge Dashboard</h1>
      <KnowledgeSearch />
    </div>
  );
} 