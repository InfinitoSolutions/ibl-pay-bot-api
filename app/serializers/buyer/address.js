module.exports = async (req, address, options) => {
  if (typeof address === 'undefined' || !address) {
    return null;
  }

  return {
    id: address._id,
    address_line1: address.address_line1,
    address_line2: address.address_line2,
    city: address.city,
    state: address.state,
    postal_code: address.postal_code,
    country: address.country
  };
};
