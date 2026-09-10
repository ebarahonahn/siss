import * as fs from 'fs';
import * as path from 'path';

const filePath = path.join(__dirname, '..', 'prisma', 'seed.ts');
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

lines.forEach((line, index) => {
  if (line.includes('odontologo') || line.includes('Password') || line.includes('Contraseña') || line.includes('contrasena')) {
    console.log(`${index + 1}: ${line}`);
  }
});
