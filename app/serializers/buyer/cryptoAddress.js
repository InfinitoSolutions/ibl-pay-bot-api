module.exports = async (req, address, options) => {
  if (typeof address === 'undefined' || !address) {
    return null;
  }

  return {
    id: address._id,
    currency: address.currency,
    address: address.address
  };
};
