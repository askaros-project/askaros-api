import axios from 'axios'
import queryString from 'query-string'

export default {
	verify(token) {
		return axios
			.post(
				'https://www.google.com/recaptcha/api/siteverify',
				queryString.stringify({
					secret: process.env.CAPTCHA_KEY,
					response: token
				}),
				{
					headers: {
						'Content-Type': 'application/x-www-form-urlencoded'
					}
				}
			)
			.then(resp => {
				if (resp.data['error-codes']) {
					/***/ console.info('Captcha errors', resp.data['error-codes'])
				}
				return resp.data.success
			})
	}
}
