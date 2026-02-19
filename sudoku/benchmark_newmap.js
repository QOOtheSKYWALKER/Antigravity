#!/usr/bin/env node
/**
 * 新しい難易度マッピングでのシミュレーション
 *
 * 新マッピング:
 *   basic  = Naked Single のみで解ける（Easy未満）
 *   easy   = Hidden Single が必要
 *   medium = Naked Pair / Locked Candidates / Hidden Pair / Naked Triple / Hidden Triple
 *   hard   = X-Wing / Y-Wing / Swordfish / Skyscraper / W-Wing
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const solverCode = fs.readFileSync(path.join(__dirname, 'solver.js'), 'utf-8');
vm.runInThisContext(solverCode, { filename: 'solver.js' });

// パズル生成ユーティリティ
function shuffleArray(a) {
    const b = [...a];
    for (let i = b.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [b[i], b[j]] = [b[j], b[i]];
    }
    return b;
}

function isValid(g, r, c, n) {
    for (let x = 0; x < 9; x++) { if (g[r][x] === n) return false; }
    for (let x = 0; x < 9; x++) { if (g[x][c] === n) return false; }
    const br = Math.floor(r / 3) * 3, bc = Math.floor(c / 3) * 3;
    for (let rr = br; rr < br + 3; rr++)
        for (let cc = bc; cc < bc + 3; cc++)
            if (g[rr][cc] === n) return false;
    return true;
}

function solveSudoku(g) {
    for (let r = 0; r < 9; r++)
        for (let c = 0; c < 9; c++) {
            if (g[r][c] === 0) {
                const nums = shuffleArray([1, 2, 3, 4, 5, 6, 7, 8, 9]);
                for (const n of nums) {
                    if (isValid(g, r, c, n)) {
                        g[r][c] = n;
                        if (solveSudoku(g)) return true;
                        g[r][c] = 0;
                    }
                }
                return false;
            }
        }
    return true;
}

function countSolutions(g, limit = 2) {
    let count = 0;
    function solve(g2) {
        for (let r = 0; r < 9; r++)
            for (let c = 0; c < 9; c++) {
                if (g2[r][c] === 0) {
                    for (let n = 1; n <= 9; n++) {
                        if (isValid(g2, r, c, n)) {
                            g2[r][c] = n;
                            solve(g2);
                            if (count >= limit) return;
                            g2[r][c] = 0;
                        }
                    }
                    return;
                }
            }
        count++;
    }
    solve(g);
    return count;
}

// 新しい難易度マッピング
function reclassify(result) {
    if (!result.solved) return 'unsolved';
    const techniques = new Set(result.log.map(l => l.technique));

    const hardTech = ['X-Wing', 'Y-Wing', 'Swordfish', 'Skyscraper', 'W-Wing'];
    const medTech = [
        'Naked Pair', 'Locked Candidates',
        'Locked Candidates (Pointing)', 'Locked Candidates (Claiming)',
        'Hidden Pair', 'Naked Triple', 'Hidden Triple'
    ];

    for (const t of hardTech) if (techniques.has(t)) return 'hard';
    for (const t of medTech) if (techniques.has(t)) return 'medium';
    if (techniques.has('Hidden Single')) return 'easy';
    return 'basic';
}

function generateAndClassify(toRemove) {
    const g = Array.from({ length: 9 }, () => Array(9).fill(0));
    solveSudoku(g);
    const p = g.map(r => [...r]);
    const pos = shuffleArray(Array.from({ length: 81 }, (_, i) => [Math.floor(i / 9), i % 9]));
    let removed = 0;
    for (const [r, c] of pos) {
        if (removed >= toRemove) break;
        const bk = p[r][c];
        p[r][c] = 0;
        if (countSolutions(p.map(r => [...r]), 2) !== 1) p[r][c] = bk;
        else removed++;
    }
    const solver = new SudokuLogicalSolver(p);
    const result = solver.solve();
    return reclassify(result);
}

// 実行
const T = 50;
console.log('新マッピング: basic=NakedSingleのみ, easy=HiddenSingle必要, medium=Pair/Locked/Triple, hard=Fish/Wing');
console.log('');
console.log('削除数 | ヒント | basic  | easy   | medium | hard   | unsolved');
console.log('-------|--------|--------|--------|--------|--------|--------');

for (let rc = 55; rc <= 65; rc++) {
    const s = { basic: 0, easy: 0, medium: 0, hard: 0, unsolved: 0 };
    for (let t = 0; t < T; t++) {
        const d = generateAndClassify(rc);
        s[d] = (s[d] || 0) + 1;
    }
    const cl = 81 - rc;
    const pct = n => String(n).padStart(3) + '(' + (n / T * 100).toFixed(0).padStart(3) + '%)';
    console.log(
        '  ' + String(rc).padStart(2) + '   |   ' + String(cl).padStart(2) +
        '   | ' + pct(s.basic) + ' | ' + pct(s.easy) + ' | ' + pct(s.medium) +
        ' | ' + pct(s.hard) + ' | ' + pct(s.unsolved)
    );
}
