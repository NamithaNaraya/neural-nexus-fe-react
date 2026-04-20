import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

const DEFAULT_ROW_HEIGHT = 148;
const OVERSCAN = 6;

function clampIndex(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function VirtualMessageList({
  items,
  renderItem,
  className = '',
  innerClassName = '',
  bottomRef = null,
}) {
  const containerRef = useRef(null);
  const sizeMapRef = useRef(new Map());
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    const updateViewport = () => {
      setViewportHeight(container.clientHeight || 0);
    };

    updateViewport();

    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', updateViewport);
      return () => window.removeEventListener('resize', updateViewport);
    }

    const observer = new ResizeObserver(updateViewport);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  const measurements = useMemo(() => {
    const sizes = items.map((_, index) => sizeMapRef.current.get(index) || DEFAULT_ROW_HEIGHT);
    const offsets = new Array(items.length);
    let runningOffset = 0;

    for (let index = 0; index < items.length; index += 1) {
      offsets[index] = runningOffset;
      runningOffset += sizes[index];
    }

    return {
      sizes,
      offsets,
      totalHeight: runningOffset,
    };
  }, [items]);

  const visibleRange = useMemo(() => {
    if (items.length === 0) {
      return { start: 0, end: -1 };
    }

    const startBoundary = Math.max(0, scrollTop - DEFAULT_ROW_HEIGHT * OVERSCAN);
    const endBoundary = scrollTop + viewportHeight + DEFAULT_ROW_HEIGHT * OVERSCAN;

    let start = 0;
    while (
      start < items.length - 1
      && measurements.offsets[start] + measurements.sizes[start] < startBoundary
    ) {
      start += 1;
    }

    let end = start;
    while (end < items.length - 1 && measurements.offsets[end] < endBoundary) {
      end += 1;
    }

    return {
      start: clampIndex(start, 0, items.length - 1),
      end: clampIndex(end, 0, items.length - 1),
    };
  }, [items.length, measurements.offsets, measurements.sizes, scrollTop, viewportHeight]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    const onScroll = () => {
      setScrollTop(container.scrollTop || 0);
    };

    onScroll();
    container.addEventListener('scroll', onScroll, { passive: true });
    return () => container.removeEventListener('scroll', onScroll);
  }, []);

  const handleRowHeight = useCallback((index, height) => {
    const previous = sizeMapRef.current.get(index);
    if (previous === height) return;
    sizeMapRef.current.set(index, height);
    // Use a small delay or requestAnimationFrame to batch height updates
    // and avoid "ResizeObserver loop limit exceeded" or infinite render loops
    requestAnimationFrame(() => {
      setViewportHeight(containerRef.current?.clientHeight || 0);
    });
  }, []);

  const visibleItems = [];
  for (let index = visibleRange.start; index <= visibleRange.end; index += 1) {
    const item = items[index];
    if (!item) continue;
    visibleItems.push(
      <MeasuredRow
        key={item.key ?? index}
        index={index}
        top={measurements.offsets[index]}
        onHeight={handleRowHeight}
      >
        {renderItem(item, index)}
      </MeasuredRow>
    );
  }

  return (
    <div ref={containerRef} className={className}>
      <div className={innerClassName} style={{ height: measurements.totalHeight || 1, position: 'relative' }}>
        {visibleItems}
        {bottomRef ? (
          <div
            ref={bottomRef}
            style={{ position: 'absolute', top: measurements.totalHeight, height: 1, width: '100%' }}
          />
        ) : null}
      </div>
    </div>
  );
}

function MeasuredRow({ index, top, children, onHeight }) {
  const rowRef = useRef(null);

  useLayoutEffect(() => {
    const element = rowRef.current;
    if (!element) return undefined;

    const updateHeight = () => {
      const height = Math.ceil(element.getBoundingClientRect().height || DEFAULT_ROW_HEIGHT);
      onHeight(height);
    };

    updateHeight();

    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', updateHeight);
      return () => window.removeEventListener('resize', updateHeight);
    }

    const observer = new ResizeObserver(updateHeight);
    observer.observe(element);
    return () => observer.disconnect();
  }, [index, onHeight]);

  return (
    <div
      ref={rowRef}
      style={{
        position: 'absolute',
        top,
        left: 0,
        right: 0,
      }}
    >
      {children}
    </div>
  );
}
