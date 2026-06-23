import { formatGameToDatabase } from "@/shared/chess/analysis/chess";
import { openDB } from "idb";
import { atom, useAtom } from "jotai";
import { useRouter } from "@analysis/shims/router";
import { useCallback, useEffect, useState } from "react";
const gamesAtom = atom([]);
const fetchGamesAtom = atom(false);
const useGameDatabase = (shouldFetchGames) => {
  const [db, setDb] = useState(null);
  const [games, setGames] = useAtom(gamesAtom);
  const [fetchGames, setFetchGames] = useAtom(fetchGamesAtom);
  const [gameFromUrl, setGameFromUrl] = useState(void 0);
  useEffect(() => {
    if (shouldFetchGames !== void 0) {
      setFetchGames(shouldFetchGames);
    }
  }, [shouldFetchGames, setFetchGames]);
  useEffect(() => {
    const initDatabase = async () => {
      const db2 = await openDB("games", 1, {
        upgrade(db3) {
          db3.createObjectStore("games", { keyPath: "id", autoIncrement: true });
        }
      });
      setDb(db2);
    };
    initDatabase();
  }, []);
  const loadGames = useCallback(async () => {
    if (db && fetchGames) {
      const games2 = await db.getAll("games");
      setGames(games2);
    }
  }, [db, fetchGames, setGames]);
  useEffect(() => {
    loadGames();
  }, [loadGames]);
  const addGame = useCallback(
    async (game) => {
      if (!db) throw new Error("Database not initialized");
      const gameToAdd = formatGameToDatabase(game);
      const gameId2 = await db.add("games", gameToAdd);
      loadGames();
      return gameId2;
    },
    [db, loadGames]
  );
  const setGameEval = useCallback(
    async (gameId2, evaluation) => {
      if (!db) throw new Error("Database not initialized");
      const game = await db.get("games", gameId2);
      if (!game) throw new Error("Game not found");
      await db.put("games", { ...game, eval: evaluation });
      loadGames();
    },
    [db, loadGames]
  );
  const getGame = useCallback(
    async (gameId2) => {
      if (!db) return void 0;
      return db.get("games", gameId2);
    },
    [db]
  );
  const deleteGame = useCallback(
    async (gameId2) => {
      if (!db) throw new Error("Database not initialized");
      await db.delete("games", gameId2);
      loadGames();
    },
    [db, loadGames]
  );
  const router = useRouter();
  const { gameId } = router.query;
  useEffect(() => {
    switch (typeof gameId) {
      case "string":
        getGame(parseInt(gameId)).then((game) => {
          setGameFromUrl(game);
        });
        break;
      default:
        setGameFromUrl(void 0);
    }
  }, [gameId, setGameFromUrl, getGame]);
  const isReady = db !== null;
  return {
    addGame,
    setGameEval,
    getGame,
    deleteGame,
    games,
    isReady,
    gameFromUrl
  };
};
export {
  useGameDatabase
};
