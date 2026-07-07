"use client";

import { useCallback, useEffect, useMemo, useRef, useState, memo } from "react";
import "./LogoLoop.css";

const ANIMATION_CONFIG = { SMOOTH_TAU: 0.25, MIN_COPIES: 2, COPY_HEADROOM: 2 };

const toCssLength = (value: number | string | undefined) =>
  typeof value === "number" ? `${value}px` : (value ?? undefined);

interface LogoItem {
  node?: React.ReactNode;
  title?: string;
  href?: string;
  ariaLabel?: string;
  src?: string;
  srcSet?: string;
  sizes?: string;
  width?: number;
  height?: number;
  alt?: string;
}

interface LogoLoopProps {
  logos: LogoItem[];
  speed?: number;
  direction?: "left" | "right" | "up" | "down";
  width?: number | string;
  logoHeight?: number;
  gap?: number;
  pauseOnHover?: boolean;
  hoverSpeed?: number;
  fadeOut?: boolean;
  fadeOutColor?: string;
  scaleOnHover?: boolean;
  renderItem?: (item: LogoItem, key: React.Key) => React.ReactNode;
  ariaLabel?: string;
  className?: string;
  style?: React.CSSProperties;
}

function useResizeObserver(callback: () => void, elements: React.RefObject<HTMLElement | null>[]) {
  useEffect(() => {
    if (typeof ResizeObserver === "undefined") {
      const handleResize = () => callback();
      window.addEventListener("resize", handleResize);
      callback();
      return () => window.removeEventListener("resize", handleResize);
    }
    const observers = elements.map((ref) => {
      if (!ref.current) return null;
      const observer = new ResizeObserver(callback);
      observer.observe(ref.current);
      return observer;
    });
    callback();
    return () => observers.forEach((o) => o?.disconnect());
  }, [callback]);
}

function useImageLoader(seqRef: React.RefObject<HTMLElement | null>, onLoad: () => void) {
  useEffect(() => {
    const images = seqRef.current?.querySelectorAll("img") ?? [];
    if (images.length === 0) { onLoad(); return; }
    let remaining = images.length;
    const handle = () => { remaining -= 1; if (remaining === 0) onLoad(); };
    images.forEach((img) => {
      if ((img as HTMLImageElement).complete) handle();
      else {
        img.addEventListener("load", handle, { once: true });
        img.addEventListener("error", handle, { once: true });
      }
    });
  }, [onLoad, seqRef]);
}

function useAnimationLoop(
  trackRef: React.RefObject<HTMLElement | null>,
  targetVelocity: number,
  seqWidth: number,
  seqHeight: number,
  isHovered: boolean,
  hoverSpeed: number | undefined,
  isVertical: boolean,
) {
  const rafRef = useRef<number | null>(null);
  const lastTRef = useRef<number | null>(null);
  const offsetRef = useRef(0);
  const velocityRef = useRef(0);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const seqSize = isVertical ? seqHeight : seqWidth;

    if (seqSize > 0) {
      offsetRef.current = ((offsetRef.current % seqSize) + seqSize) % seqSize;
      const t = isVertical ? `translate3d(0,${-offsetRef.current}px,0)` : `translate3d(${-offsetRef.current}px,0,0)`;
      track.style.transform = t;
    }

    const animate = (ts: number) => {
      if (lastTRef.current === null) lastTRef.current = ts;
      const dt = Math.max(0, ts - lastTRef.current) / 1000;
      lastTRef.current = ts;
      const target = isHovered && hoverSpeed !== undefined ? hoverSpeed : targetVelocity;
      const factor = 1 - Math.exp(-dt / ANIMATION_CONFIG.SMOOTH_TAU);
      velocityRef.current += (target - velocityRef.current) * factor;

      if (seqSize > 0) {
        offsetRef.current = ((offsetRef.current + velocityRef.current * dt) % seqSize + seqSize) % seqSize;
        const t2 = isVertical ? `translate3d(0,${-offsetRef.current}px,0)` : `translate3d(${-offsetRef.current}px,0,0)`;
        track.style.transform = t2;
      }
      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      lastTRef.current = null;
    };
  }, [targetVelocity, seqWidth, seqHeight, isHovered, hoverSpeed, isVertical, trackRef]);
}

const LogoLoop = memo(function LogoLoop({
  logos,
  speed = 120,
  direction = "left",
  width = "100%",
  logoHeight = 28,
  gap = 32,
  pauseOnHover,
  hoverSpeed,
  fadeOut = false,
  fadeOutColor,
  scaleOnHover = false,
  renderItem,
  ariaLabel = "Partner logos",
  className,
  style,
}: LogoLoopProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const seqRef = useRef<HTMLUListElement>(null);
  const [seqWidth, setSeqWidth] = useState(0);
  const [seqHeight, setSeqHeight] = useState(0);
  const [copyCount, setCopyCount] = useState(ANIMATION_CONFIG.MIN_COPIES);
  const [isHovered, setIsHovered] = useState(false);

  const effectiveHoverSpeed = useMemo(() => {
    if (hoverSpeed !== undefined) return hoverSpeed;
    if (pauseOnHover === true) return 0;
    if (pauseOnHover === false) return undefined;
    return 0;
  }, [hoverSpeed, pauseOnHover]);

  const isVertical = direction === "up" || direction === "down";

  const targetVelocity = useMemo(() => {
    const mag = Math.abs(speed);
    const dirMul = isVertical ? (direction === "up" ? 1 : -1) : (direction === "left" ? 1 : -1);
    const speedMul = speed < 0 ? -1 : 1;
    return mag * dirMul * speedMul;
  }, [speed, direction, isVertical]);

  const updateDimensions = useCallback(() => {
    const cw = containerRef.current?.clientWidth ?? 0;
    const sr = seqRef.current?.getBoundingClientRect();
    const sw = sr?.width ?? 0;
    const sh = sr?.height ?? 0;
    if (isVertical) {
      const ph = containerRef.current?.parentElement?.clientHeight ?? 0;
      if (containerRef.current && ph > 0) {
        containerRef.current.style.height = `${ph}px`;
      }
      if (sh > 0) {
        setSeqHeight(Math.ceil(sh));
        const vp = containerRef.current?.clientHeight ?? ph ?? sh;
        setCopyCount(Math.max(ANIMATION_CONFIG.MIN_COPIES, Math.ceil(vp / sh) + ANIMATION_CONFIG.COPY_HEADROOM));
      }
    } else if (sw > 0) {
      setSeqWidth(Math.ceil(sw));
      setCopyCount(Math.max(ANIMATION_CONFIG.MIN_COPIES, Math.ceil(cw / sw) + ANIMATION_CONFIG.COPY_HEADROOM));
    }
  }, [isVertical]);

  useResizeObserver(updateDimensions, [containerRef, seqRef]);
  useImageLoader(seqRef, updateDimensions);
  useAnimationLoop(trackRef, targetVelocity, seqWidth, seqHeight, isHovered, effectiveHoverSpeed, isVertical);

  const cssVariables = useMemo(() => ({
    "--logoloop-gap": `${gap}px`,
    "--logoloop-logoHeight": `${logoHeight}px`,
    ...(fadeOutColor ? { "--logoloop-fadeColor": fadeOutColor } as Record<string, string> : {}),
  }), [gap, logoHeight, fadeOutColor]);

  const rootClass = useMemo(() =>
    ["logoloop", isVertical ? "logoloop--vertical" : "logoloop--horizontal",
     fadeOut && "logoloop--fade", scaleOnHover && "logoloop--scale-hover", className].filter(Boolean).join(" "),
  [isVertical, fadeOut, scaleOnHover, className]);

  const onMouseEnter = useCallback(() => { if (effectiveHoverSpeed !== undefined) setIsHovered(true); }, [effectiveHoverSpeed]);
  const onMouseLeave = useCallback(() => { if (effectiveHoverSpeed !== undefined) setIsHovered(false); }, [effectiveHoverSpeed]);

  const renderLogo = useCallback((item: LogoItem, key: React.Key) => {
    if (renderItem) return <li className="logoloop__item" key={key}>{renderItem(item, key)}</li>;
    const isNode = "node" in item;
    const content = isNode ? (
      <span className="logoloop__node" aria-hidden={!!item.href && !item.ariaLabel}>{item.node}</span>
    ) : (
      // eslint-disable-next-line @next/next/no-img-element -- useImageLoader measures raw <img> elements via querySelectorAll + load/error listeners, and this primitive exposes custom srcSet/sizes control that next/image doesn't accept as a passthrough prop
      <img src={item.src} srcSet={item.srcSet} sizes={item.sizes} width={item.width} height={item.height}
        alt={item.alt ?? ""} title={item.title} loading="lazy" decoding="async" draggable={false} />
    );
    const label = isNode ? (item.ariaLabel ?? item.title) : (item.alt ?? item.title);
    const inner = item.href ? (
      <a className="logoloop__link" href={item.href} aria-label={label || "logo link"} target="_blank" rel="noreferrer noopener">{content}</a>
    ) : content;
    return <li className="logoloop__item" key={key}>{inner}</li>;
  }, [renderItem]);

  const lists = useMemo(() =>
    Array.from({ length: copyCount }, (_, i) => (
      <ul className="logoloop__list" key={`copy-${i}`} role="list" aria-hidden={i > 0} ref={i === 0 ? seqRef : undefined}>
        {logos.map((item, j) => renderLogo(item, `${i}-${j}`))}
      </ul>
    )), [copyCount, logos, renderLogo]);

  return (
    <div ref={containerRef} className={rootClass} style={{ width: isVertical ? undefined : toCssLength(width), ...cssVariables, ...style }}
      role="region" aria-label={ariaLabel}>
      <div ref={trackRef} className="logoloop__track" onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
        {lists}
      </div>
    </div>
  );
});

export default LogoLoop;
