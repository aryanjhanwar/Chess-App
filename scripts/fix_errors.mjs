import fs from 'fs';

// Fix App.jsx backticks
const appPath = 'src/App.jsx';
let appCode = fs.readFileSync(appPath, 'utf-8');
appCode = appCode.replace(/\\`/g, '`');
fs.writeFileSync(appPath, appCode);

// Fix PlayScreen appBackgroundStyle
const playPath = 'src/screens/PlayScreen.jsx';
let playCode = fs.readFileSync(playPath, 'utf-8');
const bgRegex = /const appBackgroundStyle = useMemo\(\(\) => \{[\s\S]*?\}\];/g;
playCode = playCode.replace(bgRegex, '');
fs.writeFileSync(playPath, playCode);

console.log('Fixed syntax errors!');
