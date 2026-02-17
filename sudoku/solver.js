/**
 * SudokuLogicalSolver
 * 人間のような推論ロジックで数独を解き、難易度を判定するクラス
 */
class SudokuLogicalSolver {
    constructor(grid) {
        // グリッドのコピーを作成（0: 空白, 1-9: 数字）
        this.grid = grid.map(row => [...row]);
        // 候補の管理: 9x9の配列、各要素はSet(1-9) または null（確定済み）
        this.candidates = [];
        this.difficultyLog = []; // 使用したテクニックのログ
        this.solved = false;

        this.initializeCandidates();
    }

    /**
     * 初期候補の計算
     */
    initializeCandidates() {
        this.candidates = Array.from({ length: 9 }, () => Array(9).fill(null));

        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                if (this.grid[r][c] === 0) {
                    this.candidates[r][c] = new Set([1, 2, 3, 4, 5, 6, 7, 8, 9]);
                }
            }
        }

        // 初期盤面の数字に基づいて候補を削除
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                if (this.grid[r][c] !== 0) {
                    this.eliminateCandidates(r, c, this.grid[r][c]);
                }
            }
        }
    }

    /**
     * 指定したセルの数字に基づいて、関連するセル（行・列・ブロック）の候補からその数字を削除する
     */
    eliminateCandidates(row, col, num) {
        const updates = [];

        // 行と列
        for (let i = 0; i < 9; i++) {
            if (this.candidates[row][i] && this.candidates[row][i].has(num)) {
                this.candidates[row][i].delete(num);
                updates.push({ r: row, c: i });
            }
            if (this.candidates[i][col] && this.candidates[i][col].has(num)) {
                this.candidates[i][col].delete(num);
                updates.push({ r: i, c: col });
            }
        }

        // 3x3ブロック
        const startRow = Math.floor(row / 3) * 3;
        const startCol = Math.floor(col / 3) * 3;
        for (let r = startRow; r < startRow + 3; r++) {
            for (let c = startCol; c < startCol + 3; c++) {
                if (this.candidates[r][c] && this.candidates[r][c].has(num)) {
                    this.candidates[r][c].delete(num);
                    updates.push({ r, c });
                }
            }
        }
        return updates;
    }

    /**
     * メインの解決ループ
     * @returns {Object} { solved: boolean, difficulty: string, logicLog: Array }
     */
    solve() {
        let changed = true;
        while (changed && !this.isSolved()) {
            changed = false;

            // 1. Basic Strategies
            if (this.applyNakedSingle()) { changed = true; continue; }
            if (this.applyHiddenSingle()) { changed = true; continue; }

            // 2. Medium Strategies (TODO)
            if (this.applyNakedPair()) { changed = true; continue; }
            if (this.applyHiddenPair()) { changed = true; continue; }
            if (this.applyLockedCandidates()) { changed = true; continue; } // Intersection Removal

            // 3. Hard Strategies (TODO)
            if (this.applyXWing()) { changed = true; continue; }
            if (this.applyYWing()) { changed = true; continue; }
            if (this.applySwordfish()) { changed = true; continue; }
        }

        return {
            solved: this.isSolved(),
            difficulty: this.calculateDifficulty(),
            log: this.difficultyLog
        };
    }

    isSolved() {
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                if (this.grid[r][c] === 0) return false;
            }
        }
        return true;
    }

    calculateDifficulty() {
        // テクニックごとの難易度マッピング
        const levels = {
            'Naked Single': 'trivial',
            'Hidden Single': 'easy',
            'Naked Pair': 'medium',
            'Hidden Pair': 'medium',
            'Locked Candidates': 'medium',
            'Locked Candidates (Pointing)': 'medium',
            'Locked Candidates (Claiming)': 'medium',
            'X-Wing': 'hard',
            'Y-Wing': 'hard',
            'Swordfish': 'hard'
        };

        let maxDifficulty = 'trivial'; // Naked Singleのみの場合

        // 優先度定義 (数値が高いほど難しい)
        const rank = { 'trivial': 0, 'easy': 1, 'medium': 2, 'hard': 3 };

        for (const log of this.difficultyLog) {
            const diff = levels[log.technique];
            if (diff && rank[diff] > rank[maxDifficulty]) {
                maxDifficulty = diff;
            }
        }

        return maxDifficulty;
    }

    // ===== STRATEGIES =====

    /**
     * Naked Single (唯一次元): あるマスの候補が1つしかない場合
     */
    applyNakedSingle() {
        let changed = false;
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                if (this.grid[r][c] === 0 && this.candidates[r][c].size === 1) {
                    const num = [...this.candidates[r][c]][0];
                    this.setCellValue(r, c, num, 'Naked Single');
                    changed = true;
                }
            }
        }
        return changed;
    }

    /**
     * Hidden Single (隠れたシングル): ある行・列・ブロックにおいて、ある数字が入る場所が1箇所しかない場合
     */
    applyHiddenSingle() {
        let changed = false;
        const regions = this.getAllRegions();

        for (const region of regions) {
            // 数字 1-9 について、この領域内で候補として持っているセルを探す
            for (let num = 1; num <= 9; num++) {
                const possibleCells = [];
                for (const { r, c } of region) {
                    if (this.grid[r][c] === 0 && this.candidates[r][c].has(num)) {
                        possibleCells.push({ r, c });
                    }
                }

                if (possibleCells.length === 1) {
                    const cell = possibleCells[0];
                    // すでにNaked Singleで埋まっている可能性があるためチェック
                    if (this.grid[cell.r][cell.c] === 0) {
                        this.setCellValue(cell.r, cell.c, num, 'Hidden Single');
                        changed = true;
                    }
                }
            }
        }
        return changed;
    }

    /**
     * Naked Pair / Triple: あるユニット内で、N個のセルがN個の候補を共有している場合
     * （現在は Pair のみ実装、必要に応じて Triple も追加）
     */
    applyNakedPair() {
        let changed = false;
        const regions = this.getAllRegions();

        for (const region of regions) {
            // 候補数が2のセルを探す
            const potentialPairs = region.filter(({ r, c }) =>
                this.grid[r][c] === 0 && this.candidates[r][c].size === 2
            );

            // 同じ候補を持つペアを探す
            for (let i = 0; i < potentialPairs.length; i++) {
                for (let j = i + 1; j < potentialPairs.length; j++) {
                    const cell1 = potentialPairs[i];
                    const cell2 = potentialPairs[j];
                    const c1 = this.candidates[cell1.r][cell1.c];
                    const c2 = this.candidates[cell2.r][cell2.c];

                    // Setの比較
                    if (this.setsAreEqual(c1, c2)) {
                        const pairNums = [...c1];
                        // この領域内の他のセルから、この2つの数字を削除
                        for (const { r, c } of region) {
                            if ((r !== cell1.r || c !== cell1.c) && (r !== cell2.r || c !== cell2.c)) {
                                if (this.grid[r][c] === 0) {
                                    let removed = false;
                                    if (this.candidates[r][c].has(pairNums[0])) {
                                        this.candidates[r][c].delete(pairNums[0]);
                                        removed = true;
                                    }
                                    if (this.candidates[r][c].has(pairNums[1])) {
                                        this.candidates[r][c].delete(pairNums[1]);
                                        removed = true;
                                    }
                                    if (removed) {
                                        this.difficultyLog.push({ technique: 'Naked Pair', r, c, nums: pairNums });
                                        changed = true;
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        return changed;
    }

    /**
     * Hidden Pair: あるユニット内で、2つの数字が特定の2つのセルにしか現れない場合
     */
    applyHiddenPair() {
        let changed = false;
        const regions = this.getAllRegions();

        for (const region of regions) {
            // 数字ごとの出現位置をマップ化
            const numPositions = {};
            for (let n = 1; n <= 9; n++) numPositions[n] = [];

            for (const { r, c } of region) {
                if (this.grid[r][c] === 0) {
                    for (const n of this.candidates[r][c]) {
                        numPositions[n].push({ r, c });
                    }
                }
            }

            // 出現回数が2回の数字を抽出
            const candidateNums = [];
            for (let n = 1; n <= 9; n++) {
                if (numPositions[n].length === 2) candidateNums.push(n);
            }

            // ペアを探す
            for (let i = 0; i < candidateNums.length; i++) {
                for (let j = i + 1; j < candidateNums.length; j++) {
                    const n1 = candidateNums[i];
                    const n2 = candidateNums[j];
                    const pos1 = numPositions[n1];
                    const pos2 = numPositions[n2];

                    // 2つの数字が同じ2セルにあるか確認
                    if (pos1[0].r === pos2[0].r && pos1[0].c === pos2[0].c &&
                        pos1[1].r === pos2[1].r && pos1[1].c === pos2[1].c) {

                        // この2セルから、n1/n2以外の候補を削除
                        const targetCells = [pos1[0], pos1[1]];
                        for (const cell of targetCells) {
                            const currentCandidates = this.candidates[cell.r][cell.c];
                            if (currentCandidates.size > 2) {
                                for (const n of currentCandidates) {
                                    if (n !== n1 && n !== n2) {
                                        currentCandidates.delete(n);
                                        changed = true;
                                    }
                                }
                                if (changed) {
                                    this.difficultyLog.push({ technique: 'Hidden Pair', r: cell.r, c: cell.c, nums: [n1, n2] });
                                }
                            }
                        }
                    }
                }
            }
        }
        return changed;
    }

    setsAreEqual(a, b) {
        if (a.size !== b.size) return false;
        for (const item of a) if (!b.has(item)) return false;
        return true;
    }
    /**
     * Locked Candidates (Intersection Removal)
     * Pointing: ブロック内で数字が特定の行列に限定 -> 行列の他ブロックから削除
     * Claiming: 行列内で数字が特定のブロックに限定 -> ブロックの他セルから削除
     */
    applyLockedCandidates() {
        let changed = false;

        // 1. Pointing (Block -> Row/Col)
        for (let br = 0; br < 3; br++) {
            for (let bc = 0; bc < 3; bc++) {
                // 各ブロックについて
                for (let num = 1; num <= 9; num++) {
                    const positions = [];
                    for (let r = br * 3; r < br * 3 + 3; r++) {
                        for (let c = bc * 3; c < bc * 3 + 3; c++) {
                            if (this.grid[r][c] === 0 && this.candidates[r][c].has(num)) {
                                positions.push({ r, c });
                            }
                        }
                    }

                    if (positions.length === 0) continue;

                    // 全ての候補が同じ行にあるか
                    const allInRow = positions.every(p => p.r === positions[0].r);
                    if (allInRow) {
                        const r = positions[0].r;
                        // その行の他のブロックから削除
                        for (let c = 0; c < 9; c++) {
                            // 現在のブロック外
                            if (Math.floor(c / 3) !== bc) {
                                if (this.grid[r][c] === 0 && this.candidates[r][c].has(num)) {
                                    this.candidates[r][c].delete(num);
                                    changed = true;
                                    this.difficultyLog.push({ technique: 'Locked Candidates (Pointing)', r, c, num });
                                }
                            }
                        }
                    }

                    // 全ての候補が同じ列にあるか
                    const allInCol = positions.every(p => p.c === positions[0].c);
                    if (allInCol) {
                        const c = positions[0].c;
                        // その列の他のブロックから削除
                        for (let r = 0; r < 9; r++) {
                            // 現在のブロック外
                            if (Math.floor(r / 3) !== br) {
                                if (this.grid[r][c] === 0 && this.candidates[r][c].has(num)) {
                                    this.candidates[r][c].delete(num);
                                    changed = true;
                                    this.difficultyLog.push({ technique: 'Locked Candidates (Pointing)', r, c, num });
                                }
                            }
                        }
                    }
                }
            }
        }

        // 2. Claiming (Row/Col -> Block)
        // Rows
        for (let r = 0; r < 9; r++) {
            for (let num = 1; num <= 9; num++) {
                const positions = [];
                for (let c = 0; c < 9; c++) {
                    if (this.grid[r][c] === 0 && this.candidates[r][c].has(num)) {
                        positions.push({ c, r }); // r is constant
                    }
                }
                if (positions.length === 0) continue;

                // 全て同じブロックか
                const firstBlockCol = Math.floor(positions[0].c / 3);
                const allInBlock = positions.every(p => Math.floor(p.c / 3) === firstBlockCol);

                if (allInBlock) {
                    const br = Math.floor(r / 3);
                    const bc = firstBlockCol;
                    // そのブロック内の、この行以外のセルから削除
                    for (let rr = br * 3; rr < br * 3 + 3; rr++) {
                        for (let cc = bc * 3; cc < bc * 3 + 3; cc++) {
                            if (rr !== r) { // この行以外
                                if (this.grid[rr][cc] === 0 && this.candidates[rr][cc].has(num)) {
                                    this.candidates[rr][cc].delete(num);
                                    changed = true;
                                    this.difficultyLog.push({ technique: 'Locked Candidates (Claiming)', r: rr, c: cc, num });
                                }
                            }
                        }
                    }
                }
            }
        }

        // Cols
        for (let c = 0; c < 9; c++) {
            for (let num = 1; num <= 9; num++) {
                const positions = [];
                for (let r = 0; r < 9; r++) {
                    if (this.grid[r][c] === 0 && this.candidates[r][c].has(num)) {
                        positions.push({ r, c }); // c is constant
                    }
                }
                if (positions.length === 0) continue;

                const firstBlockRow = Math.floor(positions[0].r / 3);
                const allInBlock = positions.every(p => Math.floor(p.r / 3) === firstBlockRow);

                if (allInBlock) {
                    const br = firstBlockRow;
                    const bc = Math.floor(c / 3);
                    for (let rr = br * 3; rr < br * 3 + 3; rr++) {
                        for (let cc = bc * 3; cc < bc * 3 + 3; cc++) {
                            if (cc !== c) { // この列以外
                                if (this.grid[rr][cc] === 0 && this.candidates[rr][cc].has(num)) {
                                    this.candidates[rr][cc].delete(num);
                                    changed = true;
                                    this.difficultyLog.push({ technique: 'Locked Candidates (Claiming)', r: rr, c: cc, num });
                                }
                            }
                        }
                    }
                }
            }
        }

        return changed;
    }
    /**
     * X-Wing
     * ある数字が、2つの行においてそれぞれ同じ2つの列にしか候補がない場合（あるいはその逆）、
     * その2つの列の他の行からその数字を削除できる。
     */
    applyXWing() {
        let changed = false;

        // 1. Rows -> Cols
        for (let num = 1; num <= 9; num++) {
            const rowsWithTwo = [];
            for (let r = 0; r < 9; r++) {
                const cols = [];
                for (let c = 0; c < 9; c++) {
                    if (this.grid[r][c] === 0 && this.candidates[r][c].has(num)) {
                        cols.push(c);
                    }
                }
                if (cols.length === 2) {
                    rowsWithTwo.push({ r, cols });
                }
            }

            // ペアを探す
            for (let i = 0; i < rowsWithTwo.length; i++) {
                for (let j = i + 1; j < rowsWithTwo.length; j++) {
                    const r1 = rowsWithTwo[i];
                    const r2 = rowsWithTwo[j];
                    if (r1.cols[0] === r2.cols[0] && r1.cols[1] === r2.cols[1]) {
                        // Found X-Wing
                        const c1 = r1.cols[0];
                        const c2 = r1.cols[1];

                        // この2列の他の行から削除
                        for (let r = 0; r < 9; r++) {
                            if (r !== r1.r && r !== r2.r) {
                                let removed = false;
                                if (this.grid[r][c1] === 0 && this.candidates[r][c1].has(num)) {
                                    this.candidates[r][c1].delete(num);
                                    removed = true;
                                }
                                if (this.grid[r][c2] === 0 && this.candidates[r][c2].has(num)) {
                                    this.candidates[r][c2].delete(num);
                                    removed = true;
                                }
                                if (removed) {
                                    changed = true;
                                    this.difficultyLog.push({ technique: 'X-Wing', r, cols: [c1, c2], num });
                                }
                            }
                        }
                    }
                }
            }
        }

        // 2. Cols -> Rows
        for (let num = 1; num <= 9; num++) {
            const colsWithTwo = [];
            for (let c = 0; c < 9; c++) {
                const rows = [];
                for (let r = 0; r < 9; r++) {
                    if (this.grid[r][c] === 0 && this.candidates[r][c].has(num)) {
                        rows.push(r);
                    }
                }
                if (rows.length === 2) {
                    colsWithTwo.push({ c, rows });
                }
            }

            for (let i = 0; i < colsWithTwo.length; i++) {
                for (let j = i + 1; j < colsWithTwo.length; j++) {
                    const c1 = colsWithTwo[i];
                    const c2 = colsWithTwo[j];
                    if (c1.rows[0] === c2.rows[0] && c1.rows[1] === c2.rows[1]) {
                        // Found X-Wing
                        const r1 = c1.rows[0];
                        const r2 = c1.rows[1];

                        // この2行の他の列から削除
                        for (let c = 0; c < 9; c++) {
                            if (c !== c1.c && c !== c2.c) {
                                let removed = false;
                                if (this.grid[r1][c] === 0 && this.candidates[r1][c].has(num)) {
                                    this.candidates[r1][c].delete(num);
                                    removed = true;
                                }
                                if (this.grid[r2][c] === 0 && this.candidates[r2][c].has(num)) {
                                    this.candidates[r2][c].delete(num);
                                    removed = true;
                                }
                                if (removed) {
                                    changed = true;
                                    this.difficultyLog.push({ technique: 'X-Wing', rows: [r1, r2], c, num });
                                }
                            }
                        }
                    }
                }
            }
        }

        return changed;
    }
    /**
     * Y-Wing (XY-Wing)
     * Pivot: {A, B}, Pincer1: {A, C}, Pincer2: {B, C}
     * PivotはPincer1, Pincer2の両方とユニットを共有する
     * Pincer1とPincer2が交差するセルからCを削除できる
     */
    applyYWing() {
        let changed = false;

        // 候補数2のセルをリストアップ
        const bivalueCells = [];
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                if (this.grid[r][c] === 0 && this.candidates[r][c].size === 2) {
                    bivalueCells.push({ r, c, cands: [...this.candidates[r][c]] });
                }
            }
        }

        for (const pivot of bivalueCells) {
            const [A, B] = pivot.cands;

            // Pivotと同じユニットにある他のbivalueCellsを探す
            const neighbors = bivalueCells.filter(cell =>
                (cell.r !== pivot.r || cell.c !== pivot.c) &&
                (cell.r === pivot.r || cell.c === pivot.c ||
                    (Math.floor(cell.r / 3) === Math.floor(pivot.r / 3) && Math.floor(cell.c / 3) === Math.floor(pivot.c / 3)))
            );

            // Pincer候補を探す
            for (let i = 0; i < neighbors.length; i++) {
                for (let j = i + 1; j < neighbors.length; j++) {
                    const p1 = neighbors[i];
                    const p2 = neighbors[j];

                    // p1が{A, C}、p2が{B, C}のパターン（または逆）
                    let C = null;
                    let valid = false;

                    // Case 1: p1 has A, p2 has B
                    if (p1.cands.includes(A) && p2.cands.includes(B)) {
                        const c1 = p1.cands.find(x => x !== A); // C candidate from p1
                        const c2 = p2.cands.find(x => x !== B); // C candidate from p2
                        if (c1 === c2) { C = c1; valid = true; }
                    }
                    // Case 2: p1 has B, p2 has A
                    else if (p1.cands.includes(B) && p2.cands.includes(A)) {
                        const c1 = p1.cands.find(x => x !== B);
                        const c2 = p2.cands.find(x => x !== A);
                        if (c1 === c2) { C = c1; valid = true; }
                    }

                    if (valid && C !== null) {
                        // p1とp2の交差するセルを探す
                        // p1とp2の行/列/ブロックの共通部分
                        // 単純に全セル走査して、p1とp2の両方から「見える」セルを探す
                        for (let r = 0; r < 9; r++) {
                            for (let c = 0; c < 9; c++) {
                                if (this.grid[r][c] === 0 && this.candidates[r][c].has(C)) {
                                    if (this.sees(r, c, p1.r, p1.c) && this.sees(r, c, p2.r, p2.c)) {
                                        // p1, p2, pivotが一直線上の場合は除外したいが、
                                        // 定義上、p1とp2が直接見合っているかどうかは関係なく、
                                        // 共通して見えるセルからは削除可能。
                                        // ただし、Pivot, P1, P2が全て同じユニット内にある場合なども含むため、
                                        // 「Pivotを使ったY-Wing」として有効。

                                        this.candidates[r][c].delete(C);
                                        changed = true;
                                        this.difficultyLog.push({ technique: 'Y-Wing', pivot: { r: pivot.r, c: pivot.c }, p1: { r: p1.r, c: p1.c }, p2: { r: p2.r, c: p2.c }, num: C, target: { r, c } });
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        return changed;
    }

    sees(r1, c1, r2, c2) {
        if (r1 === r2 && c1 === c2) return false;
        if (r1 === r2) return true;
        if (c1 === c2) return true;
        if (Math.floor(r1 / 3) === Math.floor(r2 / 3) && Math.floor(c1 / 3) === Math.floor(c2 / 3)) return true;
        return false;
    }
    /**
     * Swordfish
     * X-Wingの3行/3列版
     */
    applySwordfish() {
        let changed = false;

        // 1. Rows -> Cols
        for (let num = 1; num <= 9; num++) {
            const potentialRows = [];
            for (let r = 0; r < 9; r++) {
                const cols = [];
                for (let c = 0; c < 9; c++) {
                    if (this.grid[r][c] === 0 && this.candidates[r][c].has(num)) {
                        cols.push(c);
                    }
                }
                if (cols.length >= 2 && cols.length <= 3) {
                    potentialRows.push({ r, cols });
                }
            }

            if (potentialRows.length >= 3) {
                // 3つの行を選ぶ
                for (let i = 0; i < potentialRows.length; i++) {
                    for (let j = i + 1; j < potentialRows.length; j++) {
                        for (let k = j + 1; k < potentialRows.length; k++) {
                            const rows = [potentialRows[i], potentialRows[j], potentialRows[k]];
                            const unionCols = new Set();
                            rows.forEach(row => row.cols.forEach(c => unionCols.add(c)));

                            if (unionCols.size === 3) {
                                // Found Swordfish
                                const targetCols = [...unionCols];
                                const targetRowIndices = rows.map(ro => ro.r);

                                for (const c of targetCols) {
                                    for (let r = 0; r < 9; r++) {
                                        if (!targetRowIndices.includes(r)) {
                                            if (this.grid[r][c] === 0 && this.candidates[r][c].has(num)) {
                                                this.candidates[r][c].delete(num);
                                                changed = true;
                                                this.difficultyLog.push({ technique: 'Swordfish', rows: targetRowIndices, cols: targetCols, num });
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        // 2. Cols -> Rows
        for (let num = 1; num <= 9; num++) {
            const potentialCols = [];
            for (let c = 0; c < 9; c++) {
                const rows = [];
                for (let r = 0; r < 9; r++) {
                    if (this.grid[r][c] === 0 && this.candidates[r][c].has(num)) {
                        rows.push(r);
                    }
                }
                if (rows.length >= 2 && rows.length <= 3) {
                    potentialCols.push({ c, rows });
                }
            }

            if (potentialCols.length >= 3) {
                for (let i = 0; i < potentialCols.length; i++) {
                    for (let j = i + 1; j < potentialCols.length; j++) {
                        for (let k = j + 1; k < potentialCols.length; k++) {
                            const cols = [potentialCols[i], potentialCols[j], potentialCols[k]];
                            const unionRows = new Set();
                            cols.forEach(col => col.rows.forEach(r => unionRows.add(r)));

                            if (unionRows.size === 3) {
                                const targetRows = [...unionRows];
                                const targetColIndices = cols.map(co => co.c);

                                for (const r of targetRows) {
                                    for (let c = 0; c < 9; c++) {
                                        if (!targetColIndices.includes(c)) {
                                            if (this.grid[r][c] === 0 && this.candidates[r][c].has(num)) {
                                                this.candidates[r][c].delete(num);
                                                changed = true;
                                                this.difficultyLog.push({ technique: 'Swordfish', rows: targetRows, cols: targetColIndices, num });
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        return changed;
    }

    // ===== HELPER METHODS =====

    setCellValue(r, c, num, technique) {
        this.grid[r][c] = num;
        this.candidates[r][c] = null; // 候補消去
        this.eliminateCandidates(r, c, num);

        // ログ記録（同じセル・同じテクニックの重複ログは避ける等の制御が必要ならここで行う）
        this.difficultyLog.push({ technique, r, c, num });
    }

    getAllRegions() {
        const regions = [];

        // Rows
        for (let r = 0; r < 9; r++) {
            const row = [];
            for (let c = 0; c < 9; c++) row.push({ r, c });
            regions.push(row);
        }

        // Cols
        for (let c = 0; c < 9; c++) {
            const col = [];
            for (let r = 0; r < 9; r++) col.push({ r, c });
            regions.push(col);
        }

        // Blocks
        for (let br = 0; br < 3; br++) {
            for (let bc = 0; bc < 3; bc++) {
                const block = [];
                for (let r = br * 3; r < br * 3 + 3; r++) {
                    for (let c = bc * 3; c < bc * 3 + 3; c++) {
                        block.push({ r, c });
                    }
                }
                regions.push(block);
            }
        }

        return regions;
    }
}
