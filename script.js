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
const TALL_ROWS = 15; // သင်ပြောတဲ့အတိုင်း ၁၅ ခု

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

// ----- FINAL RESULT RENDER (4 Rows) -----
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

// ----- SPIN (True Rolling) -----
function spin() {
    if (isSpinning || credit < BET) { 
        if(credit < BET) alert('Credit မလုံလောက်ပါ!'); 
        return; 
    }
    
    isSpinning = true; spinBtn.disabled = true;
    credit -= BET; creditDisplay.textContent = credit; winDisplay.textContent = '0';

    // 1. Generate final result for logic
    generateGrid();

    // 2. Build Tall Columns (15 symbols)
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

        // Create cells
        tallSymbols.forEach(sym => {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.style.backgroundImage = `url('images/${IMAGE_MAP[sym.id]}')`;
            colDiv.appendChild(cell);
        });

        // Move column UP by (stopIdx * (100/ROWS)%) 
        // since 4 rows = 100% height, each row is 25%
        const offsetPercent = - (stopIdx * 25);
        colDiv.style.transform = `translateY(${offsetPercent}%)`;
        colDiv.style.transition = 'none';

        gridElement.appendChild(colDiv);
    }

    // Force reflow to set initial state
    gridElement.offsetHeight;

    // 3. Animate columns 1 to 5 sequentially (Ease-out)
    let currentReel = 0;
    const columns = gridElement.querySelectorAll('.reel-column');
    
    const animInterval = setInterval(() => {
        const col = columns[currentReel];
        // Ease-out cubic-bezier
        col.style.transition = 'transform 0.7s cubic-bezier(0.15, 0.9, 0.3, 1)';
        col.style.transform = 'translateY(0)'; // Slide DOWN to final position

        currentReel++;
        if (currentReel >= REELS) {
            clearInterval(animInterval);
            
            // 4. After animation, show final 4-row grid with highlights
            setTimeout(() => {
                const result = calculateWin();
                renderGrid(result.highlighted);
                
                if (result.totalWin > 0) {
                    credit += result.totalWin; creditDisplay.textContent = credit; winDisplay.textContent = result.totalWin;
                }
                isSpinning = false; spinBtn.disabled = false;
            }, 800); // Wait for animation to fully stop
        }
    }, 450); // 0.45s delay between reels
}

// Initial Render
generateGrid();
renderGrid([]);
spinBtn.addEventListener('click', spin);
