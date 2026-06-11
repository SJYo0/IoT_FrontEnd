import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

export default function InteractiveWaveShader({
  showControls = false,
  disableCenterDimming = true,
}) {
  const containerRef = useRef(null);
  const materialRef = useRef(null);
  const [hasActive, setHasActive] = useState(false);
  const [hasUpcoming, setHasUpcoming] = useState(false);
  const [dimmingDisabled, setDimmingDisabled] = useState(disableCenterDimming);

  useEffect(() => {
    if (materialRef.current) {
      materialRef.current.uniforms.hasActiveReminders.value = hasActive;
    }
  }, [hasActive]);

  useEffect(() => {
    if (materialRef.current) {
      materialRef.current.uniforms.hasUpcomingReminders.value = hasUpcoming;
    }
  }, [hasUpcoming]);

  useEffect(() => {
    if (materialRef.current) {
      materialRef.current.uniforms.disableCenterDimming.value = dimmingDisabled;
    }
  }, [dimmingDisabled]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
      renderer.setPixelRatio(window.devicePixelRatio);
      container.appendChild(renderer.domElement);
    } catch (err) {
      console.error("WebGL not supported", err);
      container.innerHTML = '<p style="color:white;text-align:center;">Sorry, WebGL is not available.</p>';
      return;
    }

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const clock = new THREE.Clock();

    const vertexShader = `
      varying vec2 vTextureCoord;
      void main() {
        vTextureCoord = uv;
        gl_Position = vec4(position, 1.0);
      }
    `;

    const fragmentShader = `
      precision mediump float;
      uniform vec2 iResolution;
      uniform float iTime;
      uniform vec2 iMouse;
      uniform bool hasActiveReminders;
      uniform bool hasUpcomingReminders;
      uniform bool disableCenterDimming;
      varying vec2 vTextureCoord;

      void mainImage(out vec4 fragColor, in vec2 fragCoord) {
        vec2 uv = (2.0 * fragCoord - iResolution.xy) / min(iResolution.x, iResolution.y);

        vec2 center = iResolution.xy * 0.5;
        float dist = distance(fragCoord, center);
        float radius = min(iResolution.x, iResolution.y) * 0.5;
        float centerDim = disableCenterDimming ? 1.0 : smoothstep(radius * 0.3, radius * 0.5, dist);

        for(float i = 1.0; i < 10.0; i++){
          uv.x += 0.6 / i * cos(i * 2.5 * uv.y + iTime);
          uv.y += 0.6 / i * cos(i * 1.5 * uv.x + iTime);
        }

        if (hasActiveReminders) {
          fragColor = vec4(vec3(0.1, 0.3, 0.6) / abs(sin(iTime - uv.y - uv.x)), 1.0);
        } else if (hasUpcomingReminders) {
          fragColor = vec4(vec3(0.1, 0.5, 0.2) / abs(sin(iTime - uv.y - uv.x)), 1.0);
        } else {
          fragColor = vec4(vec3(0.1) / abs(sin(iTime - uv.y - uv.x)), 1.0);
        }

        if (!disableCenterDimming) {
          fragColor.rgb = mix(fragColor.rgb * 0.3, fragColor.rgb, centerDim);
        }
      }

      void main() {
        vec4 color;
        mainImage(color, vTextureCoord * iResolution);
        gl_FragColor = color;
      }
    `;

    const uniforms = {
      iTime: { value: 0 },
      iResolution: { value: new THREE.Vector2() },
      iMouse: { value: new THREE.Vector2() },
      hasActiveReminders: { value: hasActive },
      hasUpcomingReminders: { value: hasUpcoming },
      disableCenterDimming: { value: dimmingDisabled },
    };

    const material = new THREE.ShaderMaterial({ vertexShader, fragmentShader, uniforms });
    materialRef.current = material;

    const geometry = new THREE.PlaneGeometry(2, 2);
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    const onResize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      renderer.setSize(w, h);
      uniforms.iResolution.value.set(w, h);
    };

    const onMouseMove = (event) => {
      uniforms.iMouse.value.set(event.clientX, event.clientY);
    };

    window.addEventListener("resize", onResize);
    window.addEventListener("mousemove", onMouseMove);
    onResize();

    renderer.setAnimationLoop(() => {
      uniforms.iTime.value = clock.getElapsedTime();
      renderer.render(scene, camera);
    });

    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("mousemove", onMouseMove);
      renderer.setAnimationLoop(null);
      const canvas = renderer.domElement;
      if (canvas && canvas.parentNode) {
        canvas.parentNode.removeChild(canvas);
      }
      material.dispose();
      geometry.dispose();
      renderer.dispose();
    };
  }, []);

  const buttonStyle = {
    padding: "10px 15px",
    margin: "5px",
    fontSize: "14px",
    cursor: "pointer",
    borderRadius: "8px",
    border: "1px solid #555",
    backgroundColor: "#333",
    color: "white",
    boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
  };

  return (
    <>
      <div
        ref={containerRef}
        className="pointer-events-none absolute inset-0 h-full w-full bg-black"
        aria-label="Interactive wave animation"
      />
      {showControls && (
        <div
          style={{
            position: "absolute",
            bottom: "20px",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 10,
            backgroundColor: "rgba(0,0,0,0.5)",
            padding: "10px",
            borderRadius: "12px",
            display: "flex",
            gap: "10px",
          }}
        >
          <button
            type="button"
            style={{ ...buttonStyle, backgroundColor: hasActive ? "#007bff" : "#333" }}
            onClick={() => setHasActive(!hasActive)}
          >
            Active Reminders
          </button>
          <button
            type="button"
            style={{ ...buttonStyle, backgroundColor: hasUpcoming ? "#28a745" : "#333" }}
            onClick={() => setHasUpcoming(!hasUpcoming)}
          >
            Upcoming Reminders
          </button>
          <button
            type="button"
            style={{ ...buttonStyle, backgroundColor: dimmingDisabled ? "#dc3545" : "#333" }}
            onClick={() => setDimmingDisabled(!dimmingDisabled)}
          >
            Disable Dimming
          </button>
        </div>
      )}
    </>
  );
}
