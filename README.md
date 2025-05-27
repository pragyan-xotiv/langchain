# langchain
Langchain learnings

## About This Repository
This repository contains my personal learning journey, experiments, and projects built with LangChain. LangChain is a framework for developing applications powered by language models, providing tools to create context-aware, reasoning applications.

## Purpose
- Document my progress learning the LangChain framework
- Store code samples and example implementations
- Track experiments with different LLM chains and agents
- Showcase projects built using LangChain components

## Getting Started
More information on how to run the examples in this repository will be added as the project develops.

## Projects

### Multi-Agentic Solutions
This project contains a multi-agent support system with various components:

- **[Knowledge Layer](./KNOWLEDGE_LAYER.md)**: A RAG-based system for retrieving and using external knowledge
- **[Knowledge Layer Testing](./KNOWLEDGE_LAYER_TESTING.md)**: Documentation on the testing approach for the Knowledge Layer

#### Running Tests
The project includes comprehensive test coverage:

```bash
# Run all tests (note: some tests require external dependencies)
npm test

# Run only tests that don't require external dependencies
npm run test:unit

# Run only integration tests
npm run test:integration
```

For more details on testing, see the [Knowledge Layer Testing](./KNOWLEDGE_LAYER_TESTING.md) documentation.
