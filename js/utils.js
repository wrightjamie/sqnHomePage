// js/utils.js

/**
 * Reusable Pagination Component
 */
class Pagination {
    constructor(containerId, onPageChange) {
        this.container = document.getElementById(containerId);
        this.onPageChange = onPageChange;
        this.currentPage = 1;
        this.totalPages = 1;
    }

    render(currentPage, totalPages) {
        this.currentPage = currentPage;
        this.totalPages = totalPages;
        
        if (this.totalPages <= 1) {
            this.container.classList.add('hidden');
            return;
        }
        
        this.container.classList.remove('hidden');
        
        this.container.innerHTML = `
            <div class="btn-group">
                <button id="btn-prev-page" title="Previous Page" ${this.currentPage <= 1 ? 'disabled' : ''}>
                    <span class="material-symbols-outlined">chevron_left</span>
                </button>
                <div class="pagination-info">
                    ${this.currentPage} / ${this.totalPages || 1}
                </div>
                <button id="btn-next-page" title="Next Page" ${this.currentPage >= this.totalPages ? 'disabled' : ''}>
                    <span class="material-symbols-outlined">chevron_right</span>
                </button>
            </div>
        `;
        
        const btnPrev = this.container.querySelector('#btn-prev-page');
        const btnNext = this.container.querySelector('#btn-next-page');
        
        if (btnPrev) {
            btnPrev.addEventListener('click', () => {
                if (this.currentPage > 1) {
                    this.onPageChange(this.currentPage - 1);
                }
            });
        }
        
        if (btnNext) {
            btnNext.addEventListener('click', () => {
                if (this.currentPage < this.totalPages) {
                    this.onPageChange(this.currentPage + 1);
                }
            });
        }
    }
}

function setupDragAndDrop(container, onReorder) {
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
