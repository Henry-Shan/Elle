"use client";

import { useEffect, useRef } from "react";

export default function MouseFlowBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    let mouseX = -100;
    let mouseY = -100; // start off-screen
    
    // Grid configuration
    const gridSize = 80; // Larger pixels
    const padding = 2;   
    const decayRate = 0.005; // Much slower fade

    // Track active pixels: map key "col,row" -> logic
    const activeCells = new Map<string, number>();

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };
    resize();

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;

      // Identify grid cell
      const col = Math.floor(mouseX / gridSize);
      const row = Math.floor(mouseY / gridSize);
      const key = `${col},${row}`;
      
      // Activate cell (highlight)
      // Only reset if it's low opacity to avoid aggressive flickering
      if (!activeCells.has(key) || (activeCells.get(key) || 0) < 0.5) {
          activeCells.set(key, 1.0);
      }
      
      // Smoother neighbor activation
      // Instead of random flickering, purely distance based or very low chance?
      // "decrease blinking effect": reduce random triggers.
      if (Math.random() > 0.85) { // Reduced frequency
        const neighbors = [
            [col+1, row], [col-1, row], [col, row+1], [col, row-1]
        ];
        const randomNeighbor = neighbors[Math.floor(Math.random() * neighbors.length)];
        const nKey = `${randomNeighbor[0]},${randomNeighbor[1]}`;
        
        // Only activate if not already bright
        if (!activeCells.has(nKey)) {
             activeCells.set(nKey, 0.4); // Lower initial opacity for neighbors
        }
      }
    };
    
    // Animation loop
    const animate = () => {
        ctx.clearRect(0, 0, width, height);
        
        // Draw active grid cells (orange pixels)
        ctx.fillStyle = "#FC7B11"; // Elle Orange
        
        // We iterate and update in one pass
        for (const [key, opacity] of activeCells.entries()) {
            if (opacity <= 0) {
                activeCells.delete(key);
                continue;
            }
            
            const [cStr, rStr] = key.split(",");
            const c = Number.parseInt(cStr);
            const r = Number.parseInt(rStr);
            
            const x = c * gridSize;
            const y = r * gridSize;
            
            // Draw rectangle
            ctx.globalAlpha = opacity * 0.15; // Very subtle max opacity (15%)
            ctx.fillRect(x + padding, y + padding, gridSize - padding*2, gridSize - padding*2);
            
            // Draw tiny corner accents for "tech" feel on high opacity cells
            if (opacity > 0.8) {
                ctx.globalAlpha = opacity * 0.4;
                const size = 6;
                // Top-left corner
                ctx.fillRect(x + padding, y + padding, size, 1);
                ctx.fillRect(x + padding, y + padding, 1, size);
            }
            
            // Decay
            activeCells.set(key, opacity - decayRate);
        }
        
        // Draw "Target Focus" brackets around mouse
        if (mouseX > 0 && mouseY > 0) {
            drawReticle(mouseX, mouseY);
        }
        
        requestAnimationFrame(animate);
    };
    
    const drawReticle = (x: number, y: number) => {
        ctx.globalAlpha = 1.0;
        ctx.strokeStyle = "rgba(252, 123, 17, 0.3)";
        ctx.lineWidth = 1;
        
        const size = 15;
        const gap = 5;
        
        // Top Left
        ctx.beginPath();
        ctx.moveTo(x - gap, y - size);
        ctx.lineTo(x - size, y - size);
        ctx.lineTo(x - size, y - gap);
        ctx.stroke();
        
        // Top Right
        ctx.beginPath();
        ctx.moveTo(x + gap, y - size);
        ctx.lineTo(x + size, y - size);
        ctx.lineTo(x + size, y - gap);
        ctx.stroke();
        
        // Bottom Right
        ctx.beginPath();
        ctx.moveTo(x + size, y + gap);
        ctx.lineTo(x + size, y + size);
        ctx.lineTo(x + gap, y + size);
        ctx.stroke();
        
        // Bottom Left
        ctx.beginPath();
        ctx.moveTo(x - gap, y + size);
        ctx.lineTo(x - size, y + size);
        ctx.lineTo(x - size, y + gap);
        ctx.stroke();
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("resize", resize);
    animate();

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0 pointer-events-none mix-blend-screen"
    />
  );
}
