const fs = require('fs');
const { execSync } = require('child_process');
const result = execSync('npx eslint "src/**/*.{ts,tsx}" --format json', {encoding: 'utf-8', maxBuffer: 50 * 1024 * 1024});
const data = JSON.parse(result);
const stats = data
  .map(f => ({file: f.filePath.replace(/.*[\\/]src[\\/]/, 'src/').replace(/\/g, '/'), count: f.messages.filter(m => m.message.includes('Unexpected any')).length}))
  .filter(f => f.count > 0)
  .sort((a,b) => b.count - a.count)
  .slice(0, 20);
stats.forEach(f => console.log(`${f.count} - ${f.file}`));
