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
    const canvas = document.getElementById('game-canvas');
    const ctx = canvas.getContext('2d');
    // Referências aos botões do D-pad
    const upBtn = document.getElementById('up-btn');
    const downBtn = document.getElementById('down-btn');
    const leftBtn = document.getElementById('left-btn');
    const rightBtn = document.getElementById('right-btn');

    // Constantes e variáveis do jogo
    const GRID_SIZE = 20; // Tamanho de cada "pixel" do jogo
    const HEAD_COLOR = '#0077be'; // Azul
    const BODY_COLOR = '#32cd32'; // Verde
    const FOOD_COLOR = '#ff4136'; // Vermelho

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

    // Função para iniciar o jogo
    function startGame() {
        // Reseta o estado do jogo
        snake = [{ x: 10, y: 10, color: HEAD_COLOR, isFood: false }];
        direction = { x: 0, y: 0 };
        score = 1;
        gameOver = false;
        speed = 150; // Velocidade inicial (ms por frame)
        difficultyCounter = 0;

        // Atualiza a interface
        startScreen.classList.remove('active');
        gameOverScreen.classList.remove('active');
        gameModal.classList.add('active'); // Adiciona classe para controlar visibilidade do D-pad
        gameModal.style.display = 'flex';

        // Redimensiona o canvas e gera a primeira comida
        resizeCanvas();
        generateFood();

        // Inicia o loop do jogo e a música
        if (gameInterval) clearInterval(gameInterval);
        gameInterval = setInterval(gameLoop, speed);
        Tone.start().then(() => musicLoop.start(0));
    }

    // Loop principal do jogo
    function gameLoop() {
        if (gameOver) return;
        update();
        draw();
    }

    // Atualiza o estado do jogo (movimento, colisões)
    function update() {
        if (direction.x === 0 && direction.y === 0) return; // Não move se nenhuma direção foi escolhida

        const head = { ...snake[0] }; // Copia a cabeça atual
        head.x += direction.x;
        head.y += direction.y;

        // Lógica de atravessar as bordas
        const gridWidth = Math.floor(canvas.width / GRID_SIZE);
        const gridHeight = Math.floor(canvas.height / GRID_SIZE);
        if (head.x < 0) head.x = gridWidth - 1;
        if (head.x >= gridWidth) head.x = 0;
        if (head.y < 0) head.y = gridHeight - 1;
        if (head.y >= gridHeight) head.y = 0;

        // Verifica colisão com o próprio corpo
        for (let i = 1; i < snake.length; i++) {
            if (head.x === snake[i].x && head.y === snake[i].y) {
                endGame();
                return;
            }
        }

        // Propaga o efeito da "fruta viajando"
        for (let i = snake.length - 1; i > 0; i--) {
            snake[i].isFood = snake[i-1].isFood;
        }
        snake[0].isFood = false;

        snake.unshift(head); // Adiciona a nova cabeça

        // Verifica se comeu a fruta
        if (head.x === food.x && head.y === food.y) {
            score++;
            difficultyCounter++;
            snake[0].isFood = true; // Marca a cabeça como "fruta"
            playEatSound();
            generateFood();
            
            // Aumenta a dificuldade a cada 10 frutas
            if (difficultyCounter > 0 && difficultyCounter % 10 === 0) {
                speed *= 0.9; // Aumenta a velocidade em 10%
                clearInterval(gameInterval);
                gameInterval = setInterval(gameLoop, speed);
            }
        } else {
            snake.pop(); // Remove a cauda se não comeu
        }
    }

    // Desenha tudo no canvas
    function draw() {
        // Limpa o canvas
        ctx.fillStyle = '#0d0d0d';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Desenha a cobrinha
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

        // Desenha a fruta
        if (food) {
            ctx.fillStyle = FOOD_COLOR;
            ctx.fillRect(food.x * GRID_SIZE, food.y * GRID_SIZE, GRID_SIZE, GRID_SIZE);
            // Efeito de brilho na fruta
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.fillRect(food.x * GRID_SIZE + 2, food.y * GRID_SIZE + 2, GRID_SIZE / 3, GRID_SIZE / 3);
        }
    }

    // Gera uma nova fruta em uma posição aleatória
    function generateFood() {
        const gridWidth = Math.floor(canvas.width / GRID_SIZE);
        const gridHeight = Math.floor(canvas.height / GRID_SIZE);
        if (gridWidth <= 0 || gridHeight <= 0) return; // Não gera comida se o canvas não tem tamanho
        
        let foodPosition;
        do {
            foodPosition = {
                x: Math.floor(Math.random() * gridWidth),
                y: Math.floor(Math.random() * gridHeight)
            };
        } while (snake.some(segment => segment.x === foodPosition.x && segment.y === foodPosition.y));
        food = foodPosition;
    }

    // Função para terminar o jogo
    function endGame() {
        gameOver = true;
        clearInterval(gameInterval);
        musicLoop.stop();
        
        // Atualiza pontuações e interface
        updateHighScores();
        finalScoreSpan.textContent = score;
        gameModal.style.display = 'none';
        gameModal.classList.remove('active');
        gameOverScreen.classList.add('active');
    }

    // Função para sair para a tela inicial
    function exitGame() {
        gameOverScreen.classList.remove('active');
        startScreen.classList.add('active');
        updateHighScoresDisplay();
    }

    // --- Lógica de Pontuação ---
    function updateHighScores() {
        highScores.push(score);
        highScores.sort((a, b) => b - a); // Ordena do maior para o menor
        highScores = highScores.slice(0, 5); // Mantém apenas os 5 melhores

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

    // --- Controles ---
    function handleKeydown(e) {
        // Evita que a cobrinha se mova na direção oposta
        const goingUp = direction.y === -1;
        const goingDown = direction.y === 1;
        const goingLeft = direction.x === -1;
        const goingRight = direction.x === 1;

        // Não permite o primeiro movimento na direção oposta de onde a cobra crescerá
        if (snake.length === 1) {
            if (e.key === 'ArrowLeft') return;
        }

        switch (e.key) {
            case 'ArrowUp':
            case 'w':
                if (!goingDown) direction = { x: 0, y: -1 };
                break;
            case 'ArrowDown':
            case 's':
                if (!goingUp) direction = { x: 0, y: 1 };
                break;
            case 'ArrowLeft':
            case 'a':
                if (!goingRight) direction = { x: -1, y: 0 };
                break;
            case 'ArrowRight':
            case 'd':
                if (!goingLeft) direction = { x: 1, y: 0 };
                break;
        }
    }
    
    // --- Redimensionamento ---
    function resizeCanvas() {
        const modalRect = gameModal.getBoundingClientRect();
        canvas.width = modalRect.width;
        canvas.height = modalRect.height;
        // Se um jogo estiver em andamento, redesenhe
        if (!gameOver && snake) {
           draw();
        }
    }

    // --- Event Listeners ---
    startBtn.addEventListener('click', startGame);
    restartBtn.addEventListener('click', startGame);
    exitBtn.addEventListener('click', exitGame);
    
    // Listener para teclado (Desktop)
    document.addEventListener('keydown', handleKeydown);
    
    // Listeners para o D-pad virtual (Mobile)
    function dPadHandler(e) {
        e.preventDefault(); // Previne comportamento padrão do toque (zoom, scroll)
        const key = e.currentTarget.dataset.key;
        handleKeydown({ key: key });
    }

    // Usar 'touchstart' para resposta mais rápida no mobile
    upBtn.addEventListener('touchstart', dPadHandler, { passive: false });
    downBtn.addEventListener('touchstart', dPadHandler, { passive: false });
    leftBtn.addEventListener('touchstart', dPadHandler, { passive: false });
    rightBtn.addEventListener('touchstart', dPadHandler, { passive: false });
    
    // Listener para redimensionar a janela
    window.addEventListener('resize', resizeCanvas);

    // Inicializa a exibição das pontuações
    updateHighScoresDisplay();
});
