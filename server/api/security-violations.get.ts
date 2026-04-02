// server/api/security-violations.get.ts
import { getSecurityViolations } from "../utils/security-logger";

export default defineEventHandler(async (event) => {
  try {
    const violations = await getSecurityViolations(100);
    
    return {
      success: true,
      violations: violations,
      total: violations.length
    };
  } catch (error) {
    console.error('Erro ao buscar violações de segurança:', error);
    throw createError({
      statusCode: 500,
      message: "Erro ao buscar violações de segurança",
    });
  }
});

