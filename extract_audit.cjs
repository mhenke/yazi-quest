const fs = require('fs');
const content = fs.readFileSync('src/constants.tsx', 'utf8');

// Regex to find LEVELS array
// This is a rough parser, not full AST, but sufficient for structured constant file
const levelsMatch = content.match(/export const LEVELS: Level\[\] = \[\s*([\s\S]*?)\];/);

if (!levelsMatch) {
    console.error("Could not find LEVELS array");
    process.exit(1);
}

const levelsBody = levelsMatch[1];

// Split by objects roughly (assuming indentation or commas)
// We'll regex for `id: ...,` and capture the block until the next `id:` or end of object.
// A better way for simple "audit" is to regex for specific fields.

const levels = [];
let currentLevel = null;

const lines = levelsBody.split('\n');
let taskBlock = false;
let currentTask = null;

lines.forEach(line => {
    const idMatch = line.match(/^\s+id: (\d+),/);
    if (idMatch) {
        if (currentLevel) levels.push(currentLevel);
        currentLevel = { id: parseInt(idMatch[1]), tasks: [] };
        return;
    }

    if (!currentLevel) return;

    const titleMatch = line.match(/^\s+title: '(.*)',/);
    if (titleMatch) currentLevel.title = titleMatch[1];

    if (line.includes('tasks: [')) {
        taskBlock = true;
        return;
    }

    if (taskBlock) {
        if (line.trim().startsWith('id:')) {
            const taskIdMatch = line.match(/id: '(.*)',/);
            currentTask = { id: taskIdMatch ? taskIdMatch[1] : 'unknown', description: '' };
        }
        if (line.trim().startsWith('description:')) {
            // Handle multi-line strings or simple strings
            const descMatch = line.match(/description:\s*(['"`])(.*)/);
            if (descMatch && currentTask) {
                let desc = descMatch[2];
                if (desc.endsWith(descMatch[1]) || desc.endsWith(descMatch[1] + ',')) {
                    // Single line
                    currentTask.description = desc.replace(new RegExp(descMatch[1] + ',?$'), '');
                } else {
                    // Multi-line start (simplified for now)
                    currentTask.description = desc;
                }
                currentLevel.tasks.push(currentTask);
            }
        }
        if (line.includes('],')) {
            taskBlock = false;
        }
    }
});
if (currentLevel) levels.push(currentLevel);

console.log(JSON.stringify(levels, null, 2));
