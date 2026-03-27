import { useCallback } from "react";
import Particles from "@tsparticles/react";
import { loadSlim } from "tsparticles-slim";

function ParticlesBackground() {

  const particlesInit = useCallback(async (engine) => {
    await loadSlim(engine);
  }, []);

  return (
    <Particles
      id="tsparticles"
      init={particlesInit}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: -1
      }}
      options={{
        background: {
          color: "#0f172a"
        },
        particles: {
          number: { value: 80 },
          color: { value: "#3b82f6" },
          links: {
            enable: true,
            distance: 150,
            color: "#22c55e",
            opacity: 0.5
          },
          move: { enable: true, speed: 1 },
          size: { value: 3 },
          opacity: { value: 0.7 }
        }
      }}
    />
  );
}

export default ParticlesBackground;