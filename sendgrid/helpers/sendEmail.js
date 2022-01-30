const sgMail = require("@sendgrid/mail");
require("dotenv").config();

const {SENDGRID_API_KEY} = process.env;

sgMail.setApiKey(SENDGRID_API_KEY);

/* типичная структура письма
data = {
    to: "dmitriysalii@gmail.com",
    subject: "Новая заявка с сайта",
    html: "<p>Ваша заявка принята</p>"
}
*/

const sendEmail = async(data)=> {
    // eslint-disable-next-line no-useless-catch
    try {
        const email = {...data, from: "dmitriysalii@gmail.com"}
        await sgMail.send(email);
        return true;
    } catch (error) {
        throw error;
    }
}

module.exports = sendEmail;