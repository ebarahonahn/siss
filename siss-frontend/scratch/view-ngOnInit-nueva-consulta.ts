import * as fs from 'fs';

const filePath = 'c:/Proy/claude/siss/siss-frontend/src/app/modules/historia-clinica/pages/nueva-consulta/nueva-consulta.component.ts';
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

for (let i = 3540; i <= 3560; i++) {
  if (lines[i - 1] !== undefined) {
    console.log(`${i}: ${lines[i - 1]}`);
  }
}
