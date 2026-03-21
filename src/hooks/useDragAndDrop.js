import { useState, useRef, useCallback } from 'react';
import { playIllegalSound } from '../utils/sounds';

export function useDragAndDrop({ 
  onSquareClick, 
  validMoves,
  gameState,
  isReviewMode 
}) {
  const [dragState, setDragState] = useState({
    isDragging: false,
    piece: null,
    fromRow: null,
    fromCol: null,
    currentX: 0,
    currentY: 0
  });

  const boardRef = useRef(null);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const potentialDrag = useRef(null);

  const handleMouseDown = useCallback((e, rowIndex, colIndex, piece) => {
    // Prevent dragging if game is not active or in review mode
    if (gameState !== 'playing' || isReviewMode || !piece) return;

    // Get coordinates from mouse or touch event
    const clientX = e.clientX ?? e.touches?.[0]?.clientX;
    const clientY = e.clientY ?? e.touches?.[0]?.clientY;

    if (clientX === undefined || clientY === undefined) return;

    // Store initial position and piece info for potential drag
    dragStartPos.current = { x: clientX, y: clientY };
    potentialDrag.current = {
      piece,
      fromRow: rowIndex,
      fromCol: colIndex
    };
  }, [gameState, isReviewMode]);

  const handleMouseMove = useCallback((e) => {
    // Get coordinates from mouse or touch event
    const clientX = e.clientX ?? e.touches?.[0]?.clientX;
    const clientY = e.clientY ?? e.touches?.[0]?.clientY;

    if (clientX === undefined || clientY === undefined) return;

    // Check if we have a potential drag that hasn't activated yet
    if (potentialDrag.current && !dragState.isDragging) {
      const dx = Math.abs(clientX - dragStartPos.current.x);
      const dy = Math.abs(clientY - dragStartPos.current.y);
      
      // Use lower threshold for touch (2px) vs mouse (5px)
      const threshold = e.touches ? 2 : 5;
      
      // Activate drag mode if moved beyond threshold
      if (dx > threshold || dy > threshold) {
        if (e.preventDefault) e.preventDefault();
        const { piece, fromRow, fromCol } = potentialDrag.current;
        
        setDragState({
          isDragging: true,
          piece,
          fromRow,
          fromCol,
          currentX: clientX,
          currentY: clientY
        });
        
        // Select the square to show valid moves
        onSquareClick(fromRow, fromCol);
      }
      return;
    }

    // Continue dragging if already in drag mode
    if (dragState.isDragging) {
      if (e.preventDefault) e.preventDefault();
      setDragState(prev => ({
        ...prev,
        currentX: clientX,
        currentY: clientY
      }));
    }
  }, [dragState.isDragging, onSquareClick]);

  const handleMouseUp = useCallback((e, toRow, toCol) => {
    // If actually dragging, handle the drop
    if (dragState.isDragging) {
      e.preventDefault();
      e.stopPropagation();

      let targetRow = toRow;
      let targetCol = toCol;

      // For touch events, find the element under the touch point
      if (e.changedTouches && e.changedTouches[0]) {
        const touch = e.changedTouches[0];
        const element = document.elementFromPoint(touch.clientX, touch.clientY);
        
        // Find the square element (it might be the square itself or a child)
        let squareElement = element;
        while (squareElement && !squareElement.hasAttribute('data-row')) {
          squareElement = squareElement.parentElement;
        }
        
        if (squareElement) {
          targetRow = parseInt(squareElement.getAttribute('data-row'));
          targetCol = parseInt(squareElement.getAttribute('data-col'));
        }
      }

      // Validate coordinates (prevent NaN or invalid values)
      if (isNaN(targetRow) || isNaN(targetCol) || targetRow < 0 || targetRow > 7 || targetCol < 0 || targetCol > 7) {
        // Invalid drop position - play illegal sound
        playIllegalSound();
        setDragState({
          isDragging: false,
          piece: null,
          fromRow: null,
          fromCol: null,
          currentX: 0,
          currentY: 0
        });
        potentialDrag.current = null;
        return;
      }

      // Check if drop target is a valid move
      const isValidDrop = validMoves.some(move => move.row === targetRow && move.col === targetCol);

      if (isValidDrop) {
        // Execute the move by clicking the target square
        onSquareClick(targetRow, targetCol);
      } else {
        // Invalid drop - play illegal sound
        playIllegalSound();
      }

      // Reset drag state
      setDragState({
        isDragging: false,
        piece: null,
        fromRow: null,
        fromCol: null,
        currentX: 0,
        currentY: 0
      });
      
      potentialDrag.current = null;
      return;
    }

    // Not dragging - just clear potential drag (let onClick handle it)
    potentialDrag.current = null;
  }, [dragState, validMoves, onSquareClick]);

  const handleMouseUpGlobal = useCallback((e) => {
    if (dragState.isDragging) {
      // For touch, try to find the element under the touch point
      if (e.changedTouches && e.changedTouches[0]) {
        const touch = e.changedTouches[0];
        const element = document.elementFromPoint(touch.clientX, touch.clientY);
        
        // Check if dropped on a board square
        let squareElement = element;
        while (squareElement && !squareElement.hasAttribute('data-row')) {
          squareElement = squareElement.parentElement;
        }
        
        // If we found a square, don't handle it here (let handleMouseUp handle it)
        if (squareElement) {
          return;
        }
      }

      // Dropped outside board - play illegal sound and reset
      playIllegalSound();

      setDragState({
        isDragging: false,
        piece: null,
        fromRow: null,
        fromCol: null,
        currentX: 0,
        currentY: 0
      });
    }

    // Clear potential drag
    potentialDrag.current = null;
  }, [dragState.isDragging]);

  return {
    dragState,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleMouseUpGlobal,
    boardRef
  };
}
