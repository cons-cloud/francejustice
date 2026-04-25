import React from 'react';
import { Card, CardContent } from './Card';
import { cn } from '../../lib/utils';

interface AnimatedCardProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  hover?: boolean;
}

const AnimatedCard: React.FC<AnimatedCardProps> = ({ 
  children, 
  delay = 0, 
  className,
  hover = true 
}) => {
  return (
    <Card 
      className={cn(
        'animate-fade-in-up',
        hover && 'card-hover',
        className
      )}
      style={{ animationDelay: `${delay}s` }}
    >
      <CardContent>
        {children}
      </CardContent>
    </Card>
  );
};

export default AnimatedCard;
