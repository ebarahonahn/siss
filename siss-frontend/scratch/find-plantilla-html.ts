import * as fs from 'fs';

const filePath = 'c:/Proy/claude/siss/siss-frontend/src/app/modules/historia-clinica/pages/nueva-consulta/nueva-consulta.component.ts';
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

lines.forEach((line, index) => {
  if (line.includes('plantilla()') || line.includes('plantilla().')) {
    console.log(`${index + 1}: ${line.trim()}`);
  }
});
