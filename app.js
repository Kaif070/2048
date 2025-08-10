class Game2048 {
    constructor() {
        this.board = Array(4).fill(null).map(() => Array(4).fill(0));
        this.score = 0;
        this.best = localStorage.getItem('best-score') || 0;
        this.gameWon = false;
        this.gameOver = false;
        this.tileContainer = document.getElementById('tileContainer');
        this.scoreElement = document.getElementById('score');
        this.bestElement = document.getElementById('best');
        
        this.init();
    }
    
    init() {
        // Initialize game board with 2 random tiles
        this.addRandomTile();
        this.addRandomTile();
        this.updateDisplay();
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            if (this.gameOver && !document.getElementById('modalOverlay').classList.contains('show')) return;
            
            switch(e.key) {
                case 'ArrowUp':
                case 'w':
                case 'W':
                    e.preventDefault();
                    this.move('up');
                    break;
                case 'ArrowDown':
                case 's':
                case 'S':
                    e.preventDefault();
                    this.move('down');
                    break;
                case 'ArrowLeft':
                case 'a':
                case 'A':
                    e.preventDefault();
                    this.move('left');
                    break;
                case 'ArrowRight':
                case 'd':
                case 'D':
                    e.preventDefault();
                    this.move('right');
                    break;
            }
        });
        
        // Touch controls for mobile
        let startX, startY;
        const gameContainer = document.querySelector('.game-container');
        
        gameContainer.addEventListener('touchstart', (e) => {
            if (this.gameOver && !document.getElementById('modalOverlay').classList.contains('show')) return;
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
            e.preventDefault();
        });
        
        gameContainer.addEventListener('touchend', (e) => {
            if (this.gameOver && !document.getElementById('modalOverlay').classList.contains('show')) return;
            if (!startX || !startY) return;
            
            const endX = e.changedTouches[0].clientX;
            const endY = e.changedTouches[0].clientY;
            
            const diffX = startX - endX;
            const diffY = startY - endY;
            
            // Minimum swipe distance
            if (Math.abs(diffX) < 30 && Math.abs(diffY) < 30) return;
            
            if (Math.abs(diffX) > Math.abs(diffY)) {
                // Horizontal swipe
                if (diffX > 0) {
                    this.move('left');
                } else {
                    this.move('right');
                }
            } else {
                // Vertical swipe
                if (diffY > 0) {
                    this.move('up');
                } else {
                    this.move('down');
                }
            }
            
            startX = null;
            startY = null;
            e.preventDefault();
        });
        
        // Restart button
        document.getElementById('restartButton').addEventListener('click', () => {
            this.restart();
        });
        
        // Modal controls
        document.getElementById('playAgainBtn').addEventListener('click', () => {
            this.hideModal();
            this.restart();
        });
        
        document.getElementById('shareScoreBtn').addEventListener('click', () => {
            this.shareScore();
        });
    }
    
    addRandomTile() {
        const emptyCells = [];
        for (let row = 0; row < 4; row++) {
            for (let col = 0; col < 4; col++) {
                if (this.board[row][col] === 0) {
                    emptyCells.push([row, col]);
                }
            }
        }
        
        if (emptyCells.length === 0) return false;
        
        const randomIndex = Math.floor(Math.random() * emptyCells.length);
        const [row, col] = emptyCells[randomIndex];
        this.board[row][col] = Math.random() < 0.9 ? 2 : 4;
        
        return true;
    }
    
    move(direction) {
        const previousBoard = this.board.map(row => [...row]);
        const previousScore = this.score;
        
        let moved = false;
        
        switch(direction) {
            case 'left':
                moved = this.moveLeft();
                break;
            case 'right':
                moved = this.moveRight();
                break;
            case 'up':
                moved = this.moveUp();
                break;
            case 'down':
                moved = this.moveDown();
                break;
        }
        
        // Only proceed if tiles actually moved
        if (!moved) return;
        
        // Add new tile after successful move
        this.addRandomTile();
        this.updateDisplay();
        
        // Check for win condition (2048 tile reached)
        if (!this.gameWon && this.hasWon()) {
            this.gameWon = true;
            setTimeout(() => {
                this.showEndGameModal('You Win!', true);
            }, 500);
            return;
        }
        
        // Check for game over
        if (this.isGameOver()) {
            this.gameOver = true;
            setTimeout(() => {
                this.showEndGameModal('Game Over!', false);
            }, 500);
        }
    }
    
    moveLeft() {
        let moved = false;
        for (let row = 0; row < 4; row++) {
            const line = this.board[row].filter(cell => cell !== 0);
            const newLine = [];
            let i = 0;
            
            while (i < line.length) {
                if (i < line.length - 1 && line[i] === line[i + 1]) {
                    // Merge tiles
                    newLine.push(line[i] * 2);
                    this.score += line[i] * 2;
                    i += 2;
                } else {
                    newLine.push(line[i]);
                    i++;
                }
            }
            
            // Fill remaining cells with zeros
            while (newLine.length < 4) {
                newLine.push(0);
            }
            
            // Check if row changed
            if (JSON.stringify(this.board[row]) !== JSON.stringify(newLine)) {
                moved = true;
                this.board[row] = newLine;
            }
        }
        return moved;
    }
    
    moveRight() {
        let moved = false;
        for (let row = 0; row < 4; row++) {
            const line = this.board[row].filter(cell => cell !== 0);
            const newLine = [];
            let i = line.length - 1;
            
            while (i >= 0) {
                if (i > 0 && line[i] === line[i - 1]) {
                    // Merge tiles
                    newLine.unshift(line[i] * 2);
                    this.score += line[i] * 2;
                    i -= 2;
                } else {
                    newLine.unshift(line[i]);
                    i--;
                }
            }
            
            // Fill remaining cells with zeros
            while (newLine.length < 4) {
                newLine.unshift(0);
            }
            
            // Check if row changed
            if (JSON.stringify(this.board[row]) !== JSON.stringify(newLine)) {
                moved = true;
                this.board[row] = newLine;
            }
        }
        return moved;
    }
    
    moveUp() {
        let moved = false;
        for (let col = 0; col < 4; col++) {
            const line = [];
            for (let row = 0; row < 4; row++) {
                if (this.board[row][col] !== 0) {
                    line.push(this.board[row][col]);
                }
            }
            
            const newLine = [];
            let i = 0;
            
            while (i < line.length) {
                if (i < line.length - 1 && line[i] === line[i + 1]) {
                    // Merge tiles
                    newLine.push(line[i] * 2);
                    this.score += line[i] * 2;
                    i += 2;
                } else {
                    newLine.push(line[i]);
                    i++;
                }
            }
            
            // Fill remaining cells with zeros
            while (newLine.length < 4) {
                newLine.push(0);
            }
            
            // Check if column changed
            let columnChanged = false;
            for (let row = 0; row < 4; row++) {
                if (this.board[row][col] !== newLine[row]) {
                    columnChanged = true;
                    this.board[row][col] = newLine[row];
                }
            }
            
            if (columnChanged) moved = true;
        }
        return moved;
    }
    
    moveDown() {
        let moved = false;
        for (let col = 0; col < 4; col++) {
            const line = [];
            for (let row = 0; row < 4; row++) {
                if (this.board[row][col] !== 0) {
                    line.push(this.board[row][col]);
                }
            }
            
            const newLine = [];
            let i = line.length - 1;
            
            while (i >= 0) {
                if (i > 0 && line[i] === line[i - 1]) {
                    // Merge tiles
                    newLine.unshift(line[i] * 2);
                    this.score += line[i] * 2;
                    i -= 2;
                } else {
                    newLine.unshift(line[i]);
                    i--;
                }
            }
            
            // Fill remaining cells with zeros
            while (newLine.length < 4) {
                newLine.unshift(0);
            }
            
            // Check if column changed
            let columnChanged = false;
            for (let row = 0; row < 4; row++) {
                if (this.board[row][col] !== newLine[row]) {
                    columnChanged = true;
                    this.board[row][col] = newLine[row];
                }
            }
            
            if (columnChanged) moved = true;
        }
        return moved;
    }
    
    hasWon() {
        // Check if any tile has value 2048
        for (let row = 0; row < 4; row++) {
            for (let col = 0; col < 4; col++) {
                if (this.board[row][col] === 2048) {
                    return true;
                }
            }
        }
        return false;
    }
    
    isGameOver() {
        // Check if there are empty cells
        for (let row = 0; row < 4; row++) {
            for (let col = 0; col < 4; col++) {
                if (this.board[row][col] === 0) {
                    return false;
                }
            }
        }
        
        // Check if any moves are possible (adjacent tiles can merge)
        for (let row = 0; row < 4; row++) {
            for (let col = 0; col < 4; col++) {
                const current = this.board[row][col];
                // Check right neighbor
                if (col < 3 && this.board[row][col + 1] === current) {
                    return false;
                }
                // Check bottom neighbor
                if (row < 3 && this.board[row + 1][col] === current) {
                    return false;
                }
            }
        }
        
        return true;
    }
    
    getHighestTile() {
        let highest = 0;
        for (let row = 0; row < 4; row++) {
            for (let col = 0; col < 4; col++) {
                if (this.board[row][col] > highest) {
                    highest = this.board[row][col];
                }
            }
        }
        return highest;
    }
    
    updateDisplay() {
        // Update score display
        this.scoreElement.textContent = this.score.toLocaleString();
        
        // Update best score
        if (this.score > this.best) {
            this.best = this.score;
            localStorage.setItem('best-score', this.best);
        }
        this.bestElement.textContent = this.best.toLocaleString();
        
        // Clear and regenerate tiles
        this.tileContainer.innerHTML = '';
        
        for (let row = 0; row < 4; row++) {
            for (let col = 0; col < 4; col++) {
                if (this.board[row][col] !== 0) {
                    const tile = document.createElement('div');
                    tile.className = `tile tile-${this.board[row][col]}`;
                    if (this.board[row][col] > 2048) {
                        tile.classList.add('tile-super');
                    }
                    tile.textContent = this.board[row][col];
                    tile.style.left = `${col
                    tile.style.left = `${col * 80 + 10}px`;
                   tile.style.top = `${row * 80 + 10}px`;
                   this.tileContainer.appendChild(tile);
               }
           }
       }
   }
   
   showEndGameModal(title, isWin) {
       const modal = document.getElementById('modalOverlay');
       const modalTitle = document.getElementById('modalTitle');
       const finalScore = document.getElementById('finalScore');
       const highestTile = document.getElementById('highestTile');
       
       modalTitle.textContent = title;
       finalScore.textContent = this.score.toLocaleString();
       highestTile.textContent = this.getHighestTile().toLocaleString();
       
       modal.classList.add('show');
   }
   
   hideModal() {
       const modal = document.getElementById('modalOverlay');
       modal.classList.remove('show');
   }
   
   restart() {
       this.board = Array(4).fill(null).map(() => Array(4).fill(0));
       this.score = 0;
       this.gameWon = false;
       this.gameOver = false;
       this.addRandomTile();
       this.addRandomTile();
       this.updateDisplay();
   }
   
   // Farcaster sharing functionality
   async shareScore() {
       const shareText = `I scored ${this.score.toLocaleString()} points in the Farcaster 2048 Frame — can you beat me? #Farcaster2048`;
       const highestTile = this.getHighestTile();
       
       // Create share payload for Farcaster
       const sharePayload = {
           text: shareText,
           embeds: [{
               url: window.location.href // Frame URL
           }],
           // Additional frame-specific metadata
           frameData: {
               score: this.score,
               highestTile: highestTile,
               timestamp: new Date().toISOString()
           }
       };
       
       try {
           // Attempt to publish to Farcaster
           await this.publishToFarcaster(sharePayload);
           this.showToast('Score shared to Farcaster!');
           this.hideModal();
       } catch (error) {
           console.error('Failed to share to Farcaster:', error);
           // Fallback to copy to clipboard or native share
           this.fallbackShare(shareText);
       }
   }
   
   // Mock Farcaster publish function - replace with real implementation
   async publishToFarcaster(payload) {
       /* 
        * REPLACE THIS MOCK WITH REAL FARCASTER INTEGRATION
        * 
        * Option 1: Use Farcaster Hub API directly
        * - POST to https://hub.farcaster.xyz/v1/submitMessage
        * - Requires message signing with user's Farcaster private key
        * - Need to construct proper protobuf message
        * 
        * Option 2: Use Warpcast API
        * - POST to https://api.warpcast.com/v2/casts
        * - Requires Warpcast API key and user authorization
        * - Simpler REST API format
        * 
        * Option 3: Use @farcaster/hub-web SDK
        * import { getSSLHubRpcClient } from "@farcaster/hub-web";
        * const client = getSSLHubRpcClient("https://hub.farcaster.xyz:2283");
        * 
        * Example implementation:
        * const message = await makeFrameAction({
        *   fid: userFid,
        *   frameUrl: payload.embeds[0].url,
        *   buttonIndex: 1,
        *   castId: { fid: userFid, hash: castHash }
        * });
        * 
        * const result = await client.submitMessage(message);
        */
       
       // Mock implementation for demonstration
       return new Promise((resolve, reject) => {
           setTimeout(() => {
               // Simulate 90% success rate
               if (Math.random() > 0.1) {
                   console.log('Mock: Successfully published to Farcaster', payload);
                   resolve({
                       success: true,
                       castHash: '0x' + Math.random().toString(16).substr(2, 40),
                       url: 'https://warpcast.com/~/conversations/' + Math.random().toString(16).substr(2, 8)
                   });
               } else {
                   reject(new Error('Mock: Failed to publish to Farcaster'));
               }
           }, 1000); // Simulate network delay
       });
   }
   
   // Fallback sharing methods when Farcaster is unavailable
   async fallbackShare(text) {
       // Try Web Share API first (mobile browsers)
       if (navigator.share) {
           try {
               await navigator.share({
                   title: 'My 2048 Score',
                   text: text,
                   url: window.location.href
               });
               this.showToast('Shared successfully!');
               this.hideModal();
               return;
           } catch (error) {
               // User cancelled or share failed, continue to clipboard
           }
       }
       
       // Fallback to clipboard
       try {
           await navigator.clipboard.writeText(text);
           this.showToast('Score copied to clipboard!');
           this.hideModal();
       } catch (error) {
           // Final fallback - create temporary text area
           const textArea = document.createElement('textarea');
           textArea.value = text;
           document.body.appendChild(textArea);
           textArea.select();
           try {
               document.execCommand('copy');
               this.showToast('Score copied to clipboard!');
               this.hideModal();
           } catch (err) {
               this.showToast('Unable to share. Please share manually.');
           }
           document.body.removeChild(textArea);
       }
   }
   
   showToast(message) {
       const toast = document.getElementById('successToast');
       const toastMessage = document.getElementById('toastMessage');
       
       toastMessage.textContent = message;
       toast.classList.add('show');
       
       setTimeout(() => {
           toast.classList.remove('show');
       }, 3000);
   }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
   new Game2048();
});

// Prevent zoom on double-tap for better mobile experience
let lastTouchEnd = 0;
document.addEventListener('touchend', (e) => {
   const now = new Date().getTime();
   if (now - lastTouchEnd <= 300) {
       e.preventDefault();
   }
   lastTouchEnd = now;
}, false);

// Service worker registration for PWA capabilities (optional)
if ('serviceWorker' in navigator) {
   window.addEventListener('load', () => {
       navigator.serviceWorker.register('/sw.js').catch(() => {
           // Service worker registration failed, continue without PWA features
       });
   });
}