import os

path = r'c:\Proy\claude\siss\siss-frontend\src\app\modules\historia-clinica\pages\nueva-consulta\nueva-consulta.component.ts'

with open(path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

output = []
skip = False
for i, line in enumerate(lines):
    # Detect start of the Biometría block in the history modal
    if '<p class="text-[9px] font-bold text-gray-400 uppercase mb-2">Biometría</p>' in line:
        # Start replacing from the div before it
        # The previous line is line i-1: <div class="p-5 bg-gray-50 rounded-3xl border border-gray-100 col-span-2">
        # Let's adjust slightly: go back 1 line
        start_idx = i - 1
        output = output[:start_idx]
        
        output.append('                     <div class="p-6 bg-gray-50 rounded-[2rem] border border-gray-100 col-span-2">\n')
        output.append('                        <p class="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-4">Biometría</p>\n')
        output.append('                        <div class="flex justify-between items-end">\n')
        output.append('                          <div>\n')
        output.append('                            <p class="text-xl font-black text-gray-800 tracking-tight">{{ h.peso || \'—\' }} <span class="text-[10px] text-gray-400 font-bold uppercase">kg</span> &nbsp;·&nbsp; {{ h.talla || \'—\' }} <span class="text-[10px] text-gray-400 font-bold uppercase">cm</span></p>\n')
        output.append('                            <p class="text-[9px] text-gray-400 font-bold uppercase mt-1 tracking-widest">Peso y Estatura</p>\n')
        output.append('                          </div>\n')
        output.append('                          <div class="text-right">\n')
        output.append('                            <div class="flex flex-col items-end gap-1.5">\n')
        output.append('                              <span class="text-2xl font-black text-gray-900 leading-none tracking-tight">{{ imc(h.peso, h.talla) }} <span class="text-[10px] text-gray-400 font-bold uppercase ml-1">IMC</span></span>\n')
        output.append('                              <span *ngIf="getClasificacionIMC(imc(h.peso, h.talla), h.paciente?.fechaNacimiento) as cl"\n')
        output.append('                                    [class]="\'px-3 py-1 rounded-xl text-[10px] font-black uppercase shadow-sm border border-black/5 whitespace-nowrap \' + cl.textColor + \' \' + cl.bgColor">\n')
        output.append('                                {{ cl.label }}\n')
        output.append('                              </span>\n')
        output.append('                            </div>\n')
        output.append('                          </div>\n')
        output.append('                        </div>\n')
        output.append('                     </div>\n')
        
        # Skip until the end of the block (div fin ngFor is too far, look for the closing div of the block)
        # The block was approx 10 lines
        # We need to find the line that currently says "</div>" and corresponds to the block end.
        # Based on my view_file:
        # 1077: div start
        # 1087: div end
        # We skip 11 lines from 1077
        skip_count = 11
        skip = True
        continue
    
    if skip:
        skip_count -= 1
        if skip_count <= 0:
            skip = False
        continue
        
    output.append(line)

with open(path, 'w', encoding='utf-8') as f:
    f.writelines(output)
