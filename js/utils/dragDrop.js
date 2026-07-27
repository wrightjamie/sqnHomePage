// js/utils/dragDrop.js

export function setupDragAndDrop(container, onReorder) {
    let draggedItem = null;

    container.querySelectorAll('.reorder-item').forEach(item => {
        item.addEventListener('dragstart', (e) => {
            draggedItem = item;
            item.classList.add('dragging');
            setTimeout(() => item.style.opacity = '0.5', 0);
        });

        item.addEventListener('dragend', () => {
            item.classList.remove('dragging');
            item.style.opacity = '1';
            draggedItem = null;

            const newOrder = Array.from(container.children).map(child => parseInt(child.getAttribute('data-id')));
            onReorder(newOrder);
        });

        item.addEventListener('dragover', (e) => {
            e.preventDefault();
            if (!draggedItem) return;
            const afterElement = getDragAfterElement(container, e.clientY);
            if (afterElement == null) {
                container.appendChild(draggedItem);
            } else {
                container.insertBefore(draggedItem, afterElement);
            }
        });
    });

    function getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('.reorder-item:not(.dragging)')];

        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }
}
