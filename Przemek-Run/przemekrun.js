window.onload = () => {
    const canvas = document.getElementById("game");
    const ctx = canvas.getContext("2d");

    // ====== OBRAZY ======

    const playerImg = new Image();
    playerImg.src = "img/pszemek.png";

    const heartImg = new Image();
    heartImg.src = "img/health.png";

    const maczetki = [
        "img/jp.png",
        "img/maczetka.png",
        "img/hwdp.png",
        "img/psz.png"
    ];

    const herbatki = [
        "img/pileczka.png",
        "img/herbatka.png",
        "img/produkty-swiateczne-1-2.png",
        "img/balatro.png"
    ];

    // ====== AUDIO ======
    const music = new Audio("sound/loop.wav");
    music.loop = true;
    music.volume = 0.4;

    const healSound = new Audio("sound/heal.wav");
    const hitSound = new Audio("sound/hit.wav");
    const deathSound = new Audio("sound/death.wav");

    function playSound(sound) {
        sound.currentTime = 0;
        sound.play();
    }

    // ====== STANY ======
    let gameStarted = false;
    let gameOver = false;

    // ====== SCORE & DIFFICULTY ======
    let score = 0;
    let difficultyMultiplier = 1.5;

    // ====== GRACZ ======
    const player = {
        x: 50,
        y: canvas.height / 2 - 32,
        width: 90,
        height: 95,
        speed: 5,
        lives: 3,
        maxLives: 5,
        invincible: false,
        invincibleTime: 0
    };

    // ====== INPUT ======
    const keys = { up: false, down: false };

    window.addEventListener("keydown", e => {
        if (e.key === "ArrowUp" || e.key === "w") keys.up = true;
        if (e.key === "ArrowDown" || e.key === "s") keys.down = true;

        if (e.code === "Space") {
            if (!gameStarted) startGame();
            else if (gameOver) resetGame();
        }
    });

    window.addEventListener("keyup", e => {
        if (e.key === "ArrowUp" || e.key === "w") keys.up = false;
        if (e.key === "ArrowDown" || e.key === "s") keys.down = false;
    });

    // ====== LASERY ======
    const lasers = [];
    const baseBadSpeed = 4;
    const baseGoodSpeed = 3;

    function spawnLaser() {
        if (!gameStarted || gameOver) return;

        const good = Math.random() < 0.2;

        const img = new Image();

        img.src = good
            ? herbatki[Math.floor(Math.random() * herbatki.length)]
            : maczetki[Math.floor(Math.random() * maczetki.length)];

        lasers.push({
            x: canvas.width,
            y: Math.random() * (canvas.height - 20),
            width: 78,
            height: 78,
            good,
            img
        });
    }

    setInterval(spawnLaser, 400);

    // ====== UPDATE ======
    function update(delta) {
        if (!gameStarted || gameOver) return;

        score += delta * 0.01;

        difficultyMultiplier = 1 + score / 500;

        const targetRate = 1 + score / 1000;
        music.playbackRate = Math.min(targetRate, 1.5);

        if (keys.up) player.y -= player.speed;
        if (keys.down) player.y += player.speed;

        player.y = Math.max(0, Math.min(canvas.height - player.height, player.y));

        for (let i = lasers.length - 1; i >= 0; i--) {
            const l = lasers[i];
            const speed = (l.good ? baseGoodSpeed : baseBadSpeed) * difficultyMultiplier;
            l.x -= speed;

            if (checkCollision(player, l)) {
                if (l.good) {
                    if (player.lives < player.maxLives) {
                        player.lives++;
                        playSound(healSound);
                    }
                } else if (!player.invincible) {
                    player.lives--;
                    player.invincible = true;
                    player.invincibleTime = 500;
                    playSound(hitSound);
                }

                lasers.splice(i, 1);
                continue;
            }

            if (l.x + l.width < 0) lasers.splice(i, 1);
        }

        if (player.invincible) {
            player.invincibleTime -= delta;

            if (player.invincibleTime <= 0) {
                player.invincible = false;
            }
        }

        if (player.lives <= 0) {
            gameOver = true;

            music.pause();
            music.currentTime = 0;
            music.playbackRate = 1;

            playSound(deathSound);
        }
    }

    // ====== DRAW ======
    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (!gameStarted) {
            drawCenterText("Naciśnij SPACJĘ aby rozpocząć", 30);
            return;
        }

        if (!player.invincible || Math.floor(Date.now() / 100) % 2 === 0) {
            ctx.drawImage(playerImg, player.x, player.y, player.width, player.height);
        }

        lasers.forEach(l => {
            if (l.img.complete && l.img.naturalWidth !== 0) {
                ctx.drawImage(l.img, l.x, l.y, l.width, l.height);
            }
        });

        for (let i = 0; i < player.lives; i++) {
            ctx.drawImage(heartImg, 10 + i * 34, 10, 32, 32);
        }

        ctx.fillStyle = "white";
        ctx.font = "20px Arial";
        ctx.fillText("Score: " + Math.floor(score), canvas.width - 140, 30);

        if (gameOver) {
            drawCenterText("PRZEJEBAŁEŚ...", 40, -20);
            drawCenterText("Wynik: " + Math.floor(score), 24, 10);
            drawCenterText("Naciśnij SPACJĘ aby pić więcej herbaty", 18, 40);
        }
    }

    function drawCenterText(text, size, offsetY = 0) {
        ctx.fillStyle = "white";
        ctx.font = size + "px Arial";
        ctx.textAlign = "center";
        ctx.fillText(text, canvas.width / 2, canvas.height / 2 + offsetY);
        ctx.textAlign = "left";
    }

    // ====== KOLIZJA ======
    function checkCollision(a, b) {
        return (
            a.x < b.x + b.width &&
            a.x + a.width > b.x &&
            a.y < b.y + b.height &&
            a.y + a.height > b.y
        );
    }

    // ====== FLOW ======
    function startGame() {
        gameStarted = true;
        gameOver = false;

        score = 0;
        difficultyMultiplier = 1;

        music.playbackRate = 1;
        music.play();
    }

    function resetGame() {
        player.y = canvas.height / 2 - player.height / 2;
        player.lives = 3;
        player.invincible = false;
        player.invincibleTime = 0;

        lasers.length = 0;

        score = 0;
        difficultyMultiplier = 1;

        gameOver = false;

        music.playbackRate = 1;
        music.play();
    }

    // ====== LOOP ======
    let last = 0;

    function loop(time) {
        const delta = time - last;
        last = time;

        update(delta);
        draw();

        requestAnimationFrame(loop);
    }

    playerImg.onload = () => requestAnimationFrame(loop);
};