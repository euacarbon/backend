const Joi = require('joi');

const sendXRPValidation = (data) => {
  const schema = Joi.object({
    toAddress: Joi.string().required(),
    amount: Joi.number().positive().required(),
  });
  return schema.validate(data);
};

module.exports = {
  sendXRPValidation,
};
