import React, { useState, useEffect, useRef, useCallback } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import gsap from "gsap";
import { useAppState } from "../core/stateManager.js";

// 1. Torus Shockwave component
function Shockwave({ position, onComplete }) {
  const meshRef = useRef();
  const matRef = useRef();

  useEffect(() => {
    gsap.fromTo(
      meshRef.current.scale,
      { x: 0.1, y: 0.1, z: 0.1 },
      { x: 6, y: 6, z: 6, duration: 0.8, ease: "power2.out" }
    );
    gsap.fromTo(
      matRef.current,
      { opacity: 0.9 },
      { opacity: 0, duration: 0.8, ease: "power2.out", onComplete }
    );
  }, [onComplete]);

  return (
    <mesh ref={meshRef} position={position} rotation={[-Math.PI / 2, 0, 0]}>
      <torusGeometry args={[1, 0.04, 8, 64]} />
      <meshBasicMaterial ref={matRef} color="#10b981" transparent />
    </mesh>
  );
}

// 2. Main 3D Scene containing Pitch, Lights, Particles, and Camera Controller
function Scene({ 
  onSceneReady, 
  bloomRef, 
  attractionRatioProxy, 
  scanLineProxy,
  revealPitch,
  pitchRef,
  lightRefs
}) {
  const { camera, size, scene } = useThree();
  const linesRef = useRef([]);
  const composerRef = useRef();

  // Particle System
  const particlesGeoRef = useRef();
  const particlesCount = 2000;
  const initialPositions = useRef(new Float32Array(particlesCount * 3));
  const yOffsets = useRef(new Float32Array(particlesCount));

  // Initialize particles flat on pitch
  useEffect(() => {
    const pos = initialPositions.current;
    for (let i = 0; i < particlesCount; i++) {
      const idx = i * 3;
      pos[idx] = (Math.random() - 0.5) * 20; // x: ±10
      pos[idx + 1] = Math.random() * 0.5;    // y: 0 to 0.5
      pos[idx + 2] = (Math.random() - 0.5) * 14; // z: ±7
      yOffsets.current[i] = 0;
    }
  }, []);

  // Correct setup for ThreeJS standard postprocessing in R3F
  const { gl } = useThree();

  useEffect(() => {
    const composer = new EffectComposer(gl);
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);

    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(size.width, size.height),
      2.5, // strength
      0.8, // radius
      0.2  // threshold
    );
    composer.addPass(bloomPass);
    composerRef.current = composer;
    bloomRef.current = bloomPass;

    return () => {
      composer.dispose();
    };
  }, [gl, scene, camera, size, bloomRef]);

  // Check when refs are mounted and fire onSceneReady callback
  useEffect(() => {
    let active = true;
    const checkRefs = () => {
      if (!active) return;
      const allLightsReady = lightRefs.current.filter(Boolean).length === 4;

      if (allLightsReady && pitchRef.current && bloomRef.current) {
        onSceneReady(camera);
      } else {
        requestAnimationFrame(checkRefs);
      }
    };
    checkRefs();
    return () => {
      active = false;
    };
  }, [onSceneReady, bloomRef, pitchRef, lightRefs, camera]);

  // Update loop
  useFrame((state, delta) => {
    // A. Animate Particles
    if (particlesGeoRef.current) {
      const positions = particlesGeoRef.current.attributes.position.array;
      const pos = initialPositions.current;
      const ratio = attractionRatioProxy.current.value;

      for (let i = 0; i < particlesCount; i++) {
        const idx = i * 3;
        
        yOffsets.current[i] += 0.02 * (delta * 60);
        const baseY = (pos[idx + 1] + yOffsets.current[i]) % 12;

        const baseX = pos[idx];
        const baseZ = pos[idx + 2];

        // Lerp towards center target [0, 4, 0]
        positions[idx] = THREE.MathUtils.lerp(baseX, 0, ratio);
        positions[idx + 1] = THREE.MathUtils.lerp(baseY, 4, ratio);
        positions[idx + 2] = THREE.MathUtils.lerp(baseZ, 0, ratio);
      }
      particlesGeoRef.current.attributes.position.needsUpdate = true;
    }

    // B. Scan-line reveal check for line markings
    const currentScanZ = scanLineProxy.current.z;
    linesRef.current.forEach((obj) => {
      if (obj && !obj.visible && currentScanZ >= obj.position.z) {
        obj.visible = true;
      }
    });

    // C. Render manually through the postprocessing composer
    if (composerRef.current) {
      composerRef.current.render();
    }
  }, 1);


  return (
    <>
      <ambientLight intensity={0.18} />

      {/* 4 Spotlights */}
      <spotLight
        ref={(el) => (lightRefs.current[0] = el)}
        position={[-12, 16, -8]}
        intensity={0}
        angle={0.35}
        penumbra={0.4}
        color="#fffbe6"
      />
      <spotLight
        ref={(el) => (lightRefs.current[1] = el)}
        position={[12, 16, -8]}
        intensity={0}
        angle={0.35}
        penumbra={0.4}
        color="#fffbe6"
      />
      <spotLight
        ref={(el) => (lightRefs.current[2] = el)}
        position={[-12, 16, 8]}
        intensity={0}
        angle={0.35}
        penumbra={0.4}
        color="#fffbe6"
      />
      <spotLight
        ref={(el) => (lightRefs.current[3] = el)}
        position={[12, 16, 8]}
        intensity={0}
        angle={0.35}
        penumbra={0.4}
        color="#fffbe6"
      />

      {/* Pitch Green Field Plane */}
      <mesh ref={pitchRef} visible={false} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[20, 14]} />
        <meshStandardMaterial color="#1a4731" roughness={0.8} metalness={0.1} />
      </mesh>

      {/* Center Line (z = 0) */}
      <mesh
        ref={(el) => (linesRef.current[0] = el)}
        visible={false}
        position={[0, 0.01, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[20, 0.06]} />
        <meshBasicMaterial color="white" />
      </mesh>

      {/* Center Circle (z = 0) */}
      <mesh
        ref={(el) => (linesRef.current[1] = el)}
        visible={false}
        position={[0, 0.01, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <torusGeometry args={[2, 0.03, 8, 64]} />
        <meshBasicMaterial color="white" />
      </mesh>

      {/* Penalty Box Left (centered around z = -5.5) */}
      <group
        ref={(el) => (linesRef.current[2] = el)}
        visible={false}
        position={[0, 0.01, -5.5]}
      >
        {/* Top limit */}
        <mesh position={[0, 0, -1.5]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[8, 0.06]} />
          <meshBasicMaterial color="white" />
        </mesh>
        {/* Left limit */}
        <mesh position={[-4, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.06, 3]} />
          <meshBasicMaterial color="white" />
        </mesh>
        {/* Right limit */}
        <mesh position={[4, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.06, 3]} />
          <meshBasicMaterial color="white" />
        </mesh>
      </group>

      {/* Penalty Box Right (centered around z = 5.5) */}
      <group
        ref={(el) => (linesRef.current[3] = el)}
        visible={false}
        position={[0, 0.01, 5.5]}
      >
        {/* Bottom limit */}
        <mesh position={[0, 0, 1.5]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[8, 0.06]} />
          <meshBasicMaterial color="white" />
        </mesh>
        {/* Left limit */}
        <mesh position={[-4, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.06, 3]} />
          <meshBasicMaterial color="white" />
        </mesh>
        {/* Right limit */}
        <mesh position={[4, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.06, 3]} />
          <meshBasicMaterial color="white" />
        </mesh>
      </group>

      {/* Corner Arcs (4 elements resolved around z = ±7) */}
      <mesh
        ref={(el) => (linesRef.current[4] = el)}
        visible={false}
        position={[-10, 0.01, -7]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <torusGeometry args={[0.5, 0.03, 8, 32, Math.PI / 2]} />
        <meshBasicMaterial color="white" />
      </mesh>
      <mesh
        ref={(el) => (linesRef.current[5] = el)}
        visible={false}
        position={[10, 0.01, -7]}
        rotation={[-Math.PI / 2, 0, Math.PI / 2]}
      >
        <torusGeometry args={[0.5, 0.03, 8, 32, Math.PI / 2]} />
        <meshBasicMaterial color="white" />
      </mesh>
      <mesh
        ref={(el) => (linesRef.current[6] = el)}
        visible={false}
        position={[-10, 0.01, 7]}
        rotation={[-Math.PI / 2, 0, -Math.PI / 2]}
      >
        <torusGeometry args={[0.5, 0.03, 8, 32, Math.PI / 2]} />
        <meshBasicMaterial color="white" />
      </mesh>
      <mesh
        ref={(el) => (linesRef.current[7] = el)}
        visible={false}
        position={[10, 0.01, 7]}
        rotation={[-Math.PI / 2, 0, Math.PI]}
      >
        <torusGeometry args={[0.5, 0.03, 8, 32, Math.PI / 2]} />
        <meshBasicMaterial color="white" />
      </mesh>

      {/* Scanline reveal visual mesh */}
      {revealPitch.current && revealPitch.current.visible && (
        <mesh
          position={[0, 0.03, scanLineProxy.current.z]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <planeGeometry args={[20, 0.15]} />
          <meshBasicMaterial color="#10b981" />
        </mesh>
      )}

      {/* Particle System Points */}
      <points>
        <bufferGeometry ref={particlesGeoRef}>
          <bufferAttribute
            attach="attributes-position"
            array={initialPositions.current}
            count={particlesCount}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.08}
          color="#fbbf24"
          transparent
          opacity={0.7}
          sizeAttenuation
        />
      </points>
    </>
  );
}

// 3. Parent CinematicIntro component
export default function CinematicIntro({ currentLanguage, translations, onComplete }) {
  const { modelStatus } = useAppState();

  const [progress, setProgress] = useState({
    llm: 0,
    tts: 0,
    whisper: 0
  });

  const [shockwaves, setShockwaves] = useState([]);
  const [sceneReady, setSceneReady] = useState(false);
  
  // Animation refs
  const sceneReadyRef = useRef(false);
  const cameraRef = useRef();
  const pitchRef = useRef();
  const lightRefs = useRef([]);
  const bloomRef = useRef();
  const attractionRatioProxy = useRef({ value: 0 });
  const scanLineProxy = useRef({ z: -7 });
  const revealPitch = useRef({ visible: false });

  // Two-flag tracking
  const sequenceDoneRef = useRef(false);
  const modelsDoneRef = useRef(false);

  const checkComplete = useCallback(() => {
    if (sequenceDoneRef.current && modelsDoneRef.current) {
      onComplete();
    }
  }, [onComplete]);

  // Invoked when 3D scene animation finishes at ~6.5s
  const handleSequenceReady = useCallback(() => {
    sequenceDoneRef.current = true;
    checkComplete();
  }, [checkComplete]);

  const handleSceneReady = useCallback((camera) => {
    cameraRef.current = camera;
    sceneReadyRef.current = true;
    setSceneReady(true);
  }, []);

  const t = translations[currentLanguage] || translations.en;

  const spawnShockwave = useCallback((pos) => {
    const id = Date.now() + Math.random();
    setShockwaves((prev) => [...prev, { id, position: pos }]);
  }, []);

  const removeShockwave = useCallback((id) => {
    setShockwaves((prev) => prev.filter((sw) => sw.id !== id));
  }, []);

  // Monitor loading status from QVAC electron APIs
  useEffect(() => {
    if (modelStatus === "ready") {
      setProgress({
        llm: 100,
        tts: 100,
        whisper: 100
      });
      modelsDoneRef.current = true;
      checkComplete();
      return;
    }

    const api = window.qvac || window.electronAPI;
    if (!api) {
      setProgress({
        llm: 100,
        tts: 100,
        whisper: 100
      });
      modelsDoneRef.current = true;
      checkComplete();
      return;
    }

    const cleanupProgress = api.onLoadProgress((data) => {
      if (data && data.model) {
        setProgress((prev) => {
          const next = {
            ...prev,
            [data.model]: data.percent
          };
          if (data.model === "llm" && data.percent === 100) {
            modelsDoneRef.current = true;
            checkComplete();
          }
          return next;
        });
      }
    });

    const cleanupAllReady = api.onAllReady(() => {
      setProgress({
        llm: 100,
        tts: 100,
        whisper: 100
      });
      modelsDoneRef.current = true;
      checkComplete();
    });

    return () => {
      if (cleanupProgress) cleanupProgress();
      if (cleanupAllReady) cleanupAllReady();
    };
  }, [modelStatus, checkComplete]);

  // Setup GSAP animations timeline for 3D elements
  useEffect(() => {
    if (!sceneReady) return;

    const camera = cameraRef.current;
    if (!camera) return;

    const lightPositions = [
      [-12, 16, -8],
      [12, 16, -8],
      [-12, 16, 8],
      [12, 16, 8]
    ];

    const tl = gsap.timeline({
      onComplete: handleSequenceReady
    });

    // Camera initial down-looking position
    camera.position.set(0, 8, 0);
    camera.lookAt(0, 0, 0);

    // Timeline at 1s: Floodlights fire staggered 400ms
    lightRefs.current.forEach((light, index) => {
      if (light) {
        tl.to(
          light,
          {
            intensity: 120,
            duration: 0.6,
            ease: "power3.out",
            onStart: () => {
              const pos = lightPositions[index];
              spawnShockwave([pos[0], 0.02, pos[2]]);
            }
          },
          1.0 + index * 0.4
        );
      }
    });

    // Bloom flash on spotlight 1
    if (bloomRef.current) {
      tl.to(bloomRef.current, { strength: 4.5, duration: 0.3, ease: "power2.out" }, 1.0);
      tl.to(bloomRef.current, { strength: 1.2, duration: 1.0, ease: "power2.inOut" }, 1.3);
    }

    // Timeline at 2.5s: Reveal Pitch & Scan-line reveal
    if (revealPitch.current) {
      tl.to(
        revealPitch.current,
        {
          visible: true,
          duration: 0,
          onStart: () => {
            if (pitchRef.current) {
              pitchRef.current.visible = true;
            }
          }
        },
        2.5
      );
    }

    // Move scanline plane across pitch
    if (scanLineProxy.current) {
      tl.fromTo(
        scanLineProxy.current,
        { z: -7 },
        {
          z: 7,
          duration: 1.2,
          ease: "none"
        },
        2.5
      );
    }

    // Timeline at 4s: Gold particles compress to center
    if (attractionRatioProxy.current) {
      tl.to(
        attractionRatioProxy.current,
        {
          value: 1.0,
          duration: 1.0,
          ease: "power2.inOut"
        },
        4.0
      );
    }

    // Timeline at 5s: Gold particles disperse back out
    if (attractionRatioProxy.current) {
      tl.to(
        attractionRatioProxy.current,
        {
          value: 0,
          duration: 1.0,
          ease: "power2.inOut"
        },
        5.0
      );
    }

    // Timeline at 5.5s: Camera pull-back proxy animation
    const cameraProxy = { x: 0, y: 8, z: 0 };
    tl.to(
      cameraProxy,
      {
        x: 0,
        y: 14,
        z: 6,
        duration: 1.0,
        ease: "power2.inOut",
        onUpdate: () => {
          camera.position.set(cameraProxy.x, cameraProxy.y, cameraProxy.z);
          camera.lookAt(0, 0, 0);
        }
      },
      5.5
    );

    // Fade bloom to resting intensity 0.4
    if (bloomRef.current) {
      tl.to(
        bloomRef.current,
        {
          strength: 0.4,
          duration: 1.0,
          ease: "power2.inOut"
        },
        5.5
      );
    }

    return () => {
      tl.kill();
    };
  }, [sceneReady, handleSequenceReady, spawnShockwave]);

  // GSAP HTML Layer timeline
  useEffect(() => {
    if (!sceneReady) return;

    const tl = gsap.timeline();

    // 4.0s: Title fade-in staggered letters
    tl.to(
      ".intro-title-letter",
      {
        opacity: 1,
        y: 0,
        duration: 0.4,
        stagger: 0.06,
        ease: "power4.out"
      },
      4.0
    );

    // 4.0s: Flash from white to neon green
    tl.fromTo(
      ".intro-title-letter",
      { color: "#ffffff" },
      { color: "#00ff87", duration: 0.3, stagger: 0.06 },
      4.0
    );

    // 5.0s: TTS spoken welcome
    tl.call(() => {
      const api = window.qvac || window.electronAPI;
      if (api && api.speakTTS) {
        api.speakTTS({
          text: t.welcomeSpoken,
          language: currentLanguage
        });
      }
    }, [], 5.0);

    // 5.2s: Tagline fades in
    tl.fromTo(
      ".intro-tagline",
      { opacity: 0 },
      { opacity: 1, duration: 0.6, ease: "power1.out" },
      5.2
    );

    return () => {
      tl.kill();
    };
  }, [sceneReady, t.welcomeSpoken, currentLanguage]);



  const letters = "JOGO BONITO".split("");

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "#0b1a13",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Outfit', sans-serif"
      }}
    >
      {/* 3D Canvas Background Layer */}
      <div style={{ position: "absolute", inset: 0, zIndex: 1 }}>
        <Canvas gl={{ antialias: true }}>
          <Scene
            onSceneReady={handleSceneReady}
            bloomRef={bloomRef}
            attractionRatioProxy={attractionRatioProxy}
            scanLineProxy={scanLineProxy}
            revealPitch={revealPitch}
            pitchRef={pitchRef}
            lightRefs={lightRefs}
          />
          {shockwaves.map((sw) => (
            <Shockwave
              key={sw.id}
              position={sw.position}
              onComplete={() => removeShockwave(sw.id)}
            />
          ))}
        </Canvas>
      </div>

      {/* HTML Content Overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 2,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          pointerEvents: "none",
          padding: "2rem"
        }}
      >
        {/* Title container */}
        <div style={{ textAlign: "center", marginBottom: "0.5rem" }}>
          {letters.map((char, index) => {
            if (char === " ") {
              return <span key={index} style={{ display: "inline-block", width: "2rem" }} />;
            }
            return (
              <span
                key={index}
                className="intro-title-letter"
                style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontWeight: 900,
                  fontSize: "clamp(3rem, 8vw, 6.5rem)",
                  color: "#00ff87",
                  display: "inline-block",
                  opacity: 0,
                  transform: "translateY(40px)"
                }}
              >
                {char}
              </span>
            );
          })}
        </div>

        {/* Tagline */}
        <p
          className="intro-tagline"
          style={{
            fontFamily: "'Outfit', sans-serif",
            fontWeight: 400,
            fontSize: "clamp(0.9rem, 2vw, 1.3rem)",
            color: "#fbbf24",
            margin: 0,
            opacity: 0,
            textAlign: "center"
          }}
        >
          {t.appTagline}
        </p>

        {/* Glassmorphism Model Progress Hud */}
        <div
          style={{
            position: "absolute",
            bottom: "2rem",
            background: "rgba(0, 0, 0, 0.45)",
            backdropFilter: "blur(10px)",
            borderRadius: "12px",
            padding: "16px 24px",
            border: "1px solid rgba(16, 185, 129, 0.3)",
            display: "flex",
            flexDirection: "column",
            gap: "0.75rem",
            width: "320px"
          }}
        >
          {/* LLM Progress */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", color: "white" }}>
              <span>Language Model {progress.llm === 100 && <span style={{ color: "#10b981", fontWeight: "bold" }}>✓</span>}</span>
              <span className="font-mono">{progress.llm}%</span>
            </div>
            <div style={{ width: "100%", height: "4px", background: "rgba(255,255,255,0.1)", borderRadius: "2px", overflow: "hidden" }}>
              <div style={{ width: `${progress.llm}%`, height: "100%", background: "#10b981", transition: "width 0.1s" }}></div>
            </div>
          </div>

          {/* TTS Progress */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", color: "white" }}>
              <span>Voice Engine {progress.tts === 100 && <span style={{ color: "#10b981", fontWeight: "bold" }}>✓</span>}</span>
              <span className="font-mono">{progress.tts}%</span>
            </div>
            <div style={{ width: "100%", height: "4px", background: "rgba(255,255,255,0.1)", borderRadius: "2px", overflow: "hidden" }}>
              <div style={{ width: `${progress.tts}%`, height: "100%", background: "#10b981", transition: "width 0.1s" }}></div>
            </div>
          </div>

          {/* Whisper Progress */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", color: "white" }}>
              <span>Transcription {progress.whisper === 100 && <span style={{ color: "#10b981", fontWeight: "bold" }}>✓</span>}</span>
              <span className="font-mono">{progress.whisper}%</span>
            </div>
            <div style={{ width: "100%", height: "4px", background: "rgba(255,255,255,0.1)", borderRadius: "2px", overflow: "hidden" }}>
              <div style={{ width: `${progress.whisper}%`, height: "100%", background: "#10b981", transition: "width 0.1s" }}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
