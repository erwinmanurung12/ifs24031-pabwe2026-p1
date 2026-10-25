import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import useInput from "../../../hooks/useInput";
import { formatDate, showConfirm, showError, showSuccess } from "../../../helpers/toolsHelper";
import { deleteComment, fetchComments, postComment } from "../states/slice";

export default function CommentsTab({ tournamentId }) {
  const dispatch = useDispatch();
  const comments = useSelector((s) => s.tournaments.comments);
  const me = useSelector((s) => s.auth.user);
  const [text, onText, resetText] = useInput();

  useEffect(() => { dispatch(fetchComments(tournamentId)); }, [dispatch, tournamentId]);

  const run = async (action, message, after) => {
    try {
      await dispatch(action).unwrap();
      await dispatch(fetchComments(tournamentId)).unwrap();
      showSuccess(message);
      after?.();
    } catch (err) {
      showError(err);
    }
  };

  return (
    <>
      <form
        onSubmit={(e) => { e.preventDefault(); run(postComment({ id: tournamentId, body: text }), "Komentar terkirim", resetText); }}
        className="grid gap-2 bg-white border border-line p-4 mb-6">
        <label className="grid gap-1 text-sm font-medium">Tulis komentar
          <textarea required maxLength={500} rows={3} value={text} onChange={onText} className="border border-line px-3 py-2 font-normal" />
        </label>
        <button className="justify-self-start bg-pitch text-white px-4 py-2 font-semibold">Kirim komentar</button>
      </form>
      {comments.length ? (
        <ul className="divide-y divide-line border-y border-line">
          {comments.map((c) => (
            <li key={c.id} className="py-3">
              <p className="text-sm">
                <span className="font-display text-lg font-semibold">{c.author}</span>
                {c.author_role === "admin" && <span className="ml-2 bg-bib px-2 text-xs font-semibold">Panitia</span>}
                <span className="ml-2 text-ink/70">{formatDate(c.created_at)}</span>
              </p>
              <p>{c.body}</p>
              {(me?.role === "admin" || me?.id === c.user_id) && (
                <button onClick={async () => { if (await showConfirm("Hapus komentar ini?")) run(deleteComment(c.id), "Komentar dihapus"); }}
                  className="text-sm text-redcard underline">Hapus</button>
              )}
            </li>
          ))}
        </ul>
      ) : <p className="py-6">Belum ada komentar. Jadilah yang pertama.</p>}
    </>
  );
}
