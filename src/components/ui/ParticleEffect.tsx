"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface Particle {
  id: number;
  x: number;
  y: number;
  delay: number;
}

export function ParticleEffect({ trigger }: { trigger: number }) {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (trigger > 0) {
      const newParticles = Array.from({ length: 20 }, (_, i) => ({
        id: i,
        x: Math.random() * 100 - 50,
        y: Math.random() * 100 - 50,
        delay: Math.random() * 0.2,
      }));
      setParticles(newParticles);

      setTimeout(() => setParticles([]), 1500);
    }
  }, [trigger]);

  return (
    <>
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          initial={{
            x: 0,
            y: 0,
            opacity: 1,
            scale: 1,
          }}
          animate={{
            x: particle.x,
            y: particle.y,
            opacity: 0,
            scale: 0,
          }}
          transition={{
            duration: 1.2,
            delay: particle.delay,
            ease: "easeOut",
          }}
          className="fixed pointer-events-none"
          style={{
            left: "50%",
            top: "50%",
            width: "10px",
            height: "10px",
            marginLeft: "-5px",
            marginTop: "-5px",
            zIndex: 9999,
          }}
        >
          <div className="w-full h-full rounded-full bg-gradient-to-r from-nepal-accent via-purple-400 to-blue-400 shadow-lg" />
        </motion.div>
      ))}
    </>
  );
}
