const fs = require('fs');

const fileContent = fs.readFileSync('game.js', 'utf8');
const lines = fileContent.split('\n');

const inputEndIdx = lines.findIndex(l => l.startsWith('function parseMap')) - 1;
const spawnerEndIdx = lines.findIndex(l => l.startsWith('function updateGame'));

const inputContent = lines.slice(0, inputEndIdx).join('\n');
const spawnerContent = lines.slice(inputEndIdx, spawnerEndIdx).join('\n');
const remainingGameContent = lines.slice(spawnerEndIdx).join('\n');

fs.writeFileSync('input.js', inputContent);
fs.writeFileSync('spawner.js', spawnerContent);
fs.writeFileSync('game.js', remainingGameContent);

console.log('Successfully splitted game.js!');
