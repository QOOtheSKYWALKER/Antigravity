const fs = require('fs');

const code = fs.readFileSync('sudoku/solver.js', 'utf8');
eval(code + '\nmodule.exports = { SudokuLogicalSolver };');
const { SudokuLogicalSolver } = module.exports;

// Reconstruct the board from the screenshot
const grid = [
    [0, 6, 0, 5, 0, 7, 8, 0, 0],
    [0, 8, 7, 1, 4, 6, 9, 0, 0],
    [0, 0, 0, 0, 8, 6, 1, 5, 0],
    [0, 4, 0, 0, 0, 2, 0, 0, 0],
    [0, 0, 0, 4, 0, 0, 0, 0, 0],
    [0, 0, 0, 6, 0, 3, 0, 4, 0],
    [0, 7, 0, 9, 0, 0, 6, 5, 0],
    [3, 0, 0, 0, 6, 0, 0, 1, 7],
    [0, 4, 6, 1, 0, 9, 2, 0, 0] // bottom right is missing one cell we'll see if it leaves 8
];

const solver = new SudokuLogicalSolver(grid);
const res = solver.solve();
console.log("Solved:", res.solved);
console.log("Difficulty:", res.difficulty);
console.log("Technique:", res.technique);
console.log("Log:");
res.log.forEach(l => console.log(l));

// Re-run step by step to see where it gets stuck
const solver2 = new SudokuLogicalSolver(grid);
console.log("\nStep by step Candidates for (8, 8):", Array.from(solver2.candidates[8][8]));

solver2.applyNakedSingle();
console.log("After Naked Single:", Array.from(solver2.candidates[8][8]));

solver2.applyLockedCandidates();
console.log("After Locked Candidates:", Array.from(solver2.candidates[8][8]));

