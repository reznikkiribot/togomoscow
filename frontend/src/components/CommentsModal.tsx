import { useEffect, useMemo, useState } from 'react';
import { api } from '../api';
import { useEscClose } from '../modalEsc';
import type { Comment } from '../types';

type Node = Comment & { children: Node[] };

function buildTree(list: Comment[]): Node[] {
  const map = new Map<string, Node>();
  list.forEach((c) => map.set(c.id, { ...c, children: [] }));
  const roots: Node[] = [];
  for (const c of list) {
    const node = map.get(c.id)!;
    if (c.parentId && map.has(c.parentId)) map.get(c.parentId)!.children.push(node);
    else roots.push(node);
  }
  return roots;
}

function CommentNode({
  node,
  depth,
  onReply,
  onOpenUser,
  meId,
  isAdmin,
  onDelete,
}: {
  node: Node;
  depth: number;
  onReply: (parentId: string, text: string) => Promise<void>;
  onOpenUser?: (userId: string) => void;
  meId?: string;
  isAdmin?: boolean;
  onDelete: (id: string) => void;
}) {
  const [replying, setReplying] = useState(false);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const name = node.user?.firstName ?? node.user?.username ?? 'Гость';
  const canDelete = !!meId && (node.user?.id === meId || isAdmin);

  const send = async () => {
    if (!text.trim()) return;
    setBusy(true);
    await onReply(node.id, text.trim());
    setText('');
    setReplying(false);
    setBusy(false);
  };

  return (
    <div className="cmt" style={{ marginLeft: depth > 0 ? 14 : 0 }}>
      <div
        className="cmt-head"
        onClick={() => node.user?.id && onOpenUser?.(node.user.id)}
        style={{ cursor: node.user?.id && onOpenUser ? 'pointer' : 'default' }}
      >
        {node.user?.photoUrl ? (
          <img className="cmt-avatar" src={node.user.photoUrl} alt="" />
        ) : (
          <div className="cmt-avatar ph">{name[0]?.toUpperCase() ?? '?'}</div>
        )}
        <b className="cmt-name">{name}</b>
      </div>
      <div className="cmt-text">{node.text}</div>
      <button className="cmt-reply" onClick={() => setReplying((r) => !r)}>
        Ответить
      </button>
      {canDelete && (
        <button
          className="cmt-reply"
          style={{ color: 'var(--accent)' }}
          onClick={() => onDelete(node.id)}
        >
          Удалить
        </button>
      )}
      {replying && (
        <div className="cmt-form">
          <input
            autoFocus
            placeholder="Ваш ответ…"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send()}
          />
          <button className="btn cmt-send" disabled={busy || !text.trim()} onClick={send}>
            Отправить
          </button>
        </div>
      )}
      {node.children.map((ch) => (
        <CommentNode
          key={ch.id}
          node={ch}
          depth={depth + 1}
          onReply={onReply}
          onOpenUser={onOpenUser}
          meId={meId}
          isAdmin={isAdmin}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}

export function CommentsModal({
  reviewId,
  onClose,
  onOpenUser,
}: {
  reviewId: string;
  onClose: () => void;
  onOpenUser?: (userId: string) => void;
}) {
  const [list, setList] = useState<Comment[]>([]);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [closing, setClosing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [modErr, setModErr] = useState('');
  const [me, setMe] = useState<{ id: string; role?: string } | null>(null);

  const load = () => {
    setLoading(true);
    setError(false);
    return api
      .comments(reviewId)
      .then((c) => setList(c))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  };
  useEffect(() => {
    load();
    api.me().then((u) => setMe({ id: u.id, role: (u as any).role })).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reviewId]);

  const tree = useMemo(() => buildTree(list), [list]);
  const reqClose = () => {
    setClosing(true);
    setTimeout(onClose, 220);
  };
  useEscClose(reqClose);

  const reply = async (parentId: string | undefined, t: string) => {
    setModErr('');
    try {
      const created = await api.addComment(reviewId, t, parentId);
      if (created) setList((prev) => [...prev, created]); // show instantly
      load(); // …and sync with server
    } catch (e: any) {
      // surface the real reason (moderation vs. network) instead of always blaming moderation
      setModErr(e?.message?.trim() || 'Не удалось отправить комментарий. Попробуйте ещё раз.');
    }
  };

  const removeComment = (id: string) => {
    api.deleteComment(id).then(load).catch(() => {});
  };

  const sendRoot = async () => {
    if (!text.trim()) return;
    setBusy(true);
    await reply(undefined, text.trim());
    setText('');
    setBusy(false);
  };

  return (
    <div
      className="modal-backdrop"
      style={{ zIndex: 3300 }}
      onClick={(e) => {
        e.stopPropagation();
        reqClose();
      }}
    >
      <div
        className={'modal cmt-modal' + (closing ? ' closing' : '')}
        onClick={(e) => e.stopPropagation()}
      >
        <h3>Обсуждение</h3>
        <div className="cmt-list">
          {loading ? (
            <div className="meta" style={{ color: 'var(--hint)', padding: '8px 0' }}>
              Загрузка…
            </div>
          ) : error ? (
            <div className="meta" style={{ color: 'var(--hint)', padding: '8px 0' }}>
              Не удалось загрузить комментарии.{' '}
              <button
                onClick={load}
                style={{ color: 'var(--accent)', fontWeight: 600, background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
              >
                Повторить
              </button>
            </div>
          ) : tree.length === 0 ? (
            <div className="meta" style={{ color: 'var(--hint)', padding: '8px 0' }}>
              Пока нет комментариев. Будьте первым!
            </div>
          ) : (
            tree.map((n) => (
              <CommentNode
                key={n.id}
                node={n}
                depth={0}
                onReply={(pid, t) => reply(pid, t)}
                onOpenUser={onOpenUser}
                meId={me?.id}
                isAdmin={me?.role === 'ADMIN'}
                onDelete={removeComment}
              />
            ))
          )}
        </div>
        {modErr && (
          <div className="meta" style={{ color: 'var(--accent)', padding: '4px 0' }}>{modErr}</div>
        )}
        <div className="cmt-form root">
          <input
            placeholder="Написать комментарий…"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendRoot()}
          />
          <button className="btn cmt-send" disabled={busy || !text.trim()} onClick={sendRoot}>
            Отправить
          </button>
        </div>
      </div>
    </div>
  );
}
