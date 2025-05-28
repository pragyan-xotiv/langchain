# Knowledge Layer - Next.js Implementation

This is the Next.js implementation of the Knowledge Layer for the Multi-Agent Support System.

## Getting Started

First, set up your environment variables:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your OpenAI API key and Supabase credentials.

Then, install the dependencies:

```bash
npm install
```

Set up the database:

```bash
npm run setup-db
```

Finally, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Features

- **Knowledge Search**: Query the knowledge base using natural language questions
- **Vector Storage**: Store and retrieve documents using vector embeddings
- **LangChain Integration**: Utilize LangChain's capabilities for RAG (Retrieval Augmented Generation)

## Testing

Run the test suite with:

```bash
npm test
```

Or test the knowledge layer specifically:

```bash
npm run test:knowledge
```

## Project Structure

- `/src/app`: Next.js app router pages and API routes
- `/src/components`: React components
- `/src/lib`: Core functionality 
  - `/lib/agents`: Agent implementations
  - `/lib/rag`: Retrieval Augmented Generation modules
  - `/lib/services`: Infrastructure services (Supabase, OpenAI, etc.)
  - `/lib/utils`: Utility functions
- `/scripts`: Setup and utility scripts
- `/tests`: Test files

## Environment Variables

See `.env.example` for all required and optional environment variables.

## License

MIT
