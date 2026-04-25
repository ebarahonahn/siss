const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, 'prisma', 'schema.prisma');
const content = fs.readFileSync(schemaPath, 'utf8');

const lines = content.split('\n');
let currentTable = null;
let currentComment = [];
let sql = [];

lines.forEach(line => {
    const trimmed = line.trim();
    
    // Detect comments
    if (trimmed.startsWith('///')) {
        currentComment.push(trimmed.replace('///', '').trim());
        return;
    }

    // Detect model (Table)
    const modelMatch = trimmed.match(/^model\s+(\w+)\s+{/);
    if (modelMatch) {
        const prismaModel = modelMatch[1];
        // Look ahead for @@map
        let tableName = prismaModel;
        const startIdx = lines.indexOf(line);
        for (let i = startIdx; i < lines.length; i++) {
            if (lines[i].includes('}')) break;
            const mapMatch = lines[i].match(/@@map\("(\w+)"\)/);
            if (mapMatch) {
                tableName = mapMatch[1];
                break;
            }
        }
        
        currentTable = tableName;
        if (currentComment.length > 0) {
            sql.push(`ALTER TABLE \`${tableName}\` COMMENT = '${currentComment.join(' ').replace(/'/g, "''")}';`);
            currentComment = [];
        }
        return;
    }

    // Detect fields (Columns)
    if (currentTable && trimmed && !trimmed.startsWith('@@') && !trimmed.startsWith('}') && !trimmed.startsWith('//')) {
        const fieldMatch = trimmed.match(/^(\w+)\s+([\w\?\[\]\(\)\.]+)/);
        if (fieldMatch && currentComment.length > 0) {
            const fieldName = fieldMatch[1];
            const fieldType = fieldMatch[2];
            
            // Note: In MySQL we need to know the full column definition to use MODIFY ... COMMENT
            // Since we don't have the full DB state here, it's better to just output the mapping
            // However, MySQL allows adding comments to columns.
            // Actually, for columns, we'll provide the list for the user to see or 
            // try to generate a safe "MODIFY" if we can guess the type from Prisma.
            
            // For now, let's just generate the Table comments which is very safe.
            // Column comments are more complex because ALTER TABLE MODIFY requires the type.
            sql.push(`-- Columna: ${currentTable}.${fieldName} -> ${currentComment.join(' ')}`);
        }
        currentComment = [];
    }

    if (trimmed === '}') {
        currentTable = null;
        currentComment = [];
    }
});

fs.writeFileSync('apply_comments.sql', sql.join('\n'));
console.log('Script SQL generado en apply_comments.sql');
