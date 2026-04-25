const fs = require('fs');
const path = 'c:\\Proy\\claude\\siss\\siss-frontend\\src\\app\\modules\\historia-clinica\\pages\\nueva-consulta\\nueva-consulta.component.ts';

const text = fs.readFileSync(path, 'utf8');

const pattern = /(<div class="flex justify-between items-end">)[\s\S]*?(<span class="text-sm font-bold text-gray-700">[\s\S]*?<\/div>)/;

const replacement = `$1
                          <div>
                            <p class="text-xl font-black text-gray-800 tracking-tight">{{ h.peso || '—' }} <span class="text-[10px] text-gray-400 font-bold uppercase">kg</span> &nbsp;·&nbsp; {{ h.talla || '—' }} <span class="text-[10px] text-gray-400 font-bold uppercase">cm</span></p>
                            <p class="text-[9px] text-gray-400 font-bold uppercase mt-1 tracking-widest">Peso y Estatura</p>
                          </div>
                          <div class="text-right">
                            <div class="flex flex-col items-end gap-1.5">
                              <span class="text-2xl font-black text-gray-900 leading-none tracking-tight">{{ imc(h.peso, h.talla) }} <span class="text-[10px] text-gray-400 font-bold uppercase ml-1">IMC</span></span>
                              <span *ngIf="getClasificacionIMC(imc(h.peso, h.talla), h.paciente?.fechaNacimiento) as cl"
                                    [class]="'px-3 py-1 rounded-xl text-[10px] font-black uppercase shadow-sm border border-black/5 whitespace-nowrap ' + cl.textColor + ' ' + cl.bgColor">
                                {{ cl.label }}
                              </span>
                            </div>
                          </div>
                        </div>`;

const newText = text.replace(pattern, replacement);

fs.writeFileSync(path, newText, 'utf8');
console.log('Successfully updated the file.');
