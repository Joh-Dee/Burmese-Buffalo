// ----- CONFIG -----
const IMAGE_MAP = {
    'buffalo': 'buffalo.png',
    'lion': 'lion.png',
    'elephant': 'elephant.png',
    'deer': 'deer.png',
    'zebra': 'zebra.png',
    'A': 'a.png',
    'K': 'k.png',
    'Q': 'q.png',
    'J': 'j.png',
    '10': '10.png'
};

const SYMBOLS = [
    { id: 'buffalo', value: 10 },
    { id: 'lion', value: 8 },
    { id: 'elephant', value: 7 },
    { id: 'deer', value: 5 },
    { id: 'zebra', value: 4 },
    { id: 'A', value: 3 },
    { id: 'K', value: 3 },
    { id: 'Q', value: 2 },
    { id: 'J', value: 2 },
    { id: '10', value: 1 },
];

const REELS = 5;
const ROWS = 4;
let grid = [];
let credit = 2000;
const BET = 10;
let isSpinning = false;

const gridElement = document.getElementById('slotGrid');
const creditDisplay = document.getElementById('creditDisplay');
const winDisplay = document.getElementById('winDisplay');
const spinBtn = document.getElementById('spinBtn');

// ----- HELPERS -----
function randomSymbol() {
    return SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
}

function generateGrid() {
    grid = [];
    for (let col = 0; col < REELS; col++) {
        let reel = [];
        for (let row = 0; row < ROWS; row++) {
            reel.push(randomSymbol());
        }
        grid.push(reel);
    }
}

// Render with Images
function renderGrid(highlighted = []) {
    gridElement.innerHTML = '';
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < REELS; col++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            const sym = grid[col][row];
            // Create IMG tag
            const img = document.createElement('img');
            img.src = `images/${IMAGE_MAP[sym.id]}`;
            img.alt = sym.id;
            cell.appendChild(img);

            if (highlighted.some(h => h.col === col && h.row === row)) {
                cell.classList.add('highlight');
            }
            gridElement.appendChild(cell);
        }
    }
}

// ----- WIN LOGIC -----
function calculateWin() {
    let totalWin = 0;
    let highlighted = [];

    for (let sym of SYMBOLS) {
        let count = 0;
        let positions = [];
        for (let col = 0; col < REELS; col++) {
            let foundInThisReel = false;
            let rowPos = [];
            for (let row = 0; row < ROWS; row++) {
                if (grid[col][row].id === sym.id) {
                    foundInThisReel = true;
                    rowPos.push({ col, row });
                }
            }
            if (foundInThisReel) {
                count++;
                positions.push(...rowPos);
            } else {
                break;
            }
        }

        if (count >= 2) {
            let points = count * count * sym.value;
            totalWin += points;
            highlighted.push(...positions);
        }
    }
    return { totalWin, highlighted };
}

// ----- COLUMN-BY-COLUMN SPIN + BOUNCE -----
function spin() {
    if (isSpinning) return;
    if (credit < BET) {
        alert('Credit မလုံလောက်ပါ!');
        return;
    }

    isSpinning = true;
    spinBtn.disabled = true;
    credit -= BET;
    creditDisplay.textContent = credit;
    winDisplay.textContent = '0';

    // 1. Generate final result first
    generateGrid();
    
    // 2. Animate Reel 1 to Reel 5 stopping one by one (2 seconds total)
    // 2 seconds / 5 reels = 0.4s delay per reel
    let revealedCols = 0;
    const totalCols = REELS;
    
    // Clear grid
    gridElement.innerHTML = '';

    // Add empty cells initially
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < REELS; col++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            // Add placeholder background
            cell.style.background = '#2a1506';
            gridElement.appendChild(cell);
        }
    }

    const stopInterval = setInterval(() => {
        // Reveal current column (colIndex)
        const colIndex = revealedCols;
        
        // Update DOM for this column
        const allCells = gridElement.querySelectorAll('.cell');
        for (let row = 0; row < ROWS; row++) {
            // Calculate index in flat list (Row-major: row * REELS + col)
            const index = row * REELS + colIndex;
            const cell = allCells[index];
            const sym = grid[colIndex][row];
            
            // Create and append image
            const img = document.createElement('img');
            img.src = `images/${IMAGE_MAP[sym.id]}`;
            img.alt = sym.id;
            cell.innerHTML = '';
            cell.style.background = '#fdf5e6';
            cell.appendChild(img);

            //  Apply BOUNCE effect using CSS keyframes added via class
            cell.style.animation = 'none';
            cell.offsetHeight; // Trigger reflow
            cell.style.animation = `bounceIn 0.4s cubic-bezier(0.68, -0.55, 0.27, 1.55) forwards`;
        }

        revealedCols++;
        if (revealedCols >= totalCols) {
            clearInterval(stopInterval);
            
            // 3. Calculate & Show Win after all reels stop
            const result = calculateWin();
            renderGrid(result.highlighted); // Re-render with highlights
            
            if (result.totalWin > 0) {
                credit += result.totalWin;
                creditDisplay.textContent = credit;
                winDisplay.textContent = result.totalWin;
            } else {
                winDisplay.textContent = '0';
            }
            
            isSpinning = false;
            spinBtn.disabled = false;
        }
    }, 400); // 0.4s delay between each reel
}

// ----- BOUNCE KEYFRAMES (Inject via JS to keep CSS clean) -----
const styleSheet = document.createElement("style");
styleSheet.textContent = `
    @keyframes bounceIn {
        0% { transform: scale(0.5) translateY(-30px); opacity: 0; }
        60% { transform: scale(1.1) translateY(5px); opacity: 1; }
        80% { transform: scale(0.95) translateY(-3px); }
        100% { transform: scale(1) translateY(0); }
    }
`;
document.head.appendChild(styleSheet);

// ----- INIT -----
generateGrid();
renderGrid([]);
spinBtn.addEventListener('click', spin);
