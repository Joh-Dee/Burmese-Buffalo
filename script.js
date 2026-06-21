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

const REELS = 5, ROWS = 4;
let grid = [];
let credit = 2000, isSpinning = false;
const BET = 10;
const gridElement = document.getElementById('slotGrid');
const creditDisplay = document.getElementById('creditDisplay');
const winDisplay = document.getElementById('winDisplay');
const spinBtn = document.getElementById('spinBtn');

function randomSymbol() { return SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]; }

function generateGrid() {
    grid = [];
    for (let col = 0; col < REELS; col++) {
        let reel = [];
        for (let row = 0; row < ROWS; row++) reel.push(randomSymbol());
        grid.push(reel);
    }
}

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

function spin() {
    if (isSpinning || credit < BET) { 
        if(credit < BET) alert('Credit မလုံလောက်ပါ!'); 
        return; 
    }
    
    isSpinning = true; spinBtn.disabled = true;
    credit -= BET; creditDisplay.textContent = credit; winDisplay.textContent = '0';

    generateGrid();
    
    // Clear grid to show rolling animation
    gridElement.innerHTML = '';

    // Create tall columns (15 items high) for sliding effect
    for (let col = 0; col < REELS; col++) {
        const colWrapper = document.createElement('div');
        colWrapper.className = 'reel-column';
        colWrapper.style.display = 'flex';
        colWrapper.style.flexDirection = 'column';
        colWrapper.style.width = '100%';
        colWrapper.style.gap = '6px'; // Match grid gap

        // Generate 15 items (far more than visible 4)
        let reelItems = [];
        for (let i = 0; i < 15; i++) {
            const sym = randomSymbol();
            reelItems.push(sym);
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.style.width = '100%';
            cell.style.aspectRatio = '1 / 1.1';
            cell.style.backgroundImage = `url('images/${IMAGE_MAP[sym.id]}')`;
            colWrapper.appendChild(cell);
        }

        // Random stop position (Ensure we have 4 rows left at the bottom)
        const stopIndex = Math.floor(Math.random() * 11); // 0 to 10
        
        // Set initial transform to push the reel UP so it slides down
        // Each cell is roughly 110% height of container / 4
        // We want the item at 'stopIndex' to end up at the top.
        // So we slide down by (stopIndex * cellHeight)
        colWrapper.style.transform = `translateY(-${stopIndex * 110}%)`;
        colWrapper.style.transition = 'none'; // No transition for initial state
        gridElement.appendChild(colWrapper);
    }

    // Force reflow to apply initial state
    gridElement.offsetHeight;

    // Animate columns 1 to 5 sequentially
    let currentReel = 0;
    const columns = gridElement.querySelectorAll('.reel-column');
    
    const animInterval = setInterval(() => {
        const col = columns[currentReel];
        // Apply ease-out transition
        col.style.transition = 'transform 0.6s cubic-bezier(0.25, 0.1, 0.25, 1)';
        col.style.transform = 'translateY(0)'; // Slide down to final position

        currentReel++;
        if (currentReel >= REELS) {
            clearInterval(animInterval);
            
            // After animation finishes, extract the visible 4 rows for final result
            setTimeout(() => {
                // We need to rebuild the 'grid' based on what is now visible at the top
                // But we already generated 'grid' at the start of spin()!
                // So we just render the static grid with highlights.
                const result = calculateWin();
                renderGrid(result.highlighted);
                
                if (result.totalWin > 0) {
                    credit += result.totalWin; creditDisplay.textContent = credit; winDisplay.textContent = result.totalWin;
                }
                isSpinning = false; spinBtn.disabled = false;
            }, 700);
        }
    }, 400);
}

// Initial Grid
generateGrid();
renderGrid([]);
spinBtn.addEventListener('click', spin);
