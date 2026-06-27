'use client'

import * as React from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Environment, Lightformer, Float } from '@react-three/drei'
import * as THREE from 'three'
import { cn } from '@/lib/utils'

interface WaterOrbProps {
  size?: number
  className?: string
}

/**
 * 3D 水球 v5 — 前卫不规则表面 + 缩放感
 *
 * - 不规则球体（噪声变形顶点）
 * - 水晶/液态金属质感（高反射 + 折射）
 * - 缩放呼吸动画
 * - 缓慢摇摆旋转
 * - 深青色调（低饱和度，避免刺眼）
 */
export function WaterOrb({ size = 48, className }: WaterOrbProps) {
  return (
    <div
      className={cn('relative', className)}
      style={{ width: size, height: size }}
    >
      <Canvas
        camera={{ position: [0, 0, 3.5], fov: 28 }}
        gl={{ alpha: true, antialias: true }}
        style={{ background: 'transparent' }}
        dpr={[2, 3]}
      >
        <Scene />
      </Canvas>
    </div>
  )
}

function Scene() {
  return (
    <>
      <Environment resolution={512}>
        <Lightformer intensity={3} position={[-2, 3, 2]} scale={[3, 3, 1]} color="#ffffff" />
        <Lightformer intensity={2} position={[2, -2, 1]} scale={[3, 3, 1]} color="#99f6e4" />
        <Lightformer intensity={1.5} position={[0, 0, -3]} scale={[5, 5, 1]} color="#134e4a" />
        <Lightformer intensity={2.5} position={[0, 4, 1]} scale={[5, 0.3, 1]} color="#f0fdfa" />
      </Environment>

      <ambientLight intensity={0.3} />
      <directionalLight position={[3, 3, 2]} intensity={1} color="#ffffff" />
      <pointLight position={[-2, -1, 2]} intensity={0.6} color="#5eead4" />

      <Float speed={1.5} rotationIntensity={0.3} floatIntensity={0.6}>
        <IrregularOrb />
      </Float>
    </>
  )
}

function IrregularOrb() {
  const meshRef = React.useRef<THREE.Mesh>(null)
  const geometryRef = React.useRef<THREE.SphereGeometry>(null)
  const originalPositions = React.useRef<Float32Array | null>(null)
  const scaleRef = React.useRef(1)

  // 初始化噪声变形
  React.useEffect(() => {
    if (!geometryRef.current) return
    const geo = geometryRef.current
    const pos = geo.attributes.position
    originalPositions.current = Float32Array.from(pos.array)
  }, [])

  useFrame((state) => {
    if (!meshRef.current || !geometryRef.current || !originalPositions.current) return
    const t = state.clock.elapsedTime
    const geo = geometryRef.current
    const pos = geo.attributes.position
    const original = originalPositions.current

    // 顶点噪声变形（不规则表面）
    for (let i = 0; i < pos.count; i++) {
      const ox = original[i * 3]
      const oy = original[i * 3 + 1]
      const oz = original[i * 3 + 2]
      const noise = Math.sin(ox * 3 + t) * Math.cos(oy * 3 + t * 0.7) * Math.sin(oz * 3 + t * 0.5) * 0.06
      const len = Math.sqrt(ox * ox + oy * oy + oz * oz)
      const scale = 1 + noise
      pos.setXYZ(i, (ox / len) * len * scale, (oy / len) * len * scale, (oz / len) * len * scale)
    }
    pos.needsUpdate = true
    geo.computeVertexNormals()

    // 缩放呼吸
    const breath = 1 + Math.sin(t * 1.2) * 0.04
    meshRef.current.scale.setScalar(breath)
  })

  return (
    <mesh ref={meshRef}>
      <sphereGeometry ref={geometryRef} args={[1, 128, 128]} />
      <meshPhysicalMaterial
        color="#0d9488"
        metalness={0.3}
        roughness={0.08}
        transmission={0.85}
        thickness={1.5}
        ior={1.4}
        clearcoat={1}
        clearcoatRoughness={0.05}
        envMapIntensity={1.5}
        transparent
        opacity={0.92}
        emissive="#0f766e"
        emissiveIntensity={0.08}
        sheen={0.5}
        sheenColor="#5eead4"
        sheenRoughness={0.3}
      />
    </mesh>
  )
}
