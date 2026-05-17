const fs = require('fs');

let content = fs.readFileSync('src/app/modules/pediatria/pages/dashboard-nino/dashboard-nino.component.html', 'utf8');

// Match the grid containing peso, talla, perimetroCefalico
const regex = /<div class="grid grid-cols-1 md:grid-cols-3 gap-6">\s*<div class="space-y-2">\s*<label class="text-sm font-bold text-gray-600">Peso \(kg\)/;

if (regex.test(content)) {
  console.log('Regex matched!');
  
  const fixed = `<div class="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div class="space-y-2">
              <label class="text-sm font-bold text-gray-600">Fecha de Control <span class="text-red-500">*</span></label>
              <input type="date" formControlName="fechaControl" class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all">
            </div>
            <div class="space-y-2">
              <label class="text-sm font-bold text-gray-600">Peso (kg) <span class="text-red-500">*</span></label>
              <input type="number" step="0.01" formControlName="peso" class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all">
            </div>
            <div class="space-y-2">
              <label class="text-sm font-bold text-gray-600">Talla (cm) <span class="text-red-500">*</span></label>
              <input type="number" step="0.1" formControlName="talla" class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all">
            </div>
            <div class="space-y-2">
              <label class="text-sm font-bold text-gray-600">Perímetro Cefálico (cm)</label>
              <input type="number" step="0.1" formControlName="perimetroCefalico" class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all">
            </div>
          </div>`;

  // Replace everything from the matched div down to the closing div of perimetroCefalico
  // We can find the start index of the match
  const match = content.match(/<div class="grid grid-cols-1 md:grid-cols-3 gap-6">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*<\/div>/);
  if (match) {
    console.log('Complete block matched!');
    content = content.replace(match[0], fixed);
    fs.writeFileSync('src/app/modules/pediatria/pages/dashboard-nino/dashboard-nino.component.html', content);
    console.log('Replacement done!');
  } else {
    // Let's do a simpler replacement
    const simpleRegex = /<div class="grid grid-cols-1 md:grid-cols-3 gap-6">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*<\/div>/;
    const m = content.match(simpleRegex);
    if (m) {
       console.log('Simple block matched!');
    } else {
       console.log('No block matched!');
    }
  }
} else {
  console.log('Regex did NOT match!');
}
