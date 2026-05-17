const fs = require('fs');

let content = fs.readFileSync('src/app/modules/pediatria/pages/dashboard-nino/dashboard-nino.component.html', 'utf8');

const regex = /<span \[ngClass\]="\{\s*'bg-green-100 text-green-700': control\.estadoNutricional === 'Normal',\s*'bg-yellow-100 text-yellow-700': control\.estadoNutricional\?\.includes\('Riesgo'\),\s*<\/td>\s*<\/tr>/g;

const fixed = `<span [ngClass]="{
                      'bg-green-100 text-green-700': control.estadoNutricional === 'Normal',
                      'bg-yellow-100 text-yellow-700': control.estadoNutricional?.includes('Riesgo'),
                      'bg-red-100 text-red-700': control.estadoNutricional?.includes('Desnutrición') || control.estadoNutricional?.includes('Obesidad')
                    }" class="px-2 py-1 rounded-md text-xs font-bold uppercase">
                      {{ control.estadoNutricional || 'S/D' }}
                    </span>
                  </td>
                  <td class="py-4 text-sm text-gray-500">{{ control.historia?.medico?.nombres }} {{ control.historia?.medico?.apellidos }}</td>
                  <td class="py-4 text-center">
                    <button (click)="verDetallesControl(control)" class="p-2 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" title="Ver detalles">
                      <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                    <button (click)="eliminarControl(control.id)" class="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" title="Eliminar registro">
                      <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </td>
                </tr>`;

content = content.replace(regex, fixed);
fs.writeFileSync('src/app/modules/pediatria/pages/dashboard-nino/dashboard-nino.component.html', content);
console.log('Fixed!');
