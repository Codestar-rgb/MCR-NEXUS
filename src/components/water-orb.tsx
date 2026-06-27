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
 * 真正的 3D 水球（Three.js）
 *
 * - 真实球体几何体（SphereGeometry）
 * - 物理传输材质（MeshTransmissionMaterial）：透明、折射、色散
 * - 真实环境光照（Environment + Lightformer）
 * - 内部液体球（较小球体 + 波动材质）
 * - 持续 Y 轴旋转
 * - 上下浮动循环
 */
export function WaterOrb({ size = 48, className }: WaterOrbProps) {
  return (
    <div
      className={cn('relative', className)}
      style={{ width: size, height: size }}
    >
      <Canvas
        camera={{ position: [0, 0, 3], fov: 35 }}
        gl={{ alpha: true, antialias: true }}
        style={{ background: 'transparent' }}
        dpr={[1, 2]}
      >
        <Scene />
      </Canvas>
    </div>
  )
}

function Scene() {
  return (
    <>
      {/* 环境光照（提供反射/折射所需的环境） */}
      <Environment resolution={256}>
        <Lightformer
          intensity={2}
          position={[0, 2, 2]}
          scale={[4, 4, 1]}
          color="#5eead4"
        />
        <Lightformer
          intensity={1.5}
          position={[-2, -1, 1]}
          scale={[3, 3, 1]}
          color="#2dd4bf"
        />
        <Lightformer
          intensity={1}
          position={[2, 1, -1]}
          scale={[2, 2, 1]}
          color="#14b8a6"
        />
      </Environment>

      {/* 主光源 */}
      <ambientLight intensity={0.3} />
      <directionalLight position={[3, 3, 2]} intensity={1.5} color="#ffffff" />
      <pointLight position={[-2, -1, 2]} intensity={0.8} color="#5eead4" />

      {/* 水球组（旋转 + 浮动） */}
      <OrbGroup />
    </>
  )
}

function OrbGroup() {
  const groupRef = React.useRef<THREE.Group>(null)

  useFrame((state) => {
    if (!groupRef.current) return
    const t = state.clock.elapsedTime
    // Y 轴持续旋转
    groupRef.current.rotation.y = t * 0.4
    // 上下浮动
    groupRef.current.position.y = Math.sin(t * 1.5) * 0.08
  })

  return (
    <group ref={groupRef}>
      {/* 外层水球壳（透明玻璃/水材质） */}
      <mesh>
        <sphereGeometry args={[1, 64, 64]} />
        <MeshTransmissionMaterial
          transmission={1}
          thickness={0.8}
          roughness={0.05}
          ior={1.33}
          chromaticAberration={0.05}
          backside
          color="#2dd4bf"
          attenuationColor="#14b8a6"
          attenuationDistance={1.5}
          distortion={0.1}
          distortionScale={0.2}
          temporalDistortion={0.1}
        />
      </mesh>

      {/* 内部液体核心（较小球体，模拟水内部） */}
      <mesh scale={0.7}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshPhysicalMaterial
          color="#14b8a6"
          transparent
          opacity={0.3}
          roughness={0.1}
          transmission={0.8}
          thickness={0.5}
          ior={1.33}
          emissive="#2dd4bf"
          emissiveIntensity={0.15}
        />
      </mesh>

      {/* 内部气泡 1 */}
      <Bubble position={[-0.3, 0.2, 0.2]} scale={0.08} speed={1} />
      {/* 内部气泡 2 */}
      <Bubble position={[0.25, -0.15, 0.1]} scale={0.05} speed={1.3} offset={1} />
      {/* 内部气泡 3 */}
      <Bubble position={[0.1, 0.3, -0.15]} scale={0.04} speed={0.8} offset={2} />
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
    // 气泡上下浮动
    meshRef.current.position.y = initialPos[1] + Math.sin(t) * 0.15
    meshRef.current.position.x = initialPos[0] + Math.cos(t * 0.7) * 0.05
  })

  return (
    <mesh ref={meshRef} position={position} scale={scale}>
      <sphereGeometry args={[1, 16, 16]} />
      <meshPhysicalMaterial
        color="#a7f3d0"
        transparent
        opacity={0.6}
        roughness={0}
        transmission={0.9}
        ior={1.2}
      />
    </mesh>
  )
}
