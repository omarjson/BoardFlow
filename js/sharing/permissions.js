// ============================================
// Permissions — Access Control
// ============================================

class _Permissions {
  _getRole(boardId) {
    const uid = BoardFlowAuth.getUserId();
    if (!uid) return null;
    const board = BoardManager.boards.find(b => b.id === boardId);
    if (board && board.user_id === uid) return 'owner';
    // check cached membership if available
    if (board && board._myRole) return board._myRole;
    return null; // unknown -> check via canEdit async? keep sync fast path
  }
  canEdit(boardId) {
    const role = this._getRole(boardId);
    if (role === 'owner') return true;
    // allow editor if we have membership data; fallback to true and let RLS enforce
    // we keep UI permissive but RLS is source of truth; check sync board_members if loaded
    const uid = BoardFlowAuth.getUserId();
    if (!uid) return false;
    // if board not in list, still allow attempt (RLS will block)
    return true; // will be gated by RLS on write; UI shows editor controls
  }
  isOwner(boardId) {
    const board = BoardManager.boards.find(b => b.id === boardId);
    return board?.user_id === BoardFlowAuth.getUserId();
  }

  canShare(boardId) {
    return this.isOwner(boardId);
  }

  canDelete(boardId) {
    return this.isOwner(boardId);
  }

  canAddMembers(boardId) {
    return this.isOwner(boardId);
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
      // Use SECURITY DEFINER RPC to find user by email (bypasses profiles RLS)
      let profile = null;
      try {
        const { data: rpcId } = await BoardFlowAuth.supabase.rpc('find_user_id_by_email', { email });
        if (rpcId) profile = { id: rpcId };
      } catch {}
      if (!profile) {
        // fallback to direct query (works if collaborator)
        const { data } = await BoardFlowAuth.supabase.from('profiles').select('id').eq('email', email).single();
        profile = data;
      }
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
