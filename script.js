// American Buffalo Slot Machine - 4 Reels x 5 Rows Version
// Pure Vanilla JS Implementation

(function() {
    // ---------- CONSTANTS & DOM REFS ----------
    const ROWS = 5;          // Changed from 4 to 5
    const COLS = 4;          // Changed from 5 to 4
    const TALL_ROWS = 13;    // 8 buffer + 5 visible (8+5=13)
    const SYMBOL_SIZE_PERCENT = 100 / TALL_ROWS;
    const VISIBLE_HEIGHT_PERCENT = SYMBOL_SIZE_PERCENT * ROWS;

    // Symbols definition with base values
    const SYMBOLS = {
        buffalo: { base: 10, minCount: 2 },
        lion:    { base: 8,  minCount: 3 },
        elephant:{ base: 7,  minCount: 3 },
        deer:    { base: 5,  minCount: 3 },
        zebra:   { base: 4,  minCount: 3 },
        a:       { base: 3,  minCount: 3 },
        k:       { base: 3,  minCount: 3 },
        q:       { base: 2,  minCount: 3 },
        j:       { base: 2,  minCount: 3 },
        ten:     { base: 1,  minCount: 2, id: '10' },
        wild:    { base: 0,  minCount: 0, isWild: true },
        scatter: { base: 0,  minCount: 0, isScatter: true }
    };

    const NORMAL_SYMBOLS = ['buffalo', 'lion', 'elephant', 'deer', 'zebra', 'a', 'k', 'q', 'j', 'ten'];

    // Base weights for random generation
    const BASE_WEIGHTS = {
        buffalo: 8, lion: 8, elephant: 8, deer: 10, zebra: 10,
        a: 12, k: 12, q: 15, j: 15, ten: 20, wild: 5, scatter: 5
    };

    // DOM Elements
    const reelsContainer = document.getElementById('reels-container');
    const highlightsContainer = document.getElementById('highlights-container');
    const spinButton = document.getElementById('spin-button');
    const creditDisplay = document.getElementById('credit-display');
    const winDisplay = document.getElementById('win-display');
    const freeDisplay = document.getElementById('free-display');
    const winPopup = document.getElementById('win-popup');
    const popupMessage = document.getElementById('popup-message');

    // Game State
    let credits = 1000;
    let bet = 10;
    let currentGrid = [];          // 4x5 final symbols [col][row]
    let isSpinning = false;
    let freeSpinsRemaining = 0;
    let totalWin = 0;
    let animationTimeouts = [];
    let currentReelStrips = [];    // 4 tall strips

    // ---------- INITIALIZATION ----------
    function init() {
        createReelStructure();
        createHighlightsStructure();
        updateUI();
        // Generate initial random grid for display
        currentGrid = generateRandomGrid(false);
        renderInitialGrid();
    }

    function createReelStructure() {
        reelsContainer.innerHTML = '';
        for (let c = 0; c < COLS; c++) {
            const reelDiv = document.createElement('div');
            reelDiv.className = 'reel';
            reelDiv.id = `reel-${c}`;
            
            const innerDiv = document.createElement('div');
            innerDiv.className = 'reel-inner';
            innerDiv.id = `reel-inner-${c}`;
            
            // Create TALL_ROWS symbol cells (8 buffer + 5 visible = 13)
            for (let r = 0; r < TALL_ROWS; r++) {
                const cell = document.createElement('div');
                cell.className = 'symbol-cell';
                cell.dataset.reel = c;
                cell.dataset.row = r;
                innerDiv.appendChild(cell);
            }
            
            reelDiv.appendChild(innerDiv);
            reelsContainer.appendChild(reelDiv);
        }
    }

    function createHighlightsStructure() {
        highlightsContainer.innerHTML = '';
        for (let c = 0; c < COLS; c++) {
            const colDiv = document.createElement('div');
            colDiv.className = 'highlight-column';
            colDiv.id = `highlight-col-${c}`;
            highlightsContainer.appendChild(colDiv);
        }
    }

    function renderInitialGrid() {
        // Build tall strips for initial view (no animation, just set final position)
        for (let c = 0; c < COLS; c++) {
            const strip = buildTallStrip(currentGrid, c);
            currentReelStrips[c] = strip;
            updateReelDOM(c, strip);
            setReelPosition(c, 0); // final position
        }
        clearHighlights();
    }

    // ---------- REEL STRIP BUILDING ----------
    function buildTallStrip(finalGrid, colIndex) {
        // Generate buffer symbols (TALL_ROWS - ROWS = 8 buffer)
        const strip = [];
        for (let i = 0; i < TALL_ROWS - ROWS; i++) {
            strip.push(getRandomSymbol(false));
        }
        // Add final grid symbols for this column (ROWS = 5)
        for (let r = 0; r < ROWS; r++) {
            strip.push(finalGrid[colIndex][r]);
        }
        return strip;
    }

    function getRandomSymbol(isFreeSpin) {
        const weights = { ...BASE_WEIGHTS };
        if (isFreeSpin) {
            // Reduce wild probability to 2%
            weights.wild = 2;
        }
        const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
        let random = Math.random() * totalWeight;
        for (const [symbol, weight] of Object.entries(weights)) {
            random -= weight;
            if (random <= 0) {
                return symbol;
            }
        }
        return 'ten';
    }

    function generateRandomGrid(isFreeSpin) {
        const grid = [];
        for (let c = 0; c < COLS; c++) {
            const col = [];
            for (let r = 0; r < ROWS; r++) {
                col.push(getRandomSymbol(isFreeSpin));
            }
            grid.push(col);
        }
        return grid;
    }

    // ---------- DOM UPDATE FOR REEL ----------
    function updateReelDOM(colIndex, strip) {
        const inner = document.getElementById(`reel-inner-${colIndex}`);
        const cells = inner.children;
        for (let i = 0; i < TALL_ROWS; i++) {
            const symbol = strip[i];
            const imgName = symbol === 'ten' ? '10.png' : `${symbol}.png`;
            cells[i].style.backgroundImage = `url('images/${imgName}')`;
        }
    }

    function setReelPosition(colIndex, translateYPercent) {
        const inner = document.getElementById(`reel-inner-${colIndex}`);
        inner.style.transition = 'none';
        inner.style.transform = `translateY(${translateYPercent}%)`;
    }

    // ---------- ANIMATION ENGINE ----------
    function animateReels(finalGrid, isFreeSpinMode, callback) {
        // Build tall strips for animation
        const strips = [];
        for (let c = 0; c < COLS; c++) {
            strips.push(buildTallStrip(finalGrid, c));
            currentReelStrips[c] = strips[c];
            updateReelDOM(c, strips[c]);
            // Start position: hidden above (translateY negative)
            // Buffer rows count = TALL_ROWS - ROWS = 8
            const startPercent = -1 * (SYMBOL_SIZE_PERCENT * (TALL_ROWS - ROWS));
            setReelPosition(c, startPercent);
        }

        // Staggered drop with 200ms delay (4 reels)
        const delays = [0, 200, 400, 600];  // 4 delays for 4 reels
        const animationDuration = 800; // ms for each reel drop

        // Clear previous timeouts
        animationTimeouts.forEach(t => clearTimeout(t));
        animationTimeouts = [];

        let completedReels = 0;
        
        for (let c = 0; c < COLS; c++) {
            const timeoutId = setTimeout(() => {
                const inner = document.getElementById(`reel-inner-${c}`);
                // Apply transition
                inner.style.transition = `transform ${animationDuration}ms cubic-bezier(0.15, 0.9, 0.3, 1)`;
                inner.style.transform = `translateY(0%)`;
                
                // Listen for transition end on last reel
                if (c === COLS - 1) {
                    const onTransitionEnd = () => {
                        inner.removeEventListener('transitionend', onTransitionEnd);
                        completedReels++;
                        if (completedReels === 1) {
                            // Animation complete
                            handleSpinComplete(finalGrid, isFreeSpinMode, callback);
                        }
                    };
                    inner.addEventListener('transitionend', onTransitionEnd);
                }
            }, delays[c]);
            animationTimeouts.push(timeoutId);
        }
    }

    // ---------- WIN EVALUATION (1024 Ways with 4 columns) ----------
    function evaluateWins(grid) {
        const wins = [];
        
        // Count scatters anywhere
        let scatterPositions = [];
        for (let c = 0; c < COLS; c++) {
            for (let r = 0; r < ROWS; r++) {
                if (grid[c][r] === 'scatter') {
                    scatterPositions.push({ col: c, row: r });
                }
            }
        }
        
        if (scatterPositions.length >= 3) {
            wins.push({
                symbol: 'scatter',
                count: scatterPositions.length,
                positions: scatterPositions,
                baseValue: 0
            });
        }

        // Evaluate normal symbols left to right (4 columns)
        const normalSymbols = ['buffalo', 'lion', 'elephant', 'deer', 'zebra', 'a', 'k', 'q', 'j', 'ten'];
        
        for (const sym of normalSymbols) {
            const symConfig = SYMBOLS[sym];
            const minCount = symConfig.minCount;
            let consecutiveCount = 0;
            let positions = [];
            let stopEvaluation = false;
            
            for (let c = 0; c < COLS; c++) {
                if (stopEvaluation) break;
                
                let colHasSymbol = false;
                let colPositions = [];
                
                for (let r = 0; r < ROWS; r++) {
                    const cellSymbol = grid[c][r];
                    if (cellSymbol === sym || cellSymbol === 'wild') {
                        colHasSymbol = true;
                        colPositions.push({ col: c, row: r });
                    }
                }
                
                if (colHasSymbol) {
                    consecutiveCount++;
                    positions.push(...colPositions);
                } else {
                    if (consecutiveCount >= minCount) {
                        break;
                    } else {
                        consecutiveCount = 0;
                        positions = [];
                        stopEvaluation = true;
                    }
                }
            }
            
            if (consecutiveCount >= minCount) {
                const validPositions = positions.filter(p => p.col < consecutiveCount);
                wins.push({
                    symbol: sym,
                    count: consecutiveCount,
                    positions: validPositions,
                    baseValue: symConfig.base
                });
            }
        }
        
        return wins;
    }

    function calculateWinAmount(wins) {
        let total = 0;
        for (const win of wins) {
            if (win.symbol === 'scatter') {
                total += win.count * 2;
            } else {
                total += (win.count * win.count * win.baseValue) * 0.5;
            }
        }
        return Math.floor(total);
    }

    // ---------- HIGHLIGHT SYSTEM ----------
    function showHighlights(wins) {
        clearHighlights();
        
        for (const win of wins) {
            for (const pos of win.positions) {
                const colDiv = document.getElementById(`highlight-col-${pos.col}`);
                const cell = document.createElement('div');
                cell.className = 'highlight-cell';
                // Calculate top position based on row index (ROWS = 5)
                const topPercent = pos.row * (100 / ROWS);
                cell.style.top = `${topPercent}%`;
                cell.style.height = `${100 / ROWS}%`;
                colDiv.appendChild(cell);
            }
        }
    }

    function clearHighlights() {
        for (let c = 0; c < COLS; c++) {
            const colDiv = document.getElementById(`highlight-col-${c}`);
            if (colDiv) colDiv.innerHTML = '';
        }
    }

    // ---------- SPIN COMPLETE HANDLER ----------
    function handleSpinComplete(finalGrid, isFreeSpinMode, callback) {
        const wins = evaluateWins(finalGrid);
        const winAmount = calculateWinAmount(wins);
        
        totalWin = winAmount;
        
        if (wins.length > 0) {
            showHighlights(wins);
        }
        
        let newFreeSpins = 0;
        for (const win of wins) {
            if (win.symbol === 'scatter') {
                if (win.count === 3) newFreeSpins = 8;
                else if (win.count === 4) newFreeSpins = 12;
                else if (win.count === 5) newFreeSpins = 18;
            }
        }
        
        if (isFreeSpinMode) {
            freeSpinsRemaining--;
            if (newFreeSpins > 0) {
                freeSpinsRemaining += newFreeSpins;
                showPopup(`+${newFreeSpins} FREE SPINS!`);
            }
            credits += winAmount;
        } else {
            credits -= bet;
            credits += winAmount;
            if (newFreeSpins > 0) {
                freeSpinsRemaining += newFreeSpins;
                showPopup(`${newFreeSpins} FREE SPINS TRIGGERED!`);
            }
        }
        
        updateUI();
        
        if (freeSpinsRemaining > 0 && !isFreeSpinMode) {
            setTimeout(() => {
                startFreeSpins();
            }, 1500);
        } else if (freeSpinsRemaining > 0 && isFreeSpinMode) {
            setTimeout(() => {
                executeFreeSpin();
            }, 1000);
        } else {
            isSpinning = false;
            spinButton.disabled = false;
            if (freeSpinsRemaining === 0 && isFreeSpinMode) {
                showPopup("FREE SPINS ENDED");
            }
        }
        
        if (callback) callback();
    }

    function startFreeSpins() {
        if (freeSpinsRemaining > 0) {
            executeFreeSpin();
        }
    }

    function executeFreeSpin() {
        if (freeSpinsRemaining <= 0) {
            isSpinning = false;
            spinButton.disabled = false;
            updateUI();
            return;
        }
        
        isSpinning = true;
        spinButton.disabled = true;
        clearHighlights();
        
        const finalGrid = generateRandomGrid(true);
        currentGrid = finalGrid;
        
        animateReels(finalGrid, true, () => {});
    }

    // ---------- SPIN ACTION ----------
    function spin() {
        if (isSpinning) return;
        if (freeSpinsRemaining > 0) return;
        if (credits < bet) {
            showPopup("NOT ENOUGH CREDITS!");
            return;
        }
        
        isSpinning = true;
        spinButton.disabled = true;
        clearHighlights();
        totalWin = 0;
        updateUI();
        
        const finalGrid = generateRandomGrid(false);
        currentGrid = finalGrid;
        
        animateReels(finalGrid, false, null);
    }

    // ---------- UI HELPERS ----------
    function updateUI() {
        creditDisplay.textContent = credits;
        winDisplay.textContent = totalWin;
        freeDisplay.textContent = freeSpinsRemaining;
    }

    function showPopup(message) {
        popupMessage.textContent = message;
        winPopup.classList.remove('hidden');
        setTimeout(() => {
            winPopup.classList.add('hidden');
        }, 2000);
    }

    // ---------- EVENT LISTENERS ----------
    spinButton.addEventListener('click', spin);

    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space' && !isSpinning) {
            e.preventDefault();
            spin();
        }
    });

    // Start the game
    init();
})();
