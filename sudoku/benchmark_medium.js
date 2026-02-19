#!/usr/bin/env node
/**
 * Medium難易度に最適な「削除マス数」を探索するベンチマークスクリプト
 *
 * 使い方: node benchmark_medium.js
 *
 * 削除マス数 30～60 の各値について複数回パズルを生成し、
 * 論理ソルバーによる難易度判定結果の分布を表示する。
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

// solver.js を読み込み（ブラウザ用クラスをNode環境で使う）
const solverCode = fs.readFileSync(path.join(__dirname, 'solver.js'), 'utf-8');
vm.runInThisContext(solverCode, { filename: 'solver.js' });

// ===== パズル生成ユーティリティ（script.jsから抽出） =====

function shuffleArray(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

function isValid(grid, row, col, num) {
    for (let x = 0; x < 9; x++) {
        if (grid[row][x] === num) return false;
    }
    for (let x = 0; x < 9; x++) {
        if (grid[x][col] === num) return false;
    }
    const br = Math.floor(row / 3) * 3;
    const bc = Math.floor(col / 3) * 3;
    for (let r = br; r < br + 3; r++) {
        for (let c = bc; c < bc + 3; c++) {
            if (grid[r][c] === num) return false;
        }
    }
    return true;
}

function solveSudoku(grid) {
    for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
            if (grid[row][col] === 0) {
                const numbers = shuffleArray([1, 2, 3, 4, 5, 6, 7, 8, 9]);
                for (const num of numbers) {
                    if (isValid(grid, row, col, num)) {
                        grid[row][col] = num;
                        if (solveSudoku(grid)) return true;
                        grid[row][col] = 0;
                    }
                }
                return false;
            }
        }
    }
    return true;
}

function countSolutions(grid, limit = 2) {
    let count = 0;
    function solve(g) {
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (g[row][col] === 0) {
                    for (let num = 1; num <= 9; num++) {
                        if (isValid(g, row, col, num)) {
                            g[row][col] = num;
                            solve(g);
                            if (count >= limit) return;
                            g[row][col] = 0;
                        }
                    }
                    return;
                }
            }
        }
        count++;
    }
    solve(grid);
    return count;
}

// ===== ベンチマーク本体 =====

/**
 * 指定された削除マス数でパズルを1つ生成し、難易度を判定する
 * @param {number} toRemove - 削除するマスの数
 * @returns {string|null} - 難易度文字列 or null（生成失敗）
 */
function generateAndClassify(toRemove) {
    // 完全な解答を作成
    const completeGrid = Array.from({ length: 9 }, () => Array(9).fill(0));
    solveSudoku(completeGrid);

    const puzzleGrid = completeGrid.map(row => [...row]);

    // マスを抜く
    const positions = shuffleArray(
        Array.from({ length: 81 }, (_, i) => [Math.floor(i / 9), i % 9])
    );

    let removed = 0;
    for (const [r, c] of positions) {
        if (removed >= toRemove) break;
        const backup = puzzleGrid[r][c];
        puzzleGrid[r][c] = 0;

        const solutions = countSolutions(puzzleGrid.map(row => [...row]), 2);
        if (solutions !== 1) {
            puzzleGrid[r][c] = backup;
        } else {
            removed++;
        }
    }

    // 論理ソルバーで難易度判定
    const solver = new SudokuLogicalSolver(puzzleGrid);
    const result = solver.solve();

    return result.solved ? result.difficulty : 'unsolved';
}

// ===== 実行 =====

const TRIALS_PER_COUNT = 50;  // 各削除数あたりの試行回数
const MIN_REMOVE = 30;
const MAX_REMOVE = 60;

console.log(`\nMedium難易度 最適削除マス数ベンチマーク`);
console.log(`各削除数 ${TRIALS_PER_COUNT} 回試行\n`);
console.log('削除数 | ヒント | basic  | easy   | medium | hard   | unsolved');
console.log('-------|--------|--------|--------|--------|--------|--------');

const results = [];

for (let removeCount = MIN_REMOVE; removeCount <= MAX_REMOVE; removeCount++) {
    const stats = { basic: 0, easy: 0, medium: 0, hard: 0, unsolved: 0 };

    for (let trial = 0; trial < TRIALS_PER_COUNT; trial++) {
        const difficulty = generateAndClassify(removeCount);
        stats[difficulty] = (stats[difficulty] || 0) + 1;
    }

    const clues = 81 - removeCount;
    const pct = (n) => `${String(n).padStart(3)}(${(n / TRIALS_PER_COUNT * 100).toFixed(0).padStart(3)}%)`;

    console.log(
        `  ${String(removeCount).padStart(2)}   |   ${String(clues).padStart(2)}   | ${pct(stats.basic)} | ${pct(stats.easy)} | ${pct(stats.medium)} | ${pct(stats.hard)} | ${pct(stats.unsolved)}`
    );

    results.push({ removeCount, clues, ...stats });
}

// Medium比率が高い上位5つを表示
console.log('\n--- Medium比率が高い削除数 TOP 5 ---');
results
    .sort((a, b) => b.medium - a.medium)
    .slice(0, 5)
    .forEach((r, i) => {
        console.log(
            `${i + 1}. 削除数=${r.removeCount} (ヒント${r.clues}): Medium ${(r.medium / TRIALS_PER_COUNT * 100).toFixed(1)}%`
        );
    });

console.log('\n完了');
