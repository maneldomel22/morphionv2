export const formatPhoneNumber = (value) => {
  let digitsOnly = value.replace(/\D/g, '');

  if (digitsOnly.startsWith('55')) {
    digitsOnly = digitsOnly.slice(2);
  }

  if (digitsOnly.length === 0) return '';

  let formatted = '+55 ';

  if (digitsOnly.length <= 2) {
    formatted += digitsOnly;
  } else if (digitsOnly.length <= 3) {
    formatted += digitsOnly.slice(0, 2) + ' ' + digitsOnly.slice(2);
  } else if (digitsOnly.length <= 7) {
    formatted += digitsOnly.slice(0, 2) + ' ' + digitsOnly.slice(2);
  } else if (digitsOnly.length <= 11) {
    formatted += digitsOnly.slice(0, 2) + ' ' + digitsOnly.slice(2, 3) + ' ' + digitsOnly.slice(3);
  } else {
    formatted += digitsOnly.slice(0, 2) + ' ' + digitsOnly.slice(2, 3) + ' ' + digitsOnly.slice(3, 11);
  }

  return formatted;
};

export const unformatPhoneNumber = (value) => {
  return '+55' + value.replace(/\D/g, '');
};
