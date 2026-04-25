const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

// Cargar variables de entorno
dotenv.config();

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
    console.error('DATABASE_URL no encontrada en .env');
    process.exit(1);
}

// Parsear DATABASE_URL (mysql://user:pass@host:port/db)
const regex = /mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/;
const match = dbUrl.match(regex);

if (!match) {
    console.error('Formato de DATABASE_URL no soportado para este script');
    process.exit(1);
}

const config = {
    user: match[1],
    password: match[2],
    host: match[3],
    port: match[4],
    database: match[5]
};

async function generateColumnComments() {
    let connection;
    try {
        connection = await mysql.createConnection(config);
        console.log('Conectado a MySQL...');

        const schemaPath = path.join(__dirname, 'prisma', 'schema.prisma');
        const content = fs.readFileSync(schemaPath, 'utf8');

        const lines = content.split('\n');
        let currentTable = null;
        let currentComment = [];
        const prismaComments = {}; // { table: { col: comment } }

        // 1. Extraer comentarios del schema.prisma
        lines.forEach(line => {
            const trimmed = line.trim();
            if (trimmed.startsWith('///')) {
                currentComment.push(trimmed.replace('///', '').trim());
                return;
            }

            const modelMatch = trimmed.match(/^model\s+(\w+)\s+{/);
            if (modelMatch) {
                const prismaModel = modelMatch[1];
                let tableName = prismaModel;
                const startIdx = lines.indexOf(line);
                for (let i = startIdx; i < lines.length; i++) {
                    if (lines[i].includes('}')) break;
                    const mapMatch = lines[i].match(/@@map\("(\w+)"\)/);
                    if (mapMatch) { tableName = mapMatch[1]; break; }
                }
                currentTable = tableName;
                prismaComments[currentTable] = { _table: currentComment.join(' ') };
                currentComment = [];
                return;
            }

            if (currentTable && trimmed && !trimmed.startsWith('@@') && !trimmed.startsWith('}') && !trimmed.startsWith('//')) {
                const fieldMatch = trimmed.match(/^(\w+)\s+/);
                if (fieldMatch && currentComment.length > 0) {
                    const fieldName = fieldMatch[1];
                    prismaComments[currentTable][fieldName] = currentComment.join(' ').replace(/'/g, "''");
                }
                currentComment = [];
            }

            if (trimmed === '}') { currentTable = null; currentComment = []; }
        });

        // 2. Obtener definiciones reales de MySQL y generar SQL
        const sqlStatements = [];
        for (const tableName in prismaComments) {
            const [columns] = await connection.query(`SHOW FULL COLUMNS FROM \`${tableName}\``);
            
            for (const col of columns) {
                const fieldName = col.Field;
                const comment = prismaComments[tableName][fieldName];
                
                if (comment) {
                    // Reconstruir definición: TIPO [NULL/NOT NULL] [DEFAULT ...]
                    let definition = col.Type;
                    if (col.Null === 'NO') definition += ' NOT NULL';
                    if (col.Default !== null) {
                        const defValue = (col.Default === 'CURRENT_TIMESTAMP' || col.Default === 'current_timestamp()') ? col.Default : `'${col.Default}'`;
                        definition += ` DEFAULT ${defValue}`;
                    }
                    if (col.Extra.includes('auto_increment')) definition += ' AUTO_INCREMENT';

                    sqlStatements.push(`ALTER TABLE \`${tableName}\` MODIFY COLUMN \`${fieldName}\` ${definition} COMMENT '${comment}';`);
                }
            }
        }

        fs.writeFileSync('apply_column_comments.sql', sqlStatements.join('\n'));
        console.log('Script generado exitosamente: apply_column_comments.sql');

    } catch (err) {
        console.error('Error:', err);
    } finally {
        if (connection) await connection.end();
    }
}

generateColumnComments();
