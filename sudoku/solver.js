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
     * @param {string} [maxDifficulty='hard'] 許容する最高難易度（指定された難易度以上のテクニックは使用しない）
     * @returns {Object} { solved: boolean, difficulty: string, logicLog: Array }
     */
    solve(maxDifficulty = 'hard') {
        let changed = true;
        const rank = { 'basic': 1, 'easy': 2, 'medium': 3, 'hard': 4 };
        const maxRank = rank[maxDifficulty] || 4;

        while (changed && !this.isSolved()) {
            changed = false;

            // 1. Basic (Singles)
            if (this.applyNakedSingle()) { changed = true; continue; }
            if (this.applyHiddenSingle()) { changed = true; continue; }

            // 2. Easy (Locked Candidates)
            if (maxRank >= 2) {
                if (this.applyLockedCandidates()) { changed = true; continue; }
            }

            // 3. Medium (Pairs, Triples, Quads)
            if (maxRank >= 3) {
                if (this.applyNakedPair()) { changed = true; continue; }
                if (this.applyHiddenPair()) { changed = true; continue; }
                if (this.applyNakedTriple()) { changed = true; continue; }
                if (this.applyHiddenTriple()) { changed = true; continue; }
                if (this.applyNakedQuad()) { changed = true; continue; }
                if (this.applyHiddenQuad()) { changed = true; continue; }
            }

            // 4. Hard (Fish, Wings, Chains, Rectangles)
            if (maxRank >= 4) {
                if (this.applyXWing()) { changed = true; continue; }
                if (this.applySwordfish()) { changed = true; continue; }
                if (this.applyJellyfish()) { changed = true; continue; }
                if (this.applyYWing()) { changed = true; continue; }
                if (this.applyWWing()) { changed = true; continue; }
                if (this.applySkyscraper()) { changed = true; continue; }
                if (this.applyUniqueRectangleType1()) { changed = true; continue; }
                if (this.applyXYChain()) { changed = true; continue; }
            }
        }

        const diffInfo = this.getDifficultyInfo();
        return {
            solved: this.isSolved(),
            difficulty: diffInfo.level,
            technique: diffInfo.technique,
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

    getDifficultyInfo() {
        // EASY: Locked Candidates (Pointing & Claiming) のみ
        // MEDIUM: Naked/Hidden Pair, Naked/Hidden Triple
        // HARD: X-Wing / Y-Wing / Swordfish / Skyscraper / W-Wing
        const levels = {
            'Naked Single': 'basic',
            'Hidden Single': 'basic',
            'Locked Candidates': 'easy',
            'Locked Candidates (Pointing)': 'easy',
            'Locked Candidates (Claiming)': 'easy',
            'Naked Pair': 'medium',
            'Hidden Pair': 'medium',
            'Naked Triple': 'medium',
            'Hidden Triple': 'medium',
            'Naked Quad': 'medium',
            'Hidden Quad': 'medium',
            'X-Wing': 'hard',
            'Swordfish': 'hard',
            'Jellyfish': 'hard',
            'Y-Wing': 'hard',
            'W-Wing': 'hard',
            'Skyscraper': 'hard',
            'Unique Rectangle (Type 1)': 'hard',
            'XY-Chain': 'hard'
        };

        let maxDifficulty = 'basic';
        let maxTechnique = 'Naked Single'; // Default fallback
        const rank = { 'basic': 0, 'easy': 1, 'medium': 2, 'hard': 3 };

        for (const log of this.difficultyLog) {
            const diff = levels[log.technique];
            if (diff && rank[diff] >= rank[maxDifficulty]) {
                if (rank[diff] > rank[maxDifficulty]) {
                    maxDifficulty = diff;
                    maxTechnique = log.technique;
                } else {
                    // 同一難易度帯の中で後から出てきた（より高度な）テクニックを優先
                    maxTechnique = log.technique;
                }
            }
        }

        return { level: maxDifficulty, technique: maxTechnique };
    }

    calculateDifficulty() {
        return this.getDifficultyInfo().level;
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

    /**
     * Naked Triple: あるユニット内で3つのセルの候補の和集合が3数字以下の場合
     * その3数字を他のセルから除外できる
     */
    applyNakedTriple() {
        let changed = false;
        const regions = this.getAllRegions();

        for (const region of regions) {
            // 候補数が2〜3のセルを探す
            const emptyCells = region.filter(({ r, c }) =>
                this.grid[r][c] === 0 && this.candidates[r][c].size >= 2 && this.candidates[r][c].size <= 3
            );

            if (emptyCells.length < 3) continue;

            for (let i = 0; i < emptyCells.length; i++) {
                for (let j = i + 1; j < emptyCells.length; j++) {
                    for (let k = j + 1; k < emptyCells.length; k++) {
                        const union = new Set([
                            ...this.candidates[emptyCells[i].r][emptyCells[i].c],
                            ...this.candidates[emptyCells[j].r][emptyCells[j].c],
                            ...this.candidates[emptyCells[k].r][emptyCells[k].c]
                        ]);

                        if (union.size !== 3) continue;

                        const tripleNums = [...union];
                        const tripleCells = [emptyCells[i], emptyCells[j], emptyCells[k]];

                        // この領域内の他の空セルから、トリプルの数字を削除
                        for (const { r, c } of region) {
                            if (this.grid[r][c] !== 0) continue;
                            if (tripleCells.some(tc => tc.r === r && tc.c === c)) continue;

                            for (const num of tripleNums) {
                                if (this.candidates[r][c].has(num)) {
                                    this.candidates[r][c].delete(num);
                                    changed = true;
                                    this.difficultyLog.push({ technique: 'Naked Triple', r, c, nums: tripleNums });
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
     * Hidden Triple: あるユニット内で3つの数字が3つのセルにしか現れない場合
     * その3セルから他の候補を除外できる
     */
    applyHiddenTriple() {
        let changed = false;
        const regions = this.getAllRegions();

        for (const region of regions) {
            const numPositions = {};
            for (let n = 1; n <= 9; n++) numPositions[n] = [];

            for (const { r, c } of region) {
                if (this.grid[r][c] === 0) {
                    for (const n of this.candidates[r][c]) {
                        numPositions[n].push({ r, c });
                    }
                }
            }

            // 出現回数が2または3の数字を抽出
            const candidateNums = [];
            for (let n = 1; n <= 9; n++) {
                if (numPositions[n].length >= 2 && numPositions[n].length <= 3) {
                    candidateNums.push(n);
                }
            }

            if (candidateNums.length < 3) continue;

            for (let i = 0; i < candidateNums.length; i++) {
                for (let j = i + 1; j < candidateNums.length; j++) {
                    for (let k = j + 1; k < candidateNums.length; k++) {
                        const n1 = candidateNums[i];
                        const n2 = candidateNums[j];
                        const n3 = candidateNums[k];

                        // 3数字の出現セルの和集合
                        const cellSet = new Map();
                        for (const pos of [...numPositions[n1], ...numPositions[n2], ...numPositions[n3]]) {
                            cellSet.set(`${pos.r},${pos.c}`, pos);
                        }

                        if (cellSet.size !== 3) continue;

                        // その3セルからn1, n2, n3以外を除外
                        const tripleNums = new Set([n1, n2, n3]);
                        for (const [, cell] of cellSet) {
                            for (const n of [...this.candidates[cell.r][cell.c]]) {
                                if (!tripleNums.has(n)) {
                                    this.candidates[cell.r][cell.c].delete(n);
                                    changed = true;
                                    this.difficultyLog.push({ technique: 'Hidden Triple', r: cell.r, c: cell.c, nums: [n1, n2, n3] });
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
     * Naked Quad: あるユニット内で4つのセルの候補の和集合が4数字以下の場合
     * その4数字を他のセルから除外できる
     */
    applyNakedQuad() {
        let changed = false;
        const regions = this.getAllRegions();

        for (const region of regions) {
            const emptyCells = region.filter(({ r, c }) =>
                this.grid[r][c] === 0 && this.candidates[r][c].size >= 2 && this.candidates[r][c].size <= 4
            );

            if (emptyCells.length < 4) continue;

            for (let i = 0; i < emptyCells.length; i++) {
                for (let j = i + 1; j < emptyCells.length; j++) {
                    for (let k = j + 1; k < emptyCells.length; k++) {
                        for (let l = k + 1; l < emptyCells.length; l++) {
                            const union = new Set([
                                ...this.candidates[emptyCells[i].r][emptyCells[i].c],
                                ...this.candidates[emptyCells[j].r][emptyCells[j].c],
                                ...this.candidates[emptyCells[k].r][emptyCells[k].c],
                                ...this.candidates[emptyCells[l].r][emptyCells[l].c]
                            ]);

                            if (union.size !== 4) continue;

                            const quadNums = [...union];
                            const quadCells = [emptyCells[i], emptyCells[j], emptyCells[k], emptyCells[l]];

                            for (const { r, c } of region) {
                                if (this.grid[r][c] !== 0) continue;
                                if (quadCells.some(qc => qc.r === r && qc.c === c)) continue;

                                for (const num of quadNums) {
                                    if (this.candidates[r][c].has(num)) {
                                        this.candidates[r][c].delete(num);
                                        changed = true;
                                        this.difficultyLog.push({ technique: 'Naked Quad', r, c, nums: quadNums });
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
     * Hidden Quad: あるユニット内で4つの数字が4つのセルにしか現れない場合
     * その4セルから他の候補を除外できる
     */
    applyHiddenQuad() {
        let changed = false;
        const regions = this.getAllRegions();

        for (const region of regions) {
            const numPositions = {};
            for (let n = 1; n <= 9; n++) numPositions[n] = [];

            for (const { r, c } of region) {
                if (this.grid[r][c] === 0) {
                    for (const n of this.candidates[r][c]) {
                        numPositions[n].push({ r, c });
                    }
                }
            }

            const candidateNums = [];
            for (let n = 1; n <= 9; n++) {
                if (numPositions[n].length >= 2 && numPositions[n].length <= 4) {
                    candidateNums.push(n);
                }
            }

            if (candidateNums.length < 4) continue;

            for (let i = 0; i < candidateNums.length; i++) {
                for (let j = i + 1; j < candidateNums.length; j++) {
                    for (let k = j + 1; k < candidateNums.length; k++) {
                        for (let l = k + 1; l < candidateNums.length; l++) {
                            const n1 = candidateNums[i];
                            const n2 = candidateNums[j];
                            const n3 = candidateNums[k];
                            const n4 = candidateNums[l];

                            const cellSet = new Map();
                            for (const pos of [...numPositions[n1], ...numPositions[n2], ...numPositions[n3], ...numPositions[n4]]) {
                                cellSet.set(`${pos.r},${pos.c}`, pos);
                            }

                            if (cellSet.size !== 4) continue;

                            const quadNums = new Set([n1, n2, n3, n4]);
                            for (const [, cell] of cellSet) {
                                for (const n of [...this.candidates[cell.r][cell.c]]) {
                                    if (!quadNums.has(n)) {
                                        this.candidates[cell.r][cell.c].delete(n);
                                        changed = true;
                                        this.difficultyLog.push({ technique: 'Hidden Quad', r: cell.r, c: cell.c, nums: [n1, n2, n3, n4] });
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

    setsAreEqual(a, b) {
        if (a.size !== b.size) return false;
        for (const item of a) if (!b.has(item)) return false;
        return true;
    }
    /**
     * Locked Candidates (Intersection Removal)
    /**
     * Locked Candidates
     * Pointing: ブロック内で特定の数字が入る候補セルが、すべて同じ行（または列）に存在する場合、
     *           その行（または列）の「他のブロック」からは、その数字の候補を削除できる。
     * Claiming: 行（または列）内で特定の数字が入る候補セルが、すべて同じブロック内に存在する場合、
     *           そのブロックの「他の行（または列）」からは、その数字の候補を削除できる。
     */
    applyLockedCandidates() {
        let changed = false;

        // --- 1. Pointing (Block -> Row/Col) ---
        for (let br = 0; br < 3; br++) {
            for (let bc = 0; bc < 3; bc++) {
                for (let num = 1; num <= 9; num++) {
                    const positions = [];
                    for (let r = br * 3; r < br * 3 + 3; r++) {
                        for (let c = bc * 3; c < bc * 3 + 3; c++) {
                            if (this.grid[r][c] === 0 && this.candidates[r][c].has(num)) {
                                positions.push({ r, c });
                            }
                        }
                    }

                    if (positions.length < 2) continue; // 2つか3つ必要

                    // 全て同じ行か？
                    const allInRow = positions.every(p => p.r === positions[0].r);
                    if (allInRow) {
                        const r = positions[0].r;
                        for (let c = 0; c < 9; c++) {
                            // 現在のブロックの外側で候補を消す
                            if (Math.floor(c / 3) !== bc && this.grid[r][c] === 0 && this.candidates[r][c].has(num)) {
                                this.candidates[r][c].delete(num);
                                changed = true;
                                this.difficultyLog.push({ technique: 'Locked Candidates (Pointing)', r: r, c: c, num });
                            }
                        }
                    }

                    // 全て同じ列か？
                    const allInCol = positions.every(p => p.c === positions[0].c);
                    if (allInCol) {
                        const c = positions[0].c;
                        for (let r = 0; r < 9; r++) {
                            // 現在のブロックの外側で候補を消す
                            if (Math.floor(r / 3) !== br && this.grid[r][c] === 0 && this.candidates[r][c].has(num)) {
                                this.candidates[r][c].delete(num);
                                changed = true;
                                this.difficultyLog.push({ technique: 'Locked Candidates (Pointing)', r: r, c: c, num });
                            }
                        }
                    }
                }
            }
        }

        // --- 2. Claiming (Row/Col -> Block) ---
        for (let num = 1; num <= 9; num++) {
            // Rows -> Block
            for (let r = 0; r < 9; r++) {
                const positions = [];
                for (let c = 0; c < 9; c++) {
                    if (this.grid[r][c] === 0 && this.candidates[r][c].has(num)) {
                        positions.push({ r, c });
                    }
                }
                if (positions.length < 2) continue;

                const firstBlockCol = Math.floor(positions[0].c / 3);
                const allInBlock = positions.every(p => Math.floor(p.c / 3) === firstBlockCol);

                if (allInBlock) {
                    const br = Math.floor(r / 3);
                    const bc = firstBlockCol;
                    for (let rr = br * 3; rr < br * 3 + 3; rr++) {
                        for (let cc = bc * 3; cc < bc * 3 + 3; cc++) {
                            // この行自体は除外して、ブロック内の他のセルから消す
                            if (rr !== r && this.grid[rr][cc] === 0 && this.candidates[rr][cc].has(num)) {
                                this.candidates[rr][cc].delete(num);
                                changed = true;
                                this.difficultyLog.push({ technique: 'Locked Candidates (Claiming)', r: rr, c: cc, num });
                            }
                        }
                    }
                }
            }

            // Cols -> Block
            for (let c = 0; c < 9; c++) {
                const positions = [];
                for (let r = 0; r < 9; r++) {
                    if (this.grid[r][c] === 0 && this.candidates[r][c].has(num)) {
                        positions.push({ r, c });
                    }
                }
                if (positions.length < 2) continue;

                const firstBlockRow = Math.floor(positions[0].r / 3);
                const allInBlock = positions.every(p => Math.floor(p.r / 3) === firstBlockRow);

                if (allInBlock) {
                    const br = firstBlockRow;
                    const bc = Math.floor(c / 3);
                    for (let rr = br * 3; rr < br * 3 + 3; rr++) {
                        for (let cc = bc * 3; cc < bc * 3 + 3; cc++) {
                            // この列自体は除外して、ブロック内の他のセルから消す
                            if (cc !== c && this.grid[rr][cc] === 0 && this.candidates[rr][cc].has(num)) {
                                this.candidates[rr][cc].delete(num);
                                changed = true;
                                this.difficultyLog.push({ technique: 'Locked Candidates (Claiming)', r: rr, c: cc, num });
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

    /**
     * Jellyfish
     * Swordfish (3x3) の 4x4 版
     */
    applyJellyfish() {
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
                if (cols.length >= 2 && cols.length <= 4) {
                    potentialRows.push({ r, cols });
                }
            }

            if (potentialRows.length >= 4) {
                const combos = this.getCombinations(potentialRows, 4);
                for (const rows of combos) {
                    const unionCols = new Set();
                    rows.forEach(row => row.cols.forEach(c => unionCols.add(c)));

                    if (unionCols.size === 4) {
                        const targetCols = [...unionCols];
                        const targetRowIndices = rows.map(ro => ro.r);

                        for (const c of targetCols) {
                            for (let r = 0; r < 9; r++) {
                                if (!targetRowIndices.includes(r)) {
                                    if (this.grid[r][c] === 0 && this.candidates[r][c].has(num)) {
                                        this.candidates[r][c].delete(num);
                                        changed = true;
                                        this.difficultyLog.push({ technique: 'Jellyfish', rows: targetRowIndices, cols: targetCols, num });
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
                if (rows.length >= 2 && rows.length <= 4) {
                    potentialCols.push({ c, rows });
                }
            }

            if (potentialCols.length >= 4) {
                const combos = this.getCombinations(potentialCols, 4);
                for (const cols of combos) {
                    const unionRows = new Set();
                    cols.forEach(col => col.rows.forEach(r => unionRows.add(r)));

                    if (unionRows.size === 4) {
                        const targetRows = [...unionRows];
                        const targetColIndices = cols.map(co => co.c);

                        for (const r of targetRows) {
                            for (let c = 0; c < 9; c++) {
                                if (!targetColIndices.includes(c)) {
                                    if (this.grid[r][c] === 0 && this.candidates[r][c].has(num)) {
                                        this.candidates[r][c].delete(num);
                                        changed = true;
                                        this.difficultyLog.push({ technique: 'Jellyfish', rows: targetRows, cols: targetColIndices, num });
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

    getCombinations(arr, k) {
        const results = [];
        const f = (start, combo) => {
            if (combo.length === k) {
                results.push([...combo]);
                return;
            }
            for (let i = start; i < arr.length; i++) {
                combo.push(arr[i]);
                f(i + 1, combo);
                combo.pop();
            }
        };
        f(0, []);
        return results;
    }

    /**
     * Skyscraper (Turbot Fish の一種)
     * ある数字が2つの列(or行)それぞれにちょうど2箇所ずつあり、
     * そのうち片方の端が同じ行(or列)を共有する場合、
     * もう片方の端の両方が見えるセルからその数字を除外できる。
     */
    applySkyscraper() {
        let changed = false;

        for (let num = 1; num <= 9; num++) {
            // 列ベース: 各列で候補numが正確に2箇所にある列を収集
            const biValueCols = [];
            for (let c = 0; c < 9; c++) {
                const rows = [];
                for (let r = 0; r < 9; r++) {
                    if (this.grid[r][c] === 0 && this.candidates[r][c].has(num)) {
                        rows.push(r);
                    }
                }
                if (rows.length === 2) {
                    biValueCols.push({ c, rows });
                }
            }

            // 2列のペアを検査
            for (let i = 0; i < biValueCols.length; i++) {
                for (let j = i + 1; j < biValueCols.length; j++) {
                    const a = biValueCols[i];
                    const b = biValueCols[j];

                    // 片方の端が同じ行を共有するケースを探す
                    for (let ai = 0; ai < 2; ai++) {
                        for (let bi = 0; bi < 2; bi++) {
                            if (a.rows[ai] === b.rows[bi]) {
                                // 共有行: a.rows[ai]
                                // 残りの端: a.rows[1-ai], b.rows[1-bi]
                                const rA = a.rows[1 - ai];
                                const cA = a.c;
                                const rB = b.rows[1 - bi];
                                const cB = b.c;

                                // 両方の端が見えるセルから候補を除外
                                for (let r = 0; r < 9; r++) {
                                    for (let c = 0; c < 9; c++) {
                                        if (this.grid[r][c] === 0 && this.candidates[r][c].has(num)) {
                                            if (this.sees(r, c, rA, cA) && this.sees(r, c, rB, cB)) {
                                                if (!(r === rA && c === cA) && !(r === rB && c === cB)) {
                                                    this.candidates[r][c].delete(num);
                                                    changed = true;
                                                    this.difficultyLog.push({ technique: 'Skyscraper', num, cells: [[rA, cA], [rB, cB]] });
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

            // 行ベース
            const biValueRows = [];
            for (let r = 0; r < 9; r++) {
                const cols = [];
                for (let c = 0; c < 9; c++) {
                    if (this.grid[r][c] === 0 && this.candidates[r][c].has(num)) {
                        cols.push(c);
                    }
                }
                if (cols.length === 2) {
                    biValueRows.push({ r, cols });
                }
            }

            for (let i = 0; i < biValueRows.length; i++) {
                for (let j = i + 1; j < biValueRows.length; j++) {
                    const a = biValueRows[i];
                    const b = biValueRows[j];

                    for (let ai = 0; ai < 2; ai++) {
                        for (let bi = 0; bi < 2; bi++) {
                            if (a.cols[ai] === b.cols[bi]) {
                                const rA = a.r;
                                const cA = a.cols[1 - ai];
                                const rB = b.r;
                                const cB = b.cols[1 - bi];

                                for (let r = 0; r < 9; r++) {
                                    for (let c = 0; c < 9; c++) {
                                        if (this.grid[r][c] === 0 && this.candidates[r][c].has(num)) {
                                            if (this.sees(r, c, rA, cA) && this.sees(r, c, rB, cB)) {
                                                if (!(r === rA && c === cA) && !(r === rB && c === cB)) {
                                                    this.candidates[r][c].delete(num);
                                                    changed = true;
                                                    this.difficultyLog.push({ technique: 'Skyscraper', num, cells: [[rA, cA], [rB, cB]] });
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
        }

        return changed;
    }

    /**
     * W-Wing
     * 同じ2つの候補{X,Y}を持つ2つのセルA, Bがあり、
     * AとBの間に「強いリンク」（ある行/列/ブロック内でYが2箇所のみ）で
     * 接続されているとき、A, Bの両方が見えるセルからXを除外できる。
     */
    applyWWing() {
        let changed = false;

        // 候補がちょうど2つのセルを収集
        const biValueCells = [];
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                if (this.grid[r][c] === 0 && this.candidates[r][c].size === 2) {
                    const cands = [...this.candidates[r][c]];
                    biValueCells.push({ r, c, cands });
                }
            }
        }

        // 同じペアを持つ2セルの組み合わせを検査
        for (let i = 0; i < biValueCells.length; i++) {
            for (let j = i + 1; j < biValueCells.length; j++) {
                const a = biValueCells[i];
                const b = biValueCells[j];

                // 同じ2候補か
                if (a.cands[0] !== b.cands[0] || a.cands[1] !== b.cands[1]) continue;
                // 互いに見えない（見えるならNaked Pairで処理済み）
                if (this.sees(a.r, a.c, b.r, b.c)) continue;

                const [x, y] = a.cands;

                // yについて強いリンクを探す（yの2つ目の候補も可）
                for (const linkVal of [x, y]) {
                    const elimVal = linkVal === x ? y : x;

                    // 全リージョンでlinkValが正確に2箇所にあるリンクを探す
                    const regions = this.getAllRegions();
                    for (const region of regions) {
                        const cellsWithVal = region.filter(cell =>
                            this.grid[cell.r][cell.c] === 0 && this.candidates[cell.r][cell.c].has(linkVal)
                        );

                        if (cellsWithVal.length !== 2) continue;

                        const [p, q] = cellsWithVal;

                        // pがaを見て、qがbを見る、またはその逆
                        const case1 = this.sees(p.r, p.c, a.r, a.c) && this.sees(q.r, q.c, b.r, b.c);
                        const case2 = this.sees(p.r, p.c, b.r, b.c) && this.sees(q.r, q.c, a.r, a.c);

                        if (!case1 && !case2) continue;

                        // A, Bの両方が見えるセルからelimValを除外
                        for (let r = 0; r < 9; r++) {
                            for (let c = 0; c < 9; c++) {
                                if (this.grid[r][c] === 0 && this.candidates[r][c].has(elimVal)) {
                                    if (this.sees(r, c, a.r, a.c) && this.sees(r, c, b.r, b.c)) {
                                        if (!(r === a.r && c === a.c) && !(r === b.r && c === b.c)) {
                                            this.candidates[r][c].delete(elimVal);
                                            changed = true;
                                            this.difficultyLog.push({ technique: 'W-Wing', num: elimVal, cells: [[a.r, a.c], [b.r, b.c]] });
                                        }
                                    }
                                }
                            }
                        }

                        if (changed) return true;
                    }
                }
            }
        }

        return changed;
    }

    /**
     * Unique Rectangle (Type 1)
     * 2通りの解（デッドリーパターン）を避けるため、長方形の4マスのうち、
     * 3マスが{A, B}で1マスが{A, B, C}の場合、その1マスからA, Bを除外できる。
     */
    applyUniqueRectangleType1() {
        let changed = false;
        // ブロックの組み合わせ（水平・垂直に並ぶ2ブロックペア）
        const blockPairs = [];
        // 水平ペア
        for (let r = 0; r < 3; r++) {
            blockPairs.push([[r, 0], [r, 1]], [[r, 1], [r, 2]], [[r, 0], [r, 2]]);
        }
        // 垂直ペア
        for (let c = 0; c < 3; c++) {
            blockPairs.push([[0, c], [1, c]], [[1, c], [2, c]], [[0, c], [2, c]]);
        }

        for (const [b1, b2] of blockPairs) {
            const isHorizontal = b1[0] === b2[0];

            if (isHorizontal) {
                const rStart = b1[0] * 3;
                for (let i = 0; i < 3; i++) {
                    for (let j = i + 1; j < 3; j++) {
                        const r1 = rStart + i;
                        const r2 = rStart + j;
                        for (let c1 = b1[1] * 3; c1 < b1[1] * 3 + 3; c1++) {
                            for (let c2 = b2[1] * 3; c2 < b2[1] * 3 + 3; c2++) {
                                if (this.checkURType1(r1, c1, r1, c2, r2, c1, r2, c2)) changed = true;
                            }
                        }
                    }
                }
            } else {
                const cStart = b1[1] * 3;
                for (let i = 0; i < 3; i++) {
                    for (let j = i + 1; j < 3; j++) {
                        const c1 = cStart + i;
                        const c2 = cStart + j;
                        for (let r1 = b1[0] * 3; r1 < b1[0] * 3 + 3; r1++) {
                            for (let r2 = b2[0] * 3; r2 < b2[0] * 3 + 3; r2++) {
                                if (this.checkURType1(r1, c1, r2, c1, r1, c2, r2, c2)) changed = true;
                            }
                        }
                    }
                }
            }
        }
        return changed;
    }

    checkURType1(r1, c1, r2, c2, r3, c3, r4, c4) {
        const cells = [{ r: r1, c: c1 }, { r: r2, c: c2 }, { r: r3, c: c3 }, { r: r4, c: c4 }];
        if (cells.some(cell => this.grid[cell.r][cell.c] !== 0)) return false;

        const bivalueCells = cells.filter(cell => this.candidates[cell.r][cell.c].size === 2);
        const extraCell = cells.filter(cell => this.candidates[cell.r][cell.c].size > 2);

        if (bivalueCells.length !== 3 || extraCell.length !== 1) return false;

        const c1ands = [...this.candidates[bivalueCells[0].r][bivalueCells[0].c]];
        for (let i = 1; i < 3; i++) {
            if (!this.setsAreEqual(this.candidates[bivalueCells[0].r][bivalueCells[0].c], this.candidates[bivalueCells[i].r][bivalueCells[i].c])) return false;
        }

        const [A, B] = c1ands;
        const target = extraCell[0];
        const targetCands = this.candidates[target.r][target.c];

        if (targetCands.has(A) && targetCands.has(B)) {
            targetCands.delete(A);
            targetCands.delete(B);
            this.difficultyLog.push({ technique: 'Unique Rectangle (Type 1)', r: target.r, c: target.c, nums: [A, B] });
            return true;
        }
        return false;
    }

    /**
     * XY-Chain
     * 端点の候補の1つ（数字Xとする）が、連鎖の両端のどちらかで必ず「真」になる場合、
     * 両方の端点から見えるセルからXを削除できる。
     */
    applyXYChain() {
        let changed = false;
        const bivalueCells = [];
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                if (this.grid[r][c] === 0 && this.candidates[r][c].size === 2) {
                    bivalueCells.push({ r, c, cands: [...this.candidates[r][c]] });
                }
            }
        }

        if (bivalueCells.length < 3) return false;

        for (const startCell of bivalueCells) {
            for (const startNum of startCell.cands) {
                const otherNum = startCell.cands.find(n => n !== startNum);
                const path = [startCell];
                if (this.findXYChain(otherNum, startNum, path, bivalueCells)) {
                    const endCell = path[path.length - 1];
                    if (path.length >= 3) {
                        for (let r = 0; r < 9; r++) {
                            for (let c = 0; c < 9; c++) {
                                if (this.grid[r][c] === 0 && this.candidates[r][c].has(startNum)) {
                                    if (this.sees(r, c, startCell.r, startCell.c) && this.sees(r, c, endCell.r, endCell.c)) {
                                        if (!(r === startCell.r && c === startCell.c) && !(r === endCell.r && c === endCell.c)) {
                                            this.candidates[r][c].delete(startNum);
                                            changed = true;
                                            this.difficultyLog.push({ technique: 'XY-Chain', num: startNum, length: path.length });
                                        }
                                    }
                                }
                            }
                        }
                        if (changed) return true;
                    }
                }
            }
        }
        return changed;
    }

    findXYChain(targetNum, startNum, path, bivalueCells) {
        const currentCell = path[path.length - 1];
        for (const nextCell of bivalueCells) {
            if (path.some(p => p.r === nextCell.r && p.c === nextCell.c)) continue;

            if (this.sees(currentCell.r, currentCell.c, nextCell.r, nextCell.c)) {
                if (nextCell.cands.includes(targetNum)) {
                    const nextOtherNum = nextCell.cands.find(n => n !== targetNum);
                    path.push(nextCell);
                    if (nextOtherNum === startNum) return true;
                    if (this.findXYChain(nextOtherNum, startNum, path, bivalueCells)) return true;
                    path.pop();
                }
            }
        }
        return false;
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

// ===== メインUI側で利用するためのスタティックメソッド（同期高速生成） =====

/**
 * ユーティリティ: 配列のシャッフル
 */
SudokuLogicalSolver.shuffleArray = function (array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
};

/**
 * ユーティリティ: 配置可能な数字かチェック
 */
SudokuLogicalSolver.isValid = function (grid, row, col, num) {
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
};

/**
 * ユーティリティ: 最も候補が少ないセルを探す（バックトラッキング最適化用）
 */
SudokuLogicalSolver.findBestCell = function (grid) {
    let minCandidates = 10;
    let bestCell = null;
    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            if (grid[r][c] === 0) {
                let count = 0;
                for (let n = 1; n <= 9; n++) {
                    if (SudokuLogicalSolver.isValid(grid, r, c, n)) count++;
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
};

/**
 * ユーティリティ: 完全な盤面の生成（バックトラッキング）
 */
SudokuLogicalSolver.solveSudoku = function (grid) {
    const cell = SudokuLogicalSolver.findBestCell(grid);
    if (!cell) return true;
    if (cell.count === 0) return false;
    const { r, c } = cell;
    const numbers = SudokuLogicalSolver.shuffleArray([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    for (const num of numbers) {
        if (SudokuLogicalSolver.isValid(grid, r, c, num)) {
            grid[r][c] = num;
            if (SudokuLogicalSolver.solveSudoku(grid)) return true;
            grid[r][c] = 0;
        }
    }
    return false;
};

/**
 * ユーティリティ: 解の数を数える (上限付き)
 */
SudokuLogicalSolver.countSolutions = function (grid, limit = 2) {
    let count = 0;
    function solve(g) {
        const cell = SudokuLogicalSolver.findBestCell(g);
        if (!cell) { count++; return; }
        if (cell.count === 0) return;
        const { r, c } = cell;
        for (let num = 1; num <= 9; num++) {
            if (SudokuLogicalSolver.isValid(g, r, c, num)) {
                g[r][c] = num;
                solve(g);
                if (count >= limit) return;
                g[r][c] = 0;
            }
        }
    }
    solve(grid);
    return count;
};

/**
 * メインの高速パズル生成 (同期・Subtractive型)
 * @param {string} difficulty 'easy', 'medium', 'hard' のいずれか
 * @returns {Object} { puzzle: number[][], solution: number[][], difficulty: string }
 */
SudokuLogicalSolver.generatePuzzle = function (difficulty) {
    const diffRank = { 'basic': 1, 'easy': 2, 'medium': 3, 'hard': 4, 'unsolvable': 5 };
    const targetRank = diffRank[difficulty] || 3;
    const maxRetries = 100; // 安全のための無限ループ防止

    let bestFallback = null;

    // 万が一のためのリトライ処理（通常は1~2回で成功する）
    for (let attempts = 0; attempts < maxRetries; attempts++) {
        const grid = Array.from({ length: 9 }, () => Array(9).fill(0));
        SudokuLogicalSolver.solveSudoku(grid);

        const solution = grid.map(r => [...r]);
        const puzzle = grid.map(r => [...r]);

        // 削る順番の決定（完全ランダム）
        const cells = Array.from({ length: 81 }, (_, i) => [Math.floor(i / 9), i % 9]);
        const shuffledCells = SudokuLogicalSolver.shuffleArray(cells);

        for (const [r, c] of shuffledCells) {
            const val = puzzle[r][c];
            puzzle[r][c] = 0; // マスを削る

            // ユニーク解チェック
            if (SudokuLogicalSolver.countSolutions(puzzle.map(row => [...row]), 2) !== 1) {
                puzzle[r][c] = val; // 複数解になったら戻す
            } else {
                // 目標難易度を超えていないかチェック
                // 指定された難易度「まで」のテクニックしか使わないソルバーで判定する
                const solver = new SudokuLogicalSolver(puzzle);
                const res = solver.solve(difficulty);
                const rank = diffRank[res.solved ? res.difficulty : 'unsolvable'] || 5;

                if (rank > targetRank || !res.solved) {
                    puzzle[r][c] = val; // 目標のテクニック群だけで解けないなら戻す
                }
            }
        }

        // 81マスすべて削り終わった後の盤面が、指定した難易度と合致していれば成功
        const finalSolver = new SudokuLogicalSolver(puzzle);
        const finalRes = finalSolver.solve();

        // フォールバック用に、最後に生成成功した盤面を保存しておく（失敗しても、少なくとも解ける盤面は確保する）
        if (finalRes.solved) {
            bestFallback = {
                puzzle: puzzle,
                solution: solution,
                difficulty: finalRes.difficulty,
                technique: finalRes.technique
            };
        }

        if (finalRes.solved && finalRes.difficulty === difficulty) {
            return bestFallback;
        }
    }

    // fallback (Should not reach here under normal circumstances due to extreme effectiveness of the algorithm)
    console.warn("SudokuLogicalSolver: failed to generate perfect puzzle, returning last valid but loose constraint board.");
    if (bestFallback) return bestFallback;

    // それでもダメな場合の究極のフォールバック
    const grid = Array.from({ length: 9 }, () => Array(9).fill(0));
    SudokuLogicalSolver.solveSudoku(grid);
    return { puzzle: grid, solution: grid, difficulty: 'basic', technique: 'Naked Single' };
};
