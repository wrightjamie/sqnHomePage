/**
 * utils.js
 *
 * Shared utility functions and global components used across the frontend.
 * Includes Pagination, Drag-and-Drop setup, and the Global Toast Notification System.
 */

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

/**
 * Toast Notification System
 */
const Toast = {
    container: null,

    init() {
        if (!document.getElementById('toast-container')) {
            this.container = document.createElement('div');
            this.container.id = 'toast-container';
            document.body.appendChild(this.container);
        } else {
            this.container = document.getElementById('toast-container');
        }
    },

    show(message, type = 'info', duration = 3000) {
        if (!this.container) this.init();

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;

        let icon = 'info';
        if (type === 'success') icon = 'check_circle';
        if (type === 'error') icon = 'error';
        if (type === 'warning') icon = 'warning';

        toast.innerHTML = `
            <span class="material-symbols-outlined toast-icon">${icon}</span>
            <span class="toast-message"></span>
            <button class="toast-close"><span class="material-symbols-outlined">close</span></button>
        `;
        toast.querySelector('.toast-message').textContent = message;

        this.container.appendChild(toast);

        // Animate in
        requestAnimationFrame(() => {
            toast.classList.add('show');
        });

        // Setup dismissal
        let timeoutId;

        const dismiss = () => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300); // Wait for transition
        };

        toast.querySelector('.toast-close').addEventListener('click', () => {
            clearTimeout(timeoutId);
            dismiss();
        });

        if (duration > 0) {
            timeoutId = setTimeout(dismiss, duration);
        }
    }
};

// Initialize Toast on load
document.addEventListener('DOMContentLoaded', () => Toast.init());
