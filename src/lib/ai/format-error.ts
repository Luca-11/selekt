/** Message lisible pour l'admin quand l'IA échoue */
export function formatAiErrorMessage(raw: string): string {
  if (/429|quota|exceeded|insufficient_quota/i.test(raw)) {
    return "Quota OpenAI dépassé — recharge les crédits sur platform.openai.com. Le brouillon meta reste utilisable.";
  }
  if (/401|invalid.*api.*key|authentication/i.test(raw)) {
    return "Clé API invalide — vérifie OPENAI_API_KEY ou ANTHROPIC_API_KEY dans .env.local.";
  }
  if (/404|model.*not found/i.test(raw)) {
    return "Modèle IA introuvable — vérifie OPENAI_MODEL ou ANTHROPIC_MODEL.";
  }
  if (raw.length > 120) {
    return `${raw.slice(0, 120)}…`;
  }
  return raw;
}
