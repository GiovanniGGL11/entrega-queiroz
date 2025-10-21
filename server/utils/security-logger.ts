// server/utils/security-logger.ts
import { getDB } from "./db";

export interface SecurityViolation {
  type: 'price_manipulation' | 'subtotal_manipulation' | 'total_manipulation' | 'product_not_found';
  timestamp: Date;
  ip?: string;
  userAgent?: string;
  customerInfo?: {
    name: string;
    phone: string;
    email: string;
  };
  violation: {
    productId?: string;
    productName?: string;
    realPrice?: number;
    sentPrice?: number;
    realSubtotal?: number;
    sentSubtotal?: number;
    realTotal?: number;
    sentTotal?: number;
    quantity?: number;
  };
  requestData?: any;
}

export async function logSecurityViolation(violation: SecurityViolation) {
  try {
    const db = await getDB();
    const securityLogs = db.collection("security_violations");
    
    await securityLogs.insertOne({
      ...violation,
      timestamp: new Date(),
      severity: 'HIGH'
    });
    
    console.warn('🚨 SECURITY VIOLATION DETECTED:', {
      type: violation.type,
      timestamp: violation.timestamp,
      customer: violation.customerInfo?.name,
      violation: violation.violation
    });
  } catch (error) {
    console.error('Erro ao registrar violação de segurança:', error);
  }
}

export async function getSecurityViolations(limit = 100) {
  try {
    const db = await getDB();
    const securityLogs = db.collection("security_violations");
    
    return await securityLogs
      .find({})
      .sort({ timestamp: -1 })
      .limit(limit)
      .toArray();
  } catch (error) {
    console.error('Erro ao buscar violações de segurança:', error);
    return [];
  }
}
