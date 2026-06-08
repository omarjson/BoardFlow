// ============================================
// Permissions — Access Control
// ============================================

class _Permissions {
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
      Toast.show(I18n.__('connect_supabase_members'), 'info');
      return false;
    }

    if (!this.canAddMembers(boardId)) {
      Toast.show(I18n.__('owner_only_add_members'), 'error');
      return false;
    }

    try {
      const { data: profile } = await BoardFlowAuth.supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .single();

      if (!profile) {
        Toast.show(I18n.__('user_not_found'), 'error');
        return false;
      }

      const { error } = await BoardFlowAuth.supabase
        .from('board_members')
        .insert({ board_id: boardId, user_id: profile.id, role });

      if (error) {
        if (error.code === '23505') {
          Toast.show(I18n.__('already_member'), 'info');
        } else {
          Toast.show(I18n.__('failed_add_member'), 'error');
        }
        return false;
      }

      Toast.show(`${I18n.__('added')} ${email} ${I18n.__('as_role')} ${role}`, 'success');
      return true;
    } catch (err) {
      Toast.show(I18n.__('failed_add_member'), 'error');
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

      Toast.show(I18n.__('member_removed'), 'success');
      return true;
    } catch {
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

      Toast.show(`${I18n.__('role_changed')} ${newRole}`, 'success');
      return true;
    } catch {
      return false;
    }
  }
}

try {
  Object.defineProperty(window, 'Permissions', { value: new _Permissions(), writable: false, configurable: true, enumerable: true });
} catch { window.Permissions = new _Permissions(); }
