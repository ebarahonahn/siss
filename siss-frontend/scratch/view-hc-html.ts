import * as fs from 'fs';

const filePath = 'c:/Proy/claude/siss/siss-frontend/src/app/modules/historia-clinica/historia-clinica.component.html';
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

lines.forEach((line, index) => {
  if (line.includes('nueva') || line.includes('Nueva Consulta') || line.includes('state')) {
    console.log(`${index + 1}: ${line.trim()}`);
  }
});
