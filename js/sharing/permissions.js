// ============================================
// Permissions — Access Control
// ============================================

class _Permissions {
  constructor() {
    this.roles = ['owner', 'editor', 'viewer'];
  }

  canEdit(boardId) {
    const board = BoardManager.boards.find(b => b.id === boardId);
    if (!board) return false;
    return board.user_id === BoardFlowAuth.user?.id;
  }

  canShare(boardId) {
    return this.canEdit(boardId);
  }

  canDelete(boardId) {
    return this.canEdit(boardId);
  }

  canAddMembers(boardId) {
    const board = BoardManager.boards.find(b => b.id === boardId);
    if (!board) return false;
    return board.user_id === BoardFlowAuth.user?.id;
  }

  async addMember(boardId, email, role = 'viewer') {
    if (!BoardFlowAuth.supabase) {
      Toast.show('Supabase required for member management', 'info');
      return false;
    }

    if (!this.canAddMembers(boardId)) {
      Toast.show('Only the owner can add members', 'error');
      return false;
    }

    try {
      const { data: profile } = await BoardFlowAuth.supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .single();

      if (!profile) {
        Toast.show('User not found', 'error');
        return false;
      }

      const { error } = await BoardFlowAuth.supabase
        .from('board_members')
        .insert({ board_id: boardId, user_id: profile.id, role });

      if (error) {
        if (error.code === '23505') {
          Toast.show('User is already a member', 'info');
        } else {
          Toast.show('Failed to add member', 'error');
        }
        return false;
      }

      Toast.show(`Added ${email} as ${role}`, 'success');
      return true;
    } catch (err) {
      console.error('Add member failed:', err);
      Toast.show('Failed to add member', 'error');
      return false;
    }
  }

  async removeMember(boardId, userId) {
    if (!BoardFlowAuth.supabase) return false;
    if (!this.canAddMembers(boardId)) return false;

    try {
      await BoardFlowAuth.supabase
        .from('board_members')
        .delete()
        .eq('board_id', boardId)
        .eq('user_id', userId);

      Toast.show('Member removed', 'success');
      return true;
    } catch (err) {
      console.error('Remove member failed:', err);
      return false;
    }
  }

  async changeRole(boardId, userId, newRole) {
    if (!BoardFlowAuth.supabase) return false;
    if (!this.canAddMembers(boardId)) return false;

    try {
      await BoardFlowAuth.supabase
        .from('board_members')
        .update({ role: newRole })
        .eq('board_id', boardId)
        .eq('user_id', userId);

      Toast.show(`Role changed to ${newRole}`, 'success');
      return true;
    } catch (err) {
      console.error('Role change failed:', err);
      return false;
    }
  }
}

try {
  Object.defineProperty(window, 'Permissions', { value: new _Permissions(), writable: false, configurable: true, enumerable: true });
} catch { window.Permissions = new _Permissions(); }
