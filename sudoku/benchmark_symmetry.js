const fs = require('fs');
const { performance } = require('perf_hooks');

// solver.js を読み込んでモジュール化するハック
let code = fs.readFileSync('sudoku/solver.js', 'utf8');
code += '\nmodule.exports = SudokuLogicalSolver;';
const m = new module.constructor();
m.paths = module.paths;
m._compile(code, 'solver.js');
const SudokuLogicalSolver = m.exports;

// ベンチマーク用のカスタム生成関数
function generateWithStrategy(difficulty, strategyName) {
    const diffRank = { 'basic': 1, 'easy': 2, 'medium': 3, 'hard': 4, 'unsolvable': 5 };
    const targetRank = diffRank[difficulty] || 3;
    const maxRetries = 100;

    let bestFallback = null;

    for (let attempts = 0; attempts < maxRetries; attempts++) {
        const grid = Array.from({ length: 9 }, () => Array(9).fill(0));
        SudokuLogicalSolver.solveSudoku(grid);

        const solution = grid.map(r => [...r]);
        const puzzle = grid.map(r => [...r]);

        // === ストラテジーに応じたセルのシャッフル ===
        let shuffledCells = [];

        if (strategyName === 'random') {
            const cells = Array.from({ length: 81 }, (_, i) => [Math.floor(i / 9), i % 9]);
            shuffledCells = SudokuLogicalSolver.shuffleArray(cells);
        }
        else if (strategyName === 'point_symmetry') {
            const groups = [];
            for (let r = 0; r < 4; r++) {
                for (let c = 0; c < 9; c++) {
                    groups.push([[r, c], [8 - r, 8 - c]]);
                }
            }
            for (let c = 0; c < 4; c++) {
                groups.push([[4, c], [4, 8 - c]]);
            }
            groups.push([[4, 4]]); // センター

            const shuffledGroups = SudokuLogicalSolver.shuffleArray(groups);
            shuffledGroups.forEach(group => {
                group.forEach(cell => shuffledCells.push(cell));
            });
        }
        else if (strategyName === 'line_symmetry') {
            const groups = [];
            for (let r = 0; r < 9; r++) {
                for (let c = 0; c < 4; c++) {
                    groups.push([[r, c], [r, 8 - c]]);
                }
                groups.push([[r, 4]]); // センターライン
            }

            const shuffledGroups = SudokuLogicalSolver.shuffleArray(groups);
            shuffledGroups.forEach(group => {
                group.forEach(cell => shuffledCells.push(cell));
            });
        }

        // === 削り処理 ===
        for (const [r, c] of shuffledCells) {
            const val = puzzle[r][c];
            puzzle[r][c] = 0;

            if (SudokuLogicalSolver.countSolutions(puzzle.map(row => [...row]), 2) !== 1) {
                puzzle[r][c] = val;
            } else {
                const solver = new SudokuLogicalSolver(puzzle);
                const res = solver.solve();
                const rank = diffRank[res.solved ? res.difficulty : 'unsolvable'] || 5;

                if (rank > targetRank) {
                    puzzle[r][c] = val;
                }
            }
        }

        const finalSolver = new SudokuLogicalSolver(puzzle);
        const finalRes = finalSolver.solve();

        if (finalRes.solved) {
            let hints = 0;
            for (let r = 0; r < 9; r++) {
                for (let c = 0; c < 9; c++) {
                    if (puzzle[r][c] !== 0) hints++;
                }
            }
            bestFallback = { puzzle, solution, difficulty: finalRes.difficulty, technique: finalRes.technique, attempts: attempts + 1, hints };
        }

        if (finalRes.solved && finalRes.difficulty === difficulty) {
            return bestFallback;
        }
    }

    if (bestFallback) return bestFallback;
    return { puzzle: grid, solution: grid, difficulty: 'basic', technique: 'Naked Single', attempts: maxRetries };
}

async function runBenchmark(difficulty) {
    const runs = 10;
    const strategies = ['random', 'point_symmetry', 'line_symmetry'];

    console.log(`\n======================================================`);
    console.log(`=== Benchmark: Generating '${difficulty}' puzzle ===`);
    console.log(`Runs per strategy: ${runs}\n`);

    for (const strategy of strategies) {
        let totalTime = 0;
        let totalAttempts = 0;
        let successCount = 0;
        let totalHints = 0;

        console.log(`-- Strategy: ${strategy} --`);

        for (let i = 1; i <= runs; i++) {
            const start = performance.now();
            const result = generateWithStrategy(difficulty, strategy);
            const end = performance.now();

            const timeMs = end - start;
            totalTime += timeMs;
            totalAttempts += result.attempts;
            totalHints += result.hints;

            const isExactMatch = result.difficulty === difficulty;
            if (isExactMatch) successCount++;

            console.log(`  Run ${i.toString().padStart(2, ' ')}: ${timeMs.toFixed(1)}ms \t| targetHits: ${result.attempts} \t| hints: ${result.hints} \t| Diff: ${result.difficulty}`);
        }

        console.log(`\n  => Average Time: ${(totalTime / runs).toFixed(1)}ms`);
        console.log(`  => Average Hints: ${(totalHints / runs).toFixed(1)}`);
        console.log(`  => Average Attempts: ${(totalAttempts / runs).toFixed(1)}`);
        console.log(`  => Exact Match Rate: ${(successCount / runs * 100).toFixed(0)}%\n`);
    }
}

async function start() {
    await runBenchmark('medium');
    await runBenchmark('hard');
}

start();
