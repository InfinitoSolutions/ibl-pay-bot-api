module.exports = merchant => {
  let address = merchant.temporary_address;
  if (typeof address !== 'undefined' && address) {
    const line1 = address.address_line1 ? address.address_line1 : '';
    const line2 = address.address_line2 ? `, ${address.address_line2}` : '';
    const city = address.city ? `, ${address.city}` : '';
    const state = address.state ? `, ${address.state}` : '';
    const country = address.country ? `, ${address.country}` : '';
    const postalCode = address.postal_code ? ` - ${address.postal_code}` : '';
    address = `${line1} ${line2} ${city} ${state} ${country} ${postalCode}`;
  } else {
    address = '';
  }

  let availableBalance = 0;
  if (typeof merchant.wallet !== 'undefined' && merchant.wallet) {
    let debit =
      typeof merchant.wallet.debit !== 'undefined' && merchant.wallet.debit
        ? merchant.wallet.debit
        : 0;
    availableBalance = merchant.wallet.balance - debit;
  }

  return [
    merchant._id,
    `${merchant.first_name} ${merchant.last_name}`,
    `"${address}"`,
    merchant.industry,
    merchant.activated_at,
    merchant.status,
    typeof merchant.crypto_currency !== 'undefined'
      ? merchant.crypto_currency.currency
      : '',
    availableBalance,
    merchant.on_hold
  ];
};
