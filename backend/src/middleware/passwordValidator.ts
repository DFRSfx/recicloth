// Validador de senha forte
export interface PasswordValidation {
  isValid: boolean;
  errors: string[];
  strength: number;
}

export const validateStrongPassword = (password: string): PasswordValidation => {
  const errors: string[] = [];

  // Mínimo 8 caracteres
  if (password.length < 8) {
    errors.push('A senha deve ter no mínimo 8 caracteres');
  }

  // Máximo 128 caracteres (prevenção de DoS)
  if (password.length > 128) {
    errors.push('A senha deve ter no máximo 128 caracteres');
  }

  // Pelo menos uma letra maiúscula
  if (!/[A-Z]/.test(password)) {
    errors.push('A senha deve conter pelo menos uma letra maiúscula');
  }

  // Pelo menos uma letra minúscula
  if (!/[a-z]/.test(password)) {
    errors.push('A senha deve conter pelo menos uma letra minúscula');
  }

  // Pelo menos um número
  if (!/\d/.test(password)) {
    errors.push('A senha deve conter pelo menos um número');
  }

  // Pelo menos um caractere especial
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('A senha deve conter pelo menos um caractere especial (!@#$%^&*()_+-=[]{};\':"|,.<>/?)');
  }

  const strength = calculatePasswordStrength(password);

  return {
    isValid: errors.length === 0,
    errors,
    strength
  };
};

// Função para calcular força da senha (0-100)
export const calculatePasswordStrength = (password: string): number => {
  let strength = 0;

  // Comprimento
  if (password.length >= 8) strength += 20;
  if (password.length >= 12) strength += 10;
  if (password.length >= 16) strength += 10;

  // Complexidade
  if (/[a-z]/.test(password)) strength += 15;
  if (/[A-Z]/.test(password)) strength += 15;
  if (/\d/.test(password)) strength += 15;
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) strength += 15;

  return Math.min(strength, 100);
};

// Middleware para validação de senha
import { Request, Response, NextFunction } from 'express';

export const validatePasswordMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const { newPassword, confirmPassword, password } = req.body;
  
  const passwordToValidate = newPassword || password;

  // Verificar se a senha foi fornecida
  if (!passwordToValidate) {
    return res.status(400).json({
      success: false,
      message: 'Senha é obrigatória'
    });
  }

  // Se houver confirmação, verificar se coincidem
  if (confirmPassword !== undefined && passwordToValidate !== confirmPassword) {
    return res.status(400).json({
      success: false,
      message: 'As senhas não coincidem'
    });
  }

  // Validar força da senha
  const validation = validateStrongPassword(passwordToValidate);

  if (!validation.isValid) {
    return res.status(400).json({
      success: false,
      message: 'A senha não atende aos requisitos de segurança',
      errors: validation.errors
    });
  }

  next();
};
