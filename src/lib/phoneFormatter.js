export const formatPhoneNumber = (value) => {
  let digitsOnly = value.replace(/\D/g, '');

  if (digitsOnly.startsWith('55')) {
    digitsOnly = digitsOnly.slice(2);
  }

  if (digitsOnly.length === 0) return '';

  let formatted = '+55 ';

  if (digitsOnly.length <= 2) {
    formatted += '(' + digitsOnly;
  } else if (digitsOnly.length <= 6) {
    formatted += '(' + digitsOnly.slice(0, 2) + ') ' + digitsOnly.slice(2);
  } else if (digitsOnly.length <= 10) {
    formatted += '(' + digitsOnly.slice(0, 2) + ') ' + digitsOnly.slice(2, 6) + '-' + digitsOnly.slice(6);
  } else {
    formatted += '(' + digitsOnly.slice(0, 2) + ') ' + digitsOnly.slice(2, 7) + '-' + digitsOnly.slice(7, 11);
  }

  return formatted;
};

export const unformatPhoneNumber = (value) => {
  return '+55' + value.replace(/\D/g, '');
};
