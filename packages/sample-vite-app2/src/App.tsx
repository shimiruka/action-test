import { useState, useCallback } from "react";

const ROWS = 6;
const COLS = 7;
const WIN_COUNT = 4;

type Player = 1 | 2;
type Cell = Player | null;

function App() {
  const [board, setBoard] = useState<Cell[][]>(
    Array(ROWS)
      .fill(null)
      .map(() => Array(COLS).fill(null))
  );
  const [currentPlayer, setCurrentPlayer] = useState<Player>(1);
  const [winner, setWinner] = useState<Player | null>(null);
  const [winningCells, setWinningCells] = useState<[number, number][]>([]);
  const [isDraw, setIsDraw] = useState(false);

  // 勝利判定
  const checkWinner = useCallback(
    (board: Cell[][], row: number, col: number): boolean => {
      const player = board[row][col];
      if (!player) return false;

      const directions = [
        [0, 1], // 横
        [1, 0], // 縦
        [1, 1], // 斜め右下
        [1, -1], // 斜め左下
      ];

      for (const [dx, dy] of directions) {
        const cells: [number, number][] = [[row, col]];

        // 正方向にチェック
        for (let i = 1; i < WIN_COUNT; i++) {
          const newRow = row + dx * i;
          const newCol = col + dy * i;
          if (
            newRow >= 0 &&
            newRow < ROWS &&
            newCol >= 0 &&
            newCol < COLS &&
            board[newRow][newCol] === player
          ) {
            cells.push([newRow, newCol]);
          } else {
            break;
          }
        }

        // 負方向にチェック
        for (let i = 1; i < WIN_COUNT; i++) {
          const newRow = row - dx * i;
          const newCol = col - dy * i;
          if (
            newRow >= 0 &&
            newRow < ROWS &&
            newCol >= 0 &&
            newCol < COLS &&
            board[newRow][newCol] === player
          ) {
            cells.push([newRow, newCol]);
          } else {
            break;
          }
        }

        if (cells.length >= WIN_COUNT) {
          setWinningCells(cells);
          return true;
        }
      }

      return false;
    },
    []
  );

  // コインを落とす
  const dropCoin = useCallback(
    (col: number) => {
      if (winner || isDraw) return;

      // 最下段から空きセルを探す
      let row = -1;
      for (let r = ROWS - 1; r >= 0; r--) {
        if (!board[r][col]) {
          row = r;
          break;
        }
      }

      if (row === -1) return; // 列が満杯

      const newBoard = board.map((r) => [...r]);
      newBoard[row][col] = currentPlayer;
      setBoard(newBoard);

      // 勝利判定
      if (checkWinner(newBoard, row, col)) {
        setWinner(currentPlayer);
      } else if (newBoard.every((row) => row.every((cell) => cell !== null))) {
        setIsDraw(true);
      } else {
        setCurrentPlayer(currentPlayer === 1 ? 2 : 1);
      }
    },
    [board, currentPlayer, winner, isDraw, checkWinner]
  );

  // ゲームリセット
  const resetGame = () => {
    setBoard(
      Array(ROWS)
        .fill(null)
        .map(() => Array(COLS).fill(null))
    );
    setCurrentPlayer(1);
    setWinner(null);
    setWinningCells([]);
    setIsDraw(false);
  };

  // セルが勝利セルかどうか
  const isWinningCell = (row: number, col: number) => {
    return winningCells.some(([r, c]) => r === row && c === col);
  };

  // 各列でコインを置ける位置(最下段の空きセル)を取得
  const getDropRow = (col: number): number => {
    for (let r = ROWS - 1; r >= 0; r--) {
      if (!board[r][col]) {
        return r;
      }
    }
    return -1; // 列が満杯
  };

  // セルがクリック可能かどうか
  const isClickableCell = (row: number, col: number): boolean => {
    if (winner || isDraw) return false;
    return getDropRow(col) === row;
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-900 via-blue-800 to-purple-900 flex items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-5xl font-bold text-white mb-8">4目並べ</h1>

        {/* ステータス表示 */}
        <div className="mb-6 h-16">
          {winner ? (
            <div className="text-3xl font-bold text-yellow-400 animate-bounce">
              プレイヤー {winner} の勝利! 🎉
            </div>
          ) : isDraw ? (
            <div className="text-3xl font-bold text-gray-300">引き分け!</div>
          ) : (
            <div className="text-2xl font-semibold text-white">
              プレイヤー{" "}
              <span
                className={
                  currentPlayer === 1 ? "text-red-400" : "text-yellow-400"
                }
              >
                {currentPlayer}
              </span>{" "}
              のターン
            </div>
          )}
        </div>

        {/* ゲームボード */}
        <div className="inline-block bg-blue-600 p-6 rounded-2xl shadow-2xl">
          <div
            className="grid gap-2"
            style={{ gridTemplateColumns: `repeat(${COLS}, 4rem)` }}
          >
            {board.map((row, rowIndex) =>
              row.map((cell, colIndex) => {
                const clickable = isClickableCell(rowIndex, colIndex);
                return (
                  <button
                    key={`${rowIndex}-${colIndex}`}
                    onClick={() => clickable && dropCoin(colIndex)}
                    disabled={!clickable}
                    className={`w-16 h-16 rounded-full transition-all duration-200 ${
                      cell === null
                        ? clickable
                          ? "bg-white hover:bg-gray-200 hover:scale-105 cursor-pointer"
                          : "bg-gray-400 cursor-not-allowed"
                        : cell === 1
                        ? "bg-red-500 cursor-not-allowed"
                        : "bg-yellow-400 cursor-not-allowed"
                    } ${
                      isWinningCell(rowIndex, colIndex)
                        ? "ring-4 ring-green-400 animate-pulse"
                        : ""
                    }`}
                  />
                );
              })
            )}
          </div>
        </div>

        {/* コントロールボタン */}
        <div className="mt-8">
          <button
            onClick={resetGame}
            className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white text-lg font-semibold rounded-lg shadow-lg transition-all hover:scale-105"
          >
            新しいゲーム
          </button>
        </div>

        {/* 説明 */}
        <div className="mt-6 text-gray-300 space-y-2">
          <p className="flex items-center justify-center gap-2">
            <span className="inline-block w-4 h-4 bg-red-500 rounded-full"></span>
            プレイヤー1
          </p>
          <p className="flex items-center justify-center gap-2">
            <span className="inline-block w-4 h-4 bg-yellow-400 rounded-full"></span>
            プレイヤー2
          </p>
          <p className="text-sm mt-4">縦・横・斜めに4つ揃えると勝利!</p>
        </div>
      </div>
    </div>
  );
}

export default App;
