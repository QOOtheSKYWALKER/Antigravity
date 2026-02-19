importScripts('solver.js');

let solution = [];

self.onmessage = function (e) {
    const { command, difficulty } = e.data;
    if (command === 'generate') {
        try {
            const puzzle = generatePuzzle(difficulty);
            self.postMessage({
                type: 'success',
                puzzle: puzzle,
                solution: solution,
                difficulty: difficulty
            });
        } catch (err) {
            console.error(err);
            self.postMessage({
                type: 'error',
                message: err.message
            });
        }
    }
};

// ===== Generation Logic V5.0: Reverse Difficulty Check + Symmetry =====

// ===== Generation Logic V6.0: Hybrid (Reverse Check -> Subtractive Fallback) =====

function generatePuzzle(difficulty) {
    const GLOBAL_TIMEOUT = 20000; // Hard timeout
    const REVERSE_LIMIT = 2000; // ms limit for Reverse Method
    const startTime = Date.now();

    // Ranks: Basic=1, Easy=2, Medium=3, Hard=4, Unsolvable=5
    const diffRank = { 'basic': 1, 'easy': 2, 'medium': 3, 'hard': 4, 'unsolvable': 5 };
    const targetRank = diffRank[difficulty] || 3;

    // Phase 1: Try Reverse Difficulty Check (User Proposed)
    // Good for targeting specific difficulty, but slow.
    let solveCalls = 0;
    let uniqueCalls = 0;

    // Adjust start hints based on difficulty to reduce search space
    // Hard needs ~24-30 hints. Medium ~30-36. Easy ~36+.
    let targetStartHints = 22;
    if (difficulty === 'medium') targetStartHints = 28;
    if (difficulty === 'easy') targetStartHints = 32;

    while (Date.now() - startTime < REVERSE_LIMIT) {
        // ... (Existing Reverse Logic with Smart Lookahead) ...
        // Simplified for brevity in this hybrid implemention:

        // 1. Solution
        const grid = Array.from({ length: 9 }, () => Array(9).fill(0));
        solveSudoku(grid);
        solution = grid.map(r => [...r]);

        // 2. Pairs
        const pairs = getSymmetricPairs(); // Helper
        shuffleArray(pairs);

        // 3. Create Start (Subtractive with Cluster Check)
        const puzzle = grid.map(r => [...r]);
        const pairsToKeepCount = Math.floor(targetStartHints / 2);

        const rowCounts = Array(9).fill(0);
        const colCounts = Array(9).fill(0);
        const currentRemoved = [];
        let keptCount = 0;

        for (let i = 0; i < pairs.length; i++) {
            const [r, c] = pairs[i];
            const symR = 8 - r;
            const symC = 8 - c;

            let canKeep = false;
            if (keptCount < pairsToKeepCount) {
                // Aesthetic Check
                if (rowCounts[r] < 5 && rowCounts[symR] < 5 &&
                    colCounts[c] < 5 && colCounts[symC] < 5) {
                    canKeep = true;
                }
            }

            if (canKeep) {
                keptCount++;
                rowCounts[r]++; colCounts[c]++;
                rowCounts[symR]++; colCounts[symC]++;
            } else {
                puzzle[r][c] = 0;
                puzzle[symR][symC] = 0;
                currentRemoved.push([r, c]);
            }
        }

        shuffleArray(currentRemoved);

        // 4. Unveil
        let gaveUp = false;
        while (currentRemoved.length > 0) {
            solveCalls++;
            const solver = new SudokuLogicalSolver(puzzle);
            const res = solver.solve();
            const rank = diffRank[res.solved ? res.difficulty : 'unsolvable'] || 5;

            if (rank === targetRank) {
                uniqueCalls++;
                if (countSolutions(puzzle.map(r => [...r]), 2) === 1) {
                    console.log(`Worker: Success (Reverse)! Found ${difficulty} in ${Date.now() - startTime}ms.`);
                    return puzzle;
                }
                // Not Unique: Add clue
            } else if (rank < targetRank) {
                // Too Easy: Fail seed
                gaveUp = true;
                break;
            }

            // Add clue (Smartest of top 3?)
            // Just take one for speed in this phase
            const [r, c] = currentRemoved.pop();
            const symR = 8 - r;
            const symC = 8 - c;
            puzzle[r][c] = solution[r][c];
            puzzle[symR][symC] = solution[symR][symC];
        }
        if (!gaveUp) {
            // If we ran out of Removed, it's Full Board (Basic).
            if (targetRank === 1) return puzzle;
        }
    }

    console.log("Worker: Reverse timed out. Switching to Subtractive (V4) with Cluster Check.");
    return generateSubtractive(difficulty, startTime, GLOBAL_TIMEOUT);
}

function generateSubtractive(difficulty, startTime, timeout) {
    // V4 Strategy: Start Full, Remove Pairs until Constraint Violation or Unsolvable
    // Added: Cluster Check

    // Ranges
    let minRemoved = 44; let maxRemoved = 54; // Easy
    if (difficulty === 'medium' || difficulty === 'hard') { minRemoved = 50; maxRemoved = 64; }

    while (Date.now() - startTime < timeout) {
        const grid = Array.from({ length: 9 }, () => Array(9).fill(0));
        solveSudoku(grid);
        solution = grid.map(r => [...r]); // Global solution

        const pairs = getSymmetricPairs();
        shuffleArray(pairs);

        const puzzle = grid.map(r => [...r]);
        const removedHistory = [];

        const rowCounts = Array(9).fill(9); // Start full
        const colCounts = Array(9).fill(9);

        for (const [r, c] of pairs) {
            // Check constraints
            // 1. Min hints? (Max Removed)
            if (removedHistory.length * 2 >= maxRemoved) break;

            // 2. Aesthetic Check (Don't remove if it creates cluster? No, Cluster Check is for REMAINING hints)
            // We want remaining hints to be < 5 per row?
            // No, we want NO CLUSTERS of HINTS.
            // A "Cluster" is many HINTS. 
            // So we want to remove hints from rows that have many?
            // So prioritze removing from High-Count rows?
            // Complex. Random is usually best.
            // Let's just Apply normal subtractive.

            const symR = 8 - r;
            const symC = 8 - c;
            const v1 = puzzle[r][c];
            const v2 = puzzle[symR][symC];

            puzzle[r][c] = 0;
            puzzle[symR][symC] = 0;

            // Check Unique
            // To speed up: Only check unique if we removed enough?
            // Or only check if it remains Solvable?
            // V4 strategy: Check Unique.

            if (countSolutions(puzzle.map(r => [...r]), 2) !== 1) {
                // Not Unique. Put back.
                puzzle[r][c] = v1;
                puzzle[symR][symC] = v2;
            } else {
                // Success. Keep removed.
                removedHistory.push([r, c]);
                rowCounts[r]--; rowCounts[symR]--;
                colCounts[c]--; colCounts[symC]--;
            }
        }

        // Final Check
        const removedCount = countEmpty(puzzle);
        if (removedCount >= minRemoved) {
            // Check Difficulty matching?
            const solver = new SudokuLogicalSolver(puzzle);
            const res = solver.solve();
            if (res.difficulty === difficulty || (difficulty === 'hard' && res.difficulty === 'medium')) {
                // Accept "Medium" for "Hard" request if dense enough? 
                // Or just accept.
                console.log(`Worker: Success (Subtractive)! Found ${res.difficulty}. Removed: ${removedCount}`);
                return puzzle;
            }
        }
    }

    // Fallback
    console.warn("Worker: All failed. Returning last candidate.");
    return generateFallback(difficulty);
}


function getSymmetricPairs() {
    const pairs = [];
    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            const idx = r * 9 + c;
            const symIdx = (8 - r) * 9 + (8 - c);
            if (idx <= symIdx) {
                pairs.push([r, c]);
            }
        }
    }
    return pairs;
}

// Low-level helpers (Same as before)
function isValid(grid, row, col, num) {
    for (let x = 0; x < 9; x++) if (grid[row][x] === num) return false;
    for (let x = 0; x < 9; x++) if (grid[x][col] === num) return false;
    const br = Math.floor(row / 3) * 3;
    const bc = Math.floor(col / 3) * 3;
    for (let r = br; r < br + 3; r++) {
        for (let c = bc; c < bc + 3; c++) {
            if (grid[r][c] === num) return false;
        }
    }
    return true;
}

function shuffleArray(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

function findBestCell(grid) {
    let minCandidates = 10;
    let bestCell = null;
    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            if (grid[r][c] === 0) {
                let count = 0;
                for (let n = 1; n <= 9; n++) {
                    if (isValid(grid, r, c, n)) count++;
                }
                if (count === 0) return { r, c, count: 0 };
                if (count < minCandidates) {
                    minCandidates = count;
                    bestCell = { r, c, count };
                    if (count === 1) return bestCell;
                }
            }
        }
    }
    return bestCell;
}

function solveSudoku(grid) {
    const cell = findBestCell(grid);
    if (!cell) return true;
    if (cell.count === 0) return false;
    const { r, c } = cell;
    const numbers = shuffleArray([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    for (const num of numbers) {
        if (isValid(grid, r, c, num)) {
            grid[r][c] = num;
            if (solveSudoku(grid)) return true;
            grid[r][c] = 0;
        }
    }
    return false;
}

function countSolutions(grid, limit = 2) {
    let count = 0;
    function solve(g) {
        const cell = findBestCell(g);
        if (!cell) { count++; return; }
        if (cell.count === 0) return;
        const { r, c } = cell;
        for (let num = 1; num <= 9; num++) {
            if (isValid(g, r, c, num)) {
                g[r][c] = num;
                solve(g);
                if (count >= limit) return;
                g[r][c] = 0;
            }
        }
    }
    solve(grid);
    return count;
}

function countEmpty(grid) {
    let c = 0;
    for (let r = 0; r < 9; r++) for (let col = 0; col < 9; col++) if (grid[r][col] === 0) c++;
    return c;
}

function generateFallback(difficulty) {
    // Basic fallback logic
    const grid = Array.from({ length: 9 }, () => Array(9).fill(0));
    solveSudoku(grid);
    solution = grid.map(r => [...r]);
    // Symmetric fallback removal
    const pairs = [];
    for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) {
        if ((r * 9 + c) <= ((8 - r) * 9 + (8 - c))) pairs.push([r, c]);
    }
    shuffleArray(pairs);

    let targetRemove = 40;
    if (difficulty === 'medium' || difficulty === 'hard') targetRemove = 54;

    let removed = 0;
    for (const [r, c] of pairs) {
        if (removed >= targetRemove) break;
        const symR = 8 - r;
        const symC = 8 - c;
        const val = grid[r][c];
        const symVal = grid[symR][symC];
        grid[r][c] = 0;
        grid[symR][symC] = 0;

        const copy = grid.map(r => [...r]);
        if (countSolutions(copy, 2) === 1) {
            removed += (r === symR && c === symC) ? 1 : 2;
        } else {
            grid[r][c] = val;
            grid[symR][symC] = symVal;
        }
    }
    return grid;
}
