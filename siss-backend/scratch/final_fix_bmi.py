import re

file_path = r'c:\Proy\claude\siss\siss-frontend\src\app\modules\historia-clinica\pages\nueva-consulta\nueva-consulta.component.ts'

with open(file_path, 'r', encoding='utf-8') as f:
    text = f.read()

# Pattern to find the biometry metrics block after my previous partial update
# The previous multi_replace succeeded for the card header and div start:
# <div class="p-6 bg-gray-50 rounded-[2rem] border border-gray-100 col-span-2">
#    <p class="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-4">Biometría</p>
#    <div class="flex justify-between items-end">

pattern = r'(<div class="flex justify-between items-end">).*?(<span class="text-sm font-bold text-gray-700">.*?</div>)'

replacement = r'''\1
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
                        </div>'''

new_text = re.sub(pattern, replacement, text, flags=re.DOTALL)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(new_text)
