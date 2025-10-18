const display = document.getElementById('display');
const grid = document.getElementById('grid');

let memoria = 0;
let gt = 0;

// Event delegation: todos os cliques dos botões passam por aqui
grid.addEventListener('click', (e) => {
  const btn = e.target.closest('button');
  if (!btn) return;
  const action = btn.dataset.action;
  const value = btn.dataset.value;

  switch(action) {
    case 'digit':
      inserir(value);
      break;
    case 'op':
      inserir(value);
      break;
    case 'clear':
      limpar();
      break;
    case 'back':
      apagar();
      break;
    case 'equals':
      calcular();
      break;
    case 'mem':
      memoriaHandler(value);
      break;
    default:
      break;
  }
});

function inserir(ch) {
  // prevenção básica: evitar dois operadores seguidos (mais regras podem ser adicionadas)
  const cur = display.value;
  const last = cur.slice(-1);
  const ops = '+-*/';
  if (ops.includes(last) && ops.includes(ch)) return;
  display.value += ch;
}

function limpar() { display.value = ''; }
function apagar() { display.value = display.value.slice(0, -1); }

function calcular() {
  const expr = display.value.trim();
  if (!expr) return;
  try {
    const resultado = evaluateExpression(expr);
    display.value = String(resultado);
    gt += Number(resultado);
  } catch(err) {
    display.value = 'Erro';
  }
}

// memória simples
function memoriaHandler(cmd) {
  if (cmd === 'M+') memoria += parseFloat(display.value || 0);
  if (cmd === 'M-') memoria -= parseFloat(display.value || 0);
  if (cmd === 'MRC') display.value = String(memoria);
}

// --- Avaliador seguro: shunting-yard -> RPN -> eval ---
function evaluateExpression(input) {
  // tratar sinais unários: torna "-5" em "0-5" e "(-3" em "(0-3"
  const expr = input.replace(/^\s*-/,'0-').replace(/\(\s*-/g, '(0-');

  // tokenização (números com ponto e operadores/parenteses)
  const tokens = expr.match(/(\d+(\.\d+)?|\.\d+|[()+\-*/])/g);
  if (!tokens) throw new Error('Invalid expression');

  const prec = { '+':1, '-':1, '*':2, '/':2 };
  const output = [];
  const ops = [];

  tokens.forEach(token => {
    if (/^\d|^\./.test(token)) { // número
      output.push(token);
    } else if ('+-*/'.includes(token)) {
      while (ops.length && ' +-*/'.includes(ops[ops.length-1]) &&
             prec[ops[ops.length-1]] >= prec[token]) {
        output.push(ops.pop());
      }
      ops.push(token);
    } else if (token === '(') {
      ops.push(token);
    } else if (token === ')') {
      while (ops.length && ops[ops.length-1] !== '(') {
        output.push(ops.pop());
      }
      if (ops.length === 0) throw new Error('Mismatched parentheses');
      ops.pop(); // remove '('
    } else {
      throw new Error('Unknown token ' + token);
    }
  });

  while (ops.length) {
    const op = ops.pop();
    if (op === '(' || op === ')') throw new Error('Mismatched parentheses');
    output.push(op);
  }

  // avaliar RPN
  const stack = [];
  output.forEach(tok => {
    if (!isNaN(tok)) {
      stack.push(Number(tok));
    } else {
      const b = stack.pop();
      const a = stack.pop();
      if (a === undefined || b === undefined) throw new Error('Invalid expression');
      let res;
      switch(tok) {
        case '+': res = a + b; break;
        case '-': res = a - b; break;
        case '*': res = a * b; break;
        case '/': 
          if (b === 0) throw new Error('Division by zero');
          res = a / b; 
          break;
      }
      stack.push(res);
    }
  });

  if (stack.length !== 1) throw new Error('Invalid expression');
  return stack[0];
} 
