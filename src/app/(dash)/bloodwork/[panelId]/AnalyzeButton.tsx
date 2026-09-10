"use client";

import { useActionState } from "react";
import { analyzePanel, type BwState } from "../actions";

export function AnalyzeButton({
  panelId,
  hasAnalysis,
}: {
  panelId: string;
  hasAnalysis: boolean;
}) {
  const [state, action, pending] = useActionState<BwState, FormData>(
    analyzePanel,
    {},
  );

  return (
    <form action={action}>
      <input type="hidden" name="panelId" value={panelId} />
      {state.error && <p className="form-error">{state.error}</p>}
      <button className="btn primary" type="submit" disabled={pending}>
        {pending ? "מנתח…" : hasAnalysis ? "ניתוח מחדש" : "נתח עם AI"}
      </button>
    </form>
  );
}
