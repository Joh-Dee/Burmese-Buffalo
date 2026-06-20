* { box-sizing: border-box; font-family: 'Segoe UI', sans-serif; }
body { background: #1a0a00; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; }
.game-container { 
    background: #3d1a00; 
    padding: 20px; 
    border-radius: 20px; 
    box-shadow: 0 0 30px #ff9900aa; 
    max-width: 900px;
    width: 100%;
    border: 4px solid #b87333;
}
.header { 
    display: flex; 
    justify-content: space-between; 
    background: #2a0a00; 
    padding: 10px 20px; 
    border-radius: 30px; 
    color: #ffd700; 
    font-weight: bold; 
    font-size: 18px;
    border: 2px solid #b87333;
    margin-bottom: 15px;
}
.slot-grid {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 6px;
    background: #ffd700;
    padding: 12px;
    border-radius: 15px;
    border: 4px solid #b87333;
    background-image: linear-gradient(45deg, #ffc107, #ff9800);
}
.cell {
    aspect-ratio: 1/1.2;
    background: #fff8e7;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 32px;
    font-weight: bold;
    color: #333;
    box-shadow: inset 0 0 0 2px #cc9900;
    transition: 0.2s;
    border: 2px solid #b87333;
}
.cell.highlight { background: #ffeb3b; box-shadow: 0 0 20px #ffeb3b; transform: scale(1.05); border: 2px solid #ff0000; }

/* Character colors */
.buffalo { color: #5d4037; text-shadow: 0 0 8px #8d6e63; }
.lion { color: #d84315; text-shadow: 0 0 8px #ff7043; }
.elephant { color: #4e342e; text-shadow: 0 0 8px #78909c; }
.deer { color: #bf8f00; text-shadow: 0 0 8px #ffca28; }
.zebra { color: #1a1a1a; text-shadow: 0 0 8px #bdbdbd; }
.card { color: #1565c0; text-shadow: 0 0 8px #64b5f6; }

.controls {
    display: flex;
    justify-content: space-between;
    margin-top: 15px;
    gap: 10px;
    flex-wrap: wrap;
}
button {
    padding: 12px 24px;
    border: none;
    border-radius: 30px;
    font-size: 18px;
    font-weight: bold;
    cursor: pointer;
    background: #ff9800;
    color: #fff;
    box-shadow: 0 4px 0 #b86e00;
    transition: 0.1s;
    flex: 1;
    min-width: 100px;
}
button:active { transform: translateY(4px); box-shadow: none; }
button.spin { background: #4caf50; box-shadow: 0 4px 0 #2e7d32; }
button.spin:disabled { background: #9e9e9e; box-shadow: 0 4px 0 #616161; cursor: not-allowed; }
.info { display: flex; align-items: center; gap: 20px; background: #2a0a00; padding: 5px 20px; border-radius: 30px; color: #ffd700; }
.info span { font-size: 20px; font-weight: bold; }
.credit-box { background: #1a0a00; padding: 5px 15px; border-radius: 20px; border: 1px solid #ffd700; }

@media (max-width: 600px) {
    .cell { font-size: 20px; }
    .header { font-size: 14px; flex-wrap: wrap; }
}
