"use client";

import React, { useState, useEffect } from "react";
import styles from "../lander.module.css";

const Lander: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const [expand, setExpand] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      if (scrollY > 50 && scrollY < 200) {
        setExpand(true);
      } else if (scrollY >= 200) {
        setExpand(false);
        setScrolled(true);
      } else {
        setExpand(false);
        setScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className={styles.lander}>
      <div
        className={`
          ${styles.logo} 
          ${expand ? styles.expand : ""} 
          ${scrolled ? styles.scrolled : ""}
        `}
      >
        LOGO
      </div>
    </div>
  );
};

export default Lander;
