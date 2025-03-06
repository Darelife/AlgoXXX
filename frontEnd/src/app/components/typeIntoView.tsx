"use client";

import React, { useEffect, useState, useRef } from "react";

interface TypeIntoViewProps {
  id: string;
  heading?: string;
  text?: string;
  align?: "left" | "right";
}

const TypeIntoView: React.FC<TypeIntoViewProps> = ({
  id,
  heading = "Welcome to AlgoManiax",
  text = "Explore the world of competitive programming with us. We are a group of passionate programmers who love to solve problems and learn new techniques to improve our skills. Join us and be a part of the community!",
  align = "left",
}) => {
  const [visibility, setVisibility] = useState(0);
  const [scrollDirection, setScrollDirection] = useState<"up" | "down">("down");
  const sectionRef = useRef<HTMLElement>(null);
  const observer = useRef<IntersectionObserver | null>(null);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY.current) {
        setScrollDirection("down");
      } else {
        setScrollDirection("up");
      }
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    // Use IntersectionObserver for better performance
    observer.current = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        // Calculate how visible the element is
        const intersectionRatio = entry.intersectionRatio;
        
        // Smooth the transition with a custom curve
        const smoothedValue = smoothStep(0, 1, intersectionRatio * 1.5);
        setVisibility(smoothedValue);
      });
    }, {
      root: null, // viewport
      rootMargin: "0px",
      threshold: buildThresholdList() // Generate multiple thresholds for smoother transitions
    });

    if (sectionRef.current) {
      observer.current.observe(sectionRef.current);
    }

    return () => {
      if (observer.current) {
        observer.current.disconnect();
      }
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // Create an array of thresholds for smoother animation
  const buildThresholdList = () => {
    const thresholds = [];
    const steps = 20;
    for (let i = 0; i <= steps; i++) {
      thresholds.push(i / steps);
    }
    return thresholds;
  };

  // Smooth step function for more natural transitions
  const smoothStep = (min: number, max: number, value: number) => {
    const x = Math.max(0, Math.min(1, (value-min)/(max-min)));
    return x*x*(3 - 2*x); // Smoother curve than linear
  };

  // Playful animation for the side line - moves as you scroll
  const getSideLineStyles = () => {
    const baseStyles = {
      height: `${visibility * 100}%`,
      opacity: visibility * 0.8
    };
    
    // Add cheeky animation based on scroll direction
    if (scrollDirection === "down") {
      return {
        ...baseStyles,
        clipPath: `polygon(0 0, 100% 0, 100% ${100 - (visibility * 30)}%, 0 100%)`,
        transform: `scaleY(${1 + (visibility * 0.05)}) translateY(${visibility * 5}px)`
      };
    } else {
      return {
        ...baseStyles,
        clipPath: `polygon(0 0, 100% 0, 100% 100%, 0 ${100 - (visibility * 30)}%)`,
        transform: `scaleY(${1 + (visibility * 0.05)}) translateY(${-visibility * 5}px)`
      };
    }
  };

  return (
    <div className={`flex ${align === "right" ? "justify-end" : "justify-start"} min-h-[30vh] px-5 my-24`}>
      <section
        id={id}
        ref={sectionRef}
        className={`max-w-2xl flex flex-col ${
          align === "right" ? "items-end text-right" : "items-start text-left"
        } relative`}
      >
        {/* Animated background accent */}
        <div
          className="absolute inset-0 bg-orange-50 dark:bg-orange-900/10 rounded-lg -z-10 transition-all duration-700"
          style={{ 
            transform: `scale(${0.97 + (visibility * 0.03)}) rotate(${(1 - visibility) * (align === "left" ? -1 : 1)}deg)`,
            opacity: visibility * 0.2
          }}
        />
        
        {/* Side line indicator with cheeky movement */}
        <div 
          className={`absolute ${align === "left" ? "left-[-20px]" : "right-[-20px]"} top-0 w-[3px] bg-gradient-to-b from-orange-500 to-red-500 dark:from-orange-400 dark:to-red-400 rounded-full transition-all duration-700`}
          style={getSideLineStyles()}
        />
        
        {/* Content container with offset on scroll */}
        <div
          className="transition-all duration-700"
          style={{ 
            transform: `translateY(${(1 - visibility) * 40}px)`,
            opacity: visibility
          }}
        >
          {/* Pre-heading small tag with bounce effect */}
          <div 
            className="text-sm uppercase tracking-wider font-medium text-orange-500 dark:text-orange-400 mb-2 transition-all duration-1000"
            style={{ 
              opacity: Math.min(1, visibility * 1.5),
              transform: `translateX(${(1 - Math.min(1, visibility * 1.5)) * (align === "left" ? -20 : 20)}px) 
                          translateY(${Math.sin(visibility * Math.PI) * 5}px)`
            }}
          >
            AlgoX
          </div>
          
          {/* Main heading with letter spacing animation */}
          <h2 
            className="text-4xl font-bold text-orange-600 dark:text-gray-100 tracking-tight transition-all duration-700"
            style={{ 
              letterSpacing: `${(1 - visibility) * 0.1}em`,
              transform: `perspective(500px) rotateX(${(1 - visibility) * 10}deg)`
            }}
          >
            {heading}
          </h2>
          
          {/* Key features list or paragraph with staggered appearance */}
          <div className="mt-6">
            {text.includes('.') ? (
              text.split('.').filter(Boolean).map((sentence, index) => (
                <div 
                  key={index}
                  className="flex items-start mb-4 transition-all duration-700"
                  style={{ 
                    opacity: Math.max(0, visibility * 1.2 - (index * 0.1)),
                    transform: `translateY(${Math.max(0, (1 - (visibility * 1.2 - (index * 0.1))) * 20)}px) 
                                scale(${0.95 + (Math.min(1, visibility * 1.2 - (index * 0.1)) * 0.05)})`
                  }}
                >
                  <div className="mr-3 mt-1">
                    <div 
                      className="w-2 h-2 rounded-full bg-orange-500 dark:bg-orange-400 transition-all duration-500"
                      style={{ 
                        transform: `scale(${1 + Math.sin((visibility + index * 0.2) * Math.PI) * 0.3})`,
                        opacity: Math.min(1, visibility * 1.5 - index * 0.1)
                      }}
                    />
                  </div>
                  <p className="text-gray-700 dark:text-gray-300">
                    {sentence.trim()}.
                  </p>
                </div>
              ))
            ) : (
              <p 
                className="text-gray-700 dark:text-gray-300 transition-all duration-700"
                style={{ 
                  opacity: visibility,
                  transform: `translateY(${(1 - visibility) * 20}px)`
                }}
              >
                {text}
              </p>
            )}
          </div>
          
          {/* Bottom decoration with wave effect */}
          <div 
            className={`h-[1px] bg-gradient-to-r ${align === "left" ? "from-orange-500 to-transparent" : "from-transparent to-orange-500"} dark:from-orange-400 dark:to-transparent mt-8 transition-all duration-1000`}
            style={{ 
              width: `${visibility * 100}%`,
              opacity: visibility * 0.6,
              transform: `translateY(${Math.sin(visibility * Math.PI * 2) * 3}px)`
            }}
          />
        </div>
      </section>
    </div>
  );
};

export default TypeIntoView;