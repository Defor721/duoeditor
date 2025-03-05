declare module "y-codemirror" {
  import * as Y from "yjs";
  import { EditorView } from "@codemirror/view";

  export class CodemirrorBinding {
    constructor(yText: Y.Text, editor: EditorView, awareness?: any);
  }
}
