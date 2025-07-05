document.addEventListener('DOMContentLoaded', () => {
    // Referências aos elementos do DOM
    const startScreen = document.getElementById('start-screen');
    const gameOverScreen = document.getElementById('game-over-screen');
    const gameModal = document.getElementById('game-modal');
    const startBtn = document.getElementById('start-btn');
    const restartBtn = document.getElementById('restart-btn');
    const exitBtn = document.getElementById('exit-btn');
    const highScoresList = document.getElementById('high-scores');
    const finalScoreSpan = document.getElementById('final-score');
    const rankMessage = document.getElementById('rank-message');
    const gameArea = document.getElementById('game-area'); // Nova referência
    const canvas = document.getElementById('game-canvas');
    const ctx = canvas.getContext('2d');
    const dPad = document.getElementById('d-pad');

    // Constantes e variáveis do jogo
    const GRID_SIZE = 20;
    const HEAD_COLOR = '#0077be';
    const BODY_COLOR = '#32cd32';
    const FOOD_COLOR = '#ff4136';

    let snake, food, direction, score, gameOver, gameInterval, speed;
    let highScores = [];
    let difficultyCounter = 0;

    // --- Lógica de Áudio com Tone.js ---
    const synth = new Tone.Synth({
        oscillator: { type: 'square' },
        envelope: { attack: 0.005, decay: 0.1, sustain: 0.3, release: 0.1 }
    }).toDestination();

    const musicLoop = new Tone.Loop(time => {
        synth.triggerAttackRelease('C2', '8n', time);
        synth.triggerAttackRelease('G2', '8n', time + 0.25);
        synth.triggerAttackRelease('C3', '8n', time + 0.5);
    }, '0.5n');

    function playEatSound() {
        synth.triggerAttackRelease('C4', '8n');
    }

    // --- Funções do Jogo ---

    function startGame() {
        snake = [{ x: 10, y: 10, color: HEAD_COLOR, isFood: false }];
        direction = { x: 0, y: 0 };
        score = 1;
        gameOver = false;
        speed = 150;
        difficultyCounter = 0;

        startScreen.classList.remove('active');
        gameOverScreen.classList.remove('active');
        gameModal.classList.add('active');
        gameModal.style.display = 'flex';

        resizeCanvas();
        generateFood();

        if (gameInterval) clearInterval(gameInterval);
        gameInterval = setInterval(gameLoop, speed);
        Tone.start().then(() => musicLoop.start(0));
    }

    function gameLoop() {
        if (gameOver) return;
        update();
        draw();
    }

    function update() {
        if (direction.x === 0 && direction.y === 0) return;

        const head = { ...snake[0] };
        head.x += direction.x;
        head.y += direction.y;

        const gridWidth = Math.floor(canvas.width / GRID_SIZE);
        const gridHeight = Math.floor(canvas.height / GRID_SIZE);
        if (head.x < 0) head.x = gridWidth - 1;
        if (head.x >= gridWidth) head.x = 0;
        if (head.y < 0) head.y = gridHeight - 1;
        if (head.y >= gridHeight) head.y = 0;

        for (let i = 1; i < snake.length; i++) {
            if (head.x === snake[i].x && head.y === snake[i].y) {
                endGame();
                return;
            }
        }

        for (let i = snake.length - 1; i > 0; i--) {
            snake[i].isFood = snake[i-1].isFood;
        }
        snake[0].isFood = false;

        snake.unshift(head);

        if (food && head.x === food.x && head.y === food.y) {
            score++;
            difficultyCounter++;
            snake[0].isFood = true;
            playEatSound();
            generateFood();
            
            if (difficultyCounter > 0 && difficultyCounter % 10 === 0) {
                speed *= 0.9;
                clearInterval(gameInterval);
                gameInterval = setInterval(gameLoop, speed);
            }
        } else {
            snake.pop();
        }
    }

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        snake.forEach((segment, index) => {
            if (index === 0) {
                ctx.fillStyle = HEAD_COLOR;
            } else if (segment.isFood) {
                ctx.fillStyle = FOOD_COLOR;
            } else {
                ctx.fillStyle = BODY_COLOR;
            }
            ctx.fillRect(segment.x * GRID_SIZE, segment.y * GRID_SIZE, GRID_SIZE - 2, GRID_SIZE - 2);
        });

        if (food) {
            ctx.fillStyle = FOOD_COLOR;
            ctx.fillRect(food.x * GRID_SIZE, food.y * GRID_SIZE, GRID_SIZE, GRID_SIZE);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.fillRect(food.x * GRID_SIZE + 2, food.y * GRID_SIZE + 2, GRID_SIZE / 3, GRID_SIZE / 3);
        }
    }

    function generateFood() {
        const gridWidth = Math.floor(canvas.width / GRID_SIZE);
        const gridHeight = Math.floor(canvas.height / GRID_SIZE);
        if (gridWidth <= 0 || gridHeight <= 0) return;
        
        let foodPosition;
        do {
            foodPosition = {
                x: Math.floor(Math.random() * gridWidth),
                y: Math.floor(Math.random() * gridHeight)
            };
        } while (snake.some(segment => segment.x === foodPosition.x && segment.y === foodPosition.y));
        food = foodPosition;
    }

    function endGame() {
        gameOver = true;
        clearInterval(gameInterval);
        musicLoop.stop();
        
        updateHighScores();
        finalScoreSpan.textContent = score;
        gameModal.style.display = 'none';
        gameModal.classList.remove('active');
        gameOverScreen.classList.add('active');
    }

    function exitGame() {
        gameOverScreen.classList.remove('active');
        startScreen.classList.add('active');
        updateHighScoresDisplay();
    }

    function updateHighScores() {
        highScores.push(score);
        highScores.sort((a, b) => b - a);
        highScores = highScores.slice(0, 5);

        const rank = highScores.indexOf(score) + 1;
        if (rank > 0) {
            rankMessage.textContent = `Você ficou em ${rank}º lugar!`;
        } else {
            rankMessage.textContent = "Tente de novo para entrar no ranking!";
        }
        updateHighScoresDisplay();
    }

    function updateHighScoresDisplay() {
        highScoresList.innerHTML = '';
        if (highScores.length === 0) {
            highScoresList.innerHTML = '<li>Nenhuma pontuação ainda.</li>';
        } else {
            highScores.forEach((s, index) => {
                const li = document.createElement('li');
                li.textContent = `${index + 1}º - ${s} pontos`;
                highScoresList.appendChild(li);
            });
        }
    }

    function handleKeydown(e) {
        const goingUp = direction.y === -1;
        const goingDown = direction.y === 1;
        const goingLeft = direction.x === -1;
        const goingRight = direction.x === 1;

        // BUG FIX: Removida a linha que impedia o início do jogo movendo para a esquerda.
        // if (snake.length === 1 && (e.key === 'ArrowLeft' || e.key === 'a')) return;

        switch (e.key) {
            case 'ArrowUp': case 'w':
                if (!goingDown) direction = { x: 0, y: -1 };
                break;
            case 'ArrowDown': case 's':
                if (!goingUp) direction = { x: 0, y: 1 };
                break;
            case 'ArrowLeft': case 'a':
                if (!goingRight) direction = { x: -1, y: 0 };
                break;
            case 'ArrowRight': case 'd':
                if (!goingLeft) direction = { x: 1, y: 0 };
                break;
        }
    }
    
    function resizeCanvas() {
        // Agora o canvas é redimensionado com base na sua área dedicada
        const gameAreaRect = gameArea.getBoundingClientRect();
        canvas.width = gameAreaRect.width;
        canvas.height = gameAreaRect.height;
        if (!gameOver && snake) {
           draw();
        }
    }

    // --- Event Listeners ---
    startBtn.addEventListener('click', startGame);
    restartBtn.addEventListener('click', startGame);
    exitBtn.addEventListener('click', exitGame);
    document.addEventListener('keydown', handleKeydown);
    
    function dPadHandler(e) {
        e.preventDefault();
        // BUG FIX: Alterado e.currentTarget para e.target para obter o elemento correto (o botão).
        const key = e.target.dataset.key;
        if (key) {
            handleKeydown({ key: key });
        }
    }

    // Delegação de evento para o D-pad
    dPad.addEventListener('touchstart', (e) => {
        if (e.target.classList.contains('d-pad-btn')) {
            dPadHandler(e);
        }
    }, { passive: false });
    
    window.addEventListener('resize', resizeCanvas);
    updateHighScoresDisplay();
});
