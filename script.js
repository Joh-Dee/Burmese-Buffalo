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
const TALL_ROWS = 15;

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

// Final Render (4 rows only)
function renderGrid(highlighted = []) {
    gridElement.innerHTML = '';
    for (let col = 0; col < REELS; col++) {
        const colDiv = document.createElement('div');
        colDiv.className = 'reel-column';
        for (let row = 0; row < ROWS; row++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            const sym = grid[col][row];
            cell.style.backgroundImage = `url('images/${IMAGE_MAP[sym.id]}')`;
            if (highlighted.some(h => h.col === col && h.row === row)) cell.classList.add('highlight');
            colDiv.appendChild(cell);
        }
        gridElement.appendChild(colDiv);
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

// ----- SPIN (Correct Sequential Logic) -----
function spin() {
    if (isSpinning || credit < BET) { 
        if(credit < BET) alert('Credit မလုံလောက်ပါ!'); 
        return; 
    }
    
    isSpinning = true; spinBtn.disabled = true;
    credit -= BET; creditDisplay.textContent = credit; winDisplay.textContent = '0';

    // 1. Set the CSS variable for cell height so CSS can calculate fixed height correctly
    // We use a temporary cell to measure height
    const tempCell = document.createElement('div');
    tempCell.className = 'cell';
    tempCell.style.visibility = 'hidden';
    document.body.appendChild(tempCell);
    const cellHeight = tempCell.offsetHeight;
    document.body.removeChild(tempCell);
    gridElement.style.setProperty('--cell-height', cellHeight + 'px');

    // 2. Generate final result first
    generateGrid();

    // 3. Build Tall Columns (15 symbols) for animation
    gridElement.innerHTML = '';
    let stopIndices = [];

    for (let col = 0; col < REELS; col++) {
        const colDiv = document.createElement('div');
        colDiv.className = 'reel-column';
        
        let tallSymbols = [];
        for (let i = 0; i < TALL_ROWS; i++) tallSymbols.push(randomSymbol());

        // Random stop position (ensure 4 visible rows remain)
        const stopIdx = Math.floor(Math.random() * (TALL_ROWS - ROWS + 1));
        stopIndices.push(stopIdx);

        tallSymbols.forEach(sym => {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.style.backgroundImage = `url('images/${IMAGE_MAP[sym.id]}')`;
            colDiv.appendChild(cell);
        });

        // Calculate offset: Since 4 rows = 100% height, each row is 25%
        const offsetPercent = - (stopIdx * 25);
        
        // Set initial state (Hidden above viewport) with NO transition
        colDiv.style.transform = `translateY(${offsetPercent}%)`;
        colDiv.style.transition = 'none';

        gridElement.appendChild(colDiv);
    }

    // Force browser reflow to apply initial state
    gridElement.offsetHeight;

    // 4. Animate columns 1 to 5 sequentially (Reel 1 -> Reel 5)
    let currentReel = 0;
    const columns = gridElement.querySelectorAll('.reel-column');
    const delayBetweenReels = 400; // 0.4 seconds
    
    const animInterval = setInterval(() => {
        const col = columns[currentReel];
        // Apply Ease-out transition to slide DOWN to final position
        col.style.transition = 'transform 0.7s cubic-bezier(0.15, 0.9, 0.3, 1)';
        col.style.transform = 'translateY(0)';

        currentReel++;
        if (currentReel >= REELS) {
            clearInterval(animInterval);
            
            // 5. After ALL animations finish, render final static grid with highlights
            setTimeout(() => {
                const result = calculateWin();
                renderGrid(result.highlighted);
                
                if (result.totalWin > 0) {
                    credit += result.totalWin; creditDisplay.textContent = credit; winDisplay.textContent = result.totalWin;
                }
                isSpinning = false; spinBtn.disabled = false;
            }, 800); // Wait for the last reel to fully settle
        }
    }, delayBetweenReels);
}

// Initial Load
generateGrid();
renderGrid([]);
spinBtn.addEventListener('click', spin);
