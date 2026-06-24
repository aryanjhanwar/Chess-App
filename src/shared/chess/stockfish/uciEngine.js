import {
  parseUciInfoLine,
  upsertMultiPvCandidate,
  finalizeMultiPv,
  normalizeAnalysisResult,
} from '@/utils/analysisProtocol.js';
import { getLichessEval, getLichessEvalForEngine } from '../analysis/lichess.js';
import { getResultProperty, parseEvaluationResults } from './helpers/parseResults.js';
import { computeAccuracy } from '../analysis/accuracy.js';
import { getIsStalemate, getWhoIsCheckmated } from '../analysis/chess.js';
import { getMovesClassification } from '../analysis/moveClassification.js';
import { computeEstimatedElo } from '../analysis/estimateElo.js';
import { Stockfish11 } from './stockfish11.js';
import { Stockfish16 } from './stockfish16.js';
import { Stockfish16_1 } from './stockfish16_1.js';
import { Stockfish17 } from './stockfish17.js';
import { Stockfish17_1 } from './stockfish17_1.js';
import { Stockfish18 } from './stockfish18.js';
import { isEngineSupported } from './shared.js';
import {
  getEngineWorker,
  getRecommendedWorkersNb,
  sendCommandsToWorker,
} from './worker.js';

const DEFAULT_STATE = {
  isEngineReady: false,
  isThinking: false,
  evaluation: null,
  bestMove: null,
  depth: 0,
  activeEnginePath: '',
};

export class UciEngine {
  constructor({ engineProfile = 'auto', onStateChange } = {}) {
    this.engineProfile = engineProfile;
    this.name = engineProfile;
    this.onStateChange = onStateChange;

    this.enginePath = '';
    this.customSetupCommands = [];
    this.workers = [];
    this.workerQueue = [];
    this.isReady = false;

    this.currentMultiPv = 1;
    this.searchEpoch = 0;
    this.currentFen = '';

    this.state = { ...DEFAULT_STATE };
  }

  getState() {
    return { ...this.state };
  }

  setState(patch) {
    this.state = { ...this.state, ...patch };
    this.onStateChange?.(this.getState());
  }

  getRecommendedThreads() {
    const cores = typeof navigator !== 'undefined' && navigator.hardwareConcurrency
      ? navigator.hardwareConcurrency
      : 2;
    return Math.max(1, Math.min(8, cores - 1));
  }

  getRecommendedHashMb() {
    const memoryGb = typeof navigator !== 'undefined' && typeof navigator.deviceMemory === 'number'
      ? navigator.deviceMemory
      : 4;

    if (memoryGb <= 2) return 16;
    if (memoryGb <= 4) return 32;
    return 64;
  }

  getSearchTimeoutMs(depthValue, moveTimeMs, bufferMs) {
    const depthBudget = Math.max(3000, Number(depthValue || 0) * 900);
    const moveBudget = Math.max(3000, Number(moveTimeMs || 0));
    return Math.max(depthBudget, moveBudget) + bufferMs;
  }

  resolveEngineProfile(profile = this.engineProfile) {
    const map = {
      auto: {
        candidates: [
          ...Stockfish18.getCandidates(true),
          ...Stockfish18.getCandidates(false),
          ...Stockfish17_1.getCandidates(true),
          ...Stockfish17_1.getCandidates(false),
          ...Stockfish17.getCandidates(true),
          ...Stockfish17.getCandidates(false),
          ...Stockfish16_1.getCandidates(true),
          ...Stockfish16_1.getCandidates(false),
          ...Stockfish16.getCandidates(),
          ...Stockfish11.getCandidates(),
        ],
        setup: [],
      },
      'stockfish-18-lite': { candidates: Stockfish18.getCandidates(true), setup: [] },
      'stockfish-18': { candidates: Stockfish18.getCandidates(false), setup: [] },
      'stockfish-17_1-lite': { candidates: Stockfish17_1.getCandidates(true), setup: [] },
      'stockfish-17_1': { candidates: Stockfish17_1.getCandidates(false), setup: [] },
      'stockfish-17-lite': { candidates: Stockfish17.getCandidates(true), setup: [] },
      'stockfish-17': { candidates: Stockfish17.getCandidates(false), setup: [] },
      'stockfish-16_1-lite': { candidates: Stockfish16_1.getCandidates(true), setup: [] },
      'stockfish-16_1': { candidates: Stockfish16_1.getCandidates(false), setup: [] },
      'stockfish-16-nnue': { candidates: Stockfish16.getCandidates(), setup: Stockfish16.getInitCommands(true) },
      'stockfish-16': { candidates: Stockfish16.getCandidates(), setup: Stockfish16.getInitCommands(false) },
      'stockfish-11': { candidates: Stockfish11.getCandidates(), setup: [] },
    };

    const selected = map[profile] || map.auto;
    return {
      candidates: [...new Set(selected.candidates)],
      setup: selected.setup,
    };
  }

  async setMultiPv(value) {
    const normalized = Math.max(1, Math.min(6, Number(value || 1)));
    if (this.currentMultiPv === normalized) return true;

    await this.sendCommandsToEachWorker(
      [`setoption name MultiPV value ${normalized}`, 'isready'],
      'readyok'
    );

    this.currentMultiPv = normalized;
    const patch = {};
    if (this.state.activeEnginePath && !this.state.isEngineReady) {
      patch.isEngineReady = true;
    }
    if (Object.keys(patch).length) {
      this.setState(patch);
    }

    return true;
  }

  acquireWorker() {
    for (const worker of this.workers) {
      if (!worker.isReady) continue;
      worker.isReady = false;
      return worker;
    }

    return undefined;
  }

  async releaseWorker(worker) {
    const nextJob = this.workerQueue.shift();
    if (!nextJob) {
      worker.isReady = true;
      return;
    }

    try {
      const res = await sendCommandsToWorker(
        worker,
        nextJob.commands,
        nextJob.finalMessage,
        nextJob.onNewMessage
      );
      this.releaseWorker(worker);
      nextJob.resolve(res);
    } catch (error) {
      this.releaseWorker(worker);
      nextJob.reject(error);
    }
  }

  async sendCommands(commands, finalMessage, onNewMessage) {
    const worker = this.acquireWorker();
    if (!worker) {
      return new Promise((resolve, reject) => {
        this.workerQueue.push({
          commands,
          finalMessage,
          onNewMessage,
          resolve,
          reject,
        });
      });
    }

    const res = await sendCommandsToWorker(
      worker,
      commands,
      finalMessage,
      onNewMessage
    );
    this.releaseWorker(worker);
    return res;
  }

  async sendCommandsToEachWorker(commands, finalMessage, onNewMessage) {
    await Promise.all(
      this.workers.map(async (worker) => {
        await sendCommandsToWorker(worker, commands, finalMessage, onNewMessage);
        this.releaseWorker(worker);
      })
    );
  }

  async addNewWorker() {
    const worker = getEngineWorker(this.enginePath);

    await sendCommandsToWorker(worker, ['uci'], 'uciok');

    const hashMb = this.getRecommendedHashMb();
    const setupCommands = [
      'setoption name UCI_Variant value chess',
      `setoption name Hash value ${hashMb}`,
      `setoption name MultiPV value ${this.currentMultiPv}`,
    ];

    if (!this.enginePath.includes('-single.js')) {
      setupCommands.push(`setoption name Threads value ${this.getRecommendedThreads()}`);
    }

    await sendCommandsToWorker(worker, [...setupCommands, 'isready'], 'readyok');

    if (this.customSetupCommands.length) {
      await sendCommandsToWorker(
        worker,
        [...this.customSetupCommands, 'isready'],
        'readyok'
      );
    }

    await sendCommandsToWorker(worker, ['ucinewgame', 'isready'], 'readyok');

    this.workers.push(worker);
    this.releaseWorker(worker);
  }

  async setWorkersNb(workersNb) {
    if (workersNb === this.workers.length) return;
    if (workersNb < 1) {
      throw new Error(`Number of workers must be greater than 0, got ${workersNb} instead`);
    }

    if (workersNb < this.workers.length) {
      const workersToRemove = this.workers.slice(workersNb);
      this.workers = this.workers.slice(0, workersNb);

      for (const worker of workersToRemove) {
        this.terminateWorker(worker);
      }
      return;
    }

    const workersNbToCreate = workersNb - this.workers.length;
    await Promise.all(
      new Array(workersNbToCreate).fill(0).map(() => this.addNewWorker())
    );
  }

  terminateWorker(worker) {
    worker.isReady = false;
    worker.uci('quit');
    worker.terminate();
  }

  normalizeScoreForFen(score, fen) {
    if (!score) return score;
    if (typeof fen !== 'string') return score;

    const sideToMove = fen.split(' ')[1];
    if (sideToMove !== 'b') return score;

    return {
      ...score,
      value: typeof score.value === 'number' ? -score.value : score.value,
    };
  }

  parseAnalysisMessages(messages, fen) {
    const multipvCandidates = {};
    let bestMove = null;
    let lastScore = null;
    let lastDepth = 0;
    let lastNodes = null;
    let lastNps = null;
    let lastTimeMs = null;

    for (const line of messages) {
      if (!line || typeof line !== 'string') continue;

      if (line.startsWith('bestmove')) {
        const move = line.split(' ')[1];
        bestMove = move === '(none)' ? null : move;
        continue;
      }

      if (!line.startsWith('info') || !line.includes('score')) continue;
      const parsedInfo = parseUciInfoLine(line);
      if (!parsedInfo) continue;

      if (parsedInfo.depth != null) {
        lastDepth = parsedInfo.depth;
      }

      if (parsedInfo.nodes != null) {
        lastNodes = parsedInfo.nodes;
      }

      if (parsedInfo.nps != null) {
        lastNps = parsedInfo.nps;
      }

      if (parsedInfo.timeMs != null) {
        lastTimeMs = parsedInfo.timeMs;
      }

      if (parsedInfo.score) {
        const normalizedScore = this.normalizeScoreForFen(parsedInfo.score, fen);
        lastScore = normalizedScore;
        upsertMultiPvCandidate(multipvCandidates, {
          ...parsedInfo,
          score: normalizedScore,
        });
      }
    }

    return normalizeAnalysisResult({
      bestMove,
      evaluation: lastScore,
      depth: lastDepth,
      nodes: lastNodes,
      nps: lastNps,
      timeMs: lastTimeMs,
      multipv: finalizeMultiPv(multipvCandidates),
    });
  }

  applyProgressFromMessages(messages, epoch, fen) {
    if (epoch !== this.searchEpoch) return;

    for (let idx = messages.length - 1; idx >= 0; idx--) {
      const line = messages[idx];
      if (!line || typeof line !== 'string') continue;
      if (!line.startsWith('info') || !line.includes('score')) continue;

      const parsedInfo = parseUciInfoLine(line);
      if (!parsedInfo) continue;

      const patch = {};
      if (parsedInfo.depth != null) {
        patch.depth = parsedInfo.depth;
      }
      if (parsedInfo.score) {
        patch.evaluation = this.normalizeScoreForFen(parsedInfo.score, fen);
      }
      if (Object.keys(patch).length) {
        this.setState(patch);
      }
      break;
    }
  }

  async stopAllCurrentJobs() {
    const jobs = this.workerQueue;
    this.workerQueue = [];
    for (const job of jobs) {
      job.reject?.(new Error('Job cancelled'));
    }

    if (!this.workers.length) return;

    await this.sendCommandsToEachWorker(['stop', 'isready'], 'readyok');

    for (const worker of this.workers) {
      worker.isReady = true;
    }
  }

  async init() {
    this.destroy();

    if (!isEngineSupported(this.engineProfile)) {
      throw new Error(`Engine profile is not supported on this device: ${this.engineProfile}`);
    }

    this.setState({ ...DEFAULT_STATE });
    this.currentMultiPv = 1;

    const { candidates, setup } = this.resolveEngineProfile(this.engineProfile);
    this.customSetupCommands = setup;

    let selected = null;
    let lastError = null;
    for (const candidate of candidates) {
      this.enginePath = candidate;
      try {
        await this.addNewWorker();
        selected = candidate;
        break;
      } catch (error) {
        lastError = error;
        this.workers = [];
      }
    }

    if (!selected) {
      throw lastError || new Error('No compatible Stockfish worker asset found');
    }

    this.enginePath = selected;
    this.setState({
      activeEnginePath: selected,
      isEngineReady: true,
    });

    this.isReady = true;

    const targetWorkers = Math.max(1, Math.min(4, getRecommendedWorkersNb()));
    await this.setWorkersNb(targetWorkers);
  }

  throwErrorIfNotReady() {
    if (!this.isReady || !this.workers.length) {
      throw new Error(`${this.name || 'Engine'} is not ready`);
    }
  }

  getIsReady() {
    return this.isReady;
  }

  shutdown() {
    this.destroy();
  }

  async tryCloudEval(fen, depth, multiPv) {
    try {
      const cloud = await getLichessEvalForEngine(fen, multiPv);
      if (!cloud) return null;

      if (cloud.depth < depth) {
        return null;
      }

      return cloud;
    } catch {
      return null;
    }
  }

  async evaluateWithEngine(fen, depth, onNewMessage) {
    const messages = await this.sendCommands(
      [`position fen ${fen}`, `go depth ${depth}`],
      'bestmove',
      onNewMessage
    );

    return this.parseAnalysisMessages(messages, fen);
  }

  async setPosition(fen) {
    if (!this.state.isEngineReady) return false;

    await this.stopAllCurrentJobs();
    this.currentFen = fen;
    await this.sendCommands([`position fen ${fen}`, 'isready'], 'readyok');
    return true;
  }

  async getBestMove(depth = 10, moveTime = 1000) {
    this.throwErrorIfNotReady();

    const epoch = ++this.searchEpoch;
    this.setState({ isThinking: true });

    try {
      await this.stopAllCurrentJobs();
      await this.setMultiPv(1);

      const timeoutMs = this.getSearchTimeoutMs(depth, moveTime, 5000);
      const messages = await Promise.race([
        this.sendCommands([`go depth ${depth}`], 'bestmove'),
        new Promise((resolve) =>
          setTimeout(() => resolve([]), timeoutMs)
        ),
      ]);

      const result = this.parseAnalysisMessages(messages, this.currentFen || '');
      if (epoch !== this.searchEpoch) return null;

      this.setState({
        bestMove: result?.bestMove || null,
        isThinking: false,
      });

      return result?.bestMove || null;
    } catch {
      if (epoch === this.searchEpoch) {
        this.setState({ isThinking: false });
      }
      return null;
    }
  }

  async evaluatePosition(fen, depth = 12) {
    if (!this.state.isEngineReady) return;
    this.currentFen = fen;

    const epoch = ++this.searchEpoch;
    this.setState({ isThinking: true });

    try {
      await this.stopAllCurrentJobs();
      await this.setMultiPv(1);

      const cloud = await this.tryCloudEval(fen, depth, 1);
      if (cloud && epoch === this.searchEpoch) {
        this.setState({
          isThinking: false,
          evaluation: cloud.evaluation || null,
          depth: cloud.depth || 0,
          bestMove: cloud.bestMove || null,
        });
        return;
      }

      const result = await this.evaluateWithEngine(fen, depth, (messages) => {
        this.applyProgressFromMessages(messages, epoch, fen);
      });

      if (epoch !== this.searchEpoch) return;

      this.setState({
        isThinking: false,
        evaluation: result?.evaluation || null,
        depth: result?.depth || 0,
        bestMove: result?.bestMove || null,
      });
    } catch {
      if (epoch === this.searchEpoch) {
        this.setState({ isThinking: false });
      }
    }
  }

  async analyzePosition(fen, depth = 14, moveTime = 800, options = {}) {
    this.throwErrorIfNotReady();
    this.currentFen = fen;

    const epoch = ++this.searchEpoch;
    const multipv = Math.max(1, Number(options?.multipv || 1));

    this.setState({ isThinking: true });

    try {
      await this.stopAllCurrentJobs();
      await this.setMultiPv(multipv);

      // For single-worker path, cloud eval can avoid local compute.
      if (this.workers.length < 2) {
        const cloud = await this.tryCloudEval(fen, depth, multipv);
        if (cloud && epoch === this.searchEpoch) {
          this.setState({
            isThinking: false,
            evaluation: cloud.evaluation || null,
            depth: cloud.depth || 0,
            bestMove: cloud.bestMove || null,
          });
          return cloud;
        }
      }

      const timeoutMs = this.getSearchTimeoutMs(depth, moveTime, 7000);
      const messages = await Promise.race([
        this.sendCommands(
          [`position fen ${fen}`, `go depth ${depth}`],
          'bestmove',
          (progressMessages) => {
            this.applyProgressFromMessages(progressMessages, epoch, fen);
          }
        ),
        new Promise((resolve) => setTimeout(() => resolve([]), timeoutMs)),
      ]);

      const result = this.parseAnalysisMessages(messages, fen);

      if (epoch !== this.searchEpoch) return null;

      this.setState({
        isThinking: false,
        evaluation: result?.evaluation || null,
        depth: result?.depth || 0,
        bestMove: result?.bestMove || null,
      });

      return result;
    } catch {
      if (epoch === this.searchEpoch) {
        this.setState({ isThinking: false });
      }
      return null;
    }
  }

  setSkillLevel(level) {
    if (!this.state.isEngineReady) return;
    const skillLevel = Math.max(0, Math.min(20, Number(level || 0)));
    this.sendCommandsToEachWorker(
      [`setoption name Skill Level value ${skillLevel}`, 'isready'],
      'readyok'
    );
  }

  setSearchDepth() {
    return;
  }

  async stopAnalysis() {
    this.searchEpoch += 1;
    this.setState({ isThinking: false });
    await this.stopAllCurrentJobs();
  }

  async newGame() {
    await this.stopAnalysis();
    if (!this.workers.length) return;
    await this.sendCommandsToEachWorker(['ucinewgame', 'isready'], 'readyok');
    this.currentMultiPv = 1;
  }

  destroy() {
    this.searchEpoch += 1;
    this.isReady = false;
    this.workerQueue = [];

    for (const worker of this.workers) {
      this.terminateWorker(worker);
    }
    this.workers = [];

    this.enginePath = '';
    this.customSetupCommands = [];
    this.currentMultiPv = 1;
    this.currentFen = '';

    this.setState({ ...DEFAULT_STATE });
  }

  async setElo(elo) {
    if (elo === this.elo) return;
    if (elo < 1320 || elo > 3190) {
      throw new Error(`Invalid Elo value : ${elo}`);
    }
    await this.sendCommandsToEachWorker(
      ["setoption name UCI_LimitStrength value true", "isready"],
      "readyok"
    );
    await this.sendCommandsToEachWorker(
      [`setoption name UCI_Elo value ${elo}`, "isready"],
      "readyok"
    );
    this.elo = elo;
  }

  async evaluateGame({
    fens,
    uciMoves,
    depth = 16,
    multiPv = this.currentMultiPv,
    setEvaluationProgress,
    playersRatings,
    workersNb = 1
  }) {
    this.throwErrorIfNotReady();
    this.isReady = false;
    setEvaluationProgress?.(1);
    await this.setMultiPv(multiPv);
    await this.sendCommandsToEachWorker(["ucinewgame", "isready"], "readyok");
    await this.setWorkersNb(workersNb);
    const positions = new Array(fens.length);
    let completed = 0;
    const updateEval = (index, positionEval) => {
      completed++;
      positions[index] = positionEval;
      const progress = completed / fens.length;
      setEvaluationProgress?.(99 - Math.exp(-4 * progress) * 99);
    };
    await Promise.all(
      fens.map(async (fen, i) => {
        const whoIsCheckmated = getWhoIsCheckmated(fen);
        if (whoIsCheckmated) {
          updateEval(i, {
            lines: [
              {
                pv: [],
                depth: 0,
                multiPv: 1,
                mate: whoIsCheckmated === "w" ? -1 : 1
              }
            ]
          });
          return;
        }
        const isStalemate = getIsStalemate(fen);
        if (isStalemate) {
          updateEval(i, {
            lines: [
              {
                pv: [],
                depth: 0,
                multiPv: 1,
                cp: 0
              }
            ]
          });
          return;
        }
        const result = await this.evaluatePositionDirect(fen, depth, workersNb);
        updateEval(i, result);
      })
    );
    await this.setWorkersNb(1);
    this.isReady = true;
    const positionsWithClassification = getMovesClassification(
      positions,
      uciMoves,
      fens
    );
    const accuracy = computeAccuracy(positions);
    const estimatedElo = computeEstimatedElo(
      positions,
      playersRatings?.white,
      playersRatings?.black
    );
    return {
      positions: positionsWithClassification,
      estimatedElo,
      accuracy,
      settings: {
        engine: this.engineProfile || "Stockfish",
        date: new Date().toISOString(),
        depth,
        multiPv
      }
    };
  }

  async evaluatePositionDirect(fen, depth = 16, workersNb) {
    if (workersNb < 2) {
      const lichessEval = await getLichessEval(fen, this.currentMultiPv);
      if (lichessEval && lichessEval.lines && lichessEval.lines.length >= this.currentMultiPv && lichessEval.lines[0].depth >= depth) {
        return lichessEval;
      }
    }
    const results = await this.sendCommands(
      [`position fen ${fen}`, `go depth ${depth}`],
      "bestmove"
    );
    return parseEvaluationResults(results, fen);
  }

  async evaluatePositionWithUpdate({
    fen,
    depth = 16,
    multiPv = this.currentMultiPv,
    setPartialEval
  }) {
    this.throwErrorIfNotReady();
    const lichessEvalPromise = getLichessEval(fen, multiPv);
    await this.stopAllCurrentJobs();
    await this.setMultiPv(multiPv);

    let localEngineActive = true;

    const onNewMessage = (messages) => {
      if (!localEngineActive || !setPartialEval) return;
      const parsedResults = parseEvaluationResults(messages, fen);
      setPartialEval(parsedResults);
    };

    // Start local engine evaluation immediately
    const localEnginePromise = (async () => {
      try {
        const results = await this.sendCommands(
          [`position fen ${fen}`, `go depth ${depth}`],
          "bestmove",
          onNewMessage
        );
        localEngineActive = false;
        return parseEvaluationResults(results, fen);
      } catch (error) {
        localEngineActive = false;
        throw error;
      }
    })();

    // Await Lichess Cloud Eval concurrently
    try {
      const lichessEval = await lichessEvalPromise;
      if (
        lichessEval &&
        lichessEval.lines &&
        lichessEval.lines.length >= multiPv &&
        lichessEval.lines[0].depth >= depth
      ) {
        localEngineActive = false;
        await this.stopAllCurrentJobs();
        setPartialEval?.(lichessEval);
        return lichessEval;
      }
    } catch {
      // Ignore Lichess failures and let local engine complete
    }

    return await localEnginePromise;
  }

  async getEngineNextMove(fen, elo, depth = 16) {
    this.throwErrorIfNotReady();
    await this.stopAllCurrentJobs();
    await this.setElo(elo);
    const results = await this.sendCommands(
      [`position fen ${fen}`, `go depth ${depth}`],
      "bestmove"
    );
    const moveResult = results.find((result) => result.startsWith("bestmove"));
    const move = getResultProperty(moveResult ?? "", "bestmove");
    if (!move) {
      throw new Error("No move found");
    }
    return move === "(none)" ? void 0 : move;
  }
}
