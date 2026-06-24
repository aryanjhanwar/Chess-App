import fs from 'fs';

const playPath = 'src/screens/PlayScreen.jsx';
let code = fs.readFileSync(playPath, 'utf-8');

const injection = `
  const navigate = useNavigate();
  const location = useLocation();
  const uiSettings = useAtomValue(uiSettingsAtom);
`;

// Insert right after the function signature
const newSig = 'export default function PlayScreen({ currentUser, isMultiplayerGame, setIsMultiplayerGame, multiplayerSide, setMultiplayerSide, isMultiplayerStarted, setIsMultiplayerStarted, multiplayerNotice, setMultiplayerNotice, entryMode, setEntryMode, gameMode, setGameMode, p2p, appBackgroundStyle }) {';

code = code.replace(newSig, newSig + '\\n' + injection);

fs.writeFileSync(playPath, code);
console.log('PlayScreen.jsx re-added navigate and uiSettings!');
