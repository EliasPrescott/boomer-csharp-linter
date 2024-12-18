import { useEffect, useRef, useState } from 'react'
import './App.css'
import Parser from 'web-tree-sitter'
import { Editor } from './components/Editor'
import './userWorker'
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';

type LintRule = {
  query: string,
  process: (match: Parser.QueryMatch) => monaco.editor.IMarkerData,
}

function App() {
  const [parserLoaded, setParserLoaded] = useState(false)
  const [editor, setEditor] = useState<monaco.editor.IStandaloneCodeEditor | null>(null)
  let parserRef = useRef<Parser | null>(null)

  const lintRules: LintRule[] = [
    {
      query: '((modifier) @mod (#eq? @mod "async"))',
      process: match => {
        return {
          message: 'Using async. Async can add significant overhead to your application.',
          startLineNumber: match.captures[0].node.startPosition.row + 1, 
          startColumn: match.captures[0].node.startPosition.column + 1, 
          endLineNumber: match.captures[0].node.endPosition.row + 1, 
          endColumn: match.captures[0].node.endPosition.column + 1, 
          severity: monaco.MarkerSeverity.Warning,
        }
      },
    },
    {
      query: '((await_expression) @await)',
      process: match => {
        return {
          message: 'Using await. Try calling `.Result` instead.',
          startLineNumber: match.captures[0].node.startPosition.row + 1, 
          startColumn: match.captures[0].node.startPosition.column + 1, 
          endLineNumber: match.captures[0].node.startPosition.row + 1, 
          endColumn: match.captures[0].node.startPosition.column + 6, 
          severity: monaco.MarkerSeverity.Warning,
        }
      },
    },
    {
      query: '((variable_declaration type: (implicit_type) @var))',
      process: match => {
        return {
          message: 'var makes code difficult to read in a PR or email. Specify the type explicitly instead.',
          startLineNumber: match.captures[0].node.startPosition.row + 1, 
          startColumn: match.captures[0].node.startPosition.column + 1, 
          endLineNumber: match.captures[0].node.endPosition.row + 1, 
          endColumn: match.captures[0].node.endPosition.column + 1, 
          severity: monaco.MarkerSeverity.Warning,
        }
      },
    },
    {
      query: '((file_scoped_namespace_declaration) @modern_namespace)',
      process: match => {
        return {
          message: 'Implicit file namespaces can be confusing. Try specifying the scope explicitly using braces.',
          startLineNumber: match.captures[0].node.startPosition.row + 1, 
          startColumn: match.captures[0].node.startPosition.column + 1, 
          endLineNumber: match.captures[0].node.endPosition.row + 1, 
          endColumn: match.captures[0].node.endPosition.column + 1, 
          severity: monaco.MarkerSeverity.Warning,
        }
      },
    }
  ]

  async function loadParser() {
    await Parser.init();
    const parser = new Parser()
    const csharp = await Parser.Language.load('/tree-sitter-c_sharp.wasm')
    parser.setLanguage(csharp)
    parserRef.current = parser
    setParserLoaded(true)
  }

  async function parse() {
    let code = editor?.getValue();
    const tree = parserRef.current!.parse(code!)
    let diagnostics = []
    for (let lintRule of lintRules) { 
      let queryResult = parserRef.current!.getLanguage().query(lintRule.query)!
      for (let match of queryResult.matches(tree!.rootNode)) {
        diagnostics.push(lintRule.process(match))
      }
    }

    monaco.editor.removeAllMarkers('boomer_lints')
    monaco.editor.setModelMarkers(editor?.getModel()!, 'boomer_lints', diagnostics)
  }

  useEffect(() => {
    loadParser()
  }, [])

  useEffect(() => {
    if (parserLoaded && editor) {
      parse()
    }
  }, [parserLoaded, editor])

  useEffect(() => {
    let disposals = [];
    if (editor) {
      let listener = editor.onEndUpdate(() => {
        if (parserRef.current) {
          parse()
        }
      })
      disposals.push(listener)
    }

    return () => {
      for (let x of disposals) {
        x.dispose()
      }
    }
  }, [editor])

  return (
    <>
      <h1>Boomer C# Linter</h1>
      <p>
        Have you ever felt like C# has been changing too much? Adding too many features?
      </p>
      <p>
        Thanks to the Boomer C# Linter, you can write C# just like in the good old days. By utilizing a classic subset of the C# language, you can keep your team's code quality high while minimizing confusing syntax.
      </p>
      <sub>
        This tool is purely satirical. Any resemblance to code or code reviews, living or dead, is coincidental.
      </sub>
      <div className="center">
        <Editor editor={editor} setEditor={setEditor} />
      </div>
    </>
  )
}

export default App
