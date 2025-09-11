"use client"; // This component uses client-side hooks

import React, { useEffect, useRef } from 'react';

// Helper function to interpolate between two colors
const interpolateColor = (color1: number[], color2: number[], factor: number): number[] => {
  const result = color1.slice();
  for (let i = 0; i < 3; i++) {
    result[i] = Math.round(result[i] + factor * (color2[i] - result[i]));
  }
  return result;
};

// Helper function to get a color from the gradient
const getColor = (t: number, colors: number[][]): number[] => {
  const colorIndex = Math.floor(t * (colors.length - 1));
  const factor = t * (colors.length - 1) - colorIndex;
  const color1 = colors[colorIndex];
  const color2 = colors[colorIndex + 1] || colors[colorIndex];
  return interpolateColor(color1, color2, factor);
};

const GranularGradientCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // --- CUSTOMIZATION ---
  const colors: number[][] = [
    [45, 212, 191],   // teal-400
    [129, 140, 248],  // indigo-400
    [244, 114, 182],  // pink-400
  ];
  const cellSize: number = 10; // Size of each "pixel"
  const noiseSpeed: number = 0.003; // How fast the pattern animates
  // -------------------

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;
    
    let animationFrameId: number;

    // A simple pseudo-random number generator for deterministic noise
    let seed = Math.random();
    const random = (): number => {
      const x = Math.sin(seed++) * 10000;
      return x - Math.floor(x);
    };

    const draw = (time: number) => {
      const width = canvas.width;
      const height = canvas.height;
      const t = time * noiseSpeed;

      // Create a gradient pattern with pseudo-random noise
      const imageData = ctx.createImageData(width, height);
      const data = imageData.data;

      for (let x = 0; x < width; x += cellSize) {
        for (let y = 0; y < height; y += cellSize) {
          // A simple noise function using time and position
          const noise = (random() + Math.sin(x * 0.01 + t) + Math.cos(y * 0.01 + t)) / 2;
          const normalizedNoise = (noise + 1) / 2; // Normalize to 0-1 range
          
          const [r, g, b] = getColor(normalizedNoise, colors);

          // Fill the cell
          for (let i = 0; i < cellSize; i++) {
            for (let j = 0; j < cellSize; j++) {
              if (x + i < width && y + j < height) {
                const index = ((y + j) * width + (x + i)) * 4;
                data[index] = r;
                data[index + 1] = g;
                data[index + 2] = b;
                data[index + 3] = 255; // Alpha
              }
            }
          }
        }
      }
      ctx.putImageData(imageData, 0, 0);
      animationFrameId = requestAnimationFrame(draw);
    };

    const handleResize = () => {
      // Adjust canvas resolution for the device's pixel ratio
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };

    handleResize();
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(canvas);
    
    draw(0);

    return () => {
      resizeObserver.disconnect();
      cancelAnimationFrame(animationFrameId);
    };
  }, [colors, cellSize, noiseSpeed]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 -z-10 h-full w-full"
    />
  );
};

export default GranularGradientCanvas;