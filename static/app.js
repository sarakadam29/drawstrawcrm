// SupportDesk CRM - Frontend JavaScript

// =====================
// Utility Functions
// =====================

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function getStatusColor(status) {
    switch(status) {
        case 'Open': return 'bg-status-open/20 text-status-open';
        case 'In Progress': return 'bg-status-progress/20 text-status-progress';
        case 'Closed': return 'bg-status-closed/20 text-status-closed';
        default: return 'bg-status-closed/20 text-status-closed';
    }
}

function showError(fieldName, message) {
    const errorEl = document.querySelector(`[data-field="${fieldName}"]`);
    if (errorEl) {
        errorEl.textContent = message;
        errorEl.classList.remove('hidden');
        const input = document.querySelector(`[name="${fieldName}"]`);
        if (input) input.classList.add('border-red-500');
    }
}

function clearErrors() {
    document.querySelectorAll('.error-message').forEach(el => {
        el.classList.add('hidden');
        el.textContent = '';
    });
    document.querySelectorAll('input, textarea, select').forEach(el => {
        el.classList.remove('border-red-500');
    });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// =====================
// Ticket List Page
// =====================

let allTickets = [];

async function loadTickets() {
    const loadingEl = document.getElementById('loading-state');
    const tableBody = document.getElementById('ticket-table-body');
    const cardsContainer = document.getElementById('ticket-cards');
    const emptyState = document.getElementById('empty-state');
    const countEl = document.getElementById('ticket-count');

    try {
        const response = await fetch('/api/tickets');
        allTickets = await response.json();

        loadingEl.classList.add('hidden');

        if (allTickets.length === 0) {
            emptyState.classList.remove('hidden');
            countEl.textContent = '0 tickets';
            return;
        }

        countEl.textContent = `${allTickets.length} ticket${allTickets.length !== 1 ? 's' : ''}`;
        renderTickets(allTickets);

    } catch (error) {
        console.error('Error loading tickets:', error);
        loadingEl.innerHTML = '<p class="text-red-400">Failed to load tickets. Please refresh.</p>';
    }
}

function renderTickets(tickets) {
    const tableBody = document.getElementById('ticket-table-body');
    const cardsContainer = document.getElementById('ticket-cards');
    const emptyState = document.getElementById('empty-state');

    if (tickets.length === 0) {
        tableBody.innerHTML = '';
        cardsContainer.innerHTML = '';
        emptyState.classList.remove('hidden');
        return;
    }

    emptyState.classList.add('hidden');

    // Desktop Table
    tableBody.innerHTML = tickets.map(ticket => `
        <tr class="border-b border-border-subtle table-row-hover cursor-pointer transition-colors" onclick="window.location.href='/tickets/${ticket.ticket_id}'">
            <td class="px-6 py-4">
                <span class="ticket-id text-text-secondary text-xs">${ticket.ticket_id}</span>
            </td>
            <td class="px-6 py-4">
                <div>
                    <p class="text-sm font-medium text-text-primary">${escapeHtml(ticket.customer_name)}</p>
                    <p class="text-xs text-text-secondary">${escapeHtml(ticket.customer_email)}</p>
                </div>
            </td>
            <td class="px-6 py-4">
                <p class="text-sm text-text-primary">${escapeHtml(ticket.subject)}</p>
            </td>
            <td class="px-6 py-4">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}">
                    ${ticket.status}
                </span>
            </td>
            <td class="px-6 py-4">
                <span class="text-xs text-text-secondary">${formatDate(ticket.created_at)}</span>
            </td>
        </tr>
    `).join('');

    // Mobile Cards
    cardsContainer.innerHTML = tickets.map(ticket => `
        <div class="bg-bg-surface border border-border-subtle rounded-lg p-4 cursor-pointer hover:border-accent/50 transition-colors" onclick="window.location.href='/tickets/${ticket.ticket_id}'">
            <div class="flex items-start justify-between mb-2">
                <span class="ticket-id text-text-secondary text-xs">${ticket.ticket_id}</span>
                <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}">
                    ${ticket.status}
                </span>
            </div>
            <p class="text-sm font-medium text-text-primary mb-1">${escapeHtml(ticket.subject)}</p>
            <p class="text-xs text-text-secondary mb-2">${escapeHtml(ticket.customer_name)} - ${escapeHtml(ticket.customer_email)}</p>
            <p class="text-xs text-text-secondary">${formatDate(ticket.created_at)}</p>
        </div>
    `).join('');
}

// Search and Filter
function setupSearchAndFilter() {
    const searchInput = document.getElementById('search-input');
    const statusFilter = document.getElementById('status-filter');

    if (!searchInput || !statusFilter) return;

    async function filterTickets() {
        const search = searchInput.value.trim();
        const status = statusFilter.value;

        try {
            const params = new URLSearchParams();
            if (search) params.append('search', search);
            if (status) params.append('status', status);

            const response = await fetch(`/api/tickets?${params}`);
            const tickets = await response.json();

            renderTickets(tickets);
            const countEl = document.getElementById('ticket-count');
            countEl.textContent = `${tickets.length} result${tickets.length !== 1 ? 's' : ''}`;
        } catch (error) {
            console.error('Error filtering tickets:', error);
        }
    }

    let searchTimeout;
    searchInput.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(filterTickets, 300);
    });

    statusFilter.addEventListener('change', filterTickets);
}

// =====================
// Create Ticket Page
// =====================

function initCreateForm() {
    const form = document.getElementById('create-ticket-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearErrors();

        const formData = new FormData(form);
        const data = {
            customer_name: formData.get('customer_name').trim(),
            customer_email: formData.get('customer_email').trim(),
            subject: formData.get('subject').trim(),
            description: formData.get('description').trim(),
            status: formData.get('status') || 'Open'
        };

        // Validation
        let hasError = false;
        if (!data.customer_name) {
            showError('customer_name', 'Customer name is required');
            hasError = true;
        }
        if (!data.customer_email) {
            showError('customer_email', 'Email is required');
            hasError = true;
        } else if (!isValidEmail(data.customer_email)) {
            showError('customer_email', 'Please enter a valid email address');
            hasError = true;
        }
        if (!data.subject) {
            showError('subject', 'Issue title is required');
            hasError = true;
        }
        if (!data.description) {
            showError('description', 'Description is required');
            hasError = true;
        }

        if (hasError) return;

        // Submit
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<svg class="animate-spin w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Creating...';

        try {
            const response = await fetch('/api/tickets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                window.location.href = '/';
            } else {
                const error = await response.json();
                alert('Error creating ticket: ' + (error.detail || 'Unknown error'));
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
            }
        } catch (error) {
            console.error('Error creating ticket:', error);
            alert('Network error. Please try again.');
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
    });
}

// =====================
// Ticket Detail Page
// =====================

async function loadTicketDetail(ticketId) {
    const loadingEl = document.getElementById('detail-loading');
    const errorEl = document.getElementById('detail-error');
    const contentEl = document.getElementById('detail-content');

    try {
        const response = await fetch(`/api/tickets/${ticketId}`);

        if (!response.ok) {
            if (response.status === 404) {
                loadingEl.classList.add('hidden');
                errorEl.classList.remove('hidden');
                return;
            }
            throw new Error('Failed to load ticket');
        }

        const ticket = await response.json();

        // Populate fields
        document.getElementById('detail-ticket-id').textContent = ticket.ticket_id;
        document.getElementById('detail-subject').textContent = ticket.subject;
        document.getElementById('detail-customer-name').textContent = ticket.customer_name;
        document.getElementById('detail-customer-email').textContent = ticket.customer_email;
        document.getElementById('detail-description').textContent = ticket.description;
        document.getElementById('detail-created').textContent = formatDate(ticket.created_at);
        document.getElementById('detail-updated').textContent = formatDate(ticket.updated_at);

        // Status badge
        const statusEl = document.getElementById('detail-status');
        statusEl.textContent = ticket.status;
        statusEl.className = `status-badge px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`;

        // Set current status in dropdown
        document.getElementById('update-status').value = ticket.status;

        // Render notes
        renderNotes(ticket.notes);

        // Setup update handler
        setupUpdateHandler(ticketId);

        loadingEl.classList.add('hidden');
        contentEl.classList.remove('hidden');

    } catch (error) {
        console.error('Error loading ticket detail:', error);
        loadingEl.classList.add('hidden');
        errorEl.classList.remove('hidden');
    }
}

function renderNotes(notes) {
    const notesList = document.getElementById('notes-list');
    const notesEmpty = document.getElementById('notes-empty');

    if (!notes || notes.length === 0) {
        notesList.innerHTML = '';
        notesEmpty.classList.remove('hidden');
        return;
    }

    notesEmpty.classList.add('hidden');

    notesList.innerHTML = notes.map(note => `
        <div class="border-l-2 border-accent/30 pl-4 py-1">
            <p class="text-sm text-text-primary/90 leading-relaxed">${escapeHtml(note.note_text)}</p>
            <p class="text-xs text-text-secondary mt-1">${formatDate(note.created_at)}</p>
        </div>
    `).join('');
}

function setupUpdateHandler(ticketId) {
    const updateBtn = document.getElementById('update-btn');
    if (!updateBtn) return;

    updateBtn.addEventListener('click', async () => {
        const status = document.getElementById('update-status').value;
        const noteText = document.getElementById('update-note').value.trim();

        const updateData = {};
        if (status) updateData.status = status;
        if (noteText) updateData.note_text = noteText;

        if (Object.keys(updateData).length === 0) return;

        const originalText = updateBtn.textContent;
        updateBtn.disabled = true;
        updateBtn.textContent = 'Updating...';

        try {
            const response = await fetch(`/api/tickets/${ticketId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updateData)
            });

            if (response.ok) {
                const updatedTicket = await response.json();

                // Update UI
                const statusEl = document.getElementById('detail-status');
                statusEl.textContent = updatedTicket.status;
                statusEl.className = `status-badge px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(updatedTicket.status)}`;
                document.getElementById('detail-updated').textContent = formatDate(updatedTicket.updated_at);

                // Clear note input
                document.getElementById('update-note').value = '';

                // Re-render notes
                renderNotes(updatedTicket.notes);

                // Show success
                const successEl = document.getElementById('update-success');
                successEl.classList.remove('hidden');
                setTimeout(() => successEl.classList.add('hidden'), 3000);

            } else {
                alert('Failed to update ticket');
            }
        } catch (error) {
            console.error('Error updating ticket:', error);
            alert('Network error. Please try again.');
        } finally {
            updateBtn.disabled = false;
            updateBtn.textContent = originalText;
        }
    });
}

// =====================
// Initialize
// =====================

document.addEventListener('DOMContentLoaded', () => {
    setupSearchAndFilter();
});
