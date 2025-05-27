// scripts/verify-acid.js
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// Patterns to check for
const patterns = {
  transactionBoundaries: /TransactionManager\.transaction/g,
  errorHandling: /try\s*{[\s\S]*?}\s*catch\s*\(/g,
  resultPattern: /Result\.(ok|fail)/g,
  concurrencyControl: /metadata->version/g,
  documentUpdates: /\.update\([^)]+\)\.match\(\{[^}]*'metadata->version'/g
};

// Files to analyze
const targetDirs = [
  'src/repositories',
  'src/services'
];

// Process files
async function analyzeFiles() {
  const issues = [];
  
  // Check if a specific file was provided
  const specificFile = process.argv[2];
  
  if (specificFile) {
    // Analyze just the specified file
    analyzeFile(specificFile, issues);
  } else {
    // Analyze all files in target directories
    for (const dir of targetDirs) {
      const files = await getFiles(dir);
      
      for (const file of files) {
        if (!file.endsWith('.ts')) continue;
        analyzeFile(file, issues);
      }
    }
  }
  
  return issues;
}

// Analyze a single file
function analyzeFile(file, issues) {
  const content = fs.readFileSync(file, 'utf8');
  
  // Check for database operations without transactions
  if (content.includes('from(') && content.includes('.insert(') && 
      !patterns.transactionBoundaries.test(content)) {
    issues.push(`${file}: Database operations without transaction boundaries`);
  }
  
  // Check for proper error handling
  if (content.includes('async') && !patterns.errorHandling.test(content)) {
    issues.push(`${file}: Async function without proper error handling`);
  }
  
  // Check for document updates without version checking
  if (content.includes('.update(') && content.includes('.from(\'documents\')') && 
      !patterns.documentUpdates.test(content)) {
    issues.push(`${file}: Document updates without version checking`);
  }
  
  // Other checks...
}

// Get all files in directory
async function getFiles(dir) {
  return new Promise((resolve, reject) => {
    exec(`find ${dir} -type f`, (error, stdout) => {
      if (error) return reject(error);
      resolve(stdout.trim().split('\n').filter(Boolean));
    });
  });
}

// Run analysis
analyzeFiles()
  .then(issues => {
    if (issues.length > 0) {
      console.error('ACID compliance issues found:');
      issues.forEach(issue => console.error(`- ${issue}`));
      process.exit(1);
    } else {
      console.log('All files pass ACID compliance checks!');
    }
  })
  .catch(error => {
    console.error('Error running ACID compliance check:', error);
    process.exit(1);
  }); 