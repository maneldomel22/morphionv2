import { useState, useCallback, useRef, useEffect } from 'react';

export default function useDragAndDrop(onDrop) {
  const [isDragging, setIsDragging] = useState(false);
  const [draggedItem, setDraggedItem] = useState(null);
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
  const [dropTarget, setDropTarget] = useState(null);
  const [dragStartPos, setDragStartPos] = useState(null);

  const dragThreshold = 5;
  const isDragStartedRef = useRef(false);
  const animationFrameRef = useRef(null);
  const onDropRef = useRef(onDrop);

  useEffect(() => {
    onDropRef.current = onDrop;
  }, [onDrop]);

  const handlePointerDown = useCallback((e, item) => {
    if (e.button !== 0) return;

    console.log('handlePointerDown called with item:', item);

    setDragStartPos({ x: e.clientX, y: e.clientY });
    setDraggedItem(item);
    isDragStartedRef.current = false;
  }, []);

  const handlePointerMove = useCallback((e) => {
    if (!draggedItem) return;

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    animationFrameRef.current = requestAnimationFrame(() => {
      if (!isDragStartedRef.current && dragStartPos) {
        const dx = Math.abs(e.clientX - dragStartPos.x);
        const dy = Math.abs(e.clientY - dragStartPos.y);

        if (dx > dragThreshold || dy > dragThreshold) {
          console.log('Drag started! dx:', dx, 'dy:', dy);
          setIsDragging(true);
          isDragStartedRef.current = true;
          document.body.style.cursor = 'grabbing';
          document.body.style.userSelect = 'none';
        }
      }

      if (isDragStartedRef.current) {
        setDragPosition({ x: e.clientX, y: e.clientY });

        const elementUnderCursor = document.elementFromPoint(e.clientX, e.clientY);
        const folderElement = elementUnderCursor?.closest('[data-folder-id]');

        if (folderElement) {
          const folderId = folderElement.getAttribute('data-folder-id');
          const targetId = folderId === 'null' ? 'null' : folderId;
          setDropTarget(targetId);
        } else {
          setDropTarget(undefined);
        }
      }
    });
  }, [draggedItem, dragStartPos]);

  const handlePointerUp = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    const wasDragging = isDragStartedRef.current;
    const finalDropTarget = dropTarget;
    const finalDraggedItem = draggedItem;

    console.log('handlePointerUp - wasDragging:', wasDragging, 'dropTarget:', finalDropTarget, 'draggedItem:', finalDraggedItem);

    setIsDragging(false);
    setDraggedItem(null);
    setDropTarget(undefined);
    setDragStartPos(null);
    isDragStartedRef.current = false;
    document.body.style.cursor = '';
    document.body.style.userSelect = '';

    if (wasDragging && onDropRef.current) {
      onDropRef.current({
        wasDragging,
        dropTarget: finalDropTarget,
        draggedItem: finalDraggedItem
      });
    }
  }, [dropTarget, draggedItem]);

  useEffect(() => {
    if (draggedItem) {
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);

      return () => {
        window.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('pointerup', handlePointerUp);
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };
    }
  }, [draggedItem, handlePointerMove, handlePointerUp]);

  return {
    isDragging,
    draggedItem,
    dragPosition,
    dropTarget,
    handlePointerDown,
  };
}
