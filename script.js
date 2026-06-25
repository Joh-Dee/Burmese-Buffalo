(function() {
    // ========== CONFIGURATION: 4 REELS (columns) x 5 ROWS ==========
    const COLS = 4;    // 4 reels (columns)
    const ROWS = 5;    // 5 rows visible
    const BUFFER_ROWS = 8;
    const TALL_ROWS = BUFFER_ROWS + ROWS; // 13 total in strip
    
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

    const BASE_WEIGHTS = {
        buffalo: 8, lion: 8, elephant: 8, deer: 10, zebra: 10,
        a: 12, k: 12, q: 15, j: 15, ten: 20, wild: 5, scatter: 5
    };

    const reelsContainer = document.getElementById('reels-container');
    const highlightsContainer = document.getElementById('highlights-container');
    const spinButton = document.getElementById('spin-button');
    const creditDisplay = document.getElementById('credit-display');
    const winDisplay = document.getElementById('win-display');
    const freeDisplay = document.getElementById('free-display');
    const winPopup = document.getElementById('win-popup');
    const popupMessage = document.getElementById('popup-message');

    let credits = 1000;
    let bet = 10;
    let currentGrid = []; // [col][row] - 4 cols x 5 rows
    let isSpinning = false;
    let freeSpinsRemaining = 0;
    let totalWin = 0;
    let animationTimeouts = [];

    // ========== INITIALIZATION ==========
    function init() {
        createReelStructure();
        createHighlightsStructure();
        currentGrid = generateRandomGrid(false);
        updateUI();
        
        // Wait for DOM to render, then set dimensions and render symbols
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                setCellDimensions();
                renderAllReels();
            });
        });
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

    function setCellDimensions() {
        const reels = document.querySelectorAll('.reel');
        reels.forEach(reel => {
            const reelHeight = reel.clientHeight;
            if (reelHeight <= 0) return;
            
            // Each visible row takes 1/ROWS of the reel height
            const cellHeight = Math.floor(reelHeight / ROWS);
            const cells = reel.querySelectorAll('.symbol-cell');
            cells.forEach(cell => {
                cell.style.height = cellHeight + 'px';
                cell.style.lineHeight = cellHeight + 'px';
            });
            
            // Inner container total height
            const inner = reel.querySelector('.reel-inner');
            if (inner) {
                inner.style.height = (cellHeight * TALL_ROWS) + 'px';
            }
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

    function renderAllReels() {
        for (let c = 0; c < COLS; c++) {
            const strip = buildTallStrip(currentGrid, c, false);
            updateReelDOM(c, strip);
            // Set final position (buffer rows hidden above)
            const cellHeight = getCellHeight();
            if (cellHeight > 0) {
                const translateY = -(BUFFER_ROWS * cellHeight);
                setReelPosition(c, translateY);
            }
        }
        clearHighlights();
    }

    function getCellHeight() {
        const reel = document.querySelector('.reel');
        if (!reel) return 0;
        return Math.floor(reel.clientHeight / ROWS);
    }

    // Handle resize
    window.addEventListener('resize', () => {
        setCellDimensions();
        const cellHeight = getCellHeight();
        if (cellHeight > 0) {
            const translateY = -(BUFFER_ROWS * cellHeight);
            for (let c = 0; c < COLS; c++) {
                const inner = document.getElementById(`reel-inner-${c}`);
                if (inner) {
                    inner.style.transition = 'none';
                    inner.style.transform = `translateY(${translateY}px)`;
                }
            }
        }
    });

    // ========== REEL STRIP BUILDING ==========
    function buildTallStrip(finalGrid, colIndex, isFreeSpin) {
        const strip = [];
        // 8 buffer symbols
        for (let i = 0; i < BUFFER_ROWS; i++) {
            strip.push(getRandomSymbol(isFreeSpin));
        }
        // 5 visible symbols from final grid
        for (let r = 0; r < ROWS; r++) {
            strip.push(finalGrid[colIndex][r]);
        }
        return strip;
    }

    function getRandomSymbol(isFreeSpin) {
        const weights = { ...BASE_WEIGHTS };
        if (isFreeSpin) {
            weights.wild = 2;
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

    function setReelPosition(colIndex, translateYPx) {
        const inner = document.getElementById(`reel-inner-${colIndex}`);
        if (!inner) return;
        inner.style.transition = 'none';
        inner.style.transform = `translateY(${translateYPx}px)`;
    }

    // ========== ANIMATION ENGINE ==========
    function animateReels(finalGrid, isFreeSpinMode, callback) {
        setCellDimensions();
        
        const cellHeight = getCellHeight();
        const strips = [];
        const targetY = -(BUFFER_ROWS * cellHeight); // Final position in pixels
        const startY = targetY - (cellHeight * ROWS * 2); // Start well above
        
        for (let c = 0; c < COLS; c++) {
            strips.push(buildTallStrip(finalGrid, c, isFreeSpinMode));
            updateReelDOM(c, strips[c]);
            setReelPosition(c, startY);
        }

        const delays = [0, 200, 400, 600];
        const animationDuration = 800;

        animationTimeouts.forEach(t => clearTimeout(t));
        animationTimeouts = [];

        for (let c = 0; c < COLS; c++) {
            const timeoutId = setTimeout(() => {
                const inner = document.getElementById(`reel-inner-${c}`);
                if (!inner) return;
                
                // Force reflow
                void inner.offsetHeight;
                
                // Animate drop
                inner.style.transition = `transform ${animationDuration}ms cubic-bezier(0.15, 0.9, 0.3, 1)`;
                inner.style.transform = `translateY(${targetY}px)`;
                
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
                    break;
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
        const reelEl = document.querySelector('.reel');
        if (!reelEl) return;
        const cellHeight = getCellHeight();
        if (cellHeight <= 0) return;
        
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

    init();
})();
