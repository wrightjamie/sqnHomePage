// js/components/Pagination.js

export class Pagination {
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
