    // ============================================================================
    // FLIPPY BIRD - ULTRA MODERN EDITION
    // Optimized Game Logic with Clean Architecture
    // ============================================================================

    // DOM Elements
    const canvas = document.getElementById("gameCanvas");
    const ctx = canvas.getContext("2d");
    const elements = {
      score: document.getElementById("scoreDisplay"),
      pipeScore: document.getElementById("pipeScoreDisplay"),
      coinScore: document.getElementById("coinScoreDisplay"),
      highScore: document.getElementById("highScoreDisplay"),
      allTimeHighScore: document.getElementById("allTimeHighScoreDisplay"),
      startMenu: document.getElementById("startMenu"),
      gameOverMenu: document.getElementById("gameOverMenu"),
      pauseMenu: document.getElementById("pauseMenu"),
      settingsMenu: document.getElementById("settingsMenu"),
      finalScore: document.getElementById("finalScore"),
      newHighScore: document.getElementById("newHighScore"),
      newAllTimeHighScore: document.getElementById("newAllTimeHighScore"),
      pauseButton: document.getElementById("pauseButton"),
      settingsButton: document.getElementById("settingsButton"),
      featurePanel: document.getElementById("featurePanel"),
      loadingScreen: document.getElementById("loadingScreen"),
      flapSound: document.getElementById("flapSound"),
      coinSound: document.getElementById("coinSound"),
      gameOverSound: document.getElementById("gameOverSound"),
      backgroundMusic: document.getElementById("backgroundMusic"),
      masterVolume: document.getElementById("masterVolume"),
      soundEffectsVolume: document.getElementById("soundEffectsVolume"),
      musicVolume: document.getElementById("musicVolume"),
      birdSkinSelect: document.getElementById("birdSkinSelect"),
      backgroundSelect: document.getElementById("backgroundSelect"),
      difficultySelect: document.getElementById("difficultySelect"),
      pipeSkinSelect: document.getElementById("pipeSkinSelect")
    };

    // Constants
    const STORAGE_KEYS = {
      HIGH_SCORE: "flippyBirdAllTimeHighScore",
      BIRD_SKIN: "flippyBirdSkin",
      BACKGROUND: "flippyBackground",
      PIPE_SKIN: "flippyPipeSkin",
      MUSIC: "flippyBirdMusicSetting",
      SOUND_VOLUME: "flippyBirdSoundVolume",
      MUSIC_VOLUME: "flippyBirdMusicVolume",
      DIFFICULTY: "flippyBirdDifficulty",
      MASTER_VOLUME: "masterVolume"
    };

    const COLORS = {
      ground: "#8B4513",
      groundTexture: "#654321",
      grass: ["#4CAF50", "#66BB6A", "#81C784"],
      grassBlade: "#388E3C",
      coin: "#FFD700",
      coinOutline: "#DAA520",
      coinGradient: "#EEC900",
      pipes: {
        green: "#1e8449",
        red: "#EF4444",
        blue: "#3B82F6"
      }
    };

    const DIFFICULTY_SETTINGS = {
      easy: {
        gravity: 0.3,
        pipeSpeed: 2,
        gap: 250,
        spawnInterval: 2000
      },
      normal: {
        gravity: 0.4,
        pipeSpeed: 3,
        gap: 200,
        spawnInterval: 1500
      },
      hard: {
        gravity: 0.5,
        pipeSpeed: 4,
        gap: 180,
        spawnInterval: 1000
      }
    };

    // Game State
    const gameState = {
      running: false,
      paused: false,
      gameOver: false,
      assetsLoaded: false,
      loadedAssets: 0,
      totalAssets: 4,
      bird: null,
      background: null,
      pipes: [],
      coins: [],
      physics: {
        gravity: 0.4,
        flapStrength: -6,
        pipeSpeed: 3
      },
      scores: {
        overall: 0,
        pipes: 0,
        coins: 0,
        session: 0,
        allTime: 0
      },
      config: {
        pipeWidth: 80,
        gap: 200,
        spawnDistance: 300,
        groundHeight: 100,
        birdBaseSize: 70, // Base size for bird (will maintain aspect ratio)
        birdWidth: 70,
        birdHeight: 70,
        coinRadius: 18
      },
      timers: {
        pipeSpawn: 0,
        coinSpawn: 0,
        pipeInterval: 1500,
        coinInterval: 3000
      },
      settings: {
        difficulty: "normal",
        birdSkin: "default",
        background: "sky",
        pipeSkin: "green",
        musicEnabled: true
      },
      assets: {
        birds: {},
        backgrounds: {},
        currentBird: null,
        currentBackground: null,
        birdStates: {}
      },
      birdState: 'normal',
      grassBlades: [],
      grassOffset: 0,
      debugMode: false,
      isDying: false,
      deathAnimationTimer: 0
    };

    let lastTime = 0;
    let animationFrameId = null;

    // ============================================================================
    // UTILITY FUNCTIONS
    // ============================================================================

    const Storage = {
      get: (key, defaultValue = null) => {
        const value = localStorage.getItem(key);
        return value !== null ? value : defaultValue;
      },
      set: (key, value) => {
        localStorage.setItem(key, value);
      },
      getNumber: (key, defaultValue = 0) => {
        return parseFloat(Storage.get(key, defaultValue));
      },
      getBoolean: (key, defaultValue = false) => {
        return Storage.get(key, defaultValue.toString()) === "true";
      }
    };

    const Utils = {
      clamp: (value, min, max) => Math.min(Math.max(value, min), max),
      random: (min, max) => Math.random() * (max - min) + min,
      randomInt: (min, max) => Math.floor(Utils.random(min, max + 1)),
      lerp: (start, end, t) => start + (end - start) * t,
      checkCollision: (rect1, rect2) => {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
      },
      distance: (x1, y1, x2, y2) => {
        return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
      }
    };

    // ============================================================================
    // AUDIO MANAGEMENT
    // ============================================================================

    const AudioManager = {
      init() {
        this.loadVolumes();
        this.updateVolumes();
      },

      loadVolumes() {
        const master = Storage.getNumber(STORAGE_KEYS.MASTER_VOLUME, 1);
        const sound = Storage.getNumber(STORAGE_KEYS.SOUND_VOLUME, 0.7);
        const music = Storage.getNumber(STORAGE_KEYS.MUSIC_VOLUME, 0.3);

        if (elements.masterVolume) elements.masterVolume.value = master;
        if (elements.soundEffectsVolume) elements.soundEffectsVolume.value = sound;
        if (elements.musicVolume) elements.musicVolume.value = music;
      },

      updateVolumes() {
        const master = parseFloat(elements.masterVolume?.value || 1);
        const sound = parseFloat(elements.soundEffectsVolume?.value || 0.7);
        const music = parseFloat(elements.musicVolume?.value || 0.3);

        if (elements.flapSound) elements.flapSound.volume = sound * master;
        if (elements.coinSound) elements.coinSound.volume = sound * master;
        if (elements.gameOverSound) elements.gameOverSound.volume = sound * master;
        if (elements.backgroundMusic) elements.backgroundMusic.volume = music * master;

        Storage.set(STORAGE_KEYS.MASTER_VOLUME, master);
        Storage.set(STORAGE_KEYS.SOUND_VOLUME, sound);
        Storage.set(STORAGE_KEYS.MUSIC_VOLUME, music);

        // Update volume display values
        const masterVolumeValue = document.getElementById('masterVolumeValue');
        const soundEffectsVolumeValue = document.getElementById('soundEffectsVolumeValue');
        const musicVolumeValue = document.getElementById('musicVolumeValue');
        
        if (masterVolumeValue) masterVolumeValue.textContent = Math.round(master * 100) + '%';
        if (soundEffectsVolumeValue) soundEffectsVolumeValue.textContent = Math.round(sound * 100) + '%';
        if (musicVolumeValue) musicVolumeValue.textContent = Math.round(music * 100) + '%';
      },

      play(sound) {
        if (sound && sound.play) {
          sound.currentTime = 0;
          sound.play().catch(() => {});
        }
      },

      playMusic() {
        if (elements.backgroundMusic && gameState.settings.musicEnabled) {
          elements.backgroundMusic.play().catch(() => {});
        }
      },

      pauseMusic() {
        if (elements.backgroundMusic) {
          elements.backgroundMusic.pause();
        }
      }
    };

    // ============================================================================
    // CANVAS MANAGEMENT
    // ============================================================================

    const CanvasManager = {
      resize() {
        const dpr = window.devicePixelRatio || 1;
        canvas.width = window.innerWidth * dpr;
        canvas.height = window.innerHeight * dpr;
        canvas.style.width = window.innerWidth + "px";
        canvas.style.height = window.innerHeight + "px";
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        // Update dynamic gap based on screen height
        gameState.config.gap = Utils.clamp(
          window.innerHeight * 0.35,
          150,
          250
        );

        // Reposition bird if it exists
        if (gameState.bird) {
          gameState.bird.x = window.innerWidth / 4;
        }

        // Reinitialize grass for new screen width
        if (gameState.grassBlades.length > 0) {
          Renderer.initGrass();
        }
      },

      clear() {
        ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      }
    };

    // ============================================================================
    // GAME ENTITIES
    // ============================================================================

    class Bird {
      constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.velocity = 0;
        this.gravity = gameState.physics.gravity;
        this.flapStrength = gameState.physics.flapStrength;
        this.rotation = 0;
      }

      update(dt) {
        this.velocity += this.gravity * dt;
        this.y += this.velocity * dt;
        
        // Different rotation behavior when dying
        if (gameState.isDying) {
          // Dramatic tumbling rotation during death
          this.rotation += 0.15 * dt;
          if (this.rotation > Math.PI) this.rotation = Math.PI; // Cap at 180 degrees
        } else {
          this.rotation = Utils.clamp(this.velocity * 0.04, -Math.PI / 6, Math.PI / 6);
          
          // Update bird state based on velocity
          if (this.velocity < -2) {
            gameState.birdState = 'jump';
          } else if (this.velocity > 2) {
            gameState.birdState = 'normal';
          }
        }

        // Prevent going above screen
        if (this.y < 0) {
          this.y = 0;
          this.velocity = 0;
        }
      }

      flap() {
        // Don't allow flapping during death animation
        if (gameState.isDying) return;
        
        this.velocity = this.flapStrength;
        gameState.birdState = 'jump';
        AudioManager.play(elements.flapSound);
      }

      draw(ctx) {
        // Select image based on current state
        let image;
        if (gameState.birdState === 'cry') {
          image = gameState.assets.birdStates.cry;
        } else if (gameState.birdState === 'jump') {
          image = gameState.assets.birdStates.jump;
        } else {
          image = gameState.assets.birdStates.normal;
        }
        
        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        ctx.rotate(this.rotation);

        if (image && image.complete) {
          ctx.drawImage(image, -this.width / 2, -this.height / 2, this.width, this.height);
        } else {
          // Fallback rectangle
          ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
          ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
        }

        ctx.restore();
      }

      reset(x, y) {
        this.x = x;
        this.y = y;
        this.velocity = 0;
        this.rotation = 0;
      }

      getBounds() {
        return {
          x: this.x,
          y: this.y,
          width: this.width,
          height: this.height
        };
      }

      drawDebug(ctx) {
        // Draw hitbox
        ctx.strokeStyle = '#00FF00';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x, this.y, this.width, this.height);
        
        // Draw center point
        ctx.fillStyle = '#00FF00';
        ctx.beginPath();
        ctx.arc(this.x + this.width / 2, this.y + this.height / 2, 3, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw velocity vector
        ctx.strokeStyle = '#FFFF00';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.x + this.width / 2, this.y + this.height / 2);
        ctx.lineTo(this.x + this.width / 2, this.y + this.height / 2 + this.velocity * 5);
        ctx.stroke();
        
        // Draw info text
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '10px monospace';
        ctx.fillText(`vel: ${this.velocity.toFixed(2)}`, this.x, this.y - 5);
      }
    }

    class Pipe {
      constructor(x, topHeight, gap, width) {
        this.x = x;
        this.topHeight = topHeight;
        this.gap = gap;
        this.width = width;
        this.scored = false;
        this.speed = gameState.physics.pipeSpeed;
        
        const groundHeight = gameState.config.groundHeight;
        const canvasHeight = window.innerHeight;
        this.bottomY = canvasHeight - groundHeight - (canvasHeight - groundHeight - topHeight - gap);
        this.bottomHeight = canvasHeight - groundHeight - this.bottomY;
      }

      update(dt) {
        this.x -= this.speed * dt;
      }

      draw(ctx) {
        const skin = gameState.settings.pipeSkin;
        const canvasHeight = window.innerHeight;
        const groundHeight = gameState.config.groundHeight;

        if (skin === "blue" || skin === "red") {
          this.drawStyledPipe(ctx, skin);
        } else {
          // Default green pipe
          ctx.fillStyle = COLORS.pipes.green;
          ctx.fillRect(this.x, 0, this.width, this.topHeight);
          ctx.fillRect(this.x, this.bottomY, this.width, this.bottomHeight);
          
          // Add border
          ctx.strokeStyle = "rgba(0, 0, 0, 0.3)";
          ctx.lineWidth = 2;
          ctx.strokeRect(this.x, 0, this.width, this.topHeight);
          ctx.strokeRect(this.x, this.bottomY, this.width, this.bottomHeight);
        }
      }

      drawStyledPipe(ctx, skin) {
        const color = COLORS.pipes[skin];
        const darkColor = skin === "blue" ? "rgb(30, 64, 175)" : "rgb(185, 28, 28)";
        const lightColor = skin === "blue" ? "rgb(191, 219, 254)" : "rgb(254, 202, 202)";

        // Top pipe
        ctx.fillStyle = color;
        ctx.fillRect(this.x, 0, this.width, this.topHeight);
        
        ctx.strokeStyle = darkColor;
        ctx.lineWidth = 3;
        ctx.strokeRect(this.x, 0, this.width, this.topHeight);

        // Highlight
        ctx.fillStyle = lightColor;
        ctx.globalAlpha = 0.4;
        ctx.fillRect(this.x + 2, 2, this.width - 4, 3);
        ctx.globalAlpha = 1;

        // Bottom pipe
        ctx.fillStyle = color;
        ctx.fillRect(this.x, this.bottomY, this.width, this.bottomHeight);
        
        ctx.strokeStyle = darkColor;
        ctx.lineWidth = 3;
        ctx.strokeRect(this.x, this.bottomY, this.width, this.bottomHeight);

        ctx.fillStyle = lightColor;
        ctx.globalAlpha = 0.4;
        ctx.fillRect(this.x + 2, this.bottomY + 2, this.width - 4, 3);
        ctx.globalAlpha = 1;
      }

      isOffScreen() {
        return this.x + this.width < 0;
      }

      getBounds() {
        return {
          top: { x: this.x, y: 0, width: this.width, height: this.topHeight },
          bottom: { x: this.x, y: this.bottomY, width: this.width, height: this.bottomHeight }
        };
      }

      drawDebug(ctx) {
        // Draw top pipe hitbox
        ctx.strokeStyle = '#FF0000';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x, 0, this.width, this.topHeight);
        
        // Draw bottom pipe hitbox
        ctx.strokeRect(this.x, this.bottomY, this.width, this.bottomHeight);
        
        // Draw gap area (safe zone)
        ctx.strokeStyle = '#00FFFF';
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(this.x, this.topHeight, this.width, this.gap);
        ctx.setLineDash([]);
        
        // Draw center line
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(this.x + this.width / 2, 0);
        ctx.lineTo(this.x + this.width / 2, window.innerHeight);
        ctx.stroke();
        
        // Draw scoring line
        if (!this.scored) {
          ctx.strokeStyle = '#FFFF00';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(this.x + this.width, 0);
          ctx.lineTo(this.x + this.width, window.innerHeight);
          ctx.stroke();
        }
      }
    }

    class Coin {
      constructor(x, y, radius) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.collected = false;
        this.speed = gameState.physics.pipeSpeed;
        this.angle = 0;
      }

      update(dt) {
        this.x -= this.speed * dt;
        this.angle += 0.05 * dt;
      }

      draw(ctx) {
        if (this.collected) return;

        const gradient = ctx.createRadialGradient(
          this.x - this.radius * 0.3,
          this.y - this.radius * 0.3,
          0,
          this.x,
          this.y,
          this.radius
        );
        gradient.addColorStop(0, "white");
        gradient.addColorStop(0.3, COLORS.coinGradient);
        gradient.addColorStop(1, COLORS.coin);

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        // Outer glow
        ctx.shadowColor = COLORS.coin;
        ctx.shadowBlur = 10;
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // Border
        ctx.shadowBlur = 0;
        ctx.strokeStyle = COLORS.coinOutline;
        ctx.lineWidth = 3;
        ctx.stroke();

        // Shine effect
        ctx.strokeStyle = "rgba(255, 255, 255, 0.6)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(-this.radius * 0.3, -this.radius * 0.3, this.radius * 0.4, 0, Math.PI, true);
        ctx.stroke();

        ctx.restore();
      }

      isOffScreen() {
        return this.x + this.radius < 0;
      }

      checkCollision(bird) {
        const dx = bird.x + bird.width / 2 - this.x;
        const dy = bird.y + bird.height / 2 - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < bird.width / 2 + this.radius && !this.collected;
      }

      drawDebug(ctx) {
        if (this.collected) return;
        
        // Draw collision circle
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.stroke();
        
        // Draw center point
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(this.x, this.y, 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw radius lines
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(this.x - this.radius, this.y);
        ctx.lineTo(this.x + this.radius, this.y);
        ctx.moveTo(this.x, this.y - this.radius);
        ctx.lineTo(this.x, this.y + this.radius);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      collect() {
        this.collected = true;
        AudioManager.play(elements.coinSound);
      }
    }

    class Background {
      constructor(image, speed) {
        this.image = image;
        this.speed = speed;
        this.x = 0;
      }

      update(dt) {
        this.x -= this.speed * dt;
        if (this.x <= -window.innerWidth) {
          this.x = 0;
        }
      }

      draw(ctx) {
        const canvasWidth = window.innerWidth;
        const canvasHeight = window.innerHeight;
        const groundHeight = gameState.config.groundHeight;
        const drawHeight = canvasHeight - groundHeight;

        if (this.image && this.image.complete) {
          ctx.drawImage(this.image, this.x, 0, canvasWidth, drawHeight);
          ctx.drawImage(this.image, this.x + canvasWidth, 0, canvasWidth, drawHeight);
        } else {
          // Fallback gradient
          const gradient = ctx.createLinearGradient(0, 0, 0, drawHeight);
          gradient.addColorStop(0, "#87CEEB");
          gradient.addColorStop(1, "#E0F6FF");
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, canvasWidth, drawHeight);
        }
      }

      reset() {
        this.x = 0;
      }
    }

    // ============================================================================
    // RENDERING
    // ============================================================================

    const Renderer = {
      initGrass() {
        // Pre-generate grass blades for seamless scrolling
        gameState.grassBlades = [];
        const totalWidth = window.innerWidth * 2; // Double width for seamless loop
        
        for (let i = 0; i < totalWidth; i += 8) {
          const blade = {
            x: i,
            height: Utils.random(18, 35),
            width: Utils.random(2, 4),
            color: COLORS.grass[Utils.randomInt(0, COLORS.grass.length - 1)],
            curve: Utils.random(-3, 3),
            swayOffset: Utils.random(0, Math.PI * 2), // For wind animation
            swaySpeed: Utils.random(0.02, 0.04),
            swayAmount: Utils.random(1, 3)
          };
          gameState.grassBlades.push(blade);
        }
      },

      drawGround() {
        const canvasWidth = window.innerWidth;
        const canvasHeight = window.innerHeight;
        const groundHeight = gameState.config.groundHeight;
        const groundY = canvasHeight - groundHeight;

        // Ground base with gradient for depth
        const groundGradient = ctx.createLinearGradient(0, groundY, 0, canvasHeight);
        groundGradient.addColorStop(0, COLORS.ground);
        groundGradient.addColorStop(1, '#6B3410');
        ctx.fillStyle = groundGradient;
        ctx.fillRect(0, groundY, canvasWidth, groundHeight);

        // Static texture pattern (seed-based for consistency)
        ctx.fillStyle = COLORS.groundTexture;
        for (let i = 0; i < canvasWidth; i += 8) {
          for (let j = 0; j < groundHeight; j += 8) {
            // Use position-based pseudo-random for static texture
            const seed = (i * 7 + j * 13) % 100;
            if (seed < 20) {
              ctx.fillRect(i, groundY + j, 2, 2);
            }
          }
        }

        // Grass
        this.drawGrass(groundY);
      },

      drawGrass(groundY) {
        if (gameState.grassBlades.length === 0) {
          this.initGrass();
        }

        const canvasWidth = window.innerWidth;
        const time = performance.now() * 0.001; // Convert to seconds
        
        ctx.globalAlpha = 0.8;

        // Draw grass blades with scrolling and wind animation
        gameState.grassBlades.forEach(blade => {
          // Calculate scrolling position
          let x = blade.x - gameState.grassOffset;
          
          // Wrap around for seamless loop
          while (x < -50) x += canvasWidth * 2;
          while (x > canvasWidth + 50) x -= canvasWidth * 2;
          
          // Skip if off-screen
          if (x < -50 || x > canvasWidth + 50) return;
          
          // Calculate wind sway
          const sway = Math.sin(time * blade.swaySpeed + blade.swayOffset) * blade.swayAmount;
          
          // Draw blade with wind animation
          ctx.fillStyle = blade.color;
          ctx.beginPath();
          ctx.moveTo(x, groundY);
          ctx.quadraticCurveTo(
            x + blade.curve + sway,
            groundY - blade.height / 2,
            x + blade.width + sway * 0.5,
            groundY - blade.height
          );
          ctx.lineTo(x + blade.width, groundY);
          ctx.closePath();
          ctx.fill();
          
          // Add subtle outline to some blades for depth
          if ((blade.x % 40) < 10) {
            ctx.strokeStyle = COLORS.grassBlade;
            ctx.lineWidth = 0.8;
            ctx.globalAlpha = 0.4;
            ctx.stroke();
            ctx.globalAlpha = 0.8;
          }
        });

        ctx.globalAlpha = 1;
      },

      updateGrassScroll(dt) {
        // Scroll grass at same speed as background (1/3 of pipe speed)
        if (gameState.running && !gameState.paused && !gameState.gameOver) {
          gameState.grassOffset += gameState.physics.pipeSpeed / 3 * dt;
          
          // Reset offset when it exceeds canvas width for seamless loop
          if (gameState.grassOffset >= window.innerWidth) {
            gameState.grassOffset -= window.innerWidth;
          }
        }
      },

      render() {
        CanvasManager.clear();

        // Background
        if (gameState.background) {
          gameState.background.draw(ctx);
        }

        // Pipes
        gameState.pipes.forEach(pipe => pipe.draw(ctx));

        // Coins
        gameState.coins.forEach(coin => coin.draw(ctx));

        // Ground with grass
        this.drawGround();

        // Bird
        if (gameState.bird) {
          gameState.bird.draw(ctx);
        }

        // Debug mode overlay
        if (gameState.debugMode) {
          this.drawDebugOverlay();
        }
      },

      drawDebugOverlay() {
        // Draw ground collision line
        const groundY = window.innerHeight - gameState.config.groundHeight;
        ctx.strokeStyle = '#FF00FF';
        ctx.lineWidth = 2;
        ctx.setLineDash([10, 5]);
        ctx.beginPath();
        ctx.moveTo(0, groundY);
        ctx.lineTo(window.innerWidth, groundY);
        ctx.stroke();
        ctx.setLineDash([]);

        // Draw bird hitbox
        if (gameState.bird) {
          gameState.bird.drawDebug(ctx);
        }

        // Draw pipe hitboxes
        gameState.pipes.forEach(pipe => pipe.drawDebug(ctx));

        // Draw coin hitboxes
        gameState.coins.forEach(coin => coin.drawDebug(ctx));

        // Draw debug info panel
        this.drawDebugInfo();
      },

      drawDebugInfo() {
        const padding = 10;
        const lineHeight = 16;
        let y = window.innerHeight - 200;

        // Semi-transparent background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(padding, y - padding, 300, 190);

        // Title
        ctx.fillStyle = '#00FF00';
        ctx.font = 'bold 14px monospace';
        ctx.fillText('DEBUG MODE (Press I to toggle)', padding + 5, y + 5);

        // Debug info
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '12px monospace';
        y += lineHeight + 5;

        const info = [
          `FPS: ${Math.round(1000 / (performance.now() - lastTime))}`,
          `Bird: (${Math.round(gameState.bird?.x || 0)}, ${Math.round(gameState.bird?.y || 0)})`,
          `Velocity: ${gameState.bird?.velocity.toFixed(2) || 0}`,
          `Pipes: ${gameState.pipes.length}`,
          `Coins: ${gameState.coins.length}`,
          `Score: ${gameState.scores.overall}`,
          `State: ${gameState.running ? 'Running' : gameState.paused ? 'Paused' : 'Stopped'}`,
          ``,
          `Legend:`,
          `  Green = Bird hitbox`,
          `  Red = Pipe hitboxes`,
          `  Cyan = Safe gap`,
          `  Yellow = Scoring line`,
          `  Gold = Coin hitbox`,
          `  Magenta = Ground line`
        ];

        info.forEach(line => {
          ctx.fillText(line, padding + 5, y);
          y += lineHeight;
        });
      }
    };

    // ============================================================================
    // GAME LOGIC
    // ============================================================================

    const GameLogic = {
      spawnPipe() {
        const minHeight = 50;
        const maxHeight = window.innerHeight - gameState.config.gap - minHeight - gameState.config.groundHeight;
        const topHeight = Utils.random(minHeight, maxHeight);

        const pipe = new Pipe(
          window.innerWidth,
          topHeight,
          gameState.config.gap,
          gameState.config.pipeWidth
        );

        gameState.pipes.push(pipe);
        this.spawnCoinInPipe(pipe);
        gameState.timers.pipeSpawn = 0;
      },

      spawnCoinInPipe(pipe) {
        // Add some randomness to coin position within the gap
        const gapCenter = pipe.topHeight + gameState.config.gap / 2;
        const randomOffset = Utils.random(-gameState.config.gap * 0.25, gameState.config.gap * 0.25);
        const coinY = gapCenter + randomOffset;
        
        const coin = new Coin(
          pipe.x + gameState.config.pipeWidth / 2,
          coinY,
          gameState.config.coinRadius
        );
        gameState.coins.push(coin);
      },

      spawnSkyCoin() {
        // Limit total coins to prevent performance issues
        if (gameState.coins.length >= 10) return;
        
        const minY = 50;
        const maxY = window.innerHeight - gameState.config.groundHeight - 100;
        const coinY = Utils.random(minY, maxY);
        const coin = new Coin(window.innerWidth, coinY, 15);
        gameState.coins.push(coin);
        gameState.timers.coinSpawn = 0;
      },

      updatePipes(dt) {
        for (let i = gameState.pipes.length - 1; i >= 0; i--) {
          const pipe = gameState.pipes[i];
          pipe.update(dt);

          // Remove off-screen pipes
          if (pipe.isOffScreen()) {
            gameState.pipes.splice(i, 1);
            continue;
          }

          // Check collision
          if (this.checkPipeCollision(pipe)) {
            this.startDeathAnimation();
            return false;
          }

          // Score when passing pipe
          if (!pipe.scored && gameState.bird.x > pipe.x + pipe.width) {
            pipe.scored = true;
            gameState.scores.pipes++;
            this.updateScore();
          }
        }
        return true;
      },

      updateCoins(dt) {
        for (let i = gameState.coins.length - 1; i >= 0; i--) {
          const coin = gameState.coins[i];
          coin.update(dt);

          // Remove off-screen coins
          if (coin.isOffScreen()) {
            gameState.coins.splice(i, 1);
            continue;
          }

          // Check collection
          if (coin.checkCollision(gameState.bird)) {
            coin.collect();
            gameState.scores.coins += 10;
            this.updateScore();
            gameState.coins.splice(i, 1);
          }
        }
      },

      checkPipeCollision(pipe) {
        const bird = gameState.bird.getBounds();
        const bounds = pipe.getBounds();

        // Check if bird is in pipe's x range
        if (bird.x + bird.width > pipe.x && bird.x < pipe.x + pipe.width) {
          // Check collision with top or bottom pipe
          if (bird.y < pipe.topHeight || 
              bird.y + bird.height > pipe.bottomY) {
            return true;
          }
        }

        return false;
      },

      updateScore() {
        gameState.scores.overall = gameState.scores.pipes + gameState.scores.coins;
        
        if (gameState.scores.overall > gameState.scores.session) {
          gameState.scores.session = gameState.scores.overall;
        }

        UI.updateScores();
      },

      startDeathAnimation() {
        if (gameState.isDying || gameState.gameOver) return; // Prevent multiple death calls
        
        console.log('Death animation started - switching to cry sprite');
        
        gameState.isDying = true;
        gameState.birdState = 'cry';
        gameState.deathAnimationTimer = 0;
        
        // Keep game loop running but stop normal game logic
        // gameState.running stays true so loop continues
        
        // Play game over sound immediately on collision
        AudioManager.play(elements.gameOverSound);
        
        // Add upward bounce on collision for dramatic effect
        if (gameState.bird) {
          gameState.bird.velocity = -3;
          console.log('Bird velocity set to -3 for bounce');
        }
        
        AudioManager.pauseMusic();
      },

      finishGameOver() {
        if (gameState.gameOver) return; // Prevent multiple game over calls
        
        gameState.running = false;
        gameState.gameOver = true;
        gameState.isDying = false;

        // Cancel animation frame to prevent ghost loops
        if (animationFrameId !== null) {
          cancelAnimationFrame(animationFrameId);
          animationFrameId = null;
        }

        // Update high scores
        let isNewHighScore = false;
        let isNewAllTimeHighScore = false;

        // Check if current score beats session high score
        if (gameState.scores.overall > gameState.scores.session) {
          gameState.scores.session = gameState.scores.overall;
          isNewHighScore = true;
        }

        // Check if current score beats all-time high score
        if (gameState.scores.overall > gameState.scores.allTime) {
          gameState.scores.allTime = gameState.scores.overall;
          Storage.set(STORAGE_KEYS.HIGH_SCORE, gameState.scores.allTime);
          isNewAllTimeHighScore = true;
          isNewHighScore = false; // All-time record overrides session record
        }

        // Disable controls during game over
        if (elements.settingsButton) elements.settingsButton.disabled = true;
        if (elements.pauseButton) elements.pauseButton.disabled = true;

        UI.showGameOver(isNewHighScore, isNewAllTimeHighScore);
        
        console.log('Game over screen shown');
      },

      reset() {
        gameState.pipes = [];
        gameState.coins = [];
        gameState.scores.overall = 0;
        gameState.scores.pipes = 0;
        gameState.scores.coins = 0;
        gameState.timers.pipeSpawn = 0;
        gameState.timers.coinSpawn = 0;
        gameState.birdState = 'normal';
        gameState.gameOver = false;
        gameState.isDying = false;
        gameState.deathAnimationTimer = 0;
        gameState.grassOffset = 0;

        if (gameState.bird) {
          gameState.bird.reset(window.innerWidth / 4, window.innerHeight / 2);
          // Reapply physics in case difficulty changed
          gameState.bird.gravity = gameState.physics.gravity;
          gameState.bird.flapStrength = gameState.physics.flapStrength;
        }

        if (gameState.background) {
          gameState.background.reset();
        }

        UI.updateScores();
      }
    };

    // ============================================================================
    // UI MANAGEMENT
    // ============================================================================

    const UI = {
      updateScores() {
        if (elements.score) {
          elements.score.textContent = gameState.scores.overall;
        }
        if (elements.pipeScore) {
          elements.pipeScore.textContent = gameState.scores.pipes;
        }
        if (elements.coinScore) {
          elements.coinScore.textContent = gameState.scores.coins;
        }
        if (elements.highScore) {
          elements.highScore.textContent = `High Score: ${gameState.scores.session}`;
        }
        if (elements.allTimeHighScore) {
          elements.allTimeHighScore.textContent = `All-Time Best: ${gameState.scores.allTime}`;
        }
      },

      showMenu(menuId) {
        Object.values(elements).forEach(el => {
          if (el && el.classList && el.classList.contains('menu')) {
            el.style.display = 'none';
          }
        });

        const menu = document.getElementById(menuId);
        if (menu) {
          menu.style.display = 'flex';
        }
      },

      showGameOver(isNewHighScore, isNewAllTimeHighScore) {
        if (elements.finalScore) {
          elements.finalScore.textContent = `Your Score: ${gameState.scores.overall}`;
        }

        if (elements.newHighScore) {
          elements.newHighScore.style.display = isNewHighScore && !isNewAllTimeHighScore ? 'block' : 'none';
        }

        if (elements.newAllTimeHighScore) {
          elements.newAllTimeHighScore.style.display = isNewAllTimeHighScore ? 'block' : 'none';
        }

        if (elements.featurePanel) {
          elements.featurePanel.style.display = 'none';
        }

        this.showMenu('gameOverMenu');
      },

      hideAllMenus() {
        Object.values(elements).forEach(el => {
          if (el && el.classList && el.classList.contains('menu')) {
            el.style.display = 'none';
          }
        });
      }
    };

    // ============================================================================
    // GAME LOOP
    // ============================================================================

    function gameLoop(currentTime) {
      // Keep loop running during death animation
      if (!gameState.running && !gameState.isDying) {
        animationFrameId = null;
        return;
      }

      const deltaTime = currentTime - lastTime;
      const dt = Math.min(32, deltaTime) / 16.67;
      lastTime = currentTime;

      // Handle death animation
      if (gameState.isDying && !gameState.gameOver) {
        gameState.deathAnimationTimer += deltaTime;
        
        // Continue updating bird physics during death
        if (gameState.bird) {
          gameState.bird.update(dt);
          
          // Check if bird has hit the ground
          const groundY = window.innerHeight - gameState.config.groundHeight;
          if (gameState.bird.y + gameState.bird.height >= groundY) {
            gameState.bird.y = groundY - gameState.bird.height;
            gameState.bird.velocity = 0;
          }
        }
        
        // Continue background and grass scrolling during death
        if (gameState.background) {
          gameState.background.update(dt);
        }
        Renderer.updateGrassScroll(dt);
        
        // Show game over after bird hits ground + delay
        const hasHitGround = gameState.bird && 
                            gameState.bird.y + gameState.bird.height >= 
                            window.innerHeight - gameState.config.groundHeight - 1;
        
        // Debug logging
        if (hasHitGround && gameState.deathAnimationTimer % 200 < 20) {
          console.log(`Death animation: ${Math.round(gameState.deathAnimationTimer)}ms, waiting for 800ms`);
        }
        
        if (hasHitGround && gameState.deathAnimationTimer >= 800) {
          console.log('Death animation complete, showing game over');
          GameLogic.finishGameOver();
          return;
        }
      }
      // Normal game update
      else if (!gameState.paused && !gameState.gameOver) {
        // Bird
        gameState.bird.update(dt);

        // Check ground collision
        if (gameState.bird.y + gameState.bird.height >= 
            window.innerHeight - gameState.config.groundHeight) {
          GameLogic.startDeathAnimation();
        }

        // Background
        if (gameState.background) {
          gameState.background.update(dt);
        }

        // Pipes - use deltaTime (milliseconds) for spawn timing
        gameState.timers.pipeSpawn += deltaTime;
        if (gameState.timers.pipeSpawn >= gameState.timers.pipeInterval) {
          GameLogic.spawnPipe();
        }

        if (!GameLogic.updatePipes(dt)) {
          // Collision detected, animation will start
        }

        // Coins - spawn sky coins less frequently (every 5 seconds)
        gameState.timers.coinSpawn += deltaTime;
        if (gameState.timers.coinSpawn >= 5000) {
          GameLogic.spawnSkyCoin();
        }

        GameLogic.updateCoins(dt);
        
        // Update grass scroll
        Renderer.updateGrassScroll(dt);
      }

      // Render
      Renderer.render();

      // Continue loop
      animationFrameId = requestAnimationFrame(gameLoop);
    }

    // ============================================================================
    // GAME CONTROLS
    // ============================================================================

    window.startGame = function() {
      if (!gameState.assetsLoaded) return;

      // Cancel any existing animation frame
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }

      GameLogic.reset();

      gameState.bird = new Bird(
        window.innerWidth / 4,
        window.innerHeight / 2,
        gameState.config.birdWidth,
        gameState.config.birdHeight
      );

      gameState.background = new Background(
        gameState.assets.currentBackground,
        gameState.physics.pipeSpeed / 3
      );

      gameState.running = true;
      gameState.paused = false;
      gameState.gameOver = false;

      UI.hideAllMenus();

      if (elements.featurePanel) {
        elements.featurePanel.style.display = 'flex';
      }

      if (elements.pauseButton) {
        elements.pauseButton.textContent = 'Pause';
        elements.pauseButton.disabled = false;
      }

      if (elements.settingsButton) {
        elements.settingsButton.disabled = false;
      }

      AudioManager.playMusic();

      lastTime = performance.now();
      animationFrameId = requestAnimationFrame(gameLoop);
    };

    window.restartGame = function() {
      window.startGame();
    };

    window.showStartMenu = function() {
      gameState.running = false;
      gameState.paused = false;
      gameState.gameOver = false;
      
      // Cancel animation frame
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
      
      AudioManager.pauseMusic();

      if (elements.featurePanel) {
        elements.featurePanel.style.display = 'none';
      }

      UI.showMenu('startMenu');
    };

    window.togglePause = function() {
      // Don't allow pause if game is over or not started
      if (gameState.gameOver || (!gameState.running && !gameState.paused)) return;

      gameState.paused = !gameState.paused;

      if (gameState.paused) {
        gameState.running = false;
        AudioManager.pauseMusic();
        UI.showMenu('pauseMenu');
        
        if (elements.pauseButton) {
          elements.pauseButton.textContent = 'Resume';
        }
      } else {
        gameState.running = true;
        AudioManager.playMusic();
        UI.hideAllMenus();
        
        if (elements.pauseButton) {
          elements.pauseButton.textContent = 'Pause';
        }

        lastTime = performance.now();
        if (animationFrameId === null) {
          animationFrameId = requestAnimationFrame(gameLoop);
        }
      }
    };

    window.showSettingsMenu = function() {
      const wasRunning = gameState.running;
      gameState.running = false;
      AudioManager.pauseMusic();

      UI.showMenu('settingsMenu');

      if (elements.settingsMenu) {
        elements.settingsMenu.dataset.wasRunning = wasRunning;
      }
    };

    window.hideSettingsMenu = function() {
      const wasRunning = elements.settingsMenu?.dataset.wasRunning === 'true';

      UI.hideAllMenus();

      if (wasRunning && !gameState.gameOver) {
        gameState.running = true;
        AudioManager.playMusic();
        lastTime = performance.now();
        if (animationFrameId === null) {
          animationFrameId = requestAnimationFrame(gameLoop);
        }
      } else if (gameState.gameOver) {
        UI.showMenu('gameOverMenu');
      } else {
        UI.showMenu('startMenu');
      }
    };

    window.changeBirdSkin = function(skin) {
      // Force to utkarsh only
      const selected = 'utkarsh.png';
      gameState.settings.birdSkin = selected;
      Storage.set(STORAGE_KEYS.BIRD_SKIN, selected);
      if (gameState.assets.birds.utkarsh) {
        gameState.assets.currentBird = gameState.assets.birds.utkarsh;
      }
    };

    window.changeBackgroundTheme = function(theme) {
      // Force to city background only
      const selected = 'city_background.png';
      gameState.settings.background = selected;
      Storage.set(STORAGE_KEYS.BACKGROUND, selected);
      if (gameState.assets.backgrounds.city) {
        gameState.assets.currentBackground = gameState.assets.backgrounds.city;
        if (gameState.background) {
          gameState.background.image = gameState.assets.backgrounds.city;
        }
      }
    };

    window.changeDifficulty = function(difficulty) {
      gameState.settings.difficulty = difficulty;
      Storage.set(STORAGE_KEYS.DIFFICULTY, difficulty);
      
      const settings = DIFFICULTY_SETTINGS[difficulty] || DIFFICULTY_SETTINGS.normal;
      
      gameState.physics.gravity = settings.gravity;
      gameState.physics.pipeSpeed = settings.pipeSpeed;
      gameState.config.gap = settings.gap;
      gameState.timers.pipeInterval = settings.spawnInterval;
      
      if (gameState.bird) {
        gameState.bird.gravity = settings.gravity;
      }
      
      gameState.pipes.forEach(pipe => {
        pipe.speed = settings.pipeSpeed;
      });
      
      gameState.coins.forEach(coin => {
        coin.speed = settings.pipeSpeed;
      });
      
      if (gameState.background) {
        gameState.background.speed = settings.pipeSpeed / 3;
      }
    };

    window.changePipeSkin = function(skin) {
      gameState.settings.pipeSkin = skin;
      Storage.set(STORAGE_KEYS.PIPE_SKIN, skin);
    };

    window.resetAllTimeHighScore = function() {
      if (confirm('Are you sure you want to reset all high scores?')) {
        gameState.scores.allTime = 0;
        gameState.scores.session = 0;
        Storage.set(STORAGE_KEYS.HIGH_SCORE, 0);
        UI.updateScores();
        alert('All high scores have been reset!');
      }
    };

    // ============================================================================
    // INPUT HANDLERS
    // ============================================================================

    function handleFlap(e) {
      e?.preventDefault();
      // Don't allow flapping during death animation
      if (gameState.running && !gameState.paused && !gameState.gameOver && !gameState.isDying && gameState.bird) {
        gameState.bird.flap();
      }
    }

    canvas.addEventListener('mousedown', handleFlap);
    canvas.addEventListener('touchstart', handleFlap, { passive: false });

    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space') {
        handleFlap(e);
      }
      if (e.code === 'Escape' && gameState.running && !gameState.gameOver) {
        window.togglePause();
      }
      // Toggle debug mode with 'I' key
      if (e.code === 'KeyI') {
        gameState.debugMode = !gameState.debugMode;
        console.log(`Debug mode: ${gameState.debugMode ? 'ON' : 'OFF'}`);
      }
    });

    // ============================================================================
    // SETTINGS LISTENERS
    // ============================================================================

    if (elements.masterVolume) {
      elements.masterVolume.addEventListener('input', AudioManager.updateVolumes.bind(AudioManager));
    }

    if (elements.soundEffectsVolume) {
      elements.soundEffectsVolume.addEventListener('input', AudioManager.updateVolumes.bind(AudioManager));
    }

    if (elements.musicVolume) {
      elements.musicVolume.addEventListener('input', AudioManager.updateVolumes.bind(AudioManager));
    }

    // ============================================================================
    // ASSET LOADING
    // ============================================================================

    const AssetLoader = {
      checkComplete() {
        gameState.loadedAssets++;
        
        if (gameState.loadedAssets >= gameState.totalAssets) {
          gameState.assetsLoaded = true;
          this.onComplete();
        }
      },

      onComplete() {
        if (elements.loadingScreen) {
          elements.loadingScreen.style.display = 'none';
        }

        // Load settings
        this.loadSettings();

        // Show start menu
        UI.showMenu('startMenu');

        // Initialize audio
        AudioManager.init();
      },

      loadSettings() {
        // Load all-time high score
        gameState.scores.allTime = parseInt(Storage.get(STORAGE_KEYS.HIGH_SCORE, '0'));
        
        // Load difficulty
        const difficulty = Storage.get(STORAGE_KEYS.DIFFICULTY, 'normal');
        if (elements.difficultySelect) {
          elements.difficultySelect.value = difficulty;
        }
        window.changeDifficulty(difficulty);
        
        // Load bird skin
        const birdSkin = 'utkarsh.png';
        if (elements.birdSkinSelect) {
          elements.birdSkinSelect.value = birdSkin;
        }
        window.changeBirdSkin(birdSkin);
        
        // Load background
        const background = 'city_background.png';
        if (elements.backgroundSelect) {
          elements.backgroundSelect.value = background;
        }
        window.changeBackgroundTheme(background);
        
        // Load pipe skin
        const pipeSkin = Storage.get(STORAGE_KEYS.PIPE_SKIN, 'green');
        if (elements.pipeSkinSelect) {
          elements.pipeSkinSelect.value = pipeSkin;
        }
        window.changePipeSkin(pipeSkin);
        
        // Load music setting
        gameState.settings.musicEnabled = Storage.getBoolean(STORAGE_KEYS.MUSIC, true);
        
        // Update score display
        UI.updateScores();
      },

      init() {
        // Load Utkarsh bird states
        gameState.assets.birdStates.normal = new Image();
        gameState.assets.birdStates.normal.src = 'assets/images/utkarsh.png';
        gameState.assets.birdStates.normal.onload = () => {
          this.calculateBirdDimensions(gameState.assets.birdStates.normal);
          this.checkComplete();
        };
        gameState.assets.birdStates.normal.onerror = () => {
          console.warn('Failed to load utkarsh normal state');
          this.checkComplete();
        };

        gameState.assets.birdStates.jump = new Image();
        gameState.assets.birdStates.jump.src = 'assets/images/utkarsh-jump.png';
        gameState.assets.birdStates.jump.onload = () => this.checkComplete();
        gameState.assets.birdStates.jump.onerror = () => {
          console.warn('Failed to load utkarsh jump state, using normal');
          gameState.assets.birdStates.jump = gameState.assets.birdStates.normal;
          this.checkComplete();
        };

        gameState.assets.birdStates.cry = new Image();
        gameState.assets.birdStates.cry.src = 'assets/images/utkarsh-cry.png';
        gameState.assets.birdStates.cry.onload = () => this.checkComplete();
        gameState.assets.birdStates.cry.onerror = () => {
          console.warn('Failed to load utkarsh cry state, using normal');
          gameState.assets.birdStates.cry = gameState.assets.birdStates.normal;
          this.checkComplete();
        };

        // Load only City background
        gameState.assets.backgrounds.city = new Image();
        gameState.assets.backgrounds.city.src = 'assets/images/city_background.png';
        gameState.assets.backgrounds.city.onload = () => this.checkComplete();
        gameState.assets.backgrounds.city.onerror = () => {
          console.warn('Failed to load city background');
          this.checkComplete();
        };

        // Set default assets
        gameState.assets.currentBird = gameState.assets.birdStates.normal;
        gameState.assets.currentBackground = gameState.assets.backgrounds.city;
      },

      calculateBirdDimensions(image) {
        // Calculate bird dimensions based on original image aspect ratio
        if (image && image.complete && image.naturalWidth > 0) {
          const aspectRatio = image.naturalWidth / image.naturalHeight;
          const baseSize = gameState.config.birdBaseSize;
          
          // Maintain aspect ratio based on base size
          if (aspectRatio >= 1) {
            // Wider than tall (landscape)
            gameState.config.birdWidth = baseSize;
            gameState.config.birdHeight = baseSize / aspectRatio;
          } else {
            // Taller than wide (portrait)
            gameState.config.birdHeight = baseSize;
            gameState.config.birdWidth = baseSize * aspectRatio;
          }
          
          console.log(`Bird dimensions calculated: ${Math.round(gameState.config.birdWidth)}x${Math.round(gameState.config.birdHeight)} (aspect ratio: ${aspectRatio.toFixed(2)})`);
          
          // Update existing bird if it exists
          if (gameState.bird) {
            gameState.bird.width = gameState.config.birdWidth;
            gameState.bird.height = gameState.config.birdHeight;
          }
        }
      }
    };

    // ============================================================================
    // INITIALIZATION
    // ============================================================================

    function initialize() {
      // Setup canvas
      CanvasManager.resize();
      window.addEventListener('resize', () => {
        CanvasManager.resize();
      });

      // Hide UI initially
      if (elements.featurePanel) {
        elements.featurePanel.style.display = 'none';
      }

      // Start asset loading
      AssetLoader.init();
    }

    // Start the game when DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initialize);
    } else {
      initialize();
    }
