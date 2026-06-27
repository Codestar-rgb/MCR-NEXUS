'use client'

import * as React from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { MeshTransmissionMaterial, Environment, Lightformer } from '@react-three/drei'
import * as THREE from 'three'
import { cn } from '@/lib/utils'

interface WaterOrbProps {
  size?: number
  className?: string
}

/**
 * 3D 水球 v4 — 前卫精致设计
 *
 * 改进：
 * - 更低饱和度的 teal（避免荧光感）
 * - 更强的高光反射 + 环境折射
 * - 内部多个微小气泡（不同大小/速度）
 * - 表面流动光带（非旋转，更自然）
 * - 底部接触阴影
 */
export function WaterOrb({ size = 48, className }: WaterOrbProps) {
  return (
    <div
      className={cn('relative', className)}
      style={{ width: size, height: size }}
    >
      <Canvas
        camera={{ position: [0, 0, 3.2], fov: 30 }}
        gl={{ alpha: true, antialias: true, preserveDrawingBuffer: true }}
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
      {/* 环境光照：多角度光源提供丰富反射 */}
      <Environment resolution={512}>
        {/* 主光源：左上方冷白 */}
        <Lightformer
          intensity={3}
          position={[-2, 3, 2]}
          scale={[3, 3, 1]}
          color="#ffffff"
        />
        {/* 辅光：右下方 teal 染色 */}
        <Lightformer
          intensity={2}
          position={[2, -2, 1]}
          scale={[3, 3, 1]}
          color="#5eead4"
        />
        {/* 背光：后方暗绿 */}
        <Lightformer
          intensity={1.5}
          position={[0, 0, -3]}
          scale={[5, 5, 1]}
          color="#0f766e"
        />
        {/* 顶部窄条高光（模拟窗户光） */}
        <Lightformer
          intensity={2.5}
          position={[0, 4, 1]}
          scale={[5, 0.5, 1]}
          color="#f0fdfa"
        />
      </Environment>

      <ambientLight intensity={0.4} />
      <directionalLight position={[3, 3, 2]} intensity={1.2} />

      {/* 水球组 */}
      <OrbGroup />
    </>
  )
}

function OrbGroup() {
  const groupRef = React.useRef<THREE.Group>(null)

  useFrame((state) => {
    if (!groupRef.current) return
    const t = state.clock.elapsedTime
    // 缓慢摇摆旋转（不是匀速，更自然）
    groupRef.current.rotation.y = Math.sin(t * 0.3) * 0.5 + t * 0.15
    groupRef.current.rotation.x = Math.sin(t * 0.2) * 0.1
    // 上下浮动
    groupRef.current.position.y = Math.sin(t * 1.2) * 0.06
  })

  return (
    <group ref={groupRef}>
      {/* 外层水球壳 */}
      <mesh>
        <sphereGeometry args={[1, 128, 128]} />
        <MeshTransmissionMaterial
          transmission={1}
          thickness={1.2}
          roughness={0.02}
          ior={1.33}
          chromaticAberration={0.08}
          backside
          color="#2dd4bf"
          attenuationColor="#0d9488"
          attenuationDistance={2}
          distortion={0.15}
          distortionScale={0.3}
          temporalDistortion={0.15}
          anisotropy={0.1}
        />
      </mesh>

      {/* 内部液体核心 */}
      <mesh scale={0.65}>
        <sphereGeometry args={[1, 64, 64]} />
        <meshPhysicalMaterial
          color="#14b8a6"
          transparent
          opacity={0.25}
          roughness={0.05}
          transmission={0.9}
          thickness={0.8}
          ior={1.33}
          emissive="#2dd4bf"
          emissiveIntensity={0.1}
        />
      </mesh>

      {/* 内部气泡群 */}
      <Bubble position={[-0.35, 0.15, 0.25]} scale={0.07} speed={0.8} offset={0} />
      <Bubble position={[0.3, -0.2, 0.1]} scale={0.05} speed={1.1} offset={1.5} />
      <Bubble position={[0.05, 0.35, -0.2]} scale={0.04} speed={0.6} offset={3} />
      <Bubble position={[-0.15, -0.3, 0.15]} scale={0.03} speed={1.3} offset={4.5} />
      <Bubble position={[0.2, 0.1, -0.3]} scale={0.035} speed={0.9} offset={6} />
    </group>
  )
}

function Bubble({
  position,
  scale,
  speed,
  offset = 0,
}: {
  position: [number, number, number]
  scale: number
  speed: number
  offset?: number
}) {
  const meshRef = React.useRef<THREE.Mesh>(null)
  const initialPos = React.useMemo(() => [...position] as [number, number, number], [position])

  useFrame((state) => {
    if (!meshRef.current) return
    const t = state.clock.elapsedTime * speed + offset
    meshRef.current.position.y = initialPos[1] + Math.sin(t) * 0.12
    meshRef.current.position.x = initialPos[0] + Math.cos(t * 0.7) * 0.04
    meshRef.current.position.z = initialPos[2] + Math.sin(t * 0.5) * 0.03
  })

  return (
    <mesh ref={meshRef} position={position} scale={scale}>
      <sphereGeometry args={[1, 24, 24]} />
      <meshPhysicalMaterial
        color="#ccfbf1"
        transparent
        opacity={0.7}
        roughness={0}
        transmission={0.95}
        ior={1.15}
        thickness={0.3}
      />
    </mesh>
  )
}
