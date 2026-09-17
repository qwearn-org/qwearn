'use client';

/**
 * BlochSphere3D — Interactive 3D Bloch sphere visualizer using Three.js.
 *
 * Renders a 3D unit sphere with translucent glass material, wireframe mesh,
 * equatorial & meridian rings, color-coded axes, pole labels, and an animated
 * state vector pointing to (x, y, z).
 */

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import './bloch.css';

interface BlochSphere3DProps {
  x: number;
  y: number;
  z: number;
  label?: string;
  size?: number;
  interactive?: boolean;
}

export default function BlochSphere3D({
  x,
  y,
  z,
  label = 'State Vector',
  interactive = true,
}: BlochSphere3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<OrbitControls | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 240;
    const height = container.clientHeight || 240;

    // 1. Scene setup
    const scene = new THREE.Scene();
    scene.background = null; // transparent background

    // 2. Camera setup
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(2.2, 1.8, 2.5);

    // 3. Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // 4. OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enableZoom = interactive;
    controls.enableRotate = interactive;
    controls.autoRotate = false;
    controlsRef.current = controls;

    // 5. Ambient & Directional Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0x6366f1, 1.2);
    dirLight1.position.set(5, 5, 5);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xa855f7, 0.8);
    dirLight2.position.set(-5, -5, -5);
    scene.add(dirLight2);

    // 6. Translucent Bloch Sphere
    const sphereGeo = new THREE.SphereGeometry(1, 32, 32);
    const sphereMat = new THREE.MeshPhongMaterial({
      color: 0x1e293b,
      transparent: true,
      opacity: 0.35,
      shininess: 80,
      side: THREE.DoubleSide,
    });
    const sphere = new THREE.Mesh(sphereGeo, sphereMat);
    scene.add(sphere);

    // Wireframe overlay
    const wireGeo = new THREE.WireframeGeometry(sphereGeo);
    const wireMat = new THREE.LineBasicMaterial({
      color: 0x334155,
      transparent: true,
      opacity: 0.25,
    });
    const wireframe = new THREE.LineSegments(wireGeo, wireMat);
    scene.add(wireframe);

    // 7. Equator & Meridian Rings
    const createRing = (radius: number, color: number, rotation: [number, number, number]) => {
      const ringGeo = new THREE.RingGeometry(radius - 0.005, radius + 0.005, 64);
      const ringMat = new THREE.MeshBasicMaterial({
        color,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.5,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.set(...rotation);
      return ring;
    };

    // Equator (X-Y plane -> X-Z in Three.js)
    const equator = createRing(1, 0x475569, [Math.PI / 2, 0, 0]);
    scene.add(equator);

    // Meridian X-Z plane (X-Y in Three.js)
    const meridianXZ = createRing(1, 0x334155, [0, 0, 0]);
    scene.add(meridianXZ);

    // Meridian Y-Z plane (Y-Z in Three.js)
    const meridianYZ = createRing(1, 0x334155, [0, Math.PI / 2, 0]);
    scene.add(meridianYZ);

    // 8. Coordinate Axes
    const createAxis = (from: THREE.Vector3, to: THREE.Vector3, color: number) => {
      const points = [from, to];
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const material = new THREE.LineBasicMaterial({ color, linewidth: 2 });
      return new THREE.Line(geometry, material);
    };

    // X axis (Red)
    scene.add(createAxis(new THREE.Vector3(-1.2, 0, 0), new THREE.Vector3(1.2, 0, 0), 0xef4444));
    // Y axis (Green, Three.js Z)
    scene.add(createAxis(new THREE.Vector3(0, 0, -1.2), new THREE.Vector3(0, 0, 1.2), 0x10b981));
    // Z axis (Blue, Three.js Y, North pole = |0⟩)
    scene.add(createAxis(new THREE.Vector3(0, -1.2, 0), new THREE.Vector3(0, 1.2, 0), 0x6366f1));

    // 9. State Vector Arrow
    // Mapping Bloch (x, y, z) to Three.js (x, z_bloch -> y_three, y_bloch -> z_three)
    const targetPos = new THREE.Vector3(x, z, y);

    // Vector line
    const vecPoints = [new THREE.Vector3(0, 0, 0), targetPos];
    const vecGeo = new THREE.BufferGeometry().setFromPoints(vecPoints);
    const vecMat = new THREE.LineBasicMaterial({ color: 0x22d3ee, linewidth: 4 });
    const vecLine = new THREE.Line(vecGeo, vecMat);
    scene.add(vecLine);

    // Glowing tip sphere
    const tipGeo = new THREE.SphereGeometry(0.06, 16, 16);
    const tipMat = new THREE.MeshBasicMaterial({ color: 0x22d3ee });
    const tipMesh = new THREE.Mesh(tipGeo, tipMat);
    tipMesh.position.copy(targetPos);
    scene.add(tipMesh);

    // Cone arrowhead
    const arrowGeo = new THREE.ConeGeometry(0.04, 0.12, 16);
    const arrowMat = new THREE.MeshBasicMaterial({ color: 0x22d3ee });
    const arrowMesh = new THREE.Mesh(arrowGeo, arrowMat);
    if (targetPos.length() > 0.01) {
      arrowMesh.position.copy(targetPos);
      arrowMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), targetPos.clone().normalize());
    }
    scene.add(arrowMesh);

    // 10. Animation Loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Resize handler
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || 240;
      const h = container.clientHeight || 240;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [x, y, z, interactive]);

  const resetView = () => {
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
  };

  return (
    <div className="bloch-3d-wrapper">
      <div className="bloch-3d-header">
        <span className="bloch-3d-title">🌐 {label}</span>
        {interactive && (
          <button className="bloch-3d-reset-btn" onClick={resetView} title="Reset camera angle">
            ↺ Reset
          </button>
        )}
      </div>

      <div className="bloch-3d-canvas-container" ref={containerRef} />

      <div className="bloch-3d-coords">
        ({x.toFixed(2)}, {y.toFixed(2)}, {z.toFixed(2)})
      </div>

      {interactive && (
        <span className="bloch-3d-controls-hint">Drag to rotate • Scroll to zoom</span>
      )}
    </div>
  );
}
