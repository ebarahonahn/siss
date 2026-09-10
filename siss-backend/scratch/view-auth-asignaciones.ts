import * as fs from 'fs';

const filePath = 'c:/Proy/claude/siss/siss-backend/src/modules/auth/auth.service.ts';
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

lines.forEach((line, index) => {
  if (line.includes('findFirst') || line.includes('findUnique') || line.includes('usuario.asignaciones')) {
    console.log(`${index + 1}: ${line.trim()}`);
  }
});
