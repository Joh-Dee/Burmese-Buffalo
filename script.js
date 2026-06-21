const IMAGE_MAP = {
    'buffalo': 'buffalo.png', 'lion': 'lion.png', 'elephant': 'elephant.png',
    'deer': 'deer.png', 'zebra': 'zebra.png', 'A': 'a.png', 'K': 'k.png',
    'Q': 'q.png', 'J': 'j.png', '10': '10.png'
};

const SYMBOLS = [
    { id: 'buffalo', value: 10 }, { id: 'lion', value: 8 },
    { id: 'elephant', value: 7 }, { id: 'deer', value: 5 },
    { id: 'zebra', value: 4 }, { id: 'A', value: 3 },
    { id: 'K', value: 3 }, { id: 'Q', value: 2 },
    { id: 'J', value: 2 }, { id: '10', value: 1 },
];

const REELS = 5;
const ROWS = 4;
const TOTAL_SYMBOLS_PER_REEL = 15; // သင်ပြောတဲ့အတိုင်း ၁၅ ခု

let grid = [];        // Final result (4 rows visible)
let reelStates = [];  // Stores the full 15-symbol array for each reel
let credit = 2000;
const BET = 10;
let isSpinning = false;

const gridElement = document.getElementById('slotGrid');
const creditDisplay = document.getElementById('creditDisplay');
const winDisplay = document.getElementById('winDisplay');
const spinBtn = document.getElementById('spinBtn');

// ----- HELPERS -----
function randomSymbol() { return SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]; }

// Generate a full reel of 15 symbols
function generateReel() {
    let reel = [];
    for (let i = 0; i < TOTAL_SYMBOLS_PER_REEL; i++) {
        reel.push(randomSymbol());
    }
    return reel;
}

// ----- WIN LOGIC (Based on final visible grid) -----
function calculateWin() {
    let totalWin = 0, highlighted = [];
    for (let sym of SYMBOLS) {
        let count = 0, positions = [];
        for (let col = 0; col < REELS; col++) {
            let found = false, rowPos = [];
            for (let row = 0; row < ROWS; row++) {
                if (grid[col][row].id === sym.id) { found = true; rowPos.push({ col, row }); }
            }
            if (found) { count++; positions.push(...rowPos); } else break;
        }
        if (count >= 2) {
            totalWin += count * count * sym.value;
            highlighted.push(...positions);
        }
    }
    return { totalWin, highlighted };
}

// ----- RENDER (Static) -----
function renderGrid(highlighted = []) {
    gridElement.innerHTML = '';
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < REELS; col++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            const sym = grid[col][row];
            cell.style.backgroundImage = `url('images/${IMAGE_MAP[sym.id]}')`;
            if (highlighted.some(h => h.col === col && h.row === row)) cell.classList.add('highlight');
            gridElement.appendChild(cell);
        }
    }
}

// ----- SPIN (True Rolling Animation) -----
function spin() {
    if (isSpinning || credit < BET) { 
        if(credit < BET) alert('Credit မလုံလောက်ပါ!'); 
        return; 
    }
    
    isSpinning = true;
    spinBtn.disabled = true;
    credit -= BET;
    creditDisplay.textContent = credit;
    winDisplay.textContent = '0';

    // 1. Generate new full reels (15 symbols each)
    let fullReels = [];
    for (let col = 0; col < REELS; col++) {
        fullReels.push(generateReel());
    }

    // 2. Determine the final visible 4 rows (random start index 0 to 11)
    let startIndices = [];
    for (let col = 0; col < REELS; col++) {
        // Start index ensures we have at least 4 symbols below it
        startIndices.push(Math.floor(Math.random() * (TOTAL_SYMBOLS_PER_REEL - ROWS + 1)));
    }

    // 3. Build the final grid for logic
    grid = [];
    for (let col = 0; col < REELS; col++) {
        let visible = [];
        for (let row = 0; row < ROWS; row++) {
            visible.push(fullReels[col][startIndices[col] + row]);
        }
        grid.push(visible);
    }

    // 4. ANIMATION: Use CSS transform to slide from top
    gridElement.innerHTML = '';
    
    // Build the tall columns (15 symbols each)
    for (let col = 0; col < REELS; col++) {
        const columnDiv = document.createElement('div');
        columnDiv.className = 'reel-column';
        columnDiv.style.display = 'flex';
        columnDiv.style.flexDirection = 'column';
        columnDiv.style.width = '100%';
        columnDiv.style.height = '100%';
        columnDiv.style.gap = '6px'; // Match grid gap

        for (let i = 0; i < TOTAL_SYMBOLS_PER_REEL; i++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.style.width = '100%';
            // Height is auto-controlled by aspect-ratio in grid, but we need to enforce it here
            cell.style.aspectRatio = '1 / 1.1'; 
            cell.style.backgroundImage = `url('images/${IMAGE_MAP[fullReels[col][i].id]}')`;
            columnDiv.appendChild(cell);
        }
        
        // Set initial top position to hide the reel (pushed up)
        // We want to slide down so the 4 visible rows end up at the correct spot.
        // We need to calculate the offset.
        // The container height is 4 rows.
        // The 15 rows are taller. We want the startIndex row to align with the top.
        // So we push the column UP by (startIndex) * (cellHeight + gap)
        // Since we use CSS grid, we can't easily slide inside grid easily, 
        // so we use flex + translateY inside a fixed height wrapper.
        columnDiv.style.transform = `translateY(-${startIndices[col] * 110}%)`; // Approximate height based on cell ratio
        
        gridElement.appendChild(columnDiv);
    }

    // Force layout and start animation for each column (Reel 1 to 5)
    let currentReel = 0;
    const totalReels = REELS;
    
    // We will apply transition to each column sequentially
    const animInterval = setInterval(() => {
        const colDiv = gridElement.children[currentReel];
        // Apply Ease-Out animation (slow down at end)
        // Formula: target offset = 0 (since we start at negative, slide down to 0)
        // But we want the final visible rows to be at the top. 
        // Since we pushed UP by startIndex * height, we slide DOWN to 0.
        // Wait, we need to slide to align the startIndex row at top.
        // The offset from top: startIndex * (cellHeight + gap)
        // Since grid gap is 6px, and cell aspect-ratio is 1/1.1, we approximate.
        // For perfect alignment, we calculate in JS.
        // But to keep it simple and use Ease-Out, we transition translateY to 0.
        // But we need to start from (-startIndex * 110%) and end at 0.
        
        // To fix visual alignment: We will use a simpler method.
        // We will animate the `marginTop` or `transform` to bring it down.
        // Let's recalculate exact pixels.
        // Since it's easier: we set final transform to 0.
        // But we must ensure the first visible item matches the startIndex.
        // So we set transform: `translateY(-${startIndices[currentReel] * (100/ROWS)}%)` initially, then animate to 0.
        
        // Re-calculate logic: 
        // We have 15 items. 4 are visible. 
        // If startIndex = 5, we want item #5 at top.
        // Item height = 100% / 4 = 25% of container.
        // Translate Y = -(startIndex * 25%).
        // Final pos = 0.
        // But easier: we just slide from top by using a wrapper.
        
        // Let's use a simpler proven way:
        // We'll just use `transform: translateY(-${(startIndices[currentReel] * 25)}%)` as start.
        // Then transition to `translateY(0)` with ease-out.
        
        const col = gridElement.children[currentReel];
        col.style.transition = 'transform 0.6s cubic-bezier(0.25, 0.1, 0.25, 1)'; // Ease-out
        col.style.transform = 'translateY(0)';

        currentReel++;
        if (currentReel >= totalReels) {
            clearInterval(animInterval);
            
            // After animation finishes, convert to static grid for highlights
            setTimeout(() => {
                // Clear the column layout and render final grid
                const result = calculateWin();
                renderGrid(result.highlighted); // This converts back to standard grid with highlights
                
                if (result.totalWin > 0) {
                    credit += result.totalWin;
                    creditDisplay.textContent = credit;
                    winDisplay.textContent = result.totalWin;
                } else {
                    winDisplay.textContent = '0';
                }
                isSpinning = false;
                spinBtn.disabled = false;
            }, 700); // Wait for ease-out to finish
        }
    }, 400); // Delay between reels
}

// ----- INIT -----
// Initial dummy grid
grid = [];
for (let col = 0; col < REELS; col++) {
    let reel = [];
    for (let row = 0; row < ROWS; row++) reel.push(randomSymbol());
    grid.push(reel);
}
renderGrid([]);
spinBtn.addEventListener('click', spin);
