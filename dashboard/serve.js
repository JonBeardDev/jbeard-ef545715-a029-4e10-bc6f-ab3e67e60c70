const { spawn } = require('child_process');
const path = require('path');

const ngPath = path.join(__dirname, '..', 'node_modules', '.bin', 'ng');

const ng = spawn('node', [ngPath, 'serve', '--port', '4200'], {
  cwd: __dirname,
  stdio: 'inherit',
  shell: true
});

ng.on('close', (code) => {
  process.exit(code);
});