
import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { ParticleShape, HandState } from '../types';

interface ParticleSystemProps {
  shape: ParticleShape;
  color: string;
  handState: HandState;
}

const ParticleSystem: React.FC<ParticleSystemProps> = ({ shape, color, handState }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<THREE.Points | null>(null);
  const geometryRef = useRef<THREE.BufferGeometry | null>(null);
  const materialRef = useRef<THREE.PointsMaterial | null>(null);
  const originalPositions = useRef<Float32Array | null>(null);
  
  const handStateRef = useRef<HandState>(handState);
  const shapeRef = useRef<ParticleShape>(shape);
  
  useEffect(() => {
    handStateRef.current = handState;
  }, [handState]);

  useEffect(() => {
    shapeRef.current = shape;
  }, [shape]);

  const PARTICLE_COUNT = 30000;

  const getShapeData = (type: ParticleShape, baseColor: string): { positions: Float32Array, colors: Float32Array } => {
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const colors = new Float32Array(PARTICLE_COUNT * 3);
    const col = new THREE.Color(baseColor);
    
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      let x = 0, y = 0, z = 0;
      let r = col.r, g = col.g, b = col.b;
      const idx = i * 3;

      switch (type) {
        case 'heart': {
          const u = Math.random() * Math.PI * 2;
          const v = Math.random() * Math.PI * 2;
          const volume = Math.pow(Math.random(), 1/3);
          x = 16 * Math.pow(Math.sin(u), 3) * volume;
          y = (13 * Math.cos(u) - 5 * Math.cos(2 * u) - 2 * Math.cos(3 * u) - Math.cos(4 * u)) * volume;
          z = (Math.sin(v) * 8) * (1 - volume * 0.5) * Math.abs(Math.sin(u));
          x *= 0.15; y *= 0.15; z *= 0.15;
          
          const mix = Math.random();
          const tempCol = new THREE.Color(baseColor).offsetHSL(mix * 0.05 - 0.025, 0.1, -mix * 0.2);
          r = tempCol.r; g = tempCol.g; b = tempCol.b;
          break;
        }
        case 'star': {
          const t = Math.random() * Math.PI * 2;
          const points = 5;
          const innerRadius = 2.0;
          const outerRadius = 5.0;
          const modT = (t * points) / (Math.PI * 2);
          const fraction = modT % 1;
          const starR = fraction < 0.5 
            ? THREE.MathUtils.lerp(outerRadius, innerRadius, fraction * 2) 
            : THREE.MathUtils.lerp(innerRadius, outerRadius, (fraction - 0.5) * 2);
          const maxThickness = 2.0;
          const thickness = (1 - (starR / outerRadius)) * maxThickness * (Math.random() * 2 - 1);
          x = starR * Math.cos(t);
          y = starR * Math.sin(t);
          z = thickness; 
          
          const brightness = 0.7 + Math.random() * 0.4;
          r *= brightness; g *= brightness; b *= brightness;
          break;
        }
        case 'tree': {
          // Multi-tiered Christmas Tree Structure
          const rand = Math.random();
          
          // 1. TRUNK (Bottom ~5%)
          if (rand < 0.05) {
             const h = Math.random(); 
             y = -4.5 + h * 1.5; // -4.5 to -3.0
             const radius = 0.4 + Math.random() * 0.2;
             const theta = Math.random() * Math.PI * 2;
             x = radius * Math.cos(theta);
             z = radius * Math.sin(theta);
             
             // Wood/Brown color
             r = 0.4; g = 0.25; b = 0.1; 
          } 
          // 2. STAR (Top ~2%)
          else if (rand < 0.07) {
             const rStar = Math.pow(Math.random(), 1/3) * 0.6;
             const theta = Math.random() * Math.PI * 2;
             const phi = Math.acos(2 * Math.random() - 1);
             x = rStar * Math.sin(phi) * Math.cos(theta);
             y = 4.8 + rStar * Math.sin(phi) * Math.sin(theta);
             z = rStar * Math.cos(phi);
             
             // Bright Gold/Yellow
             r = 1.0; g = 0.9; b = 0.2;
          }
          // 3. LEAVES & ORNAMENTS (The rest)
          else {
             // 3 Conical Tiers
             const tier = Math.random();
             let yBase, yTop, rBase;
             
             if (tier < 0.4) { // Bottom Tier (Widest)
                yBase = -3.0; yTop = 0.0; rBase = 3.5;
             } else if (tier < 0.75) { // Middle Tier
                yBase = -1.0; yTop = 2.5; rBase = 2.5;
             } else { // Top Tier (Narrowest)
                yBase = 1.5; yTop = 4.5; rBase = 1.5;
             }
             
             const h = Math.random(); // 0 to 1 height in tier
             y = yBase + h * (yTop - yBase);
             
             const maxR = rBase * (1 - h);
             const radius = Math.sqrt(Math.random()) * maxR;
             const theta = Math.random() * Math.PI * 2;
             
             x = radius * Math.cos(theta);
             z = radius * Math.sin(theta);
             
             // Check if particle is near the surface (candidate for ornament)
             const isSurface = radius > maxR * 0.85;
             const isOrnament = isSurface && Math.random() < 0.12; // 12% chance on surface
             
             if (isOrnament) {
                // Push ornament slightly out
                x *= 1.1; z *= 1.1;
                const decoType = Math.random();
                if (decoType < 0.3) { // Red Ball
                    r = 1.0; g = 0.1; b = 0.2;
                } else if (decoType < 0.6) { // Gold Ball
                    r = 1.0; g = 0.8; b = 0.1;
                } else if (decoType < 0.8) { // Blue Ball
                    r = 0.2; g = 0.5; b = 1.0;
                } else { // White Light
                    r = 1.0; g = 1.0; b = 1.0;
                }
             } else {
                // Pine Green Variations
                const noise = (Math.random() - 0.5) * 0.3;
                const treeCol = new THREE.Color(baseColor).offsetHSL(noise * 0.2, 0, noise);
                r = treeCol.r; g = treeCol.g; b = treeCol.b;
                
                // Add some "snow" dust on top of branches (upward facing surfaces)?
                // Simple hack: random white specks inside volume
                if (Math.random() < 0.05) {
                   r = 0.9; g = 0.95; b = 1.0;
                }
             }
          }
          break;
        }
        case 'planet': {
          if (i < PARTICLE_COUNT * 0.7) {
            const pPhi = Math.acos(2 * Math.random() - 1);
            const pTheta = Math.random() * Math.PI * 2;
            const pR = 3.5;
            x = pR * Math.sin(pPhi) * Math.cos(pTheta);
            y = pR * Math.sin(pPhi) * Math.sin(pTheta);
            z = pR * Math.cos(pPhi);
            r *= 0.9; g *= 0.9; b *= 0.9;
          } else {
            const rR = 5.0 + Math.random() * 2.0;
            const rTheta = Math.random() * Math.PI * 2;
            x = rR * Math.cos(rTheta);
            y = rR * Math.sin(rTheta) * 0.15;
            z = rR * Math.sin(rTheta) * 0.8;
            const tempCol = new THREE.Color(baseColor).offsetHSL(0.05, -0.2, 0.2);
            r = tempCol.r; g = tempCol.g; b = tempCol.b;
          }
          break;
        }
      }
      
      positions[idx] = x;
      positions[idx + 1] = y;
      positions[idx + 2] = z;
      
      colors[idx] = r;
      colors[idx + 1] = g;
      colors[idx + 2] = b;
    }
    return { positions, colors };
  };

  useEffect(() => {
    if (!mountRef.current) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mountRef.current.appendChild(renderer.domElement);

    const geometry = new THREE.BufferGeometry();
    const data = getShapeData(shape, color);
    originalPositions.current = new Float32Array(data.positions);
    
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(data.positions), 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(new Float32Array(data.colors), 3));

    const material = new THREE.PointsMaterial({
      size: 0.05,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      opacity: 0.8,
      sizeAttenuation: true,
      vertexColors: true
    });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);
    particlesRef.current = particles;
    geometryRef.current = geometry;
    materialRef.current = material;

    camera.position.z = 18;

    let frame = 0;
    const animate = () => {
      frame = requestAnimationFrame(animate);
      const currentHandState = handStateRef.current;
      const currentShape = shapeRef.current;
      const dist = currentHandState.distance;

      if (particlesRef.current && originalPositions.current && geometryRef.current) {
        const positions = geometryRef.current.attributes.position.array as Float32Array;
        
        // Tree is a bit taller, adjust zoom scaling if needed, but 1.2 base is fine
        const finalExpansion = 1.2 + (Math.pow(dist, 2) * 12);
        
        for (let i = 0; i < PARTICLE_COUNT; i++) {
          const idx = i * 3;
          const tx = originalPositions.current[idx] * finalExpansion;
          const ty = originalPositions.current[idx + 1] * finalExpansion;
          const tz = originalPositions.current[idx + 2] * finalExpansion;
          
          const lerpSpeed = 0.08 + (dist * 0.1);
          positions[idx] += (tx - positions[idx]) * lerpSpeed;
          positions[idx + 1] += (ty - positions[idx + 1]) * lerpSpeed;
          positions[idx + 2] += (tz - positions[idx + 2]) * lerpSpeed;
        }
        
        geometryRef.current.attributes.position.needsUpdate = true;
        
        // Rotation Logic:
        // If it's the TREE, we want to STOP auto-rotation so the user can control view with hand.
        // For other shapes, we keep the subtle auto-rotation.
        if (currentShape !== 'tree') {
            const rotationSpeed = 0.0015 + (dist * 0.02);
            particlesRef.current.rotation.y += rotationSpeed;
            particlesRef.current.rotation.x += rotationSpeed * 0.4;
        } else {
            // Smoothly dampen rotation to 0 for stability
            particlesRef.current.rotation.y *= 0.9;
            particlesRef.current.rotation.x *= 0.9;
            // Optionally force upright if it stops at weird angle, but damping usually feels natural
            if (Math.abs(particlesRef.current.rotation.y) < 0.001) particlesRef.current.rotation.y = 0;
            if (Math.abs(particlesRef.current.rotation.x) < 0.001) particlesRef.current.rotation.x = 0;
        }

        if (materialRef.current) {
          materialRef.current.opacity = 0.3 + (dist * 0.6);
          // Make particles slightly bigger for tree ornaments visibility
          materialRef.current.size = (currentShape === 'tree' ? 0.05 : 0.04) + (dist * 0.07);
        }

        camera.position.x += (currentHandState.position.x * 2.5 - camera.position.x) * 0.05;
        camera.position.y += (currentHandState.position.y * 2.5 - camera.position.y) * 0.05;
        camera.lookAt(0, 0, 0);
      }

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', handleResize);
      if (mountRef.current) mountRef.current.removeChild(renderer.domElement);
      geometry.dispose();
      material.dispose();
    };
  }, []);

  useEffect(() => {
    if (geometryRef.current) {
      const data = getShapeData(shape, color);
      originalPositions.current = new Float32Array(data.positions);
      geometryRef.current.setAttribute('color', new THREE.BufferAttribute(new Float32Array(data.colors), 3));
      geometryRef.current.attributes.color.needsUpdate = true;
    }
  }, [shape, color]);

  return <div ref={mountRef} className="w-full h-full" />;
};

export default ParticleSystem;
