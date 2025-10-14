"use client";

import { useRef, useMemo, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html, Sphere } from '@react-three/drei';
import * as THREE from 'three';
import Link from 'next/link';

export interface ExplorerDocument {
  id: string;
  title: string;
  preview: string;
  position?: [number, number, number];
  cluster?: number;
  url?: string;
  category?: string;
}

interface DocumentSphereProps {
  doc: ExplorerDocument;
  onClick: (doc: ExplorerDocument) => void;
  isSelected: boolean;
  clusterColors: string[];
}

function DocumentSphere({ doc, onClick, isSelected, clusterColors }: DocumentSphereProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  const color = clusterColors[(doc.cluster || 0) % clusterColors.length];

  useFrame((state) => {
    if (meshRef.current && doc.position) {
      meshRef.current.position.y = doc.position[1] + Math.sin(state.clock.elapsedTime * 0.5 + doc.id.charCodeAt(0)) * 0.1;
      const targetScale = isSelected ? 1.4 : hovered ? 1.2 : 1;
      meshRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
    }
  });

  return (
    <group position={doc.position}>
      <Sphere
        ref={meshRef}
        args={[0.5, 32, 32]}
        onClick={() => onClick(doc)}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <meshStandardMaterial
          color={color}
          metalness={0.3}
          roughness={0.4}
          emissive={color}
          emissiveIntensity={isSelected ? 0.6 : hovered ? 0.3 : 0.1}
        />
      </Sphere>

      {(hovered || isSelected) && (
        <Html distanceFactor={8} position={[0, 0.8, 0]} center>
          <div className="bg-white/90 dark:bg-neutral-900/90 backdrop-blur px-3 py-1.5 rounded-lg shadow-lg border border-neutral-200 dark:border-neutral-800 whitespace-nowrap pointer-events-none">
            <div className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
              {doc.title}
            </div>
            {isSelected && (
              <div className="text-[10px] text-neutral-600 dark:text-neutral-400 mt-0.5 max-w-[200px] truncate">
                {doc.preview}
              </div>
            )}
          </div>
        </Html>
      )}

      <Html distanceFactor={10} position={[0, 0, 0.5]} center>
        <div className="text-white text-xs font-mono opacity-80 pointer-events-none">
          MD
        </div>
      </Html>
    </group>
  );
}

function ClusterConnections({ documents }: { documents: ExplorerDocument[] }) {
  const lines = useMemo(() => {
    const connections: Array<{ start: [number, number, number]; end: [number, number, number] }> = [];
    const clusters = documents.reduce((acc, doc) => {
      const cluster = doc.cluster || 0;
      if (!acc[cluster]) acc[cluster] = [];
      acc[cluster].push(doc);
      return acc;
    }, {} as Record<number, ExplorerDocument[]>);

    Object.values(clusters).forEach((clusterDocs) => {
      for (let i = 0; i < clusterDocs.length; i++) {
        for (let j = i + 1; j < clusterDocs.length; j++) {
          if (clusterDocs[i].position && clusterDocs[j].position) {
            connections.push({
              start: clusterDocs[i].position!,
              end: clusterDocs[j].position!,
            });
          }
        }
      }
    });

    return connections;
  }, [documents]);

  return (
    <>
      {lines.map((line, i) => {
        const points = [new THREE.Vector3(...line.start), new THREE.Vector3(...line.end)];
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        return (
          <primitive key={i} object={new THREE.Line(geometry, new THREE.LineBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.08 }))} />
        );
      })}
    </>
  );
}

interface DocumentExplorerProps {
  documents: ExplorerDocument[];
  height?: string;
  showConnections?: boolean;
  onDocumentClick?: (doc: ExplorerDocument) => void;
}

export default function DocumentExplorer({
  documents: inputDocs,
  height = '600px',
  showConnections = true,
  onDocumentClick,
}: DocumentExplorerProps) {
  const [selectedDoc, setSelectedDoc] = useState<ExplorerDocument | null>(null);

  const clusterColors = [
    '#8b5cf6', // purple
    '#3b82f6', // blue
    '#10b981', // green
    '#f59e0b', // amber
    '#ef4444', // red
    '#ec4899', // pink
    '#14b8a6', // teal
    '#a855f7', // violet
  ];

  // Auto-cluster and position documents if not already done
  const documents = useMemo(() => {
    return inputDocs.map((doc, i) => {
      if (doc.position && doc.cluster !== undefined) return doc;

      // Auto-assign cluster based on category or spread evenly
      const cluster = doc.cluster !== undefined
        ? doc.cluster
        : doc.category
          ? doc.category.charCodeAt(0) % 5
          : i % 5;

      // Generate position in 3D space clustered by similarity
      const clusterCenter: [number, number, number] = [
        (cluster % 3 - 1) * 6,
        (Math.floor(cluster / 3) - 1) * 5,
        ((cluster * 2) % 3 - 1) * 4,
      ];

      const offset: [number, number, number] = [
        (Math.sin(i * 2.5) * 2),
        (Math.cos(i * 1.8) * 2),
        (Math.sin(i * 3.2) * 2),
      ];

      return {
        ...doc,
        cluster,
        position: [
          clusterCenter[0] + offset[0],
          clusterCenter[1] + offset[1],
          clusterCenter[2] + offset[2],
        ] as [number, number, number],
      };
    });
  }, [inputDocs]);

  const handleDocClick = (doc: ExplorerDocument) => {
    setSelectedDoc(doc);
    onDocumentClick?.(doc);
  };

  return (
    <div className="w-full rounded-2xl overflow-hidden bg-gradient-to-br from-neutral-50 via-neutral-100 to-neutral-50 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950 relative" style={{ height }}>
      <Canvas
        shadows
        camera={{ position: [0, 0, 15], fov: 60 }}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.4} />
        <directionalLight position={[10, 10, 5]} intensity={0.6} />
        <pointLight position={[-10, -10, -5]} intensity={0.3} color="#8b5cf6" />
        <pointLight position={[10, -10, 5]} intensity={0.3} color="#3b82f6" />

        <fog attach="fog" args={['#000000', 10, 50]} />

        {showConnections && <ClusterConnections documents={documents} />}

        {documents.map((doc) => (
          <DocumentSphere
            key={doc.id}
            doc={doc}
            onClick={handleDocClick}
            isSelected={selectedDoc?.id === doc.id}
            clusterColors={clusterColors}
          />
        ))}

        <OrbitControls
          enableZoom={true}
          enablePan={true}
          maxDistance={30}
          minDistance={3}
          autoRotate={!selectedDoc}
          autoRotateSpeed={0.3}
          zoomSpeed={0.8}
        />
      </Canvas>

      {selectedDoc && (
        <div className="absolute bottom-4 left-4 right-4 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl rounded-xl shadow-2xl border border-neutral-200 dark:border-neutral-800 p-4 max-w-md">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <h3 className="font-semibold text-sm mb-1 text-neutral-900 dark:text-neutral-100">
                {selectedDoc.title}
              </h3>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 line-clamp-2 mb-2">
                {selectedDoc.preview}
              </p>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                  Cluster {(selectedDoc.cluster || 0) + 1}
                </span>
                {selectedDoc.category && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                    {selectedDoc.category}
                  </span>
                )}
                {selectedDoc.url && (
                  <Link
                    href={selectedDoc.url as any}
                    className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                  >
                    Open →
                  </Link>
                )}
              </div>
            </div>
            <button
              onClick={() => setSelectedDoc(null)}
              className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      <div className="absolute top-4 left-4 bg-white/80 dark:bg-neutral-900/80 backdrop-blur px-3 py-2 rounded-lg text-xs text-neutral-600 dark:text-neutral-400">
        <div className="font-semibold mb-1">Knowledge Space</div>
        <div>Drag to rotate • Scroll to zoom • Click to explore</div>
      </div>
    </div>
  );
}
