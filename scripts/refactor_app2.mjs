import fs from 'fs';

const appPath = 'src/App.jsx';
let appCode = fs.readFileSync(appPath, 'utf-8');

// The state we need to keep in App.jsx
const keepState = `
  const [currentUser, setCurrentUser] = useState(null);
  
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetch('http://localhost:5000/api/auth/me', {
        headers: { 'Authorization': \`Bearer \${token}\` }
      })
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success') {
          setCurrentUser({
            id: data.data._id,
            name: data.data.username,
            email: data.data.email,
            rating: data.data.rating,
            isGuest: false
          });
        } else {
          localStorage.removeItem('token');
        }
      })
      .catch(err => console.error('Auth fetch error:', err));
    }
  }, []);

  const [isMultiplayerGame, setIsMultiplayerGame] = useState(false);
  const [multiplayerSide, setMultiplayerSide] = useState('w');
  const [isMultiplayerStarted, setIsMultiplayerStarted] = useState(false);
  const [multiplayerNotice, setMultiplayerNotice] = useState('');
  const [entryMode, setEntryMode] = useState(null);
  const [gameMode, setGameMode] = useState('human');

  const p2p = useP2PGame();
  
  const uiSettings = useAtomValue(uiSettingsAtom);
  const appBackgroundStyle = useMemo(() => {
    if (uiSettings.backgroundStyle === 'bg-custom-solid') {
      return { background: uiSettings.customBackgroundColor || '#17212c' };
    }
    return BACKGROUND_PRESETS[uiSettings.backgroundStyle]?.style || BACKGROUND_PRESETS['bg-classic'].style;
  }, [uiSettings.backgroundStyle, uiSettings.customBackgroundColor]);

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const isAuthRoute = ['/auth', '/login', '/signup'].includes(location.pathname);
    const isAdminRoute = location.pathname === '/admin';
    
    if (!currentUser && !isAuthRoute && !isAdminRoute) {
      navigate('/auth', { replace: true });
    } else if (currentUser && isAuthRoute) {
      navigate('/menu', { replace: true });
    } else if (location.pathname === '/') {
      navigate(currentUser ? '/menu' : '/auth', { replace: true });
    }
  }, [currentUser, location.pathname, navigate]);

  const startMultiplayerMatch = (side) => {
    setIsMultiplayerGame(true);
    setMultiplayerSide(side);
    setGameMode('human');
    setIsMultiplayerStarted(true);
    setMultiplayerNotice('');
  };
`;

const playRouteElement = `
        <Route path="/play" element={
          <PlayScreen 
            currentUser={currentUser}
            isMultiplayerGame={isMultiplayerGame}
            setIsMultiplayerGame={setIsMultiplayerGame}
            multiplayerSide={multiplayerSide}
            setMultiplayerSide={setMultiplayerSide}
            isMultiplayerStarted={isMultiplayerStarted}
            setIsMultiplayerStarted={setIsMultiplayerStarted}
            multiplayerNotice={multiplayerNotice}
            setMultiplayerNotice={setMultiplayerNotice}
            entryMode={entryMode}
            setEntryMode={setEntryMode}
            gameMode={gameMode}
            setGameMode={setGameMode}
            p2p={p2p}
            appBackgroundStyle={appBackgroundStyle}
          />
        } />
`;

// Extract App components block
const startOfAppBody = appCode.indexOf('function App() {\n');
const endOfAppBody = appCode.indexOf('  return (\n');

const newAppBody = appCode.slice(0, startOfAppBody + 17) + keepState + '\n' + appCode.slice(endOfAppBody);

// Replace Play block
const playStart = newAppBody.indexOf('        <Route path="/play" element={');
const playEnd = newAppBody.indexOf('      </div>\n        } />');

let finalAppCode = newAppBody.slice(0, playStart) + playRouteElement + newAppBody.slice(playEnd + 26);

// Inject PlayScreen import at the top
finalAppCode = 'import PlayScreen from "./screens/PlayScreen";\n' + finalAppCode;

fs.writeFileSync(appPath, finalAppCode);
console.log('App.jsx stripped successfully to around 150 lines.');
