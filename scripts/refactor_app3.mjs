import fs from 'fs';

const playPath = 'src/screens/PlayScreen.jsx';
let code = fs.readFileSync(playPath, 'utf-8');

// Update signature
const oldSig = 'export default function PlayScreen({ currentUser }) {';
const newSig = 'export default function PlayScreen({ currentUser, isMultiplayerGame, setIsMultiplayerGame, multiplayerSide, setMultiplayerSide, isMultiplayerStarted, setIsMultiplayerStarted, multiplayerNotice, setMultiplayerNotice, entryMode, setEntryMode, gameMode, setGameMode, p2p, appBackgroundStyle }) {';
code = code.replace(oldSig, newSig);

// Remove specific states
code = code.replace("const [multiplayerNotice, setMultiplayerNotice] = useState('');\n", "");
code = code.replace("const [entryMode, setEntryMode] = useState(null);\n", "");
code = code.replace("const [isMultiplayerGame, setIsMultiplayerGame] = useState(false);\n", "");
code = code.replace("const [multiplayerSide, setMultiplayerSide] = useState('w');\n", "");
code = code.replace("const [isMultiplayerStarted, setIsMultiplayerStarted] = useState(false);\n", "");
code = code.replace("const [gameMode, setGameMode] = useState('human');\n", "");

// Remove p2p hook
code = code.replace("const p2p = useP2PGame();\n", "");

// Remove appBackgroundStyle
const appBgRegex = /const appBackgroundStyle = useMemo\(\(\) => \{[\s\S]*?\}\];/g;
code = code.replace(appBgRegex, "");

// Remove uiSettings
code = code.replace("const uiSettings = useAtomValue(uiSettingsAtom);\n", "");

// Remove navigate and location
code = code.replace("const navigate = useNavigate();\n", "");
code = code.replace("const location = useLocation();\n", "");

fs.writeFileSync(playPath, code);
console.log('PlayScreen.jsx updated with props!');
