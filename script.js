const IMAGE_MAP = {
    'buffalo': 'buffalo.png', 'lion': 'lion.png', 'elephant': 'elephant.png',
    'deer': 'deer.png', 'zebra': 'zebra.png', 'A': 'a.png', 'K': 'k.png',
    'Q': 'q.png', 'J': 'j.png', '10': '10.png',
    'wild': 'wild.png', 'scatter': 'scatter.png'
};

const SYMBOLS = [
    { id: 'buffalo', value: 10 }, { id: 'lion', value: 8 },
    { id: 'elephant', value: 7 }, { id: 'deer', value: 5 },
    { id: 'zebra', value: 4 }, { id: 'A', value: 3 },
    { id: 'K', value: 3 }, { id: 'Q', value: 2 },
    { id: 'J', value: 2 }, { id: '10', value: 1 }
];

const WILD_ID = 'wild';
const SCATTER_ID = 'scatter';

const REELS = 5, ROWS = 4;
const TALL_ROWS = 12; 
const DELAY_BETWEEN_REELS = 200;

let grid = [];
let credit = 2000, isSpinning = false;
let freeSpins = 0;
let isFreeSpin = false;
const BET = 10;

const gridElement = document.getElementById('slotGrid');
const creditDisplay = document.getElementById('creditDisplay');
const winDisplay = document.getElementById('winDisplay');
const freeSpinDisplay = document.getElementById('freeSpinDisplay');
const spinBtn = document.getElementById('spinBtn');

// ----- HELPERS -----
function randomSymbol() {
    const isFree = isFreeSpin;
    const wildChance = isFree ? 0.02 : 0.05;
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

// ----- RENDER (Initial + Final) -----
function renderGrid(highlighted = []) {
    gridElement.innerHTML = '';
    for (let col = 0; col < REELS; col++) {
        const colDiv = document.createElement('div');
        colDiv.className = 'reel-column';
        colDiv.style.display = 'flex';
        colDiv.style.flexDirection = 'column';
        colDiv.style.width = '100%';
        colDiv.style.gap = '4px'; // Must match CSS grid gap

        for (let row = 0; row < ROWS; row++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            const sym = grid[col][row];
            const img = document.createElement('img');
            img.src = `images/${IMAGE_MAP[sym.id]}`;
            img.alt = sym.id;
            cell.appendChild(img);
            
            if (highlighted.some(h => h.col === col && h.row === row)) {
                cell.classList.add('highlight');
            }
            colDiv.appendChild(cell);
        }
        gridElement.appendChild(colDiv);
    }
}

// ----- WIN LOGIC -----
function calculateWin() {
    let totalWin = 0;
    let highlighted = [];
    let scatterCount = 0;

    for (let col = 0; col < REELS; col++) {
        for (let row = 0; row < ROWS; row++) {
            if (grid[col][row].id === SCATTER_ID) scatterCount++;
        }
    }

    for (let sym of SYMBOLS) {
        let count = 0;
        let positions = [];

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

        let minCount = (sym.id === 'buffalo' || sym.id === '10') ? 2 : 3;
        if (count >= minCount) {
            let points = (count * count * sym.value) * 0.5;
            totalWin += points;
            highlighted.push(...positions);
        }
    }

    let freeSpinReward = 0;
    if (scatterCount >= 3) {
        if (scatterCount === 3) freeSpinReward = 8;
        else if (scatterCount === 4) freeSpinReward = 12;
        else if (scatterCount >= 5) freeSpinReward = 18;
        
        if (!isFreeSpin) {
            freeSpins += freeSpinReward;
        }
        totalWin += scatterCount * 2;
    }

    // Highlight Scatters too
    for (let col = 0; col < REELS; col++) {
        for (let row = 0; row < ROWS; row++) {
            if (grid[col][row].id === SCATTER_ID) {
                highlighted.push({ col, row });
            }
        }
    }

    return { totalWin, highlighted, freeSpinReward, scatterCount };
}

// ----- SPIN -----
function spin() {
    if (isSpinning) return;
    
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
    spinBtn.style.opacity = '0.5';
    winDisplay.textContent = '0';
    freeSpinDisplay.textContent = freeSpins;

    generateGrid();

    gridElement.innerHTML = '';
    
    for (let col = 0; col < REELS; col++) {
        const colDiv = document.createElement('div');
        colDiv.className = 'reel-column';
        colDiv.style.display = 'flex';
        colDiv.style.flexDirection = 'column';
        colDiv.style.width = '100%';
        colDiv.style.gap = '4px';
        
        let finalSymbols = grid[col];
        let bufferSymbols = [];
        for (let i = 0; i < TALL_ROWS - ROWS; i++) bufferSymbols.push(randomSymbol());

        let allSymbols = [...bufferSymbols, ...finalSymbols];

        allSymbols.forEach(sym => {
            const cell = document.createElement('div');
            cell.className = 'cell';
            const img = document.createElement('img');
            img.src = `images/${IMAGE_MAP[sym.id]}`;
            img.alt = sym.id;
            cell.appendChild(img);
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

    const totalAnimationTime = (REELS * DELAY_BETWEEN_REELS) + 700;
    
    setTimeout(() => {
        const result = calculateWin();
        
        // Re-render with final static grid + highlights
        renderGrid(result.highlighted);
        
        let totalWin = result.totalWin;
        
        if (totalWin > 0) {
            credit += totalWin; 
            creditDisplay.textContent = credit; 
            winDisplay.textContent = totalWin;
        }

        if (result.scatterCount >= 3) {
            alert(` Scatter ${result.scatterCount} ခု! Free Spin ${result.freeSpinReward} ကြိမ် ရပါတယ်!`);
        }

        freeSpinDisplay.textContent = freeSpins;

        isSpinning = false; 
        spinBtn.disabled = false;
        spinBtn.style.opacity = '1';
        
    }, totalAnimationTime);
}

// Initial Load
generateGrid();
renderGrid([]);
spinBtn.addEventListener('click', spin);
