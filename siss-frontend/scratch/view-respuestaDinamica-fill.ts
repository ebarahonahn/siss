import * as fs from 'fs';

const filePath = 'c:/Proy/claude/siss/siss-frontend/src/app/modules/historia-clinica/pages/nueva-consulta/nueva-consulta.component.ts';
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

for (let i = 3240; i <= 3270; i++) {
  if (lines[i - 1] !== undefined) {
    console.log(`${i}: ${lines[i - 1]}`);
  }
}
