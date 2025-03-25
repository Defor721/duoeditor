import * as Y from "yjs";
import { Awareness } from "y-protocols/awareness";

declare module "y-codemirror" {
  export function yCollab(
    doc: Y.Doc,
    awareness: Awareness,
    options?: {
      undoManager?: Y.UndoManager;
    }
  ): unknown;
}
