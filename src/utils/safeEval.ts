/**
 * CassKai - Safe Formula Evaluation
 * Remplacement sécurisé de eval() pour les calculs de formules
 */
import { parse, type MathNode } from 'mathjs';
import { logger } from '@/lib/logger';

function ensureNoAssignments(ast: MathNode): void {
  ast.traverse((node: MathNode) => {
    if (node.type === 'AssignmentNode' || node.type === 'FunctionAssignmentNode') {
      throw new Error('Assignments are not allowed');
    }
  });
}
/**
 * Évalue une formule mathématique de manière sécurisée
 * @param formula - Formule à évaluer (ex: "total_revenue - total_expenses")
 * @param variables - Variables disponibles (ex: {total_revenue: 10000, total_expenses: 7000})
 * @returns Résultat du calcul
 */
export function safeEval(formula: string, variables: Record<string, number>): number {
  try {
    // Nettoyer la formule (enlever = au début si présent)
    const cleanFormula = formula.trim().replace(/^=/, '');
    // Parser et évaluer
    const ast = parse(cleanFormula);
    ensureNoAssignments(ast);
    const result = ast.compile().evaluate(variables);
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
    const ast = parse(condition);
    ensureNoAssignments(ast);
    const result = ast.compile().evaluate(variables);
    return Boolean(result);
  } catch (error) {
    logger.error('SafeEval', 'Error evaluating condition:', condition, error);
    return true; // En cas d'erreur, on considère la condition comme vraie
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
    const ast = parse(cleanFormula);
    ensureNoAssignments(ast);
    return true;
  } catch {
    return false;
  }
}