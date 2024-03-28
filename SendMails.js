var nodemailer = require('nodemailer');



class SendMails{

	 send_email(email,subject,message){

var transporter = nodemailer.createTransport({
  host: 'smtp.hostinger.com',
  secure : true,
  port : 465,

  auth: {
    user: 'tyson@edeldigital.co.ke',
    pass: 'Password@2022'
  }
});

var mailOptions = {
  from: 'tyson@edeldigital.co.ke',
  to: email,
  subject: subject,
  html: message
};

transporter.sendMail(mailOptions, function(error, info){
  if (error) {
    console.log(error);
  } else {
    console.log('Email sent: ' + info.response);
  }
});

	 }

}


const mailer = new SendMails()


module.exports = mailer


