export const normalizeCpf = (value: string) => value.replace(/\D/g, '');

export const isValidCpf = (value: string) => {
  const cpf = normalizeCpf(value);
  if (cpf.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cpf)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i += 1) {
    sum += Number(cpf[i]) * (10 - i);
  }
  const firstDigit = sum % 11 < 2 ? 0 : 11 - (sum % 11);

  sum = 0;
  for (let i = 0; i < 10; i += 1) {
    sum += Number(cpf[i]) * (11 - i);
  }
  const secondDigit = sum % 11 < 2 ? 0 : 11 - (sum % 11);

  return cpf[9] === String(firstDigit) && cpf[10] === String(secondDigit);
};
