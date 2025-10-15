"use client";

import { useEffect, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Html, Sphere, Line, Trail } from "@react-three/drei";
import * as THREE from "three";

export interface GraphNode {
  id: string;
  label: string;
  type: "topic" | "entity" | "source" | "concept";
  size?: number;
  color?: string;
}

export interface GraphEdge {
  source: string;
  target: string;
  strength?: number;
  label?: string;
}

interface KnowledgeGraph3DProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  onNodeClick?: (node: GraphNode) => void;
}

// Particle system for ambient effects
function Particles() {
  const count = 1000;
  const positions = useRef<Float32Array>();

  useEffect(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 50;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 50;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 50;
    }
    positions.current = pos;
  }, []);

  if (!positions.current) return null;

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions.current}
          itemSize={3}
          args={[positions.current, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.05}
        color="#4444ff"
        transparent
        opacity={0.3}
        sizeAttenuation
      />
    </points>
  );
}

// Animated node component
function Node({
  node,
  position,
  onClick,
}: {
  node: GraphNode;
  position: [number, number, number];
  onClick?: (node: GraphNode) => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (meshRef.current) {
      // Gentle floating animation
      meshRef.current.position.y =
        position[1] + Math.sin(state.clock.elapsedTime + position[0]) * 0.1;

      // Pulsing effect when hovered
      const targetScale = hovered ? 1.3 : 1;
      meshRef.current.scale.lerp(
        new THREE.Vector3(targetScale, targetScale, targetScale),
        0.1
      );
    }
  });

  const getColor = () => {
    if (node.color) return node.color;
    switch (node.type) {
      case "topic":
        return "#00ffff";
      case "entity":
        return "#ff00ff";
      case "source":
        return "#ffff00";
      case "concept":
        return "#00ff00";
      default:
        return "#ffffff";
    }
  };

  const size = node.size || 0.3;

  return (
    <group position={position}>
      {/* Outer glow sphere */}
      <Sphere args={[size * 1.5, 16, 16]}>
        <meshBasicMaterial
          color={getColor()}
          transparent
          opacity={0.1}
          side={THREE.BackSide}
        />
      </Sphere>

      {/* Main node sphere */}
      <mesh
        ref={meshRef}
        onClick={() => onClick?.(node)}
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}
      >
        <sphereGeometry args={[size, 32, 32]} />
        <meshPhongMaterial
          color={getColor()}
          emissive={getColor()}
          emissiveIntensity={hovered ? 0.8 : 0.3}
          shininess={100}
          transparent
          opacity={0.9}
        />
      </mesh>

      {/* Node label */}
      <Html
        distanceFactor={8}
        style={{
          pointerEvents: hovered ? "auto" : "none",
          opacity: hovered ? 1 : 0.7,
          transition: "opacity 0.2s",
        }}
      >
        <div
          className="px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap"
          style={{
            background: "rgba(0, 0, 0, 0.8)",
            backdropFilter: "blur(10px)",
            border: `1px solid ${getColor()}`,
            color: getColor(),
            boxShadow: `0 0 20px ${getColor()}40`,
          }}
        >
          {node.label}
        </div>
      </Html>

      {/* Connection lines particle trail */}
      {hovered && (
        <Trail
          width={0.5}
          length={8}
          color={getColor()}
          attenuation={(width) => width}
        >
          <mesh>
            <sphereGeometry args={[0.05, 8, 8]} />
            <meshBasicMaterial color={getColor()} />
          </mesh>
        </Trail>
      )}
    </group>
  );
}

// Connection line between nodes
function Edge({
  start,
  end,
  strength = 1,
  color = "#4444ff",
}: {
  start: [number, number, number];
  end: [number, number, number];
  strength?: number;
  color?: string;
}) {
  // Calculate line geometry manually
  const points = [new THREE.Vector3(...start), new THREE.Vector3(...end)];
  const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);

  return (
    <primitive object={new THREE.Line(lineGeometry, new THREE.LineBasicMaterial({
      color,
      transparent: true,
      opacity: 0.3,
    }))} />
  );
}

// Camera controller
function CameraController() {
  const { camera } = useThree();

  useFrame((state) => {
    // Smooth camera movement
    camera.position.x = Math.sin(state.clock.elapsedTime * 0.1) * 2;
    camera.position.y = Math.cos(state.clock.elapsedTime * 0.15) * 2;
    camera.lookAt(0, 0, 0);
  });

  return null;
}

// Main scene component
function Scene({
  nodes,
  edges,
  onNodeClick,
}: {
  nodes: GraphNode[];
  edges: GraphEdge[];
  onNodeClick?: (node: GraphNode) => void;
}) {
  // Position nodes in 3D space using force-directed layout
  const nodePositions = useRef(
    new Map<string, [number, number, number]>()
  );

  useEffect(() => {
    // Simple circular layout with depth variation
    nodes.forEach((node, i) => {
      const angle = (i / nodes.length) * Math.PI * 2;
      const radius = 5 + Math.random() * 3;
      const height = (Math.random() - 0.5) * 4;

      nodePositions.current.set(node.id, [
        Math.cos(angle) * radius,
        height,
        Math.sin(angle) * radius,
      ]);
    });
  }, [nodes]);

  return (
    <>
      {/* Ambient lighting */}
      <ambientLight intensity={0.3} />
      <pointLight position={[10, 10, 10]} intensity={0.8} color="#00ffff" />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#ff00ff" />
      <pointLight position={[0, 0, 0]} intensity={0.3} color="#ffffff" />

      {/* Background particles */}
      <Particles />

      {/* Render edges */}
      {edges.map((edge, i) => {
        const start = nodePositions.current.get(edge.source);
        const end = nodePositions.current.get(edge.target);
        if (!start || !end) return null;

        return (
          <Edge
            key={`edge-${i}`}
            start={start}
            end={end}
            strength={edge.strength || 1}
          />
        );
      })}

      {/* Render nodes */}
      {nodes.map((node) => {
        const position = nodePositions.current.get(node.id);
        if (!position) return null;

        return (
          <Node
            key={node.id}
            node={node}
            position={position}
            onClick={onNodeClick}
          />
        );
      })}

      {/* Camera controls */}
      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        rotateSpeed={0.5}
        zoomSpeed={0.5}
        minDistance={5}
        maxDistance={30}
      />
    </>
  );
}

export default function KnowledgeGraph3D({
  nodes,
  edges,
  onNodeClick,
}: KnowledgeGraph3DProps) {
  if (nodes.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center text-neutral-500">
        <p className="text-sm">No data to visualize</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-gradient-to-br from-black via-neutral-900 to-black rounded-xl overflow-hidden">
      <Canvas
        camera={{ position: [0, 5, 15], fov: 60 }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        }}
      >
        <color attach="background" args={["#000000"]} />
        <fog attach="fog" args={["#000000", 10, 50]} />
        <Scene nodes={nodes} edges={edges} onNodeClick={onNodeClick} />
      </Canvas>

      {/* Legend */}
      <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-lg border border-neutral-700 rounded-lg p-3 text-xs">
        <div className="font-semibold mb-2 text-neutral-300">Legend</div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-cyan-400" />
            <span className="text-neutral-400">Topic</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-fuchsia-400" />
            <span className="text-neutral-400">Entity</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-400" />
            <span className="text-neutral-400">Source</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-400" />
            <span className="text-neutral-400">Concept</span>
          </div>
        </div>
      </div>

      {/* Controls hint */}
      <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-lg border border-neutral-700 rounded-lg p-3 text-xs text-neutral-400">
        <div className="font-semibold mb-1">Controls</div>
        <div>Drag to rotate • Scroll to zoom • Click nodes for details</div>
      </div>
    </div>
  );
}
