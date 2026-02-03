/**
 * CassKai - Safe Formula Evaluation
 * Parser mathématique sécurisé SANS expr-eval
 * Supporte: +, -, *, /, (, ), variables, nombres
 */
import { logger } from '@/lib/logger';

/**
 * Tokenize une formule en tokens
 */
function tokenize(formula: string): string[] {
  const tokens: string[] = [];
  let current = '';
  
  for (let i = 0; i < formula.length; i++) {
    const char = formula[i];
    
    if (/\s/.test(char)) {
      if (current) tokens.push(current);
      current = '';
    } else if (/[+\-*/()=]/.test(char)) {
      if (current) tokens.push(current);
      tokens.push(char);
      current = '';
    } else {
      current += char;
    }
  }
  
  if (current) tokens.push(current);
  return tokens.filter(t => t !== '=');
}

/**
 * Parse et évalue une expression mathématique sécurisée
 */
function evaluateExpression(tokens: string[], variables: Record<string, number>): number {
  return parseAddition(tokens, 0, variables)[0];
}

function parseAddition(tokens: string[], pos: number, vars: Record<string, number>): [number, number] {
  let [result, newPos] = parseSubtraction(tokens, pos, vars);
  
  while (newPos < tokens.length && tokens[newPos] === '+') {
    [result, newPos] = parseSubtraction(tokens, newPos + 1, vars);
    // Accumulate addition
    const prev = result;
    const [next, nextPos] = parseSubtraction(tokens, newPos, vars);
    result = prev + next;
    newPos = nextPos;
  }
  
  return [result, newPos];
}

function parseSubtraction(tokens: string[], pos: number, vars: Record<string, number>): [number, number] {
  let [result, newPos] = parseMultiplication(tokens, pos, vars);
  
  while (newPos < tokens.length && tokens[newPos] === '-' && tokens[newPos - 1] !== '(') {
    const [next, nextPos] = parseMultiplication(tokens, newPos + 1, vars);
    result = result - next;
    newPos = nextPos;
  }
  
  return [result, newPos];
}

function parseMultiplication(tokens: string[], pos: number, vars: Record<string, number>): [number, number] {
  let [result, newPos] = parseDivision(tokens, pos, vars);
  
  while (newPos < tokens.length && (tokens[newPos] === '*' || tokens[newPos] === '/')) {
    const op = tokens[newPos];
    const [next, nextPos] = parseDivision(tokens, newPos + 1, vars);
    result = op === '*' ? result * next : result / next;
    newPos = nextPos;
  }
  
  return [result, newPos];
}

function parseDivision(tokens: string[], pos: number, vars: Record<string, number>): [number, number] {
  return parsePrimary(tokens, pos, vars);
}

function parsePrimary(tokens: string[], pos: number, vars: Record<string, number>): [number, number] {
  if (pos >= tokens.length) return [0, pos];
  
  const token = tokens[pos];
  
  // Parenthèses
  if (token === '(') {
    const [result, newPos] = parseAddition(tokens, pos + 1, vars);
    if (tokens[newPos] === ')') {
      return [result, newPos + 1];
    }
    return [result, newPos];
  }
  
  // Nombre
  if (/^-?\d+(\.\d+)?$/.test(token)) {
    return [Number(token), pos + 1];
  }
  
  // Variable
  if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(token)) {
    const value = vars[token];
    if (typeof value === 'number') {
      return [value, pos + 1];
    }
    logger.warn('SafeEval', `Variable non trouvée: ${token}`);
    return [0, pos + 1];
  }
  
  return [0, pos + 1];
}

/**
 * Évalue une formule mathématique de manière sécurisée
 * @param formula - Formule à évaluer (ex: "total_revenue - total_expenses")
 * @param variables - Variables disponibles (ex: {total_revenue: 10000, total_expenses: 7000})
 * @returns Résultat du calcul
 */
export function safeEval(formula: string, variables: Record<string, number>): number {
  try {
    const cleanFormula = formula.trim().replace(/^=/, '');
    const tokens = tokenize(cleanFormula);
    const result = evaluateExpression(tokens, variables);
    return Number(result) || 0;
  } catch (error) {
    logger.error('SafeEval', 'Error evaluating formula:', formula, error);
    return 0;
  }
}

/**
 * Évalue une condition booléenne de manière sécurisée
 * @param condition - Condition à évaluer (ex: "total_assets > 0")
 * @param variables - Variables disponibles
 * @returns true si condition vraie, false sinon
 */
export function safeEvalCondition(condition: string, variables: Record<string, any>): boolean {
  try {
    // Simple comparaisons seulement
    const match = condition.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*(>|<|>=|<=|===|==|!=)\s*(-?\d+(?:\.\d+)?)$/);
    if (!match) return true;
    
    const [, varName, op, valueStr] = match;
    const varValue = variables[varName];
    const value = Number(valueStr);
    
    switch (op) {
      case '>': return varValue > value;
      case '<': return varValue < value;
      case '>=': return varValue >= value;
      case '<=': return varValue <= value;
      case '===':
      case '==': return varValue === value;
      case '!=': return varValue !== value;
      default: return true;
    }
  } catch (error) {
    logger.error('SafeEval', 'Error evaluating condition:', condition, error);
    return true;
  }
}

/**
 * Valide qu'une formule est syntaxiquement correcte
 * @param formula - Formule à valider
 * @returns true si valide, false sinon
 */
export function validateFormula(formula: string): boolean {
  try {
    const cleanFormula = formula.trim().replace(/^=/, '');
    const tokens = tokenize(cleanFormula);
    evaluateExpression(tokens, {});
    return true;
  } catch {
    return false;
  }
}