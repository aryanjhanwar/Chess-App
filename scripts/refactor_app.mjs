import fs from 'fs';

const playScreenPath = 'src/screens/PlayScreen.jsx';
let playCode = fs.readFileSync(playScreenPath, 'utf-8');

// 1. Rename App to PlayScreen and add currentUser prop
playCode = playCode.replace('function App() {', 'export default function PlayScreen({ currentUser }) {');

// 2. Remove the currentUser state and fetch block
const userStateBlockStart = playCode.indexOf('  // ── User State ──────────────────────────────────────────────────');
const squareSelectionStart = playCode.indexOf('  // ── Square selection ─────────────────────────────────────────────');

if (userStateBlockStart !== -1 && squareSelectionStart !== -1) {
    playCode = playCode.slice(0, userStateBlockStart) + playCode.slice(squareSelectionStart);
}

// 3. Remove the entire <Routes> block up to the Play Route element
const returnBlockStart = playCode.indexOf('  return (\n    <>\n      \n      \n      <Routes>');
const playRouteStart = playCode.indexOf('        <Route path="/play" element={');
const playRouteDivStart = playCode.indexOf('    <div\n      className={`h-screen w-screen flex flex-col lg:flex-row overflow-hidden bg-cover bg-center ${');

if (returnBlockStart !== -1 && playRouteDivStart !== -1) {
    playCode = playCode.slice(0, returnBlockStart) + '  return (\n' + playCode.slice(playRouteDivStart);
}

// 4. Remove the closing of the Play Route and the other routes below it
const playRouteEndBlock = playCode.indexOf('      </div>\n        } />\n        \n        {/* Fallback route */}');
const endOfApp = playCode.indexOf('  );\n}\n\nexport default App;');

if (playRouteEndBlock !== -1 && endOfApp !== -1) {
    playCode = playCode.slice(0, playRouteEndBlock) + '      </div>\n  );\n}';
}

fs.writeFileSync(playScreenPath, playCode);
console.log('PlayScreen.jsx transformed successfully.');
