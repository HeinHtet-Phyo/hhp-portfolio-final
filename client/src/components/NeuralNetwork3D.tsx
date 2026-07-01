// Dark Space Theme — 3D Neural Network using Three.js
import { useEffect, useRef } from "react";
import * as THREE from "three";

const SKILL_LABELS = ["Python", "ML", "SQL", "TensorFlow", "Data", "AI", "NLP", "Power BI"];

export default function NeuralNetwork3D() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const w = mount.clientWidth;
    const h = mount.clientHeight;

    // Scene
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, w / h, 0.1, 100);
    camera.position.z = 5;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    // Nodes
    const nodeCount = 20;
    const nodes: THREE.Vector3[] = [];
    const nodeMeshes: THREE.Mesh[] = [];

    for (let i = 0; i < nodeCount; i++) {
      const pos = new THREE.Vector3(
        (Math.random() - 0.5) * 6,
        (Math.random() - 0.5) * 6,
        (Math.random() - 0.5) * 3
      );
      nodes.push(pos);

      const geo = new THREE.SphereGeometry(0.06 + Math.random() * 0.06, 8, 8);
      const mat = new THREE.MeshBasicMaterial({
        color: Math.random() > 0.5 ? 0x00d4ff : 0x7c3aed,
        transparent: true,
        opacity: 0.8,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(pos);
      scene.add(mesh);
      nodeMeshes.push(mesh);
    }

    // Connections
    const lineMat = new THREE.LineBasicMaterial({
      color: 0x00d4ff,
      transparent: true,
      opacity: 0.15,
    });

    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        if (nodes[i].distanceTo(nodes[j]) < 2.5) {
          const geo = new THREE.BufferGeometry().setFromPoints([nodes[i], nodes[j]]);
          scene.add(new THREE.Line(geo, lineMat));
        }
      }
    }

    // Glow points
    const glowGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(nodeCount * 3);
    nodes.forEach((n, i) => {
      positions[i * 3] = n.x;
      positions[i * 3 + 1] = n.y;
      positions[i * 3 + 2] = n.z;
    });
    glowGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const glowMat = new THREE.PointsMaterial({
      color: 0x00d4ff,
      size: 0.15,
      transparent: true,
      opacity: 0.6,
    });
    scene.add(new THREE.Points(glowGeo, glowMat));

    // Animation
    let animId: number;
    let t = 0;
    const animate = () => {
      t += 0.005;
      scene.rotation.y = t * 0.3;
      scene.rotation.x = Math.sin(t * 0.2) * 0.2;

      // Pulse nodes
      nodeMeshes.forEach((mesh, i) => {
        const scale = 1 + Math.sin(t * 2 + i * 0.5) * 0.3;
        mesh.scale.setScalar(scale);
        (mesh.material as THREE.MeshBasicMaterial).opacity = 0.5 + Math.sin(t + i) * 0.3;
      });

      renderer.render(scene, camera);
      animId = requestAnimationFrame(animate);
    };
    animate();

    const handleResize = () => {
      const nw = mount.clientWidth;
      const nh = mount.clientHeight;
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div style={{ position: "relative", width: "100%", height: "360px" }}>
      <div ref={mountRef} style={{ width: "100%", height: "100%" }} />
      {/* Skill labels overlay */}
      <div style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "center",
        gap: "0.5rem",
        padding: "1rem",
        opacity: 0.6,
      }}>
        {SKILL_LABELS.map((s) => (
          <span key={s} style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "0.65rem",
            color: "rgba(0,212,255,0.7)",
            border: "1px solid rgba(0,212,255,0.2)",
            padding: "0.15rem 0.4rem",
            borderRadius: "3px",
            background: "rgba(0,0,0,0.5)",
          }}>{s}</span>
        ))}
      </div>
    </div>
  );
}
