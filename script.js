(function() {
    // ========== CONFIGURATION: 4 REELS x 5 ROWS ==========
    const ROWS = 5;                    // Visible rows: 5
    const COLS = 4;                    // Reels: 4
    const BUFFER_ROWS = 8;             // Hidden buffer rows above
    const TALL_ROWS = BUFFER_ROWS + ROWS; // Total rows per reel: 13
    
    // Symbol values and minimum counts
    const SYMBOLS = {
        buffalo:  { base: 10, minCount: 2 },
        lion:     { base: 8,  minCount: 3 },
        elephant: { base: 7,  minCount: 3 },
        deer:     { base: 5,  minCount: 3 },
        zebra:    { base: 4,  minCount: 3 },
        a:        { base: 3,  minCount: 3 },
        k:        { base: 3,  minCount: 3 },
        q:        { base: 2,  minCount: 3 },
        j:        { base: 2,  minCount: 3 },
        ten:      { base: 1,  minCount: 2 },
        wild:     { base: 0,  minCount: 0, isWild: true },
        scatter:  { base: 0,  minCount: 0, isScatter: true }
    };

    const NORMAL_SYMBOLS = ['buffalo', 'lion', 'elephant', 'deer', 'zebra', 'a', 'k', 'q', 'j', 'ten'];
    
    const BASE_WEIGHTS = {
        buffalo: 8, lion: 8, elephant: 8, deer: 10, zebra: 10,
        a: 12, k: 12, q: 15, j: 15, ten: 20, wild: 5, scatter: 5
    };

    // DOM elements
    const reelsContainer = document.getElementById('reels-container');
    const highlightsContainer = document.getElementById('highlights-container');
    const spinButton = document.getElementById('spin-button');
    const creditDisplay = document.getElementById('credit-display');
    const winDisplay = document.getElementById('win-display');
    const freeDisplay = document.getElementById('free-display');
    const winPopup = document.getElementById('win-popup');
    const popupMessage = document.getElementById('popup-message');

    // Game state
    let credits = 1000;
    let bet = 10;
    let currentGrid = [];          // [col][row]
    let isSpinning = false;
    let freeSpinsRemaining = 0;
    let totalWin = 0;
    let animationTimeouts = [];

    // ========== INITIALIZATION ==========
    function init() {
        createReelStructure();
        createHighlightsStructure();
        currentGrid = generateRandomGrid(false);
        renderInitialGrid();
        updateUI();
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
            
            // Create exactly TALL_ROWS (13) cells
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
        // Set cell heights AFTER DOM is created
        setCellHeights();
    }

    function setCellHeights() {
        // Each reel height is divided by ROWS (5) for visible area
        // But inner has TALL_ROWS (13), so each cell = reelHeight / ROWS
        const reels = document.querySelectorAll('.reel');
        reels.forEach(reel => {
            const reelHeight = reel.clientHeight;
            const cellHeight = reelHeight / ROWS; // visible row height
            const cells = reel.querySelectorAll('.symbol-cell');
            cells.forEach(cell => {
                cell.style.height = cellHeight + 'px';
            });
        });
        // Recalculate reel-inner total height
        const inners = document.querySelectorAll('.reel-inner');
        inners.forEach(inner => {
            const reelHeight = inner.parentElement.clientHeight;
            const cellHeight = reelHeight / ROWS;
            inner.style.height = (cellHeight * TALL_ROWS) + 'px';
        });
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
        for (let c = 0; c < COLS; c++) {
            const strip = buildTallStrip(currentGrid, c, false);
            updateReelDOM(c, strip);
            setReelPosition(c, -1 * (BUFFER_ROWS / ROWS * 100));
            // Animate to final position immediately
            requestAnimationFrame(() => {
                const inner = document.getElementById(`reel-inner-${c}`);
                inner.style.transition = 'transform 0.3s ease-out';
                inner.style.transform = `translateY(${-1 * (BUFFER_ROWS / ROWS * 100)}%)`;
            });
        }
        clearHighlights();
    }

    // Handle window resize
    window.addEventListener('resize', () => {
        setCellHeights();
        // Re-apply positions
        for (let c = 0; c < COLS; c++) {
            const inner = document.getElementById(`reel-inner-${c}`);
            if (inner) {
                inner.style.transition = 'none';
                inner.style.transform = `translateY(${-1 * (BUFFER_ROWS / ROWS * 100)}%)`;
            }
        }
    });

    // ========== REEL STRIP BUILDING ==========
    function buildTallStrip(finalGrid, colIndex, isFreeSpin) {
        const strip = [];
        // Buffer symbols (8 random)
        for (let i = 0; i < BUFFER_ROWS; i++) {
            strip.push(getRandomSymbol(isFreeSpin));
        }
        // Final grid symbols (5 visible)
        for (let r = 0; r < ROWS; r++) {
            strip.push(finalGrid[colIndex][r]);
        }
        return strip;
    }

    function getRandomSymbol(isFreeSpin) {
        const weights = { ...BASE_WEIGHTS };
        if (isFreeSpin) {
            weights.wild = 2; // Reduced wild probability
        }
        const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
        let random = Math.random() * totalWeight;
        for (const [symbol, weight] of Object.entries(weights)) {
            random -= weight;
            if (random <= 0) return symbol;
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

    // ========== DOM UPDATE ==========
    function updateReelDOM(colIndex, strip) {
        const inner = document.getElementById(`reel-inner-${colIndex}`);
        if (!inner) return;
        const cells = inner.children;
        for (let i = 0; i < TALL_ROWS && i < cells.length; i++) {
            const symbol = strip[i];
            const imgName = symbol === 'ten' ? '10.png' : `${symbol}.png`;
            cells[i].style.backgroundImage = `url('images/${imgName}')`;
        }
    }

    function setReelPosition(colIndex, translateYPercent) {
        const inner = document.getElementById(`reel-inner-${colIndex}`);
        if (!inner) return;
        inner.style.transition = 'none';
        inner.style.transform = `translateY(${translateYPercent}%)`;
    }

    // ========== ANIMATION ENGINE ==========
    function animateReels(finalGrid, isFreeSpinMode, callback) {
        const strips = [];
        for (let c = 0; c < COLS; c++) {
            strips.push(buildTallStrip(finalGrid, c, isFreeSpinMode));
            updateReelDOM(c, strips[c]);
            // Start position: buffer rows hidden above
            // translateY = -(bufferRows / ROWS * 100)%
            const startPercent = -1 * (BUFFER_ROWS / ROWS * 100);
            setReelPosition(c, startPercent);
        }

        // Staggered delays for 4 reels
        const delays = [0, 200, 400, 600];
        const animationDuration = 800;

        animationTimeouts.forEach(t => clearTimeout(t));
        animationTimeouts = [];

        // Target position: buffer rows still hidden, visible rows show
        const targetPercent = -1 * (BUFFER_ROWS / ROWS * 100);
        
        for (let c = 0; c < COLS; c++) {
            const timeoutId = setTimeout(() => {
                const inner = document.getElementById(`reel-inner-${c}`);
                if (!inner) return;
                
                // First, jump to start (hidden above target)
                inner.style.transition = 'none';
                const startAbove = targetPercent - 100; // completely above
                inner.style.transform = `translateY(${startAbove}%)`;
                
                // Force reflow
                inner.offsetHeight;
                
                // Then animate down to target
                inner.style.transition = `transform ${animationDuration}ms cubic-bezier(0.15, 0.9, 0.3, 1)`;
                inner.style.transform = `translateY(${targetPercent}%)`;
                
                if (c === COLS - 1) {
                    const onTransitionEnd = () => {
                        inner.removeEventListener('transitionend', onTransitionEnd);
                        handleSpinComplete(finalGrid, isFreeSpinMode, callback);
                    };
                    inner.addEventListener('transitionend', onTransitionEnd);
                }
            }, delays[c]);
            animationTimeouts.push(timeoutId);
        }
    }

    // ========== WIN EVALUATION ==========
    function evaluateWins(grid) {
        const wins = [];
        
        // Scatters anywhere
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

        // Normal symbols left to right
        const normalSymbols = ['buffalo', 'lion', 'elephant', 'deer', 'zebra', 'a', 'k', 'q', 'j', 'ten'];
        
        for (const sym of normalSymbols) {
            const symConfig = SYMBOLS[sym];
            const minCount = symConfig.minCount;
            let consecutiveCount = 0;
            let positions = [];
            
            for (let c = 0; c < COLS; c++) {
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
                    break; // Must be consecutive from reel 1
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

    // ========== HIGHLIGHT SYSTEM ==========
    function showHighlights(wins) {
        clearHighlights();
        const reelHeight = document.querySelector('.reel')?.clientHeight || 0;
        const cellHeight = reelHeight / ROWS;
        
        for (const win of wins) {
            for (const pos of win.positions) {
                const colDiv = document.getElementById(`highlight-col-${pos.col}`);
                if (!colDiv) continue;
                const cell = document.createElement('div');
                cell.className = 'highlight-cell';
                cell.style.top = (pos.row * cellHeight) + 'px';
                cell.style.height = cellHeight + 'px';
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

    // ========== SPIN COMPLETE HANDLER ==========
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
            setTimeout(() => startFreeSpins(), 1500);
        } else if (freeSpinsRemaining > 0 && isFreeSpinMode) {
            setTimeout(() => executeFreeSpin(), 1000);
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
        if (freeSpinsRemaining > 0) executeFreeSpin();
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
        currentGrid = generateRandomGrid(true);
        animateReels(currentGrid, true, null);
    }

    // ========== SPIN ACTION ==========
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
        currentGrid = generateRandomGrid(false);
        animateReels(currentGrid, false, null);
    }

    // ========== UI HELPERS ==========
    function updateUI() {
        creditDisplay.textContent = credits;
        winDisplay.textContent = totalWin;
        freeDisplay.textContent = freeSpinsRemaining;
    }

    function showPopup(message) {
        popupMessage.textContent = message;
        winPopup.classList.remove('hidden');
        setTimeout(() => winPopup.classList.add('hidden'), 2000);
    }

    // ========== EVENT LISTENERS ==========
    spinButton.addEventListener('click', spin);
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space' && !isSpinning) {
            e.preventDefault();
            spin();
        }
    });

    // Start
    init();
})();
