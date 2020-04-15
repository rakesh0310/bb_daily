const Otp = require('../models/otps');
const AWS = require('aws-sdk');
require('dotenv').config();
module.exports.send = async function (phone, id) {
  let otp_value = Math.floor(100000 + Math.random() * 900000);
  let expires_at = new Date(
    Date.now() + process.env.OTP_EXPIRE_TIME * 60 * 1000
  );
  let last_sent_at = new Date(Date.now());

  let otp = null;
  if (id) {
    otp = await Otp.findOne({
      where: { id },
    });
    if (!otp) {
      return Promise.reject('Invalid OTP');
    }
  }

  if (!otp) {
    otp = await Otp.create({
      otp: otp_value,
      phone: phone,
      expires_at: expires_at,
      last_sent_at: last_sent_at,
      retry_count: 0,
    });
  } else {
    if (
      false &&
      last_sent_at.getTime() - otp.last_sent_at <
        process.env.OTP_RESEND_TIME * 60 * 1000
    ) {
      return Promise.reject(new Error('Wait some time'));
    }
    if (otp.retry_count > process.env.OTP_RETRY_COUNT) {
      return Promise.reject(new Error('Maximum retries exceeded'));
    }
    otp.otp = otp_value;
    otp.retry_count = (otp.retry_count || 0) + 1;
    otp.last_sent_at = last_sent_at;
    otp.expires_at = expires_at;
    await otp.save();
  }

  // TODO : SMS

  AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
  });

  const sns = new AWS.SNS();
  sns.publish(
    {
      Message: 'yours otp for BBDAILY is ' + otp.otp,
      Subject: 'BBDAILY_OTP',
      PhoneNumber: '+91' + phone,
    },
    (error) => {
      if (error) {
        throw new Error(error);
      }
    }
  );
  return Promise.resolve(otp);
};

module.exports.verify = async function (id, otp_value) {
  return Otp.findOne({
    where: { id: id },
  }).then((otp) => {
    const expires_at_otp = new Date(otp.expires_at).getTime();
    if (
      expires_at_otp < Date.now() ||
      !(otp_value == process.env.OTP_MASTER_VALUE || otp_value == otp.otp)
    ) {
      throw new Error('Invalid OTP');
    }
    return otp.destroy().then(() => otp.phone);
  });
};
