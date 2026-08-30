import { ReactNode } from 'react';

export interface DepthCarouselItem {
  image?: string;
  alt?: string;
  icon?: ReactNode;
  title?: string;
  desc?: string;
  content?: ReactNode;
  render?: (item: DepthCarouselItem, index: number) => ReactNode;
}

export interface DepthCarouselProps {
  items?: (string | DepthCarouselItem)[];
  cardWidth?: number;
  cardHeight?: number;
  radius?: number;
  tint?: string;
  depth?: number;
  spread?: number;
  tilt?: number;
  tiltDirection?: 'left' | 'right';
  perspective?: number;
  visibleCards?: number;
  falloff?: number;
  blur?: number;
  duration?: number;
  ease?: string;
  autoplay?: boolean;
  autoplayDelay?: number;
  loop?: boolean;
  showControls?: boolean;
  showIndicators?: boolean;
  onChange?: (index: number, item: DepthCarouselItem) => void;
  className?: string;
}

declare const DepthCarousel: React.ComponentType<DepthCarouselProps>;
export default DepthCarousel;
