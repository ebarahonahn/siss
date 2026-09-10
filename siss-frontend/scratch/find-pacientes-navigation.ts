import * as fs from 'fs';

const filePath = 'c:/Proy/claude/siss/siss-frontend/src/app/modules/pacientes/pacientes.component.ts';
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

lines.forEach((line, index) => {
  if (line.includes('nueva') || line.includes('historia-clinica') || line.includes('navigate')) {
    console.log(`${index + 1}: ${line.trim()}`);
  }
});
