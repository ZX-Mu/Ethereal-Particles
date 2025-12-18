
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
  
  useEffect(() => {
    handStateRef.current = handState;
  }, [handState]);

  const PARTICLE_COUNT = 25000;

  const getShapePositions = (type: ParticleShape): Float32Array => {
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      let x = 0, y = 0, z = 0;
      const t = (i / PARTICLE_COUNT) * Math.PI * 2;
      
      switch (type) {
        case 'heart':
          const hT = Math.random() * Math.PI * 2;
          x = 16 * Math.pow(Math.sin(hT), 3);
          y = 13 * Math.cos(hT) - 5 * Math.cos(2 * hT) - 2 * Math.cos(3 * hT) - Math.cos(4 * hT);
          x *= 0.15; y *= 0.15;
          break;
        case 'flower':
          const frVal = Math.cos(5 * (t + Math.random() * 0.05)) * 3.5;
          x = frVal * Math.cos(t);
          y = frVal * Math.sin(t);
          break;
        case 'star':
          const modT = t % (Math.PI * 2 / 5);
          const rr = modT < Math.PI / 5 ? 4.5 : 1.8;
          x = rr * Math.cos(t);
          y = rr * Math.sin(t);
          break;
        case 'planet':
          const phi = Math.acos(2 * Math.random() - 1);
          const theta = Math.random() * Math.PI * 2;
          x = 3.0 * Math.sin(phi) * Math.cos(theta);
          y = 3.0 * Math.sin(phi) * Math.sin(theta);
          z = 3.0 * Math.cos(phi);
          break;
        case 'firework':
          const fr = Math.pow(Math.random(), 0.5) * 6;
          const u = Math.random() * Math.PI * 2;
          const v = Math.random() * Math.PI;
          x = fr * Math.sin(v) * Math.cos(u);
          y = fr * Math.sin(v) * Math.sin(u);
          z = fr * Math.cos(v);
          break;
        default:
          x = (Math.random() - 0.5) * 15;
          y = (Math.random() - 0.5) * 15;
          z = (Math.random() - 0.5) * 15;
      }
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
    }
    return positions;
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
    const initialPositions = getShapePositions(shape);
    originalPositions.current = new Float32Array(initialPositions);
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(initialPositions), 3));

    const material = new THREE.PointsMaterial({
      color: new THREE.Color(color),
      size: 0.05,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      opacity: 0.8
    });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);
    particlesRef.current = particles;
    geometryRef.current = geometry;
    materialRef.current = material;

    camera.position.z = 15;

    let frame = 0;
    const animate = () => {
      frame = requestAnimationFrame(animate);
      
      const currentHandState = handStateRef.current;
      
      if (particlesRef.current && originalPositions.current && geometryRef.current) {
        const positions = geometryRef.current.attributes.position.array as Float32Array;
        
        /**
         * UPDATED SCALING RANGE:
         * We set a minimum base scale of 1.2 to avoid shrinking to a point.
         * The expansion now goes from 1.2 (pinched/default) to 12.0 (fully open).
         */
        const dist = currentHandState.distance;
        const expansion = 1.2 + (Math.pow(dist, 2.0) * 10.8);
        
        for (let i = 0; i < PARTICLE_COUNT; i++) {
          const idx = i * 3;
          const targetX = originalPositions.current[idx] * expansion;
          const targetY = originalPositions.current[idx + 1] * expansion;
          const targetZ = originalPositions.current[idx + 2] * expansion;
          
          const lerpSpeed = 0.1 + (dist * 0.15);
          positions[idx] += (targetX - positions[idx]) * lerpSpeed;
          positions[idx + 1] += (targetY - positions[idx + 1]) * lerpSpeed;
          positions[idx + 2] += (targetZ - positions[idx + 2]) * lerpSpeed;

          // Turbulence at high expansion
          if (dist > 0.8) {
            positions[idx] += (Math.random() - 0.5) * 0.05;
            positions[idx + 1] += (Math.random() - 0.5) * 0.05;
          }
        }
        
        geometryRef.current.attributes.position.needsUpdate = true;
        
        // Dynamic rotation
        const baseRot = 0.001;
        const extraRot = dist * 0.025;
        particlesRef.current.rotation.y += baseRot + extraRot;
        particlesRef.current.rotation.x += (baseRot + extraRot) * 0.3;

        if (materialRef.current) {
          // Adjust brightness and size based on expansion
          materialRef.current.size = 0.04 + (dist * 0.1);
          materialRef.current.opacity = 0.5 + (dist * 0.5);
        }

        // Camera follow
        camera.position.x += (currentHandState.position.x * 4 - camera.position.x) * 0.1;
        camera.position.y += (currentHandState.position.y * 4 - camera.position.y) * 0.1;
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
    if (materialRef.current) materialRef.current.color.set(color);
  }, [color]);

  useEffect(() => {
    if (geometryRef.current) {
      const newPos = getShapePositions(shape);
      originalPositions.current = new Float32Array(newPos);
    }
  }, [shape]);

  return <div ref={mountRef} className="w-full h-full" />;
};

export default ParticleSystem;
