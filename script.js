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
// ကျွန်တော်တို့က Reel ကို 15 ခုကနေ 12 ခုပဲ သုံးတော့မယ် (Overflow အတွက် လုံလောက်ပြီ)
const TALL_ROWS = 12; 
const DELAY_BETWEEN_REELS = 400;

let grid = [];
let credit = 2000, isSpinning = false;
const BET = 10;
const gridElement = document.getElementById('slotGrid');
const creditDisplay = document.getElementById('creditDisplay');
const winDisplay = document.getElementById('winDisplay');
const spinBtn = document.getElementById('spinBtn');

function randomSymbol() { return SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]; }

// ----- 1. ကြိုတွက်ထားတဲ့ Final Grid -----
function generateGrid() {
    grid = [];
    for (let col = 0; col < REELS; col++) {
        let reel = [];
        for (let row = 0; row < ROWS; row++) reel.push(randomSymbol());
        grid.push(reel);
    }
}

// ----- 2. Static Render -----
function renderGrid(highlighted = []) {
    gridElement.innerHTML = '';
    for (let col = 0; col < REELS; col++) {
        const colDiv = document.createElement('div');
        colDiv.className = 'reel-column';
        colDiv.style.transition = 'none'; 
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

// ----- WIN LOGIC -----
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

// ----- 3. ပြဿနာ ၂ ခုလုံးကို ဖြေရှင်းမယ့် Core Logic -----
function spin() {
    if (isSpinning || credit < BET) { 
        if(credit < BET) alert('Credit မလုံလောက်ပါ!'); 
        return; 
    }
    
    isSpinning = true; spinBtn.disabled = true;
    credit -= BET; creditDisplay.textContent = credit; winDisplay.textContent = '0';

    // STEP 1: Final Result ကို ကြိုတွက်ပါ
    generateGrid();

    // STEP 2: အောက်ဆုံး 4 rows ကို Final Result အတိုင်း ရောက်အောင် Reel ကို ဖန်တီးပါ
    gridElement.innerHTML = '';
    
    for (let col = 0; col < REELS; col++) {
        const colDiv = document.createElement('div');
        colDiv.className = 'reel-column';
        colDiv.style.transition = 'none'; 
        
        // STEP 2a: ဒီ Reel အတွက် အောက်ဆုံး 4 ခုကို Final Grid ကနေ ယူပါ
        let finalSymbols = grid[col];

        // STEP 2b: အပေါ်ကို ဖြည့်မယ့် Buffer Symbol တွေ (8 ခု)
        let bufferSymbols = [];
        for (let i = 0; i < TALL_ROWS - ROWS; i++) {
            bufferSymbols.push(randomSymbol());
        }

        // STEP 2c: Reel ထဲကို ထည့်မယ့် Symbol စုစုပေါင်း (Buffer + Final)
        let allSymbols = [...bufferSymbols, ...finalSymbols];

        // STEP 2d: Cell တွေ ဆောက်မယ်
        allSymbols.forEach(sym => {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.style.backgroundImage = `url('images/${IMAGE_MAP[sym.id]}')`;
            colDiv.appendChild(cell);
        });

        // STEP 2e: Offset တွက်မယ်။ Buffer 8 ခုကို ကျော်ပြီး Final 4 ခု ပေါ်လာအောင်
        // Buffer 8 ခု = 8 * 25% = 200% ကို အပေါ်ကို တင်ထားမယ်။
        const offsetPercent = - ((TALL_ROWS - ROWS) * 25);
        colDiv.style.transform = `translateY(${offsetPercent}%)`; 

        gridElement.appendChild(colDiv);
    }

    // Force reflow
    gridElement.offsetHeight;

    // STEP 3: Staggered Animation (Reel 1 to Reel 5)
    let currentReel = 0;
    const columns = gridElement.querySelectorAll('.reel-column');
    
    const animInterval = setInterval(() => {
        const col = columns[currentReel];
        // Smooth transition နဲ့ အောက်ကို ကျစေမယ်
        col.style.transition = `transform 0.7s cubic-bezier(0.15, 0.9, 0.3, 1)`;
        col.style.transform = `translateY(0)`;

        currentReel++;
        if (currentReel >= REELS) {
            clearInterval(animInterval);
            
            // STEP 4: Animation ပြီးရင် Highlight ပြမယ်
            setTimeout(() => {
                const result = calculateWin();
                renderGrid(result.highlighted);
                
                if (result.totalWin > 0) {
                    credit += result.totalWin; 
                    creditDisplay.textContent = credit; 
                    winDisplay.textContent = result.totalWin;
                }
                isSpinning = false; 
                spinBtn.disabled = false;
            }, 800);
        }
    }, DELAY_BETWEEN_REELS);
}

// Initial Load
generateGrid();
renderGrid([]);
spinBtn.addEventListener('click', spin);
