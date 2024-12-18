import React, { FunctionComponent, useRef, useEffect } from 'react';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import styles from './Editor.module.css';

type Props = {
  editor: monaco.editor.IStandaloneCodeEditor | null,
  setEditor: React.Dispatch<React.SetStateAction<monaco.editor.IStandaloneCodeEditor | null>>
}

export const Editor: FunctionComponent<Props> = ({ editor, setEditor }) => {
  const monacoEl = useRef(null);

  useEffect(() => {
    if (monacoEl) {
      setEditor((editor) => {
        if (editor) return editor;

        return monaco.editor.create(monacoEl.current!, {
          value: `namespace BoomerCSharpLinter;

async Task<int> GetTheThing() {
    return 0;
}

async Task Main() {
    var myThing = await GetTheThing();
}`,
          language: 'csharp',
          theme: 'vs-dark',
          fontSize: 16,
        });
      });
    }

    return () => editor?.dispose();
  }, [monacoEl.current]);

  return <div id="testing" className={styles.Editor} ref={monacoEl}></div>;
};
