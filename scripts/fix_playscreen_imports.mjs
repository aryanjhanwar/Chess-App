import fs from 'fs';

const playPath = 'src/screens/PlayScreen.jsx';
let code = fs.readFileSync(playPath, 'utf-8');

// The imports that need fixing start with ./hooks, ./components, ./features, ./constants, ./state
const importsToFix = ['hooks', 'components', 'features', 'constants', 'state'];

importsToFix.forEach(dir => {
    const regex = new RegExp(`from (['"])\\./${dir}/`, 'g');
    code = code.replace(regex, `from $1../${dir}/`);
});

fs.writeFileSync(playPath, code);
console.log('PlayScreen.jsx relative imports fixed!');
