"use client";

import { useEffect, useRef, useState } from "react";

interface Brick {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  active: boolean;
  points: number;
}

interface Ball {
  x: number;
  y: number;
  dx: number;
  dy: number;
  radius: number;
}

interface Paddle {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
}

type GameState = "ready" | "playing" | "paused" | "gameOver" | "win";

const ArkanoidGame = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<GameState>("ready");
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const animationFrameRef = useRef<number>();
  const keysPressed = useRef<{ [key: string]: boolean }>({});

  // Game constants
  const CANVAS_WIDTH = 800;
  const CANVAS_HEIGHT = 600;
  const PADDLE_WIDTH = 120;
  const PADDLE_HEIGHT = 15;
  const BALL_RADIUS = 8;
  const BRICK_ROWS = 6;
  const BRICK_COLS = 10;
  const BRICK_WIDTH = 70;
  const BRICK_HEIGHT = 25;
  const BRICK_PADDING = 10;
  const BRICK_OFFSET_TOP = 60;
  const BRICK_OFFSET_LEFT = 35;

  // Game objects refs
  const paddle = useRef<Paddle>({
    x: CANVAS_WIDTH / 2 - PADDLE_WIDTH / 2,
    y: CANVAS_HEIGHT - 40,
    width: PADDLE_WIDTH,
    height: PADDLE_HEIGHT,
    speed: 8,
  });

  const ball = useRef<Ball>({
    x: CANVAS_WIDTH / 2,
    y: CANVAS_HEIGHT / 2,
    dx: 4,
    dy: -4,
    radius: BALL_RADIUS,
  });

  const bricks = useRef<Brick[]>([]);

  // Initialize bricks
  const initBricks = () => {
    const colors = ["#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA07A", "#98D8C8", "#F7DC6F"];
    const newBricks: Brick[] = [];

    for (let row = 0; row < BRICK_ROWS; row++) {
      for (let col = 0; col < BRICK_COLS; col++) {
        newBricks.push({
          x: col * (BRICK_WIDTH + BRICK_PADDING) + BRICK_OFFSET_LEFT,
          y: row * (BRICK_HEIGHT + BRICK_PADDING) + BRICK_OFFSET_TOP,
          width: BRICK_WIDTH,
          height: BRICK_HEIGHT,
          color: colors[row % colors.length],
          active: true,
          points: (BRICK_ROWS - row) * 10,
        });
      }
    }

    bricks.current = newBricks;
  };

  // Reset ball position
  const resetBall = () => {
    ball.current = {
      x: CANVAS_WIDTH / 2,
      y: CANVAS_HEIGHT / 2,
      dx: 4 * (Math.random() > 0.5 ? 1 : -1),
      dy: -4,
      radius: BALL_RADIUS,
    };
  };

  // Reset game
  const resetGame = () => {
    setScore(0);
    setLives(3);
    initBricks();
    resetBall();
    paddle.current.x = CANVAS_WIDTH / 2 - PADDLE_WIDTH / 2;
    setGameState("ready");
  };

  // Draw functions
  const drawBall = (ctx: CanvasRenderingContext2D) => {
    const b = ball.current;
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
    ctx.fillStyle = "#FFFFFF";
    ctx.fill();
    ctx.closePath();

    // Add glow effect
    ctx.shadowBlur = 15;
    ctx.shadowColor = "#FFFFFF";
    ctx.fill();
    ctx.shadowBlur = 0;
  };

  const drawPaddle = (ctx: CanvasRenderingContext2D) => {
    const p = paddle.current;
    const gradient = ctx.createLinearGradient(p.x, p.y, p.x, p.y + p.height);
    gradient.addColorStop(0, "#6B5BFF");
    gradient.addColorStop(1, "#4A3FD9");

    ctx.fillStyle = gradient;
    ctx.fillRect(p.x, p.y, p.width, p.height);

    // Border
    ctx.strokeStyle = "#8B7FFF";
    ctx.lineWidth = 2;
    ctx.strokeRect(p.x, p.y, p.width, p.height);
  };

  const drawBricks = (ctx: CanvasRenderingContext2D) => {
    bricks.current.forEach((brick) => {
      if (brick.active) {
        ctx.fillStyle = brick.color;
        ctx.fillRect(brick.x, brick.y, brick.width, brick.height);

        // Border
        ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
        ctx.lineWidth = 2;
        ctx.strokeRect(brick.x, brick.y, brick.width, brick.height);

        // Highlight
        const gradient = ctx.createLinearGradient(
          brick.x,
          brick.y,
          brick.x,
          brick.y + brick.height
        );
        gradient.addColorStop(0, "rgba(255, 255, 255, 0.3)");
        gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
        ctx.fillStyle = gradient;
        ctx.fillRect(brick.x, brick.y, brick.width, brick.height / 2);
      }
    });
  };

  const drawUI = (ctx: CanvasRenderingContext2D) => {
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "20px Arial";
    ctx.fillText(`Score: ${score}`, 20, 30);
    ctx.fillText(`Lives: ${lives}`, CANVAS_WIDTH - 100, 30);
  };

  const drawGameState = (ctx: CanvasRenderingContext2D) => {
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.fillStyle = "#FFFFFF";
    ctx.font = "48px Arial";
    ctx.textAlign = "center";

    if (gameState === "ready") {
      ctx.fillText("ARKANOID", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 50);
      ctx.font = "24px Arial";
      ctx.fillText("Press SPACE to start", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
      ctx.fillText("Use ← → or A D to move paddle", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 60);
    } else if (gameState === "paused") {
      ctx.fillText("PAUSED", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
      ctx.font = "24px Arial";
      ctx.fillText("Press SPACE to continue", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50);
    } else if (gameState === "gameOver") {
      ctx.fillText("GAME OVER", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
      ctx.font = "24px Arial";
      ctx.fillText(`Final Score: ${score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);
      ctx.fillText("Press R to restart", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 70);
    } else if (gameState === "win") {
      ctx.fillText("YOU WIN!", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
      ctx.font = "24px Arial";
      ctx.fillText(`Final Score: ${score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);
      ctx.fillText("Press R to play again", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 70);
    }

    ctx.textAlign = "left";
  };

  // Collision detection
  const checkBallBrickCollision = () => {
    const b = ball.current;

    for (let i = 0; i < bricks.current.length; i++) {
      const brick = bricks.current[i];

      if (brick.active) {
        if (
          b.x + b.radius > brick.x &&
          b.x - b.radius < brick.x + brick.width &&
          b.y + b.radius > brick.y &&
          b.y - b.radius < brick.y + brick.height
        ) {
          // Determine which side of the brick was hit
          const ballCenterX = b.x;
          const ballCenterY = b.y;
          const brickCenterX = brick.x + brick.width / 2;
          const brickCenterY = brick.y + brick.height / 2;

          const dx = ballCenterX - brickCenterX;
          const dy = ballCenterY - brickCenterY;

          const width = (brick.width + b.radius * 2) / 2;
          const height = (brick.height + b.radius * 2) / 2;
          const crossWidth = width * dy;
          const crossHeight = height * dx;

          // Reverse ball direction based on collision side
          if (Math.abs(crossWidth) > Math.abs(crossHeight)) {
            b.dy = -b.dy;
          } else {
            b.dx = -b.dx;
          }

          brick.active = false;
          setScore((prev) => prev + brick.points);

          break;
        }
      }
    }
  };

  const checkBallPaddleCollision = () => {
    const b = ball.current;
    const p = paddle.current;

    if (
      b.x + b.radius > p.x &&
      b.x - b.radius < p.x + p.width &&
      b.y + b.radius > p.y &&
      b.y - b.radius < p.y + p.height
    ) {
      // Calculate where the ball hit the paddle (0 = left edge, 1 = right edge)
      const hitPosition = (b.x - p.x) / p.width;

      // Adjust ball angle based on hit position
      const angle = (hitPosition - 0.5) * Math.PI * 0.6; // Max 54 degrees from vertical
      const speed = Math.sqrt(b.dx * b.dx + b.dy * b.dy);

      b.dx = Math.sin(angle) * speed;
      b.dy = -Math.abs(Math.cos(angle) * speed);

      // Ensure ball is above paddle
      b.y = p.y - b.radius;
    }
  };

  // Update game
  const update = () => {
    if (gameState !== "playing") return;

    const b = ball.current;
    const p = paddle.current;

    // Move ball
    b.x += b.dx;
    b.y += b.dy;

    // Ball collision with walls
    if (b.x + b.radius > CANVAS_WIDTH || b.x - b.radius < 0) {
      b.dx = -b.dx;
    }

    if (b.y - b.radius < 0) {
      b.dy = -b.dy;
    }

    // Ball falls below paddle
    if (b.y - b.radius > CANVAS_HEIGHT) {
      setLives((prev) => {
        const newLives = prev - 1;
        if (newLives <= 0) {
          setGameState("gameOver");
        } else {
          resetBall();
          setGameState("ready");
        }
        return newLives;
      });
    }

    // Move paddle
    if (keysPressed.current["ArrowLeft"] || keysPressed.current["a"]) {
      p.x -= p.speed;
    }
    if (keysPressed.current["ArrowRight"] || keysPressed.current["d"]) {
      p.x += p.speed;
    }

    // Keep paddle in bounds
    if (p.x < 0) p.x = 0;
    if (p.x + p.width > CANVAS_WIDTH) p.x = CANVAS_WIDTH - p.width;

    // Check collisions
    checkBallPaddleCollision();
    checkBallBrickCollision();

    // Check win condition
    const activeBricks = bricks.current.filter((b) => b.active).length;
    if (activeBricks === 0) {
      setGameState("win");
    }
  };

  // Render
  const render = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = "#0F0F23";
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw game objects
    drawBricks(ctx);
    drawPaddle(ctx);
    drawBall(ctx);
    drawUI(ctx);

    // Draw game state overlay
    if (gameState !== "playing") {
      drawGameState(ctx);
    }
  };

  // Game loop
  const gameLoop = () => {
    update();
    render();
    animationFrameRef.current = requestAnimationFrame(gameLoop);
  };

  // Keyboard event handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current[e.key] = true;

      if (e.key === " " || e.key === "Spacebar") {
        e.preventDefault();
        if (gameState === "ready") {
          setGameState("playing");
        } else if (gameState === "playing") {
          setGameState("paused");
        } else if (gameState === "paused") {
          setGameState("playing");
        }
      }

      if (e.key === "r" || e.key === "R") {
        if (gameState === "gameOver" || gameState === "win") {
          resetGame();
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current[e.key] = false;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [gameState]);

  // Initialize game
  useEffect(() => {
    initBricks();
    gameLoop();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Restart game loop when game state changes
  useEffect(() => {
    if (gameState === "playing" && !animationFrameRef.current) {
      gameLoop();
    }
  }, [gameState]);

  return (
    <div className="flex flex-col items-center gap-4">
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="border-4 border-purple-500 rounded-lg shadow-2xl"
      />
      <div className="text-white text-center">
        <p className="text-sm opacity-75">
          Controls: Arrow Keys or A/D | Space: Start/Pause | R: Restart
        </p>
      </div>
    </div>
  );
};

export default ArkanoidGame;
