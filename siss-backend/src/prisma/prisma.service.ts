import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient, Prisma } from '@prisma/client';
import { DateUtils } from '../common/utils/date-utils';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private modelFields: Map<string, Set<string>> = new Map();

  constructor() {
    super();
    this.initModelFields();
    
    // Migración de Middlewares a Extensiones para compatibilidad con Prisma 6+
    return this.$extends({
      client: {
        async onModuleInit() {
          await (this as any).$connect();
        },
        async onModuleDestroy() {
          await (this as any).$disconnect();
        }
      },
      query: {
        $allModels: {
          async $allOperations({ model, operation, args, query }) {
            const now = DateUtils.getLiteralNow();
            // Accedemos a modelFields a través de la instancia original (this no es accesible directamente aquí de forma limpia, pero lo pasamos)
            const fields = (this as any).modelFields?.get(model);

            if (fields) {
              // --- Lógica de Timestamps Automáticos ---
              
              // Creación
              if (operation === 'create') {
                if (!args.data) args.data = {};
                const createFields = ['creadoEn', 'creadaEn', 'timestamp', 'fechaRegistro'];
                createFields.forEach(f => {
                  if (fields.has(f) && args.data[f] === undefined) {
                    args.data[f] = now;
                  }
                });
              }

              if (operation === 'createMany') {
                if (args.data && Array.isArray(args.data)) {
                  const createFields = ['creadoEn', 'creadaEn', 'timestamp', 'fechaRegistro'];
                  args.data.forEach((item: any) => {
                    createFields.forEach(f => {
                      if (fields.has(f) && item[f] === undefined) {
                        item[f] = now;
                      }
                    });
                  });
                }
              }

              // Actualización
              if (operation === 'update' || operation === 'updateMany') {
                if (!args.data) args.data = {};
                
                if (fields.has('actualizadoEn') && args.data['actualizadoEn'] === undefined) {
                  args.data['actualizadoEn'] = now;
                }
                if (fields.has('actualizadaEn') && args.data['actualizadaEn'] === undefined) {
                  args.data['actualizadaEn'] = now;
                }
                
                // Campos especiales (solo si se están enviando valores tipo Date recientes)
                if (fields.has('eliminadoEn') && args.data['eliminadoEn'] instanceof Date && args.data['eliminadoEn'].getTime() > Date.now() - 10000) {
                  args.data['eliminadoEn'] = now;
                }
                if (fields.has('ultimoAcceso') && args.data['ultimoAcceso'] instanceof Date && args.data['ultimoAcceso'].getTime() > Date.now() - 10000) {
                  args.data['ultimoAcceso'] = now;
                }
              }
            }

            return query(args);
          }
        }
      }
    }) as any;
  }

  async onModuleInit() {
    // Manejado por la extensión en el constructor (return this.$extends...)
  }

  async onModuleDestroy() {
    // Manejado por la extensión
  }

  private initModelFields() {
    // Extraer metadatos de los modelos para saber qué campos existen en cada uno
    const dmmf = (Prisma as any).dmmf;
    if (dmmf && dmmf.datamodel && dmmf.datamodel.models) {
      for (const model of dmmf.datamodel.models) {
        const fieldSet = new Set<string>(model.fields.map((f: any) => f.name));
        this.modelFields.set(model.name, fieldSet);
      }
    }
  }
}
