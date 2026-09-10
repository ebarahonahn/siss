import * as fs from 'fs';

const filePath = 'c:/Proy/claude/siss/siss-backend/src/modules/auth/auth.service.ts';
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

for (let i = 20; i <= 55; i++) {
  console.log(`${i}: ${lines[i - 1]}`);
}
