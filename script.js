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

// ----- ROLLING ANIMATION (အပေါ်ကနေ အောက်ကို ကျလာတာ) -----
function spin() {
    if (isSpinning || credit < BET) { 
        if(credit < BET) alert('Credit မလုံလောက်ပါ!'); 
        return; 
    }
    
    isSpinning = true; spinBtn.disabled = true;
    credit -= BET; creditDisplay.textContent = credit; winDisplay.textContent = '0';

    // 1. Generate the final grid first
    generateGrid();

    // 2. Create the "Tall Reel" for animation
    gridElement.innerHTML = '';
    
    // Create 5 columns (Reels)
    for (let col = 0; col < REELS; col++) {
        const columnDiv = document.createElement('div');
        columnDiv.className = 'reel-col';
        columnDiv.style.cssText = `
            display: flex; flex-direction: column; width: 100%; gap: 6px;
            position: relative;
        `;
        
        // Create 15 cells tall for smooth scrolling
        for (let i = 0; i < 15; i++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            const sym = randomSymbol();
            cell.style.backgroundImage = `url('images/${IMAGE_MAP[sym.id]}')`;
            columnDiv.appendChild(cell);
        }

        // Calculate random stop offset (0 to 10, so 4 rows remain visible at bottom)
        const stopIndex = Math.floor(Math.random() * 11);
        // Move UP by 100% * stopIndex so it slides DOWN to reveal final rows
        columnDiv.style.transform = `translateY(-${stopIndex * 100}%)`;
        columnDiv.style.transition = 'none';
        
        gridElement.appendChild(columnDiv);
    }

    // Force reflow
    gridElement.offsetHeight;

    // Start animation: Reel 1 -> Reel 5 sequentially
    let currentReel = 0;
    const columns = gridElement.querySelectorAll('.reel-col');
    
    const animInterval = setInterval(() => {
        const col = columns[currentReel];
        // Ease-out: Starts fast, slows down at the end
        col.style.transition = 'transform 0.6s cubic-bezier(0.15, 0.9, 0.3, 1)';
        col.style.transform = 'translateY(0)'; // Slide down to final position

        currentReel++;
        if (currentReel >= REELS) {
            clearInterval(animInterval);
            
            // Wait for animation to finish, then show final grid with highlights
            setTimeout(() => {
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

// Initial Render
generateGrid();
renderGrid([]);
spinBtn.addEventListener('click', spin);
