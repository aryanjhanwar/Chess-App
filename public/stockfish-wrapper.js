// Stockfish Worker Wrapper
// This wrapper loads Stockfish from CDN and forwards messages

self.importScripts('https://cdn.jsdelivr.net/npm/stockfish@17.1.0/src/stockfish-17.1-asm-341ff22.js');

// The importScripts above will define the Stockfish engine
// Just forward all messages to/from the engine
