"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

interface CompanyNode {
  name: string;
  x: number;
  z: number;
  y: number;
  color: string;
  role: string;
  score: number;
  verdict: "HOT" | "WARM" | "COLD";
}

const COMPANIES: CompanyNode[] = [
  { name: "Google", x: -3.5, z: -2.5, y: 1.5, color: "#3b82f6", role: "Frontend Engineer", score: 94, verdict: "HOT" },
  { name: "Stripe", x: 4.0, z: 1.8, y: 2.0, color: "#635bff", role: "Fullstack Architect", score: 89, verdict: "HOT" },
  { name: "Meta", x: -2.2, z: 3.5, y: 1.2, color: "#06b6d4", role: "React Native Lead", score: 76, verdict: "WARM" },
  { name: "OpenAI", x: 3.8, z: -3.2, y: 2.2, color: "#10a37f", role: "AI Software Eng", score: 98, verdict: "HOT" },
  { name: "Netflix", x: 1.2, z: 4.8, y: 1.0, color: "#ef4444", role: "UI Engineer", score: 62, verdict: "COLD" }
];

export function CyberRadar() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredNode, setHoveredNode] = useState<CompanyNode | null>(null);
  const [labels, setLabels] = useState<Array<{ name: string; x: number; y: number; index: number; color: string; score: number }>>([]);

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight || 450;

    // --- Scene Setup ---
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x030712, 0.08);

    // --- Camera Setup ---
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 10, 15);
    camera.lookAt(0, 0, 0);

    // --- Renderer Setup ---
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      alpha: true,
      powerPreference: "high-performance"
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // --- Lights ---
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(5, 15, 5);
    scene.add(dirLight);

    // --- Grid / Base Radar Rings ---
    const radarGroup = new THREE.Group();
    scene.add(radarGroup);

    // Concentric Radar Rings
    const ringMaterials = [
      new THREE.LineBasicMaterial({ color: 0x6366f1, transparent: true, opacity: 0.15 }),
      new THREE.LineBasicMaterial({ color: 0x6366f1, transparent: true, opacity: 0.25 }),
      new THREE.LineBasicMaterial({ color: 0x6366f1, transparent: true, opacity: 0.4 }),
      new THREE.LineBasicMaterial({ color: 0x6366f1, transparent: true, opacity: 0.6 })
    ];

    const ringRadii = [2, 4, 6, 8];
    ringRadii.forEach((radius, idx) => {
      const ringGeom = new THREE.RingGeometry(radius, radius + 0.03, 64);
      const ringMesh = new THREE.Mesh(ringGeom, new THREE.MeshBasicMaterial({
        color: 0x6366f1,
        transparent: true,
        opacity: (idx + 1) * 0.1,
        side: THREE.DoubleSide
      }));
      ringMesh.rotation.x = Math.PI / 2;
      radarGroup.add(ringMesh);
    });

    // Radar Grid Lines (Axes)
    const axesGeom = new THREE.BufferGeometry();
    const vertices = new Float32Array([
      -8, 0, 0,  8, 0, 0,
      0, 0, -8,  0, 0, 8,
      -5.6, 0, -5.6,  5.6, 0, 5.6,
      -5.6, 0, 5.6,  5.6, 0, -5.6
    ]);
    axesGeom.setAttribute("position", new THREE.BufferAttribute(vertices, 3));
    const axesMaterial = new THREE.LineBasicMaterial({ color: 0x6366f1, transparent: true, opacity: 0.15 });
    const axesLines = new THREE.LineSegments(axesGeom, axesMaterial);
    radarGroup.add(axesLines);

    // --- Sweeping Radar Scanner Line ---
    const sweepGroup = new THREE.Group();
    radarGroup.add(sweepGroup);

    const sweepGeom = new THREE.PlaneGeometry(8, 2);
    // Create custom gradient texture for radar sweep
    const canvasTexture = document.createElement("canvas");
    canvasTexture.width = 256;
    canvasTexture.height = 64;
    const ctx = canvasTexture.getContext("2d");
    if (ctx) {
      const grad = ctx.createLinearGradient(0, 0, 256, 0);
      grad.addColorStop(0, "rgba(99, 102, 241, 0.45)");
      grad.addColorStop(0.5, "rgba(6, 182, 212, 0.15)");
      grad.addColorStop(1, "rgba(99, 102, 241, 0)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 256, 64);
    }
    const texture = new THREE.CanvasTexture(canvasTexture);
    const sweepMat = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    
    // Sweep mesh rotates flatly
    const sweepMesh = new THREE.Mesh(sweepGeom, sweepMat);
    sweepMesh.rotation.x = Math.PI / 2;
    // Offset so it pivots on one edge
    sweepMesh.position.x = 4;
    sweepGroup.add(sweepMesh);

    // --- Company Node Meshes ---
    const nodeMeshes: THREE.Mesh[] = [];
    const nodeGlows: THREE.Mesh[] = [];

    COMPANIES.forEach((comp) => {
      const nodeGroup = new THREE.Group();
      nodeGroup.position.set(comp.x, comp.y, comp.z);
      
      // Node core
      const sphereGeom = new THREE.SphereGeometry(0.18, 16, 16);
      const sphereMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(comp.color),
        transparent: true,
        opacity: 0.95
      });
      const sphere = new THREE.Mesh(sphereGeom, sphereMat);
      nodeGroup.add(sphere);
      nodeMeshes.push(sphere);

      // Vertical connecting line to grid base
      const lineGeom = new THREE.BufferGeometry();
      const lineVerts = new Float32Array([
        0, 0, 0,
        0, -comp.y, 0
      ]);
      lineGeom.setAttribute("position", new THREE.BufferAttribute(lineVerts, 3));
      const lineMat = new THREE.LineDashedMaterial({
        color: 0x6366f1,
        transparent: true,
        opacity: 0.35,
        dashSize: 0.2,
        gapSize: 0.1
      });
      const connectionLine = new THREE.Line(lineGeom, lineMat);
      connectionLine.computeLineDistances();
      nodeGroup.add(connectionLine);

      // Radar ping base ring (pulsing anchor on the grid floor)
      const baseRingGeom = new THREE.RingGeometry(0.01, 0.4, 32);
      const baseRingMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(comp.color),
        transparent: true,
        opacity: 0.4,
        side: THREE.DoubleSide
      });
      const baseRing = new THREE.Mesh(baseRingGeom, baseRingMat);
      baseRing.rotation.x = Math.PI / 2;
      baseRing.position.y = -comp.y;
      nodeGroup.add(baseRing);
      nodeGlows.push(baseRing);

      // Hover halo (hidden initially)
      const haloGeom = new THREE.SphereGeometry(0.35, 16, 16);
      const haloMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(comp.color),
        transparent: true,
        opacity: 0.25,
        blending: THREE.AdditiveBlending
      });
      const halo = new THREE.Mesh(haloGeom, haloMat);
      halo.name = "halo";
      halo.visible = false;
      nodeGroup.add(halo);

      radarGroup.add(nodeGroup);
    });

    // --- Signal Particles System ---
    const particleCount = 120;
    const particleGeom = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const speeds: number[] = [];

    for (let i = 0; i < particleCount; i++) {
      // Random coordinates inside a bounding box
      positions[i * 3] = (Math.random() - 0.5) * 16;
      positions[i * 3 + 1] = Math.random() * 5;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 16;
      speeds.push(0.01 + Math.random() * 0.02);
    }
    particleGeom.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0x06b6d4,
      size: 0.08,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending
    });
    const particles = new THREE.Points(particleGeom, particleMat);
    scene.add(particles);

    // --- Interactive Orbit Controls (Custom Mouse Rotation) ---
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };
    
    // Slow initial rotation
    radarGroup.rotation.y = 0.5;
    radarGroup.rotation.x = 0.2;

    const handleMouseDown = () => { isDragging = true; };
    const handleMouseMove = (e: MouseEvent) => {
      const deltaMove = {
        x: e.offsetX - previousMousePosition.x,
        y: e.offsetY - previousMousePosition.y
      };

      if (isDragging) {
        radarGroup.rotation.y += deltaMove.x * 0.005;
        // Limit X rotation to keep a clean radar view
        radarGroup.rotation.x = Math.max(0.1, Math.min(0.8, radarGroup.rotation.x + deltaMove.y * 0.005));
      }

      previousMousePosition = {
        x: e.offsetX,
        y: e.offsetY
      };

      // Raycasting for node hover selection
      const rect = renderer.domElement.getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      );

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, camera);
      
      const intersects = raycaster.intersectObjects(nodeMeshes);
      
      if (intersects.length > 0) {
        const hoveredMesh = intersects[0].object as THREE.Mesh;
        const index = nodeMeshes.indexOf(hoveredMesh);
        if (index !== -1) {
          const node = COMPANIES[index];
          setHoveredNode(node);
          
          // Show hover halo
          const parent = hoveredMesh.parent;
          if (parent) {
            const halo = parent.getObjectByName("halo");
            if (halo) halo.visible = true;
          }
          document.body.style.cursor = "pointer";
          return;
        }
      }

      // If nothing hovered, clean up
      setHoveredNode(null);
      nodeMeshes.forEach((mesh) => {
        const parent = mesh.parent;
        if (parent) {
          const halo = parent.getObjectByName("halo");
          if (halo) halo.visible = false;
        }
      });
      document.body.style.cursor = "default";
    };

    const handleMouseUp = () => { isDragging = false; };

    const canvasElem = canvasRef.current;
    canvasElem.addEventListener("mousedown", handleMouseDown);
    canvasElem.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    // --- Animation Loop ---
    const clock = new THREE.Clock();
    const tempV = new THREE.Vector3();
    let animId = 0;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      // Rotate radar sweep scanner
      sweepGroup.rotation.y += 1.2 * delta;

      // Animate particles floating up
      const posAttr = particles.geometry.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < particleCount; i++) {
        let py = posAttr.getY(i);
        py += speeds[i];
        if (py > 5) {
          py = 0;
          posAttr.setX(i, (Math.random() - 0.5) * 16);
          posAttr.setZ(i, (Math.random() - 0.5) * 16);
        }
        posAttr.setY(i, py);
      }
      posAttr.needsUpdate = true;

      // Pulse base anchor rings
      nodeGlows.forEach((ring, idx) => {
        const scale = 1 + Math.sin(elapsed * 4 + idx) * 0.4;
        ring.scale.set(scale, scale, 1);
        
        // Dynamic node core floating micro-animation
        const sphere = nodeMeshes[idx];
        sphere.position.y = Math.sin(elapsed * 2 + idx) * 0.08;
      });

      // Ambient rotative drift if not dragging
      if (!isDragging) {
        radarGroup.rotation.y += 0.05 * delta;
      }

      // Render Three.js scene
      renderer.render(scene, camera);

      // --- Project 3D Nodes to 2D HTML space ---
      const nextLabels = nodeMeshes.map((mesh, idx) => {
        mesh.getWorldPosition(tempV);
        tempV.project(camera);

        // Calculate HTML percentage positions
        const xPercent = (tempV.x * 0.5 + 0.5) * width;
        const yPercent = (-(tempV.y) * 0.5 + 0.5) * height;

        return {
          name: COMPANIES[idx].name,
          x: xPercent,
          y: yPercent,
          index: idx,
          color: COMPANIES[idx].color,
          score: COMPANIES[idx].score
        };
      });
      setLabels(nextLabels);
    };

    animate();

    // --- Window Resize ---
    const handleResize = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight || 450;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    // --- Cleanup ---
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mouseup", handleMouseUp);
      if (canvasElem) {
        canvasElem.removeEventListener("mousedown", handleMouseDown);
        canvasElem.removeEventListener("mousemove", handleMouseMove);
      }
      // Dispose Three.js objects
      renderer.dispose();
      axesGeom.dispose();
      axesMaterial.dispose();
      sweepGeom.dispose();
      sweepMat.dispose();
      texture.dispose();
      particleGeom.dispose();
      particleMat.dispose();
      radarGroup.clear();
      scene.clear();
    };
  }, []);

  return (
    <div 
      ref={containerRef} 
      className="relative w-full h-[450px] md:h-[500px] rounded-3xl overflow-hidden glass-panel border-border/20 shadow-2xl bg-slate-950/40 select-none cyber-grid"
    >
      {/* Three.js Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 block w-full h-full" />

      {/* Floating 3D projection labels */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {labels.map((lbl) => {
          // Hide labels that fall off screen boundary
          if (lbl.x < 10 || lbl.x > containerRef.current!.clientWidth - 10 || lbl.y < 10 || lbl.y > 440) {
            return null;
          }

          return (
            <div
              key={lbl.index}
              className="absolute -translate-x-1/2 -translate-y-1/2 flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-border/30 bg-slate-900/80 backdrop-blur-sm text-[10px] font-bold text-foreground pointer-events-auto cursor-pointer shadow-lg hover:border-foreground/20 transition-all hover:scale-105"
              style={{
                left: `${lbl.x}px`,
                top: `${lbl.y - 25}px`, // Float slightly above the actual node position
              }}
              onMouseEnter={() => setHoveredNode(COMPANIES[lbl.index])}
              onMouseLeave={() => setHoveredNode(null)}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: lbl.color }} />
              <span>{lbl.name}</span>
              <span className="bg-primary/20 text-primary px-1 rounded-md text-[8px] font-extrabold">{lbl.score}%</span>
            </div>
          );
        })}
      </div>

      {/* Glow Radar Scan Overlay effect */}
      <div className="absolute top-4 left-4 p-4 pointer-events-none">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-500 animate-ping" />
          <span className="text-[10px] uppercase font-bold tracking-widest text-cyan-400">Tactical Scan Active</span>
        </div>
        <p className="text-[9px] text-muted-foreground mt-0.5 uppercase tracking-wide">Scanning target footprint 24/7</p>
      </div>

      {/* Detailed Card Info Box (Pops up on Node Hover) */}
      <div className="absolute bottom-4 left-4 right-4 pointer-events-none md:max-w-sm">
        <div className={`glass-panel border-border/20 bg-slate-950/85 p-4 rounded-2xl shadow-xl transition-all duration-300 ${
          hoveredNode ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 translate-y-4 pointer-events-none"
        }`}>
          {hoveredNode && (
            <div>
              <div className="flex justify-between items-center">
                <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: hoveredNode.color }} />
                  {hoveredNode.name} Watcher
                </h4>
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${
                  hoveredNode.verdict === "HOT" ? "bg-red-500/10 text-red-400 border-red-500/20" :
                  hoveredNode.verdict === "WARM" ? "bg-orange-500/10 text-orange-400 border-orange-500/20" :
                  "bg-blue-500/10 text-blue-400 border-blue-500/20"
                }`}>
                  {hoveredNode.verdict}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1.5">
                Target Role: <strong className="text-foreground/80">{hoveredNode.role}</strong>
              </p>
              <div className="mt-3 flex justify-between items-center text-[10px] border-t border-border/40 pt-2 text-muted-foreground">
                <span>Hiring Signal Index:</span>
                <span className="font-extrabold text-foreground text-xs">{hoveredNode.score}/100</span>
              </div>
              <div className="mt-1 w-full bg-slate-800 rounded-full h-1 overflow-hidden">
                <div className="bg-primary h-full rounded-full transition-all duration-500" style={{ width: `${hoveredNode.score}%` }} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Manual Helper tips */}
      <div className="absolute top-4 right-4 text-[9px] text-muted-foreground/60 uppercase font-semibold">
        Drag to Orbit • Scroll to Zoom
      </div>
    </div>
  );
}
