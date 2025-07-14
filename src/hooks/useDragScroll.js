import { useRef, useCallback } from "react";

/**
 * useDragScroll - Enables drag-to-scroll (mouse and touch) on a container.
 * Usage: const dragScrollRef = useDragScroll();
 * Attach dragScrollRef to the scrollable element.
 */
export default function useDragScroll() {
  const containerRef = useRef(null);
  const stateRef = useRef({});

  const setRef = useCallback((node) => {
    if (containerRef.current) {
      const prev = containerRef.current;
      prev.removeEventListener("mousedown", stateRef.current.onMouseDown);
      prev.removeEventListener("touchstart", stateRef.current.onTouchStart);
      prev.style.cursor = "";
    }
    if (!node) {
      containerRef.current = null;
      return;
    }
    containerRef.current = node;

    // Mouse events
    let isDown = false;
    let startX;
    let scrollLeft;
    const onMouseDown = (e) => {
      isDown = true;
      startX = e.pageX - node.offsetLeft;
      scrollLeft = node.scrollLeft;
      node.style.cursor = "grabbing";
      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
    };
    const onMouseMove = (e) => {
      if (!isDown) return;
      const x = e.pageX - node.offsetLeft;
      const walk = x - startX;
      node.scrollLeft = scrollLeft - walk;
    };
    const onMouseUp = () => {
      isDown = false;
      node.style.cursor = "grab";
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };

    // Touch events
    let touchStartX;
    let touchScrollLeft;
    let touchIsDown = false;
    const onTouchStart = (e) => {
      if (e.touches.length !== 1) return;
      touchIsDown = true;
      touchStartX = e.touches[0].pageX - node.offsetLeft;
      touchScrollLeft = node.scrollLeft;
      window.addEventListener("touchmove", onTouchMove);
      window.addEventListener("touchend", onTouchEnd);
    };
    const onTouchMove = (e) => {
      if (!touchIsDown || e.touches.length !== 1) return;
      const x = e.touches[0].pageX - node.offsetLeft;
      const walk = x - touchStartX;
      node.scrollLeft = touchScrollLeft - walk;
    };
    const onTouchEnd = () => {
      touchIsDown = false;
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
    };

    node.addEventListener("mousedown", onMouseDown);
    node.addEventListener("touchstart", onTouchStart, { passive: false });
    node.style.cursor = "grab";

    // Store handlers for cleanup
    stateRef.current = { onMouseDown, onTouchStart };
  }, []);

  return setRef;
}
