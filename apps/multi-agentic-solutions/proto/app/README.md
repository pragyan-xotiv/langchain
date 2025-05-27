# Multi-Agent Support System

A support system powered by multiple AI agents working together to assist users.

## Features

- Multi-agent architecture for handling complex user queries
- LangChain and LangGraph for agent orchestration
- Supabase for database and vector storage
- TypeScript for type safety and better developer experience

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm
- Supabase account and project
- OpenAI API key

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file based on `.env.example` and fill in your API keys and configuration
4. Run the development server:
   ```bash
   npm run dev
   ```

### Scripts

- `npm run build` - Build the application
- `npm run start` - Start the production server
- `npm run dev` - Start the development server with hot reload
- `npm run test` - Run tests
- `npm run lint` - Lint the codebase
- `npm run format` - Format the codebase
- `npm run setup-db` - Set up the database (run once)

## Project Structure

```
src/
├── agents/       # Agent definitions and configurations
├── api/          # Express API routes, controllers, and middleware
├── config/       # Application configuration
├── rag/          # Retrieval-augmented generation components
├── repositories/ # Data access layer
├── services/     # Business logic
├── tools/        # Agent tools
├── types/        # TypeScript type definitions
└── utils/        # Utility functions
```

## License

ISC