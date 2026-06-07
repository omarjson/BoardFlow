// ============================================
// Roadmap — Timeline Component
// ============================================

class _Roadmap {
  render(item) {
    const el = document.createElement('div');
    el.className = `board-item roadmap-item ${ItemManager.selectedItems.has(item.id) ? 'selected' : ''}`;
    el.dataset.id = item.id;
    el.dataset.type = 'roadmap';

    const milestones = item.metadata?.milestones || [];
    const title = item.title || 'Roadmap';

    el.style.cssText = `
      position: absolute;
      left: 0; top: 0;
      width: ${item.width}px;
      height: ${item.height}px;
      transform: translate(${item.position_x}px, ${item.position_y}px) rotate(${item.rotation}deg);
      z-index: ${item.z_index};
    `;

    const completed = milestones.filter(m => m.status === 'done').length;
    const total = milestones.length;
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

    el.innerHTML = `
      <div class="roadmap-inner" style="
        background: var(--surface);
        border: 1px solid var(--hairline);
        border-radius: var(--radius-md);
        overflow-y: auto;
        height: 100%;
        display: flex;
        flex-direction: column;
      ">
        <div class="roadmap-header" style="
          padding: var(--space-md);
          border-bottom: 1px solid var(--hairline);
          flex-shrink: 0;
        ">
          <div style="font-size: var(--text-md); font-weight: 600; color: var(--ink);">${Utils.escapeHtml(title)}</div>
          ${total > 0 ? `
          <div class="roadmap-progress" style="margin-top: var(--space-sm);">
            <div style="font-size: var(--text-xs); color: var(--ink-muted); margin-bottom: 4px;">${completed}/${total} (${progress}%)</div>
            <div style="height: 6px; background: var(--canvas-soft); border-radius: 3px; overflow: hidden;">
              <div style="height: 100%; width: ${progress}%; background: var(--primary); border-radius: 3px; transition: width 0.3s;"></div>
            </div>
          </div>` : ''}
        </div>
        <div class="roadmap-timeline" style="
          padding: var(--space-md);
          flex: 1;
          overflow-y: auto;
        ">
          ${milestones.length === 0 ? '<div style="text-align: center; color: var(--ink-muted); padding: var(--space-lg); font-size: var(--text-sm);">No milestones yet. Edit to add some.</div>' : ''}
          <div class="roadmap-milestones" style="position: relative; padding-left: 24px;">
            ${milestones.map((m, i) => `
              <div class="roadmap-milestone" data-index="${i}" style="
                position: relative;
                padding-bottom: var(--space-lg);
                padding-left: var(--space-md);
              ">
                <div class="roadmap-dot" style="
                  position: absolute;
                  left: -18px;
                  top: 4px;
                  width: 12px;
                  height: 12px;
                  border-radius: 50%;
                  background: ${this._statusColor(m.status)};
                  border: 2px solid var(--surface);
                  box-shadow: 0 0 0 1px var(--hairline);
                "></div>
                ${i < milestones.length - 1 ? `<div style="position: absolute; left: -14px; top: 16px; width: 2px; bottom: 0; background: var(--hairline);"></div>` : ''}
                <div style="font-size: var(--text-xs); color: var(--ink-muted);">${Utils.escapeHtml(m.date || '')}</div>
                <div style="font-size: var(--text-sm); font-weight: 500; color: var(--ink); margin-top: 2px;">${Utils.escapeHtml(m.title || '')}</div>
                ${m.description ? `<div style="font-size: var(--text-xs); color: var(--ink-secondary); margin-top: 2px;">${Utils.escapeHtml(m.description)}</div>` : ''}
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;

    return el;
  }

  _statusColor(status) {
    if (status === 'done') return '#2ecc71';
    if (status === 'in_progress') return '#f39c12';
    return '#bdc3c7';
  }

  async create(x, y, title) {
    const milestones = [
      { title: 'Phase 1', description: 'Planning', date: '', status: 'todo' },
      { title: 'Phase 2', description: 'Development', date: '', status: 'todo' },
      { title: 'Phase 3', description: 'Launch', date: '', status: 'todo' }
    ];

    return await ItemManager.createItem('roadmap', {
      x, y,
      width: 320,
      height: 400,
      title: title || 'Roadmap',
      content: '',
      metadata: { milestones }
    });
  }

  async edit(item) {
    const milestones = item.metadata?.milestones || [];
    const rows = milestones.map((m, i) => `
      <div class="roadmap-edit-row" style="display: flex; gap: var(--space-sm); align-items: center; margin-bottom: var(--space-sm);">
        <input type="text" class="roadmap-edit-title" value="${Utils.escapeHtml(m.title)}" placeholder="Title" style="flex: 1; padding: 6px var(--space-sm); background: var(--canvas-soft); border: 1px solid var(--hairline); border-radius: var(--radius-sm); font-size: var(--text-sm);">
        <input type="text" class="roadmap-edit-date" value="${Utils.escapeHtml(m.date || '')}" placeholder="Date" style="width: 100px; padding: 6px var(--space-sm); background: var(--canvas-soft); border: 1px solid var(--hairline); border-radius: var(--radius-sm); font-size: var(--text-sm);">
        <select class="roadmap-edit-status" style="padding: 6px; background: var(--canvas-soft); border: 1px solid var(--hairline); border-radius: var(--radius-sm); font-size: var(--text-sm);">
          <option value="todo" ${m.status === 'todo' ? 'selected' : ''}>Todo</option>
          <option value="in_progress" ${m.status === 'in_progress' ? 'selected' : ''}>In Progress</option>
          <option value="done" ${m.status === 'done' ? 'selected' : ''}>Done</option>
        </select>
        <button class="roadmap-edit-remove btn btn-ghost" style="padding: 4px 6px; font-size: var(--text-xs); color: var(--danger);">&times;</button>
      </div>
    `).join('');

    Modal.show({
      title: 'Edit Roadmap',
      content: `
        <div style="margin-bottom: var(--space-md);">
          <label for="roadmap-edit-title">Title</label>
          <input type="text" id="roadmap-edit-title" value="${Utils.escapeHtml(item.title || '')}" style="width: 100%; padding: var(--space-sm); background: var(--canvas-soft); border: 1px solid var(--hairline); border-radius: var(--radius-sm); font-size: var(--text-md);">
        </div>
        <div class="roadmap-edit-list">
          ${rows || '<p style="color: var(--ink-muted);">No milestones</p>'}
        </div>
        <button class="btn btn-secondary btn-sm" id="roadmap-add-milestone" style="margin-top: var(--space-sm);">+ Add Milestone</button>
      `,
      confirmText: 'Save',
      onConfirm: async () => {
        const newTitle = document.getElementById('roadmap-edit-title')?.value.trim() || item.title;
        const newMilestones = [];
        document.querySelectorAll('.roadmap-edit-row').forEach(row => {
          const title = row.querySelector('.roadmap-edit-title')?.value.trim();
          if (title) {
            newMilestones.push({
              title,
              date: row.querySelector('.roadmap-edit-date')?.value || '',
              status: row.querySelector('.roadmap-edit-status')?.value || 'todo',
              description: ''
            });
          }
        });
        await ItemManager.updateItem(item.id, {
          title: newTitle,
          metadata: { milestones: newMilestones }
        });
        Toast.show('Roadmap updated', 'success');
      }
    });

    document.getElementById('roadmap-add-milestone')?.addEventListener('click', () => {
      const list = document.querySelector('.roadmap-edit-list');
      const row = document.createElement('div');
      row.className = 'roadmap-edit-row';
      row.style.cssText = 'display: flex; gap: var(--space-sm); align-items: center; margin-bottom: var(--space-sm);';
      row.innerHTML = `
        <input type="text" class="roadmap-edit-title" placeholder="Title" style="flex: 1; padding: 6px var(--space-sm); background: var(--canvas-soft); border: 1px solid var(--hairline); border-radius: var(--radius-sm); font-size: var(--text-sm);">
        <input type="text" class="roadmap-edit-date" placeholder="Date" style="width: 100px; padding: 6px var(--space-sm); background: var(--canvas-soft); border: 1px solid var(--hairline); border-radius: var(--radius-sm); font-size: var(--text-sm);">
        <select class="roadmap-edit-status" style="padding: 6px; background: var(--canvas-soft); border: 1px solid var(--hairline); border-radius: var(--radius-sm); font-size: var(--text-sm);">
          <option value="todo">Todo</option>
          <option value="in_progress">In Progress</option>
          <option value="done">Done</option>
        </select>
        <button class="roadmap-edit-remove btn btn-ghost" style="padding: 4px 6px; font-size: var(--text-xs); color: var(--danger);">&times;</button>
      `;
      list?.appendChild(row);
      row.querySelector('.roadmap-edit-remove')?.addEventListener('click', () => row.remove());
    });

    document.querySelectorAll('.roadmap-edit-remove').forEach(btn => {
      btn.addEventListener('click', () => btn.closest('.roadmap-edit-row')?.remove());
    });
  }
}

try {
  Object.defineProperty(window, 'Roadmap', { value: new _Roadmap(), writable: false, configurable: true, enumerable: true });
} catch { window.Roadmap = new _Roadmap(); }
