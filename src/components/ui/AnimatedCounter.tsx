import React, { useEffect, useState } from 'react';
import { motion, animate } from 'framer-motion';

interface AnimatedCounterProps {
  value: string;
  className?: string;
}

const AnimatedCounter: React.FC<AnimatedCounterProps> = ({ value, className }) => {
  const [displayValue, setDisplayValue] = useState(0);
  const target = parseInt(value.replace(/[,+]/g, '')) || 0;
  const isPlus = value.includes('+');

  useEffect(() => {
    const controls = animate(0, target, {
      duration: 2,
      onUpdate(value) {
        setDisplayValue(Math.floor(value));
      },
    });
    return () => controls.stop();
  }, [target]);

  return (
    <motion.span 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={className}
    >
      {displayValue.toLocaleString()}
      {isPlus && '+'}
    </motion.span>
  );
};

export default AnimatedCounter;
