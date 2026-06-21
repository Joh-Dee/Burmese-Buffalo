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
const TALL_ROWS = 12; 
const DELAY_BETWEEN_REELS = 200;

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

//  ဒီနေရာမှာ ပြင်ထားပါတယ်။
function applyHighlights(highlighted) {
    const columns = gridElement.querySelectorAll('.reel-column');
    
    highlighted.forEach(h => {
        // Buffer (8 ခု) ကို ကျော်ပြီးမှ Final row တွေကို ရှာရမယ်
        // ဒါကြောင့် index = (TALL_ROWS - ROWS) + h.row ဖြစ်ရမယ်
        const targetIndex = (TALL_ROWS - ROWS) + h.row; 
        const targetCell = columns[h.col].children[targetIndex];
        
        if(targetCell) targetCell.classList.add('highlight');
    });
}

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

    generateGrid();

    gridElement.innerHTML = '';
    
    for (let col = 0; col < REELS; col++) {
        const colDiv = document.createElement('div');
        colDiv.className = 'reel-column';
        
        let finalSymbols = grid[col];
        let bufferSymbols = [];
        for (let i = 0; i < TALL_ROWS - ROWS; i++) bufferSymbols.push(randomSymbol());

        let allSymbols = [...bufferSymbols, ...finalSymbols];

        allSymbols.forEach(sym => {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.style.backgroundImage = `url('images/${IMAGE_MAP[sym.id]}')`;
            colDiv.appendChild(cell);
        });

        colDiv.style.transition = 'none';
        colDiv.style.transform = `translateY(-${((TALL_ROWS - ROWS) / TALL_ROWS) * 100}%)`;
        gridElement.appendChild(colDiv);
    }

    requestAnimationFrame(() => {
        const columns = gridElement.querySelectorAll('.reel-column');
        columns.forEach((col, i) => {
            setTimeout(() => {
                col.style.transition = 'transform 0.7s cubic-bezier(0.15, 0.9, 0.3, 1)';
                col.style.transform = 'translateY(0)';
            }, i * DELAY_BETWEEN_REELS);
        });
    });

    setTimeout(() => {
        const result = calculateWin();
        applyHighlights(result.highlighted);
        
        if (result.totalWin > 0) {
            credit += result.totalWin; 
            creditDisplay.textContent = credit; 
            winDisplay.textContent = result.totalWin;
        }
        isSpinning = false; 
        spinBtn.disabled = false;
    }, (REELS * DELAY_BETWEEN_REELS) + 700);
}

// Initial Call
generateGrid();
spinBtn.addEventListener('click', spin);
