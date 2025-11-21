import antlr4 from 'antlr4'
import ProjectDiablo2PropGrammarLexer from './ProjectDiablo2PropGrammarLexer.js'
import ProjectDiablo2PropGrammarParser from './ProjectDiablo2PropGrammarParser.js'
import ProjectDiablo2PropGrammarListener from './ProjectDiablo2PropGrammarListener.js'

class ExportTreeListener extends ProjectDiablo2PropGrammarListener {
  constructor () {
    super()
    this.percentages = []
    this.strings = []
  }

  getStringFromSymbol (symbol) {
    return symbol.source[1].strdata.substring(symbol.start, symbol.stop + 1)
  }

  pushString (ctx) {
    const string = ctx.children.map(e => {
      return this.getStringFromSymbol(e.symbol)
    }).join(' ')
    this.strings.push(string)
  }

  enterProperty (ctx) {
    const child = ctx.getChild(0)
    this.name = ProjectDiablo2PropGrammarParser.ruleNames[child.ruleIndex]
  }

  enterPercentage (ctx) {
    this.percentages.push({
      text: ctx.getText(),
      value: Number(ctx.getText().replace('%', ''))
    })
  }

  enterClass (ctx) {
    this.pushString(ctx)
  }

  enterClass_only_skill (ctx) {
    const stack = []
    for (const child of ctx.children) {
      const string = this.getStringFromSymbol(child.symbol)
      if (string === '(') {
        break
      }
      stack.push(string)
    }
    this.strings.push(stack.join(' '))
  }

  enterAny_skill (ctx) {
    this.pushString(ctx)
  }
}

export default function ExportTree (input) {
  let error = false
  const listener = {
    syntaxError: () => { error = true },
    reportAmbiguity: () => {},
    reportAttemptingFullContext: () => {},
    reportContextSensitivity: () => {}
  }
  const chars = new antlr4.InputStream(input)
  const lexer = new ProjectDiablo2PropGrammarLexer(chars)
  lexer.removeErrorListeners()
  lexer.addErrorListener(listener)
  const tokens = new antlr4.CommonTokenStream(lexer)
  const parser = new ProjectDiablo2PropGrammarParser(tokens)
  parser.removeErrorListeners()
  parser.addErrorListener(listener)
  // grammar always passes?
  parser._interp.predictionMode = antlr4.atn.PredictionMode.SLL
  const tree = parser.property()
  if (error) {
    return undefined
  }
  const res = new ExportTreeListener()
  antlr4.tree.ParseTreeWalker.DEFAULT.walk(res, tree)
  return { name: res.name, percentages: res.percentages, strings: res.strings }
}
