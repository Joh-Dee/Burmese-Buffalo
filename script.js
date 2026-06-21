const IMAGE_MAP = {
    'buffalo': 'buffalo.png', 'lion': 'lion.png', 'elephant': 'elephant.png',
    'deer': 'deer.png', 'zebra': 'zebra.png', 'A': 'a.png', 'K': 'k.png',
    'Q': 'q.png', 'J': 'j.png', '10': '10.png',
    'wild': 'wild.png', 'scatter': 'scatter.png'
};

// Base Values for Normal Symbols (Wild & Scatter have 0)
const SYMBOLS = [
    { id: 'buffalo', value: 10 }, { id: 'lion', value: 8 },
    { id: 'elephant', value: 7 }, { id: 'deer', value: 5 },
    { id: 'zebra', value: 4 }, { id: 'A', value: 3 },
    { id: 'K', value: 3 }, { id: 'Q', value: 2 },
    { id: 'J', value: 2 }, { id: '10', value: 1 }
];
// IDs for checking
const NORMAL_IDS = SYMBOLS.map(s => s.id);
const WILD_ID = 'wild';
const SCATTER_ID = 'scatter';

const REELS = 5, ROWS = 4;
const TALL_ROWS = 12; 
const DELAY_BETWEEN_REELS = 200;

let grid = [];
let credit = 2000, isSpinning = false;
let freeSpins = 0; // ကျန်နေတဲ့ Free Spin အရေအတွက်
let isFreeSpin = false;
const BET = 10;

const gridElement = document.getElementById('slotGrid');
const creditDisplay = document.getElementById('creditDisplay');
const winDisplay = document.getElementById('winDisplay');
const spinBtn = document.getElementById('spinBtn');

// ----- HELPERS -----
function randomSymbol() {
    // 2% Wild (Free Spin ကာလမှာ), 4% Scatter, ကျန်တာ Normal
    const isFree = isFreeSpin;
    const wildChance = isFree ? 0.02 : 0.05; // Free: 2%, Normal: 5%
    const scatterChance = 0.04;
    
    let r = Math.random();
    if (r < wildChance) return { id: WILD_ID, value: 0 };
    if (r < wildChance + scatterChance) return { id: SCATTER_ID, value: 0 };
    
    const idx = Math.floor(Math.random() * SYMBOLS.length);
    return SYMBOLS[idx];
}

function generateGrid() {
    grid = [];
    for (let col = 0; col < REELS; col++) {
        let reel = [];
        for (let row = 0; row < ROWS; row++) reel.push(randomSymbol());
        grid.push(reel);
    }
}

// ----- RENDER -----
function renderInitialGrid() {
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
            colDiv.appendChild(cell);
        }
        gridElement.appendChild(colDiv);
    }
}

// ----- WIN LOGIC (Wild & Scatter) -----
function calculateWin() {
    let totalWin = 0;
    let highlighted = [];
    let scatterCount = 0;

    // 1. Scatter အရေအတွက် ရေတွက်မယ် (နေရာမရွေး)
    for (let col = 0; col < REELS; col++) {
        for (let row = 0; row < ROWS; row++) {
            if (grid[col][row].id === SCATTER_ID) scatterCount++;
        }
    }

    // 2. ပုံမှန် Symbol တွေအတွက် Wild နဲ့ပေါင်းပြီး ရေတွက်မယ်
    for (let sym of SYMBOLS) {
        let count = 0;
        let positions = [];

        // Reel 1 မှာ ရှိမရှိ အရင်စစ်
        let foundInReel1 = false;
        let rowPosReel1 = [];
        for (let row = 0; row < ROWS; row++) {
            const id = grid[0][row].id;
            if (id === sym.id || id === WILD_ID) {
                foundInReel1 = true;
                rowPosReel1.push({ col: 0, row });
            }
        }
        if (!foundInReel1) continue;

        positions.push(...rowPosReel1);
        count = 1;

        // Reel 2 ကနေ 5 အထိ ဆက်စစ်
        for (let col = 1; col < REELS; col++) {
            let found = false;
            let rowPos = [];
            for (let row = 0; row < ROWS; row++) {
                const id = grid[col][row].id;
                if (id === sym.id || id === WILD_ID) {
                    found = true;
                    rowPos.push({ col, row });
                }
            }
            if (found) {
                count++;
                positions.push(...rowPos);
            } else {
                break;
            }
        }

        // Minimum 3 ခုကနေ စတွက်မယ် (Buffalo ကတော့ 2 ခုကနေစမယ်)
        let minCount = (sym.id === 'buffalo') ? 2 : 3;
        if (count >= minCount) {
            // အမှတ်တွက်နည်းအသစ်: (Count  Count  Value)  0.5
            let points = (count * count * sym.value) * 0.5;
            totalWin += points;
            highlighted.push(...positions);
        }
    }

    // 3. Scatter အတွက် Free Spins ပေးမယ်
    let freeSpinReward = 0;
    if (scatterCount >= 3) {
        if (scatterCount === 3) freeSpinReward = 8;
        else if (scatterCount === 4) freeSpinReward = 12;
        else if (scatterCount >= 5) freeSpinReward = 18;
        
        // Free Spin ကာလမှာ ထပ်တိုးမပေးပါဘူး (Trigger only once)
        if (!isFreeSpin) {
            freeSpins += freeSpinReward;
        }
        // Scatter အတွက် သေးသေးလေး အမှတ်ပေးမယ်
        totalWin += scatterCount * 2;
    }

    // Highlight Scatter symbols too (optional)
    for (let col = 0; col < REELS; col++) {
        for (let row = 0; row < ROWS; row++) {
            if (grid[col][row].id === SCATTER_ID) {
                highlighted.push({ col, row });
            }
        }
    }

    return { totalWin, highlighted, freeSpinReward };
}

// ----- HIGHLIGHT -----
function applyHighlights(highlighted) {
    const columns = gridElement.querySelectorAll('.reel-column');
    highlighted.forEach(h => {
        const targetIndex = (TALL_ROWS - ROWS) + h.row;
        const targetCell = columns[h.col].children[targetIndex];
        if(targetCell) targetCell.classList.add('highlight');
    });
}

// ----- SPIN -----
function spin() {
    if (isSpinning) return;
    
    // Free Spin သုံးမလား စစ်မယ်
    if (freeSpins > 0) {
        freeSpins--;
        isFreeSpin = true;
    } else {
        isFreeSpin = false;
        if (credit < BET) {
            alert('Credit မလုံလောက်ပါ!');
            return;
        }
        credit -= BET;
        creditDisplay.textContent = credit;
    }

    isSpinning = true; 
    spinBtn.disabled = true;
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
        
        let totalWin = result.totalWin;
        
        // Free Spin ကာလမှာ အမှတ်တွေ ၂ ဆ မပေးတော့ဘူး (သင်ပြောတဲ့အတိုင်း)
        // ဒါပေမယ့် Free Spin ကာလအတွင်း ရလာတဲ့ အမှတ်ကို Credit ထဲ ထည့်မယ်
        if (totalWin > 0) {
            credit += totalWin; 
            creditDisplay.textContent = credit; 
            winDisplay.textContent = totalWin;
        }
        
        // Free Spin count ကို update လုပ်မယ် (UI မှာပြဖို့)
        // (UI မှာ Free Spin count ပြဖို့ နေရာမရှိသေးပေမယ့် logic ထဲမှာ ရှိနေပြီ)
        
        isSpinning = false; 
        spinBtn.disabled = false;
    }, (REELS * DELAY_BETWEEN_REELS) + 700);
}

// Initial Call
generateGrid();
renderInitialGrid();
spinBtn.addEventListener('click', spin);
