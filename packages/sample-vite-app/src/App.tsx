import { useState, useEffect, useCallback } from "react";

// テトリミノの形状定義
const TETROMINOS = {
  I: [[1, 1, 1, 1]],
  O: [
    [1, 1],
    [1, 1],
  ],
  T: [
    [0, 1, 0],
    [1, 1, 1],
  ],
  S: [
    [0, 1, 1],
    [1, 1, 0],
  ],
  Z: [
    [1, 1, 0],
    [0, 1, 1],
  ],
  J: [
    [1, 0, 0],
    [1, 1, 1],
  ],
  L: [
    [0, 0, 1],
    [1, 1, 1],
  ],
};

const COLORS = {
  I: "bg-cyan-500",
  O: "bg-yellow-500",
  T: "bg-purple-500",
  S: "bg-green-500",
  Z: "bg-red-500",
  J: "bg-blue-500",
  L: "bg-orange-500",
};

type TetrominoType = keyof typeof TETROMINOS;
const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;

function App() {
  const [board, setBoard] = useState<(TetrominoType | null)[][]>(
    Array(BOARD_HEIGHT)
      .fill(null)
      .map(() => Array(BOARD_WIDTH).fill(null))
  );
  const [currentPiece, setCurrentPiece] = useState<{
    shape: number[][];
    type: TetrominoType;
    x: number;
    y: number;
  } | null>(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // ランダムなテトリミノを生成
  const createNewPiece = useCallback(() => {
    const types = Object.keys(TETROMINOS) as TetrominoType[];
    const randomType = types[Math.floor(Math.random() * types.length)];
    return {
      shape: TETROMINOS[randomType],
      type: randomType,
      x: Math.floor(BOARD_WIDTH / 2) - 1,
      y: 0,
    };
  }, []);

  // 衝突判定
  const checkCollision = useCallback(
    (piece: typeof currentPiece, newX: number, newY: number) => {
      if (!piece) return true;

      for (let y = 0; y < piece.shape.length; y++) {
        for (let x = 0; x < piece.shape[y].length; x++) {
          if (piece.shape[y][x]) {
            const boardX = newX + x;
            const boardY = newY + y;

            if (
              boardX < 0 ||
              boardX >= BOARD_WIDTH ||
              boardY >= BOARD_HEIGHT ||
              (boardY >= 0 && board[boardY][boardX])
            ) {
              return true;
            }
          }
        }
      }
      return false;
    },
    [board]
  );

  // ピースをボードに固定
  const mergePieceToBoard = useCallback(() => {
    if (!currentPiece) return;

    const newBoard = board.map((row) => [...row]);
    for (let y = 0; y < currentPiece.shape.length; y++) {
      for (let x = 0; x < currentPiece.shape[y].length; x++) {
        if (currentPiece.shape[y][x]) {
          const boardY = currentPiece.y + y;
          const boardX = currentPiece.x + x;
          if (boardY >= 0) {
            newBoard[boardY][boardX] = currentPiece.type;
          }
        }
      }
    }

    // 完成した行を削除
    let linesCleared = 0;
    const filteredBoard = newBoard.filter((row) => {
      if (row.every((cell) => cell !== null)) {
        linesCleared++;
        return false;
      }
      return true;
    });

    while (filteredBoard.length < BOARD_HEIGHT) {
      filteredBoard.unshift(Array(BOARD_WIDTH).fill(null));
    }

    setBoard(filteredBoard);
    setScore((prev) => prev + linesCleared * 100);

    // 新しいピースを生成
    const newPiece = createNewPiece();
    if (checkCollision(newPiece, newPiece.x, newPiece.y)) {
      setGameOver(true);
    } else {
      setCurrentPiece(newPiece);
    }
  }, [currentPiece, board, createNewPiece, checkCollision]);

  // ピースを移動
  const movePiece = useCallback(
    (dx: number, dy: number) => {
      if (!currentPiece || gameOver || isPaused) return;

      const newX = currentPiece.x + dx;
      const newY = currentPiece.y + dy;

      if (!checkCollision(currentPiece, newX, newY)) {
        setCurrentPiece({ ...currentPiece, x: newX, y: newY });
      } else if (dy > 0) {
        mergePieceToBoard();
      }
    },
    [currentPiece, gameOver, isPaused, checkCollision, mergePieceToBoard]
  );

  // ピースを回転
  const rotatePiece = useCallback(() => {
    if (!currentPiece || gameOver || isPaused) return;

    const rotated = currentPiece.shape[0].map((_, i) =>
      currentPiece.shape.map((row) => row[i]).reverse()
    );

    const rotatedPiece = { ...currentPiece, shape: rotated };
    if (!checkCollision(rotatedPiece, currentPiece.x, currentPiece.y)) {
      setCurrentPiece(rotatedPiece);
    }
  }, [currentPiece, gameOver, isPaused, checkCollision]);

  // キーボード操作
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (gameOver) return;

      switch (e.key) {
        case "ArrowLeft":
          movePiece(-1, 0);
          break;
        case "ArrowRight":
          movePiece(1, 0);
          break;
        case "ArrowDown":
          movePiece(0, 1);
          break;
        case "ArrowUp":
          rotatePiece();
          break;
        case " ":
          e.preventDefault();
          setIsPaused((prev) => !prev);
          break;
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [movePiece, rotatePiece, gameOver]);

  // 自動落下
  useEffect(() => {
    if (gameOver || isPaused) return;

    const interval = setInterval(() => {
      movePiece(0, 1);
    }, 500);

    return () => clearInterval(interval);
  }, [movePiece, gameOver, isPaused]);

  // ゲーム開始
  useEffect(() => {
    if (!currentPiece && !gameOver) {
      setCurrentPiece(createNewPiece());
    }
  }, [currentPiece, gameOver, createNewPiece]);

  // ゲームリセット
  const resetGame = () => {
    setBoard(
      Array(BOARD_HEIGHT)
        .fill(null)
        .map(() => Array(BOARD_WIDTH).fill(null))
    );
    setCurrentPiece(createNewPiece());
    setScore(0);
    setGameOver(false);
    setIsPaused(false);
  };

  // ボード描画用の配列を作成
  const renderBoard = () => {
    const displayBoard = board.map((row) => [...row]);

    if (currentPiece) {
      for (let y = 0; y < currentPiece.shape.length; y++) {
        for (let x = 0; x < currentPiece.shape[y].length; x++) {
          if (currentPiece.shape[y][x]) {
            const boardY = currentPiece.y + y;
            const boardX = currentPiece.x + x;
            if (
              boardY >= 0 &&
              boardY < BOARD_HEIGHT &&
              boardX >= 0 &&
              boardX < BOARD_WIDTH
            ) {
              displayBoard[boardY][boardX] = currentPiece.type;
            }
          }
        }
      }
    }

    return displayBoard;
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-4">テトリス</h1>
        <div className="mb-4 text-white text-xl">スコア: {score}</div>

        <div className="inline-block bg-gray-800 p-4 rounded-lg shadow-2xl">
          <div
            className="grid gap-0.5"
            style={{ gridTemplateColumns: `repeat(${BOARD_WIDTH}, 1.5rem)` }}
          >
            {renderBoard().map((row, y) =>
              row.map((cell, x) => (
                <div
                  key={`${y}-${x}`}
                  className={`w-6 h-6 border border-gray-700 ${
                    cell ? COLORS[cell] : "bg-gray-900"
                  }`}
                />
              ))
            )}
          </div>
        </div>

        <div className="mt-6 space-y-3">
          {gameOver && (
            <div className="text-red-500 text-2xl font-bold mb-4">
              ゲームオーバー!
            </div>
          )}

          <div className="space-x-3">
            {gameOver && (
              <button
                onClick={resetGame}
                className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition"
              >
                再スタート
              </button>
            )}
            {!gameOver && (
              <button
                onClick={() => setIsPaused((prev) => !prev)}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition"
              >
                {isPaused ? "再開" : "一時停止"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
